# Vaga extra de minerador na ficha de dungeon

Use `!ficha de Dungeon` e preencha a seção abaixo dos cinco participantes:

```text
Minerador: Nome completo do jogador
```

A vaga é opcional. O reconhecimento usa a mesma busca de nomes dos participantes. Não é permitido ocupar uma vaga normal e a de minerador na mesma ficha. O dono da chave continua nas vagas normais.

Ao usar `!concluir Dungeon`, o minerador recebe o XP correspondente ao rank da dungeon e o sorteio de mineração automaticamente. Ele não recebe os Wons, cristais ou prêmios extras destinados aos participantes normais e não pode usar a escolha de prêmio dessa ficha.

Foi mantida a regra de mineração existente: exige e consome uma Picareta do Minerador. O sorteio pode encontrar cristais grandes, médios ou pequenos, ou não encontrar nenhum. Quando encontra, o valor é convertido automaticamente em **Wons**, como no sistema anterior; não são os cristais usados nos banners. Mesmo sem encontrar minério, há entrega de XP e consumo de uma participação de mineração.

Cada jogador pode concluir duas dungeons como minerador por semana. A contagem recomeça na segunda-feira, às 00h de São Paulo, e é independente da participação nas vagas normais. O minerador não consome usos adicionais da chave.

O registro `dungeon_mineracoes` guarda a ficha, o ID do minerador, a semana, XP e o resultado sorteado. A tabela é preparada automaticamente pelo código. Participações normais continuam em `participacao_dungeon`; por isso o minerador não entra na seleção dos prêmios extras.

Registro, consumo da chave, consumo da picareta e entrega da mineração ficam na mesma transação. Falhas revertem as alterações. No PostgreSQL, bloqueios por jogador impedem que duas conclusões simultâneas ultrapassem o limite semanal; no SQLite, as transações de escrita são serializadas. A chave primária por ficha também impede repetir a mineração da mesma conclusão.

Validação automatizada em SQLite em memória (sem alterar jogadores reais): cinco participantes mais minerador; reconhecimento de nomes; jogador duplicado; XP e Wons de mineração; exclusão dos prêmios normais; terceira mineração bloqueada; participação normal independente; semana seguinte; sorteio vazio; ausência de picareta; chamadas simultâneas; rollback após falha no registro final.

```powershell
node --test apps/bot/tests/dungeonMining.test.js apps/bot/tests/weeklyDirectApproval.test.js
```

Reinicie a instância existente do bot para carregar o código e gere uma nova ficha com `!ficha de Dungeon`. A operação real pelo WhatsApp permanece para teste do administrador; os testes locais não enviam mensagens nem creditam jogadores reais.
