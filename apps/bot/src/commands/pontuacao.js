const MessageService = require("../core/messageService");

/**
 * COMANDO: !pontuacao
 * Guia de Pontuação de Cenas.
 */
module.exports = async (msg) => {
    await MessageService.send({ message: msg, text: `
*─ Guia de Pontuação ─*

Este guia apresenta como você deve pontuar cenas em suas avaliações. A pontuação varia conforme o tipo de atividade (quest diária, one post, interação, treino conjunto, masmorras e abismo) e o rank do jogador, garantindo recompensas proporcionais ao esforço e nível de dificuldade.

══════════════════════════

*GUIA DE PONTUACAO*

*QUEST DIARIA*
Rank E: 100 XP | D: 1.000 | C: 3.500
Rank B: 5.000 | A: 7.500 | S: 10.000
Bonus: 3 pts, caixa misteriosa, 15.000 Won (+5.000 por rank)

*ONE POST*
E: 600 | D: 2.000 | C: 5.000 | B: 8.000 | A: 10.000 | S: 15.000

*INTERACAO*
E: 500 | D: 1.500 | C: 3.000 | B: 5.000 | A: 8.000 | S: 10.000

*TREINO CONJUNTO*
E: 600 | D: 2.000 | C: 5.000 | B: 8.000 | A: 10.000 | S: 15.000

*MASMORRAS*
E: 4.000 | D: 8.000 | C: 16.000 | B: 26.000 | A: 35.000 | S: 45.000

*ABISMO*
Piso 1-2: 500-2.000 | 3-4: 2.000-5.000 | 5-6: 5.000-13.000
7-8: 13.000-21.000 | 9: 21.000-30.000 | 10: 40.000
    ` });
};