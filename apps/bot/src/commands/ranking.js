const MessageService = require("../core/messageService");

/*
 * COMANDO: !ranking / !rank
 * 
 * Exibe o ranking dos jogadores por nível.
 */

const db = require("../core/database");

module.exports = async (msg) => {
    db.all("SELECT nome, nivel, rank, experiencia, won FROM jogadores WHERE ficha_aprovada = 1 ORDER BY nivel DESC, experiencia DESC LIMIT 10", [], async (err, jogadores) => {
        if (!jogadores || jogadores.length === 0) {
            return MessageService.send({ message: msg, text: "*═══ Nenhum jogador encontrado no ranking. ═══*" });
        }
        
        let mensagem = `
*═══ RANKING DE CAÇADORES ═══*
────────────────────────══
`;
        
        jogadores.forEach((j, i) => {
            const medalha = i === 0 ? "═" : i === 1 ? "═" : i === 2 ? "═" : `${i + 1}º`;
            mensagem += `${medalha} *${j.nome}* [${j.rank}]
> Nível ${j.nivel} | ${j.experiencia} XP | ═ ${j.won} Won
`;
        });
        
        mensagem += `\n────────────────────────══\n_═ Os caçadores mais fortes do sistema!_`;
        
        await MessageService.send({ message: msg, text: mensagem });
    });
};