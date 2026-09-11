"use strict";
const { riskFor } = require("./risk");
const { AdminError, CODES } = require("./errors");
function amount(text) { const match = String(text).match(/([\d.]+)\s*(milh(?:ão|ao|oes|ões)|mil)?/i); if (!match) return null; const base = Number(match[1].replace(/\./g, "")); return Math.trunc(base * (/milh/i.test(match[2] || "") ? 1000000 : /mil/i.test(match[2] || "") ? 1000 : 1)); }
function playerName(value) { return String(value || "").replace(/^\s*(?:o|a)?\s*(?:jogador|player)\s+/i, "").trim(); }
function itemGrant(text) { const order = String(text || "").match(/^(?:de|adicione|entregue|conceda|dar)\s+(.+?)\s+para\s+(?:jogador\s+)?(.+)$/); if (!order) return null; const payload = order[1].trim().replace(/^o\s+/, ""), item = payload.match(/^(?:(\d+)\s+)?(?:item|itens)\s+(.+)$/); return item ? { quantity: Number(item[1] || 1), item: item[2].trim(), player: order[2].trim() } : null; }
function planNatural(text) { const raw = String(text || "").trim(); const normalized = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); let tool, parameters = {};
    let match;
    if ((parameters = itemGrant(normalized))) { tool = "give_item"; }
    else if ((match = normalized.match(/(?:de|adicione|conceda|entregue|dar|adicionar)\s+(.+?)\s+won\s+(?:para|ao?)\s+(.+)$/))) { tool = "give_wons"; parameters = { amount: amount(match[1]), player: match[2] }; }
    else if ((match = normalized.match(/(?:de|adicione|conceda|entregue|dar|adicionar)\s+(.+?)\s+cristais?\s+(?:para|ao?)\s+(.+)$/))) { tool = "give_crystals"; parameters = { amount: amount(match[1]), player: match[2] }; }
    else if ((match = normalized.match(/(?:de|adicione|conceda|entregue|dar|adicionar)\s+(.+?)\s+(?:de\s+)?(?:xp|experiencia)\s+(?:para|ao?)\s+(?:jogador\s+)?(.+)$/))) { tool = "give_xp"; parameters = { amount: amount(match[1]), player: match[2] }; }
    else if ((match = normalized.match(/(?:de|adicione|conceda|entregue|dar|adicionar)\s+(.+?)\s+(?:de\s+)?maestria\s+(?:para|ao?)\s+(?:jogador\s+)?(.+)$/))) { tool = "give_mastery"; parameters = { amount: amount(match[1]), player: match[2] }; }
    else if ((match = normalized.match(/publique\s+(?:o\s+draft\s+)?(draft_[a-z0-9-]+)/))) { tool = "publish_draft"; parameters = { draft_id: match[1] }; }
    else if ((match = normalized.match(/publique\s+(?:a|o)?\s*([^,.]+?)(?:\s+que\s+acabamos.*)?$/))) { tool = "publish_draft"; parameters = { draft_name: match[1].trim() }; }
    else if ((match = normalized.match(/ative\s+(?:o\s+)?banner\s+(.+)$/))) { tool = "activate_banner"; parameters = { banner: match[1] }; }
    else if ((match = normalized.match(/aprove\s+(?:a\s+)?cena\s+(\d+)/))) { tool = "approve_scene"; parameters = { scene_id: Number(match[1]) }; }
    else throw new AdminError(CODES.INVALID_INPUT, "Não foi possível montar um Action Plan seguro para a ordem.");
    if (parameters.player) parameters.player = playerName(parameters.player);
    return { intent: tool, target: { player: parameters.player }, parameters, risk: riskFor(tool), tools: parameters.player ? ["get_player", tool] : [tool], original_message: raw };
}
module.exports = { planNatural, amount, itemGrant, playerName };
