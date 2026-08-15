const MessageService = require("../core/messageService");

module.exports = async (msg) => {
    const mensagem = `_*「 HISTÓRIA 」*_
_— Sua jornada não será feita apenas de batalhas, Jogador. Aqui encontrará missões, acontecimentos, capítulos e eventos que conduzem a narrativa deste mundo. Siga os caminhos disponíveis, descubra novos conflitos e construa sua própria história em meio ao Ragnarok._

_*Comandos:*_
_• !Missões_
_• !Fragmentos_
_• !Monarcas_
_• !Governantes_
_• !Sucessores_`;

    return MessageService.send({ message: msg, text: mensagem });
};
