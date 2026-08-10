const MessageService = require("../core/messageService");

module.exports = async (msg) => MessageService.send({ message: msg, text: [
    "════════════════════════════════════",
    "*EXPANSÕES DE CONTEÚDO*",
    "════════════════════════════════════",
    "",
    "Expansões são campanhas narrativas opcionais que abrem portais, cenários e dungeons especiais sem alterar o cânone principal do RPG.",
    "",
    "*Regras*",
    "› Podem ser adquiridas por jogador solo ou guilda.",
    "› Apenas participantes autorizados pela organização entram na campanha.",
    "› Uma expansão deve ser encerrada antes de iniciar outra.",
    "› O mestre define o risco, as cenas e as consequências.",
    "",
    "*Campanhas registradas*",
    "› Heróis Unidos — 5.000.000 Yulls",
    "› Novo Ciclo de Heroísmo — 5.500.000 Yulls",
    "› Vamos ao Futebol — 5.500.000 Yulls",
    "",
    "_A contratação e aprovação de uma expansão continuam sob responsabilidade da administração._"
].join("\n") });
