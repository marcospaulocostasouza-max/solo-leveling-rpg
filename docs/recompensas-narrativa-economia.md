# Recompensas, narrativa e economia

## Registros de entrega

Banner, forja e mineração passaram a registrar recibos complementares em `historico_ficha`, na mesma transação da entrega. Cada recibo contém jogador, recurso, quantidade, origem e referência. Banner identifica operação e posição do giro; duplicatas registram os fragmentos efetivamente recebidos. Forja identifica o item criado e registra também o custo em Won. Mineração identifica a ficha de dungeon e registra XP, cristais e Won efetivamente concedidos.

Os controles existentes de concorrência continuam responsáveis por impedir pagamento repetido. O recibo não executa uma segunda entrega e não substitui históricos próprios. Registros antigos não foram reconstruídos. Códigos e escolha de prêmio de dungeon já possuem histórico complementar; esta atualização não reescreve esses caminhos.

## Recuperação narrativa

Após a normalização dos marcadores, permanece uma única tentativa de correção de idioma, identidade, cópia e formatação. Correção vazia ou com mais problemas não substitui a cena original. Falha da correção preserva a original. Os avisos continuam registrados; cenas não são canceladas por validação narrativa. Isso reduz perdas, mas não garante fidelidade semântica ou formatação perfeita em todas as respostas da IA.

## Economia

Execute `npm run economy:report` para consultar os últimos sete dias: entradas e gastos em Won, XP, cristais por origem, recibos complementares, mineração por jogador e trinta maiores preços cadastrados. Uma fonte indisponível aparece explicitamente como indisponível, não como zero. O relatório não soma históricos próprios com recibos para evitar duplicação.

Diagnóstico executado em 14/09/2026: históricos de Won mostram 2.040.500 em ganhos, 1.964.000 em compras e 280.000 em gastos; histórico de XP mostra 201.300. Essas contagens representam registros disponíveis, não toda a economia. Duas minerações semanais concedem 1.000 cristais, financiando dez giros de 100 cristais. Nenhum preço, recompensa ou probabilidade foi alterado sem diagnóstico específico.

## Validação

Dezesseis testes passaram, cobrindo mineração e forja concorrentes, reversão inclusive de falha no recibo, recibos inválidos e preservação da cena quando a correção piora. O relatório foi executado contra o PostgreSQL configurado. Validação no WhatsApp e geração real do modelo dependem de carregar o novo código. O histórico novo vale para operações realizadas após a atualização.
