# Núcleo 7 — distribuição de Cristais

Os valores econômicos ficam em `apps/bot/src/config/crystalRewards.js`. Todos estão desativados (`null` ou peso `0`) até aprovação de balanceamento.

| Fonte | Integração | Limite herdado | Repetição e proteção |
|---|---|---|---|
| Dungeon auto-narrada/instanciada | conclusão e premiação geral | uma participação semanal | jogador + origem + ID da ficha |
| Dungeon semanal | ponto de integração preparado; o projeto ainda não possui conclusão/claim | regras do futuro fluxo | jogador + origem + ID da conclusão |
| Caixa de treino diário | entrada opcional no pool da Caixa de Item | caixa consumida; treino/Quest diária usa os limites existentes | ID da linha da caixa + número da unidade |
| Missão (`QuestSystem`) | campo opcional `recompensa_cristais` | status da missão | jogador + origem + ID da missão |
| Evento | API preparada; não há distribuidor real de eventos | definido pelo evento futuro | jogador + origem + eventRewardId |
| Boss | API preparada; não há distribuidor real de bosses/participantes | definido pelo fluxo futuro | jogador + origem + bossKillId |
| Administração | `!+cristais Nome Valor`, somente após validação ADM existente | permissão administrativa | referência única do comando e log ADM |

## Riscos encontrados

- A Dungeon Instanciada entrega XP e Won em operações legadas separadas. Cristais são transacionais e idempotentes, mas a recompensa completa ainda não possui uma única transação compartilhada.
- `abrirCaixa` usa inventário agregado por item, sem uma entidade individual de caixa. A referência usa a linha e a posição da unidade; a proteção de Cristais impede o mesmo claim, mas o fluxo legado inteiro de caixa não possui bloqueio transacional entre consumo e entrega.
- `missionManager` armazena definições e progresso, mas não possui entrega real de XP/Won/itens; criar uma entrega ali duplicaria o `QuestSystem`. Por isso a integração ativa foi feita no `QuestSystem`.
- Dungeon Semanal, eventos e bosses não possuem conclusão/participantes/recompensa central implementados. Apenas APIs idempotentes foram preparadas; conectá-las sem esses dados criaria mecânicas novas, fora do Núcleo 7.
- Não existe recompensa oficial aprovada em Cristais. Nenhuma fonte fica ativa por padrão.
