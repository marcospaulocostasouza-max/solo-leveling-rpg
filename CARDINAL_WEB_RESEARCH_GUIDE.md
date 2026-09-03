# Cardinal Web Research

Pesquisa externa é controlada: URL HTTPS, domínios permitidos, redirecionamentos recusados, timeout, tamanho máximo e poucos fetches por consulta. Scripts, estilos e instruções de páginas são removidos; texto externo é tratado apenas como dado.

O registro armazena plano, fatos extraídos, traços, adaptação e citações. O resultado padrão é uma adaptação inspirada: regras, schemas e balanceamento do RPG continuam prevalecendo. Use modo de revisão (“mostre só a pesquisa”) antes de criar conteúdo quando a referência for ambígua.

## SearXNG local

O provider padrão é `SearxngSearchProvider`, usando `http://127.0.0.1:8888/search?q=<consulta>&format=json`. O localhost é aceito somente para esse provider; o fetch posterior de páginas continua bloqueando localhost e redes privadas.

Configure no `.env` local (não há API key):

```env
CARDINAL_WEB_ENABLED=true
CARDINAL_WEB_SEARCH_PROVIDER=searxng
CARDINAL_SEARXNG_URL=http://127.0.0.1:8888
CARDINAL_WEB_MAX_RESULTS=10
CARDINAL_WEB_MAX_FETCHES=5
CARDINAL_WEB_TIMEOUT_MS=10000
CARDINAL_WEB_CACHE_ENABLED=true
```

Teste manualmente no navegador ou PowerShell:

```powershell
Invoke-RestMethod "http://127.0.0.1:8888/search?q=Zangetsu&format=json"
```

O provider normaliza `title`, `url`, `content`, `engines`, `score`, categoria, thumbnail e data. Score do SearXNG significa posição de busca, não autoridade: o Cardinal classifica e reranqueia fontes oficiais, enciclopédias e wikis antes de abrir no máximo o número de páginas configurado. Engines indisponíveis viram `SEARCH_ENGINE_PARTIAL_FAILURE` sem descartar os resultados válidos restantes.

## Pesquisa com draft

Administradores podem pedir pesquisa e criação na mesma frase, por exemplo:

```text
.#Cardinal
pesquise Zangetsu e crie uma arma
```

O Cardinal pesquisa, salva o External Record e envia facts, traços e citações normalizados ao Forge. O resultado é sempre um **draft** para revisão: não publica, não altera o mundo e não ignora schema, balanceamento ou políticas internas. Para consultar sem criar, envie `.#Cardinal` e, abaixo dele, `pesquise Zangetsu, mas não crie ainda`.
