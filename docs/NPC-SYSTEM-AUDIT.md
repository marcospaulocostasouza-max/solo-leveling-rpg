# Auditoria do sistema de NPCs

Data: 2026-08-14. Escopo limitado ao sistema de NPCs e às dependências diretas. Não houve deploy, push, exclusão de dados reais ou migração geral do banco.

## Arquitetura encontrada

- Bot: `apps/bot/src/npc` mantém catálogo, cenas, memória, emoções, humor, relacionamento, presentes e histórico em memória; `apps/bot/src/ai` é a pipeline narrativa atual; `apps/bot/src/ia` é o fallback legado; `npcConversa.js` e `fimInteracao.js` iniciam/continuam/encerram cenas.
- Dados narrativos: 75 perfis JSON em `apps/bot/src/npc/data` após a inclusão de Bilac. IDs são únicos; `ophilia` e `ophilia_clement` são perfis distintos.
- Banco: o adaptador de `apps/bot/src/core/database.js` encaminha para `packages/database/postgres-compat.js` quando `DATABASE_PROVIDER=postgres`. O site usa `packages/database/index.js`.
- Site: `apps/site/app/npcs/page.tsx`, `HunterPortal.tsx`, `GET /api/npcs` e `GET /api/npcs/[npcId]/interaction`.

## Tabelas verificadas no PostgreSQL

| Tabela | Uso/resultado |
| --- | --- |
| `npc_memories` | Persistência por `npcId + jogadorId`; criação, leitura, atualização e isolamento testados. |
| `npc_relationships` | Vínculo/hostilidade por NPC+jogador; limites e isolamento testados. |
| `npc_emotions` | Emoção por NPC+jogador; pipeline atual e fallback ajustados para não usar emoção global de outro jogador. |
| `npc_moods` | Humor persistente global do NPC, conforme desenho atual. |
| `npc_scene_emotions` | Legado global; não é mais usado para montar o contexto atual por jogador. |
| `npc_cenas_ativas` | Exclusividade de uma cena por jogador e de um jogador por NPC testada. |
| `npc_cooldowns_cena` | Cooldown persistente em UTC/ISO testado. |
| `npc_resumos_cena` | Resumo por NPC+jogador; UPSERT compatível com PostgreSQL corrigido. |
| `npc_gifts` | Registro e alteração de vínculo agora participam da mesma transação do inventário. |
| `npc_location_overrides` | Estrutura válida, mas sem registros configurados no ambiente auditado. |
| `npc_affinity` | Não existe e não há código ativo que implemente um segundo sistema de afinidade. Não foi criado nem unido a relacionamento. |

## Bugs encontrados e correções

Foram encontrados 16 problemas de NPC; 14 foram corrigidos.

1. Colunas camelCase de cena/cooldown eram consultadas sem aspas no PostgreSQL: corrigido.
2. O fim de interação dependia apenas do histórico em RAM e perdia a cena após reinício: passou a consultar `npc_cenas_ativas`.
3. O comando de encerramento podia discordar sobre qual NPC estava ativo: corrigido usando a cena persistida do jogador.
4. Texto abaixo do comando do NPC podia ser cortado ou interpretado incorretamente: parser normalizado e testado nos 75 NPCs.
5. `PRAGMA` do fluxo de missão disparava erro após a resposta do NPC em PostgreSQL: inspeção passou a respeitar o provider.
6. `npc_relationships` tinha DDL e queries SQLite/camelCase incompatíveis: corrigido.
7. `npc_memories` tinha DDL, insert e queries incompatíveis com PostgreSQL: corrigido.
8. `npc_emotions` e `npc_scene_emotions` tinham UPSERT/data/identificadores incompatíveis: corrigido.
9. A pipeline usava emoção global por NPC, permitindo que o próximo jogador herdasse estado privado: contexto e atualização agora usam `npc_emotions` por NPC+jogador.
10. `npc_moods` usava `INSERT OR REPLACE`: substituído por UPSERT portável.
11. `npc_gifts` usava sintaxe SQLite para mês, IDs e UPSERT: corrigido.
12. Presente removia item e atualizava relacionamento em operações separadas: agora é transação atômica.
13. Resumo de cena usava `INSERT OR REPLACE`: substituído por `ON CONFLICT`.
14. `/api/npcs` devolvia somente mock parcial do JSON: agora combina perfis reais com relacionamento, cena e override do jogador autenticado; IDs de outros jogadores não são expostos.
15. A página atual ainda não oferece busca/filtros/detalhes completos nem inicia narrativa no site: **NECESSITA TESTE MANUAL / IMPLEMENTAÇÃO DE PRODUTO**.
16. Não há overrides estruturados para NPCs; por segurança a API presencial nega interação sem configuração, mas o bot legado ainda não pode impor equivalência de região sem mapear os textos livres dos 75 perfis: **NECESSITA TESTE MANUAL / CONFIGURAÇÃO**.

