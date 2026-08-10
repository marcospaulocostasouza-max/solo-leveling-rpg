# Auditoria de integração — SOLO LEVELING RPG

Data: 2026-08-10. Esta auditoria foi realizada antes da primeira alteração de comportamento.

## Fonte oficial atual

O bot em `apps/bot` é a fonte oficial das regras já em produção. Seu banco é o SQLite
`apps/bot/src/database/rpg.db`, aberto por `apps/bot/src/core/database.js`. A entrada é
`apps/bot/index.js`, que delega para `apps/bot/src/index.js`.

As regras de inventário vivem em `src/systems/inventorySystem.js`; atributos em
`src/systems/atributoSystem.js`; Won em `src/systems/economySystem.js`; e Maestria nas
rotinas de técnicas, especialmente `commands/comprarTecnica.js` e `tecnicas/sistemaMaestria.js`.

## Schema relevante do SQLite

- Personagem: `jogadores`, `fichas`, `fichas_pendentes`, `aprovacao_fichas`.
- Itens: `itens`, `itens_iniciais`, `inventario_jogador`, `compras`, `transacoes`,
  `vendas_pendentes`.
- Técnicas: `tecnicas`, `jogador_tecnicas`, `historico_tecnicas`.
- Mundo: `guildas`, `guilda_membros`, `guerras_guildas`, `dungeons`, `jogador_dungeons`,
  `fichas_dungeon`, `participacao_dungeon`, `premios_dungeon`.
- Missões/NPC: `missions`, `player_missions`, `missoes`, `npc_memories`, `npc_emotions`,
  `npc_moods`, `npc_relationships`, `npc_cenas_ativas` e tabelas relacionadas.
- Arena/forja/mineração: `arena_historico`, `batalhas`, `forja_historico`,
  `forja_sessoes`; mineração ainda não tem modelo central normalizado.

## Catálogos oficiais e legados

Itens de loja vêm de `src/utils/lojaItens.js`; itens persistidos vêm da tabela `itens`.
Existem catálogos legados complementares em `src/database/*.json` e no catálogo de forja.
Técnicas são registradas no SQLite a partir de `src/tecnicas/iniciais` e
`src/tecnicas/avancadas/techniques.js`. Títulos, passivas, locais, investimentos e
territórios legados estão em `src/database/data`. NPCs reais estão em `src/npc/data`.

## Regras confirmadas

Os atributos oficiais são Força, Resistência, Velocidade, Sentidos, Inteligência e Poder
Mágico. O total persistido é base + bônus de classe + buffs existentes + equipamentos.

Slots oficiais: Cabeça (1), Corpo (1), Acessórios (4), Item de Apoio (1), Pernas (2),
Pés (1), Arma 1/1FP (2) e Arma 2/2FP (1). Arma 2 desequipa Armas 1 e bloqueia seus slots.

Won (`jogadores.won`) e Maestria (`jogadores.maestria`) são recursos distintos. Maestria
é hoje gasto para adquirir técnicas; o custo normal é progressivo e técnicas avançadas usam
custo fixo. Não há regra oficial de Maestria por tipo de arma no banco atual.

## Estado do site e conflitos

O site V4 ainda é client-side e mantém personagem, inventário, habilidades, NPCs, ranking,
guildas, viagens e compras demonstrativos. Os arquivos em `public/data` são visuais, não
uma fonte de verdade. `world.json` contém guilda e domínio mockados, contrariando o estado
inicial definido para o novo mapa.

A migration em `apps/site/integration/database` é um protótipo PostgreSQL/Supabase e não
deve ser executada nesta etapa: a integração real continua em SQLite. O `!site` naquela pasta
também é somente um modelo não registrado no roteador do bot.

## Riscos preservados para correção incremental

- Compra de item e técnica no bot possuem múltiplas gravações sem uma transação única.
- A classificação de slots por texto possui compatibilidades legadas (por exemplo, escudo).
- `jogadores.localizacao` é texto livre; não há localização hierárquica nem viagem validada.
- NPCs têm localização narrativa, mas não coordenadas/rotina normalizadas.
- A IA real (`npcServiceV2`, Ollama, memória, emoção, mood, relacionamento e runtime) não
  será exposta ao navegador nem reescrita.

## Decisão de integração

`packages/database` passa a ser a porta server-side para o mesmo SQLite do bot. O site nunca
recebe caminho do banco ou SQL. Regras extraídas para `packages/rpg-core` serão incrementais;
o bot existente continua sendo compatível e os catálogos antigos não serão removidos.
