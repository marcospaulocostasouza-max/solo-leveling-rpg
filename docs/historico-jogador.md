# Histórico do jogador

`!historico` e `!atividades` mostram 15 eventos por página, com horário de Brasília, tipo, entrada/saída, quantidade, recurso, motivo, origem e referência quando existente. O cabeçalho mostra nível, rank e saldos atuais de XP, Won, cristais e maestria.

Paginação: `!historico 2`. Filtros: `!historico gacha`, `!historico dungeon`, `!historico xp`, `!historico won`, `!historico cristais`, `!historico maestria`, `!historico loja`, `!historico narrativa` ou `!historico adm`. Página e filtro podem ser combinados em qualquer ordem.

As fontes são lidas em estrutura comum: recibos da ficha, atividades, compras, prêmios de dungeon, economia, XP, maestria, cristais, fragmentos, gacha, resumos narrativos e ações administrativas. Falha isolada de uma tabela não impede as demais.

Duplicação entre recibo complementar e histórico nativo é removida por recurso, quantidade, direção, janela de dez segundos, origem lógica e referência. Repetições reais dentro da mesma fonte são preservadas; posições diferentes de um giro de dez também são preservadas. Quando há equivalente, a fonte nativa mais detalhada tem prioridade.

O total do cabeçalho conta movimentações, entradas e saídas; não soma unidades incompatíveis como XP, Won e itens. Valores de cada registro mantêm sua própria unidade. O comando é somente leitura e não altera a ficha.
