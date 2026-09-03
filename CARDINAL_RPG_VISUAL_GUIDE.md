# Guia visual do Sistema Cardinal

O Cardinal é uma extensão do sistema do RPG, não um chatbot externo. Sua referência primária é a ficha produzida por `!jogador` em `apps/bot/src/commands/jogador.js` e, no site, a linguagem de `HunterPortal.tsx` e dos tokens `--sl-*` de `globals.css`.

## Composição

No bot, cada ficha começa com `═══ CARDINAL // MÓDULO ═══`, apresenta um título curto, estado e seções delimitadas por `───`. Campos seguem `> *Rótulo:* valor`; o rodapé identifica o Sistema Cardinal. Respostas longas são paginadas e nunca truncadas silenciosamente.

No site, a mesma hierarquia vira cabeçalho, card de resultado, seções e pares de definição. O conteúdo do DTO é idêntico; apenas a representação muda. Cards usam fundo profundo, borda violeta, realce ciano e sombras discretas já presentes no portal.

## Cores e estados

A paleta vem dos tokens existentes: fundo `#03020a`, painéis `#0a071b`/`#0f0926`, violeta `#8d43ff`, ciano `#62caff`, texto `#f5f2ff`, muted `#978fb1`, dourado `#f1c56b` e perigo `#ff4267`. Estado nunca depende só de cor: sempre contém texto e indicador. Ciano representa sucesso/online, dourado atenção/risco e rosa falha/negação.

## Campos, botões e navegação

Rótulos são humanos (`player_balance` vira `Won`) e valores passam pelos formatadores centrais. Botões têm área mínima confortável, foco de teclado visível e verbo direto: Aprovar, Rejeitar, Publicar, Cancelar, Voltar. Ações críticas usam IDs opacos, são resolvidas no backend, conferem o ator e expiram.

## Iconografia e espaçamento

O site reutiliza Lucide, já adotado pelo portal. No bot, os poucos símbolos funcionais (`✓`, `×`, `!`, `○`, `◉`) comunicam estado; não há decoração excessiva. Espaçamento separa identidade, resumo, seções e ações, reproduzindo a leitura vertical de `!jogador`.

## Linguagem

Frases são curtas, diretas e sistemáticas. Erros técnicos são convertidos em códigos seguros; caminhos, prompts, credenciais e raciocínio interno não aparecem. Detalhes técnicos ficam reservados ao modo de depuração autorizado.

## Fichas de entidades

O Cardinal fornece a moldura da operação. Armas, itens e outras entidades aparecem dentro de “Ficha oficial”; quando houver renderer específico, ele deve substituir a ficha genérica sem alterar o DTO. Imagens só são usadas quando já pertencem à entidade ou ao sistema oficial.

## Responsividade

Em desktop, a navegação ocupa a lateral. Abaixo de 820 px ela vira menu recolhível; campos passam a uma coluna e ações importantes preservam pelo menos 48 px de altura. Abaixo de 480 px, margens e cards são compactados sem reduzir a legibilidade do conteúdo principal.
