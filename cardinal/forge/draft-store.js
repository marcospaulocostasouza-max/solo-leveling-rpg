"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();
const { ForgeError, CODES } = require("./errors");

class DraftStore {
    constructor(file) { this.file = file; fs.mkdirSync(path.dirname(file), { recursive: true }); this.db = new sqlite3.Database(file); }
    run(sql, params = []) { return new Promise((resolve, reject) => this.db.run(sql, params, function(error) { error ? reject(error) : resolve({ lastID: this.lastID, changes: this.changes }); })); }
    get(sql, params = []) { return new Promise((resolve, reject) => this.db.get(sql, params, (error, row) => error ? reject(error) : resolve(row || null))); }
    all(sql, params = []) { return new Promise((resolve, reject) => this.db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows || []))); }
    exec(sql) { return new Promise((resolve, reject) => this.db.exec(sql, error => error ? reject(error) : resolve())); }
    close() { return new Promise((resolve, reject) => this.db.close(error => error ? reject(error) : resolve())); }
    async initialize() {
        await this.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
          CREATE TABLE IF NOT EXISTS forge_drafts (id TEXT PRIMARY KEY,type TEXT NOT NULL,status TEXT NOT NULL,current_version INTEGER NOT NULL,author TEXT NOT NULL,request TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS forge_draft_versions (draft_id TEXT NOT NULL,version INTEGER NOT NULL,content_json TEXT NOT NULL,validation_json TEXT NOT NULL,sources_json TEXT NOT NULL,change_note TEXT,created_at TEXT NOT NULL,PRIMARY KEY(draft_id,version),FOREIGN KEY(draft_id) REFERENCES forge_drafts(id));
          CREATE TABLE IF NOT EXISTS forge_audit (id INTEGER PRIMARY KEY AUTOINCREMENT,draft_id TEXT,actor TEXT NOT NULL,action TEXT NOT NULL,type TEXT,request TEXT,details_json TEXT NOT NULL,created_at TEXT NOT NULL);
          CREATE INDEX IF NOT EXISTS idx_forge_audit_draft ON forge_audit(draft_id,created_at);`);
    }
    async create({ type, content, validation, author, request, sources = [] }) {
        const id = `draft_${crypto.randomUUID()}`; const now = new Date().toISOString(); const status = validation.valid ? "VALID" : "INVALID";
        await this.run("INSERT INTO forge_drafts(id,type,status,current_version,author,request,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)", [id, type, status, 1, author, request, now, now]);
        await this.insertVersion(id, 1, content, validation, sources, "initial", now);
        await this.audit({ draftId: id, actor: author, action: "GENERATE", type, request, details: { status, version: 1, rules: validation.rules_checked } });
        return this.getDraft(id);
    }
    async addVersion(id, { content, validation, sources = [], actor, request = "", note = "edit" }) {
        const draft = await this.get("SELECT * FROM forge_drafts WHERE id=?", [id]); if (!draft) throw new ForgeError(CODES.DRAFT_NOT_FOUND, `Draft não encontrado: ${id}.`);
        const version = draft.current_version + 1; const now = new Date().toISOString(); const status = validation.valid ? "VALID" : "INVALID";
        await this.insertVersion(id, version, content, validation, sources, note, now);
        await this.run("UPDATE forge_drafts SET status=?,current_version=?,updated_at=? WHERE id=?", [status, version, now, id]);
        await this.audit({ draftId: id, actor, action: note.toUpperCase(), type: draft.type, request, details: { status, version, rules: validation.rules_checked } });
        return this.getDraft(id);
    }
    insertVersion(id, version, content, validation, sources, note, now = new Date().toISOString()) { return this.run("INSERT INTO forge_draft_versions(draft_id,version,content_json,validation_json,sources_json,change_note,created_at) VALUES(?,?,?,?,?,?,?)", [id, version, JSON.stringify(content), JSON.stringify(validation), JSON.stringify(sources), note, now]); }
    async getDraft(id, version) {
        const draft = await this.get("SELECT * FROM forge_drafts WHERE id=?", [id]); if (!draft) throw new ForgeError(CODES.DRAFT_NOT_FOUND, `Draft não encontrado: ${id}.`);
        const wanted = version == null ? draft.current_version : Number(version);
        const row = await this.get("SELECT * FROM forge_draft_versions WHERE draft_id=? AND version=?", [id, wanted]); if (!row) throw new ForgeError(CODES.VERSION_NOT_FOUND, `Versão ${wanted} não encontrada no draft ${id}.`);
        return hydrate(draft, row);
    }
    async versions(id) { await this.getDraft(id); return (await this.all("SELECT version,validation_json,change_note,created_at FROM forge_draft_versions WHERE draft_id=? ORDER BY version", [id])).map(row => ({ version: row.version, status: JSON.parse(row.validation_json).valid ? "VALID" : "INVALID", note: row.change_note, created_at: row.created_at })); }
    async findByName(name) { const rows = await this.all("SELECT d.id,d.current_version,v.content_json FROM forge_drafts d JOIN forge_draft_versions v ON v.draft_id=d.id AND v.version=d.current_version ORDER BY d.updated_at DESC"); const target = String(name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); const matches = rows.filter(row => String(JSON.parse(row.content_json).nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() === target); if (matches.length !== 1) return { matches: matches.map(row => row.id) }; return { id: matches[0].id }; }
    async compare(id, first, second) { const a = await this.getDraft(id, first), b = await this.getDraft(id, second); return { draft_id: id, from: a.version, to: b.version, changes: diff(a.content, b.content) }; }
    async markStatus(id, status, actor = "publisher") { const draft = await this.getDraft(id); await this.run("UPDATE forge_drafts SET status=?,updated_at=? WHERE id=?", [status, new Date().toISOString(), id]); await this.audit({ draftId: id, actor, action: status, type: draft.type, request: "", details: { version: draft.version } }); return this.getDraft(id); }
    async audit(entry) { return this.run("INSERT INTO forge_audit(draft_id,actor,action,type,request,details_json,created_at) VALUES(?,?,?,?,?,?,?)", [entry.draftId || null, entry.actor || "unknown", entry.action, entry.type || null, entry.request || null, JSON.stringify(entry.details || {}), new Date().toISOString()]); }
}
function hydrate(draft, row) { return { id: draft.id, type: draft.type, status: draft.status, version: row.version, author: draft.author, request: draft.request, content: JSON.parse(row.content_json), validation: JSON.parse(row.validation_json), sources: JSON.parse(row.sources_json), change_note: row.change_note, created_at: draft.created_at, updated_at: draft.updated_at }; }
function diff(a, b) { const output = []; for (const key of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])) if (JSON.stringify(a?.[key]) !== JSON.stringify(b?.[key])) output.push({ field: key, before: a?.[key], after: b?.[key] }); return output; }
module.exports = { DraftStore, diff };
