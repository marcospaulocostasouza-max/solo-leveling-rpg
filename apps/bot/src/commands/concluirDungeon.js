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

        // Reconhecer ficha de dungeon do texto enviado
        const fichaReconhecida = await DungeonInstanciadaSystem.reconhecerFichaDungeon(texto, jogador);
        
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

        // Aplicar premiação geral (XP + Wons) para todos os participantes
        const premGeral = await DungeonInstanciadaSystem.aplicarPremiacaoGeral(resultado.ficha.id);

        // Formatar mensagem de sucesso
        const premios = resultado.premios;
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
${premios.atributos > 0 ? `> Atributos: ${premios.atributos}` : ""}
${premios.maestria > 0 ? `> Maestria: ${premios.maestria}` : ""}

*Chave de Dungeon:*
> Usos restantes: ${resultado.usosRestantes}/${chave.usos_total}
${resultado.chaveEsgotada ? "> ⚠️ *Chave esgotada!*" : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Agora escolha seus prêmios extras!*

_Use *!Escolho a opção número X* para escolher._
_Apenas participantes da dungeon podem escolher._`;

        await MessageService.send({ message: msg, text: mensagem });

        // Se a chave esgotou, enviar mensagem do ticket
        if (resultado.ticket && resultado.ticket.sucesso) {
            const TicketSystem = require("../systems/ticketSystem");
            const msgTicket = TicketSystem.formatarMensagemTicket(resultado.ticket);
            await MessageService.send({ message: msg, text: msgTicket });
        }

        // Enviar lista de premiações para cada participante
        for (const participante of resultado.participantes) {
            const premiosMsg = await DungeonInstanciadaSystem.formatarPremiacoes(resultado.ficha.id, participante.id);
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
