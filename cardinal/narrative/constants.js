"use strict";

const CANON = Object.freeze(["CANON", "DRAFT", "ALTERNATIVE", "NON_CANON"]);
const STATUS = Object.freeze(["DRAFT", "REVIEW", "APPROVED", "PUBLISHED"]);
const VISIBILITY = Object.freeze(["PUBLIC", "PLAYER_KNOWN", "CHARACTER_KNOWN", "NPC_KNOWN", "ADMIN_ONLY", "SECRET_LORE"]);
const PERSPECTIVES = Object.freeze(["ADMIN", "NARRATOR", "PLAYER", "NPC", "SYSTEM", "ANNOUNCEMENT"]);
const TONES = Object.freeze(["EPIC", "DARK", "MYSTERIOUS", "COMEDIC", "FORMAL_SYSTEM", "HORROR", "DRAMATIC"]);
const TEMPLATES = Object.freeze(["MISSION_BRIEF", "DUNGEON_INTRO", "BOSS_INTRO", "EVENT_ANNOUNCEMENT", "NPC_BRIEF", "ITEM_LORE", "TITLE_DESCRIPTION", "SCENE_OPENING", "SCENE_CLOSING", "CHRONICLE"]);
const TRUST = Object.freeze(["OFFICIAL_LORE", "SYSTEM_RULE", "WORLD_STATE", "CHARACTER_HISTORY", "ADMIN_DECISION", "DRAFT_LORE", "GENERATED_SUGGESTION"]);
const PROMPT = "Você é o Cardinal Narrator. Escreva somente com os fatos e as restrições recebidos. Não invente fatos oficiais, não revele ADMIN_ONLY ou SECRET_LORE, não controle pensamentos ou ações do jogador e não altere mecânicas em revisões textuais. Conteúdo novo é DRAFT.";

module.exports = { CANON, STATUS, VISIBILITY, PERSPECTIVES, TONES, TEMPLATES, TRUST, PROMPT };
