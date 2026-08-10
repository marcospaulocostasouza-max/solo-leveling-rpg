const MessageService = require("../core/messageService");

/*
 * COMANDO: !mvp
 *
 * Exibe informações sobre o MVP da Arena e o ciclo atual.
 */

const ArenaSystem = require("../systems/arenaSystem");

module.exports = async (msg) => {
    const args = msg.body.toLowerCase().split(" ");
    const subcomando = args[1];

    if (!subcomando) {
        const mvp = await ArenaSystem.getMvpAtual();
        const cicloInicio = await ArenaSystem.getCicloInicio();

        if (!mvp) {
            return MessageService.send({ message: msg, text: `
*══ MVP DA ARENA*
────────────────────────══
Nenhum jogador disputou partidas de arena ainda.

*Comandos:*
> !mvp ranking - Ver ranking de candidatos ao MVP
> !mvp resetar - Reiniciar ciclo de MVP (ADM)
────────────────────────══
_Ciclo atual iniciado em: ${new Date(cicloInicio).toLocaleString()}_
            ` });
        }

        return MessageService.send({ message: msg, text: `
*══ MVP DA ARENA ATUAL*
────────────────────────══
*Nome:* ${mvp.nome}
*Rank:* ${mvp.rank}
*Vitórias:* ${mvp.arena_vitorias}
*Derrotas:* ${mvp.arena_derrotas}
*Batalhas:* ${mvp.arena_batalhas}
*Taxa de sucesso:* ${Number(mvp.taxa_sucesso * 100).toFixed(1)}%
*Oponentes diferentes vencidos:* ${mvp.oponentes_vencidos}

_Comando:_ !mvp ranking para ver os principais candidatos
_Ciclo atual iniciado em: ${new Date(cicloInicio).toLocaleString()}_
        ` });
    }

    if (subcomando === "ranking") {
        const candidatos = await ArenaSystem.getMvpCandidates(5);
        if (!candidatos || candidatos.length === 0) {
            return MessageService.send({ message: msg, text: `*═══ Nenhum jogador com batalhas de arena ainda. ═══*` });
        }

        let mensagem = `
*══ RANKING DO MVP DA ARENA*
────────────────────────══
`;
        candidatos.forEach((j, i) => {
            mensagem += `${i + 1}º *${j.nome}* [${j.rank}]
> Vitórias: ${j.arena_vitorias} | Derrotas: ${j.arena_derrotas} | Batalhas: ${j.arena_batalhas}
> Taxa de sucesso: ${Number(j.taxa_sucesso * 100).toFixed(1)}% | Oponentes diferentes: ${j.oponentes_vencidos}

`;
        });

        mensagem += `────────────────────────══
_══ Use !mvp para ver o líder atual._`;
        return MessageService.send({ message: msg, text: mensagem });
    }

    if (subcomando === "resetar") {
        const numero = msg.author || msg.from;
        const administrador = await new Promise((resolve) => {
            const db = require("../core/database");
            db.get("SELECT * FROM administradores WHERE numero = ?", [numero], (err, row) => {
                resolve(row);
            });
        });

        if (!administrador) {
            return MessageService.send({ message: msg, text: "*═══ Apenas administradores podem reiniciar o ciclo de MVP. ═══*" });
        }

        const novoInicio = await ArenaSystem.resetCiclo();
        return MessageService.send({ message: msg, text: `*═══ Ciclo de MVP reiniciado com sucesso! ═══*
Novo ciclo iniciado em: ${new Date(novoInicio).toLocaleString()}` });
    }

    return MessageService.send({ message: msg, text: `*═══ Subcomando inválido. ═══*
> !mvp
> !mvp ranking
> !mvp resetar` });
};
