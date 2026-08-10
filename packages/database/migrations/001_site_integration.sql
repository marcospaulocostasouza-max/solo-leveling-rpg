-- SQLite, idempotente e não destrutiva. Aplicada pelo cliente compartilhado.
CREATE TABLE IF NOT EXISTS site_login_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used_at TEXT,
  FOREIGN KEY (player_id) REFERENCES jogadores(id)
);
CREATE INDEX IF NOT EXISTS idx_site_login_tokens_lookup
  ON site_login_tokens(token_hash, expires_at);

CREATE TABLE IF NOT EXISTS site_sessions (
  id TEXT PRIMARY KEY,
  player_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (player_id) REFERENCES jogadores(id)
);
CREATE INDEX IF NOT EXISTS idx_site_sessions_player ON site_sessions(player_id, expires_at);

CREATE TABLE IF NOT EXISTS player_locations (
  player_id INTEGER PRIMARY KEY,
  country TEXT NOT NULL DEFAULT 'Coreia do Sul',
  city_id TEXT NOT NULL DEFAULT 'seoul',
  region_id TEXT,
  place_id TEXT,
  arrived_at TEXT NOT NULL DEFAULT (datetime('now')),
  travel_started_at TEXT,
  travel_destination_id TEXT,
  travel_arrives_at TEXT,
  FOREIGN KEY (player_id) REFERENCES jogadores(id)
);

CREATE TABLE IF NOT EXISTS weekly_dungeons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  gate_type TEXT NOT NULL,
  rank TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  opened_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  reward_won INTEGER NOT NULL DEFAULT 0,
  reward_xp INTEGER NOT NULL DEFAULT 0,
  boss TEXT,
  location_hint TEXT,
  created_by TEXT,
  CHECK (gate_type IN ('common', 'red'))
);

CREATE TABLE IF NOT EXISTS weekly_dungeon_participation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dungeon_id TEXT NOT NULL,
  player_id INTEGER NOT NULL,
  arrived_at TEXT,
  entered_at TEXT,
  completed_at TEXT,
  reward_claimed_at TEXT,
  UNIQUE (dungeon_id, player_id),
  FOREIGN KEY (dungeon_id) REFERENCES weekly_dungeons(id),
  FOREIGN KEY (player_id) REFERENCES jogadores(id)
);
CREATE INDEX IF NOT EXISTS idx_weekly_participation_player
  ON weekly_dungeon_participation(player_id, completed_at);

CREATE TABLE IF NOT EXISTS npc_location_overrides (
  npc_id TEXT PRIMARY KEY,
  base_location_id TEXT,
  possible_locations TEXT,
  min_hour INTEGER,
  max_hour INTEGER,
  spawn_chance REAL,
  conditions_json TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  temporary_location_id TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
