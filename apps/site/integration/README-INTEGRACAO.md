# Integração Bot + Site

## Autenticação `!site`
1. O jogador envia `!site` ao bot.
2. O bot identifica o número do WhatsApp e localiza o personagem.
3. Gera 32 bytes aleatórios, salva apenas SHA-256 do token e validade de 10 minutos.
4. Envia no privado `/login?t=TOKEN`.
5. O backend do site compara o hash, invalida o token e cria uma sessão.

## Banco compartilhado
A versão atual do bot usa SQLite local. Para publicação multiusuário, migre gradualmente os dados persistentes para PostgreSQL/Supabase e faça bot e site usarem a mesma fonte de verdade.

## Localização
Todo personagem novo começa com `location_id = 'seoul'`. Seul é neutra e não conquistável. A viagem deve atualizar `character_locations`. A presença em uma cidade/região é requisito para cenas com NPCs e para validar a participação nas Dungeons semanais.

## Dungeons semanais
O arquivo `public/data/weekly-dungeons.json` contém somente a estrutura e exemplos visuais. O gerador aleatório definitivo permanece desativado até as regras de sorteio serem definidas pelo mestre do RPG.
