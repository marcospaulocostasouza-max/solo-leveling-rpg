# Auditoria SQLite → PostgreSQL

O SQLite oficial é `apps/bot/src/database/rpg.db`, aberto por `apps/bot/src/core/database.js`
via `sqlite3`. A auditoria encontrou 87 tabelas, 4 índices explícitos, nenhuma view e nenhum
trigger. O backup imutável correspondente está em `backups/database/rpg-before-postgres.db`.

Tabelas com dados relevantes: `jogadores` (3), `itens` (30), `inventario_jogador` (4),
`tecnicas` (583), `compras` (4), `transacoes` (4), `missoes` (3), `missions` (3),
`npc_memories` (7), `npc_emotions` (6), `npc_relationships` (5), `npc_cenas_ativas` (3),
`elementos` (18), `estilos_luta` (42), `fichas_pendentes` (3), `sorteios_dungeon` (3) e as
tabelas de login/localização/Dungeon criadas pela integração.

## Dependências

O bot depende da interface callback do `sqlite3` em `src/core/database.js`. Consultas adicionais
diretas foram encontradas em `questSystem.js` e `relationshipManager.js`; o restante dos comandos
normalmente importa a conexão central. A camada `packages/database` é usada pelo site e ainda
opera SQLite durante o período dual.

## Incompatibilidades

- `?`, `AUTOINCREMENT`, `INSERT OR IGNORE`, `datetime('now')`, `strftime` e `PRAGMA` não são
  sintaxe PostgreSQL direta.
- Booleanos são geralmente `INTEGER` 0/1; na primeira migração serão mantidos como inteiros para
  compatibilidade de comandos existentes.
- JSON, datas e textos longos serão mantidos como `TEXT`; não haverá conversão automática para
  JSONB/timestamp.
- IDs existentes serão inseridos explicitamente e sequences PostgreSQL serão ajustadas ao final.

Nenhum cache de IA em RAM será migrado. Memórias, mood, emoção e relacionamentos que já estão em
tabelas persistentes serão migrados como dados normais.
