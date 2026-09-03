"use strict";

const path = require("path");
const { KnowledgeStore } = require("./store");
const { SYNONYMS } = require("./categories");
const { ROOT, carregarConfiguracao } = require("../core/config");

function normalize(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim(); }
function queryTokens(query) {
    const stop = new Set(["como", "qual", "quais", "para", "uma", "esse", "essa", "sobre", "funciona", "explique", "procure", "informacoes", "regra", "regras", "oficial", "oficiais", "limite", "sistema", "criar"]);
    const base = normalize(query).split(" ").filter(token => token.length > 2 && !stop.has(token)); const result = [...base];
    for (const token of base) if (SYNONYMS[token]) result.push(...SYNONYMS[token].flatMap(value => normalize(value).split(" ")));
    return [...new Set(result)].slice(0, 24);
}
function structuredWhere(filters = {}) {
    const clauses = []; const params = [];
    for (const key of ["category", "system", "entity", "type"]) if (filters[key]) { clauses.push(`d.${key} = ?`); params.push(filters[key]); }
    return { sql: clauses.length ? ` AND ${clauses.join(" AND ")}` : "", params };
}

class KnowledgeRetriever {
    constructor(options = {}) {
        const config = options.config || carregarConfiguracao();
        this.indexPath = options.indexPath || path.resolve(ROOT, "..", config.knowledge.index_path);
        this.maxResults = options.maxResults || config.knowledge.max_results;
    }
    async searchKnowledge(query, filters = {}) {
        const tokens = queryTokens(query); if (!tokens.length) return [];
        const store = new KnowledgeStore(this.indexPath); await store.initialize();
        try {
            const where = structuredWhere(filters); const match = tokens.map(token => `"${token.replace(/"/g, "")}"`).join(" OR ");
            const rows = await store.all(`SELECT d.*, bm25(documents_fts, 0, 1.5, 2.0, 1.0, 1.0) rank
                FROM documents_fts JOIN documents d ON d.id=documents_fts.document_id
                WHERE documents_fts MATCH ?${where.sql} ORDER BY rank LIMIT ?`, [match, ...where.params, Math.max(this.maxResults * 4, 30)]);
            const original = new Set(normalize(query).split(" ").filter(Boolean));
            return rows.map(row => {
                const haystack = normalize(`${row.entity} ${row.category} ${row.system} ${row.content}`);
                const lexical = tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0) / tokens.length;
                const exact = [...original].reduce((score, token) => score + (normalize(row.entity).includes(token) ? 1 : 0), 0);
                const metadata = JSON.parse(row.metadata_json);
                const authority = metadata.priority === "canonical" ? 12 : row.source === "database-readonly" ? 4 : 0;
                return { id: row.id, source: row.source, file: row.file, category: row.category, system: row.system, entity: row.entity, type: row.type, content: row.content, metadata, score: Number(((-Number(row.rank)) + lexical * 2 + exact + authority).toFixed(4)) };
            }).sort((a, b) => b.score - a.score).slice(0, filters.limit || this.maxResults);
        } finally { await store.close(); }
    }
    getSystemRules(system, options = {}) { return this.searchKnowledge(system, { ...options, system }); }
    async findEntity(name, options = {}) {
        const results = await this.searchKnowledge(name, { ...options, limit: Math.max(options.limit || this.maxResults, this.maxResults * 2) });
        if (options.exact === false) return results.slice(0, options.limit || this.maxResults);
        const target = normalize(name);
        return results.filter(item => normalize(item.entity) === target || normalize(item.content).includes(target)).slice(0, options.limit || this.maxResults);
    }
    getRelatedRules(entity, options = {}) { return this.searchKnowledge(`${entity} regras restrições atributos slots`, options); }
}

module.exports = { KnowledgeRetriever, normalize, queryTokens, structuredWhere };
