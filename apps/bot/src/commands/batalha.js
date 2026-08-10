const MessageService = require("../core/messageService");

module.exports = async (msg) => MessageService.send({ message: msg, text: [
    "════════════════════════════════════",
    "*CENA DE CONFRONTO*",
    "════════════════════════════════════",
    "",
    "Os confrontos do RPG são narrativos. O bot não inicia turnos automáticos, nem aplica ataques, fuga, dano, mana ou recompensas por este comando.",
    "",
    "› Use !fcombate Nome 1 | Nome 2 para gerar a ficha comparativa.",
    "› Use !faixa de atributos para consultar a escala dos atributos finais.",
    "› A mesa decide técnicas, condições, consequências e recompensas da cena.",
    "",
    "_A ficha comparativa é uma referência; ela não determina sozinha o resultado narrativo._"
].join("\n") });
