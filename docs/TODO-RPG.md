# Pendências RPG

- Normalizar progressivamente JSONs legados e tabela `itens` sem apagar fontes antigas; a loja
  oficial já é lida de `lojaItens.js` e materializa itens em SQLite apenas quando comprados.
- Extrair a compra de item e de técnica do bot para serviços transacionais compartilhados e fazer
  os comandos legados chamarem esses serviços.
- Definir fórmula oficial de XP necessária, viagem (tempo/custo/restrições) e spawn de dungeons.
- Chegada e entrada de Dungeon semanal já são registradas; conclusão e recompensa permanecem
  bloqueadas até a regra oficial de combate/conclusão ser conectada.
- Criar rota ADM protegida para inserir `weekly_dungeons` manualmente e configurar avisos pelo
  `DUNGEON_ANNOUNCEMENT_GROUP_ID`; criação manual, rota protegida e aviso configurável já existem;
  nenhum ID de grupo é fixado.
- Mapear cada NPC real para `npc_location_overrides`, sem inventar localizações narrativas, e
  aplicar `canInteractWithNpc` ao bot e site.
- Migrar mapa e territórios antigos para catálogo do novo mapa; Seoul continuará neutra.
- Implementar UI real para títulos, passivas, guildas, quests, forja, mineração, arena e painel ADM.
- Adicionar testes para repositories, tokens de login, sessão, compra transacional e slots 1FP/2FP.
