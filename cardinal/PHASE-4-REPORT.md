# Relatório — Cardinal Publisher & Administrator Fase 4

Data: 2026-09-03.

## 1. Tools implementadas

A allowlist possui 20 tools determinísticas: `get_player`, `publish_draft`, `give_wons`, `remove_wons`, `set_wons`, `give_crystals`, `remove_crystals`, `set_crystals`, `give_xp`, `give_mastery`, `give_item`, `remove_item`, `adjust_rank`, `activate_banner`, `deactivate_banner`, `edit_banner`, `update_mission`, `update_dungeon`, `edit_guild` e `approve_scene`.

`approve_scene` é intencionalmente bloqueada com `CARDINAL_OPERATION_UNSUPPORTED`: o projeto não possui tabela oficial de cenas pendentes/aprováveis por ID. A tool existe para fornecer recusa estruturada, não para simular uma integração inexistente.

O Publisher suporta os tipos Forge nas estruturas oficiais: itens/equipamentos, consumíveis, materiais, conjuntos, passivas, títulos, missões, banners e pools, eventos, Dungeons e modelos inativos de guilda. Draft inválido, duplicado, desatualizado ou com dependência ausente não é publicado.

## 2. Permissões e riscos

RBAC implementado: `CARDINAL_READ`, `CARDINAL_FORGE`, `CARDINAL_PUBLISH`, `CARDINAL_ECONOMY`, `CARDINAL_PLAYER_ADMIN`, `CARDINAL_SCENE_ADMIN`, `CARDINAL_MISSION_ADMIN`, `CARDINAL_BANNER_ADMIN`, `CARDINAL_DUNGEON_ADMIN`, `CARDINAL_GUILD_ADMIN` e `CARDINAL_CRITICAL`.

Os papéis são derivados dos registros existentes em `administradores`: avaliador, administrador de conteúdo, administrador de economia, superadmin e owner. O owner é definido explicitamente por `CARDINAL_OWNER_NUMBER`; não existe bypass de log.

Riscos: LOW para leitura/publicação e ativações reversíveis; MEDIUM para concessões de recursos/itens e cena; HIGH para remoções, valores absolutos, Rank, conteúdo ativo, Dungeon e guilda; CRITICAL para exclusão, massa, reset e migração. CRITICAL sempre exige confirmação temporária; HIGH exige por padrão e pode ser configurada. Confirmações são vinculadas ao ADM, usadas uma vez e expiram em cinco minutos.

## 3. Estruturas e transações

São usadas as tabelas reais `jogadores`, `itens`, `inventario_jogador`, `missoes`, `gacha_banners`, `gacha_banner_rewards`, `dungeons`, `guildas`, `eventos`, `equipment_sets`, `equipment_set_items`, `equipment_set_bonuses`, `banner_rare_items` e `administradores`.

A infraestrutura acrescenta apenas `cardinal_admin_operations` e `cardinal_admin_confirmations`, necessárias para audit/idempotência/confirmação. Em escrita real, validação, mutação e audit acontecem na mesma transação. Uma falha executa rollback do banco. A atualização do status do draft ocorre após commit bem-sucedido.

## 4. Audit, idempotência e rollback

Cada operação registra operation ID, idempotency key, ADM, mensagem original, intenção, tool, risco, parâmetros, fontes do Knowledge consultadas, entidade, estado anterior/posterior, resultado, erro, confirmação e horário. O log é produzido por código, nunca pelo Qwen.

Idempotency keys são únicas; repetir a mesma tool call devolve o resultado anterior sem duplicar recompensa. Valores monetários são inteiros seguros, sem float, NaN, Infinity, overflow ou saldo negativo.

Rollback é suportado para saldos, XP/Maestria, inventário, estado de banner, campos administrativos simples e publicação ainda não consumida. Publicação de item já entregue a inventário é recusada como rollback inseguro. O rollback também é auditado e não pode ser repetido.

