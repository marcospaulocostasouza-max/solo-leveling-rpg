const MessageService = require("../core/messageService");

/*
 * COMANDO: !concluir Dungeon
 * 
 * Conclui a Dungeon Instanciada.
 * Reconhece a ficha de dungeon enviada, valida participantes,
 * verifica rank e participação semanal, e retorna premiações.
 */

const JogadorCore = require("../core/jogadorCore");
const DungeonInstanciadaSystem = require("../systems/dungeonInstanciadaSystem");

module.exports = async (msg) => {
    try {
        const numero = msg.author || msg.from;
        const texto = msg.body;
        
        // Buscar jogador
        const jogador = await JogadorCore.buscarPorNumero(numero);
        if (!jogador) {
            return MessageService.send({ message: msg, text: `
*═══ CONCLUIR DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Jogador não encontrado!*

Você ainda não possui uma ficha criada.
Use *!ficha* para criar seu personagem.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Verificar se o jogador tem chave
        const chave = await DungeonInstanciadaSystem.getChave(jogador.id);
        if (!chave) {
            return MessageService.send({ message: msg, text: `
*═══ CONCLUIR DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Você não possui uma Chave de Dungeon ativa.*

_Use *!Desejar* para tentar obter uma chave._
_Use *!ficha de Dungeon* para ver sua ficha._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // A ficha preenchida é reconhecida quando o jogador a envia e fica
        // temporariamente associada a ele até usar este comando.
        const fichasDungeonTemp = require("../utils/fichasDungeonTemp");
        const fichaSalva = fichasDungeonTemp[numero];
        const textoContemFicha = /ficha\s+de\s+dungeon|dungeon\s+instanciada/i.test(texto);

        if (!fichaSalva && !textoContemFicha) {
            return MessageService.send({ message: msg, text: `
*═══ CONCLUIR DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Ficha de Dungeon não recebida.*

Use *!ficha de Dungeon*, copie a ficha, informe os participantes e envie-a no grupo.
Depois use *!concluir Dungeon* para registrar a conclusão e entregar as recompensas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        const fichaReconhecida = fichaSalva || await DungeonInstanciadaSystem.reconhecerFichaDungeon(texto, jogador);
        
        if (fichaReconhecida.participantes.length === 0) {
            return MessageService.send({ message: msg, text: `
*═══ CONCLUIR DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Nenhum participante encontrado na ficha.*

Copie a ficha com *!ficha de Dungeon*, adicione os participantes e envie novamente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Concluir dungeon
        const resultado = await DungeonInstanciadaSystem.concluirDungeon(jogador, fichaReconhecida);

        if (resultado.erro) {
            let mensagemErro = `
*═══ CONCLUIR DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*${resultado.erro}*
`;

            if (resultado.validacoes && resultado.validacoes.length > 0) {
                mensagemErro += `
${resultado.validacoes.join("\n")}
`;
            }

            mensagemErro += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Corrija a ficha e tente novamente._`;

            return MessageService.send({ message: msg, text: mensagemErro });
        }

        delete fichasDungeonTemp[numero];

        // Aplicar premiação geral (XP + Wons) para todos os participantes
        const premGeral = await DungeonInstanciadaSystem.aplicarPremiacaoGeral(resultado.ficha.id);

        // Formatar mensagem de sucesso
        const premios = resultado.premios;
        const cristaisEntregues = (premGeral.cristais || []).find(item => item.quantidade > 0)?.quantidade || 0;
        const participantes = resultado.participantes.map(p => p.nome).join(", ");
        
        let mensagem = `*═══ DUNGEON CONCLUÍDA! ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Dungeon:* ${resultado.ficha.dungeon_nome}
*Rank:* ${resultado.ficha.dungeon_rank}

*Participantes (${resultado.participantes.length}):*
${resultado.participantes.map((p, i) => `${i + 1}. ${p.nome}`).join("\n")}

*Premiação Geral (todos os participantes):*
> XP: ${premios.xp}
> Wons: ${premios.won}
${cristaisEntregues > 0 ? `> 💎 Cristais: ${cristaisEntregues}` : ""}
${premios.atributos > 0 ? `> Atributos: ${premios.atributos}` : ""}
${premios.maestria > 0 ? `> Maestria: ${premios.maestria}` : ""}

*Chave de Dungeon:*
> Usos restantes: ${resultado.usosRestantes}/${chave.usos_total}
${resultado.chaveEsgotada ? "> ⚠️ *Chave esgotada!*" : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Agora cada participante deve escolher um prêmio extra!*

_Use *!Escolho número X* para escolher. Cada player escolhe apenas uma opção._
_A escolha é vinculada ao participante registrado na Dungeon._`;

        await MessageService.send({ message: msg, text: mensagem });
        if (resultado.mineracao) {
            await MessageService.send({ message: msg, text: `${DungeonInstanciadaSystem.formatarMensagemMineracao(resultado.mineracao)}\n\n*XP recebido:* +${resultado.mineracao.xp}\n*Cristais recebidos:* +${resultado.mineracao.cristais || 0}\n*Minerações na semana:* ${resultado.mineracao.usadas}/2\n_O minerador já recebeu a recompensa na ficha e não participa da escolha de prêmio extra._` });
        }

        // Se a chave esgotou, enviar mensagem do ticket
        if (resultado.ticket && resultado.ticket.sucesso) {
            const TicketSystem = require("../systems/ticketSystem");
            const msgTicket = TicketSystem.formatarMensagemTicket(resultado.ticket);
            await MessageService.send({ message: msg, text: msgTicket });
        }

        // Uma lista compartilhada, independente de quem já escolheu.
        if (resultado.participantes.length) {
            const premiosMsg = await DungeonInstanciadaSystem.formatarPremiacoes(resultado.ficha.id, null);
            await MessageService.send({ message: msg, text: premiosMsg });
        }

    } catch (error) {
        console.error("Erro no comando !concluir Dungeon:", error);
        return MessageService.send({ message: msg, text: `
*═══ ERRO ═══*
_Ocorreu um erro ao concluir a dungeon._
_Tente novamente mais tarde._` });
    }
};
