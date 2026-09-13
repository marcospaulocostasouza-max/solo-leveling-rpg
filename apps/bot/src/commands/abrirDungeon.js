const MessageService = require("../core/messageService");

/*
 * COMANDO: !abrir dungeon
 * 
 * Sorteia uma Dungeon da database baseada no rank da Chave de Dungeon do jogador.
 * A Dungeon sorteada é anexada à chave, tornando-se exclusiva.
 */

const JogadorCore = require("../core/jogadorCore");
const DungeonInstanciadaSystem = require("../systems/dungeonInstanciadaSystem");
const DungeonDatabaseLoader = require("../systems/dungeonDatabaseLoader");

module.exports = async (msg) => {
    try {
        const numero = msg.author || msg.from;
        
        // Buscar jogador
        const jogador = await JogadorCore.buscarPorNumero(numero);
        if (!jogador) {
            return MessageService.send({ message: msg, text: `
*═══ ABRIR DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Jogador não encontrado!*

Você ainda não possui uma ficha criada.
Use *!ficha* para criar seu personagem.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Buscar chave de dungeon
        let chave = await DungeonInstanciadaSystem.getChave(jogador.id);
        const argumento = String(msg.body || '').replace(/^!abrir\s+(?:dungeon|chave)\s*/i, '').trim();
        const abrirItem = argumento || /^!abrir\s+chave\s*$/i.test(msg.body.trim()) || !chave;
        if (abrirItem) {
            const rewards = require('../systems/dungeonRewardUseService');
            const itens = (await require('../../../../packages/database').all('SELECT i.* FROM inventario_jogador inv JOIN itens i ON i.id=inv.item_id WHERE inv.jogador_id=? AND inv.quantidade>0', [jogador.id])).filter(i => rewards.kind(i)==='key');
            const alvo = argumento.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const candidatas = argumento ? itens.filter(i => i.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()===alvo) : itens;
            const unicas = [...new Map(candidatas.map(i=>[i.id,i])).values()];
            if (unicas.length > 1) return MessageService.send({message:msg,text:'Você possui várias chaves. Use !usar seguido do nome completo da chave para escolher qual abrir.'});
            if (unicas.length===1) {
                const resultado = await rewards.use(jogador.id,unicas[0].id);
                if (resultado.erro || resultado.pendente) return MessageService.send({message:msg,text:resultado.erro || resultado.mensagem});
                chave = await DungeonInstanciadaSystem.getChave(jogador.id);
            } else if (argumento) return MessageService.send({message:msg,text:'Chave não encontrada no inventário. Use o nome completo.'});
        }
        if (!chave) {
            return MessageService.send({ message: msg, text: `
*═══ ABRIR DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Você não possui uma Chave de Dungeon.*

_Use *!Desejar* para tentar obter uma chave semanal._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Verificar se já possui uma dungeon vinculada à chave
        if (chave.dungeon_id) {
            const dungeon = DungeonDatabaseLoader.getDungeonPorId(Number(chave.dungeon_id));
            if (dungeon) {
                return MessageService.send({ message: msg, text: `
*═══ ABRIR DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Você já vinculou uma Dungeon à sua chave!*

*Dungeon:* ${dungeon.nome}
*Rank:* ${dungeon.rank}

_Use *!minha dungeon* para ver as informações completas._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
            }
        }

        // Sortear dungeon da database baseado no rank da chave
        const dungeonSorteada = DungeonDatabaseLoader.sortearDungeon(chave.rank);
        if (!dungeonSorteada) {
            return MessageService.send({ message: msg, text: `
*═══ ABRIR DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Nenhuma dungeon encontrada para o rank ${chave.rank}.*

_Contate a administração._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Vincular dungeon à chave
        const vinculado = await DungeonInstanciadaSystem.vincularDungeon(chave.id, dungeonSorteada.id);
        if (!vinculado) {
            return MessageService.send({ message: msg, text: `
*═══ ABRIR DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Erro ao vincular a dungeon à chave.*
_Tente novamente mais tarde._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Responder com a dungeon sorteada
        return MessageService.send({ message: msg, text: `
*═══ DUNGEON ABERTA! ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*${dungeonSorteada.nome}*

*Rank:* ${dungeonSorteada.rank}
*Tema:* ${dungeonSorteada.tema}
*Elemento:* ${dungeonSorteada.elemento}

*Entrada:*
${dungeonSorteada.entrada}

*Monstro:*
> ${dungeonSorteada.monstro.nome} - ${dungeonSorteada.monstro.descricao}

*Boss:*
> ${dungeonSorteada.boss.nome}
> ${dungeonSorteada.boss.descricao}

*Habilidades do Boss:*
${dungeonSorteada.boss.habilidades.map(h => `> ${h}`).join("\n")}

*Recompensas:*
> XP: ${dungeonSorteada.recompensas.xp}
> Wons: ${dungeonSorteada.recompensas.won}
${dungeonSorteada.recompensas.item_misterioso ? "> Item Misterioso: ✓" : ""}
${dungeonSorteada.recompensas.drop_tecnica ? "> Drop de Técnica: ✓" : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Use *!minha dungeon* para ver esta dungeon._
_Use *!ficha de Dungeon* para ver sua ficha de grupo._` });

    } catch (error) {
        console.error("Erro no comando !abrir dungeon:", error);
        return MessageService.send({ message: msg, text: `
*═══ ERRO ═══*
_Ocorreu um erro ao abrir a dungeon._
_Tente novamente mais tarde._` });
    }
};
