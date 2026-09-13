# Chaves e materiais de dungeon

Chaves do banner são usadas com `!usar Chave de Dungeon Rank E` ou `!abrir chave`. Havendo várias chaves diferentes no inventário, informe o nome completo. `!abrir dungeon` também aproveita uma chave do inventário quando o jogador ainda não possui chave ativa.

Uma chave ativa tem cinco usos e somente uma dungeon vinculada. Ao tentar ativar outra chave, o bot apresenta duas escolhas:

- `!trocar dungeon`: sacrifica a atual e ativa a nova chave. A ficha ainda ativa da dungeon antiga fica sacrificada. Fichas já concluídas com prêmios pendentes continuam disponíveis.
- `!manter dungeon`: preserva a atual. Uma chave do inventário permanece guardada, sem consumo; uma chave nova obtida pelo Desejar é descartada.

Não há sacrifício antes da confirmação. A decisão fica no banco, vinculada ao jogador, e é conferida novamente ao confirmar. Se a dungeon mudou desde a pergunta, o bot exige uma nova solicitação. A chave usada do inventário é consumida na mesma transação da ativação. Uma confirmação repetida não repete a entrega. O Desejar mantém os 20% de chance e o limite semanal, com revalidação dentro da transação. O Desejar concede uma chave ativa diretamente, sem acrescentar outra cópia utilizável no inventário.

`!usar Material de Dungeon Rank E` consome uma unidade e entrega um material real da loja do mesmo rank na ficha. Rank E sorteia Couro ou Latão; D sorteia Ferro ou Cobre. Os ranks C–S usam os materiais com tier/rank definido no catálogo da loja. Cada material elegível tem a mesma chance dentro do seu rank. O resultado mostra nome e rank. Materiais genéricos semelhantes, inclusive de outros ranks ou já ganhos antes, seguem essa regra; materiais reais de craft e núcleos não são convertidos em caixas.

O script `node scripts/update-dungeon-reward-consumables.js` atualizou os itens já existentes sem mexer nas quantidades. Novos banners também cadastram as chaves e materiais genéricos como consumíveis. Não houve nova rolagem em fichas reais durante os testes.

Validação: testes isolados em SQLite e tabelas temporárias PostgreSQL para ativação, confirmação/cancelamento, regra de uma chave ativa, sorteio semanal concorrente, preservação de prêmios pendentes, materiais do rank correto, rollback e confirmação obsoleta. Reinicie o bot para carregar o código. Mudanças no cadastro de novos banners pelo site exigem publicar o código atualizado.
