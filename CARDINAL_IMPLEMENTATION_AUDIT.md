# Auditoria de Implementação — Sistema Cardinal (Fases 1 a 15)

Data da auditoria: 03/09/2026. Este documento descreve o que está presente no repositório, não uma promessa de funcionalidades futuras. O código Cardinal está em `cardinal/`, com pontos de entrada no bot e no painel administrativo do site.

## Resultado da auditoria

As quinze fases possuem módulos e relatórios no repositório. As funcionalidades determinísticas e os fluxos protegidos estão implementados e cobertos por testes. Recursos que requerem serviço externo, dados históricos ou modelo multimodal foram deixados desativados/degradados de forma explícita; não são apresentados como capacidades ativas.

| Área | Estado | Evidência |
| --- | --- | --- |
| Cardinal Core a Operations | Implementado | `cardinal/core`, `knowledge`, `forge`, `admin`, `developer`, `operations` |
| Orquestração, apresentação, memória e mundo | Implementado | `cardinal/orchestrator`, `presentation`, `memory`, `world` |
| Balance, narrativa e analytics | Implementado com limites de dados | `balance`, `narrative`, `analytics` |
| Pesquisa web | Infraestrutura implementada, desativada por padrão | `cardinal/web`, `CARDINAL_WEB_ENABLED=false` |
| Visão/imagens | Infraestrutura e fallback implementados; visão real desativada | `cardinal/multimodal`, runtime com `--no-mmproj` |

## Arquitetura comum

O Cardinal evita dar autonomia direta ao modelo. O modelo local é usado para interpretar e redigir; regras, cálculo, persistência, permissões, publicação, rollback, limites e validações ficam em código.

Os principais serviços compartilham estas proteções:

- RBAC administrativo, confirmações para risco alto/crítico e trilha de auditoria.
- SQLite para caches, drafts, memória e estado operacional; banco principal para entidades reais do RPG.
- Respostas visuais reutilizam o padrão de apresentação da Fase 8.
- Falhas de modelo, banco auxiliar ou recurso opcional retornam estado controlado, sem quebrar o bot.
- Conteúdo externo, memória e entradas de usuário são tratados como dados, nunca como instruções de sistema.

## Fase 1 — Cardinal Core

Implementado em `cardinal/core`.

- Configuração do runtime local, cliente compatível com o servidor llama.cpp/Qwen e health check.
- Assistente com tratamento de resposta inválida/vazia e falha offline controlada.
- Logging e configuração centralizada.
- O modelo configurado é `Qwen3.5-4B-Instruct-GGUF:Q4_K_M`, host local `127.0.0.1`, contexto 8192.

Limite: o Core não inicia sozinho um modelo inexistente; o caminho do GGUF e `llama-server` continuam sendo requisitos de ambiente.

## Fase 2 — Cardinal Knowledge

Implementado em `cardinal/knowledge`.

- Indexação local, parser de fontes e documentos SQLite/FTS.
- Retrieval lexical com sinônimos em português, filtros por categoria/sistema/entidade e ranking com prioridade canônica.
- Context builder limitado por número de documentos e caracteres.
- Fontes de banco são somente leitura; consultas sem evidência não são transformadas em fatos pelo modelo.

Limite: a qualidade depende de o índice ser atualizado com `npm run cardinal:index` ou `cardinal:reindex` quando as fontes mudarem.

## Fase 3 — Cardinal Forge

Implementado em `cardinal/forge`.

- Planejador por tipo de conteúdo, schemas e validadores para arma, missão, banner, Dungeon e demais entidades suportadas.
- Drafts versionados, edição, revisão, comparação e rollback de versão.
- Validação de regras oficiais, slots, ranks, atributos e referências antes de qualquer publicação.
- Renderer de ficha para não expor JSON bruto ao administrador.

Limite: Forge gera/edita drafts; o conteúdo só entra no RPG pelo Publisher e pelas permissões correspondentes.

## Fase 4 — Publisher & Administrator

Implementado em `cardinal/admin`.

- Registry de operações administrativas, resolução segura de entidades e input schema.
- RBAC, idempotência, transação, confirmação de risco e auditoria em `cardinal_admin_operations`.
- Operações de jogador, economia, itens, banners, Dungeons, guildas e publicação de drafts suportados pelo schema real.
- Rollback seguro para operações que possuem inversa bem definida; o sistema recusa rollback inseguro.

Limite: escritas administrativas podem permanecer em dry-run conforme `CARDINAL_ADMIN_WRITES_ENABLED`; o Publisher não inventa tabelas inexistentes.

## Fase 5 — Cardinal Developer

Implementado em `cardinal/developer`.

- Mapa de projeto, busca de código, plano de alteração, worktree isolado, proteção de arquivos e diff review.
- Runner com comandos de teste/build permitidos e rollback de worktree quando testes falham.
- Mudanças grandes são decompostas; migrations e ações sensíveis recebem risco alto.

Limite: não há merge/deploy automático de alteração de código sem revisão/aprovação.

## Fase 6 — Cardinal Operations

