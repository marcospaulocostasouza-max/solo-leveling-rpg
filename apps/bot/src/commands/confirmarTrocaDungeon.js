const JogadorCore = require('../core/jogadorCore');
const MessageService = require('../core/messageService');
module.exports = async msg => {
    try {
        const player = await JogadorCore.buscarPorNumero(msg.author || msg.from);
        if (!player) return MessageService.send({message:msg,text:'Jogador não encontrado.'});
        const result = await require('../systems/dungeonRewardUseService').confirm(player.id, /^!trocar dungeon\s*$/i.test(msg.body.trim()));
        return MessageService.send({message:msg,text:result.erro || result.mensagem});
    } catch (error) {
        console.error('[DUNGEON] Troca:',error);
        return MessageService.send({message:msg,text:'Não foi possível trocar a dungeon. A operação foi desfeita.'});
    }
};
