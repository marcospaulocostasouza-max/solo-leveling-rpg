const MessageService = require("../core/messageService");
const db = require("../core/database");

/** Mostra os dois recursos econômicos do jogador em uma única consulta. */
module.exports = async (msg) => {
    try {
        const numero = msg.author || msg.from;
        const jogador = await new Promise((resolve, reject) => {
            db.get(
                "SELECT nome, won, maestria, nivel FROM jogadores WHERE numero = ?",
                [numero],
                (erro, linha) => erro ? reject(erro) : resolve(linha)
            );
        });

        if (!jogador) {
            return MessageService.send({
                message: msg,
                text: "[!] Não foi possível encontrar sua ficha. Use !ficha para criar seu personagem."
            });
        }

        return MessageService.send({
            message: msg,
            text: `
════════════════════════════════════
*SALDO*
════════════════════════════════════

› Jogador: *${jogador.nome}*
› Nível: *${jogador.nivel || 1}*

› Yulls: *${Number(jogador.won || 0).toLocaleString("pt-BR")}*
› Maestria: *${Number(jogador.maestria || 0).toLocaleString("pt-BR")}*

_A Maestria é recebida por atividades, eventos e outras recompensas do RPG._`.trim()
            });
    } catch (erro) {
        console.error("Erro no comando saldo:", erro);
        return MessageService.send({
            message: msg,
            text: "[!] Não foi possível consultar seu saldo agora. Tente novamente mais tarde."
        });
    }
};
