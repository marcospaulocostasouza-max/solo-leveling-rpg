# Fase 10 — Cardinal World Director

1. **World State:** consulta dinâmica de Dungeons abertas, banners ativos, guildas, eventos e aparições de NPC; não replica o banco inteiro.
2. **Entidades:** registry persistente cobre eventos, schedules, aparições de NPC, notificações, audit e locks; dados de Dungeon/banner/guilda permanecem nas fontes reais.
3. **Mapa:** locais são respeitados pelos IDs persistentes do mapa; não há redesenho ou cópia do mapa.
4. **Localização:** utiliza `player_locations`/`jogadores.localizacao` por `database.playerLocation`.
5. **Viagens:** eligibility bloqueia Dungeon e interação quando o local não coincide (`WORLD_TRAVEL_REQUIRED` / `WORLD_LOCATION_REQUIRED`).
6. **NPCs:** contexto read-only usa overrides oficiais; spawn valida que um NPC não esteja ativo em dois locais.
7. **Dungeons:** overview e eligibility usam Dungeons semanais reais; planner semanal retorna `WORLD_RULE_PENDING` pois seleção determinística não existe no projeto.
8. **Gates:** o World Director preserva o `gate_type` real da Dungeon e não reduz Gate vermelho a estética.
9. **Eventos:** lifecycle DRAFT → SCHEDULED → ACTIVE/PAUSED → ENDED/CANCELLED, com validação de datas e conflitos.
10. **Banners:** lidos de `gacha_banners` ativos; o Director não altera odds ou economia diretamente.
11. **Guildas:** consulta guildas reais; claim territorial é conservador enquanto regras estruturadas não existem.
12. **Territórios:** Seoul é bloqueada como protegida e demais conquistas sem regra retornam `WORLD_RULE_PENDING`.
13. **Calendário:** schedules persistentes registram horário explícito, actor, workflow, risco e política de atraso.
14. **Scheduler:** `tick` executa somente tarefas cadastradas, sobrevive reinício e trata atraso como RUN_IF_STILL_VALID, EXPIRE ou REQUIRE_REVIEW.
15. **Dia/noite:** DAY/SUNSET/NIGHT calcula hora em `CARDINAL_WORLD_TIMEZONE`.
16. **Notificações:** planner persistente com chave de deduplicação; não publica mensagens diretamente sem canal oficial.
17. **Eligibility:** funções determinísticas para Dungeon, NPC, território e recompensa; não usa LLM.
18. **Permissões:** CARDINAL_WORLD_READ, DUNGEONS, EVENTS, NPCS, BANNERS, TERRITORIES, SCHEDULE e ADMIN adicionadas ao RBAC.
19. **Risco:** policies classificam leitura, evento, Dungeon, NPC, banner, território e reset; reset exige confirmação crítica.
20. **Audit:** mudanças guardam actor, before/after, motivo, workflow e timestamp em `world_audit`.
21. **Rollback:** snapshots lógicos suportam reversão de evento quando segura; não apagam interação de jogador já efetivada.
22. **UI:** API do painel Cardinal expõe `world` e status World; o bot possui `!cardinal world status` e plano semanal com visual da Fase 8.
23. **Arquivos criados:** `cardinal/world/index.js`, `policies.js`, `eligibility.js`, `enhanced.js`, `cardinalWorld.js`, testes e este relatório.
24. **Arquivos modificados:** RBAC, Orchestrator factory/handlers, Operations health, API Cardinal e `.env.example`.
25. **Testes:** estado, timezone, localização, Seoul protegida, scheduler/restart, dedupe, regra indefinida, lifecycle, conflito, audit, lock, NPC duplicado e eligibility.
26. **Resultados:** testes World aprovados; o World Director usa SQLite próprio e retorna códigos explícitos em vez de inventar estado.
27. **Regras indefinidas:** algoritmo de spawn semanal, critérios de conquista territorial, GvG e regras detalhadas de Gate vermelho não foram encontrados de forma estruturada.
28. **Limitações:** publicação de Dungeon/evento continua passando pelos módulos Forge/Publisher/Admin; o scheduler não executa ações financeiras nem mutations livres.
29. **Riscos restantes:** a fonte de território ainda é arquivo/serviço disperso; deve ser estruturada antes de automatizar claims ou renda.
30. **Próxima fase:** Fase 11 pode consumir World State para QA de eventos/Dungeons; não foi iniciada automaticamente.
