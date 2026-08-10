/*
 * CARREGADOR DE DATABASE DE DUNGEONS
 * 
 * Lê o arquivo dungeons.json que contém todas as 700 masmorras.
 * Fornece funções para buscar e sortear dungeons por rank.
 */

const fs = require("fs");
const path = require("path");

// Database de dungeons (700 masmorras)
const caminhoDatabase = path.join(__dirname, "..", "database", "dungeons.json");
const caminhoDrops = path.join(__dirname, "..", "database", "dungeon_drops.json");

// Cache em memória após primeira leitura
let dungeonsCache = null;
let dropsCache = null;

// Premiações por rank (XP e Wons base)
const PREMIACOES_RANK = {
    "E": { xp: 4000, won: 20000, atributos: 20, maestria: 0, itensMisteriosos: 2 },
    "D": { xp: 8000, won: 50000, atributos: 0, maestria: 40, itensMisteriosos: 2 },
    "C": { xp: 16000, won: 100000, atributos: 0, maestria: 60, itensMisteriosos: 2 },
    "B": { xp: 26000, won: 190000, atributos: 0, maestria: 80, itensMisteriosos: 2 },
    "A": { xp: 60000, won: 500000, atributos: 0, maestria: 100, itensMisteriosos: 2 },
    "S": { xp: 200000, won: 1000000, atributos: 0, maestria: 200, itensMisteriosos: 2 }
};

class DungeonDatabaseLoader {

    /**
     * Carrega todas as dungeons da database
     */
    static carregarDungeons() {
        if (dungeonsCache) return dungeonsCache;
        
        try {
            const dados = fs.readFileSync(caminhoDatabase, "utf8");
            dungeonsCache = JSON.parse(dados);
            return dungeonsCache;
        } catch (e) {
            console.error("Erro ao carregar database de dungeons:", e.message);
            return [];
        }
    }

    /**
     * Retorna todas as dungeons de um rank específico
     */
    static getDungeonsPorRank(rank) {
        const dungeons = this.carregarDungeons();
        const rankUpper = rank.toUpperCase();
        return dungeons.filter(d => d.rank.toUpperCase() === rankUpper);
    }

    /**
     * Sorteia uma dungeon aleatória de um rank específico
     */
    static sortearDungeon(rank) {
        const dungeonsRank = this.getDungeonsPorRank(rank);
        if (!dungeonsRank || dungeonsRank.length === 0) return null;
        
        // Embaralhar e pegar uma aleatória
        const index = Math.floor(Math.random() * dungeonsRank.length);
        return dungeonsRank[index];
    }

    /**
     * Busca uma dungeon por ID
     */
    static getDungeonPorId(id) {
        const dungeons = this.carregarDungeons();
        return dungeons.find(d => d.id === id) || null;
    }

    /**
     * Retorna contagem de dungeons por rank
     */
    static getContagemPorRank() {
        const dungeons = this.carregarDungeons();
        const contagem = { E: 0, D: 0, C: 0, B: 0, A: 0, S: 0 };
        
        dungeons.forEach(d => {
            if (contagem[d.rank] !== undefined) {
                contagem[d.rank]++;
            }
        });
        
        return contagem;
    }

    /**
     * Retorna a premiação base de um rank
     */
    static getPremiacaoRank(rank) {
        return PREMIACOES_RANK[rank] || PREMIACOES_RANK["E"];
    }

    /**
     * Carrega os drops de itens de todas as dungeons
     */
    static carregarDrops() {
        if (dropsCache) return dropsCache;
        
        try {
            const dados = fs.readFileSync(caminhoDrops, "utf8");
            dropsCache = JSON.parse(dados);
            return dropsCache;
        } catch (e) {
            console.error("Erro ao carregar database de drops:", e.message);
            return {};
        }
    }

    /**
     * Retorna os drops de uma dungeon específica
     */
    static getDropsDungeon(dungeonId) {
        const drops = this.carregarDrops();
        return drops[dungeonId] || [];
    }

    /**
     * Sorteia um item aleatório dos drops de uma dungeon
     */
    static sortearItemMisterioso(dungeonId) {
        const itens = this.getDropsDungeon(dungeonId);
        if (!itens || itens.length === 0) return null;
        
        const index = Math.floor(Math.random() * itens.length);
        return itens[index];
    }
}

module.exports = DungeonDatabaseLoader;
module.exports.PREMIACOES_RANK = PREMIACOES_RANK;
