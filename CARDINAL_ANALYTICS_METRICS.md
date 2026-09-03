# Cardinal Analytics Metrics

`PLAYER_COUNT_BY_RANK`: contagem atual por Rank, derivada da tabela `jogadores`.
`WON_FLOW`: soma de `transacoes` no período, separada por tipo; não infere origem que não esteja registrada.
`ITEM_USAGE`, `DUNGEON_COMPLETION`, `BANNER_PULLS`, `LOCATION_HEATMAP`: histórico da telemetria Cardinal, a partir da instalação.
`GUILD_OVERVIEW`: estado atual das guildas.
`ANOMALIES`: evidências agregadas para revisão administrativa, nunca acusação ou punição.

Atividade em formato RPG é participação registrada em eventos, não DAU/WAU/MAU enquanto login/sessão não estiverem instrumentados. Inatividade configurável: 30 dias sem evento rastreado; não equivale automaticamente a churn.
