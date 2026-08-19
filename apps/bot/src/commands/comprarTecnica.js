const MessageService = require("../core/messageService");
const db = require("../core/database");
const { comprarTecnica } = require("../systems/techniquePurchaseSystem");
const get = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));

function friendlyPurchaseError(error, player, technique) {
    const message = String(error?.message || "");
    if (message.includes("Proficiência incompatível")) return `*═══ PROFICIÊNCIA INCOMPATÍVEL ═══*\n\nA técnica *${technique.nome}* exige *Proficiência em ${technique.classe}*.\nSeu Estilo de Luta atual é *${player.estilo_luta || "não definido"}*.`;
    if (message.includes("Classe incompatível")) return `*═══ CLASSE INCOMPATÍVEL ═══*\n\nA técnica *${technique.nome}* pertence à classe *${technique.classe}*.\nSua classe atual é *${player.classe}*.`;
    if (message.includes("Nível insuficiente")) return `*═══ NÍVEL INSUFICIENTE ═══*\n\nTécnica: *${technique.nome}*\nNível necessário: *${technique.nivel_desbloqueio || 1}*\nSeu nível: *${player.nivel || 1}*`;
    if (message.includes("já possui")) return "*═══ VOCÊ JÁ POSSUI ESTA TÉCNICA! ═══*";
    if (message.includes("Maestria insuficiente")) return `*═══ MAESTRIA INSUFICIENTE ═══*\n\nSua Maestria: *${player.maestria || 0}*\nUse *!Maestria* para entender como obter e utilizar esse recurso.`;
    return "*═══ A compra da técnica não pôde ser concluída. Nenhuma Maestria foi perdida. ═══*";
}

module.exports = async (msg) => {
    const text = String(msg.body || "").trim();
    if (!/^!comprar\s+t[eé]cnica\b/i.test(text)) return;

    const requestedName = text.replace(/^!comprar\s+t[eé]cnica\b/i, "").trim().replace(/_/g, " ");
    if (!requestedName) {
        await MessageService.send({ message: msg, text: "*═══ COMO COMPRAR UMA TÉCNICA ═══*\n\nUse: *!comprar técnica <nome>*\nExemplo: *!comprar técnica Corte Rápido*\n\nConsulte *!Maestria* para ver as regras e *!Técnicas* para conhecer as opções." });
        return;
    }

    try {
        const number = msg.author || msg.from;
        const player = await get("SELECT * FROM jogadores WHERE numero = ?", [number]);
        if (!player) {
            await MessageService.send({ message: msg, text: "*═══ JOGADOR NÃO ENCONTRADO ═══*\n\nSua ficha precisa estar aprovada antes da compra." });
            return;
        }

        const technique = await get("SELECT * FROM tecnicas WHERE LOWER(nome) LIKE LOWER(?) ORDER BY CASE WHEN LOWER(nome) = LOWER(?) THEN 0 ELSE 1 END, nome LIMIT 1", [`%${requestedName}%`, requestedName]);
        if (!technique) {
            await MessageService.send({ message: msg, text: "*═══ TÉCNICA NÃO ENCONTRADA ═══*\n\nConfira o nome com *!Técnicas* ou consulte uma técnica usando *!Técnica <nome>*." });
            return;
        }

        let result;
        try {
            result = await comprarTecnica(player, technique);
        } catch (error) {
            await MessageService.send({ message: msg, text: friendlyPurchaseError(error, player, technique) });
            return;
        }

        const description = technique.descricao_completa || technique.descricao || "Sem descrição.";
        let message = `*═══ TÉCNICA ADQUIRIDA! ═══*\n\n*${technique.nome}*\n> ${description}\n\n`;
        message += `*— Detalhes —*\nClasse: ${technique.classe}\nCategoria: ${technique.tipo || technique.categoria || "Técnica"}\nCusto de Mana: ${technique.custo_mana || 0} MP\n`;
        if (technique.cooldown) message += `Recarga: ${technique.cooldown} turno(s)\n`;
        message += `\n*— Maestria —*\nValor pago: ${result.cost}\nSaldo restante: ${result.maestria}\nPróxima técnica dessa classe: ${result.nextCost}\n\n`;
        message += `_Use *!Minhas Técnicas* para consultar tudo que aprendeu._`;
        await MessageService.send({ message: msg, text: message });
    } catch (error) {
        console.error("[MAESTRIA] Erro ao comprar técnica:", error?.message || error);
        await MessageService.send({ message: msg, text: "*O Sistema não conseguiu concluir a compra. Nenhuma Maestria foi perdida; tente novamente.*" });
    }
};
