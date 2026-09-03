# Relatório — Cardinal Forge Fase 3

Data: 2026-09-03.

## 1. Tipos de Forge implementados

O registro central possui 14 criadores: `weapon`, `armor`, `accessory`, `equipment` (qualquer slot oficial), `consumable`, `material`, `set`, `passive`, `title`, `mission`, `banner`, `event`, `dungeon` e `guild`. Todos usam o mesmo contrato modular (`generate`, `validate`; `publish` bloqueado) sem cadeia espalhada de condicionais.

## 2. Schemas e estruturas oficiais

Os schemas versionados v1 foram adaptados às estruturas existentes:

- equipamentos, consumíveis e materiais: tabela `itens`, ficha `!Fitem`, slots exportados por `packages/database/index.js` e limites `bonusBase` de `forjaSystem.COMBINACOES_MATERIAIS`;
- conjuntos: `equipment_sets`, `equipment_set_items` e bônus obrigatórios de 2, 4 e 6 peças;
- passivas e títulos: fichas administrativas atuais, com nome, categoria, Rank, descrição, efeito e condição;
- missões: tabela `missoes`, com objetivo e recompensas de XP/Won;
- banners: `gacha_banners`, pool ponderado, período, custo de 100/1000 cristais e pity operacional no 100º giro;
- eventos: tabela `eventos`, com referências temporárias de draft para composição;
- dungeons: tabela `dungeons`, Ranks E–S, Gate comum/vermelho, andar, boss e recompensas;
- guildas: tabela `guildas` e regras atuais de custo 200.000 Won, níveis 1–10 e até 10 membros.

Materiais reutilizam o formato reduzido de `itens`, pois não existe uma entidade persistente dedicada com origem/crafting. Campos sem suporte oficial não foram inventados.

## 3. Validadores

Foram criadas validações determinísticas para schema/campos extras, slots e compatibilidade por tipo, Rank/Tier, atributos inteiros não negativos, limite de bônus por Rank/categoria, estágios de conjuntos, passivas/títulos, missão/local, período e pool de banner, Dungeon/Gate/recompensas, guilda, duplicidade exata/aproximada e fidelidade às restrições do Generation Plan.

Toda validação retorna `{ valid, errors, warnings, rules_checked, sources }`. Os erros possuem códigos estáveis, incluindo `CARDINAL_INVALID_SLOT`, `CARDINAL_ATTRIBUTE_LIMIT`, `CARDINAL_UNKNOWN_RARITY`, `CARDINAL_DUPLICATE_ENTITY`, `CARDINAL_RULE_NOT_FOUND`, `CARDINAL_REQUEST_CONSTRAINT_MISMATCH`, `CARDINAL_VALIDATION_FAILED` e `CARDINAL_PUBLISH_DISABLED`.

## 4. Arquivos criados e alterados

Criados:

- `cardinal/forge/base-forge.js`
- `cardinal/forge/draft-store.js`
- `cardinal/forge/errors.js`
- `cardinal/forge/index.js`
- `cardinal/forge/json.js`
- `cardinal/forge/permissions.js`
- `cardinal/forge/planner.js`
- `cardinal/forge/registry.js`
- `cardinal/forge/renderer.js`
- `cardinal/forge/schemas.js`
- `cardinal/forge/service.js`
- `cardinal/forge/validator.js`
- `cardinal/prompts/forge.txt`
- `cardinal/tests/cardinal-forge.test.js`
- este relatório

Alterados: `cardinal/core/client.js`, `cardinal/core/index.js`, `cardinal/runtime/cardinal-cli.js`, `cardinal/README.md` e `package.json`.

## 5. Drafts, versões, rollback e auditoria

O armazenamento é um SQLite separado em `cardinal/cache/forge-drafts.db`, ignorado pelo Git. Ele contém apenas drafts, versões imutáveis e audit log da Forge; não escreve no banco principal.

