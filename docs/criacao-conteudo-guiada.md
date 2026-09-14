# Criação de conteúdo por conversa

Comandos ADM: `!criar item`, `!criar item unico`, `!criar tecnica`, `!criar tecnica unica`, `!criar habilidade unica`, `!criar passiva` e `!criar titulo`. Os comandos de formulário `!Fitem`, `!Ftecnica`, `!Fpassiva` e `!Ftitulo` permanecem disponíveis.

O bot pergunta nome, descrição, rank e campos próprios do tipo. Itens incluem tipo, slot, seis bônus, efeito, condição e valor; técnicas incluem ativação, categoria, classe, mana, cooldown e nível; passivas incluem categoria, efeito e condição; títulos incluem categoria, efeitos e obtenção.

No final pede nome completo do jogador ou ID. Correspondência exata normalizada, sem ignorar outro jogador: homônimos exigem ID. A ficha mostra nome e ID do proprietário e destino. Responder `sim` cadastra e entrega; `não` cancela na confirmação. `!cancelar conteudo` cancela em qualquer etapa. Não há criação permanente antes da confirmação.

Item é entregue sem equipar; técnica entra em `jogador_tecnicas`; passiva entra em `passivas_ativas`; título substitui o título atual. Efeitos textuais continuam sujeitos às regras narrativas do sistema; a criação não transforma qualquer descrição em um buff automático. Bônus numéricos de equipamento seguem as colunas oficiais.

Cadastro, entrega, histórico, registro da ficha e consumo da sessão acontecem na mesma transação. Confirmação repetida não entrega de novo. Falha mantém a confirmação e desfaz alterações. Sessão persistida por administrador e conversa, recuperável após reinício. Permissão ADM conferida em todas as respostas. Nome duplicado não reutiliza conteúdo de outro jogador.

Consulta: `!consultar item Nome`, `!consultar tecnica Nome`, `!consultar passiva Nome` e `!consultar titulo Nome`. Também aceita ID. Itens personalizados mostram descrição, rank, bônus e proprietário. Consulta também reconhece itens e técnicas já existentes.

Validação: testes de quatro destinos, confirmação, homônimos, isolamento de conversa, duplicação, reversão de falha e consulta. `node scripts/test-content-creation-postgres.js` cria/entrega os quatro tipos em transação real que é desfeita ao final, sem premiar personagens permanentemente. Novas tabelas de sessões e recibos já preparadas no PostgreSQL configurado. Reinicie o bot para carregar os comandos. Não houve envio de mensagens no WhatsApp durante os testes.
