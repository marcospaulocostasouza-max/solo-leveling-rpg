# Núcleo 6 — administração de Banners

Comando restrito ao cadastro existente em `administradores`: `!gachaadm ajuda`.

## Fluxo recomendado

1. Criar Banner como rascunho.
2. Adicionar uma única entrada por recompensa.
3. Ajustar pesos e quantidades.
4. Definir exatamente quatro Destaques.
5. Definir exatamente um Grande Prêmio.
6. Executar `!gachaadm banner validar <id>`.
7. Ativar somente depois que a validação estiver limpa.

Alterações de pool, peso, quantidade, Destaques e Grande Prêmio exigem que o Banner esteja desativado. Descrição e imagem podem ser alteradas no Banner ativo.

## Validação administrativa adicional

Além das regras do Núcleo 2, a ativação administrativa exige recompensas entregáveis dos Ranks E, D, C, B, A e S, pois o giro de 10 garante uma recompensa exatamente do Rank atual do jogador. `TOKEN`, `FRAGMENTOS` e `PROJETO` permanecem bloqueados enquanto não houver entrega oficial no motor.

## Preservação

Desativar ou arquivar altera apenas `ativo/status`. Pity, operações, resultados, duplicatas, Cristais e Fragmentos de Invocação não são apagados. A operação conservadora de exclusão também arquiva o registro, preservando o ID e a auditoria.

## Pendências deliberadas

- Clonagem não foi implementada: é opcional e exigiria uma política explícita para recompensas exclusivas.
- Não foi criada interface gráfica/site.
- Não foi criada Loja de Fragmentos.
- Pesos continuam sendo pesos; a porcentagem exibida é apenas derivada.
