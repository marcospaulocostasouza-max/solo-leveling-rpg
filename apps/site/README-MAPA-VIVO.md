# Solo Leveling — Mapa Vivo

Versão atualizada do projeto com o novo mapa horizontal da Coreia do Sul.

## Já implementado
- Novo `public/mapa-coreia.png` horizontal.
- Zoom, pan e reset.
- Camadas ligáveis/desligáveis: cidades, players, NPCs, guildas, Gates, dungeons e locais do RPG.
- Marcadores interativos e painel de entidade.
- Cidades continuam abrindo o painel existente.
- Estrutura inicial do estado do mundo em `public/data/world.json`.
- Layout responsivo.

## Rodar no VS Code
1. Abra a pasta do projeto.
2. Rode `npm install`.
3. Rode `npm run dev`.
4. Abra `http://localhost:3000`.

## Próxima integração
`public/data/world.json` é propositalmente uma camada provisória. Na próxima etapa ele pode ser substituído por banco de dados/API (players, NPCs, guildas, territórios, viagens e atualizações em tempo real) sem trocar o mapa novamente.
