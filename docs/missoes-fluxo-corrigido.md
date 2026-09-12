# Correção do fluxo de missões NPC

## Fluxo integrado

1. O vínculo libera a elegibilidade. A missão só pode ser aceita depois que o NPC apresentar seu pedido e a mensagem for enviada com sucesso.
2. O jogador aceita com `!aceitar missao Nome da Missão` ou `!aceitar missao ID`. Também pode escrever `Quero iniciar a missão 1` abaixo do comando do NPC, usando o número daquela missão no NPC.
3. Missões simultâneas permanecem no catálogo `!missoes`. Consultas não sobrescrevem os objetivos e recompensas de missões já oferecidas ou aceitas.
4. Após a cena, a ADM usa `!aprovar missao Nome do Jogador | Nome da Missão`. Também pode usar o ID da missão depois do separador. O texto nas linhas seguintes registra a cena aprovada.
5. A aprovação funciona diretamente para uma missão ativa. A entrega de relato pelo jogador é opcional. Só a ADM pode aprovar.
6. Conclusão, XP, Won, item, cristais e vínculo são gravados em uma transação. Aprovar novamente não paga novamente. XP e Won entram nos respectivos históricos; o item entra no inventário.
7. A próxima conversa com aquele NPC recebe o estado aprovado e o registro da cena. A reação fica pendente até o envio bem-sucedido e entra no histórico da conversa.

## Catálogo e banco

- Conferidos 720 registros de missão em 72 catálogos NPC.
- Criados 231 nomes de itens de recompensa ausentes no PostgreSQL configurado. Uma nova auditoria retornou zero itens faltantes.
- Os novos objetos foram cadastrados como `Item de Apoio`, com rank e origem da missão. Não foram inventados atributos de combate para objetos cuja ficha não define esses efeitos.
- Recompensa de vínculo explicitada nas fichas: +5 pontos nas missões de história principal e +2 nas demais; o vínculo permanece limitado a 100%.
- A consulta do site utiliza o mesmo catálogo e as mesmas regras de visibilidade do bot.
- Corrigida a mistura entre colunas TEXT e timestamps no aceite e na aprovação PostgreSQL.
- O oferecimento pelo motor narrativo antigo passou a consultar o catálogo oficial. Os auxiliares legados continuam disponíveis para compatibilidade.

## Aplicação e verificação

O banco configurado já recebeu os novos itens e as colunas necessárias. Reinicie o bot e o site para carregar o código atualizado. Em outro banco, execute `npm run db:mission-rewards`; a operação não duplica os itens.

Teste transacional PostgreSQL: `npm run test:missions-postgres`. Verifica aceite de duas missões, autorização ADM, aprovação direta, entrega única de XP/Won/item/vínculo, preservação da outra missão e registro da reação. Os dados temporários são revertidos.

Também passaram os testes de disponibilidade, aceite, preservação de cenas de todos os NPCs e arquitetura narrativa. A geração textual da reação depende do provedor de IA; os testes verificam o estado e a continuidade, sem chamar o modelo externo.
