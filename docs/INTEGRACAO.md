# Integração Bot + Site

## Arquitetura

`apps/bot` e as API routes de `apps/site` usam o mesmo SQLite:

`WhatsApp/Bot → packages/database → apps/bot/src/database/rpg.db ← packages/database ← API server-side do site`

O navegador só chama `/api/*`; ele não recebe SQL, caminho físico do banco, telefone ou memória
interna de NPC. `packages/rpg-core` continua reservado para extrações graduais de regra.

## Sistemas integrados nesta etapa

- login `!site` com token aleatório de 32 bytes, hash SHA-256, expiração de 10 minutos e uso único;
- sessão HTTP `httpOnly` de sete dias;
- personagem, atributos persistidos, técnicas, guilda, títulos e inventário lidos do SQLite;
- equipar/desequipar via validação server-side e recálculo de atributos;
- loja de itens já normalizados no SQLite, com desconto, inventário, compra e transação em uma
  única transação SQLite;
- catálogo legado oficial da loja é lido diretamente de `lojaItens.js` (486 itens); um item é
  normalizado na tabela `itens` somente dentro da primeira compra bem-sucedida;
- aquisição de técnicas server-side com as regras atuais de classe, nível, posse e Maestria;
- localização persistente e mapa lendo a localização/somente dungeons criadas no banco;
- esquema de dungeons semanais e localização/rotina de NPC pronto para configuração.

## Como executar

Na raiz:

```powershell
npm run install:all
npm run bot
npm run site
npm run dev
```

`npm run dev` inicia bot e site. Para acesso externo defina `SITE_BASE_URL`; em desenvolvimento o
fallback é `http://localhost:3000`. Para futuros avisos de dungeon use
`DUNGEON_ANNOUNCEMENT_GROUP_ID` controla o grupo opcional de avisos de Dungeon.

Administradores reconhecidos pela tabela `administradores` podem criar Dungeons semanais manualmente
pela rota protegida `POST /api/admin/dungeons`. O bot verifica novos Gates a cada minuto e só envia
aviso se `DUNGEON_ANNOUNCEMENT_GROUP_ID` estiver definido.

O formulário correspondente está em `/admin/dungeons`; a rota valida a sessão e a tabela de
administradores novamente, portanto a página não concede acesso por si só.

`GET /api/npcs/:npcId/interaction` aplica a regra server-side de presença. Enquanto um NPC não
tiver localização estruturada em `npc_location_overrides`, devolve bloqueio explícito em vez de
inventar uma posição ou permitir uma cena.

## Fluxo !site

O jogador envia `!site` no privado. O bot procura o jogador pelo identificador WhatsApp já salvo
em `jogadores.numero`, armazena somente o hash do token e manda o link privado. O site consome o
token uma única vez, cria cookie de sessão e passa a identificar o jogador pelo servidor.

## Dados independentes restantes

Os JSONs visuais do mapa, dados demonstrativos não usados e catálogos legados continuam no projeto
por compatibilidade. Eles não autorizam compras nem alteram estado. IA de NPC permanece somente no
bot. Spawn definitivo de dungeon, economia territorial, viagem e interação por localização seguem
pendentes de regras oficiais.
