const MessageService = require("../core/messageService");

/**
 * COMANDO: !regeneracao
 * Guia de Regeneração de Mana.
 */
module.exports = async (msg) => {
    await MessageService.send({ message: msg, text: `
*─ Regeneração de Mana 🥣 ─*

A regeneração de mana acontece através de pontos fixos e não pode ser feita com porcentagem. Itens comuns (misteriosos), únicos e runas (misteriosas ou únicas) regeneram mana de formas diferentes, baseadas em seus respectivos ranks.

══════════════════════════

*REGENERACAO DE MANA*

A regeneracao acontece por pontos fixos, nao por porcentagem.

*ITENS MISTERIOSOS (COMUNS)*
Rank E: 500 MP/T | D: 1.000 | C: 2.000
Rank B: 3.000 | A: 4.000 | S: 5.000

*ITENS UNICOS (MASMORRAS/CONSTRUIDOS)*
Rank E: 700 MP/T | D: 1.500 | C: 2.500
Rank B: 3.500 | A: 5.000 | S: 10.000

*RUNAS*
Mesmos valores dos itens misteriosos e unicos.
    ` });
};