Cada criação recebe UUID, autor, pedido, tipo, status, conteúdo, validação, fontes e versão. Edições e revisões conversacionais criam versões novas. `compare` informa campos alterados. `rollback` copia uma versão antiga para uma versão nova e a revalida; nunca sobrescreve o histórico. Status usados nesta fase são `VALID` e `INVALID`; aprovação não publica conteúdo.

O audit log registra geração, erros, revisões, edições e rollback, incluindo regras verificadas, sem guardar credenciais. As permissões disponíveis são apenas `READ`, `FORGE_GENERATE`, `FORGE_VALIDATE` e `FORGE_EDIT_DRAFT`. Permissões administrativas e de escrita ficam explicitamente fora da lista segura.

## 6. CLI e comandos de teste

```powershell
npm run cardinal:start
npm run cardinal:index
npm run cardinal:test
npm run cardinal:forge -- create weapon "Crie a Excalibur Rank A com 20 atributos"
npm run cardinal:forge -- validate <draft_id>
npm run cardinal:forge -- show <draft_id> [versao]
npm run cardinal:forge -- versions <draft_id>
npm run cardinal:forge -- compare <draft_id> <v1> <v2>
npm run cardinal:forge -- edit <draft_id> '{"forca_bonus":15,"velocidade_bonus":5}'
npm run cardinal:forge -- rollback <draft_id> <versao>
```

A CLI interativa mantém o draft ativo. Pedidos como “Agora troque 5 de força por velocidade” são enviados como revisão, revalidados e gravados em uma nova versão.

## 7. Exemplos reais e resultados

Foi executada uma geração real pelo Qwen3.5-4B Q4_K_M para Excalibur Rank A. O primeiro teste revelou um envelope JSON indevido; ele foi preservado como draft inválido e levou à normalização segura de envelopes. O segundo gerou estrutura válida, mas atribuiu apenas 10 dos 20 pontos pedidos; isso levou à validação determinística do plano. O mesmo draft foi corrigido sem publicação e terminou em `draft_fa58f184-f414-4393-9154-37e9bedfd1fe`, v3, `VALID`, com 20 de Força, slot Arma 1 e Rank A. O aviso de duplicidade foi mantido porque já existe uma Excalibur nas fontes.

Resultado final: 28 testes aprovados, nenhum reprovado. A suíte cobre arma válida, teto excedido, limite derivado da regra oficial, slot inexistente, envelope do modelo, campo fora do schema, divergência do plano, duplicata, missão em Busan, banner, Dungeon, regra inexistente, edição, revisão conversacional, versões, comparação, rollback, bloqueio de publicação e toda a regressão das Fases 1 e 2.

## 8. Problemas e limitações

- Não há regra geral única para bônus de itens; os limites aplicáveis vêm das combinações oficiais de forja por Rank/categoria.
- Tiers narrativos (`Raro`, `Épico`, `Lendário`, `Único`) não possuem tabela oficial equivalente de teto de atributos.
- Passivas não possuem limites globais estruturados para porcentagem, stacking, duração e cooldown; a Forge valida formato e evidencia a ausência, mas não inventa números.
- Materiais não possuem tabela/schema persistente dedicado para origem, uso e crafting.
- A tabela de missões não possui campos próprios para Rank, local, NPC, pré-requisitos, cooldown e repetição; esses campos existem apenas no draft até uma futura decisão de schema.
- Eventos persistidos são simples; composição usa IDs temporários somente dentro da Forge.
- Banners usam pesos, não probabilidades persistidas fixas. A chance é derivada do peso total.
- O Qwen local ainda pode levar aproximadamente 50–90 segundos por geração no hardware atual; validação, versões e rollback não exigem inferência.

## 9. Próxima fase recomendada

Antes de qualquer Publisher, formalizar migrations e políticas para campos que hoje só existem nos drafts, definir limites oficiais de passivas e tiers narrativos, criar aprovação humana explícita e mapear cada schema Forge para uma operação transacional autorizada. A Fase 4 não foi implementada.
