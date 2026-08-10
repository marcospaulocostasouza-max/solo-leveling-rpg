# Solo Leveling RPG — Bot completo + Site V4

Este pacote reúne em uma única pasta:

- `apps/bot`: o conteúdo do `Solo. RPg.zip` preservado (exceto `node_modules`, que é reinstalável).
- `apps/site`: o Site V4 mais recente.
- `apps/bot/src/database/rpg.db`: banco SQLite atual do bot preservado.
- `backups/Solo. RPg-original.zip`: cópia exata do ZIP original recebido, inclusive arquivos que não foram extraídos para o workspace, garantindo um backup integral.
- `packages/*`: estrutura preparada para a integração gradual futura sem substituir os sistemas originais do bot.

## Instalação

Na raiz do projeto:

```powershell
npm run install:all
```

Ou separadamente:

```powershell
cd apps\bot
npm install

cd ..\site
npm install
```

## Executar o bot

Na raiz:

```powershell
npm run bot
```

## Executar o site

Na raiz:

```powershell
npm run site
```

O site normalmente abrirá em `http://localhost:3000`.

## Importante

Nesta versão, bot e site estão no mesmo projeto, mas ainda não usam uma única camada de banco/API. O bot original foi preservado para evitar perda de funcionalidade. A integração real de personagem, inventário, loja, localização, viagem e outros sistemas será feita incrementalmente.

Sessões autenticadas privadas do WhatsApp não foram adicionadas manualmente ao projeto. O ZIP original recebido também não continha `.wwebjs_auth`/`.wwebjs_cache` detectáveis.
