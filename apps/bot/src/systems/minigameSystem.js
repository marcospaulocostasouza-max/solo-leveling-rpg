const MessageService = require("../core/messageService");

/**
 * SISTEMA GLOBAL DE MINIGAMES
 * Gerencia todos os minigames do RPG.
 */

const db = require("../core/database");
const DiceSystem = require("./diceSystem");

const minigamesAtivos = {};

class MinigameSystem {
    static getAtivo(jogadorId, tipo) {
        return minigamesAtivos[`${jogadorId}_${tipo}`] || null;
    }

    static setAtivo(jogadorId, tipo, dados) {
        minigamesAtivos[`${jogadorId}_${tipo}`] = dados;
    }

    static removerAtivo(jogadorId, tipo) {
        delete minigamesAtivos[`${jogadorId}_${tipo}`];
    }

    static async darRecompensa(jogadorId, msg, recompensa) {
        if (!recompensa) return;
        const updates = [];
        const params = [];

        if (recompensa.xp) {
            updates.push("experiencia = experiencia + ?");
            params.push(recompensa.xp);
        }
        if (recompensa.won) {
            updates.push("won = won + ?");
            params.push(recompensa.won);
        }
        if (recompensa.maestria) {
            updates.push("maestria = COALESCE(maestria, 0) + ?");
            params.push(recompensa.maestria);
        }

        if (updates.length > 0) {
            params.push(jogadorId);
            db.run(`UPDATE jogadores SET ${updates.join(", ")} WHERE id = ?`, params);
        }

        let texto = "*RECOMPENSAS*\n";
        if (recompensa.xp) texto += `+${recompensa.xp} XP\n`;
        if (recompensa.won) texto += `+${recompensa.won.toLocaleString()} Won\n`;
        if (recompensa.maestria) texto += `+${recompensa.maestria} de Maestria\n`;
        if (recompensa.item) texto += `Item: ${recompensa.item}\n`;
        if (recompensa.titulo) texto += `Titulo: ${recompensa.titulo}\n`;
        if (recompensa.texto) texto += recompensa.texto;

        await MessageService.send({ message: msg, text: texto });
    }

    // BANCO DE ANIMES PARA MINIGAME
    static get bancoAnimes() {
        return [
            { emojis: "🍥🦊🍜", nome: "naruto" },
            { emojis: "☠️🏴‍☠️👒", nome: "one piece" },
            { emojis: "🗡️👹🌊", nome: "demon slayer" },
            { emojis: "👊🥚🧹", nome: "one punch man" },
            { emojis: "🧙🍀📖", nome: "black clover" },
            { emojis: "⚡🏘️👨‍👩‍👧‍👦", nome: "boku no hero" },
            { emojis: "🔵⚪🏀", nome: "kuroko no basket" },
            { emojis: "🏐🟠🟡", nome: "haikyuu" },
            { emojis: "🗡️⚔️👺", nome: "kimetsu no yaiba" },
            { emojis: "🧟‍♂️🔫📖", nome: "highschool of the dead" },
            { emojis: "🚀👨‍🚀🌌", nome: "stein's gate" },
            { emojis: "🧠🔍🧪", nome: "death note" },
            { emojis: "🩸🔪🎴", nome: "kakegurui" },
            { emojis: "🐉🔵⚪", nome: "dragon ball" },
            { emojis: "🧝‍♂️🏹🗡️", nome: "sword art online" },
            { emojis: "💀👻🔱", nome: "soul eater" },
            { emojis: "🐺👘🗡️", nome: "rurouni kenshin" },
            { emojis: "🤖🔫💥", nome: "trigun" },
            { emojis: "👑⚔️🐉", nome: "nanatsu no taizai" },
            { emojis: "🦋🔪💀", nome: "another" },
            { emojis: "🧹🌟✨", nome: "little witch academia" },
            { emojis: "🌹🖤🗡️", nome: "akame ga kill" },
            { emojis: "🧩🎲🔮", nome: "no game no life" },
            { emojis: "🐗🍖🍜", nome: "shokugeki no soma" },
            { emojis: "🤺👻⚔️", nome: "bleach" },
            { emojis: "🕷️🕸️🦸", nome: "spider-man" },
            { emojis: "🐭🧀🍕", nome: "tom and jerry" },
            { emojis: "🎸🎤🎵", nome: "beck" },
            { emojis: "🥷🔥🌪️", nome: "naruto shippuden" },
            { emojis: "🦸‍♂️💥🦹", nome: "invincible" }
        ];
    }
}

module.exports = MinigameSystem;