Implementado em `cardinal/operations`.

- Estado/health dos serviços, logs, incidentes, políticas de recuperação e limitação de loop de restart.
- Planejamento e execução protegida de deploy, backup, restore e rollback através de adapter local.
- Locks para evitar deploy simultâneo e confirmações para operações críticas.

Limite: o adapter opera somente sobre ações configuradas/permitidas; não é um executor remoto genérico.

## Fase 7 — Autonomous Orchestrator

Implementado em `cardinal/orchestrator`.

- Planejador de workflows, DAG de dependências, store persistente, aprovação por etapa, locks e recuperação.
- Handlers para Knowledge, Forge, Publisher, Admin, Developer, Operations, World, Balance e Narrative.
- Rejeita tools inventadas, dependências inválidas, ciclos e tarefas críticas sem gate de confirmação.
- Workflows podem pausar e retomar após restart sem repetir tarefas concluídas.

Limite: o planner não publica/deploya por conta própria sem as aprovações requeridas.

## Fase 8 — Interface & RPG Visual Integration

Implementado em `cardinal/presentation`, `apps/site/app/admin/cardinal`, `apps/site/components/CardinalConsole.tsx` e comandos Cardinal do bot.

- DTOs, renderizadores WhatsApp/CLI/Web, paginação, sessões de interface e templates de erro/negação/confirmacão.
- Visual aplicado ao padrão do RPG, com prioridade para a ficha `!jogador` e legibilidade móvel.
- Painel administrativo Cardinal e rota API administrativa existentes.

Limite: tabs específicas de Analytics, Web Research e Referências Visuais ainda não possuem painel completo próprio; seus motores e respostas administrativas existem, mas a UI detalhada é evolução futura.

## Fase 9 — Memory & Context Engine

Implementado em `cardinal/memory`.

- Sessões por administrador/canal, mensagens de conversa, memórias relevantes e decisões versionadas.
- Priorização de regras/conhecimento antes de memória potencialmente conflitante.
- Expiração, pin, forget com audit, redação de segredos e isolamento entre administradores.
- Liga drafts, tarefas e workflows ao contexto para permitir continuidade real.

Limite: memória não substitui a consulta ao estado atual do RPG e não eleva autoridade de instruções recuperadas.

## Fase 10 — World Director

Implementado em `cardinal/world`.

- Estado de mundo com fase dia/pôr do sol/noite, eventos, Dungeons, banners, guildas e aparições de NPC.
- Agendamento, notificações deduplicadas, locks, audit e transições de eventos.
- Checagem de localização jogador/NPC, proteção de território e regras de elegibilidade.
- Comando administrativo `!cardinal world`/`!cardinal mundo`.

Limite: regras ainda não estruturadas (por exemplo, seleção determinística de Dungeon semanal ou conquista territorial completa) retornam `WORLD_RULE_PENDING`, não uma decisão inventada.

## Fase 11 — Balance, QA & Simulation Engine

Implementado em `cardinal/balance`.

- Benchmark de itens por tier/categoria usando registros reais, outliers e preço negativo.
- Validação de banner/pity/pesos, passivas de risco textual, recompensas de Dungeon, economia simulada e scanner de exploit.
- Quality Gate persiste relatórios e bloqueia riscos críticos antes da publicação.
- Integração no Publisher e no Orchestrator; comandos `!cardinal balance` e `!cardinal exploit-scan`.

Limite: DPS real, sinergias de conjuntos, dificuldade detalhada e inflação histórica dependem de telemetria/regras que ainda não são estruturadas.

## Fase 12 — Narrator & Content Director

Implementado em `cardinal/narrative`.

- Contexto narrativo combina World, jogador, NPC oficial, Memory e Lore Retrieval.
- Canon (`DRAFT`, `CANON`, etc.), status de aprovação, visibilidade e versionamento de narrativa.
- Validador bloqueia conflito de localização, evento inativo, NPC não conhecido, segredo em saída pública, perda de agência do jogador e mutação mecânica em revisão textual.
- Arcos, crônicas e vault lógico de segredos possuem armazenamento separado.
- Comando administrativo `!cardinal narrativa ...`.

Limite: fatos de morte, clima, relações complexas e outras continuidades só são verificáveis quando esses estados existirem estruturados no banco.

## Fase 13 — Player Intelligence & Live Analytics

Implementado em `cardinal/analytics`.

- Fontes atuais: `jogadores` para ranks, `transacoes` para Won, `guildas` para estado, mais `analytics_events` para telemetria nova.
- Métricas registradas: distribuição de Rank, fluxo de Won, uso de item, conclusão de Dungeon, pulls de banner, guildas, heatmap de local e anomalias.
- Registry bloqueia SQL livre; cada relatório declara origem/cobertura/limitação.
- Metadados de eventos removem mensagens, tokens, telefones e conteúdo sensível.
- Comando administrativo `!cardinal analytics <pergunta>`.

Limite: métricas de atividade, retenção, missões, banners e itens só existem a partir da coleta de eventos. O projeto não cria backfill fictício; anomalia é sinal de investigação, nunca acusação ou punição.

