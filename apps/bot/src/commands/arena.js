const MessageService = require("../core/messageService");

/**
 * COMANDO: !arena
 * 
 * Sistema de Arena para batalhas PvP entre jogadores.
 * Batalhas 1x1 sem envolvimento canônico com a história.
 */

const db = require("../core/database");

const premiosPorRank = {
    "E": { xp: 500, won: 20000, atributos: 5 },
    "D": { xp: 1000, won: 35000, atributos: 5 },
    "C": { xp: 2000, won: 50000, atributos: 5 },
    "B": { xp: 4000, won: 75000, atributos: 5 },
    "A": { xp: 8000, won: 100000, atributos: 5 },
    "S": { xp: 10000, won: 120000, atributos: 5 }
};

module.exports = async (msg) => {
    const args = msg.body.split(" ");
    const subcomando = args[1] ? args[1].toLowerCase() : "info";
    const numero = msg.author || msg.from;
    
    if (subcomando === "info") {
        const mensagem = `
*─ Arena ⚔️ ─*

A Arena é o local onde caçadores podem duelar entre si em batalhas 1x1 sem qualquer envolvimento canônico com a narrativa do seu personagem. O uso de itens, a quebra de equipamentos ou a perda de armas não afetam sua progressão real — mesmo que os perca durante a luta, eles permanecerão em seu inventário.

══════════════════════════

*SISTEMA DE ARENA*

Batalhas 1x1 sem envolvimento canonico.
Uso de itens nao afeta o inventario real.

*REGRAS*
1. Nao ha acoes ocultas na arena
2. Todos os combates comecam com cumprimento
3. Tempo maximo de resposta: 12h (ou 24h sem acordo)
4. Sem off ou inconveniencia nas arenas
5. Cada jogador pode participar de ate 3 batalhas a cada 2 semanas

*PREMIAÇÕES POR RANK*
Rank E: ${premiosPorRank.E.xp} XP | ${premiosPorRank.E.won.toLocaleString()} Won | ${premiosPorRank.E.atributos} pts
Rank D: ${premiosPorRank.D.xp} XP | ${premiosPorRank.D.won.toLocaleString()} Won | ${premiosPorRank.D.atributos} pts
Rank C: ${premiosPorRank.C.xp} XP | ${premiosPorRank.C.won.toLocaleString()} Won | ${premiosPorRank.C.atributos} pts
Rank B: ${premiosPorRank.B.xp} XP | ${premiosPorRank.B.won.toLocaleString()} Won | ${premiosPorRank.B.atributos} pts
Rank A: ${premiosPorRank.A.xp} XP | ${premiosPorRank.A.won.toLocaleString()} Won | ${premiosPorRank.A.atributos} pts
Rank S: ${premiosPorRank.S.xp} XP | ${premiosPorRank.S.won.toLocaleString()} Won | ${premiosPorRank.S.atributos} pts

*Vencedor recebe 2 premios, perdedor recebe 1*
        `;
        await MessageService.send({ message: msg, text: mensagem });
    } else if (subcomando === "desafiar") {
        const alvo = args.slice(2).join(" ");
        if (!alvo) return MessageService.send({ message: msg, text: "*✖ Use: !arena desafiar [nome]*" });
        
        db.get("SELECT nome FROM jogadores WHERE numero = ?", [numero], (err, jogador) => {
            if (!jogador) return MessageService.send({ message: msg, text: "*✖ Voce precisa ter uma ficha aprovada.*" });
            
            const mensagem = `
*DESAFIO DE ARENA!*

${jogador.nome} esta desafiando ${alvo} para uma batalha na arena!

*Participantes:*
@${jogador.nome} vs ${alvo}

*Para aceitar, o desafiado deve responder com:*
*!*arena aceitar ${jogador.nome}
            `;
            MessageService.send({ message: msg, text: mensagem });
        });
    } else {
        MessageService.send({ message: msg, text: "*COMANDOS DE ARENA*\n!arena info - Regras\n!arena desafiar [nome] - Desafiar alguem" });
    }
};