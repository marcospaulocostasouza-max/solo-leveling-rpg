const db = require("../core/database");
const MessageService = require("../core/messageService");
const recursos = require("../systems/advancedClassFeatureSystem");

module.exports = async (msg) => {
    try {
        const jogador = await new Promise((resolve) => db.get("SELECT id, classe_avancada FROM jogadores WHERE numero = ?", [msg.author || msg.from], (_, linha) => resolve(linha)));
        if (!jogador) return MessageService.send({ message: msg, text: "[!] Não foi possível encontrar sua ficha." });
        const classe = String(jogador.classe_avancada || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (classe !== "arcanista") return MessageService.send({ message: msg, text: "[!] Encantamento é um recurso exclusivo da classe avançada Arcanista." });

        const entrada = msg.body.replace(/^!encantamento/i, "").trim();
        if (entrada.toLowerCase().startsWith("solicitar ")) {
            const [itemId, efeito] = entrada.slice(10).split("|").map((parte) => parte.trim());
            if (!/^\d+$/.test(itemId || "") || !efeito) return MessageService.send({ message: msg, text: "[!] Uso: !encantamento solicitar <id do item> | <efeito proposto>" });
            await recursos.solicitarEncantamento(jogador.id, Number(itemId), efeito);
            return MessageService.send({ message: msg, text: "[+] Solicitação de encantamento registrada para aprovação narrativa. Nenhum efeito foi aplicado automaticamente." });
        }

        return MessageService.send({ message: msg, text: [
            "════════════════════════════════════", "*MESA DE ENCANTAMENTO*", "════════════════════════════════════", "",
            "› Recurso exclusivo de Arcanista.",
            "› O item precisa estar no inventário do Arcanista.",
            "› A proposta fica pendente para análise da mesa; ela não altera atributos automaticamente.",
            "", "*Registrar proposta*", "› !encantamento solicitar <id do item> | <efeito proposto>",
            "", "_Consulte seus registros em !classe especial._"
        ].join("\n") });
    } catch (erro) {
        return MessageService.send({ message: msg, text: `[!] ${erro.message || "Não foi possível registrar o encantamento."}` });
    }
};
