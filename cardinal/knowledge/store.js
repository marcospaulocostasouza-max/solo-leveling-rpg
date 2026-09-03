"use strict";

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

class KnowledgeStore {
    constructor(file) { this.file = file; fs.mkdirSync(path.dirname(file), { recursive: true }); this.db = new sqlite3.Database(file); }
    run(sql, params = []) { return new Promise((resolve, reject) => this.db.run(sql, params, function(error) { error ? reject(error) : resolve({ lastID: this.lastID, changes: this.changes }); })); }
    get(sql, params = []) { return new Promise((resolve, reject) => this.db.get(sql, params, (error, row) => error ? reject(error) : resolve(row || null))); }
    all(sql, params = []) { return new Promise((resolve, reject) => this.db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows || []))); }
    exec(sql) { return new Promise((resolve, reject) => this.db.exec(sql, error => error ? reject(error) : resolve())); }
    close() { return new Promise((resolve, reject) => this.db.close(error => error ? reject(error) : resolve())); }
    async initialize() {
        await this.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;
            CREATE TABLE IF NOT EXISTS documents (
              id INTEGER PRIMARY KEY, source_key TEXT NOT NULL UNIQUE, source TEXT NOT NULL, file TEXT,
              category TEXT NOT NULL, system TEXT NOT NULL, entity TEXT, type TEXT NOT NULL, content TEXT NOT NULL,
              content_hash TEXT NOT NULL, source_mtime TEXT, indexed_at TEXT NOT NULL, metadata_json TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
            CREATE INDEX IF NOT EXISTS idx_documents_system ON documents(system);
            CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity);
            CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(document_id UNINDEXED, content, entity, category, system, tokenize='unicode61 remove_diacritics 2');
            CREATE TABLE IF NOT EXISTS index_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
    }
}

module.exports = { KnowledgeStore };
