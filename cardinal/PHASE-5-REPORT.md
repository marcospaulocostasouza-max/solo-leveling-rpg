# Relatório — Fase 5: Cardinal Developer

## 1. Arquitetura criada

O fluxo implementado é: ADM autenticado → planner determinístico → Project Map + Code/RPG Knowledge → análise de impacto → task persistente → branch/worktree → editor controlado → runners → diff validator → review → aprovação → commit/merge opcional → reindexação → auditoria. Os estados são `PLANNED`, `EDITING`, `TESTING`, `FAILED`, `READY_FOR_REVIEW`, `APPROVED`, `MERGED` e `ROLLED_BACK`.

## 2. Tools de desenvolvimento

Foram expostos wrappers específicos: `search_code`, `find_symbol`, `read_source_file`, `list_related_files`, `get_project_structure`, `create_worktree`, `edit_source_file`, `create_source_file`, `rename_source_file`, `run_tests`, `run_formatter`, `run_linter`, `run_typecheck`, `run_build`, `get_git_diff`, `get_git_status` e `commit_changes`. Não existe `execute_shell`.

## 3. Proteções implementadas

Há resolução canônica de caminhos, bloqueio de saída do worktree, substituição que exige exatamente uma ocorrência, isolamento obrigatório em branch `cardinal/*`, proteção da principal, RBAC, limite de três auto-fixes, revisão obrigatória, detecção de segredo/SQL destrutivo/exclusão, mensagens semânticas de commit e merge desligado por padrão. Bugfix exige causa diagnosticada antes do patch.

## 4. Arquivos protegidos

São protegidos `.env`, `.env.*`, `.git/`, credenciais, tokens, secrets, `*.gguf`, backups e arquivos identificados como produção crítica. O scanner também bloqueia credenciais adicionadas ao diff.

## 5. Estratégia Git

Antes da edição, o manager confirma o repositório, identifica principal, branch, commit base e working tree. Mudanças existentes do usuário não são resetadas, limpas ou copiadas. Commits usam padrão como `fix(banner): ...`.

## 6. Branch/worktree

Cada task recebe `cardinal/<classificação>/<alvo>-<id>` e um worktree próprio. A origem é o `HEAD` registrado; a raiz ativa nunca é usada pelo editor. O working tree atual estava modificado e foi preservado integralmente.

## 7. Ferramenta de busca

`rg --json` fornece busca por texto/símbolo, `rg --files` busca nomes, o leitor limita linhas e caracteres, e o Project Map persistente classifica comandos, serviços, banco, APIs, site, configuração e testes. O mapa atual encontrou 228 comandos, 33 serviços, 15 APIs e 31 arquivos de site classificados.

## 8. Testes detectados

Foram detectados `node:test` para Cardinal, o script de teste do bot e testes existentes no repositório. A seleção começa nos testes relacionados e pode ampliar para a suíte Cardinal.

## 9. Lint detectado

O site possui ESLint pelo script `npm --prefix apps/site run lint`.

## 10. Build detectado

O site usa build Next.js pelo script `npm --prefix apps/site run build`. Mudança frontend não passa em review sem build aprovado.

## 11. Comandos permitidos

Executáveis reconhecidos pela política: `git`, `npm`, `npx`, `node`, `python`, `pytest` e `pnpm`. A execução real usa receitas fechadas: `cardinal_test`, `bot_test`, `site_lint` e `site_build`; argumentos livres do modelo não são aceitos.

## 12. Comandos bloqueados

São explicitamente fora da política: PowerShell/cmd/bash/sh arbitrários, curl, wget, SSH, SCP, reg, shutdown e format. Também não há download externo, SQL livre, deploy, restart ou gerenciamento do sistema operacional.

## 13. Configurações criadas

`CARDINAL_DEVELOPER_ENABLED=false`, `CARDINAL_AUTO_COMMIT=false`, `CARDINAL_AUTO_MERGE=false`, `CARDINAL_MAX_FIX_ATTEMPTS=3`, `CARDINAL_REQUIRE_REVIEW=true`, `CARDINAL_ALLOW_DATABASE_MIGRATIONS=false`, `CARDINAL_CODE_CONTEXT_CHARS=24000` e `CARDINAL_WORKTREE_ROOT=`.

## 14. Arquivos criados

Foi criada a árvore `cardinal/developer/` com config, errors, planner, analyzer/context compression, project map, busca, proteção, editor, task store, Git manager, runners, review, tools, factory, service e audit. Também foram criados `cardinal/runtime/cardinal-developer-cli.js`, `apps/bot/src/commands/cardinalDev.js`, `cardinal/tests/cardinal-developer.test.js` e este relatório.

## 15. Arquivos modificados

Foram ajustados `.env.example`, `.gitignore`, `package.json`, `cardinal/README.md`, `cardinal/admin/rbac.js`, `cardinal/admin/publisher.js` e `apps/bot/src/commands/cardinalAdmin.js`. Alterações preexistentes do usuário fora desse escopo foram preservadas.

## 16. Exemplos executados

Em repositórios temporários, o Developer processou “Corrija o bug no banner”, localizou `src/banner.js`, diagnosticou multiplicação indevida, criou worktree, aplicou patch mínimo, executou testes e chegou a `READY_FOR_REVIEW`. Também simulou teste quebrado, bloqueio de aprovação, rollback e pedido grande de Guildas.

## 17. Resultados dos testes

Foram aprovados 49/49 testes Cardinal: 7 da Fase 5 e 42 regressões das Fases 1–4. Os runners de teste e build foram exercitados sem shell livre.

## 18. Exemplo de diff

O cenário seguro gerou essencialmente `return value * 2` → `return value`, exclusivamente no worktree. O diff permaneceu disponível na task com SHA-256 para auditoria.

## 19. Rollback testado

Antes de merge, o rollback removeu somente o worktree validado e a branch `cardinal/*`; a `main` conservou o conteúdo original. Para mudança já mesclada, o código implementa `git revert`, nunca reset destrutivo.

## 20. Limitações

O modelo ainda propõe planos/patches por interfaces controladas; não recebe uma ferramenta genérica para escrever livremente. O formatter não está configurado porque o projeto não possui receita padronizada. O atendimento do pedido no review permanece uma decisão humana (`request_met` não é inferido como verdadeiro). Migrations podem ser preparadas, mas não executadas pelo runner.

## 21. Riscos restantes

Git depende da instalação e identidade locais; testes do projeto podem ter efeitos próprios; heurísticas de segredo podem produzir falso positivo ou não reconhecer um segredo exótico; merge opcional exige `main` selecionada e limpa, mas conflitos ainda precisam de tratamento humano. A qualidade do patch proposto pelo modelo continua limitada pelo Qwen 4B e pelo contexto selecionado.

## 22. Recomendações para a próxima fase

Na Fase 6, adicionar Operations como domínio separado, com identidade própria, ambientes declarados, health checks, processo/deploy allowlisted, aprovação multifator para produção, backups verificados, canário e rollback operacional. Não reutilizar o runner Developer como shell de operações.

Nenhum recurso da Fase 6 foi implementado.
