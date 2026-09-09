const MessageService = require("../core/messageService");

module.exports = msg => MessageService.send({ message: msg, text: `*═══ PROGRESSO DO PERSONAGEM ═══*
_Evolua com atividades narrativas. A recompensa só entra na ficha após validação do Sistema/ADM._

*─── Requisitos de narrativa ───*
> *Quest diária:* de *50 a 100 palavras*. Uma por dia, até quatro por semana.
> *One Post:* no mínimo *1.000 palavras*. Pode ser individual ou Duo Post. Limite: *1 One Post a cada 7 dias*.
> *Treino de Maestria:* no mínimo *200 palavras* por treino aprovado.
> *Treino conjunto:* no mínimo *200 palavras por participante*, com todos atuando na mesma cena. Limite: *até 2 por semana*.
> *Interação:* no mínimo *150 palavras por participante*, com contribuição relevante de cada pessoa. Limite: *até 2 por semana*.
> *Missão narrada:* no mínimo *300 palavras*, além dos objetivos definidos na missão.
> *Dungeon:* no mínimo *300 palavras por participante*, descrevendo a progressão e a conclusão do grupo.

*─── Atividades ───*
*QUEST DIÁRIA*
Treino pessoal curto e coerente com o personagem. Recompensas: XP, Won, 3 pontos de atributo, Caixa de Item e recuperação total de HP/MP.

*TREINO DE MAESTRIA*
Desenvolve técnicas, armas e controle de energia. Pode durar 1, 7, 15 ou 30 dias; períodos maiores concedem mais Maestria e XP.

*TREINO CONJUNTO E INTERAÇÃO*
Atividades em dupla ou grupo. Todos devem participar da narrativa para receber XP; Duo Post pode aplicar o bônus de duo. Cada atividade pode ser realizada até *duas vezes por semana*.

*ONE POST*
Lore pessoal para explorar memórias, cotidiano, conflitos internos ou acontecimentos marcantes do personagem. Permitido *um a cada 7 dias*.

*MISSÕES E DUNGEONS*
Objetivos definidos pela Associação, guildas, NPCs, eventos ou pelo sistema de Dungeon. As recompensas variam conforme Rank e dificuldade.

_Textos abaixo do mínimo não devem ser aprovados. Consulte !Nível, !Maestria e !Histórico para acompanhar sua evolução._` });
