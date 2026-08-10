const MessageService = require("../core/messageService");

/**
 * COMANDO: !unicos
 * Sistema de Itens e Habilidades Únicas.
 */
module.exports = async (msg) => {
    await MessageService.send({ message: msg, text: `
*─ Únicos 🎴 ─*

No RPG, a administração incentiva a liberdade criativa dos jogadores. Para manter o equilíbrio e a singularidade de certas mecânicas, existem elementos exclusivos que concedem vantagens estratégicas e narrativas: Habilidades Únicas, Itens Únicos e Pedras Rúnicas.

══════════════════════════

*SISTEMA DE UNICOS*

*HABILIDADES UNICAS*
- Pertencem exclusivamente a um unico jogador
- Aprovadas pela administracao
- Ao morrer, viram Pedra Runica

*ITENS UNICOS*
- Existe apenas uma copia no RPG
- Podem ser perdidos em batalha (espoliacao)

*PEDRAS RUNICAS*
- Surgem do corpo de um jogador morto
- Contem uma Habilidade Unica
- Apenas uma pedra pode ser usada por vez
- Quebrar a pedra = absorver a habilidade

*COMO ADQUIRIR*
- Concluir Dungeon Instanciada (5 usos)
- Eventos narrados pela administracao
- Segue a classe e descricao da Dungeon
    ` });
};