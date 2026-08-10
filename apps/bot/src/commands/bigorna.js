const db = require("../core/database");
const MessageService = require("../core/messageService");

module.exports = async (msg) => {
    const jogador = await new Promise((resolve) => db.get("SELECT classe_avancada FROM jogadores WHERE numero = ?", [msg.author || msg.from], (_, linha) => resolve(linha)));
    const classe = String(jogador?.classe_avancada || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (!jogador) return MessageService.send({ message: msg, text: "[!] Não foi possível encontrar sua ficha." });
    if (classe !== "ferreiro") return MessageService.send({ message: msg, text: "[!] A Bigorna é exclusiva da classe avançada Ferreiro." });
    return MessageService.send({ message: msg, text: [
        "════════════════════════════════════", "*BIGORNA DO FERREIRO*", "════════════════════════════════════", "",
        "› A forja usa materiais e uma cena aprovada pela mesa.",
        "› O catálogo não é uma consulta pública; a combinação é tratada na cena de forja.",
        "› Materiais e núcleos definem o item proposto, sem bônus automáticos.",
        "› Use !materiais para consultar os tiers disponíveis.",
        "", "_Nenhum item é criado, gasto ou equipado por este comando._"
    ].join("\n") });
};
