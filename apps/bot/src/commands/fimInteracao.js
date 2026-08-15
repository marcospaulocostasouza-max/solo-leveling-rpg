const MessageService = require("../core/messageService");

/**
 * COMANDO: !fim de interação <nome do npc>
 * (aceita também sem acento: !fim de interacao <nome do npc>)
 *
 * Usado pelo PRÓPRIO JOGADOR ao terminar uma cena com um NPC.
 *
 * O que este comando faz:
 * 1. Localiza o NPC e o histórico recente da conversa entre o
 *    jogador e o NPC.
 * 2. Pede para a IA (relationshipEngine) avaliar a cena e decidir
 *    quanto o VÍNCULO e/ou a HOSTILIDADE mudaram.
 * 3. Aplica o resultado permanentemente (relationshipManager).
 * 4. Responde ao jogador:
 *    - Se o vínculo aumentou: "Parabéns, seu vínculo com <NPC>
 *      aumentou em <quantidade>%"
 *    - Se a hostilidade aumentou: mensagem equivalente de hostilidade.
 *    - Se nada mudou (cena vazia/superficial): avisa que o NPC não
 *      criou nenhum sentimento e sugere se aproximar mais.
 * 5. Se o vínculo cruzar 10% pela primeira vez, avisa que o NPC
 *    passará a tratar o jogador de forma diferente e libera a
 *    missão inicial daquele NPC (integração com o sistema de
 *    missões — ver observação no final do arquivo).
 * 6. Limpa o histórico da cena, já que ela foi "fechada" e avaliada.
 */

const db = require("../core/database");
const templates = require("../utils/templatesMensagens");
const npcManager = require("../npc/npcManager");
const conversationManager = require("../npc/conversationManager");
const memoryManager = require("../npc/memoryManager");
const relationshipManager = require("../npc/relationshipManager");
const relationshipEngine = require("../ia/relationshipEngine");
const QuestSystem = require("../systems/questSystem");
const interactionManager = require("../npc/interactionManager");

function extrairNomeNPC(bodyOriginal) {
    // Remove o prefixo do comando (com ou sem acento) preservando o
    // resto do texto como foi digitado, para facilitar a busca do NPC.
    return bodyOriginal
        .replace(/^!fim de intera[çc][aã]o/i, "")
        .trim();
}

async function buscarJogadorPorNumero(numero) {
    return new Promise((resolve) => {
        db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], (err, row) => {
            if (err) {
                console.error("[FIM_INTERACAO] Erro ao buscar jogador:", err.message);
                resolve(null);
            } else {
                resolve(row || null);
            }
        });
    });
}

