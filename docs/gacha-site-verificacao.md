# Gacha do site — correções e teste manual

## O que mudou

O fluxo agora é: **seleção de banners → detalhe escolhido → sorteio no motor existente → animação → prêmio → Continuar**.

- A entrada consulta somente nome, descrição curta, status, datas e referência da imagem. Não consulta os pools, histórico ou inventário de todos os banners.
- A ficha completa deixou de bloquear a entrada do Gacha. O cabeçalho consulta um resumo separado.
- Detalhes são carregados somente ao abrir o banner. Voltar e reabrir reaproveita um cache de 30 segundos; o foco da janela e a atualização periódica verificam mudanças. Caches de servidor e cliente podem somar até cerca de 60 segundos para refletir alterações administrativas. O motor continua validando disponibilidade no momento do sorteio.
- Dados privados ficam no componente do jogador. Somente informações públicas do banner entram no cache compartilhado. Um sorteio invalida os detalhes dos outros banners, pois o saldo é compartilhado.
- Imagens embutidas no banco são servidas sob demanda em WebP, até 640 px nos cards e 1440 px no detalhe. URLs externas continuam usando a imagem original, sem cópias no projeto. Imagem inválida recebe um fundo alternativo.
- Os botões de 1 e 10 compartilham um bloqueio imediato. Não há repetição automática do POST. O resultado recebido é conferido antes da revelação.
- O overlay usa um portal diretamente no `document.body`, altura adaptada à tela mobile, camada acima da navegação e bloqueio da rolagem de fundo. Só fecha por “Continuar”. A atualização da ficha/histórico acontece depois disso.
- Quantidades de XP, won, maestria e itens aparecem no último resultado e no histórico do banner escolhido.

## Diagnóstico e limites

A lentidão inicial tinha causas verificáveis no código anterior: carregamento da ficha completa antes do Gacha, validação de todos os banners disponíveis, nova validação do selecionado e imagens embutidas na resposta inicial, sem cache.

A causa exata da invisibilidade relatada no navegador **não foi reproduzida nesta sessão**. O componente antigo já estava conectado ao sorteio único e ao de dez; não foi encontrado um contrato separado para o resultado único. Foram corrigidas fragilidades de montagem/camada do overlay, bloqueio durante a revelação e atualização concorrente da ficha. Não se pode atribuir com certeza o relato anterior a CSS, estado ou versão antiga servida sem observar o navegador afetado.

O usuário fará a validação visual final. Testes DOM verificam a lógica e a montagem, mas não comprovam pixels visíveis, desempenho gráfico, toque ou compatibilidade com Safari/Chrome mobile.

## Verificações locais

- Testes DOM com React StrictMode e os componentes reais: entrada leve, cache ao voltar, uma solicitação no clique duplo, espera pela API, montagem no body, fases completas do 1x, 10x, Pular, Revelar tudo, Continuar, repetição, erro de saldo e resposta incompleta.
- Testes do serviço com banco simulado: cache público, ausência de saldo na listagem, separação entre jogadores, validação só do banner aberto, expiração dentro do TTL e atualização após TTL.
- Teste da rota de imagem: autenticação, redimensionamento real com Sharp, WebP, URL externa e identificador inválido.
- Build de produção e lint dos componentes/serviços/rotas de Gacha. O build apresenta avisos preexistentes de rastreamento amplo de arquivos de NPC/Cardinal.
- Servidor de produção: `/gacha` responde 200; endpoints privados de lista, detalhe, imagem e resumo retornam 401 sem autenticação.
- Consulta somente de leitura no banco configurado: duas linhas ativas, 718 bytes de metadata SQL e 149 ms nessa execução. Não representa benchmark de rede/navegador; filtros de período podem reduzir a lista exibida.

Nenhum sorteio real foi executado nos testes; nenhum cristal foi gasto. RNG, pity, custos, entrega de recompensas e regras do bot não foram alterados. Sem migração de banco, commit ou push.

## Como testar

Na raiz do projeto, para desenvolvimento:

```powershell
npm run site
```

Se o site já estiver rodando em desenvolvimento, atualize a página; se necessário reinicie somente o terminal do site. Evite abrir outra instância do bot.

Para produção, pare o processo anterior do site e execute:

```powershell
npm run site:build
npm run site:start
```

Abra o endereço dessa instância pelo login normal do `!site`. Um site hospedado em outra máquina só recebe o código quando sua publicação for atualizada; esta tarefa não faz publicação.

1. Entre em Gacha. Deve aparecer “Escolha sua fenda”, com os cards.
2. Abra um banner; confira saldo e nome. Volte e reabra.
3. Clique em **Invocação única**. Após a resposta, deve aparecer a fenda em tela inteira, seguida do prêmio e sua quantidade.
4. Toque em **Continuar**. Confira o prêmio no histórico e o saldo atualizado.
5. Repita uma vez usando **Pular**. Depois confira o fluxo de **Invocação ×10**, revelando uma carta e usando **Revelar tudo**.
6. Faça a conferência no celular em modo retrato: topo, botão Continuar e rolagem das dez cartas devem ficar acessíveis. Confira também no computador.

Os sorteios manuais usam cristais reais da ficha. Para testes automatizados sem gastar:

```powershell
npm --prefix apps/site run test:gacha
```

Se a animação continuar ausente, informe se apareceu “Escolha sua fenda”, se houve desconto e o que apareceu imediatamente após o clique. Em desenvolvimento, o console registra clique, resposta, montagem e cada fase com `[GACHA DEBUG]`.

## Banners futuros e arquivos

Crie e ative banners pelo fluxo administrativo existente: os cards são gerados automaticamente a partir deles. Para trocar a arte, edite a imagem do banner no mesmo fluxo administrativo; não é necessário criar um card no código.

Arquivos de interface: `apps/site/components/GachaHub.tsx`, `GachaRevealOverlay.tsx`, `HunterPortal.tsx`, `apps/site/app/gacha.css` e `layout.tsx`.

Serviços e rotas: `apps/site/lib/gacha-web.ts`, `gacha-types.ts`, `gacha-debug.ts`, `apps/site/app/api/gacha/route.ts`, `apps/site/app/api/gacha/banners/[bannerId]/image/route.ts` e `apps/site/app/api/me/route.ts`.

Validação: `apps/site/tests/gacha-flow.test.cjs`, `apps/site/package.json` e `package-lock.json` (dependências de teste DOM), além deste documento.
