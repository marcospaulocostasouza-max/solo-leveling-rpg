"use strict";
const npcDatabase = require("../../apps/bot/src/ai/npcDatabase");
class NarrativeContextBuilder {
    constructor(options = {}) { this.world = options.world; this.database = options.database; this.memory = options.memory || null; this.lore = options.lore; }
    async build(input = {}) {
        const world = this.world ? await this.world.overview() : { phase: "UNKNOWN", events: [], dungeons: [], banners: [] };
        const player = input.player_id && this.database ? await this.database.get("SELECT id,nome,rank,nivel,guilda FROM jogadores WHERE id=?", [input.player_id]).catch(() => null) : null;
        const playerWorld = input.player_id && this.world ? await this.world.playerContext(input.player_id).catch(() => null) : null;
        const npc = input.npc_id ? npcDatabase.getNPC(input.npc_id).profile : null;
        const memory = this.memory && input.actor ? await this.memory.context(input.actor, input.objective || input.title || "narrativa", { channel_id: "narrative" }).catch(() => null) : null;
        const lore = this.lore ? await this.lore.retrieve([input.title, input.location, input.npc_id, input.objective].filter(Boolean).join(" "), { visibility: input.visibility || "ADMIN_ONLY" }) : [];
        const external = input.external_research ? { external_record_id: input.external_research.external_record_id, record_version: input.external_research.record_version, facts: input.external_research.facts || [], traits: input.external_research.core_traits || [], citations: input.external_research.citations || [], adaptation: input.external_research.adaptation || null } : null;
        return { location: input.location || playerWorld?.location?.city_id || null, time: input.time || new Date().toISOString(), world_phase: world.phase, active_events: world.events.filter(event => ["SCHEDULED", "ACTIVE", "PAUSED"].includes(event.status)), characters: player ? [player] : [], npcs: npc ? [{ id: npc.id, name: npc.name, personality: npc.sections?.personality || npc.json?.personalidade || "", role: npc.sections?.identity || "", knowledge: npc.sections?.knowledge || "" }] : [], recent_history: memory?.memories?.map(row => row.summary || row.content).slice(0, 5) || [], mission: input.mission || null, dungeon: input.dungeon || null, guild: input.guild || player?.guilda || null, territory: input.territory || null, constraints: input.constraints || [], tone: input.tone || "MYSTERIOUS", objective: input.objective || "", lore, external_research: external, context_priority: ["RPG_RULES", "WORLD_STATE", "OFFICIAL_LORE", "EXTERNAL_RESEARCH", "CREATIVITY"], player_location: playerWorld?.location || null };
    }
}
module.exports = { NarrativeContextBuilder };
