# Fase 9 — Cardinal Memory & Context Engine

1. **Arquitetura:** Core → Context Manager → sessões/conversas/memórias → Memory Retriever → Knowledge Retriever → Context Builder → Qwen.
2. **Tipos:** SESSION, CONVERSATION, ADMIN, TASK, WORKFLOW, DRAFT e DECISION.
3. **Schemas:** tabelas separadas para sessões, conversas, mensagens temporárias, memórias e versões de decisões.
4. **Banco:** SQLite dedicado em `cardinal/cache/memory.db`; Knowledge continua em seu próprio banco.
5. **Persistência:** mensagens brutas têm retenção; apenas decisões, preferências úteis, contextos ativos e referências futuras são promovidos.
6. **Expiração:** sessão e conversa temporária expiram por configuração; PINNED nunca expira automaticamente.
7. **Ranking:** mesma sessão, task, draft, workflow e entidade; depois importância, similaridade textual, recência com decay.
8. **Sumarização:** incremental e estruturada, preservando objetivo, decisões, IDs ativos, pendências e tópicos recentes.
9. **Referências:** resolve linguagem natural por tipo, escopo, recência e ranking; empates próximos retornam `AMBIGUOUS` com opções.
10. **Entity linking:** memórias guardam `entity_type` e `entity_id`, além de `draft_id`, `workflow_id` ou `task_id` reais.
11. **Decisões:** chave estável, versões v1/v2, somente a versão mais recente ativa e histórico preservado.
12. **Memory x Knowledge:** bancos, DTOs e blocos distintos. A ordem explícita mantém estado real e Knowledge acima de decisões e conversa.
13. **Privacidade:** buscas retornam apenas memórias do ator ou compartilhadas; acesso cruzado exige `memoryAdmin`.
14. **Permissões:** CARDINAL_MEMORY_READ, WRITE, DELETE e ADMIN adicionadas ao RBAC.
15. **Discord/WhatsApp:** o projeto usa WhatsApp. Sessão pode ser vinculada a ator e channel/thread por `channel_id`; não foi criada API Discord inexistente.
16. **Web:** aba Memória com conversas, busca, fixação, esquecimento e arquivamento; cada chat recebe conversation/session IDs.
17. **Visual:** reutiliza cards, cores, status, navegação, responsividade e acessibilidade da Fase 8.
18. **Configurações:** ENABLED, RAW_RETENTION_DAYS, SESSION_TTL, AUTO_SAVE_DECISIONS, MAX_CONTEXT_ITEMS e SUMMARIZATION_ENABLED.
19. **Arquivos criados:** `cardinal/memory/*`, testes de memória e este relatório.
20. **Arquivos modificados:** Assistant, Context Builder, Core exports, Forge, RBAC, Operations health/backup, API/console/CSS web e `.env.example`.
21. **Testes:** sessão, conversa, isolamento, draft/workflow, ambiguidade, prioridade, conflito, versionamento, forget/audit, expiração, pinned, segredo, injection e budget.
22. **Restart:** banco fechado e reaberto; sessão e conversa foram recuperadas do SQLite.
23. **Ambiguidade:** dois banners equivalentes retornam duas opções e nenhum é selecionado automaticamente.
24. **Conflito Knowledge:** teste confirma a regra oficial no contexto antes da memória conflitante, marcada como dado não instrucional.
25. **Limitações:** busca semântica não foi duplicada; a memória usa ranking textual leve. Extração automática é determinística e conservadora. Ações compartilhadas/superadmin existem no serviço, mas a UI normal permanece restrita ao próprio ADM. O restore operacional continua restaurando o banco principal; a cópia de memória entra no backup para recuperação manual controlada.
26. **Próxima fase:** conectar memória determinística a todos os publishers e eventos finais do Orchestrator, adicionar tela de detalhe/versionamento e política formal de restore da memória. Nenhuma Fase 10 foi iniciada.
