"use strict";

const crypto = require("crypto");
const { AdminToolRegistry } = require("./tool-registry");
const { registerCoreTools } = require("./tools");
const { AdminRepository } = require("./repository");
const { Rbac } = require("./rbac");
const { riskFor, needsConfirmation, RISK } = require("./risk");
const { planNatural } = require("./planner");
const { AdminError, CODES } = require("./errors");
const { EntityResolver } = require("./resolver");
const { CardinalPublisher } = require("./publisher");
const { planWithModel } = require("./llm-planner");

class CardinalAdminService {
    constructor(options = {}) {
        this.database = options.database || require("../../packages/database"); this.draftStore = options.draftStore;
        this.client = options.client;
        this.knowledge = options.knowledge;
        this.validator = options.validator; this.balance = options.balance || null; this.repository = options.repository || new AdminRepository(this.database); this.rbac = options.rbac || new Rbac({ database: this.database, ownerNumber: options.ownerNumber });
        this.writesEnabled = options.writesEnabled ?? /^true$/i.test(process.env.CARDINAL_ADMIN_WRITES_ENABLED || "false");
        this.confirmHigh = options.confirmHigh ?? !/^false$/i.test(process.env.CARDINAL_CONFIRM_HIGH_RISK || "true");
        this.publisher = options.publisher || (this.draftStore && this.validator ? new CardinalPublisher({ draftStore: this.draftStore, validator: this.validator, balance: this.balance, provider: options.provider || process.env.DATABASE_PROVIDER }) : null);
        this.registry = options.registry || registerCoreTools(new AdminToolRegistry(), { publisher: this.publisher, draftStore: this.draftStore });
    }
    plan(message) { const plan = planNatural(message); return { ...plan, operation_id: `op_${crypto.randomUUID()}`, idempotency_key: digest(message) }; }
    async executePlan(actor, plan, options = {}) {
        const tool = this.registry.get(plan.intent); const admin = await this.rbac.authorize(actor, tool.permission); validateInput(tool, plan.parameters);
        if (this.knowledge && !plan.knowledge_sources) { const evidence = await this.knowledge.searchKnowledge(`${plan.intent} ${JSON.stringify(plan.parameters)}`, { limit: 4 }); plan.knowledge_sources = evidence.map(item => ({ id: item.id, file: item.file, category: item.category, entity: item.entity })); }
        const risk = tool.risk || riskFor(tool.name); const dryRun = options.dryRun === true || !this.writesEnabled;
        const rawKey = plan.idempotency_key || plan.operation_id || `${tool.name}:${JSON.stringify(plan.parameters)}`;
        const normalized = { ...plan, risk, operation_id: plan.operation_id || `op_${crypto.randomUUID()}`, idempotency_key: digest(`${actor}:${rawKey}`) };
        if (!dryRun && needsConfirmation(risk, { confirmHigh: this.confirmHigh }) && !options.confirmed) { const confirmation = await this.repository.createConfirmation(actor, normalized); throw new AdminError(CODES.CONFIRMATION_REQUIRED, "A operação exige confirmação explícita.", confirmation); }
        if (dryRun) { const output = await tool.execute({ query: this.database, database: this.database, admin, dryRun: true }, normalized.parameters); return response(normalized, output, true); }
        const existing = await this.repository.existing(normalized.idempotency_key); if (existing) return { ...JSON.parse(existing.result_json), idempotent_replay: true, operation_id: existing.operation_id };
        let postCommit;
        try {
            const result = await this.repository.transaction(async query => {
                const duplicate = await this.repository.existing(normalized.idempotency_key, query); if (duplicate) return { replay: duplicate };
                const output = await tool.execute({ query, database: this.database, admin, dryRun: false }, normalized.parameters); postCommit = output._postCommit; delete output._postCommit;
                const rendered = response(normalized, output, false); await this.repository.record(query, { operationId: normalized.operation_id, idempotencyKey: normalized.idempotency_key, admin: { number: actor, name: admin.nome }, originalMessage: normalized.original_message, intent: normalized.intent, tool: tool.name, risk, parameters: { ...normalized.parameters, _knowledge_sources: normalized.knowledge_sources || [] }, ...output, result: rendered, status: "SUCCESS", confirmationId: options.confirmationId }); return { rendered };
            });
            if (result.replay) return { ...JSON.parse(result.replay.result_json), idempotent_replay: true, operation_id: result.replay.operation_id };
            if (postCommit) await postCommit(); return result.rendered;
        } catch (error) { await this.recordFailure(actor, admin, normalized, tool, risk, error, options.confirmationId); throw error instanceof AdminError ? error : new AdminError(CODES.TRANSACTION_FAILED, "A transação administrativa falhou e foi revertida.", { cause: error.message }); }
    }
    async executeNatural(actor, message, options = {}) { let plan; try { plan = this.plan(message); } catch (error) { if (!this.client) throw error; plan = { ...await planWithModel(this.client, message, this.registry), operation_id: `op_${crypto.randomUUID()}`, idempotency_key: digest(message) }; } return this.executePlan(actor, plan, options); }
    async confirm(actor, confirmationId) { if (!this.writesEnabled) throw new AdminError(CODES.PERMISSION_DENIED, "Confirmações ficam desabilitadas enquanto as escritas estão em dry-run."); const plan = await this.repository.consumeConfirmation(confirmationId, actor); return this.executePlan(actor, plan, { confirmed: true, confirmationId }); }
    async history(actor, filters = {}) { await this.rbac.authorize(actor, "CARDINAL_READ"); if (this.writesEnabled) return this.repository.history(filters); try { const limit = Math.min(Number(filters.limit) || 20, 100); return await this.database.all("SELECT * FROM cardinal_admin_operations ORDER BY created_at DESC LIMIT ?", [limit]); } catch { return []; } }
    async rollback(actor, operationId, options = {}) {
        const admin = await this.rbac.authorize(actor, "CARDINAL_CRITICAL"); if (!this.writesEnabled || options.dryRun) return { success: true, dry_run: true, operation_id: operationId, message: "Rollback apenas simulado." };
        const original = await this.database.get("SELECT * FROM cardinal_admin_operations WHERE operation_id=?", [operationId]); if (!original) throw new AdminError(CODES.ENTITY_NOT_FOUND, `Operação não encontrada: ${operationId}.`); if (!original.rollback_json) throw new AdminError(CODES.ROLLBACK_FAILED, "A operação não possui rollback seguro."); if (original.rolled_back_at) throw new AdminError(CODES.ROLLBACK_FAILED, "A operação já foi revertida.");
        const rollback = JSON.parse(original.rollback_json), newId = `op_${crypto.randomUUID()}`;
        await this.repository.transaction(async query => { await applyRollback(query, rollback); await query.run("UPDATE cardinal_admin_operations SET rolled_back_at=? WHERE operation_id=?", [new Date().toISOString(), operationId]); await this.repository.record(query, { operationId: newId, idempotencyKey: digest(`${actor}:${options.idempotencyKey || `rollback:${operationId}`}`), admin: { number: actor, name: admin.nome }, originalMessage: `rollback ${operationId}`, intent: "rollback_transaction", tool: "rollback_transaction", risk: RISK.HIGH, parameters: { operation_id: operationId }, entity: null, before: JSON.parse(original.after_json || "null"), after: JSON.parse(original.before_json || "null"), result: { success: true, rolled_back: operationId }, rollback: null, status: "SUCCESS" }); }); if (rollback.draft_id && this.draftStore) await this.draftStore.markStatus(rollback.draft_id, "VALID", actor);
        return { success: true, operation_id: newId, rolled_back: operationId };
    }
    async recordFailure(actor, admin, plan, tool, risk, error, confirmationId) { try { if (await this.repository.existing(plan.idempotency_key)) return; await this.repository.transaction(query => this.repository.record(query, { operationId: plan.operation_id, idempotencyKey: plan.idempotency_key, admin: { number: actor, name: admin.nome }, originalMessage: plan.original_message, intent: plan.intent, tool: tool.name, risk, parameters: { ...plan.parameters, _knowledge_sources: plan.knowledge_sources || [] }, status: "FAILED", error: { code: error.code, message: error.message }, confirmationId })); } catch {} }
}
function validateInput(tool, params = {}) { for (const field of tool.input_schema?.required || []) if (params[field] === undefined || params[field] === null || params[field] === "") throw new AdminError(CODES.INVALID_INPUT, `Parâmetro obrigatório ausente: ${field}.`); const any = tool.input_schema?.requiredAny; if (any?.length && !any.some(field => params[field] !== undefined && params[field] !== null && params[field] !== "")) throw new AdminError(CODES.INVALID_INPUT, `Informe um destes parâmetros: ${any.join(", ")}.`); }
function response(plan, output, dryRun) { return { success: true, dry_run: dryRun, operation_id: plan.operation_id, intent: plan.intent, risk: plan.risk, entity: output.entity, before: output.before, after: output.after, result: output.result }; }
function digest(value) { return crypto.createHash("sha256").update(String(value)).digest("hex"); }
async function applyRollback(query, rollback) { const tables = new Set(["jogadores", "inventario_jogador", "gacha_banners", "dungeons", "itens", "tecnicas", "missoes", "eventos", "guildas", "equipment_sets"]); if (rollback.kind === "set-field" && rollback.table === "jogadores" && ["won", "cristais", "experiencia", "maestria"].includes(rollback.field)) return query.run(`UPDATE jogadores SET ${rollback.field}=? WHERE id=?`, [rollback.value, rollback.id]); if (rollback.kind === "inventory-quantity") { if (rollback.value === 0) return query.run("DELETE FROM inventario_jogador WHERE jogador_id=? AND item_id=?", [rollback.player_id, rollback.item_id]); return query.run("UPDATE inventario_jogador SET quantidade=? WHERE jogador_id=? AND item_id=?", [rollback.value, rollback.player_id, rollback.item_id]); } if (rollback.kind === "banner-state") return query.run("UPDATE gacha_banners SET ativo=?,status=? WHERE id=?", [rollback.ativo, rollback.status, rollback.id]); if (rollback.kind === "fields" && tables.has(rollback.table)) { for (const [field, value] of Object.entries(rollback.values)) { if (!/^[a-z_]+$/.test(field)) throw new AdminError(CODES.ROLLBACK_FAILED, "Campo de rollback inválido."); await query.run(`UPDATE ${rollback.table} SET ${field}=? WHERE id=?`, [value, rollback.id]); } return; } if (rollback.kind === "delete-published" && tables.has(rollback.table)) { if (rollback.table === "itens" && await query.get("SELECT id FROM inventario_jogador WHERE item_id=? LIMIT 1", [rollback.id])) throw new AdminError(CODES.ROLLBACK_FAILED, "O item publicado já está em inventário; exclusão automática não é segura."); if (rollback.table === "tecnicas" && await query.get("SELECT id FROM jogador_tecnicas WHERE tecnica_id=? LIMIT 1", [rollback.id])) throw new AdminError(CODES.ROLLBACK_FAILED, "A técnica publicada já pertence a jogadores; exclusão automática não é segura."); return query.run(`DELETE FROM ${rollback.table} WHERE id=?`, [rollback.id]); } throw new AdminError(CODES.ROLLBACK_FAILED, "Rollback não suportado para esta operação."); }
module.exports = { CardinalAdminService, validateInput, applyRollback, digest };
