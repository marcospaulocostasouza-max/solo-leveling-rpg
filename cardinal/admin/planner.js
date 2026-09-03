"use strict";
const { riskFor } = require("./risk");
const { AdminError, CODES } = require("./errors");
function amount(text) { const match = String(text).match(/([\d.]+)\s*(milh(?:ão|ao|oes|ões)|mil)?/i); if (!match) return null; const base = Number(match[1].replace(/\./g, "")); return Math.trunc(base * (/milh/i.test(match[2] || "") ? 1000000 : /mil/i.test(match[2] || "") ? 1000 : 1)); }
function planNatural(text) { const raw = String(text || "").trim(); const normalized = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); let tool, parameters = {};
    let match;
    if ((match = normalized.match(/(?:de|adicione)\s+(.+?)\s+won\s+(?:para|ao?)\s+(.+)$/))) { tool = "give_wons"; parameters = { amount: amount(match[1]), player: match[2] }; }
    else if ((match = normalized.match(/(?:de|adicione)\s+(.+?)\s+cristais?\s+(?:para|ao?)\s+(.+)$/))) { tool = "give_crystals"; parameters = { amount: amount(match[1]), player: match[2] }; }
    else if ((match = normalized.match(/(?:de|adicione)\s+(.+?)\s+(?:de\s+)?maestria\s+(?:para|ao?)\s+(?:jogador\s+)?(.+)$/))) { tool = "give_mastery"; parameters = { amount: amount(match[1]), player: match[2] }; }
    else if ((match = normalized.match(/publique\s+(?:o\s+draft\s+)?(draft_[a-z0-9-]+)/))) { tool = "publish_draft"; parameters = { draft_id: match[1] }; }
    else if ((match = normalized.match(/publique\s+(?:a|o)?\s*([^,.]+?)(?:\s+que\s+acabamos.*)?$/))) { tool = "publish_draft"; parameters = { draft_name: match[1].trim() }; }
    else if ((match = normalized.match(/ative\s+(?:o\s+)?banner\s+(.+)$/))) { tool = "activate_banner"; parameters = { banner: match[1] }; }
    else if ((match = normalized.match(/aprove\s+(?:a\s+)?cena\s+(\d+)/))) { tool = "approve_scene"; parameters = { scene_id: Number(match[1]) }; }
    else throw new AdminError(CODES.INVALID_INPUT, "Não foi possível montar um Action Plan seguro para a ordem.");
    return { intent: tool, target: { player: parameters.player }, parameters, risk: riskFor(tool), tools: parameters.player ? ["get_player", tool] : [tool], original_message: raw };
}
module.exports = { planNatural, amount };
