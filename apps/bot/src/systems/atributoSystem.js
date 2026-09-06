/*
 * SISTEMA CENTRAL DE ATRIBUTOS
 * 
 * Responsável por calcular e manter os atributos do personagem:
 * - Atributos Base: valores do jogador (distribuição, level, rank, etc.)
 * - Bônus de Classe Inicial: 50% sobre um atributo específico da classe
 * - Bônus de Equipamentos: bônus de itens equipados
 * - Bônus de Classe Avançada: buffs adicionais
 * - Atributos Totais: soma final de tudo
 * 
 * Sempre que qualquer valor mudar, chame recalcularAtributos(jogadorId)
 * para atualizar todos os totais automaticamente.
 */

const db = require("../core/database");
function getInventorySystem() {
    return require("./inventorySystem");
}

// =====================================
// BÔNUS DE CLASSE INICIAL (50% sobre atributo específico)
// =====================================
const BONUS_CLASSE_INICIAL = {
    "Lutador": { atributo: "forca_base",       bonus: 0.5 },
    "Assassino": { atributo: "velocidade_base", bonus: 0.5 },
    "Tanker": { atributo: "resistencia_base",  bonus: 0.5 },
    "Ranger": { atributo: "sentidos_base",     bonus: 0.5 },
    "Ranger Físico": { atributo: "forca_base", bonus: 0.5 },
    "Ranger Mágico": { atributo: "poder_magico_base", bonus: 0.5 },
    "Curador": { atributo: "poder_magico_base", bonus: 0.5 },
    "Mago Elemental": { atributo: "poder_magico_base", bonus: 0.5 },
    "Mago Invocador": { atributo: "poder_magico_base", bonus: 0.5 },
    "Mago de Barreira": { atributo: "poder_magico_base", bonus: 0.5 },
    "Mago Barreira": { atributo: "poder_magico_base", bonus: 0.5 },
    "Mago de Maldicao": { atributo: "poder_magico_base", bonus: 0.5 },
    "Mago de Maldição": { atributo: "poder_magico_base", bonus: 0.5 },
    "Mago Maldição": { atributo: "poder_magico_base", bonus: 0.5 }
};

// Map atributo → nome legível
const NOME_ATRIBUTO = {
    forca_base: "Força",
    resistencia_base: "Resistência",
    velocidade_base: "Velocidade",
    sentidos_base: "Sentidos",
    inteligencia_base: "Inteligência",
    poder_magico_base: "Poder Mágico"
};

class AtributoSystem {

    /**
     * Retorna o bônus de classe inicial (50% do atributo base)
     */
    static getBonusClasseInicial(classe) {
        const config = BONUS_CLASSE_INICIAL[classe] || null;
        return config;
    }

    /** Calcula somente o bônus inicial oficial: 50% de um atributo base. */
    static calcularBonusClasseInicial(classe, atributos = {}) {
        const config = this.getBonusClasseInicial(classe);
        const bonus = { forca: 0, resistencia: 0, velocidade: 0, sentidos: 0, inteligencia: 0, poder_magico: 0 };
        if (!config) return bonus;

        const campoParaChave = {
            forca_base: "forca",
            resistencia_base: "resistencia",
            velocidade_base: "velocidade",
            sentidos_base: "sentidos",
            inteligencia_base: "inteligencia",
            poder_magico_base: "poder_magico"
        };
        const chave = campoParaChave[config.atributo];
        if (chave) bonus[chave] = Math.floor(Number(atributos[chave] || 0) * config.bonus);
        return bonus;
    }

