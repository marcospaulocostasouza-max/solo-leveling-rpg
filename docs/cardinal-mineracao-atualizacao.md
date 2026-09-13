# Mineração e Cardinal — 13/09/2026

## Mineração

Na conclusão de uma dungeon, o minerador recebe 20% da XP geral, o resultado automático do sorteio de mineração e **500 Cristais de invocação garantidos**. O crédito acontece mesmo quando nenhum minério é encontrado. Os cristais entram no saldo da ficha e no histórico de cristais, dentro da transação da conclusão.

A vaga continua extra, sem disputar os cinco lugares ou escolher prêmio. O limite continua em duas minerações por semana. Conclusões repetidas não repetem pagamentos. Fichas antigas ainda abertas usam a nova entrega; dungeons já concluídas não recebem crédito retroativo.

## Cardinal

ADMs registrados têm acesso permanente às permissões do RPG, incluindo fichas, economia, missões, banners, dungeons, guildas, lore e mundo. Permissões de processos, deploy e desenvolvimento continuam seguindo os níveis administrativos existentes. A escrita está habilitada por padrão; `CARDINAL_ADMIN_WRITES_ENABLED=false` continua disponível para simulação explícita.

Ordens de alteração no bot, inclusive individuais, agora passam por identificação e confirmação. O Cardinal identifica objetos e destinos por nome completo, ID ou telefone, apresenta todas as ações e aguarda `!cardinal sim` ou `!cardinal confirmar confirm_...`. Não aceita nome parcial como destino definitivo: pede o nome completo ou ID.

É possível combinar tarefas com ponto e vírgula, quebras de linha ou `e dê...`, e indicar vários destinatários separados por vírgulas ou `e`. Nomes que contém a palavra `e` devem ficar entre aspas. Cada quantidade é por destinatário. A expressão `todos os jogadores` seleciona todos os registros de jogadores existentes naquele momento, sem incluir personagens criados depois da apresentação.

A confirmação vale por 15 minutos, somente para o ADM autor e a mesma conversa. Uma nova ordem substitui a anterior ainda pendente; `!cardinal cancelar` cancela. Listas grandes são enviadas em partes e só podem ser confirmadas após entrega completa. Simulações não criam plano executável.

Na confirmação, os IDs e nomes são conferidos novamente. Se um destino mudou ou desapareceu, nenhuma ação é aplicada. Todas as ações do lote e seus registros de auditoria são gravados na mesma transação; uma falha desfaz o lote inteiro. Confirmações repetidas ou concorrentes e reentrega da mensagem original não repetem os pagamentos.

A execução em lote cobre as ferramentas existentes de XP, Maestria, Cristais, Won, inventário, fichas, banners, dungeons, missões e guildas. Criação e publicação de conteúdo mantêm o fluxo separado de rascunho e aprovação. Pedidos sem ferramenta ou dados suficientes são esclarecidos, sem execução parcial.

Exemplos:

- `!cardinal dê 1000 XP para Flins, Shanjun; entregue 1 item Picareta do Minerador para Flins e Shanjun`
- `!cardinal dê 500 XP para todos os jogadores`
- `!cardinal sim`
- `!cardinal cancelar`
- `!cardinal troque o nome do jogador Nome Atual para Novo Nome`
- `!cardinal altere a classe do jogador Nome Completo para Mago Maldição`
- `!cardinal defina a força do jogador Nome Completo para 30`
- `!cardinal desative o banner Nome do Banner`
- `!cardinal quantos itens existem?`
- `!cardinal quais banners estão ativos?`
- `!cardinal quem é o jogador Nome Completo?`
- `!cardinal quais bases de dados existem?`

Consultas administrativas leem as tabelas atuais do RPG, sem depender de reindexação. Informações de autenticação e credenciais não entram nas respostas. Perguntas de regras seguem a pesquisa nas fontes oficiais. A interpretação livre ainda depende do modelo local; não há garantia de interpretar qualquer ordem arbitrária. Campos de identidade de acesso não são editáveis pela ferramenta de ficha.

Reinicie o bot para carregar o código e a configuração. Estas mudanças foram aplicadas localmente; publicação no GitHub ou no site exige a atualização habitual.
