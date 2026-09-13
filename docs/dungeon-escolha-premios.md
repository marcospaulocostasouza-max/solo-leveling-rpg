# Escolha de prêmios de dungeon — 13/09/2026

A conclusão envia uma única lista compartilhada com cinco opções. Os números são fixos: 1 XP, 2 Wons, 3 atributos (E) ou Maestria (D–S), 4 e 5 itens misteriosos. Escolher uma opção não renumera as outras.

Use `!Escolho número 4 dungeon ID`, substituindo ID pelo número mostrado na lista. Sem ID, o comando usa a única dungeon com prêmio pendente; se houver várias, pede qual delas.

Somente participantes registrados podem escolher, uma vez por dungeon. A opção pertence ao primeiro participante cuja escolha é confirmada. A reserva, o crédito na ficha/inventário e o histórico são gravados na mesma transação. No PostgreSQL, a ficha e o jogador são bloqueados durante a operação; os índices únicos impedem repetição por jogador ou por opção. Uma falha desfaz toda a operação, deixando a opção disponível.

Antes, a entrega acontecia antes de inserir o registro da escolha; uma colisão entre processos podia conceder o prêmio sem registrar a entrega. A operação agora usa `dungeonPrizeService.js` e não rejeita escolhas de opções diferentes apenas porque a ficha está sendo processada.

A confirmação é uma mensagem curta com o prêmio real: `Espada [Rank D] já foi adicionado à sua ficha.` Para recursos, mostra a quantidade. Uma opção ocupada responde: `A opção 4 já foi escolhida. Escolha outra opção da lista.` Nenhuma dessas respostas repete a lista. Itens de fichas antigas podem ser identificados pelo nome e rank da dungeon. O minerador recebe sua recompensa automaticamente e continua fora das cinco opções.

Validação: testes isolados em SQLite e em tabelas temporárias PostgreSQL, sem alterar fichas reais, para disputa da mesma opção, escolhas diferentes, atributos, Maestria, criação e entrega do item, fichas antigas, rollback, confirmação curta e uma única lista para cinco participantes. A validação pelo WhatsApp ainda requer reiniciar o bot para carregar o código atualizado.

```powershell
node --test apps/bot/tests/dungeonPrizeFlow.test.js apps/bot/tests/reportedBugs.test.js apps/bot/tests/dungeonMining.test.js

# Opcional: PostgreSQL configurado no .env; usa somente tabelas temporárias.
$env:DUNGEON_TEST_POSTGRES = '1'
node --test apps/bot/tests/dungeonPrizeFlow.test.js
Remove-Item Env:DUNGEON_TEST_POSTGRES
```
