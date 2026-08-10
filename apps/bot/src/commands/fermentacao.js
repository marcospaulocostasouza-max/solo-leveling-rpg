const db = require("../core/database");
const MessageService = require("../core/messageService");
const recursos = require("../systems/advancedClassFeatureSystem");

module.exports = async (msg) => {
    try {
        const jogador = await new Promise((resolve) => db.get("SELECT id, classe_avancada FROM jogadores WHERE numero = ?", [msg.author || msg.from], (_, linha) => resolve(linha)));
        if (!jogador) return MessageService.send({ message: msg, text: "[!] Não foi possível encontrar sua ficha." });
        const classe = String(jogador.classe_avancada || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (classe !== "apotecario") return MessageService.send({ message: msg, text: "[!] Fermentação é um recurso exclusivo da classe avançada Apotecário." });

        const entrada = msg.body.replace(/^!fermentacao/i, "").trim();
        if (entrada.toLowerCase().startsWith("solicitar ")) {
            const [nome, efeitoProposto] = entrada.slice(10).split("|").map((parte) => parte.trim());
            if (!nome || !efeitoProposto) return MessageService.send({ message: msg, text: "[!] Uso: !fermentacao solicitar <nome da poção> | <efeito proposto>" });
            await recursos.solicitarPocaoApotecario(jogador.id, { nome, efeitoProposto, ingredientes: [] });
            return MessageService.send({ message: msg, text: "[+] Proposta de poção registrada para aprovação narrativa. Nenhum item foi criado automaticamente." });
        }

        return MessageService.send({ message: msg, text: [
            "════════════════════════════════════", "*FERMENTAÇÃO*", "════════════════════════════════════", "",
            "› Recurso exclusivo de Apotecário.",
            "› Ingredientes, recipiente e cena definem a proposta.",
            "› A mesa aprova a poção antes de ela entrar no inventário.",
            "", "*Registrar proposta*", "› !fermentacao solicitar <nome da poção> | <efeito proposto>",
            "", "_Consulte suas propostas em !classe especial._"
        ].join("\n") });
    } catch (erro) {
        return MessageService.send({ message: msg, text: `[!] ${erro.message || "Não foi possível registrar a poção."}` });
    }
};
