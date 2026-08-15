const MessageService = require("../core/messageService");

module.exports = async (msg) => {
    const mensagem = `_*「 BIBLIOTECA 」*_
_— Conhecimento pode ser tão valioso quanto poder, Jogador. Aqui estão reunidas as informações essenciais sobre este mundo, suas regras, sistemas, mecânicas e tudo aquilo que poderá encontrar durante sua jornada. Antes de avançar às cegas, descubra como este mundo realmente funciona._

_*Comandos:*_
_• !Atributos Físicos_
_• !Atributos Mágicos_
_• !Atributos Adicionais_
_• !Únicos_
_• !Estilos de Luta_
_• !Passivas_
_• !Títulos_
_• !Portais_`;

    return MessageService.send({ message: msg, text: mensagem });
};
