const MessageService = require("../core/messageService");

module.exports = async (msg) => {
    const mensagem = `_*「 PEATZ 」*_
_— Ora, ora... um cliente! Aqui você encontra de tudo um pouco: Técnicas, Itens, Tokens, Materiais, Caixas e até algumas mercadorias... especiais. Se tiver dinheiro, eu vendo. Se tiver algo interessante, talvez eu compre. Então, Jogador... vamos fazer negócio?_

_*「 SKILLS 」*_ — Força sem técnica não leva ninguém muito longe, Jogador. Aqui encontrará suas Técnicas, Maestrias, Técnicas de Classe e tudo relacionado às habilidades que poderá aprender, desenvolver e dominar durante sua jornada. *Use: !Skills*

_*「 LOJA VIRTUAL 」*_ — Procurando algo novo, Jogador? Aqui encontrará armas, equipamentos, acessórios, itens e muitas outras mercadorias disponíveis para compra e venda. Confira o estoque, seus recursos e tudo que precisa saber antes de fechar um bom negócio. *Use: !Loja Virtual*

_*「 DROPS 」*_ — Toda batalha pode deixar algo valioso para trás, Jogador. Aqui encontrará informações sobre Núcleos, Materiais, Drops e outros recursos obtidos em Dungeons, criaturas e atividades ao longo da sua jornada. *Use: !Drops*`;

    return MessageService.send({ message: msg, text: mensagem });
};
