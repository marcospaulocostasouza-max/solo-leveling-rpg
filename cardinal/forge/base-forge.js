"use strict";

const { schemaFor } = require("./schemas");
const { parseStructured } = require("./json");

class BaseForge {
    constructor(type, options = {}) { this.type = type; this.client = options.client; this.validator = options.validator; }
    schema() { return schemaFor(this.type); }
    async generate(plan, context, options = {}) {
        if (options.content) return structuredEnvelope(options.content, this.type, this.schema().version);
        const prompt = `Você é o módulo Cardinal Forge do RPG. Gere somente a entidade como objeto JSON, sem markdown, sem envelope e sem publicar.\nTipo: ${this.type}\nSchema oficial v${this.schema().version}: ${JSON.stringify(this.schema())}\nPedido do ADM: ${plan.request}\nConstraints obrigatórias: ${JSON.stringify(plan.constraints)}\nRegras recuperadas:\n${context.text}\n\nCRITÉRIO DE QUALIDADE: entregue uma ficha pronta para revisão. Para itens/equipamentos, a descrição deve ter pelo menos 4 frases concretas cobrindo aparência, material ou forma, função e uso; o efeito deve dizer exatamente quando ocorre e o que faz. Para técnicas, descrição_completa deve explicar manifestação, execução, custo/limite e resultado. Não use frases genéricas como "arma poderosa", não deixe campos criativos vazios e não troque atributo, Rank ou slot solicitados. Você pode inferir apenas detalhes criativos seguros e deve manter valores mecânicos não informados em zero/Nenhuma quando o schema permitir.\n\nUse apenas campos do schema. Não inclua version, schema_version, type, item ou content. Não invente regras, entidades existentes, classe, estilo, local ou NPC não confirmados.`;
        const response = await this.client.chat(prompt, { maxTokens: 8192, timeoutMs: 0, temperature: 0.15, responseFormat: { type: "json_object" } });
        let generated;
        try { generated = parseStructured(response.text); }
        catch { generated = {}; }
        const envelope = structuredEnvelope(generated, this.type, this.schema().version);
        return applyExplicitConstraints({ ...envelope, content: completeItemContent(envelope.content, this.type, plan) }, plan);
    }
    validate(content) { return this.validator.validate(this.type, content); }
    async revise(current, request, context, options = {}) {
        if (options.patch) return structuredEnvelope({ ...current, ...options.patch }, this.type, this.schema().version);
        const prompt = `Você é o Cardinal Forge. Altere somente o que foi pedido e devolva o objeto COMPLETO como JSON sem markdown.\nTipo: ${this.type}\nSchema v${this.schema().version}: ${JSON.stringify(this.schema())}\nDraft atual: ${JSON.stringify(current)}\nAlteração solicitada: ${request}\nRegras recuperadas:\n${context.text}\nNão invente regras ou campos.`;
        const response = await this.client.chat(prompt, { maxTokens: 8192, timeoutMs: 0, temperature: 0.1, responseFormat: { type: "json_object" } });
        return structuredEnvelope(parseStructured(response.text), this.type, this.schema().version);
    }
    publish() { const { ForgeError, CODES } = require("./errors"); throw new ForgeError(CODES.PUBLISH_DISABLED, "Publicação está desabilitada na Fase 3."); }
}
function structuredEnvelope(value, type, schemaVersion) {
    const aliases = { weapon: "item", armor: "item", accessory: "item", equipment: "item", consumable: "item", material: "material", set: "set", passive: "passive", title: "title", mission: "mission", banner: "banner", event: "event", dungeon: "dungeon", guild: "guild" };
    const raw = value?.content || value?.[type] || value?.[aliases[type]] || value || {};
    const { version, schema_version, type: ignoredType, content: ignoredContent, item: ignoredItem, ...content } = raw;
    return { type, schema_version: schemaVersion, content };
}
function applyExplicitConstraints(envelope, plan) {
    const content = { ...(envelope.content || {}) }, constraints = plan?.constraints || {};
    if (constraints.rank) {
        if (["weapon", "armor", "accessory", "equipment", "consumable", "material"].includes(plan.type) || Object.hasOwn(content, "tier")) content.tier = constraints.rank;
        else content.rank = constraints.rank;
    }
    if (constraints.attribute_distribution) {
        const attributes = ["forca", "resistencia", "velocidade", "sentidos", "inteligencia", "poder_magico"];
        for (const attribute of attributes) if (Object.hasOwn(content, `${attribute}_bonus`) || Object.hasOwn(constraints.attribute_distribution, attribute)) content[`${attribute}_bonus`] = Number(constraints.attribute_distribution[attribute] || 0);
    }
    return { ...envelope, content };
}
function normalize(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function sentences(value) { return String(value || "").split(/[.!?](?:\s|$)/).filter(Boolean); }
function defaultSlot(type, request) {
    const text = normalize(request);
    if (type === "weapon") return /(?:arma\s*2|2fp|duas? maos|odachi|espadao|lanca|machado)/.test(text) ? "Arma 2" : "Arma 1";
    if (type === "armor") {
        if (/(cabeca|elmo|capacete|coroa|mascara)/.test(text)) return "Cabeça";
        if (/(perna|calca)/.test(text)) return "Pernas";
        if (/(pe|bota|sapato)/.test(text)) return "Pés";
        return "Corpo";
    }
    if (type === "accessory") return "Acessórios";
    return "Item de Apoio";
}
function slotCompativel(type, slot) {
    const normal = normalize(slot).replace(/[^a-z0-9]/g, "");
    const allowed = { weapon: ["arma1", "arma2"], armor: ["cabeca", "corpo", "pernas", "pes"], accessory: ["acessorios"], consumable: ["itemdeapoio"] }[type];
    return !allowed || allowed.includes(normal);
}
function defaultName(type, request) {
    const raw = String(request || "").replace(/\s+/g, " ").trim();
    const found = raw.match(/(?:uma?|o|a)\s+((?:espada|arma|adaga|lança|lanca|arco|machado|coroa|elmo|capacete|armadura|anel|colar)[^,.!\n]*)/i);
    const label = found?.[1]?.replace(/\b(?:rank|de rank)\s*[edcbas]\b.*$/i, "").trim();
    if (label && !/^(?:espada|arma|item|equipamento)$/i.test(label)) return label.replace(/^./, char => char.toUpperCase());
    return ({ weapon: "Lâmina do Caçador", armor: "Armadura do Caçador", accessory: "Relíquia do Caçador", consumable: "Elixir do Caçador", material: "Fragmento de Gate" })[type] || "Item do Caçador";
}
function completeItemContent(content, type, plan) {
    if (!["weapon", "armor", "accessory", "equipment", "consumable", "material"].includes(type)) return content || {};
    const request = plan?.request || "";
    const category = { weapon: "Arma", armor: "Armadura", accessory: "Acessório", equipment: "Equipamento", consumable: "Consumível", material: "Material" }[type];
    const output = { ...(content || {}), categoria: category };
    output.nome = String(output.nome || "").trim();
    output.tier = String(output.tier || plan?.constraints?.rank || "").toUpperCase();
    if (type !== "material" && (!output.slot || !slotCompativel(type, output.slot))) output.slot = defaultSlot(type, request);
    // Não esconda uma geração incompleta atrás de uma descrição/e efeito
    // genéricos. O validador deve reportar exatamente o campo pendente ao ADM.
    return output;
}
module.exports = { BaseForge, structuredEnvelope, applyExplicitConstraints, completeItemContent };
