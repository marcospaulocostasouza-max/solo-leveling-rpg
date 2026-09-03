"use strict";

const path = require("path");
const { KnowledgeStore } = require("./store");
const { carregarDocumentos, carregarDocumentosCanonicos } = require("./sources");
const { carregarDocumentosDoBanco } = require("./database-sources");
const { ROOT } = require("../core/config");

class KnowledgeIndexer {
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || path.resolve(ROOT, "..");
        this.indexPath = options.indexPath || path.join(this.projectRoot, "cardinal", "cache", "knowledge.db");
        this.roots = options.roots;
        this.includeDatabase = options.includeDatabase ?? !options.roots;
        this.chunkSize = options.chunkSize || 2400; this.chunkOverlap = options.chunkOverlap || 240;
    }
    async rebuild(options = {}) {
        const store = new KnowledgeStore(this.indexPath); await store.initialize();
        if (options.clear) { await store.run("DELETE FROM documents_fts"); await store.run("DELETE FROM documents"); }
        const documents = [...carregarDocumentos(this.projectRoot, { roots: this.roots, chunkSize: this.chunkSize, chunkOverlap: this.chunkOverlap }), ...carregarDocumentosCanonicos(this.projectRoot), ...await carregarDocumentosDoBanco(this.projectRoot, { enabled: this.includeDatabase })];
        const existing = new Map((await store.all("SELECT id,source_key,content_hash FROM documents")).map(item => [item.source_key, item]));
        const seen = new Set(); let inserted = 0; let updated = 0; let unchanged = 0;
        await store.exec("BEGIN IMMEDIATE");
        try {
            for (const doc of documents) {
                seen.add(doc.sourceKey); const old = existing.get(doc.sourceKey);
                if (old?.content_hash === doc.hash) { unchanged++; continue; }
                if (old) {
                    await store.run(`UPDATE documents SET source=?,file=?,category=?,system=?,entity=?,type=?,content=?,content_hash=?,source_mtime=?,indexed_at=?,metadata_json=? WHERE id=?`,
                        [doc.source, doc.file, doc.category, doc.system, doc.entity, doc.type, doc.content, doc.hash, doc.mtime, new Date().toISOString(), JSON.stringify(doc.metadata), old.id]);
                    await store.run("DELETE FROM documents_fts WHERE document_id=?", [old.id]);
                    await store.run("INSERT INTO documents_fts(document_id,content,entity,category,system) VALUES(?,?,?,?,?)", [old.id, doc.content, doc.entity, doc.category, doc.system]); updated++;
                } else {
                    const row = await store.run(`INSERT INTO documents(source_key,source,file,category,system,entity,type,content,content_hash,source_mtime,indexed_at,metadata_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
                        [doc.sourceKey, doc.source, doc.file, doc.category, doc.system, doc.entity, doc.type, doc.content, doc.hash, doc.mtime, new Date().toISOString(), JSON.stringify(doc.metadata)]);
                    await store.run("INSERT INTO documents_fts(document_id,content,entity,category,system) VALUES(?,?,?,?,?)", [row.lastID, doc.content, doc.entity, doc.category, doc.system]); inserted++;
                }
            }
            let removed = 0;
            for (const [key, old] of existing) if (!seen.has(key)) { await store.run("DELETE FROM documents_fts WHERE document_id=?", [old.id]); await store.run("DELETE FROM documents WHERE id=?", [old.id]); removed++; }
            await store.run("INSERT INTO index_meta(key,value) VALUES('last_indexed_at',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [new Date().toISOString()]);
            await store.exec("COMMIT");
            const byCategory = await store.all("SELECT category,COUNT(*) total FROM documents GROUP BY category ORDER BY category");
            const total = Number((await store.get("SELECT COUNT(*) total FROM documents")).total);
            return { total, sources: new Set(documents.map(doc => doc.file)).size, inserted, updated, unchanged, removed, categories: Object.fromEntries(byCategory.map(row => [row.category, Number(row.total)])) };
        } catch (error) { await store.exec("ROLLBACK").catch(() => {}); throw error; }
        finally { await store.close(); }
    }
}

module.exports = { KnowledgeIndexer };
