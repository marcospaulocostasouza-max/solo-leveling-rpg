"use strict";

const path = require("path");
const crypto = require("crypto");

const TABLES = [
    { table: "itens", category: "equipment", entity: "nome", fields: ["id", "nome", "categoria", "slot", "tier", "rank", "descricao", "efeito", "habilidade", "forca", "resistencia", "velocidade", "sentidos", "inteligencia", "poder_magico"] },
    { table: "tecnicas", category: "skills", entity: "nome", fields: ["id", "nome", "classe", "categoria", "tipo", "rank", "descricao", "descricao_completa", "efeito", "nivel_desbloqueio", "custo_mana", "custo_maestria", "custo_qi", "cooldown", "dano"] },
    { table: "dungeons", category: "dungeons", entity: "nome", fields: ["id", "nome", "rank", "descricao", "tipo", "requisitos", "recompensas"] },
    { table: "equipment_sets", category: "sets", entity: "nome", fields: ["id", "nome", "descricao", "rank", "ativo"] },
    { table: "equipment_set_bonuses", category: "sets", entity: "set_id", fields: ["set_id", "required_pieces", "forca", "resistencia", "velocidade", "sentidos", "inteligencia", "poder_magico", "efeito_futuro"] },
    { table: "gacha_banners", category: "banners", entity: "nome", fields: ["id", "nome", "descricao", "ativo", "permanente", "inicio_em", "fim_em"] },
    { table: "titulos", category: "titles", entity: "nome", fields: ["id", "nome", "descricao", "efeito", "rank"] },
    { table: "passivas", category: "passives", entity: "nome", fields: ["id", "nome", "descricao", "efeito", "rank"] }
];

function digest(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function render(row, fields) { return fields.filter(field => row[field] !== undefined && row[field] !== null && String(row[field]).trim() !== "").map(field => `${field}: ${typeof row[field] === "object" ? JSON.stringify(row[field]) : row[field]}`).join("\n"); }

async function carregarDocumentosDoBanco(projectRoot, options = {}) {
    if (options.enabled === false) return [];
    let database;
    try { database = require(path.join(projectRoot, "packages", "database")); } catch { return []; }
    const documents = [];
    for (const spec of TABLES) {
        let rows;
        try { rows = await database.all(`SELECT * FROM ${spec.table} LIMIT 10000`); } catch { continue; }
        for (const row of rows) {
            const content = render(row, spec.fields); if (!content) continue;
            const identity = row.id ?? `${row.set_id ?? "row"}-${row.required_pieces ?? documents.length}`;
            documents.push({ sourceKey: `database:${spec.table}#${identity}`, source: "database-readonly", file: `database:${spec.table}`, category: spec.category, system: spec.category, entity: String(row[spec.entity] ?? identity), type: "database-row", content, hash: digest(content), mtime: null, metadata: { authoritative: true, table: spec.table, rowId: identity, readOnly: true } });
        }
    }
    return documents;
}

module.exports = { TABLES, carregarDocumentosDoBanco };
