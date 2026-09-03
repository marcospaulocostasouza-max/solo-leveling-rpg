# Integração Cardinal Web Research + SearXNG Local

Status: concluída e verificada para pesquisa externa, review e geração de draft no Forge. A integração nunca publica conteúdo automaticamente.

## Arquitetura encontrada

`cardinal/web/index.js` já centralizava Research Plan, cache SQLite, fetch seguro, extração e adaptação. A integração adiciona `cardinal/web/searxng.js`, que implementa `SearxngSearchProvider` sem criar uma arquitetura paralela.

Fluxo atual:

`pedido administrativo → WebResearch → SearxngSearchProvider → ranking/diversidade → fetch externo seguro → extraction → External Record/cache → apresentação ou draft do Forge`

O SearXNG só descobre URLs. O fetch das páginas continua no fetcher Cardinal e continua sujeito à política HTTPS/SSRF.

## Provider e endpoint

- Provider: `SearxngSearchProvider`
- Base padrão: `http://127.0.0.1:8888`
- Endpoint: `/search?q=<consulta>&format=json`
- Sem API key e sem alteração do container Docker.
- A exceção HTTP local vale unicamente para o provider SearXNG; `fetchPage` externo ainda bloqueia localhost, rede privada e esquemas perigosos.

## Configuração

`.env.example` foi atualizado com:

```env
CARDINAL_WEB_ENABLED=true
CARDINAL_WEB_SEARCH_PROVIDER=searxng
CARDINAL_SEARXNG_URL=http://127.0.0.1:8888
CARDINAL_WEB_MAX_RESULTS=10
CARDINAL_WEB_MAX_FETCHES=5
CARDINAL_WEB_TIMEOUT_MS=10000
CARDINAL_WEB_CACHE_ENABLED=true
CARDINAL_WEB_CACHE_TTL=86400000
```

O `.env` do usuário não foi alterado. Para habilitar de fato no bot, adicione essas linhas ao `.env` — sobretudo `CARDINAL_WEB_ENABLED=true` — e reinicie o processo do bot.

## Health check e comportamento degradado

`provider.health()` executa uma consulta mínima e retorna `ONLINE`, `OFFLINE` ou `DEGRADED`. Após três falhas consecutivas, o provider abre um circuit breaker de 30 segundos. Cache ainda pode atender pesquisas existentes; sem cache, o erro é controlado como `CARDINAL_WEB_SEARCH_UNAVAILABLE`/`CARDINAL_WEB_TIMEOUT`.

Na validação local, SearXNG retornou `ONLINE`, com resultado real para consulta mínima. Algumas engines vieram indisponíveis por CAPTCHA/rate limit; foram preservadas como `SEARCH_ENGINE_PARTIAL_FAILURE`, sem invalidar os resultados restantes.

## Normalização, ranking e fontes

O JSON bruto do SearXNG é convertido para `title`, `url`, `snippet`, `search_score`, `engines`, `category`, `thumbnail` e `published_at`. Forge e Narrative não dependem do formato do SearXNG.

O ranking combina tipo de fonte e relevância textual; `search_score` não é tratado como autoridade. Tipos usados: `OFFICIAL`, `FRANCHISE_WIKI`, `ENCYCLOPEDIA`, `COMMUNITY`, `VIDEO`, `COMMERCIAL` e `UNKNOWN`. Fontes comerciais recebem prioridade baixa (ou são removidas fora de pesquisa de item), e há limite de duas URLs por domínio.

## Segurança

- Query vazia, JSON malformado, timeout e URL de provider remota são bloqueados.
- O endpoint provider precisa ser loopback local `127.0.0.1:8888` ou `localhost:8888`.
- Páginas externas exigem HTTPS e passam pela política de URL existente.
- Snippets, HTML e páginas são dados externos não confiáveis; scripts/estilos são removidos e não podem redefinir políticas ou instruções.
- HTTP 403/429 de páginas não derruba a busca do SearXNG; a fonte pode ficar sem texto extraído e as demais continuam sendo consideradas.

## Comandos

Envie `.#Cardinal` na primeira linha e a ordem na linha abaixo:

```text
.#Cardinal
pesquise Zangetsu e crie uma arma
```

Outros exemplos de ordem: `web search Zangetsu`, `pesquise Zangetsu, mas não crie ainda` e `workflow crie uma Dungeon com lore`.

O comando com `mas não crie ainda` permanece em `READ_ONLY_RESEARCH` e mostra facts/traços/fontes, sem criar draft.

Quando o pedido contém uma intenção inequívoca de criação (por exemplo, arma, banner, conjunto, passiva, título, missão ou dungeon), o comando cria somente um draft no Forge. O contexto recebido pelo Forge contém facts, traços e citações do `External Record`; regras internas e balanceamento do RPG continuam tendo precedência. O draft segue a revisão e os gates usuais e não chama Publisher.

## Integrações

| Integração | Estado |
| --- | --- |
| External record/cache/citações | Implementado |
| Forge | Implementado em modo draft: pedido explícito de criação entrega record, facts, traços e citações ao Forge; não publica |
| Narrative | Parcial: record é formato compatível, sem bridge automática ainda |
| Balance | Parcial: continua obrigatório ao publicar conteúdo via Forge/Publisher; não é acionado por pesquisa isolada |
| World Director | Parcial: pode receber record em workflow futuro, sem handler novo nesta mudança |
| Orchestrator | Parcial: Web Research não foi adicionado como task dedicada nesta mudança |

Essa separação evita que uma pesquisa externa vire item, Dungeon ou publicação automaticamente sem revisão e gates atuais.

## Testes executados

- Unitários mockados: provider online, JSON normalizado, engines parciais, JSON malformado, timeout, URL remota bloqueada e desacoplamento do JSON bruto.
- Regressão Web Research: cache, review mode, SSRF, offline e ponte record externo → Forge draft sem publicação.
- Teste local real: SearXNG em `127.0.0.1:8888`, consulta `Zangetsu`, provider `searxng`, quatro citações selecionadas.
- Suíte Cardinal completa, após a bridge Web → Forge: **128/128** aprovada; testes direcionados da integração: **8/8** aprovados.

## Arquivos

Criados:

- `cardinal/web/searxng.js`
- `cardinal/tests/cardinal-searxng.test.js`
- `apps/bot/src/commands/cardinalWeb.js`
- este relatório.

Modificados:

- `cardinal/web/index.js`
- `apps/bot/src/commands/cardinalAdmin.js`
- `.env.example`
- `CARDINAL_WEB_RESEARCH_GUIDE.md`

## Limitações restantes

- A política de fetch continua com allowlist de domínios conhecidos; resultados SearXNG fora dela podem ser descobertos, mas não abertos automaticamente.
- Extração factual depende de a página ser acessível e não bloqueada por 403/429.
- Pesquisa → Forge existe apenas para draft provocado por comando explícito. Não há criação/publicação automática, nem bridge direta para Narrative, World Director ou Orchestrator.
- O comando só funciona após habilitar `CARDINAL_WEB_ENABLED=true` no `.env` local.
