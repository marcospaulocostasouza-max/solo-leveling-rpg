const MessageService = require("../core/messageService");

module.exports = async (msg) => MessageService.send({ message: msg, text: [
    "════════════════════════════════════",
    "*GUIA DE MATERIAIS*",
    "════════════════════════════════════",
    "",
    "Materiais servem para forja, poções e encantamentos narrativos. A origem e o consumo sempre precisam ser registrados na cena ou aprovados pela mesa.",
    "",
    "*Como obter*",
    "› Exploração, dungeons e mineração narrada.",
    "› Eventos aprovados, recompensas e conversão autorizada.",
    "› Loja de materiais: !loja materiais.",
    "",
    "*Tiers*",
    "› Tier 1 — ranks E–D: couro, latão, ferro e cobre.",
    "› Tier 2 — rank C: aço, ouro, arenito, malaquita e jade.",
    "› Tier 3 — rank B: mithril, adamantium e oricalco.",
    "› Tier 4 — rank A: relicário, urano e mármore negro.",
    "› Tier 5 — rank S: gelo verdadeiro, hexita e cristais elementais.",
    "",
    "_O material informa possibilidades de cena; ele não cria um item automaticamente._"
].join("\n") });
