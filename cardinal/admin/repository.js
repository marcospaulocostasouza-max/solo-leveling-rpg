"use strict";

const crypto = require("crypto");
const { AdminError, CODES } = require("./errors");

class AdminRepository {
    constructor(database) { this.database = database; this.ready = null; }
    initialize() {
        if (!this.ready) this.ready = Promise.all([
            this.database.run(`CREATE TABLE IF NOT EXISTS cardinal_admin_operations (operation_id TEXT PRIMARY KEY,idempotency_key TEXT NOT NULL UNIQUE,admin_number TEXT NOT NULL,admin_name TEXT NOT NULL,original_message TEXT,intent TEXT NOT NULL,tool TEXT NOT NULL,risk TEXT NOT NULL,parameters_json TEXT NOT NULL,entity_json TEXT,before_json TEXT,after_json TEXT,result_json TEXT,rollback_json TEXT,status TEXT NOT NULL,error_json TEXT,confirmation_id TEXT,created_at TEXT NOT NULL,rolled_back_at TEXT)`),
            this.database.run(`CREATE TABLE IF NOT EXISTS cardinal_admin_confirmations (confirmation_id TEXT PRIMARY KEY,operation_json TEXT NOT NULL,admin_number TEXT NOT NULL,expires_at TEXT NOT NULL,confirmed_at TEXT,created_at TEXT NOT NULL)`)
        ]); return this.ready;
    }
    async transaction(work) { await this.initialize(); return this.database.transaction(work); }
    async existing(key, query = this.database) { await this.initialize(); return query.get("SELECT * FROM cardinal_admin_operations WHERE idempotency_key=?", [key]); }
    async record(query, entry) { const now = new Date().toISOString(); await query.run("INSERT INTO cardinal_admin_operations(operation_id,idempotency_key,admin_number,admin_name,original_message,intent,tool,risk,parameters_json,entity_json,before_json,after_json,result_json,rollback_json,status,error_json,confirmation_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [entry.operationId, entry.idempotencyKey, entry.admin.number, entry.admin.name, entry.originalMessage || "", entry.intent, entry.tool, entry.risk, json(entry.parameters), json(entry.entity), json(entry.before), json(entry.after), json(entry.result), json(entry.rollback), entry.status, json(entry.error), entry.confirmationId || null, now]); }
    async history(filters = {}) { await this.initialize(); const clauses = [], params = []; if (filters.tool) { clauses.push("tool=?"); params.push(filters.tool); } if (filters.entity) { clauses.push("entity_json LIKE ?"); params.push(`%${filters.entity}%`); } if (filters.since) { clauses.push("created_at>=?"); params.push(filters.since); } params.push(Math.min(Number(filters.limit) || 20, 100)); return this.database.all(`SELECT * FROM cardinal_admin_operations${clauses.length ? ` WHERE ${clauses.join(" AND ")}` : ""} ORDER BY created_at DESC LIMIT ?`, params); }
    async createConfirmation(adminNumber, operation, ttlMs = 300000) { await this.initialize(); const id = `confirm_${crypto.randomUUID()}`, now = new Date(), expires = new Date(now.getTime() + ttlMs); await this.database.run("INSERT INTO cardinal_admin_confirmations(confirmation_id,operation_json,admin_number,expires_at,created_at) VALUES(?,?,?,?,?)", [id, JSON.stringify(operation), adminNumber, expires.toISOString(), now.toISOString()]); return { confirmation_id: id, expires_at: expires.toISOString() }; }
    async consumeConfirmation(id, adminNumber) { await this.initialize(); return this.database.transaction(async query => { const row = await query.get("SELECT * FROM cardinal_admin_confirmations WHERE confirmation_id=?", [id]); if (!row || row.admin_number !== adminNumber) throw new AdminError(CODES.CONFIRMATION_EXPIRED, "Confirmação inexistente ou não pertence a este administrador."); if (row.confirmed_at || Date.parse(row.expires_at) <= Date.now()) throw new AdminError(CODES.CONFIRMATION_EXPIRED, "A confirmação expirou ou já foi utilizada."); await query.run("UPDATE cardinal_admin_confirmations SET confirmed_at=? WHERE confirmation_id=?", [new Date().toISOString(), id]); return JSON.parse(row.operation_json); }); }
}
function json(value) { return value == null ? null : JSON.stringify(value); }
module.exports = { AdminRepository };
