# Verificação dos comandos de gacha

No PostgreSQL configurado, os banners disponíveis na verificação foram:

- ID 1: Caçador de Gates — Rank D, ativo e permanente.
- ID 3: Player, ativo e dentro do período.
- ID 2: O Jogador, rascunho e inativo. Não foi ativado nesta verificação.

O problema original de não reconhecer um banner não foi reproduzido com esses registros atuais. A busca foi reforçada para aceitar ID, acentos, espaços repetidos, formatação e variantes de travessão, preservando a recusa de nomes ambíguos. `!banners` mostra os IDs e comandos prontos. `!gacha` também lista os banners.

Exemplos: `!banner 3`, `!convergir 1 Player`, `!convergir 10 3`.

Recompensas desativadas agora são excluídas da validação, resolução de referências, sorteio normal, pity e garantia. Antes, uma referência inválida desativada poderia impedir o reconhecimento do banner inteiro; o pity podia selecionar um grande prêmio desativado. A pré-validação informa quando falta uma peça de conjunto para executar 10 giros. Nenhum cristal é descontado nessa situação.

O teste `node scripts/test-gacha-postgres.js` executou 1 e 10 giros em cada banner disponível, comprovando desconto de 1100 cristais, garantia de conjunto, entrega no inventário e 11 resultados no histórico. Usa jogador temporário e reverte todos os dados em uma transação. Não gasta saldo de jogadores reais.

Passaram os testes atuais de seleção do comando. As suítes antigas `gachaEngineCore` e `gachaStage4` apresentaram oito falhas: incluem expectativas de garantia por rank já substituída pela garantia de conjunto e fixtures sem peças de conjunto. Não foi restaurada a garantia antiga, pois contraria a regra definida para os banners.

Reinicie o bot para carregar o código corrigido. A investigação não encerrou processos nem alterou a ativação de banners.
