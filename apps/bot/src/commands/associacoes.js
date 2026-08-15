const MessageService = require("../core/messageService");

module.exports = async (msg) => {
    const mensagem = `_*「 ASSOCIAÇÕES 」*_
_— Este mundo não pertence apenas aos Caçadores, Jogador. Guildas, organizações, facções e até aqueles que agem no Submundo possuem seus próprios interesses e influência. Aqui encontrará tudo relacionado a essas associações, seus membros, conflitos, alianças e caminhos para fazer parte delas._

_*Comandos:*_
_• !Guilda *(criar/entrar/sair/info)*_
_• !Rank_
_• !Membroa_
_• !Cargosa_
_• !Investimentos_
_• !Guerra_
_• !MVP_
_• !Submundo_
_• !Territórios_`;

    return MessageService.send({ message: msg, text: mensagem });
};
