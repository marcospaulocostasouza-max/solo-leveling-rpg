# Cardinal Core — Fase 1

Infraestrutura isolada para conversar por HTTP com o Qwen3.5-4B-Instruct Q4_K_M servido pelo llama.cpp. Esta fase não possui ferramentas administrativas, acesso ao banco do RPG, integração com NPCs ou alterações no site.

Na Fase 2, o Cardinal ganhou uma camada local de conhecimento somente leitura. O SQLite em `cardinal/cache/knowledge.db` é um índice descartável e reconstruível; os arquivos existentes do RPG continuam sendo a fonte da verdade.

## Iniciar

No PowerShell, a partir da raiz do projeto:

```powershell
.\cardinal\runtime\start-cardinal-model.ps1
```

O script procura o `llama-server` local e o GGUF já instalado no cache do Hugging Face. Se o modelo estiver em outro local, defina somente para a sessão:

```powershell
$env:CARDINAL_MODEL_PATH = 'C:\caminho\qwen3.5-4b-instruct-Q4_K_M.gguf'
.\cardinal\runtime\start-cardinal-model.ps1
```

Para iniciar oculto em segundo plano e depois encerrar:

```powershell
.\cardinal\runtime\start-cardinal-model.ps1 -Background
.\cardinal\runtime\stop-cardinal-model.ps1
```

O servidor escuta apenas em `127.0.0.1:8088`, com contexto 8192 e 20 camadas na GPU por padrão.

## Testar

```powershell
.\cardinal\runtime\test-cardinal-model.ps1
node .\cardinal\runtime\cardinal-cli.js
```

Também é possível enviar uma única mensagem:

```powershell
node .\cardinal\runtime\cardinal-cli.js "Quem é você?"
```

Para pesquisar o RPG com exibição de fontes e scores:

```powershell
node .\cardinal\runtime\cardinal-cli.js --debug "Quais são os slots de equipamento?"
```

## Atualizar conhecimento

Atualização incremental, que preserva fragmentos não alterados:

```powershell
npm run cardinal:index
```

Reconstrução integral do cache:

```powershell
npm run cardinal:reindex
```

O índice usa SQLite FTS5/BM25, expansão lexical em português e filtros por categoria, sistema, entidade e tipo. Não utiliza embeddings nem serviços externos.

Configurações opcionais: `CARDINAL_HOST`, `CARDINAL_PORT`, `CARDINAL_CONTEXT_SIZE`, `CARDINAL_GPU_LAYERS`, `CARDINAL_TIMEOUT_MS`, `CARDINAL_MAX_TOKENS` e `CARDINAL_MODEL_PATH`.

## Cardinal Forge — Fase 3

A Forge gera somente drafts locais validados. Ela não publica no RPG e não possui permissões de escrita em jogadores, economia, banco principal, código ou deploy. Os drafts e o audit log ficam isolados em `cardinal/cache/forge-drafts.db`.

```powershell
npm run cardinal:forge -- create weapon "Crie a Excalibur Rank A com 20 atributos"
npm run cardinal:forge -- validate <draft_id>
npm run cardinal:forge -- show <draft_id> [versao]
npm run cardinal:forge -- versions <draft_id>
npm run cardinal:forge -- compare <draft_id> <versao_1> <versao_2>
npm run cardinal:forge -- edit <draft_id> '{"forca_bonus":15,"velocidade_bonus":5}'
npm run cardinal:forge -- rollback <draft_id> <versao>
```

No modo interativo, um pedido iniciado por “Crie” abre um draft. Frases seguintes iniciadas por “Agora”, “Troque”, “Mude”, “Altere”, “Adicione” ou “Remova” revisam o draft ativo e criam uma nova versão.

## Cardinal Publisher & Administrator — Fase 4

O modo administrativo começa obrigatoriamente protegido:

```env
CARDINAL_ADMIN_WRITES_ENABLED=false
CARDINAL_CONFIRM_HIGH_RISK=true
CARDINAL_OWNER_NUMBER=
```

Com escritas desabilitadas, toda operação vira dry-run. A CLI também exige `CARDINAL_ADMIN_ACTOR`, que deve corresponder ao número de um ADM registrado. Exemplos:

```powershell
npm run cardinal:admin -- dry-run give-wons "Nome do Jogador" 1000
npm run cardinal:admin -- publish <draft_id>
npm run cardinal:admin -- history
npm run cardinal:admin -- confirm <confirmation_id>
npm run cardinal:admin -- admin-rollback <operation_id>
```

No bot, apenas ADMs registrados podem usar `!cardinal <ordem>`, `!cardinal histórico`, `!cardinal confirmar <id>` e `!cardinal rollback <operation_id>`. A habilitação de escrita não remove RBAC, confirmação, idempotência, transação ou auditoria.

## Fase 5 — Cardinal Developer

