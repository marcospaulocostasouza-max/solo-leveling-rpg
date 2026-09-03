# Fase 13 — Cardinal Player Intelligence & Live Game Analytics

Status: implementação inicial concluída e verificada.

1. **Fontes reais:** `jogadores` (Ranks), `transacoes` (Won), `guildas` (estado atual) e telemetria Cardinal para comportamento histórico novo.
2. **Tracking:** tabela `analytics_events` rastreia somente eventos necessários, com índices por tipo/data e ator/data; mensagens, tokens, telefones e conteúdo privado são removidos de metadata.
3. **Métricas:** `PLAYER_COUNT_BY_RANK`, `WON_FLOW`, `ITEM_USAGE`, `DUNGEON_COMPLETION`, `BANNER_PULLS`, `GUILD_OVERVIEW`, `LOCATION_HEATMAP`, `ANOMALIES` e `OVERVIEW`.
4. **Dados:** cada relatório declara fonte (`OBSERVED_DATA`, `DERIVED_FROM_CURRENT_STATE`, `EVENT_HISTORY` ou `MIXED_DATA`), cobertura e limitações.
5. **Economia:** entradas, saídas e saldo líquido são derivados das transações existentes; sem inferir origem ausente.
6. **Conteúdo:** uso de itens, Dungeons, banners e viagens é calculado exclusivamente após a telemetria ser registrada.
7. **Privacidade:** relatórios gerais são agregados; a API do motor não expõe mensagens privadas nem dados sensíveis.
8. **Anomalias:** sinais de pico econômico e volume de pulls são evidências administrativas, nunca acusação ou punição.
9. **SQL safety:** perguntas usam registry de métricas, não SQL livre gerado pelo modelo.
10. **Bot:** `!cardinal analytics <pergunta>` seleciona uma métrica permitida e mostra resumo no padrão Cardinal.
11. **Métricas e retenção:** definições em `CARDINAL_ANALYTICS_METRICS.md`; atividade é evento rastreado e inatividade padrão é 30 dias sem evento, não churn automático.
12. **Arquivos:** `cardinal/analytics/index.js`, `cardinal/tests/cardinal-analytics.test.js`, `apps/bot/src/commands/cardinalAnalytics.js` e documentação de métricas.
13. **Testes:** distribuição de Rank, fluxo econômico, guildas, privacidade, agregação de evento, SQL registry, ausência de dados e anomalia.

Limitações: D1/D7/D30, participação histórica anterior, conclusão de missões, resultados detalhados de banner, uso de passivas e impacto de eventos dependem de eventos que ainda não existiam antes da telemetria. Não foram inventados backfills. A UI analítica e alertas agendados seguem dependentes da autoridade/configuração administrativa. A Fase 14 não foi iniciada.
