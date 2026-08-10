# Solo Leveling RPG — Portal do Caçador

Versão consolidada do site/mapa com a interface inspirada em um "Sistema" de caçador.

## Incluído nesta versão
- Portal único com Início, Meu Personagem, Inventário, Equipamentos, Habilidades, Missões, Guildas, Mapa, Loja, Sistemas, NPCs e Rankings.
- Upload local de PNG do personagem para a tela de Status/Equipamentos.
- Mapa horizontal em alta resolução integrado ao portal, fullscreen dentro do módulo e com zoom/pan suave.
- 29 cidades + Gimcheon + Tongyeong + ilhas mapeadas; pontos clicáveis alinhados à arte existente.
- Seul como cidade-base neutra, protegida e não conquistável; personagens novos começam nela.
- Territórios antigos do bot não são usados como territórios conquistáveis do novo mapa.
- Estado inicial sem guildas criadas e sem territórios conquistados.
- Viagem entre locais com localização persistida no navegador nesta demonstração.
- NPCs de exemplo alocados a regiões com justificativa de localização.
- Regra visual de que a cena com NPC exige player na mesma cidade/região.
- Ciclo visual de amanhecer/dia/entardecer/noite baseado no horário de `Asia/Seoul`.
- Estrutura visual de Gates semanais comuns (azul/roxo) e vermelhos de perigo.
- Limite semanal e estrutura de participação preparados; algoritmo aleatório definitivo de Dungeons aguardando regras finais.
- Painéis de cidade com imagem, players, NPCs, turismo, preço, renda e investimentos; Seul não mostra compra/investimentos territoriais.
- Template de comando `!site`, SQL de tokens/sessões/localização e documentação de integração.

## Rodar
```powershell
npm install
npm run dev
```
Abra `http://localhost:3000`.

## Importante
Esta entrega implementa o portal e a lógica demonstrável no frontend e deixa a integração Bot + banco central pronta em `integration/`. Para uso multiusuário em produção, o SQLite local do bot deve ser substituído/compartilhado por um banco central (ex.: PostgreSQL/Supabase) e as ações da interface devem chamar APIs autenticadas.

## Validação
O TypeScript foi validado com `tsc --noEmit`. O build completo não pôde ser executado no ambiente de geração porque o pacote binário Linux do Next/SWC não estava disponível no registry interno; isso não é um erro TypeScript do projeto.