module.exports = async (msg) => {
    try {
        const numeroJogador = msg.author || msg.from;
        const nomeNPC = extrairNomeNPC(msg.body || "");

        const jogador = await buscarJogadorPorNumero(numeroJogador);
        if (!jogador) {
            return MessageService.send({ message: msg, text: templates.jogadorNaoEncontrado() });
        }

        const jogadorId = jogador.numero;
        const cenaAtiva = await interactionManager.obterCenaDoJogador(jogadorId);
        let npc = nomeNPC
            ? (npcManager.carregarNPC(nomeNPC.toLowerCase()) || npcManager.buscarPorNome(nomeNPC))
            : (cenaAtiva ? npcManager.carregarNPC(cenaAtiva.npcId) : null);

        if (!npc) {
            return MessageService.send({
                message: msg,
                text: nomeNPC
                    ? templates.erro(`NPC "${nomeNPC}" não encontrado.`)
                    : templates.erro("Você não possui nenhuma interação ativa para encerrar.")
            });
        }

        if (cenaAtiva && cenaAtiva.npcId !== npc.id) {
            const npcAtivo = npcManager.carregarNPC(cenaAtiva.npcId);
            return MessageService.send({
                message: msg,
                text: templates.erro(`Sua cena ativa é com ${npcAtivo?.nome || cenaAtiva.npcId}. Use apenas *!fim de interação* ou informe esse NPC.`)
            });
        }

        const npcId = npc.id;

        const encerramentoPermitido = await interactionManager.podeEncerrarCena(npcId, jogadorId);
        if (!encerramentoPermitido.permitido) {
            return MessageService.send({
                message: msg,
                text: templates.erro(`${npc.nome} está em cena com outro jogador; você não pode encerrar essa interação.`)
            });
        }

        const historico = conversationManager.obterHistorico(jogadorId, npcId);

        if (!historico || historico.length === 0) {
            if (cenaAtiva && cenaAtiva.npcId === npcId) {
                const encerramento = await interactionManager.encerrarCena(npcId, jogadorId);
                return MessageService.send({
                    message: msg,
                    text: `${templates.titulo("FIM DE INTERAÇÃO")}
${templates.divisor()}
A cena ativa com *${npc.nome}* foi encerrada e você já pode conversar com outro NPC.
_O histórico narrativo não estava mais disponível, então vínculo e hostilidade não foram alterados._
_${npc.nome} estará disponível novamente em ${encerramento.cooldownHoras}h._`
                });
            }
            return MessageService.send({
                message: msg,
                text: `${templates.titulo("NENHUMA CENA ENCONTRADA")}
${templates.divisor()}
Não encontrei nenhuma interação recente entre você e *${npc.nome}* para avaliar.
_Converse com o NPC antes de usar este comando._`
            });
        }

        const relacionamentoAtual = await relationshipManager.obterOuCriar(npcId, jogadorId);
        const memorias = await memoryManager.buscarMemoriasImportantes(npcId, jogadorId, 6);

        const analise = await relationshipEngine.analisarConversa(npc, jogador, historico, memorias, relacionamentoAtual);

        if (!analise) {
            return MessageService.send({
                message: msg,
                text: templates.erro("Não foi possível avaliar a interação agora. Tente novamente em instantes.")
            });
        }

        // Cena vazia/superficial: não gerou nenhum sentimento real.
        if (!analise.interacaoSignificativa || (analise.deltaVinculo === 0 && analise.deltaHostilidade === 0)) {
            conversationManager.limparHistorico(jogadorId, npcId);
            await interactionManager.encerrarCena(npcId, jogadorId);
            return MessageService.send({
                message: msg,
                text: `${templates.titulo("NENHUM SENTIMENTO CRIADO")}
${templates.divisor()}
Poxa, *${npc.nome}* não criou nenhum tipo de sentimento em relação a você nessa interação.
_Se aproxima mais dele! Construa uma cena de verdade — não basta uma troca rápida de palavras._`
            });
        }

        const resultado = await relationshipManager.aplicarResultadoDeCena(
            npcId,
            jogadorId,
            analise.deltaVinculo,
            analise.deltaHostilidade
        );

        if (!resultado) {
            return MessageService.send({
                message: msg,
                text: templates.erro("Erro ao salvar a evolução do relacionamento.")
            });
        }

        // Sincroniza todos os marcos já alcançados (10% simples e 25% arcos).
        // Isso também cobre jogadores que cruzaram mais de um marco na mesma cena.
        await QuestSystem.sincronizarMissoesPorVinculo(jogador.id);

        // A avaliação já produz um motivo curto e baseado na cena real.
        // Guardá-lo evita inventar lembranças novas ao consultar !amizade.
        await new Promise((resolve) => db.run(
            "CREATE TABLE IF NOT EXISTS npc_resumos_cena (npc_id TEXT NOT NULL, jogador_id TEXT NOT NULL, resumo TEXT NOT NULL, atualizado_em TEXT NOT NULL, PRIMARY KEY (npc_id, jogador_id))",
            () => resolve()
        ));
        await new Promise((resolve) => db.run(
            `INSERT INTO npc_resumos_cena (npc_id, jogador_id, resumo, atualizado_em)
             VALUES (?, ?, ?, datetime('now'))
             ON CONFLICT(npc_id, jogador_id) DO UPDATE
             SET resumo = excluded.resumo, atualizado_em = excluded.atualizado_em`,
            [npcId, jogadorId, String(analise.motivo || "Cena encerrada sem resumo disponível.").slice(0, 500)],
            () => resolve()
        ));

        conversationManager.limparHistorico(jogadorId, npcId);
        const encerramento = await interactionManager.encerrarCena(npcId, jogadorId);

        let mensagem = `${templates.titulo("FIM DE INTERAÇÃO")}
${templates.divisor()}
*NPC:* ${npc.nome}
${templates.divisor()}`;

        if (resultado.vinculoGanho > 0) {
            mensagem += `\n${templates.sucesso(`Parabéns, seu vínculo com ${npc.nome} aumentou em ${resultado.vinculoGanho}%!`)}`;
            mensagem += `\n> Vínculo: ${resultado.vinculoAntes}% ➜ *${resultado.vinculoDepois}%*`;
        } else if (resultado.vinculoGanho < 0) {
            mensagem += `\n${templates.aviso(`Seu vínculo com ${npc.nome} diminuiu em ${Math.abs(resultado.vinculoGanho)}%.`)}`;
            mensagem += `\n> Vínculo: ${resultado.vinculoAntes}% ➜ *${resultado.vinculoDepois}%*`;
        }

        if (resultado.hostilidadeGanho > 0) {
            mensagem += `\n${templates.aviso(`A hostilidade de ${npc.nome} em relação a você aumentou em ${resultado.hostilidadeGanho}%.`)}`;
            mensagem += `\n> Hostilidade: ${resultado.hostilidadeAntes}% ➜ *${resultado.hostilidadeDepois}%*`;
        } else if (resultado.hostilidadeGanho < 0) {
            mensagem += `\n${templates.sucesso(`A hostilidade de ${npc.nome} em relação a você diminuiu em ${Math.abs(resultado.hostilidadeGanho)}%.`)}`;
            mensagem += `\n> Hostilidade: ${resultado.hostilidadeAntes}% ➜ *${resultado.hostilidadeDepois}%*`;
        }

        mensagem += `\n${templates.divisor()}`;
        mensagem += `\n_${analise.motivo}_`;
        if (encerramento.permitido) {
            mensagem += `\n\n_${npc.nome} estará disponível para uma nova cena em ${encerramento.cooldownHoras}h._`;
        }

        if (resultado.cruzouLimiarInicial) {
            await relationshipManager.marcarMissaoDesbloqueada(npcId, jogadorId);
            mensagem += `\n${templates.divisor()}`;
            mensagem += `\n${templates.destaque(`${npc.nome} não trata mais você com indiferença.`)}`;
            mensagem += `\n_Uma nova missão relacionada a ${npc.nome} pode estar disponível. Use !missao para conferir._`;
            // NOTA DE INTEGRAÇÃO: este comando apenas MARCA que o vínculo
            // cruzou o limiar de 10%. A liberação efetiva da missão de
            // capítulo 1 do NPC (em src/missions/data/<npc>.json ou no
            // sistema equivalente usado por !missao) precisa ser feita
            // pela integração descrita em docs/CLINE_PROMPTS.md (Bloco 2).
        }

        await MessageService.send({ message: msg, text: mensagem });
    } catch (erro) {
        console.error("[FIM_INTERACAO] Erro:", erro);
        return MessageService.send({
            message: msg,
            text: "*✖ Erro ao processar o fim da interação.*"
        });
    }
};
