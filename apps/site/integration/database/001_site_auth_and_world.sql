-- Estrutura proposta para o banco central (PostgreSQL/Supabase).
-- Não substitui automaticamente o SQLite atual: serve para a migração compartilhada Bot + Site.
create table if not exists site_login_tokens (
  id bigserial primary key,
  player_id bigint not null,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);
create table if not exists site_sessions (
  id uuid primary key,
  player_id bigint not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  device_label text
);
create table if not exists character_locations (
  player_id bigint primary key,
  location_id text not null default 'seoul',
  arrived_at timestamptz not null default now(),
  travel_started_at timestamptz,
  travel_destination_id text,
  travel_arrives_at timestamptz
);
create table if not exists weekly_dungeon_participation (
  id bigserial primary key,
  weekly_dungeon_id text not null,
  player_id bigint not null,
  arrived_at timestamptz,
  entered_at timestamptz,
  completed_at timestamptz,
  reward_claimed_at timestamptz,
  unique(player_id, weekly_dungeon_id)
);
