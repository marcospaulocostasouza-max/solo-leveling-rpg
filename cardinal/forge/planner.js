"use strict";

const { ForgeError, CODES } = require("./errors");
const TYPE_ALIASES = Object.freeze({
    weapon: ["weapon", "arma", "espada", "lança", "lanca", "arco", "machado", "adaga"], armor: ["armor", "armadura", "elmo", "peitoral", "botas"], accessory: ["accessory", "acessório", "acessorio"], equipment: ["equipment", "equipamento"], consumable: ["consumable", "consumível", "consumivel", "poção", "pocao"], material: ["material"], set: ["set", "conjunto"], passive: ["passive", "passiva"], title: ["title", "título", "titulo"], mission: ["mission", "missão", "missao"], banner: ["banner"], event: ["event", "evento"], dungeon: ["dungeon", "gate"], guild: ["guild", "guilda"]
});
const RULES = Object.freeze({
    weapon: ["item_schema", "equipment_slots", "attributes", "tiers", "passives", "weapon_types"], armor: ["item_schema", "equipment_slots", "attributes", "tiers"], accessory: ["item_schema", "equipment_slots", "attributes", "tiers"], equipment: ["item_schema", "equipment_slots", "attributes", "tiers"], consumable: ["item_schema", "equipment_slots", "tiers", "consumable_rules"], material: ["item_schema", "material_rules", "tiers"], set: ["equipment_sets", "set_items", "set_bonuses"], passive: ["passive_schema", "ranks", "effects"], title: ["title_schema", "ranks", "effects"], mission: ["mission_schema", "ranks", "locations", "rewards"], banner: ["banner_schema", "gacha_pool", "crystals", "pity", "dates"], event: ["event_schema", "rewards", "related_entities"], dungeon: ["dungeon_schema", "ranks", "gates", "rewards", "locations"], guild: ["guild_schema", "guild_levels", "cost", "member_limit", "territories"]
});
function normalize(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function detectType(request, explicit) {
    if (explicit && TYPE_ALIASES[explicit]) return explicit;
    const text = normalize(request);
    for (const [type, aliases] of Object.entries(TYPE_ALIASES)) if (aliases.some(alias => new RegExp(`\\b${normalize(alias)}s?\\b`, "i").test(text))) return type;
    throw new ForgeError(CODES.UNKNOWN_TYPE, "Não foi possível identificar o tipo de conteúdo solicitado.");
}
function extractConstraints(request) {
    const text = String(request || ""); const constraints = {};
    const attributes = text.match(/(\d+)\s+(?:pontos?\s+de\s+)?atributos?/i); if (attributes) constraints.attribute_total = Number(attributes[1]);
    const rank = text.match(/rank[\s-]*([edcbas])\b/i); if (rank) constraints.rank = rank[1].toUpperCase();
    const focus = text.match(/focad[oa]\s+em\s+([^,.]+)/i); if (focus) constraints.focus = focus[1].trim();
    return constraints;
}
function createPlan(request, explicitType) {
    const type = detectType(request, explicitType);
    return { type, intent: "create", request: String(request || "").trim(), constraints: extractConstraints(request), required_rules: RULES[type] };
}
module.exports = { TYPE_ALIASES, RULES, detectType, extractConstraints, createPlan };
