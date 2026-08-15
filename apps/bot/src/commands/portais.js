const MessageService = require("../core/messageService");

module.exports = async (msg) => {
    const mensagem = `_*「 PORTAIS 」*_
_— Além de cada Portal existe um território desconhecido, Jogador. Aqui encontrará tudo relacionado às Dungeons, incursões, mineração, exploração e demais atividades realizadas além dos Gates. Prepare-se antes de atravessar, pois depois que um Portal se fecha, talvez não exista caminho de volta._

_*Comandos:*_
_• !Desejar_
_• !Ficha de Dungeon_
_• !Dungeon *(iniciar/progresso/sair)*_
_• !Abrir Dungeon_
_• !Concluir Dungeon_
_• !Escolho a Opção_
_• !Mineração_`;

    return MessageService.send({ message: msg, text: mensagem });
};