## Fase 14 — Web Research & External Inspiration

Implementado em `cardinal/web`.

- Research plan, classificação de intenção, modo review, cache de external records, citações, fact extraction e adaptação inspirada.
- HTTPS obrigatório, allowlist de domínio, bloqueio de localhost/rede privada, redirects recusados, timeout e limite de conteúdo.
- Scripts/estilos são removidos; conteúdo de página é dado e não pode alterar políticas do Cardinal.
- Resultado separa facts, core traits e adaptation plan; mecânicas externas nunca substituem Knowledge/Forge/Balance.
- `CARDINAL_WEB_ENABLED=false` por padrão.

Limite importante: não há provedor de busca externo aprovado configurado por padrão. Ao ativar pesquisa é necessário fornecer um adapter de busca autorizado e manter a política de fontes; não existe navegação livre do modelo.

## Fase 15 — Multimodal Reference Engine

Implementado em `cardinal/multimodal` como infraestrutura segura e fallback.

- Ingestão binária de PNG/JPEG/WEBP por assinatura real, limite de tamanho, hash SHA-256 e deduplicação/cache.
- Remoção de EXIF/GPS/instruções de metadata e separação de observado, inferido, pesquisado e gerado.
- Ficha de inspiração visual garante que uma imagem não define atributo, dano, raridade, slot ou efeito.
- Interface `VisionProvider` preparada para provider local/externo; `DisabledVisionProvider` é o provider atual.
- `CARDINAL_VISION_ENABLED=false` por padrão.

Limite importante: o runtime atual usa `--no-mmproj` com Qwen texto-only. Não foi baixado/ativado um modelo visual ou mmproj, nem foi provocado consumo de VRAM, porque a máquina tem 4 GB de VRAM e não há benchmark aprovado. O retorno seguro é `CARDINAL_VISION_UNAVAILABLE`/análise `UNAVAILABLE` com fallback textual.

## Comandos Cardinal disponíveis

| Comando | Função |
| --- | --- |
| `!cardinal <ordem>` | Administração natural, protegida por RBAC e confirmação quando necessário |
| `!cardinal dev ...` | Planejamento/desenvolvimento protegido |
| `!cardinal ops ...` | Status e operações de infraestrutura autorizadas |
| `!cardinal workflow ...` | Workflow/Orchestrator |
| `!cardinal world ...` | Estado e planejamento de mundo |
| `!cardinal balance ...` | Balance, economia simulada e QA |
| `!cardinal narrativa ...` | Draft narrativo administrativo |
| `!cardinal analytics ...` | Métricas registradas e agregadas |

Web Research e Multimodal ainda não possuem comando público/autônomo porque requerem, respectivamente, adapter externo autorizado e provider visual validado.

## Configurações relevantes

As variáveis estão documentadas em `.env.example`:

- Core/Admin: modelo local, escritas administrativas, confirmação e banco.
- World/Balance: timezone, limite de simulação e bloqueio de riscos críticos.
- Web: `CARDINAL_WEB_ENABLED`, timeout, máximo de fetches e TTL de cache.
- Vision: `CARDINAL_VISION_ENABLED`, provider, limite de MB/imagens/resolução, cache e TTL.

Defaults de Web e Vision são seguros/desativados. Ativá-los requer decisão administrativa e validação do provider.

## Verificação executada nesta auditoria

| Verificação | Resultado |
| --- | --- |
| `node --test cardinal/tests/*.test.js` | 124 testes aprovados, 0 falhas |
| `npm --prefix apps/bot test` | smoke test narrativo da Ophilia aprovado |
| `npm run site:build` | build concluído com sucesso |

O build do site ainda informa dois avisos já conhecidos: rastreamento dinâmico causado por imports com filesystem e `SQLITE_CANTOPEN` durante geração estática. O processo conclui com código 0 e todas as rotas são geradas; os avisos continuam sendo dívida técnica a corrigir, não uma falha silenciosa ignorada.

## Estado do Git e recomendação de entrega

As mudanças Cardinal e parte das mudanças de RPG estão adicionadas/modificadas no worktree; a auditoria não criou commit nem alterou o conteúdo já preparado pelo usuário. Antes de publicar, revise o diff e evite versionar caches SQLite transitórios, especialmente arquivos `*.db-wal` e `*.db-shm` sob o site.

## Próximos passos recomendados

1. Configurar e homologar um adapter de busca com fontes permitidas antes de ativar a Fase 14.
2. Escolher e testar um modelo multimodal/mmproj compatível em benchmark serializado antes de ativar a Fase 15.
3. Instrumentar eventos reais de missão, Dungeon, banner, item e viagem para enriquecer a Fase 13 sem backfill inventado.
4. Criar tabs administrativos específicas para Analytics, fontes web e referências visuais no painel Cardinal.
5. Estruturar regras mundiais ainda pendentes (clima, mortes, relações, território e seleção semanal) para ampliar validação de narrativa/mundo.
