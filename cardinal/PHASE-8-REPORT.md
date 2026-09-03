# Fase 8 — Cardinal Interface & RPG Visual Integration

1. **Referências `!jogador`:** `apps/bot/src/commands/jogador.js`, `apps/bot/src/core/messageService.js`, `apps/site/components/HunterPortal.tsx` e `apps/site/app/globals.css`.
2. **Padrões identificados:** cabeçalho forte, seções com separadores, campos verticais, rodapé de sistema, paleta violeta/ciano, painéis escuros, bordas luminosas e respostas curtas.
3. **Componentes reutilizados:** tokens CSS `--sl-*`, `Intl`, ícones Lucide, sessão HTTP e `database.isAdmin`.
4. **Design tokens:** tema comum com cores, divisores, símbolos de estado, rótulos e limites por canal em `presentation/theme`.
5. **Renderers:** WhatsApp, Web e CLI, todos consumindo o mesmo DTO.
6. **Templates:** INFO, SUCCESS, WARNING, ERROR, CONFIRM, FORGE_RESULT, ADMIN_RESULT, WORKFLOW, DEVELOPER_CHANGE, OPERATIONS_STATUS, INCIDENT e KNOWLEDGE_RESULT.
7. **Bot/Discord:** o projeto usa WhatsApp, não Discord. A equivalência nativa é uma ficha textual paginada; não foram inventados embeds incompatíveis.
8. **Interface web:** console administrativo com chat, Workflows, Forge, Aprovações, Histórico, Developer, Operations e Ajustes.
9. **Comandos alterados:** `!cardinal`, `!cardinal dev`, `!cardinal ops` e `!cardinal workflow/orquestrar` usam a camada de apresentação.
10. **Rotas:** `/admin/cardinal` e `/api/admin/cardinal` (GET/POST).
11. **Permissões:** página e API validam sessão e `database.isAdmin`; o bot continua validando cada comando no backend.
12. **Paginação:** o renderer WhatsApp divide por blocos e preserva todo o conteúdo, incluindo indicador de página.
13. **Responsividade:** sidebar recolhível abaixo de 820 px, campos em uma coluna e controles com altura tátil em mobile.
14. **Mensagem normal:** `CARDINAL // KNOWLEDGE`, pergunta, resposta fundamentada e regra oficial opcional.
15. **Forge:** ficha de arma com nome, tipo, atributos, validação e Draft ID, sem JSON bruto.
16. **Admin:** alteração de Won mostra jogador, operação, `antes → depois` com números pt-BR e transação.
17. **Workflow:** progresso percentual é calculado somente pelas tasks reais e lista cada etapa por estado.
18. **Developer:** resumo de branch, arquivos, testes e build; diff mostra lista limitada e paginável.
19. **Operations:** estados dos serviços e incidentes usam templates próprios; falhas não exibem stack interno.
20. **Testes:** 12/12 testes de apresentação; build Next aprovado; lint dos arquivos novos aprovado; core revalidado 5/5. A suíte de 84 testes teve 83 passes e uma oscilação de health-check local, que passou na repetição isolada.
21. **Arquivos criados:** `cardinal/presentation/**`, console/página/API web, teste visual, este relatório e `CARDINAL_RPG_VISUAL_GUIDE.md`.
22. **Arquivos modificados:** renderers Admin/Forge, quatro comandos Cardinal e `globals.css`.
23. **Limitações:** sessões e IDs opacos ficam em memória do processo nesta fase; reiniciar o site encerra sessões e invalida ações. Não há streaming porque o cliente atual não o oferece de forma estável. As abas sem registros mostram estado vazio, sem dados simulados.
24. **Diferenças inevitáveis:** WhatsApp não oferece os embeds/componentes do Discord; o site possui botões e cards, enquanto o bot usa comandos explícitos. O conteúdo nasce do mesmo DTO.
25. **Próxima fase:** persistir sessões/ações em armazenamento compartilhado, conectar listagens reais de drafts/auditoria às abas e adicionar teste visual autenticado quando houver fixture de sessão administrativa. Nenhuma Fase 9 foi iniciada.
