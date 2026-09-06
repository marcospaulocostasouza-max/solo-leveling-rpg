"use strict";

const { schemaFor } = require("./schemas");
const { parseStructured } = require("./json");

class BaseForge {
    constructor(type, options = {}) { this.type = type; this.client = options.client; this.validator = options.validator; }
    schema() { return schemaFor(this.type); }
    async generate(plan, context, options = {}) {
        if (options.content) return structuredEnvelope(options.content, this.type, this.schema().version);
        const prompt = `Você é o módulo Cardinal Forge. Gere somente a entidade como objeto JSON, sem markdown, sem repetir o schema e sem envelopes como item/content. Não publique nem afirme que publicou.\nTipo: ${this.type}\nSchema oficial v${this.schema().version}: ${JSON.stringify(this.schema())}\nPlano: ${JSON.stringify(plan)}\nAs constraints do Plano são obrigatórias: nunca troque um atributo solicitado por outro e respeite exatamente rank, slot e distribuição de atributos pedidos.\nRegras recuperadas:\n${context.text}\nUse apenas campos do schema. Não inclua version, schema_version, type, item ou content no resultado. Não invente valores definidos por regras ausentes. Não atribua classe, estilo, local, NPC ou entidade existente que não tenha sido solicitada ou confirmada nas fontes; use "Nenhuma" quando esse valor for aceito pelo schema. Campos puramente criativos podem ser preenchidos se não contradisserem as fontes.`;
        const response = await this.client.chat(prompt, { maxTokens: 900, temperature: 0.15, responseFormat: { type: "json_object" } });
        return applyExplicitConstraints(structuredEnvelope(parseStructured(response.text), this.type, this.schema().version), plan);
    }
    validate(content) { return this.validator.validate(this.type, content); }
    async revise(current, request, context, options = {}) {
        if (options.patch) return structuredEnvelope({ ...current, ...options.patch }, this.type, this.schema().version);
        const prompt = `Você é o Cardinal Forge. Altere somente o que foi pedido e devolva o objeto COMPLETO como JSON sem markdown.\nTipo: ${this.type}\nSchema v${this.schema().version}: ${JSON.stringify(this.schema())}\nDraft atual: ${JSON.stringify(current)}\nAlteração solicitada: ${request}\nRegras recuperadas:\n${context.text}\nNão invente regras ou campos.`;
        const response = await this.client.chat(prompt, { maxTokens: 900, temperature: 0.1, responseFormat: { type: "json_object" } });
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
        if (Object.hasOwn(content, "tier")) content.tier = constraints.rank;
        else if (Object.hasOwn(content, "rank")) content.rank = constraints.rank;
    }
    if (constraints.attribute_distribution) {
        const attributes = ["forca", "resistencia", "velocidade", "sentidos", "inteligencia", "poder_magico"];
        for (const attribute of attributes) if (Object.hasOwn(content, `${attribute}_bonus`) || Object.hasOwn(constraints.attribute_distribution, attribute)) content[`${attribute}_bonus`] = Number(constraints.attribute_distribution[attribute] || 0);
    }
    return { ...envelope, content };
}
module.exports = { BaseForge, structuredEnvelope, applyExplicitConstraints };
