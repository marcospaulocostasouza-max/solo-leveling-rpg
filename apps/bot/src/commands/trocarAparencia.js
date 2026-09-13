const JogadorCore = require('../core/jogadorCore');
const MessageService = require('../core/messageService');
module.exports = async msg => {
    const reply = text => MessageService.send({message:msg,text});
    try {
        const name = String(msg.body || '').replace(/^!trocar\s+apar[eê]ncia\b\s*/i,'').trim();
        if (!name) return reply('Use !trocar aparencia Nome da aparência. Você pode trocar até duas vezes.');
        const player = await JogadorCore.buscarPorNumero(msg.author || msg.from);
        if (!player) return reply('Sua ficha não foi encontrada.');
        const result = await require('../systems/appearanceChangeService').change(player.id,name);
        return reply(result.erro || result.mensagem);
    } catch (error) {
        console.error('[APARENCIA] Troca:',error.message);
        return reply('Não foi possível alterar sua aparência. A troca foi desfeita; tente novamente.');
    }
};
