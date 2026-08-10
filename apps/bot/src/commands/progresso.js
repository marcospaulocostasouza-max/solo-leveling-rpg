const MessageService = require("../core/messageService");

/**
 * COMANDO: !progresso
 * 
 * Mostra as atividades disponíveis e os tipos de recompensas possíveis.
 * NÃO mostra valores específicos - apenas os tipos de recompensa.
 * Os valores são revelados apenas quando o ADM aprova a atividade.
 */

module.exports = async (msg) => {
    const mensagem = `
*— Progresso do Personagem 🔅*

O Progresso do Personagem é a forma principal de evoluir no RPG, adquirindo XP, pontos de atributos e Won. As recompensas podem ser obtidas através de atividades auto-narradas ou missões administradas pela staff.

══════════════════════════

*— Quests Diárias:*
> *[As Quests Diárias consistem em metas pessoais de treino que auxiliam na evolução constante do personagem. Elas podem ser realizadas uma vez ao dia, com limite máximo de quatro vezes por semana. O jogador tem total liberdade para adaptar o treino ao estilo do seu personagem, um exemplo clássico inclui realizar 100 flexões, 100 abdominais, 100 agachamentos e correr 10 km. Ao cumprir a meta, além de conseguir a recompensa base, o jogador pode escolher uma das três seguidas recompensas adicionais. Quanto maior o seu Rank, maior será a recompensa padrão.]*

*Recompensas possíveis:*
> ✓ XP (quantidade varia por Rank)
> ✓ Won (quantidade varia por Rank)
> ✓ 3 Pontos de Atributo
> ✓ Caixa de Item Aleatório

*— Missões narradas:* 
> *[As missões narradas podem ser adquiridas na Associação dos Caçadores ou por intermédio da guilda do próprio jogador. Como alternativa, os jogadores podem obter XP e diversas recompensas ao caçar mobs ou explorar dungeons, atividades estas administradas diretamente pela Staff.]*

*— O Treino de Cultivo* 
> *[O Treino de Cultivo é dividido em diferentes modalidades, cada uma voltada para o aumento do Maestria do personagem. A Meditação de Maestria é o uso da concentração para conseguir o Maestria do céu e da terra, sendo mais eficiente em locais com alta concentração de Maestria. O Treino Físico Marcial fortalece a força, a constituição e a agilidade, podendo incluir katas, batalhas ou exercícios de resistência em terrenos hostis. O Cultivo de Energia refina o Maestria e o espírito, melhorando os atributos relacionados à manipulação de energia. O Treino de Técnicas Avançadas auxilia no controle e refinamento de energia. Já o Treino de Iluminação Mental amplia a percepção e a capacidade estratégica. Cada treino pode ser realizado de forma solo ou supervisionada. Os ganhos de Maestria aumentam conforme a duração do treinamento: um treino de 1 dia proporciona um pequeno aumento, treinos de 7 dias oferecem progresso moderado, treinos de 15 dias geram melhorias significativas e treinos de 30 dias resultam em ganhos mais expressivos de Maestria.]*

*Recompensas possíveis:*
> ✓ XP (quantidade varia por Rank)
> ✓ Maestria (5 a 100, dependendo da duração)

*— Treino Conjunto:* 
> *[O Treino Conjunto é realizado em dupla ou em grupo, onde os participantes definem objetivos comuns de treinamento. Essa atividade pode ser realizada uma vez por semana. Cada participante deve contribuir com no mínimo 3 cenas para validar o treino. Os ganhos de XP variam conforme a qualidade da participação e o envolvimento coletivo.]*

*Recompensas possíveis:*
> ✓ XP (quantidade varia por Rank)
> ✓ Bônus de +25% XP para Duo (2 participantes)

*— Interação:* 
> *[A Interação consiste em desenvolver relações, diálogos e histórias compartilhadas com outros jogadores. Essa atividade incentiva a comunicação social e o aprofundamento das conexões entre os personagens, contribuindo para a evolução geral do RPG. Ela pode ser realizada até duas vezes por semana. Para que a interação seja válida, cada participante deve estar com no mínimo 5 cenas de interação.]*

*Recompensas possíveis:*
> ✓ XP (quantidade varia por Rank)

*— One-Post:* 
> *[O One Post é uma atividade dedicada ao desenvolvimento profundo do personagem por meio de lore própria. Nele, o jogador pode explorar flashbacks, momentos internos, situações cotidianas ou eventos significativos. Essa atividade pode ser realizada uma vez por semana e permite expansão para Duo Post quando feito em parceria com outro jogador.]*

*Recompensas possíveis:*
> ✓ XP (quantidade varia por Rank)
> ✓ Bônus de +25% XP para Duo Post (2 participantes)

══════════════════════════

*COMO FUNCIONA:*
1. Complete a atividade no RPG
2. Um ADM aprova usando os comandos:
   - !quest diária finalizada <Nome>
   - !treino de cultivo finalizado <Nome>
   - !treino conjunto finalizado <Nome1>/<Nome2>
   - !interação finalizada <Nome1>/<Nome2>
   - !one post finalizado <Nome1>/<Nome2>

3. O bot calcula automaticamente as recompensas baseado no seu Rank
4. As recompensas são enviadas diretamente para sua ficha

*ATENÇÃO:*
- Os valores exatos das recompensas são calculados automaticamente pelo sistema
- Você só saberá o valor exato quando o ADM aprovar
- Quanto maior o Rank, maiores as recompensas

_Use !progresso para consultar as atividades disponíveis._
    `;
    
    await MessageService.send({ message: msg, text: mensagem });
};
