const MessageService = require("../core/messageService");

module.exports = async (msg) => {
    const mensagem = `_*「 CAÇADOR 」*_
_— Este é o seu espaço, Jogador. Aqui estão reunidas todas as informações que definem quem você é neste mundo: seus atributos, classe, afinidade, equipamentos, títulos, poderes e demais características do seu personagem. Conheça aquilo que possui, entenda suas capacidades e esteja sempre preparado para o que surgir diante de você._

_*Comandos:*_
_• !Jogador_
_• !Nível_
_• !Distribuir_
_• !Consultar Afinidade_
_• !Equipados_
_• !Inventário_
_• !Minhas Passivas_
_• !Meus Títulos_
_• !Minhas Técnicas_
_• !Distribuir_
_• !Consultar Afinidade_
_• !Hp_`;

    return MessageService.send({ message: msg, text: mensagem });
};
