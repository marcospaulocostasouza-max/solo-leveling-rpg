"use strict";
const { CANON, STATUS, VISIBILITY, PERSPECTIVES, TONES, TEMPLATES } = require("./constants");
function issue(code, severity, message) { return { code, severity, message }; }
function validateNarrative(draft, context = {}, options = {}) {
    const issues = [], text = `${draft.title || ""}\n${draft.summary || ""}\n${draft.body || ""}`;
    if (!CANON.includes(draft.canon)) issues.push(issue("NARRATIVE_CANON_INVALID", "CRITICAL", "Estado de canon inválido."));
    if (!STATUS.includes(draft.status)) issues.push(issue("NARRATIVE_STATUS_INVALID", "CRITICAL", "Status narrativo inválido."));
    if (!VISIBILITY.includes(draft.visibility)) issues.push(issue("NARRATIVE_VISIBILITY_INVALID", "CRITICAL", "Visibilidade inválida."));
    if (!PERSPECTIVES.includes(draft.perspective)) issues.push(issue("NARRATIVE_PERSPECTIVE_INVALID", "HIGH", "Perspectiva inválida."));
    if (!TONES.includes(draft.tone)) issues.push(issue("NARRATIVE_TONE_INVALID", "HIGH", "Tom inválido."));
    if (draft.template && !TEMPLATES.includes(draft.template)) issues.push(issue("NARRATIVE_TEMPLATE_INVALID", "HIGH", "Template narrativo inválido."));
    if (context.player_location && context.location && !sameLocation(context.player_location, context.location) && draft.presential !== false) issues.push(issue("CONTINUITY_PLAYER_LOCATION", "CRITICAL", "Cena presencial incompatível com a localização persistente do jogador."));
    if (draft.npc_id && context.npcs?.length === 0) issues.push(issue("CONTINUITY_NPC_UNKNOWN", "CRITICAL", "NPC solicitado não possui perfil oficial disponível."));
    if (draft.event_id && !context.active_events?.some(event => event.id === draft.event_id || event.name === draft.event_id)) issues.push(issue("CONTINUITY_EVENT_INACTIVE", "CRITICAL", "Evento solicitado não está ativo ou agendado."));
    if (draft.visibility !== "ADMIN_ONLY" && draft.visibility !== "SECRET_LORE" && /\b(admin[_ -]?only|segredo|secret lore)\b/i.test(text)) issues.push(issue("META_GAME_SECRET_EXPOSURE", "CRITICAL", "Texto público contém marcador de informação restrita."));
    if (/\b(voc[eê] decide|seu personagem sente|voc[eê] pensa)\b/i.test(text)) issues.push(issue("PLAYER_AGENCY", "HIGH", "Narrativa não pode decidir pensamentos ou ações do jogador."));
    if (options.previousMechanics && JSON.stringify(options.previousMechanics) !== JSON.stringify(draft.mechanics || {})) issues.push(issue("MECHANIC_MUTATION", "CRITICAL", "Revisão textual alterou dados mecânicos."));
    const uniqueEntities = new Set((draft.entities || []).map(entity => String(entity).toLowerCase())); if (uniqueEntities.size !== (draft.entities || []).length) issues.push(issue("NARRATIVE_ENTITY_DUPLICATE", "MEDIUM", "Entidade repetida no conteúdo."));
    return { valid: !issues.some(row => row.severity === "CRITICAL"), issues, score: Math.max(0, 100 - issues.reduce((sum, row) => sum + (row.severity === "CRITICAL" ? 45 : row.severity === "HIGH" ? 20 : 5), 0)) };
}
function sameLocation(location, expected) { const values = typeof location === "string" ? [location] : [location?.city_id, location?.region_id, location?.place_id]; return values.filter(Boolean).map(String).some(value => value.toLowerCase() === String(expected).toLowerCase()); }
module.exports = { validateNarrative, sameLocation };
