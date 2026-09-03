# Relatório — Cardinal Knowledge Fase 2

Data: 2026-09-03.

## 1. Fontes encontradas

O indexador percorre `README.md`, `docs/`, `packages/database/`, `packages/datasets/`, `packages/rpg-core/`, comandos, sistemas e definições de banco do bot, além do catálogo arquitetural do site. Ele lê Markdown, JSON, YAML, JavaScript, TypeScript e SQL. Também consulta em modo somente leitura as tabelas públicas de conteúdo do RPG: itens, técnicas, dungeons, conjuntos, bônus de conjuntos, banners, títulos e passivas. Tabelas ausentes são ignoradas sem impedir a indexação.

A exportação oficial `slots` de `packages/database/index.js` gera um documento estruturado durante cada atualização. Isso melhora a recuperação sem manter uma cópia manual independente da regra.

São excluídos `.git`, `node_modules`, builds, caches, logs, modelos, binários, backups, `.env`, credenciais, autenticação e datasets privados de treinamento de NPCs. Dados de jogadores, administradores, sessões, inventários pessoais e históricos não são consultados.

## 2. Volume e categorias

O índice validado contém 5.715 fragmentos provenientes de 299 identificadores de fonte: 3.604 fragmentos de arquivos, 2.110 entidades do banco e uma visão estruturada canônica. As entidades atualmente encontradas no banco são 567 itens, 515 registros de conjuntos/bônus e 1.028 técnicas.

Categorias com conteúdo: `administration`, `attributes`, `banners`, `classes`, `dungeons`, `economy`, `equipment`, `events`, `guilds`, `locations`, `materials`, `missions`, `npcs`, `passives`, `ranks`, `rules`, `sets`, `skills`, `territories`, `titles` e `weapons`. Categorias vazias não são criadas artificialmente.

## 3. Busca, índice e contexto

O mecanismo é SQLite FTS5 com BM25, normalização de acentos, expansão lexical por sinônimos em português, reforço de fontes canônicas e filtros por categoria, sistema, entidade e tipo. Não há embeddings: isso evita carregar outro modelo e respeita o hardware limitado. O índice persistente está em `cardinal/cache/knowledge.db`, é ignorado pelo Git e pode ser reconstruído.

O Context Builder seleciona até oito fragmentos e no máximo 12.000 caracteres (aproximadamente 3.000 tokens), preservando espaço do contexto de 8.192 tokens para prompt, histórico e resposta. O histórico é temporário e separado do conhecimento permanente. Consultas sem evidência retornam ausência de regra oficial sem chamar o Qwen.

## 4. Arquivos

Criados na Fase 2:

- `cardinal/knowledge/categories.js`
- `cardinal/knowledge/context-builder.js`
- `cardinal/knowledge/database-sources.js`
- `cardinal/knowledge/index.js`
- `cardinal/knowledge/indexer.js`
- `cardinal/knowledge/parsers.js`
- `cardinal/knowledge/retriever.js`
- `cardinal/knowledge/sources.js`
- `cardinal/knowledge/store.js`
- `cardinal/core/assistant.js`
- `cardinal/runtime/update-cardinal-knowledge.js`
- `cardinal/tests/cardinal-knowledge.test.js`
- este relatório

Modificados na Fase 2: `cardinal/config/model.json`, `cardinal/core/index.js`, `cardinal/prompts/system.txt`, `cardinal/runtime/cardinal-cli.js`, `cardinal/README.md`, `.gitignore` e `package.json`.

## 5. Operação e testes

- Criar/reconstruir integralmente: `npm run cardinal:reindex`.
- Atualizar somente alterações: `npm run cardinal:index`.
- Iniciar modelo: `npm run cardinal:start`.
- CLI normal: `npm run cardinal:cli`.
- CLI com rastreabilidade: `node cardinal/runtime/cardinal-cli.js --debug "pergunta"`.
- Executar testes: `npm run cardinal:test`.

Consultas verificadas incluem slots de equipamento, regras de guildas, criação de dungeons, materiais e uma regra deliberadamente inexistente. A consulta real de slots retornou corretamente Cabeça 1, Corpo 1, Acessórios 4, Item de Apoio 1, Pernas 2, Pés 1, Arma 1 2 e Arma 2 1, com a fonte canônica em primeiro lugar. A consulta inexistente não acionou o modelo.

Resultado automatizado final: 11 testes aprovados, nenhum reprovado. Foram cobertos configuração local, saúde do servidor, resposta do cliente, indisponibilidade, resposta inválida, busca exata, sinônimos, não alucinação, filtro, atualização incremental e limite de contexto. Após a reconstrução, uma atualização sem mudanças registrou 5.715 documentos inalterados; depois de alterar apenas a visão canônica, exatamente um documento foi atualizado.

## 6. Segurança, limitações e próximos passos

O Cardinal permanece somente leitura. Não há tools para escrita, mutação do banco, administração, alteração de jogadores, edição automática, integração com NPCs/site ou deploy. Nenhum conteúdo é enviado a serviços externos.

Limitações atuais: a busca semântica é lexical, não neural; a taxonomia é inferida e pode exigir refinamento; mudanças exigem executar a atualização; tabelas inexistentes ou indisponíveis não entram no índice; o Qwen local responde corretamente, mas no hardware testado uma consulta completa levou cerca de 84 segundos. Há ainda um arquivo IQ4_XS não utilizado em `cardinal/models`; o runtime ativo usa o Q4_K_M já existente no cache local.

Próximos passos recomendados, sem executá-los nesta fase: automatizar a atualização do índice após mudanças de conteúdo, ampliar testes de conflitos entre fontes, refinar ranking por intenção e, somente na Fase 3, projetar tools de criação estruturada com validação e autorização explícitas.
