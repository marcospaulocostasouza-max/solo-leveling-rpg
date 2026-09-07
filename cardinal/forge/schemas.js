"use strict";

const ATTRIBUTES = Object.freeze(["forca", "resistencia", "velocidade", "sentidos", "inteligencia", "poder_magico"]);
const ITEM_TYPES = Object.freeze(["weapon", "armor", "accessory", "equipment", "consumable", "material"]);
const RANKS = Object.freeze(["E", "D", "C", "B", "A", "S"]);
const SET_RANKS = Object.freeze(["D", "C", "B", "A", "S"]);
const TIERS = Object.freeze([...RANKS, "Comum", "Incomum", "Raro", "Épico", "Lendário", "Único"]);

const itemProperties = {
    nome: { type: "string" }, categoria: { type: "string" }, slot: { type: "string" }, tier: { type: "string" }, descricao: { type: "string" },
    forca_bonus: { type: "integer", minimum: 0 }, resistencia_bonus: { type: "integer", minimum: 0 }, velocidade_bonus: { type: "integer", minimum: 0 },
    sentidos_bonus: { type: "integer", minimum: 0 }, inteligencia_bonus: { type: "integer", minimum: 0 }, poder_magico_bonus: { type: "integer", minimum: 0 },
    efeito: { type: "string" }, habilidade: { type: "string" }, classe_requerida: { type: "string" }, estilo_requerido: { type: "string" }, preco: { type: "integer", minimum: 0 }, conjunto_item: { type: "boolean" }
};
const SCHEMAS = Object.freeze({
    item: { version: 1, required: ["nome", "categoria", "slot", "tier", "descricao"], properties: itemProperties },
    material: { version: 1, required: ["nome", "categoria", "tier", "descricao"], properties: { nome: { type: "string" }, categoria: { type: "string" }, tier: { type: "string" }, descricao: { type: "string" }, efeito: { type: "string" }, preco: { type: "integer", minimum: 0 } } },
    set: { version: 1, required: ["nome", "descricao", "rank", "itens", "estagios"], properties: { nome: { type: "string" }, descricao: { type: "string" }, rank: { type: "string" }, itens: { type: "array" }, estagios: { type: "array" } } },
    passive: { version: 1, required: ["nome", "categoria", "rank", "descricao", "efeito", "condicao"], properties: { nome: { type: "string" }, categoria: { type: "string" }, rank: { type: "string" }, descricao: { type: "string" }, efeito: { type: "string" }, condicao: { type: "string" } } },
    title: { version: 1, required: ["nome", "categoria", "rank", "descricao", "efeito", "condicao"], properties: { nome: { type: "string" }, categoria: { type: "string" }, rank: { type: "string" }, descricao: { type: "string" }, efeito: { type: "string" }, condicao: { type: "string" } } },
    mission: { version: 1, required: ["nome", "descricao", "tipo", "objetivo", "rank", "recompensa_xp", "recompensa_won"], properties: { nome: { type: "string" }, descricao: { type: "string" }, tipo: { type: "string" }, objetivo: { type: "integer" }, rank: { type: "string" }, local: { type: "string" }, npc: { type: "string" }, recompensa_xp: { type: "integer" }, recompensa_won: { type: "integer" }, recompensa_itens: { type: "array" }, prerequisitos: { type: "array" }, tempo: { type: ["string", "null"] }, repetivel: { type: "boolean" } } },
    banner: { version: 1, required: ["nome", "descricao", "permanente", "pool"], properties: { nome: { type: "string" }, descricao: { type: "string" }, permanente: { type: "boolean" }, inicio_em: { type: ["string", "null"] }, fim_em: { type: ["string", "null"] }, pool: { type: "array" }, custo_cristais: { type: ["integer", "null"] }, hard_pity: { type: ["integer", "null"] } } },
    event: { version: 1, required: ["nome", "descricao", "recompensa"], properties: { nome: { type: "string" }, descricao: { type: "string" }, recompensa: { type: "string" }, ativo: { type: "boolean" }, referencias: { type: "array" } } },
    dungeon: { version: 1, required: ["nome", "rank", "andar", "descricao", "boss", "recompensa_xp", "recompensa_won"], properties: { nome: { type: "string" }, rank: { type: "string" }, andar: { type: "integer" }, descricao: { type: "string" }, boss: { type: "string" }, gate_tipo: { type: ["string", "null"] }, local: { type: ["string", "null"] }, recompensa_xp: { type: "integer" }, recompensa_won: { type: "integer" } } },
    guild: { version: 1, required: ["nome", "nivel", "valor", "territorio", "membros", "passivas"], properties: { nome: { type: "string" }, descricao: { type: "string" }, nivel: { type: "integer" }, valor: { type: "integer" }, territorio: { type: "integer" }, membros: { type: "integer" }, passivas: { type: "string" }, hierarquia: { type: "array" } } }
});

function schemaFor(type) { return SCHEMAS[type === "material" ? "material" : ITEM_TYPES.includes(type) ? "item" : type] || null; }
module.exports = { ATTRIBUTES, ITEM_TYPES, RANKS, SET_RANKS, TIERS, SCHEMAS, schemaFor };
