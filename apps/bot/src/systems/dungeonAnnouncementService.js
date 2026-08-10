"use strict";

// Notification is opt-in: no group id is embedded in source code.
const MessageService = require("../core/messageService");
const shared = require("../../../../packages/database");

async function announcePending() {
  const groupId = process.env.DUNGEON_ANNOUNCEMENT_GROUP_ID;
  if (!groupId) return;
  await shared.applyMigrations();
  const dungeons = await shared.all("SELECT d.* FROM weekly_dungeons d LEFT JOIN weekly_dungeon_announcements a ON a.dungeon_id = d.id WHERE d.status = 'open' AND d.expires_at > ? AND a.dungeon_id IS NULL", [new Date().toISOString()]);
  for (const dungeon of dungeons) {
    const hours = Math.max(0, Math.ceil((new Date(dungeon.expires_at).getTime() - Date.now()) / 3600000));
    const text = `DUNGEON SEMANAL ABERTA\n\n${dungeon.name}\nRank: ${dungeon.rank}\nGate: ${dungeon.gate_type === 'red' ? 'Vermelho' : 'Comum'}\nRegião aproximada: ${dungeon.location_hint || 'coordenadas no mapa'}\nTempo restante: ~${hours}h\n${process.env.SITE_BASE_URL || 'Site não configurado'}`;
    const result = await MessageService.send({ chatId: groupId, text });
    if (result.sucesso) await shared.run("INSERT OR IGNORE INTO weekly_dungeon_announcements (dungeon_id) VALUES (?)", [dungeon.id]);
  }
}
function iniciar() { announcePending().catch(error => console.error("[DungeonAnnouncements]", error.message)); return setInterval(() => announcePending().catch(error => console.error("[DungeonAnnouncements]", error.message)), 60_000); }
module.exports = { iniciar, announcePending };
