# Cardinal Web Research — Workflow Bridges

Status: implementado e testado para Orchestrator, Forge, Balance, Narrative e World Director em modo de draft. Publisher continua separado e exige o fluxo de aprovação já existente.

## Arquitetura e task oficial

O Orchestrator existente permanece como ponto único de planejamento, persistência, retry e resume. Foi adicionada a task oficial `web.research` (e reservada `web.expand`) ao grafo de tools permitido. Sua saída é o artefato `EXTERNAL_RESEARCH`, persistido dentro do workflow:

`External Record → Forge Draft → Balance Report → Narrative Draft / World Research Plan → Verify → Review`

O artefato contém `external_record_id`, versão temporal do record, query, entidade, facts, traits, citações, confiança e modo de adaptação. Tasks seguintes recebem a referência do artefato (`external_record_task`), sem repetir texto ou executar a mesma busca.

## Roteamento e grafos

O planner reconhece pesquisa em linguagem natural e decompõe pedidos compostos. Exemplos:

- `Pesquise Zangetsu e crie uma arma balanceada` → Web → Forge weapon → Balance → Verify.
- `Pesquise Neuvillette e crie um título e uma passiva` → uma única Web → dois drafts → dois Balance → Verify.
- `Pesquise Gashadokuro e crie uma Dungeon com lore` → Web → Forge dungeon → Balance + Narrative → Verify.
- `Pesquise mitologia coreana e crie um evento` → Web → World Research Plan → Forge event → Balance → Verify.
- `Pesquise Hallasan real e melhore a descrição` → Web → World Research Plan + Narrative → Verify.
- `Pesquise Zangetsu, mas não crie nada` → somente Web Research.

Pedidos legados de evento composto e correção de código foram preservados no planner existente. Pedidos de publicação ainda recebem approval e Publisher após Verify; pesquisa não concede permissão de publicação.

## Bridges

### Orchestrator

`web` é registrado no grafo, possui handler e requer `CARDINAL_WEB_SEARCH`. O factory injeta o mesmo `WebResearch` usado pelo Cardinal, sem provider paralelo. Web desabilitado faz a task falhar com o erro controlado original (`CARDINAL_WEB_DISABLED`), deixando dependências bloqueadas pelo engine.

### Forge e Balance

O handler Forge fornece o External Record ao contexto do Forge como referência não confiável para regra. O output do draft preserva `external_record_id` e versão. O handler Balance avalia o conteúdo RPG adaptado, não a obra original; a referência aparece somente como `inspiration_target`. Seu output liga `draft_id`, `balance_report_id` quando disponível e a proveniência externa. Nenhum desses handlers publica conteúdo.

### Narrative

O handler Narrative transforma o artefato externo em `external_research`. O `NarrativeContextBuilder` estabelece a prioridade explícita: regras do RPG, estado mundial, lore oficial, pesquisa externa e criatividade. O draft narrativo salva o record, versão, facts, traits, citações e modo de adaptação usados.

### World Director

`world.research_plan` cria um `WORLD_RESEARCH_PLAN` com tema, entidades, componentes, record IDs e versão. O handler consulta o overview oficial antes de aceitar local informado; local não disponível é rejeitado. O plano é um draft no artefato do workflow: não altera calendário, território, eventos ou regras mundiais.

## Segurança, auditoria e apresentação

SSRF, HTTPS externo, exceção loopback exclusiva do SearXNG, timeout, cache e proteção contra prompt injection permanecem no provider Web. A execução continua a usar RBAC por task: Web, Forge, Balance, Narrative, World e Publisher são verificados separadamente. A timeline e o audit do Orchestrator registram pedido original, tasks, outputs, falhas e aprovações; a cadeia de IDs permanece em `workflow.artifacts`.

A apresentação continua através do template `WORKFLOW` da Fase 8, sem JSON bruto. Os artefatos compactos trazem IDs e os handlers mantêm no máximo as citações já limitadas pelo Web Research.

## Cache, versão, retry e resume

O `External Record` é persistido pelo `WebStore` e pode ser reutilizado pelo TTL. Um workflow usa sua cópia/versionamento temporal do record no artefato, então atualização posterior não reescreve silenciosamente um workflow anterior. Retry e resume são os do `WorkflowEngine`: tasks concluídas não são executadas outra vez após reinício.

## Testes

- Novo teste E2E mockado Web → Forge → Balance, validando um único `EXT-001`, provenance e ausência de Publisher.
- Novo teste E2E mockado Web → World Plan → Dungeon → Narrative, validando provenance no draft narrativo.
- Novo teste de review mode, confirmando somente a task Web.
- Regressão do Orchestrator, incluindo eventos compostos e correções legadas.
- Suíte completa: **131/131 aprovada**.

## Arquivos

Criados:

- `cardinal/tests/cardinal-web-workflow.test.js`
- este relatório.

Modificados:

- `cardinal/orchestrator/dependencies/graph.js`
- `cardinal/orchestrator/policies/index.js`
- `cardinal/orchestrator/factory.js`
- `cardinal/orchestrator/executor/handlers.js`
- `cardinal/orchestrator/planner/index.js`
- `cardinal/admin/rbac.js`
- `cardinal/narrative/context.js`
- `cardinal/narrative/director.js`

## Partes ainda parciais e riscos

- `web.expand` está registrado, mas o planner ainda não solicita automaticamente pesquisa complementar nem aplica limite de expansões.
- O provider atual produz confiança HIGH/MEDIUM; o caminho de baixa confiança/conflito foi preparado no handler, mas o SearXNG ainda não possui detector semântico de conflito entre fontes. Logo, o gate automático `WAITING_RESEARCH_REVIEW` continua parcial.
- O World Research Plan vive como artefato versionado do workflow; não há ainda tabela própria para catálogo/reuso de planos mundiais fora do workflow.
- Não foram adicionados botões de navegação específicos para cada artifact; o resumo de workflow existente é usado.
- A execução real de geração ainda depende do Qwen/Forge local estar saudável; os testes E2E usam módulos mockados para validar contratos e encadeamento determinístico.
