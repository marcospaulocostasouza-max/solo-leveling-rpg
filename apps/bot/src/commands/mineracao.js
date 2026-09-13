const MessageService = require("../core/messageService");

module.exports = async (msg) => {
    const mensagem = `
*═══ SISTEMA // MINERAÇÃO ═══*
_Uma rota alternativa dentro das Dungeons._

*─── Minerador ───*
_O Minerador é um participante especial. Ele não ocupa uma das cinco vagas de combate, não escolhe prêmio extra e recebe 20% da XP geral da Dungeon. Em troca, pode encontrar cristais durante a conclusão._

*─── Entrada na Dungeon ───*
_1. Tenha uma Picareta do Minerador no inventário._
_2. O dono da chave deve informar seu nome no campo Minerador da ficha de Dungeon._
_3. Ao concluir a Dungeon, a picareta é consumida e o sorteio é feito automaticamente._

*─── Sorteio de Cristais ───*
_• Cristal Grande — 10% de chance • 100.000 Won por unidade._
_• Cristal Médio — 20% de chance • 60.000 Won por unidade._
_• Cristal Pequeno — 30% de chance • 20.000 Won por unidade._
_• Nenhum cristal — 40% de chance._

_A quantidade sorteada varia de 1 a 5. O resultado e a entrega ficam registrados para o Minerador._
*Recompensa garantida*
_+500 Cristais de invocação por Dungeon concluída como Minerador, além da XP e do sorteio acima. Mesmo sem encontrar minério, recebe os 500 Cristais automaticamente na ficha._
_Limite: duas Dungeons por semana como Minerador._

*Sistema RPG • Mineração em Dungeons*
`;
    await MessageService.send({ message: msg, text: mensagem });
};
