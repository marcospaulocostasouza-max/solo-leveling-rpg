# Cutover PostgreSQL

Data: 2026-08-10. Publicacao externa: nao realizada.

## Fonte de dados atual

Com `DATABASE_PROVIDER=postgres` no `.env` local, bot e site usam a mesma base PostgreSQL configurada por `DATABASE_URL_SERVERLESS` (com fallback para `DATABASE_URL`). A credencial permanece exclusiva do ambiente server-side e nao e registrada por scripts ou logs.

| Area | Fonte em runtime |
| --- | --- |
| Personagens, atributos e economia | PostgreSQL (`jogadores`, `transacoes`, `compras`) |
| Inventario e equipamentos | PostgreSQL (`inventario_jogador`, `itens`) |
| Localizacao, sessoes e login | PostgreSQL (`player_locations`, `site_sessions`, `site_login_tokens`) |
| Dungeons e participacoes | PostgreSQL (`weekly_dungeons`, `weekly_dungeon_participation`, `participacao_dungeon`) |
| Missoes, NPCs, tecnicas e dados compartilhados restantes | PostgreSQL |

## Modulos em PostgreSQL

- `packages/database/index.js`: camada usada pelas rotas server-side do site. Em PostgreSQL, transacoes, leituras e escritas sao encaminhadas ao pool do servidor.
- `apps/bot/src/core/database.js`: usa o adaptador de callbacks PostgreSQL quando o provider e `postgres`, cobrindo os comandos legados sem alterar cache do WhatsApp.
- `packages/database/postgres-compat.js`: converte placeholders e as construcoes SQLite mais usadas (`datetime('now')` e `INSERT OR IGNORE`) para PostgreSQL.

## SQLite mantido somente para rollback

- `apps/bot/src/database/rpg.db` continua como snapshot local de rollback.
- `backups/database/rpg-before-postgres.db` e o backup anterior a migracao.
- `scripts/db-audit.js`, `scripts/migrate-sqlite-to-postgres.js` e `scripts/db-verify.js` leem SQLite apenas para auditoria, importacao e comparacao. Nenhum deles e chamado no runtime de bot ou site.
- O ramo SQLite de `apps/bot/src/core/database.js` so e selecionado se o provider for definido explicitamente como `sqlite` para rollback.

## Nao alterado

Caches efemeros do WhatsApp (`.wwebjs_auth`, `.wwebjs_cache`), dados de catalogo JSON e artefatos de build nao foram migrados nem modificados.

## Riscos e observacoes

- O adaptador preserva as operacoes SQLite usadas hoje, mas SQL novo deve usar PostgreSQL nativo e a camada `packages/database`; nao introduza `PRAGMA`, `AUTOINCREMENT` ou DDL SQLite em novos comandos.
- `INSERT OR REPLACE` nao tem equivalencia universal automatica; novos fluxos de upsert devem declarar o alvo de conflito explicitamente.
- O pooler atual exigiu `DATABASE_SSL_REJECT_UNAUTHORIZED=false` por causa da cadeia TLS local. Antes de producao, corrija a cadeia de certificados da maquina e retorne a verificacao para `true`.
- O banco PostgreSQL foi populado e as 87 tabelas tiveram contagens conferidas contra SQLite antes do cutover.

## Testes executados

1. `npm run db:test-cutover`
   - o adaptador do bot incrementou `won` em um jogador existente;
   - a camada do site leu o novo valor no PostgreSQL;
   - a camada do site restaurou o valor;
   - o adaptador do bot confirmou o valor restaurado.
   - Resultado: aprovado, sem alteracao financeira liquida.
2. `npm --prefix apps/site run build`: aprovado.
3. `npm --prefix apps/bot test`: aprovado.
