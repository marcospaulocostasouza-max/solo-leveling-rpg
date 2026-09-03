# Relatório — Fase 7: Cardinal Autonomous Orchestrator

## 1. Arquitetura

Pedido autenticado → planner estruturado → validação → policies/RBAC → dependency graph → workflow engine → handlers das Fases 2–6 → verificação → audit. O Orchestrator coordena; não substitui os executores protegidos.

## 2. Workflow engine

Engine leve, sequencial e retomável com estados `PLANNING`, `READY`, `RUNNING`, `WAITING_FOR_APPROVAL`, `PAUSED`, `FAILED`, `COMPLETED` e `CANCELLED`. Tasks usam `PENDING`, `BLOCKED`, `READY`, `RUNNING`, `SUCCESS`, `FAILED`, `SKIPPED`, `WAITING_APPROVAL` e `ROLLED_BACK`.

## 3. Tipos de task

Allowlist: `knowledge.search_rules`, `forge.create_draft`, `approval.approve_stage/critical_confirmation`, `publisher.publish_draft`, `admin.execute_plan`, `developer.plan_change`, `operations.deploy_change/health_check` e `verify.verify_artifacts`. Tools inventadas são rejeitadas.

## 4. Dependency graph

IDs e dependências são validados, referências ausentes e ciclos bloqueiam o plano. No evento composto, regras precedem drafts, itens/título/Dungeon/missão precedem banner, banner e agregados precedem verificação/publicação.

## 5. Persistência

JSON leve guarda workflows, tasks, artifacts, outputs compactados, permissões, revisions, approvals, timeline, métricas, erros, fila e locks em `cardinal/cache/orchestrator-workflows.json`.

## 6. Resume

`resume` recalcula somente tasks pendentes/ready. Tasks `SUCCESS` e seus artifacts não são reexecutados, evitando duplicação de conteúdo, transação ou deploy.

## 7. Cancelamento

`cancel` interrompe novas tasks. Com rollback solicitado, percorre em ordem reversa somente handlers reversíveis e relata separadamente o que foi ou não revertido.

## 8. Retry

Máximo padrão de dois retries para timeout, conexão/modelo/serviço/banco temporariamente indisponível. Erros lógicos e validações não são repetidos.

## 9. Replanning

Planos revisados passam novamente por scope, allowlist, grafo, ciclos e limites. Tasks já concluídas são preservadas; cada revisão registra ator, motivo e mudança de tamanho. Limite padrão: duas.

## 10. Rollback

Publisher usa rollback administrativo, Developer usa rollback Git e Operations usa rollback de deployment. Rollback parcial é reportado como parcial, nunca como sucesso total fictício.

## 11. Approval gates

Publication e deploy possuem bundles próprios. Um gate autoriza o estágio, não cada microtask. Ações CRITICAL exigem gate `critical_confirmation` separado e permissão `CARDINAL_CRITICAL`.

## 12. Policy engine

Mapeia tipo de task para permissão, separa falha lógica/transitória, protege escopo do RPG e nunca usa RAG/log/tool output como instrução. Permissões são registradas no início e revalidadas antes de cada task.

## 13. Modes

`ASSISTED`, `SEMI_AUTONOMOUS` e `AUTONOMOUS_SAFE`; padrão `ASSISTED`. HIGH/CRITICAL continuam sujeitos aos gates e às proteções dos módulos inferiores em todos os modos.

## 14. Locks

Locks por sistema afetado impedem dois workflows conflitantes em banner, conteúdo, site, código ou deployment. O segundo workflow fica `PAUSED`.

## 15. Concurrency

O modelo permanece com concorrência máxima 1 para respeitar 4 GB de VRAM. Tasks determinísticas podem ser modeladas como independentes, mas a engine conservadora executa sequencialmente nesta versão.

## 16. Configurações

Foram criadas `CARDINAL_ORCHESTRATOR_ENABLED=false`, `CARDINAL_MODE=ASSISTED`, limites de LLM, retry, tasks, replan, profundidade e runtime, além de approvals obrigatórios para publicação/deploy.

## 17. Knowledge

Tasks consultam fontes oficiais com resultado limitado. IDs/fontes ficam em artifacts; texto recuperado é tratado estritamente como dado.

## 18. Forge

Criação usa `CardinalForgeService`; somente drafts `VALID` tornam a task bem-sucedida. IDs são repassados pelo Artifact Store, não por nomes ambíguos.

## 19. Publisher

Publicação chama o Admin Publisher com idempotency key por task e só depois do approval bundle. Validação, RBAC, confirmação e transação da Fase 4 permanecem ativas.

## 20. Developer

Pedido técnico cria uma Developer Task real. Branch, diagnóstico, testes e review continuam responsabilidade da Fase 5; o Orchestrator não marca change como aprovado.

## 21. Operations

Deploy encaminha apenas `change_id` real. Operations revalida `APPROVED`, commit, testes/build, backup, lock e health. Falhas operacionais permanecem auditadas pela Fase 6.

## 22. Arquivos criados

Árvore `cardinal/orchestrator/` com config, planner, graph, workflow engine, executor, state, policies, approvals, recovery, audit, factory e service; CLI, comando do bot, testes e este relatório.

## 23. Arquivos modificados

`.env.example`, `package.json`, `cardinal/README.md` e `apps/bot/src/commands/cardinalAdmin.js`. Alterações anteriores foram preservadas.

## 24. Testes executados

Workflow simples/composto, ordem, dependência inválida/ciclo/tool falsa, permissão, approval, resume, persistência, retry, erro lógico, replan, idempotência, conflito, rollback, critical gate, prompt injection, Qwen offline e stress de 40 tasks.

## 25. Exemplos

“Crie uma espada Rank A” conclui regras → draft → verify. “Crie e publique” pausa antes da publicação. Evento Halloween gera regras e artifacts de itens, título, Dungeon, missão, banner e evento com dependências explícitas. Bug + site cria Developer Task e estágio de deploy.

## 26. Falhas simuladas

Timeout transitório recuperado, slot/erro lógico sem retry, permissão negada, Qwen offline com pausa, grafo cíclico, tool alucinada e conflito simultâneo.

## 27. Após restart

Uma nova instância carregou workflow em `WAITING_FOR_APPROVAL`, recebeu aprovação e concluiu sem refazer o draft já armazenado.

## 28. Limitações

Planner natural é determinístico e cobre templates centrais; pedidos incomuns podem exigir replan humano. Conteúdo composto dependente de IDs oficiais pode necessitar estágios adicionais de publicação. Verificação profunda de relações no banco continua delegada aos módulos oficiais. Não há scheduler autônomo nem paralelismo real de LLM.

## 29. Riscos restantes

Qwen 4B pode produzir draft inválido; integrações reais continuam dependentes da disponibilidade local; rollback pode ser parcial; heurísticas de intenção podem classificar pedido ambíguo incorretamente. Por isso o padrão permanece desabilitado/ASSISTED.

## 30. Próxima fase

Uma eventual Fase 8 deve focar avaliação/evals, qualidade dos planos, simulações mais profundas e experiência administrativa, mantendo supervisão humana. Não deve ampliar escopo externo ou remover gates.

Nenhum recurso da Fase 8 foi implementado.
