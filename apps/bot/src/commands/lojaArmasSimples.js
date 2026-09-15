const MessageService = require('../core/messageService');
const { ITENS_LOJA } = require('../utils/lojaItens');
const messageSplitter = require('../utils/messageSplitter');

module.exports = async msg => {
    const armas = ITENS_LOJA.Inicial?.['Armas Simples'] || [];
    if (!armas.length) {
        return MessageService.send({ message: msg, text: '*✖ Nenhuma arma simples está disponível agora.*' });
    }

    let mensagem = '*═══ LOJA DE ARMAS SIMPLES ═══*\n';
    mensagem += '──────────────────────────\n\n';
    mensagem += '> *Preço único:* 5.000 Won\n';
    mensagem += '> *Rank:* Inicial\n';
    mensagem += '> As armas simples não concedem bônus de atributo.\n\n';

    armas.forEach((arma, index) => {
        mensagem += `*${index + 1}. ${arma.nome}*\n`;
        mensagem += `> ${arma.descricao}\n\n`;
    });

    mensagem += '──────────────────────────\n';
    mensagem += `> *Total:* ${armas.length} armas\n`;
    mensagem += '> Para comprar: *!comprar <nome da arma>*\n';
    mensagem += '> Depois confirme com: *!confirmar compra*';

    return messageSplitter.enviarMensagemCompleta(msg, mensagem);
};
