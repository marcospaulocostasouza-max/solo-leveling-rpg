const MessageService = require("../core/messageService");

/**
 * COMANDO: !token
 * Sistema de Tokens para evoluir técnicas.
 */
module.exports = async (msg) => {
    await MessageService.send({ message: msg, text: `
*─ Sistema de Token 🪙 ─*

Neste sistema, as técnicas dos personagens podem ser aprimoradas por meio de Tokens, que são obtidos através de diversas atividades no RPG. Cada tipo de técnica possui um custo específico para ser evoluída, e o avanço é baseado apenas em dano, alcance, tempo de recarga e custo — não é possível adicionar novos efeitos.

══════════════════════════

*SISTEMA DE TOKEN*

*CUSTOS POR UP*
Tecnica Unica: 5 Tokens
Tecnica de Classe Base: 3 Tokens
Tecnica Avancada: 7 Tokens
5a Tecnica Avancada: 10 Tokens

*COMO CONSEGUIR*
- Dungeon Auto Narrada (premio)
- Arena: vencer 2x = 1 Token
- Quests Diarias: 6x = 1 Token
- Eventos: 1-10 Tokens
- Treinos Conjuntos: 3 = 1 Token
- Punição: 1 Token
- Hierarquia: +2 pontos = 1 Token

*LIMITE*
Maximo nivel 10 por tecnica
Sem transferencia de Tokens

*UPS POR NIVEL*
Alcance: +4m | Dano/Buff: +5% | CD: -1 turno/2 ups | Mana: -300/up
    ` });
};