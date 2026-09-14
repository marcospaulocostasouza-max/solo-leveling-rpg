# Fila de tickets

A contagem PostgreSQL de solicitações retornava texto. A expressão `posicao + 1` concatenava e produziu posições 1, 11, 21 e 31 para quatro solicitações. Corrigidas no banco para 1, 2, 3 e 4, preservando tickets e ordem de entrada.

A posição atual é calculada entre solicitações aguardando que tenham jogador e ticket correspondente em produção, ordenadas pela entrada e ID. Entrada e conclusão usam transação; no PostgreSQL um bloqueio transacional compartilhado serializa mudanças na fila. Falha de inserção reverte uso do ticket. Conclusão recalcula posições.

Seleção aceita `!usar ticket item`, `!usar ticket técnica`, o nome completo do ticket e seu ID. O nome completo do próprio personagem é aceito quando há somente um ticket disponível. Havendo mais de um, exige tipo ou ID. Nunca seleciona outro jogador pelo texto do comando. Identificação telefônica usa o serviço compartilhado. Quem já usou o ticket recebe sua posição atual.

Consulta: `!fila tickets` ou `!fila tickets Nome Completo`. Essa fila é distinta de `!ver fila`, que consulta aprovação de fichas de personagens.

Três testes passaram: concorrência/ordenação/conclusão, reversão de erro de inserção e seleção sem destino ambíguo. Código exige reinício do bot. Correção das quatro posições já aplicada ao PostgreSQL configurado; nenhum ticket foi removido ou concluído.
