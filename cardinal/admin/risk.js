"use strict";
const RISK = Object.freeze({ LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", CRITICAL: "CRITICAL" });
const RISK_BY_TOOL = Object.freeze({ publish_draft: RISK.LOW, give_wons: RISK.MEDIUM, give_crystals: RISK.MEDIUM, give_xp: RISK.MEDIUM, give_mastery: RISK.MEDIUM, give_item: RISK.MEDIUM, activate_banner: RISK.LOW, deactivate_banner: RISK.HIGH, update_dungeon: RISK.HIGH, approve_scene: RISK.MEDIUM, remove_wons: RISK.HIGH, remove_crystals: RISK.HIGH, remove_item: RISK.HIGH, set_wons: RISK.HIGH, set_crystals: RISK.HIGH, adjust_rank: RISK.HIGH, rollback_transaction: RISK.HIGH, delete_data: RISK.CRITICAL, bulk_action: RISK.CRITICAL, reset: RISK.CRITICAL, migrate: RISK.CRITICAL });
function riskFor(tool) { return RISK_BY_TOOL[tool] || RISK.CRITICAL; }
function needsConfirmation(risk, options = {}) { return risk === RISK.CRITICAL || (risk === RISK.HIGH && options.confirmHigh === true); }
module.exports = { RISK, RISK_BY_TOOL, riskFor, needsConfirmation };