As rotas de NPC passaram a validar sessão e `npcId`, confirmar existência do arquivo, tratar 400/401/403/404/500, sempre retornar JSON e não retornar stack trace. O `player_id` não é aceito do frontend.

## Fluxos e isolamento

O teste integrado controlado criou NPC e jogadores temporários, salvou memórias distintas, recarregou o módulo (simulação de reinício), recuperou a memória A, comprovou que B não a recebe, alterou somente o relacionamento A, gravou emoções diferentes, iniciou uma cena, bloqueou concorrência, encerrou e confirmou cooldown. Todos os registros de teste foram removidos; nenhum dado real foi apagado.

O contexto atual inclui perfil/personalidade, jogador atual, emoção por jogador, humor, relacionamento, memórias recuperadas, trechos relevantes e histórico recente limitado. A recuperação é indexada logicamente por `npcId:playerId`, evitando mistura em RAM e no banco. Resumos persistem, mas a pipeline nova ainda não os inclui explicitamente no prompt; isso fica como risco de continuidade longa.

## Performance

- Teste integrado de banco (memória, relacionamento, emoção, mood, cena e cooldown): 1.000 ms no total no ambiente remoto.
- Logs reais recentes: o pipeline local normalmente consumiu 8–137 ms, enquanto o modelo consumiu aproximadamente 37–60 s nas respostas recentes e chegou a 133–143 s em amostras antigas. O gargalo predominante é o Ollama, não banco ou montagem de prompt.
- Uma amostra teve `contextMs` de 13,3 s, exceção que merece monitoramento; não foi reduzida a qualidade narrativa nem o limite de saída.
- Média das 10 amostras mais recentes: 54.313 ms totais, sendo 54.265 ms no modelo, 25 ms no contexto e 16 ms na montagem do prompt. Uma nova medição ponta a ponta exige Ollama ativo: **NECESSITA TESTE MANUAL**.

## Testes executados

- `npm --prefix apps/site run build`: passou, incluindo as duas rotas dinâmicas de NPC.
- `npm --prefix apps/bot test`: passou (10 cenários da arquitetura narrativa da Ophilia).
- `node apps/bot/tests/npcConversationParsing.test.js`: 2/2; todos os 75 NPCs reconhecidos.
- `node apps/bot/tests/giftSystem.test.js`: passou.
- `node apps/bot/tests/battleRelationship.test.js`: passou.
- Integração PostgreSQL temporária: memória A/B, reload, relacionamento A/B, emoção A/B, mood, cena concorrente e cooldown passaram.

## Riscos e testes manuais restantes

- Android e desktop da aba preservada precisam de inspeção visual e teste de sessão real.
- A página lista dados reais, mas busca/filtros/modal e uma ação narrativa completa no site não existem no redesign atual.
- Configurar e validar `npc_location_overrides` para os 75 NPCs; textos livres como “Templos de Hallasan” não podem ser convertidos em IDs de cidade/região sem uma decisão de conteúdo.
- Aparições aleatórias possuem apenas campos de configuração (`spawn_chance`, horários e possíveis locais); não foi encontrada rotina ativa. Nenhuma regra nova foi inventada.
- Validar presente ponta a ponta com um item real e um usuário de teste, embora avaliação e atomicidade tenham testes técnicos.
- Validar uma conversa real com Ollama, encerramento, resumo e retorno em nova cena para confirmar qualidade narrativa e latência no hardware de produção.

## Complemento: listagem e expiração de cenas

- Somente `!listar npcs` abre a listagem completa; `!npc` abre o guia. Foram verificados 75/75 IDs, enviados em mensagens menores por categoria para evitar truncamento do WhatsApp.
- `!missoes npc <id>` continua reservado à consulta de missões e não é mais confundido com `!npcs`.
- `!admin encerrar cenas npc` (alias `!admin encerrar interacoes npc`) exige administrador, encerra todas as cenas e remove cooldowns para liberar NPCs e jogadores imediatamente.
- Cenas com mais de 24 horas são encerradas no boot e verificadas novamente a cada 10 minutos. Expiração automática não cria cooldown.
- Durante a ativação da regra, quatro cenas reais que já ultrapassavam 24 horas foram encerradas. A operação é a nova regra solicitada e não remove memória, relacionamento, emoção ou resumo.
