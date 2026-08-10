const MessageService = require("../core/messageService");

/**
 * COMANDO: !membroa
 * Sistema de Membros da Associação de Caçadores.
 */
module.exports = async (msg) => {
    await MessageService.send({ message: msg, text: `
*MEMBROS DA ASSOCIACAO DE CACADORES*

Uma alternativa para quem nao quer entrar em guilda.

*REQUISITOS*
1. Rank D minimo
2. Sem antecedentes criminais
3. Sem vinculo com guildas
4. Passar em avaliacao da Associacao

*BENEFICIOS*
- Salario semanal em Wons
- Pontos de atributo por cargo
- Acesso a masmorras exclusivas
- Itens da associacao
- Missoes semanais

*DIGITE !CARGOSA PARA VER OS CARGOS*
    ` });
};