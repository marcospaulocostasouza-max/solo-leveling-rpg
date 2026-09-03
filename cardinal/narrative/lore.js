"use strict";
const { KnowledgeRetriever } = require("../knowledge");
const { TRUST, VISIBILITY } = require("./constants");
function trustOf(row) { if (row.metadata?.priority === "canonical") return "OFFICIAL_LORE"; if (row.source === "database-readonly") return "WORLD_STATE"; if (/regra|sistema/i.test(`${row.category} ${row.system}`)) return "SYSTEM_RULE"; return "DRAFT_LORE"; }
class LoreRetriever {
    constructor(options = {}) { this.knowledge = options.knowledge || new KnowledgeRetriever(options); }
    async retrieve(query, options = {}) { const rows = await this.knowledge.searchKnowledge(query, { limit: Math.min(options.limit || 8, 12) }); return rows.map(row => ({ id: row.id, entity: row.entity, content: row.content, category: row.category, source: row.file, trust: trustOf(row), visibility: row.metadata?.visibility || "PUBLIC" })).filter(row => this.visible(row, options.visibility || "ADMIN_ONLY")); }
    visible(row, viewer) { const rank = VISIBILITY.indexOf(row.visibility), allowed = VISIBILITY.indexOf(viewer); return row.visibility !== "SECRET_LORE" && (rank < 0 || allowed < 0 || rank <= allowed); }
}
module.exports = { LoreRetriever, trustOf, TRUST };
