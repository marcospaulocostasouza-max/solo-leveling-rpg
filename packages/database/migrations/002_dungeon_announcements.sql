CREATE TABLE IF NOT EXISTS weekly_dungeon_announcements (
  dungeon_id TEXT PRIMARY KEY,
  announced_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (dungeon_id) REFERENCES weekly_dungeons(id)
);
