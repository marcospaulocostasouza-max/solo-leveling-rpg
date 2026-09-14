# Códigos de resgate

## Criar pelo bot

Um ADM usa `!criar codigo` (também aceita `!criar código`). Responda na mesma conversa às perguntas: código, descrição, início, expiração, limite global, Cristais, Won, XP, Maestria e presença de itens, caixas, títulos, passivas, técnicas, chaves de dungeon, materiais e núcleos. Use 0 para moedas/XP que não entrarão, “não” para categorias ausentes, “agora”, “nunca” e “ilimitado” quando apropriado.

Datas usam DD/MM/AAAA HH:mm no horário de Brasília. Expiração sem horário vale até 23:59:59 daquele dia. Cada recompensa de catálogo exige nome existente, seleção do ID se houver homônimos, quantidade e confirmação. Depois de adicionar, a mesma categoria permite mais recompensas; responda “não” para avançar.

Na pergunta de validade, escolha “tempo indeterminado” (também aceita “para sempre” ou “nunca”) ou “tempo limite”. Com tempo limite, o bot pergunta a data de expiração. Isso define o período disponível para resgate; cada jogador continua podendo resgatar somente uma vez.

O resumo final pergunta se deseja criar e ativar. Apenas “sim” salva o código; “não” ou `!cancelar codigo` cancelam. Título substitui o título atual, como no sistema existente, e o questionário avisa disso. Passivas mantêm o limite existente de dez acumulações. Técnicas já possuídas seguem a entrega existente do gacha, que não cria outra cópia. Catálogos exclusivos de títulos/passivas são os itens raros cadastrados no banco. Nenhum item inexistente é inventado pelo questionário.

Sessões persistem no banco e pertencem ao ADM e à conversa. A permissão administrativa é verificada ao iniciar e a cada resposta. Uma criação aberta de banner/dungeon deve ser encerrada antes; uma criação aberta de código também impede iniciar outra criação na mesma conversa.

## Gerenciar

- `!codigo listar [página]`: vinte códigos por página, com estados ativo, futuro, expirado e desativado.
- `!codigo info SOLO2026`: período, descrição, status, usos e recompensas.
- `!codigo desativar SOLO2026`: bloqueia novos resgates e mantém o histórico.
- `!codigo ativar SOLO2026`: reativa respeitando as datas e o limite originais.

Não há edição das recompensas de um código já criado; crie outro código para outro pacote.

Um código pode entregar apenas um título, porque a ficha possui um único título atual. Permissões também são verificadas dentro do serviço compartilhado para criação e ativação/desativação.

## Resgatar no site

Também é possível resgatar pelo bot com `!resgatar codigo: SOLO2026` (aceita “código” com acento), em grupo ou privado. O destinatário é identificado pelo autor da mensagem; a lista de recompensas mostra as quantidades. Bot e site usam o mesmo claim: resgatar em um impede repetir no outro. Implementação em `apps/bot/src/commands/resgatarCodigo.js`, teste em `apps/bot/tests/resgatarCodigo.test.js`, com roteamento em `commandHandler.js`.

Entre autenticado pelo `!site` e abra **Resgatar Código** no menu, ou `/resgatar-codigo`. Digite o código e clique em Resgatar. O formulário desabilita o envio enquanto aguarda, mostra quantidades após o sucesso e mantém o código após falha. A sessão fornece o jogador; o navegador envia exclusivamente `{code}` para `POST /api/redeem`. A API rejeita campos de recompensas e IDs de jogadores enviados pelo navegador.

## Reutilização e proteção

O serviço usa o formato existente do gacha (`reward_type`, `referencia_id`, `quantidade`) e suas funções `resolverRecompensa` e `entregar`. Inventário, técnica, título, passiva, XP/progressão, Won, Maestria e Cristais entram nos armazenamentos reais. Chaves, materiais e núcleos são itens reais e mantêm os fluxos existentes de uso. O histórico da ficha registra origem `REDEEM_CODE`; o claim conserva as recompensas entregues.

Em PostgreSQL, uma transação bloqueia o código e depois o jogador com `FOR UPDATE`, lê recompensas oficiais, entrega, registra claim e incrementa usos. A constraint UNIQUE(código, jogador) dos claims impede duplicidade no banco. Falhas desfazem toda a transação. A normalização usa trim/uppercase, reforçada por CHECK e UNIQUE no código. SQLite usa transações serializadas.

Até oito tipos de catálogo e quatro moedas/recursos são expostos no questionário. Um código aceita até trinta recompensas; catálogo até mil unidades por entrada. Novos tipos devem primeiro possuir resolução e entrega no sistema existente do gacha, antes de serem expostos no menu de `redeemWizardService.js`. Não basta acrescentar uma opção visual.

## Migration e aplicação

`packages/database/migrations/003_redeem_codes.sql` cria `redeem_codes`, `redeem_code_claims` e `redeem_creation_sessions`, além do índice por jogador. Segue o diretório de migrations SQLite existente; o serviço aplica o mesmo arquivo em PostgreSQL convertendo as chaves autoincrementais para BIGSERIAL. A preparação é idempotente e automática na primeira utilização do serviço. As tabelas prévias são preparadas pelas rotinas oficiais de schema do gacha e histórico.

Reinicie o bot para carregar os comandos; publique a versão atualizada do site pelo fluxo habitual para disponibilizar página/API no endereço online. Não houve commit, push ou deploy nesta implementação.

## Validação local

Na raiz: `node --test apps/bot/tests/redeemCodes.test.js apps/bot/tests/redeemWizard.test.js`.

Para PostgreSQL, no PowerShell: defina `$env:REDEEM_TEST_POSTGRES='1'` e execute `node --test apps/bot/tests/redeemCodes.test.js`. Os testes usam schemas exclusivos e os removem ao terminar, sem modificar jogadores reais. Depois remova essa variável com `Remove-Item Env:REDEEM_TEST_POSTGRES`.

Em `apps/site`: `node --test tests/redeem-flow.test.cjs` e `npm run build`.

Verificações: códigos válidos/inexistentes, datas, desativação, normalização, dois jogadores, duplicidade concorrente, limite concorrente, moedas/itens/títulos/passivas/técnicas, XP cumulativo, rollback, permissão ADM, questionário sem criação antecipada, autenticação da API, rejeição de payload adulterado e formulário em viewport 375 px com duplo envio. O teste de interface usa JSDOM; não substitui uma inspeção visual em navegador real. O fluxo real autenticado de produção ainda deve ser acompanhado após atualização.

## Arquivos desta implementação

Criados:

- `packages/database/migrations/003_redeem_codes.sql`
- `packages/database/redeem.js`
- `apps/bot/src/systems/redeemWizardService.js`
- `apps/bot/src/commands/redeemAdm.js`
- `apps/bot/tests/redeemCodes.test.js`
- `apps/bot/tests/redeemWizard.test.js`
- `apps/site/app/api/redeem/route.ts`
- `apps/site/app/resgatar-codigo/page.tsx`
- `apps/site/components/RedeemCode.tsx`
- `apps/site/tests/redeem-flow.test.cjs`
- `docs/codigos-de-resgate.md`

Alterados:

- `apps/bot/src/systems/gachaEngine.js`: exporta entrega existente e permite resolver catálogo usando o query da transação.
- `apps/bot/src/core/commandHandler.js`: comandos e respostas do questionário.
- `apps/site/components/HunterPortal.tsx`: navegação e conteúdo da nova página.
- `apps/site/app/globals.css`: aparência responsiva do formulário.