## 5. Dry-run e linguagem natural

`CARDINAL_ADMIN_WRITES_ENABLED=false` é o padrão e força todas as mutações a dry-run. O teste seguro contra o banco atual simulou +1.000 Won: antes 310.000, preview 311.000, persistido 310.000, confirmando nenhuma alteração.

Ordens conhecidas são planejadas deterministicamente. Ordens mais complexas podem usar o Qwen para gerar apenas Action Plan JSON contra a allowlist. O código revalida tool, schema, RBAC, risco e parâmetros antes de executar. Somente a mensagem autenticada do ADM é instrução; RAG, descrições de entidades, NPCs e jogadores são tratados como dados.

## 6. Integração e comandos

CLI:

```powershell
$env:CARDINAL_ADMIN_ACTOR = '<numero do ADM registrado>'
npm run cardinal:admin -- dry-run give-wons "Jogador" 1000
npm run cardinal:admin -- publish <draft_id>
npm run cardinal:admin -- history
npm run cardinal:admin -- confirm <confirmation_id>
npm run cardinal:admin -- admin-rollback <operation_id>
npm run cardinal:test
```

Bot privado: `!cardinal <ordem>`, `!cardinal histórico`, `!cardinal confirmar <id>` e `!cardinal rollback <operation_id>`. O comando verifica `adminCore.isAdmin` antes de alcançar o planejador e o RBAC verifica novamente na camada administrativa.

## 7. Arquivos

Criados: `cardinal/admin/errors.js`, `factory.js`, `index.js`, `llm-planner.js`, `planner.js`, `publisher.js`, `rbac.js`, `renderer.js`, `repository.js`, `resolver.js`, `risk.js`, `service.js`, `tool-registry.js`, `tools.js`, `cardinal/tests/cardinal-admin.test.js`, `apps/bot/src/commands/cardinalAdmin.js` e este relatório.

Modificados: `.env.example`, `package.json`, `cardinal/core/index.js`, `cardinal/forge/draft-store.js`, `cardinal/runtime/cardinal-cli.js`, `cardinal/README.md` e `apps/bot/src/core/commandHandler.js`.

## 8. Testes e operações seguras

Resultado final: 42 testes aprovados e nenhum reprovado. A Fase 4 cobre publicação válida/inválida, Give Won, idempotência, jogador ausente, ambiguidade, permissão, recusa controlada de cena, ativação de banner, Dungeon válida/inválida, rollback transacional em falha intermediária, audit de sucesso/erro, rollback administrativo, confirmação crítica e dry-run forçado. Também passaram todas as regressões das Fases 1–3.

Mutações reais foram executadas somente em SQLite temporário descartável. Contra o banco atual foi executado exclusivamente dry-run, com confirmação posterior de saldo inalterado.

## 9. Limitações e operações bloqueadas

- Escritas permanecem desligadas até configuração explícita.
- Aprovação/rejeição de cena por ID e mudança de recompensa de cena estão bloqueadas por falta de entidade oficial.
- Não há SQL livre, shell, filesystem, eval, Git, código ou deploy.
- Operações em massa, delete, reset e migração não possuem tools executáveis.
- Give/remove de passiva como propriedade individual não foi exposto porque o projeto não possui armazenamento oficial geral equivalente; títulos continuam dependentes do campo único do jogador e do fluxo atual.
- Alteração de duração/local de missão e Dungeon permanece bloqueada onde o schema real não oferece o campo.
- Alteração completa de pool exige referências reais e pesos positivos; probabilidades são derivadas dos pesos, não aceitas como números inventados.

## 10. Recomendação para a Fase 5

Manter a Fase 5 completamente separada das tools administrativas: workspace isolado, branches Git, diff obrigatório, testes, revisão humana, allowlist de arquivos e rollback por commit. Não reutilizar permissões de banco como autorização para shell ou código. A Fase 5 não foi implementada.
