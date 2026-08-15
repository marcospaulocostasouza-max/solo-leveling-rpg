const MessageService = require("../core/messageService");

module.exports = async (msg) => {
    const mensagem = `_*「 ASCENSÃO 」*_
_— Poder não é algo que permanece estagnado, Jogador. Aqui encontrará tudo relacionado ao seu crescimento: evolução, níveis, progressão e os diferentes caminhos para alcançar novos patamares. Supere seus limites, fortaleça-se e prove até onde é capaz de chegar._

_*Comandos:*_
_• !Progresso_
_• !Penalidade_
_• !Histórico_
_• !Classe Avançada *(disponível no nível 40)*_
_• !Rank Info_
_• !Locais_`;

    return MessageService.send({ message: msg, text: mensagem });
};
