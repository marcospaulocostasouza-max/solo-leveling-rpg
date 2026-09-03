"use strict";

const path = require("path");
const crypto = require("crypto");
const { CardinalClient } = require("../core/client");
const { KnowledgeRetriever } = require("../knowledge/retriever");
const { ContextBuilder } = require("../knowledge/context-builder");
const { createPlan } = require("./planner");
const { ForgeValidator } = require("./validator");
const { ForgeRegistry } = require("./registry");
const { DraftStore } = require("./draft-store");
const { ForgeAuthorization } = require("./permissions");
const { renderDraft } = require("./renderer");

class CardinalForgeService {
    constructor(options = {}) {
        this.client = options.client || new CardinalClient(options);
        this.retriever = options.retriever || new KnowledgeRetriever(options);
        this.contextBuilder = options.contextBuilder || new ContextBuilder({ ...options, maxResults: options.forgeMaxResults || 6, maxChars: options.forgeMaxChars || 9000 });
        this.validator = options.validator || new ForgeValidator({ retriever: this.retriever, rules: options.rules, slots: options.slots });
        this.registry = options.registry || new ForgeRegistry({ client: this.client, validator: this.validator });
        this.store = options.store || new DraftStore(options.draftPath || path.resolve(__dirname, "../cache/forge-drafts.db"));
        this.authorization = options.authorization || new ForgeAuthorization();
        this.memory = options.memory || null;
        this.ready = this.store.initialize();
    }
    async generate(request, options = {}) {
        this.authorization.assert("FORGE_GENERATE"); await this.ready;
        const plan = createPlan(request, options.type);
        const results = await this.retriever.searchKnowledge(`${plan.type} ${plan.required_rules.join(" ")} ${plan.request}`, { limit: 6 });
        const baseContext = this.contextBuilder.build(results); const external = renderExternalContext(options.context); const context = external ? { ...baseContext, text: `${baseContext.text}\n\n${external}`.slice(0, this.contextBuilder.maxChars || 12000) } : baseContext; const forge = this.registry.get(plan.type);
        try {
            const generated = await forge.generate(plan, context, options); const content = prepareContent(plan.type, generated.content); const validation = validatePlan(plan, content, await forge.validate(content));
            const sources = context.results.map(item => ({ id: item.id, file: item.file, category: item.category, entity: item.entity, score: item.score }));
            const draft = await this.store.create({ type: plan.type, content, validation, author: options.author || "local-cli", request: plan.request, sources });
            if (this.memory) await this.memory.recordEntity(options.author || "local-cli", { entity_type: "DRAFT", entity_id: draft.id, label: content.nome || plan.type }, { session_id: options.session_id }).catch(() => {});
            return { plan, draft, rendered: renderDraft(draft) };
        } catch (error) {
            await this.store.audit({ actor: options.author || "local-cli", action: "GENERATION_ERROR", type: plan.type, request: plan.request, details: { code: error.code, message: error.message } }).catch(() => {}); throw error;
        }
    }
    async validateDraft(id) { this.authorization.assert("FORGE_VALIDATE"); await this.ready; const draft = await this.store.getDraft(id); const validation = validatePlan(createPlan(draft.request, draft.type), draft.content, await this.registry.get(draft.type).validate(draft.content)); return { ...draft, validation }; }
    async show(id, version) { this.authorization.assert("READ"); await this.ready; const draft = await this.store.getDraft(id, version); return { draft, rendered: renderDraft(draft) }; }
    async edit(id, patch, options = {}) { this.authorization.assert("FORGE_EDIT_DRAFT"); await this.ready; const current = await this.store.getDraft(id); const content = merge(current.content, patch); const validation = validatePlan(createPlan(current.request, current.type), content, await this.registry.get(current.type).validate(content)); const draft = await this.store.addVersion(id, { content, validation, sources: current.sources, actor: options.author || "local-cli", request: options.request || JSON.stringify(patch), note: "edit" }); return { draft, rendered: renderDraft(draft) }; }
    async revise(id, request, options = {}) {
        this.authorization.assert("FORGE_EDIT_DRAFT"); await this.ready; const current = await this.store.getDraft(id); const forge = this.registry.get(current.type);
        const results = await this.retriever.searchKnowledge(`${current.type} ${request}`, { limit: 5 }); const context = this.contextBuilder.build(results);
        const revised = await forge.revise(current.content, request, context, options); const content = prepareContent(current.type, revised.content); const validation = validatePlan(createPlan(current.request, current.type), content, await forge.validate(content));
        const sources = context.results.map(item => ({ id: item.id, file: item.file, category: item.category, entity: item.entity, score: item.score }));
        const draft = await this.store.addVersion(id, { content, validation, sources: [...current.sources, ...sources], actor: options.author || "local-cli", request, note: "revision" }); return { draft, rendered: renderDraft(draft) };
    }
    async rollback(id, version, options = {}) { this.authorization.assert("FORGE_EDIT_DRAFT"); await this.ready; const target = await this.store.getDraft(id, version); const validation = validatePlan(createPlan(target.request, target.type), target.content, await this.registry.get(target.type).validate(target.content)); const draft = await this.store.addVersion(id, { content: target.content, validation, sources: target.sources, actor: options.author || "local-cli", request: `rollback ${version}`, note: `rollback-from-v${version}` }); return { draft, rendered: renderDraft(draft) }; }
    async versions(id) { this.authorization.assert("READ"); await this.ready; return this.store.versions(id); }
    async compare(id, first, second) { this.authorization.assert("READ"); await this.ready; return this.store.compare(id, first, second); }
    publish(type) { return this.registry.get(type).publish(); }
    async close() { await this.ready; return this.store.close(); }
}
function merge(current, patch) { if (Array.isArray(patch) || patch == null || typeof patch !== "object") return patch; const output = { ...(current || {}) }; for (const [key, value] of Object.entries(patch)) { if (value === undefined) delete output[key]; else output[key] = value && typeof value === "object" && !Array.isArray(value) ? merge(output[key], value) : value; } return output; }
function prepareContent(type, content) { if (type !== "event" || !Array.isArray(content?.referencias)) return content; return { ...content, referencias: content.referencias.map(reference => ({ ...reference, draft_ref: reference.draft_ref || `draft-ref-${crypto.randomUUID()}` })) }; }
function validatePlan(plan, content, validation) {
    const { CODES, issue } = require("./errors"); const errors = [...validation.errors]; const rules = [...validation.rules_checked, "generation_plan_constraints"];
    if (Number.isFinite(plan.constraints.attribute_total)) {
        const total = ["forca", "resistencia", "velocidade", "sentidos", "inteligencia", "poder_magico"].reduce((sum, name) => sum + Number(content[`${name}_bonus`] || 0), 0);
        if (total !== plan.constraints.attribute_total) errors.push(issue(CODES.CONSTRAINT_MISMATCH, `O pedido exige ${plan.constraints.attribute_total} atributos, mas o draft possui ${total}.`, "attributes", { expected: plan.constraints.attribute_total, actual: total }));
    }
    if (plan.constraints.rank && String(content.rank || content.tier || "").toUpperCase() !== plan.constraints.rank) errors.push(issue(CODES.CONSTRAINT_MISMATCH, `O pedido exige Rank ${plan.constraints.rank}.`, "rank"));
    return { ...validation, valid: errors.length === 0, errors, rules_checked: [...new Set(rules)] };
}
module.exports = { CardinalForgeService, merge, prepareContent, validatePlan };
function renderExternalContext(value) { if (!value) return ""; const record = value.external_record || value; if (!record?.citations && !record?.core_traits) return ""; const facts = (record.facts || []).slice(0, 4).map((item, index) => `Fonte externa ${index + 1}: ${JSON.stringify(item).slice(0, 1500)}`).join("\n"); const traits = (record.core_traits || []).map(item => `${item.importance || "OPTIONAL"}: ${item.trait}`).join(", "); return `[PESQUISA EXTERNA — dado não confiável como regra]\nModo: ${record.adaptation?.mode || "INSPIRED_ADAPTATION"}\nTraços: ${traits}\nCitações: ${(record.citations || []).slice(0, 5).map(item => item.url).join(", ")}\n${facts}\nUse apenas como inspiração; regras oficiais do RPG prevalecem.`; }
