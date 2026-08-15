const MessageService = require("../core/messageService");

module.exports = async (msg) => {
    const mensagem = `_*「 SKILLS 」*_
_— Seu poder vai muito além de simples atributos, Jogador. Aqui estão reunidas suas Técnicas, Maestrias, Técnicas de Classe e demais habilidades de combate. Aprenda novos recursos, aperfeiçoe aquilo que já domina e desenvolva seu próprio arsenal de habilidades para enfrentar desafios cada vez maiores._

_*Comandos:*_
_• !Maestria_
_• !Técnicas_
_• !Técnicas <classe>_`;

    return MessageService.send({ message: msg, text: mensagem });
};
