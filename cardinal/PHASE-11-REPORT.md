# Fase 11 — Cardinal Balance, QA & Simulation Engine

Status: concluída e verificada.

1. **Arquitetura:** `cardinal/balance` mantém análises determinísticas, relatórios SQLite e simuladores sem depender do Qwen para cálculo.
2. **Baselines:** itens são comparados por tier e categoria usando registros reais da tabela `itens`.
3. **Entidades suportadas:** itens, passivas, banners, Dungeons, economia e payloads de exploit.
4. **Métricas:** POWER por soma de atributos, ECONOMY por preço/custo, REWARD, RISK e comparação percentual com pares reais.
5. **Simuladores:** Monte Carlo de banner com P50/P90/média/custo esperado e projeção econômica por população.
6. **Economia:** separa fonte, sink e net para cenários informados; não inventa população real.
7. **Banners:** valida pesos positivos, grande prêmio/pity, custo esperado e pool inválido.
8. **Dungeons:** valida recompensa mensurável e valores inválidos; dificuldade detalhada depende de regras/monstros estruturados.
9. **Itens:** detecta outliers altos/baixos e preço negativo; conteúdo legal pode receber warning sem ser bloqueado.
10. **Passivas:** detector conservador de stacking infinito e gatilho circular textual.
11. **Build simulation:** adiada porque ordem oficial de multiplicadores e compatibilidade de slots ainda não estão centralizadas.
12. **Exploit scanner:** NEGATIVE_COST, DOUBLE_CLAIM, LOCATION_BYPASS e COOLDOWN_BYPASS são categorizados deterministicamente.
13. **Regression:** testes Cardinal existentes continuam parte do gate; módulo novo adiciona testes unitários próprios.
14. **Forge:** o Quality Gate analisa drafts publicáveis sem modificar a versão; o relatório é persistido antes da publicação.
15. **Developer:** `developerImpact` mapeia arquivos alterados para escopos de regressão de gacha/economia, Dungeons/mundo, itens/equipamentos e economia.
16. **Publisher:** todo draft de item, banner, Dungeon ou passiva passa pelo Quality Gate; riscos críticos bloqueiam por padrão.
17. **Orchestrator:** registry e handler suportam `balance.quality_gate`, `balance.simulate_banner`, `balance.simulate_economy` e `balance.exploit_scan`.
18. **Quality gates:** alertas são não bloqueantes, exceto riscos críticos quando `CARDINAL_BLOCK_CRITICAL_BALANCE_ISSUES` for habilitado.
19. **Permissões:** `CARDINAL_BALANCE_READ`, `CARDINAL_BALANCE_RUN` e `CARDINAL_QA_RUN` foram adicionadas ao RBAC de conteúdo/economia, superadmin e owner.
20. **UI:** comandos `!cardinal balance` e `!cardinal exploit-scan` usam renderizador visual da Fase 8.
21. **Arquivos criados:** `cardinal/balance/index.js`, `cardinal/tests/cardinal-balance.test.js`, `apps/bot/src/commands/cardinalBalance.js` e este relatório.
22. **Arquivos modificados:** factory/Admin service/Publisher/RBAC e roteamento Cardinal.
23. **Testes:** outlier, passiva circular/infinita, banner inválido, limites de simulação, economia, exploit, persistência/bloqueio do gate e impacto por arquivo.
24. **Exemplos:** arma com +100 contra pares Rank B de 20–25 recebe `BALANCE_OUTLIER_HIGH`; banner sem peso positivo é inválido.
25. **Problemas encontrados:** regras de dificuldade de Dungeon e ordem de multiplicadores de build não estão centralizadas.
26. **Não calculável:** DPS real, títulos, set cross-synergy, power creep e inflação histórica precisam de telemetria/regras adicionais.
27. **Limitações:** scanner não executa ataques contra produção; só avalia payloads ou testes controlados.
28. **Verificação final:** `node --test cardinal/tests/*.test.js` passou com 109/109; `npm run site:build` concluiu com sucesso.
