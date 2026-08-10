const MessageService = require("../core/messageService");

/*
 * COMANDO: !minha dungeon
 * 
 * Exibe todas as informações da Dungeon vinculada à chave do jogador.
 */

const JogadorCore = require("../core/jogadorCore");
const DungeonInstanciadaSystem = require("../systems/dungeonInstanciadaSystem");

module.exports = async (msg) => {
    try {
        const numero = msg.author || msg.from;
        
        // Buscar jogador
        const jogador = await JogadorCore.buscarPorNumero(numero);
        if (!jogador) {
            return MessageService.send({ message: msg, text: `
*═══ MINHA DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Jogador não encontrado!*

Você ainda não possui uma ficha criada.
Use *!ficha* para criar seu personagem.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Buscar chave
        const chave = await DungeonInstanciadaSystem.getChave(jogador.id);
        if (!chave) {
            return MessageService.send({ message: msg, text: `
*═══ MINHA DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Você não possui uma Chave de Dungeon.*

_Use *!Desejar* para tentar obter uma chave._
_Use *!abrir dungeon* para abrir sua dungeon._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Buscar dungeon vinculada
        const dungeon = await DungeonInstanciadaSystem.getDungeonVinculada(jogador.id);
        if (!dungeon) {
            return MessageService.send({ message: msg, text: `
*═══ MINHA DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Nenhuma dungeon vinculada à sua chave.*

*Chave:* Rank ${chave.rank} | Usos: ${chave.usos_restantes}/${chave.usos_total}

_Use *!abrir dungeon* para abrir sua dungeon._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Buscar ficha de dungeon para estado
        const ficha = await new Promise((resolve) => {
            const db = require("../core/database");
            db.get("SELECT * FROM fichas_dungeon WHERE jogador_id = ? AND status = 'ativa'", [jogador.id], (err, row) => {
                resolve(row || null);
            });
        });

        // Estado atual
        let estado = "Não iniciada";
        if (ficha && ficha.usos_consumidos > 0) {
            estado = "Em exploração";
        }
        if (chave.usos_restantes === 0) {
            estado = "Finalizada";
        }

        // Recompensas obtidas
        const recompensasObtidas = ficha && ficha.usos_consumidos > 0 ? "✓ Usos consumidos" : "—";

        // Montar mensagem
        return MessageService.send({ message: msg, text: `
*═══ MINHA DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*${dungeon.nome}*

*Rank:* ${dungeon.rank}
*Tema:* ${dungeon.tema}
*Elemento:* ${dungeon.elemento}

*Estado Atual:* ${estado}

*Chave de Dungeon:*
> Usos restantes: ${chave.usos_restantes}/${chave.usos_total}

*Entrada:*
${dungeon.entrada}

*Monstro Guardião:*
> *${dungeon.monstro.nome}*
> ${dungeon.monstro.descricao}

*Boss da Masmorra:*
> *${dungeon.boss.nome}*
> ${dungeon.boss.descricao}

*Habilidades do Boss:*
${dungeon.boss.habilidades.map(h => `> ${h}`).join("\n")}

*Recompensas Disponíveis:*
> XP: ${dungeon.recompensas.xp}
> Wons: ${dungeon.recompensas.won}
${dungeon.recompensas.item_misterioso ? "> Item Misterioso: ✓" : "> Item Misterioso: ✗"}
${dungeon.recompensas.drop_tecnica ? "> Drop de Técnica: ✓" : "> Drop de Técnica: ✗"}

*Recompensas Obtidas:*
> ${recompensasObtidas}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Use *!ficha de Dungeon* para montar seu grupo._
_Use *!abrir dungeon* para abrir uma nova dungeon (após terminar a atual)._` });
        
    } catch (error) {
        console.error("Erro no comando !minha dungeon:", error);
        return MessageService.send({ message: msg, text: `
*═══ ERRO ═══*
_Ocorreu um erro ao carregar sua dungeon._
_Tente novamente mais tarde._` });
    }
};