    /**
     * Recalcula TODOS os atributos do jogador:
     * - Base + bônus de classe (50%)
     * - +Equipamentos +Buffs de classe avançada
     * Atualiza os campos *_total*, mana e vida máximas.
     */
    static async recalcularAtributos(jogadorId) {
        return new Promise((resolve) => {
            db.get("SELECT * FROM jogadores WHERE id = ?", [jogadorId], async (err, jogador) => {
                if (err || !jogador) return resolve(false);

                // ---------- 1. ATRIBUTOS BASE ----------
                const base = {
                    forca:        Number(jogador.forca_base || 0),
                    resistencia:  Number(jogador.resistencia_base || 0),
                    velocidade:   Number(jogador.velocidade_base || 0),
                    sentidos:     Number(jogador.sentidos_base || 0),
                    inteligencia: Number(jogador.inteligencia_base || 0),
                    poderMagico:  Number(jogador.poder_magico_base || 0)
                };

                // ---------- 2. BÔNUS DE CLASSE INICIAL (50% do base) ----------
                const bonusClasseCalculado = this.calcularBonusClasseInicial(jogador.classe, {
                    forca: base.forca, resistencia: base.resistencia, velocidade: base.velocidade,
                    sentidos: base.sentidos, inteligencia: base.inteligencia, poder_magico: base.poderMagico
                });
                let bonusClasseMap = { ...bonusClasseCalculado, poderMagico: bonusClasseCalculado.poder_magico };

                // ---------- 3. BÔNUS DE CLASSE AVANÇADA (buffs existentes) ----------
                const buffAvancada = {
                    forca:        Number(jogador.forca_buff || 0),
                    resistencia:  Number(jogador.resistencia_buff || 0),
                    velocidade:   Number(jogador.velocidade_buff || 0),
                    sentidos:     Number(jogador.sentidos_buff || 0),
                    inteligencia: Number(jogador.inteligencia_buff || 0),
                    poderMagico:  Number(jogador.poder_magico_buff || 0)
                };

                // ---------- 4. BÔNUS DE EQUIPAMENTOS EQUIPADOS ----------
                const bonusEquip = await getInventorySystem().calcularBonusEquipados(jogadorId);
                const bonusConjunto = await require("./equipmentSetService").calcularBonusConjuntos(jogadorId);

                // ---------- 5. SOMA TOTAL ----------
                const total = {
                    forca:        base.forca        + bonusClasseMap.forca        + buffAvancada.forca        + (bonusEquip.forca || 0)        + (bonusConjunto.forca || 0),
                    resistencia:  base.resistencia  + bonusClasseMap.resistencia  + buffAvancada.resistencia  + (bonusEquip.resistencia || 0)  + (bonusConjunto.resistencia || 0),
                    velocidade:   base.velocidade   + bonusClasseMap.velocidade   + buffAvancada.velocidade   + (bonusEquip.velocidade || 0)   + (bonusConjunto.velocidade || 0),
                    sentidos:     base.sentidos     + bonusClasseMap.sentidos     + buffAvancada.sentidos     + (bonusEquip.sentidos || 0)     + (bonusConjunto.sentidos || 0),
                    inteligencia: base.inteligencia + bonusClasseMap.inteligencia + buffAvancada.inteligencia + (bonusEquip.inteligencia || 0) + (bonusConjunto.inteligencia || 0),
                    poderMagico:  base.poderMagico  + bonusClasseMap.poderMagico  + buffAvancada.poderMagico  + (bonusEquip.poderMagico || 0)  + (bonusConjunto.poder_magico || 0)
                };

                // ---------- 6. MANA E VIDA MÁXIMAS ----------
                const manaMaxima = Math.max(100, total.inteligencia * 100 + (jogador.nivel || 1) * 10);
                const vidaMaxima = Math.max(100, total.resistencia * 3 + (jogador.nivel || 1) * 20);

                // ---------- 7. ATUALIZAR NO BANCO ----------
                db.run(
                    `UPDATE jogadores SET
                     forca_total = ?, resistencia_total = ?, velocidade_total = ?,
                     sentidos_total = ?, inteligencia_total = ?, poder_magico_total = ?,
                     mana_maxima = ?, vida_maxima = ?
                     WHERE id = ?`,
                    [
                        total.forca, total.resistencia, total.velocidade,
                        total.sentidos, total.inteligencia, total.poderMagico,
                        manaMaxima, vidaMaxima,
                        jogadorId
                    ],
                    (error) => {
                        resolve(!error);
                    }
                );
            });
        });
    }

    /**
     * Retorna apenas os bônus de atributos dos itens equipados
     */
    static async calcularBonusAtual(jogadorId) {
        return await getInventorySystem().calcularBonusEquipados(jogadorId);
    }

    /**
     * Retorna os slots do jogador com itens equipados
     */
    static async getSlotsEquipados(jogadorId) {
        return new Promise((resolve) => {
            db.all(
                `SELECT i.* FROM inventario_jogador inv 
                 JOIN itens i ON inv.item_id = i.id 
                 WHERE inv.jogador_id = ? AND inv.equipado = 1`,
                [jogadorId],
                (err, itens) => {
                    resolve(itens || []);
                }
            );
        });
    }

    /**
     * Determina o slot de um item (delega para InventorySystem)
     */
    static getSlotDoItem(item) {
        return getInventorySystem().getSlotDoItem(item);
    }
}

module.exports = AtributoSystem;
module.exports.BONUS_CLASSE_INICIAL = BONUS_CLASSE_INICIAL;
module.exports.NOME_ATRIBUTO = NOME_ATRIBUTO;

