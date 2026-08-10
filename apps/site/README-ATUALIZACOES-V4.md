# Solo Leveling RPG Portal — V4

Versão consolidada do site com as últimas decisões do RPG.

## Alterações principais
- Mapa principal em arquivo 7680x5120 para melhor amostragem em zoom, preservando a arte existente.
- Zoom suave até 8x e mapa usando toda a área do módulo.
- Dungeons semanais possuem coordenadas X/Y próprias e são clicáveis diretamente; podem aparecer em qualquer ponto do mapa.
- Painel próprio de Dungeon com Gate comum azul/roxo e Gate vermelho de perigo/armadilha.
- Locais especiais clicáveis: Associação dos Caçadores, Parque das Zelkova, Hallasan, Ilha das Memórias e templo de treinamento.
- Seoul permanece cidade-base neutra e não conquistável.
- Gimcheon e Tongyeong estão incluídas na lista oficial de locais.
- Equipamentos atualizados para os slots oficiais do `inventorySystem.js` do bot: Cabeça 1, Corpo 1, Acessórios 4, Item de Apoio 1, Pernas 2, Pés 1, Arma 1 (1FP) 2 e Arma 2 (2FP) 1.
- Loja de itens importada de `src/utils/lojaItens.js` do ZIP do RPG.
- Área de técnicas/Maestria adicionada usando a base de técnicas da classe Assassino enviada no bot.

## Importante
A ampliação para 8K preserva e reamostra a arte atual; ela não inventa detalhes que não existiam na arte original. Para obter detalhe realmente superior em níveis extremos de zoom, será necessário futuramente substituir o mapa-base por uma arte nativamente 8K/vetorial.

As ações de compra/equipar e a autenticação ainda são interface local. A integração transacional real será feita quando site e bot passarem a usar o banco compartilhado.
