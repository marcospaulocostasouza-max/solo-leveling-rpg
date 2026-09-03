# Fase 12 — Cardinal Narrator & Content Director

Status: concluída e verificada.

1. **Arquitetura:** `cardinal/narrative` contém contexto, lore retrieval, store/versionamento, diretor e validador.
2. **Lore:** usa `KnowledgeRetriever`, classifica a confiança em `OFFICIAL_LORE`, `SYSTEM_RULE`, `WORLD_STATE`, `CHARACTER_HISTORY`, `ADMIN_DECISION`, `DRAFT_LORE` e `GENERATED_SUGGESTION`.
3. **Canon:** conteúdo começa como `DRAFT`; publicação exige `CANON` e aprovação explícita.
4. **Visibilidade:** suporta `PUBLIC`, conhecimento de jogador/personagem/NPC, `ADMIN_ONLY` e `SECRET_LORE`.
5. **Continuidade:** valida local persistente do jogador, NPC oficial e evento ativo/agendado.
6. **Personagens/NPCs:** contexto recupera ficha do jogador e perfil oficial via `npcDatabase`; o briefing preserva personalidade e não substitui a IA dos NPCs.
7. **Missão/Dungeon/Evento/Cena:** templates estruturados incluem briefing de missão, intro de Dungeon, anúncio, abertura/fecho de cena e crônica.
8. **Crônicas e arcos:** tabelas separadas para arcos, threads, crônicas confirmadas e segredos com quem-sabe/condição de revelação.
9. **Proteções:** bloqueia segredo em saída pública, agência indevida do jogador e mutação de mecânica em revisão textual.
10. **Integrações:** World Director, Memory Context, Knowledge, RBAC e tasks do Orchestrator (`narrative.generate`, `npc_brief`, `revise`).
11. **Comando:** `!cardinal narrativa criar cena <objetivo>` cria um draft administrativo visual; `arcs` e `crônica` consultam registros.
12. **Permissões:** adicionadas `CARDINAL_NARRATIVE_READ`, `CREATE`, `EDIT`, `APPROVE`, `CARDINAL_LORE_ADMIN` e `CARDINAL_SECRET_LORE`.
13. **Arquivos principais:** `cardinal/narrative/*`, `CARDINAL_NARRATIVE_STYLE.md`, `apps/bot/src/commands/cardinalNarrative.js`, RBAC e orquestrador.
14. **Testes:** geração ancorada, canon, local incompatível, segredo, agência, alteração mecânica, arco, crônica e vault de segredo.
15. **Verificação:** `node --test cardinal/tests/*.test.js` passou com **113/113**.

Limitações deliberadas: o diretor produz um draft determinístico e um prompt factual compacto para o Qwen; a chamada de geração livre pelo modelo não foi habilitada automaticamente, para não publicar ou validar texto não ancorado. Dados de morte, relações e clima só serão validados quando existirem como estado estruturado oficial. A Fase 13 não foi iniciada.
