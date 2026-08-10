# Migrations SQLite

O banco em uso permanece `apps/bot/src/database/rpg.db`. Migrations são SQL idempotente em
`packages/database/migrations`, aplicadas pelo cliente compartilhado e registradas em
`schema_migrations`. Não há migration destrutiva nem migração para Supabase/PostgreSQL.

## 001_site_integration.sql

Cria sem remover tabelas ou colunas existentes:

- `site_login_tokens`: hash SHA-256, uso único e expiração;
- `site_sessions`: sessões HTTP opacas;
- `player_locations`: país/cidade/região/local persistentes, com Seoul como padrão;
- `weekly_dungeons` e `weekly_dungeon_participation`: coordenadas e participação;
- `npc_location_overrides`: infraestrutura configurável de rotina/localização.

Antes de qualquer migration futura, copie o arquivo SQLite para `backups/` com data/hora.
Uma migration deve ser idempotente, ter rollback possível e nunca recriar as tabelas legadas.

## 002_dungeon_announcements.sql

Cria `weekly_dungeon_announcements`, que impede que o serviço do bot envie repetidamente o aviso
de um mesmo Gate. O envio é opcional e requer `DUNGEON_ANNOUNCEMENT_GROUP_ID`.
