# Relatório — Fase 6: Cardinal Operations

## 1. Serviços encontrados

Bot WhatsApp iniciado por `node apps/bot/index.js`; site Next.js pelos scripts `dev/start/build`, normalmente em `127.0.0.1:3000`; Qwen3.5-4B Q4_K_M por `llama-server` em `127.0.0.1:8088`; banco interno por `packages/database`. Não há backend operacional separado, Docker, PM2 ou deploy remoto configurado.

## 2. Services registrados

O registro imutável contém somente `bot`, `site` e `qwen`. Banco, Knowledge, Forge, Publisher, Developer e Operations aparecem na saúde consolidada, mas não são processos arbitrariamente iniciáveis.

## 3. Health checks criados

Há PID/uptime para bot, HTTP/latência para site e Qwen, `SELECT 1` para banco, existência/tamanho/data do índice Knowledge e visão `CARDINAL HEALTH` consolidada. Health é somente leitura.

## 4. Operações permitidas

Status, health, logs limitados, start, stop, restart, backup do banco, restore protegido, deploy local de change aprovado, rollback por revert, histórico, confirmações e incidentes.

## 5. Operações bloqueadas

Shell/PowerShell/cmd arbitrário, serviços fora do registry, SSH/RDP, rede genérica, deploy remoto não configurado, atualização de dependências, download, troca automática de modelo, administração do Windows e migrations destrutivas.

## 6. Start/stop/restart

Os adapters usam executáveis e argumentos definidos no código, PID files, processo filho sem shell e logs próprios. Start duplicado é idempotente; stop solicita `SIGTERM` e não força encerramento se o shutdown limpo falhar; restart faz status → stop → start → health.

## 7. Restart loop

Máximo padrão de três tentativas em dez minutos. Ao exceder, retorna `RESTART_LOOP_BLOCKED`. Falha pós-restart abre incidente e encerra recuperação automática.

## 8. Deployment pipeline

Developer `APPROVED` + commit + review + testes/build aprovados → lock → disco → backup → merge local `--no-ff` → health → `SUCCESS` → task `MERGED` → reindexação. Qualquer ausência bloqueia o deploy.

## 9. Backup

O escopo atual é o banco `rpg.db`; não copia GGUF, node_modules ou cache. Metadados registram ID, horário, motivo, escopo, deployment, status e localização. Retenção padrão: últimos 10.

## 10. Rollback

Deploy local usa `git revert`, nunca reset. Restore valida o backup, exige bot parado e cria snapshot anterior. Migration reversa insegura não é automatizada.

## 11. Permissões

Foram adicionadas `CARDINAL_OPS_READ`, `CARDINAL_OPS_RESTART`, `CARDINAL_OPS_DEPLOY`, `CARDINAL_OPS_BACKUP`, `CARDINAL_OPS_RESTORE` e `CARDINAL_OPS_CRITICAL`. Leitura chega aos ADMs; operações mutáveis ficam com superadmin/owner; Developer approval continua mais restrita.

## 12. Risco

LOW: status/health/logs. MEDIUM: start/stop/restart. HIGH: deploy/backup/restore/rollback. CRITICAL: operação destrutiva ou estrutural sensível, que não possui executor genérico.

## 13. Confirmação crítica

CRITICAL sempre e HIGH por padrão geram `ops_confirm_*`, vinculada ao ator, uso único e expiração de dez minutos. Confirmação exige `CARDINAL_OPS_CRITICAL`.

## 14. Incidentes

Persistem ID, serviço, severidade, início, causa, ações e estado. Estados previstos: `OPEN`, `INVESTIGATING`, `RECOVERING`, `RESOLVED` e `FAILED`.

## 15. Recovery policies

Bot/site/Qwen admitem restart controlado; banco não ganha restart automático. Qwen offline não derruba status/health determinísticos.

## 16. Locks

Locks persistentes por `service:<id>` e `deployment:local` impedem restart ou deploy simultâneo. São liberados em `finally`.

## 17. Idempotência

Operações usam `operation_id` e chave SHA-256 por ator/intenção/alvo/change. Repetições seguras retornam `idempotent_replay`.

## 18. Logs e audit

Audit JSONL registra operação, ator, alvo, before/after, resultado, duração e erro. Estado JSON persiste operações, deployments, incidentes, backups, locks, confirmações e idempotência.

## 19. Secret redaction

Tokens, senhas, cookies, Authorization, API keys, credenciais e connection strings são mascarados. Leitura de logs limita 300 linhas e 30 mil caracteres.

## 20. Arquivos criados

Foi criada `cardinal/operations/` com config, registry, state, service, factory, services adapter, health, monitoring, planner, deployment local, backups, recovery e audit; além do CLI, comando do bot, teste e este relatório.

## 21. Arquivos modificados

`.env.example`, `package.json`, `cardinal/README.md`, `cardinal/admin/rbac.js` e `apps/bot/src/commands/cardinalAdmin.js`. Mudanças anteriores do usuário foram preservadas.

## 22. CLI

`cardinal ops status`, `health`, `restart bot`, `deploy <change_id>`, `rollback <deployment_id>`, `backups`, `incidents`, `history`, `confirm <id>` e `dry-run <operação>` via `npm run cardinal:ops -- ...`.

## 23. Testes executados

Health, start, start duplicado, stop, restart, falha/recovery, restart loop, Qwen offline, deploy aprovado, deploy não aprovado/teste falho, backup, rollback, deployment lock, permissão, confirmação, segredo e disco foram testados com serviços simulados; nenhum processo real foi derrubado.

## 24. Resultados

59/59 testes Cardinal aprovados: 10 Operations e 49 regressões das Fases 1–5. Sintaxe e carregamento dos módulos também passaram.

## 25. Limitações

O bot não possui endpoint health: quando iniciado pelo Cardinal, seu status usa PID. Processos iniciados externamente podem aparecer offline. Não há métrica VRAM portátil; são retornadas CPU/RAM/disco e a configuração do modelo permanece limitada. Notifications possuem dados/audit para hook futuro, sem envio para evitar spam.

## 26. Não suportado pelo ambiente

Deploy externo/produção, staging real, blue-green, PM2, Docker, service manager, painel web Operations e migrations automáticas não foram implementados porque não existem mecanismos/autenticação correspondentes no projeto. O único ambiente detectado é local.

## 27. Próxima fase

O Orchestrator poderá encadear Forge → Developer → Review → Operations com checkpoints humanos, compensações e orçamento de etapas. Deve consumir estas APIs, sem criar shell ou contornar RBAC/confirmations.

Nenhum recurso da Fase 7 foi implementado.
