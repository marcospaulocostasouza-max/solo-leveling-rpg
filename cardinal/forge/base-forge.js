"use strict";

const { schemaFor } = require("./schemas");
const { parseStructured } = require("./json");

class BaseForge {
    constructor(type, options = {}) { this.type = type; this.client = options.client; this.validator = options.validator; }
    schema() { return schemaFor(this.type); }
    async generate(plan, context, options = {}) {
        if (options.content) return structuredEnvelope(options.content, this.type, this.schema().version);
        const prompt = `Você é o módulo Cardinal Forge. Gere somente a entidade como objeto JSON, sem markdown, sem repetir o schema e sem envelopes como item/content. Não publique nem afirme que publicou.\nTipo: ${this.type}\nSchema oficial v${this.schema().version}: ${JSON.stringify(this.schema())}\nPlano: ${JSON.stringify(plan)}\nAs constraints do Plano são obrigatórias: nunca troque um atributo solicitado por outro e respeite exatamente rank, slot e distribuição de atributos pedidos.\nRegras recuperadas:\n${context.text}\nUse apenas campos do schema. Não inclua version, schema_version, type, item ou content no resultado. Não invente valores definidos por regras ausentes. Não atribua classe, estilo, local, NPC ou entidade existente que não tenha sido solicitada ou confirmada nas fontes; use "Nenhuma" quando esse valor for aceito pelo schema. Campos puramente criativos podem ser preenchidos se não contradisserem as fontes.`;
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
    if (!output.nome || /^(?:arma|espada|item|equipamento)$/i.test(output.nome)) output.nome = defaultName(type, request);
    output.tier = String(output.tier || plan?.constraints?.rank || "D").toUpperCase();
    if (type !== "material" && (!output.slot || !slotCompativel(type, output.slot))) output.slot = defaultSlot(type, request);
    const description = String(output.descricao || "").trim();
    if (description.length < 180 || sentences(description).length < 4) {
        const opening = type === "weapon"
            ? `${output.nome} é uma arma de construção reforçada, com lâmina, empunhadura e guarda projetadas para manter firmeza em combate.`
            : type === "armor"
                ? `${output.nome} é uma peça de proteção reforçada, formada por camadas resistentes e detalhes visuais próprios para expedições em Gates.`
                : `${output.nome} é um artefato de construção cuidadosa, com acabamento marcante e função definida para expedições perigosas.`;
        output.descricao = `${opening} Seus materiais foram escolhidos para suportar uso contínuo sem perder a identidade visual do portador. A função do item é objetiva e seus bônus podem ser conferidos diretamente na ficha antes de ser equipado. Em combate, ele apoia uma decisão tática específica em vez de depender de uma promessa genérica de poder. O item foi adaptado ao Rank ${output.tier} e ao slot ${output.slot || "de apoio"}.`;
    }
    if (type !== "material" && (!String(output.efeito || "").trim() || /^nenhuma$/i.test(output.efeito))) output.efeito = "Enquanto estiver equipado, aplica somente os bônus de atributos descritos nesta ficha.";
    return output;
}
module.exports = { BaseForge, structuredEnvelope, applyExplicitConstraints, completeItemContent };
