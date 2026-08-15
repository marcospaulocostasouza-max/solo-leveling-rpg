const MessageService = require("../core/messageService");

module.exports = async (msg) => {
    const mensagem = `_*「 DROPS 」*_
_— Toda criatura abatida pode deixar algo de valor, Jogador. Aqui encontrará informações sobre Núcleos, Materiais, Drops e outros recursos obtidos durante Dungeons, batalhas e explorações. Reúna o que encontrar e aproveite cada recurso, pois até o menor fragmento pode ter sua utilidade._

_*Comandos:*_
_• !Núcleos_
_• !Materiais_
_• !Loja Núcleos_
_• !Loja Materiais_
_• !Caixa_`;

    return MessageService.send({ message: msg, text: mensagem });
};
