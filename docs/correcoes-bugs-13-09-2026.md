# Correções da lista de 13/09/2026

- **Fim de interação:** recuperação de JSON com `+8` e cercas de código; chamada pede JSON; valores inválidos não produzem ganhos inventados. Aplicado anteriormente.
- **Vendas:** preço vigente positivo ou, na falta dele, `valor` cadastrado. Minérios mantêm seus valores. Item sem valor comercial não é removido. Remoção, crédito de Won e histórico são atômicos; quantidade e equipamento são revalidados.
- **Minhas técnicas:** classes equivalentes são agrupadas, incluindo Mago de Maldição/Mago Maldição. Os aliases das técnicas de Assassino aparecem com o nome canônico, sem linhas duplicadas.
- **Passivas:** `"0"` não significa passiva; apenas true, 1, `"1"` ou `"true"`.
- **Mago de Maldição:** Slow Motion, registro gratuito legado, sai das novas compras e listas disponíveis. Enfraquecer continua como técnica comprável por Maestria. Técnicas já aprendidas não foram apagadas.
- **Dungeon em grupo:** uma lista compartilhada de prêmios na conclusão, em vez de uma cópia por participante.
- **Premiação posterior:** busca todas as dungeons concluídas com escolha pendente do jogador, mesmo depois de abrir outra dungeon. Só participantes de combate podem escolher. `!premios dungeon [ID]` consulta; `!Escolho número X dungeon ID` escolhe. Mais de uma pendência exige indicar a dungeon.
- **Numeração dos prêmios:** XP 1, Won 2, atributo/Maestria 3, itens misteriosos 4 e 5. Escolhas anteriores não renumeram os itens restantes. Garantias existentes de uma escolha por participante e exclusividade da opção permanecem.
- **Afinidade:** opções pré-ficha únicas e exibidas apenas sem afinidade definitiva. Uma ficha com elemento definido mostra seu elemento, sem voltar ao sorteio anterior.
- **Distribuição de atributos:** ajuda sem exemplos repetidos e sem listar aliases como se fossem atributos extras. Os aliases continuam aceitos no comando.
- **Assassino:** Ponto Fraco unificado no nível 13 e Marca da Execução no nível 9, mantendo os níveis mais baixos já anunciados. Aliases antigos são marcados como Legada e ficam fora de novas compras; posse antiga impede recomprar a mesma técnica pelo novo nome. Valores de Maestria dos registros canônicos mantidos. Banco atualizado com `node scripts/reconcile-reported-techniques.js`.
- **Mineração:** 20% de XP e 500 Cristais garantidos, além do sorteio. Aplicado anteriormente; chances e valores do sorteio mantidos.
- **Grupos:** restrições de uso removidas por solicitação posterior. Comandos disponíveis em qualquer grupo ou no privado; permissões administrativas preservadas. IDs oficiais continuam como destinos de avisos.
- **NPCs:** identidade e personalidade explícitas; exemplos definidos como referência. Corte de contexto prioriza preservar identidade, missões e continuidade. Cópia literal longa e troca explícita de nome são verificadas antes do histórico. Uma resposta inválida da pipeline nova é refeita uma vez; se persistir, é descartada sem usar um fallback que contorne a validação. O fallback legado também é verificado.

A validação narrativa cobre os padrões indicados; não é uma garantia de toda interpretação semântica da IA. Personalidade, fatos e voz precisam ser observados também em cenas reais. Configuração de modelo, threads e contexto de execução mantida; não foi feito ajuste de desempenho.

Reiniciar o bot carrega o código. O catálogo foi reconciliado no banco configurado. Mudanças do site precisam ser publicadas no próximo deploy.
