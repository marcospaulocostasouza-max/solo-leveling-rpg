const MessageService = require("../core/messageService");

module.exports = async (msg) => {
    const mensagem = `_*「 ARQUITETO 」*_
_— Veja aqui aquilo que procura. Você, Jogador, entrou em um mundo tomado por Portais, Dungeons, Caçadores e criaturas que desafiam a compreensão humana. Em Solo Leveling: Ragnarok, poder, conhecimento e escolhas determinam até onde você chegará, e existem forças muito maiores agindo nas sombras. Antes de seguir adiante, saiba onde está se metendo — procure aqui aquilo que deseja saber._

_*「 CAÇADOR 」*_ — Este é o seu registro, Jogador. Aqui encontrará tudo sobre seu personagem, seus atributos, poderes e evolução. Conheça a si mesmo antes de ultrapassar seus limites.
*Use: !Caçador*

_*「 ASCENSÃO 」*_ — Todo poder pode crescer, Jogador. Aqui encontrará tudo sobre sua evolução, progressão e os caminhos necessários para alcançar novos patamares.
*Use: !Ascensão*

_*「 ASSOCIAÇÕES 」*_ — Ninguém caminha sozinho, Jogador. Aqui encontrará informações sobre Guildas, o Submundo e as demais organizações que disputam influência neste mundo.
*Use: !Associações*

_*「 BIBLIOTECA 」*_ — Conhecimento também é poder, Jogador. Aqui encontrará informações sobre o mundo, seus sistemas, regras e tudo que precisa saber sobre o RPG.
*Use: !Biblioteca*

_*「 HISTÓRIA 」*_ — Toda jornada deixa sua marca, Jogador. Aqui encontrará missões, acontecimentos e caminhos que conduzem a história deste mundo.
*Use: !História*

_*「 ACERVO 」*_ — Nem todos são apenas parte do cenário, Jogador. Aqui encontrará informações, interações, missões e tudo relacionado àqueles que habitam este mundo.
*Use: !Acervo*`;

    return MessageService.send({ message: msg, text: mensagem });
};
