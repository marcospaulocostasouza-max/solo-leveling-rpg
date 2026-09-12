"use strict";
const database = require("../../../../packages/database");
const Quest = require('../systems/questSystem');
const Progress = require('../systems/missionProgressService');
const MessageService = require('../core/messageService');
module.exports = async msg => {
    try {
        const actor = msg.author || msg.from;
        const [line, ...lines] = String(msg.body || '').trim().split(/\r?\n/);
        let player, name;
        const approval = /^!aprovar miss[aã]o\b/i.test(line);
        if (approval) {
            if (!await require('../core/adminCore').isAdmin(actor)) throw new Error('Somente a ADM pode aprovar missões e liberar recompensas.');
            const [target, ...parts] = line.replace(/^!aprovar miss[aã]o\s*/i, '').split('|');
            name = parts.join('|').trim();
            if (!name) throw new Error('Use !aprovar missão Nome do Jogador | Nome da Missão após revisar o relato e os objetivos.');
            const normalizar = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
            const encontrados = (await database.all('SELECT id,nome,numero FROM jogadores', []))
                .filter(p => normalizar(p.nome) === normalizar(target));
            if (encontrados.length > 1) throw new Error('Existe mais de um jogador com esse nome. Diferencie os nomes das fichas antes de aprovar.');
            player = encontrados[0];
        } else {
            player = await database.playerByPhone(actor);
            name = line.replace(/^!(?:entregar|concluir) miss[aã]o\s*/i, '').trim();
        }
        if (!player) throw new Error('Jogador não encontrado.');
        const mission = await Quest.buscarMissaoPorNome(player.id,name);
        if (!mission) throw new Error('Missão não encontrada para esse jogador.');
        if (approval) {
            const result = await Progress.concluir(player.id,mission.id,{aprovadoPor:actor,cena:lines.join('\n')});
            await MessageService.send({ message: msg, text: result.duplicada ? 'Missão já concluída; nenhuma recompensa repetida.' : `*MISSÃO CONCLUÍDA*\n${mission.nome}\n${result.recompensa.xp} XP | ${result.recompensa.won} Won\nItem: ${result.recompensa.item || "Nenhum"}\nCristais: ${result.recompensa.cristais}\nV\u00ednculo: +${result.recompensa.vinculo}%` });
        } else {
            await Progress.entregar(player.id,mission.id,lines.join('\n'));
            await MessageService.send({ message: msg,text: `*MISSÃO ENTREGUE*\n${mission.nome}\nSeu relato aguarda avaliação da ADM. As recompensas serão liberadas após a aprovação.` });
        }
    } catch (error) {
        console.error('[QUEST] Entrega/aprovação:',error.message);
        await MessageService.send({ message: msg,text: error.message });
    }
};
