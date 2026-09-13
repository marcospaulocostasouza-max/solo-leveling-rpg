const MessageService = require('../core/messageService');
const JogadorCore = require('../core/jogadorCore');
const Dungeon = require('../systems/dungeonInstanciadaSystem');
module.exports = async msg => {
    const player = await JogadorCore.buscarPorNumero(msg.author || msg.from);
    if (!player) return MessageService.send({ message: msg, text: 'Você precisa de uma ficha aprovada.' });
    const pending = await Dungeon.getFichasPendentesParaPremio(player.id);
    const id = String(msg.body).match(/\bdungeon\s+#?(\d+)\s*$/i)?.[1];
    if (!pending.length) return MessageService.send({ message: msg, text: 'Você não tem prêmios de dungeon pendentes.' });
    if (!id && pending.length > 1) return MessageService.send({ message: msg, text: `*DUNGEONS COM PRÊMIOS PENDENTES*\n${pending.map(f => `#${f.id} — ${f.dungeon_nome}`).join('\n')}\n\nUse !premios dungeon ID para consultar as opções.` });
    const ficha = id ? pending.find(f => String(f.id) === id) : pending[0];
    return MessageService.send({ message: msg, text: ficha ? await Dungeon.formatarPremiacoes(ficha.id, player.id) : 'Essa dungeon não possui prêmio pendente para você.' });
};
