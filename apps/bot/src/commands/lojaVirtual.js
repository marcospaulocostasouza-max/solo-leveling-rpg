const MessageService = require("../core/messageService");

module.exports = async (msg) => {
    const mensagem = `_*「 LOJA VIRTUAL 」*_
_— Todo Caçador precisa estar bem equipado, Jogador. Aqui encontrará *armas, equipamentos, acessórios, itens* e diversos recursos disponíveis no mercado. Compre, venda e prepare seu arsenal, pois entrar despreparado em uma Dungeon pode transformar uma simples incursão na sua última._

_*Comandos:*_
_• !Abrir Loja_
_• !Itens_
_• !Saldo_
_• !Minhas Compras_
_• !DLC — *Bloqueada; disponível futuramente*_`;

    return MessageService.send({ message: msg, text: mensagem });
};