O Developer transforma solicitações técnicas em tarefas persistentes, consulta um mapa do projeto e o índice de regras do RPG, cria uma branch `cardinal/<tipo>/<id>` em worktree isolado, aplica somente patches validados, executa runners conhecidos e entrega o diff em `READY_FOR_REVIEW`. O Qwen não recebe shell, Git, SQL ou acesso irrestrito a arquivos.

O recurso nasce desabilitado. Mesmo habilitado, auto-commit e auto-merge continuam desligados por padrão:

```env
CARDINAL_DEVELOPER_ENABLED=false
CARDINAL_AUTO_COMMIT=false
CARDINAL_AUTO_MERGE=false
CARDINAL_MAX_FIX_ATTEMPTS=3
CARDINAL_REQUIRE_REVIEW=true
CARDINAL_ALLOW_DATABASE_MIGRATIONS=false
CARDINAL_CODE_CONTEXT_CHARS=24000
```

Interface local:

```powershell
npm run cardinal:dev -- plan "adicione filtro por raridade ao inventário"
npm run cardinal:dev -- status <task_id>
npm run cardinal:dev -- start <task_id>
npm run cardinal:dev -- test <task_id>
npm run cardinal:dev -- diff <task_id>
npm run cardinal:dev -- review <task_id>
npm run cardinal:dev -- approve <task_id>
npm run cardinal:dev -- commit <task_id>
npm run cardinal:dev -- rollback <task_id>
npm run cardinal:dev -- history
```

No bot, use os mesmos verbos depois de `!cardinal dev`. Planejar e desenvolver exigem `CARDINAL_DEVELOPER`; aprovação, commit e rollback exigem `CARDINAL_DEVELOPER_APPROVE`. A última permissão fica reservada ao owner. Mudanças de banco são HIGH; SQL destrutivo, segredos, `.env`, pesos GGUF e exclusões inesperadas bloqueiam a revisão. Não existe deploy ou controle de processos nesta fase.

## Fase 6 — Cardinal Operations

Operations monitora o bot, site, Qwen e banco com ferramentas determinísticas. Mutações nascem desligadas; health e status continuam disponíveis para ADMs quando o modelo estiver offline.

```env
CARDINAL_OPERATIONS_ENABLED=false
CARDINAL_AUTO_DEPLOY_PRODUCTION=false
CARDINAL_OPS_CONFIRM_HIGH=true
CARDINAL_MAX_RESTART_ATTEMPTS=3
CARDINAL_RESTART_WINDOW_MS=600000
CARDINAL_BACKUP_KEEP_LAST=10
CARDINAL_MIN_DISK_FREE_MB=1024
```

```powershell
npm run cardinal:ops -- status
npm run cardinal:ops -- health
npm run cardinal:ops -- dry-run restart bot
npm run cardinal:ops -- deploy <change_id>
npm run cardinal:ops -- rollback <deployment_id>
npm run cardinal:ops -- backups
npm run cardinal:ops -- incidents
```

No bot: `!cardinal status`, `!cardinal health` ou `!cardinal ops <operação>`. Somente `bot`, `site` e `qwen` pertencem ao Service Registry. Não há shell genérico, deploy remoto, atualização de dependência/modelo ou controle geral do Windows. O ambiente atual só oferece deployment local por Git; produção automática permanece desabilitada.

## Fase 7 — Cardinal Autonomous Orchestrator

O Orchestrator decompõe pedidos complexos em um workflow versionado e coordena exclusivamente as APIs protegidas das fases anteriores. O estado, artifacts, approvals, erros, métricas e timeline ficam persistidos; outputs de RAG/modelo são dados e nunca redefinem policies.

```env
CARDINAL_ORCHESTRATOR_ENABLED=false
CARDINAL_MODE=ASSISTED
CARDINAL_MAX_LLM_CONCURRENCY=1
CARDINAL_MAX_TASK_RETRIES=2
CARDINAL_MAX_WORKFLOW_TASKS=60
CARDINAL_MAX_REPLANS=2
CARDINAL_MAX_WORKFLOW_DEPTH=3
CARDINAL_MAX_WORKFLOW_RUN_MS=120000
CARDINAL_REQUIRE_PUBLICATION_APPROVAL=true
CARDINAL_REQUIRE_DEPLOY_APPROVAL=true
```

```powershell
npm run cardinal:orchestrator -- preview "Crie um evento completo..."
npm run cardinal:orchestrator -- create "Crie um evento completo..."
npm run cardinal:orchestrator -- start <workflow_id>
npm run cardinal:orchestrator -- status <workflow_id>
npm run cardinal:orchestrator -- explain <workflow_id>
npm run cardinal:orchestrator -- approve <workflow_id> publication
npm run cardinal:orchestrator -- resume <workflow_id>
npm run cardinal:orchestrator -- pause <workflow_id>
npm run cardinal:orchestrator -- cancel <workflow_id> --rollback
```

No bot, use `!cardinal workflow ...` ou `!cardinal orquestrar ...`. O padrão `ASSISTED` conserva gates de publicação/deploy. O Orchestrator não cria objetivos próprios, não executa shell e não contorna RBAC ou confirmações dos módulos chamados.
