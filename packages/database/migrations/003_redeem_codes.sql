CREATE TABLE IF NOT EXISTS redeem_codes (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 code TEXT NOT NULL UNIQUE CHECK(code = UPPER(TRIM(code))),
 description TEXT NOT NULL DEFAULT '',
 rewards_json TEXT NOT NULL,
 starts_at TEXT NOT NULL,
 expires_at TEXT,
 max_global_uses INTEGER CHECK(max_global_uses IS NULL OR max_global_uses > 0),
 current_uses INTEGER NOT NULL DEFAULT 0 CHECK(current_uses >= 0),
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
 created_by TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS redeem_code_claims (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 redeem_code_id INTEGER NOT NULL REFERENCES redeem_codes(id),
 player_id INTEGER NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
 rewards_json TEXT NOT NULL,
 claimed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(redeem_code_id,player_id)
);
CREATE INDEX IF NOT EXISTS idx_redeem_claims_player ON redeem_code_claims(player_id);
CREATE TABLE IF NOT EXISTS redeem_creation_sessions (
 actor TEXT PRIMARY KEY,
 chat TEXT NOT NULL,
 state_json TEXT NOT NULL,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
