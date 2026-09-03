"use strict";
const { AdminError, CODES } = require("./errors");
function normalize(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
class EntityResolver {
    constructor(database) { this.database = database; }
    async resolve(table, value, options = {}) {
        const allowed = { jogadores: "nome", itens: "nome", missoes: "nome", dungeons: "nome", gacha_banners: "nome", guildas: "nome" };
        const field = allowed[table]; if (!field) throw new AdminError(CODES.INVALID_INPUT, `Entidade não permitida: ${table}.`);
        if (Number.isSafeInteger(Number(value)) && String(value).trim() !== "") { const row = await this.database.get(`SELECT * FROM ${table} WHERE id=?`, [Number(value)]); if (row) return row; }
        const rows = await this.database.all(`SELECT * FROM ${table} WHERE LOWER(${field}) LIKE LOWER(?) ORDER BY ${field} LIMIT 20`, [`%${String(value || "").trim()}%`]);
        const exact = rows.filter(row => normalize(row[field]) === normalize(value)); if (exact.length === 1) return exact[0];
        if (exact.length > 1 || rows.length > 1) throw new AdminError(CODES.AMBIGUOUS_TARGET, `Alvo ambíguo: ${value}.`, { matches: (exact.length ? exact : rows).map(row => ({ id: row.id, nome: row[field] })) });
        if (!rows.length) throw new AdminError(CODES.ENTITY_NOT_FOUND, `Entidade não encontrada em ${table}: ${value}.`); return rows[0];
    }
}
module.exports = { EntityResolver, normalize };
