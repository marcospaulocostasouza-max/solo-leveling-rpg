/*
 * SISTEMA DE NÍVEL E PROGRESSÃO
 * 
 * Gerencia níveis, experiência e evolução dos jogadores.
 * 
 * REGRAS DE XP:
 * Nível 1-11:   500 XP cada nível (constante)
 * Nível 12-29:  (nível - 11) * 1000 XP (aumenta 1000 por nível)
 * Nível 30:     19.500 XP
 * Nível 31-60:  19.500 + (nível - 30) * 1500 XP (aumenta 1500 por nível)
 * Nível 61:     66.000 XP
 * Nível 62-100: 66.000 + (nível - 61) * 2000 XP (aumenta 2000 por nível)
 * 
 * BÔNUS POR NÍVEL:
 * - +1 ponto em cada atributo (força, resistência, velocidade, sentidos, inteligência, poder mágico)
 * - +3 pontos de atributo para distribuir
 * - A cada 5 níveis: desbloqueia uma nova Skill
 * 
 * RANK: Não é automático - obtido por avaliação (nível 15=D, 30=C, 60=B, 80=A, 100=S)
 */

const db = require("../core/database");
const AdvancedClassSystem = require("./advancedClassSystem");
const AtributoSystem = require("./atributoSystem");

// Tabela de experiência necessária por nível (até nível 100)
const XP_POR_NIVEL = {
    1: 0,
    2: 500, 3: 500, 4: 500, 5: 500,
    6: 500, 7: 500, 8: 500, 9: 500, 10: 500,
    11: 500,
    12: 1000, 13: 2000, 14: 3000, 15: 4000,
    16: 5000, 17: 6000, 18: 7000, 19: 8000, 20: 9000,
    21: 10000, 22: 11000, 23: 12000, 24: 13000, 25: 14000,
    26: 15000, 27: 16000, 28: 17000, 29: 18000, 30: 19500,
    31: 21000, 32: 22500, 33: 24000, 34: 25500, 35: 27000,
    36: 28500, 37: 30000, 38: 31500, 39: 33000, 40: 34500,
    41: 36000, 42: 37500, 43: 39000, 44: 40500, 45: 42000,
    46: 43500, 47: 45000, 48: 46500, 49: 48000, 50: 49500,
    51: 51000, 52: 52500, 53: 54000, 54: 55500, 55: 57000,
    56: 58500, 57: 60000, 58: 61500, 59: 63000, 60: 64500,
    61: 66000,
    62: 68000, 63: 70000, 64: 72000, 65: 74000,
    66: 76000, 67: 78000, 68: 80000, 69: 82000, 70: 84000,
    71: 86000, 72: 88000, 73: 90000, 74: 92000, 75: 94000,
    76: 96000, 77: 98000, 78: 100000, 79: 102000, 80: 104000,
    81: 106000, 82: 108000, 83: 110000, 84: 112000, 85: 114000,
    86: 116000, 87: 118000, 88: 120000, 89: 122000, 90: 124000,
    91: 126000, 92: 128000, 93: 130000, 94: 132000, 95: 134000,
    96: 136000, 97: 138000, 98: 140000, 99: 142000, 100: 144000
};

// Bônus por level up
const PONTOS_ATRIBUTO_POR_NIVEL = 3; // +3 pontos para distribuir
const PONTOS_FIXOS_POR_NIVEL = 1;    // +1 em cada atributo automaticamente

// Requisitos de nível para cada rank
const RANK_REQUISITOS = {
    "E": { nivel: 1 },
    "D": { nivel: 15 },
    "C": { nivel: 30 },
    "B": { nivel: 60 },
    "A": { nivel: 80 },
    "S": { nivel: 100 }
};

// Bônus concedidos ao subir de rank
const RANK_BONUS = {
    "D": { pontos: 15, won: 50000 },
    "C": { pontos: 20, won: 70000 },
    "B": { pontos: 25, won: 80000 },
    "A": { pontos: 50, won: 100000 },
    "S": { pontos: 150, won: 1000000 }
};

class LevelSystem {
    
    static getXpNecessario(nivel) {
        const atual = Math.max(1, Number(nivel) || 1);
        if (atual >= 100) return 0;
        return XP_POR_NIVEL[atual + 1] || atual * 1000;
    }
    
    static getRequisitosRank(rank) {
        return RANK_REQUISITOS[rank] || null;
    }
    
    static getBonusRank(rank) {
        return RANK_BONUS[rank] || null;
    }
    
    static podeSolicitarRank(jogador, rankDesejado) {
        const requisito = RANK_REQUISITOS[rankDesejado];
        if (!requisito) return { pode: false, motivo: "Rank invalido." };
        if (jogador.nivel < requisito.nivel) {
            return { 
                pode: false, 
                motivo: `Nivel insuficiente. Necessario nivel ${requisito.nivel}, atual: ${jogador.nivel}.` 
            };
        }
        return { pode: true, motivo: "" };
    }
    
    /**
     * Verifica progressão de nível baseado na XP atual
     * Aplica: +3 pontos distribuir, +1 em cada atributo, recalcula totais
     * NÃO atualiza rank automaticamente
     */
    static async verificarProgressao(jogadorId) {
        return new Promise((resolve) => {
            db.get("SELECT * FROM jogadores WHERE id = ?", [jogadorId], async (err, jogador) => {
                if (!jogador) return resolve(null);
                
                let subiuNivel = false;
                let nivel = Number(jogador.nivel) || 1;
                let xp = Number(jogador.experiencia) || 0;
                
                // Loop de progressão (pode subir múltiplos níveis de uma vez)
                while (nivel < 100 && xp >= this.getXpNecessario(nivel)) {
                    xp -= this.getXpNecessario(nivel);
                    nivel++;
                    subiuNivel = true;
                }
                
                if (subiuNivel) {
                    const niveisGanhos = nivel - jogador.nivel;
                    
                    // +3 pontos de atributo para distribuir por nível
                    const pontosGanhos = niveisGanhos * PONTOS_ATRIBUTO_POR_NIVEL;
                    // BIGINT chega como string no PostgreSQL; converta antes de somar.
                    let pontosAtributo = (Number(jogador.pontos_atributo) || 0) + pontosGanhos;
                    
                    // +1 em cada atributo base por nível
                    const bonusForca = niveisGanhos * PONTOS_FIXOS_POR_NIVEL;
                    const bonusResistencia = niveisGanhos * PONTOS_FIXOS_POR_NIVEL;
                    const bonusVelocidade = niveisGanhos * PONTOS_FIXOS_POR_NIVEL;
                    const bonusSentidos = niveisGanhos * PONTOS_FIXOS_POR_NIVEL;
                    const bonusInteligencia = niveisGanhos * PONTOS_FIXOS_POR_NIVEL;
                    const bonusPoderMagico = niveisGanhos * PONTOS_FIXOS_POR_NIVEL;
                    
                    // Calcular novo mana/vida máximo
                    const manaMaxima = Math.max(100, (jogador.inteligencia_base || 0) * 100 + nivel * 10);
                    const vidaMaxima = Math.max(100, (jogador.resistencia_base || 0) * 3 + nivel * 20);
                    
                    // =====================================
                    // RANK AUTOMÁTICO - Verificar se atingiu requisitos de rank
                    // =====================================
                    let novoRank = jogador.rank;
                    let rankBonus = { pontos: 0, won: 0 };
                    let subiuRank = false;
                    
                    const ranksOrdem = ["E", "D", "C", "B", "A", "S"];
                    const indexAtual = ranksOrdem.indexOf(jogador.rank);
                    
                    // Verificar cada rank superior
                    for (let i = indexAtual + 1; i < ranksOrdem.length; i++) {
                        const rankTeste = ranksOrdem[i];
                        const requisito = RANK_REQUISITOS[rankTeste];
                        if (requisito && nivel >= requisito.nivel) {
                            novoRank = rankTeste;
                            const bonusDoRank = RANK_BONUS[rankTeste] || { pontos: 0, won: 0 };
                            rankBonus.pontos += bonusDoRank.pontos;
                            rankBonus.won += bonusDoRank.won;
                            subiuRank = true;
                        } else {
                            break; // Para no primeiro que não atingir
                        }
                    }
                    
                    // Se subiu de rank, aplicar bônus
                    let rankMensagem = '';
                    if (subiuRank) {
                        pontosAtributo += rankBonus.pontos;
                        rankMensagem = `\n*RANK EVOLUIDO!* ${jogador.rank} → ${novoRank}\nBonus: ${rankBonus.pontos} pontos + ${rankBonus.won} Won`;
                    }
                    
                    // Atualizar tudo no banco
                    db.run(
                        `UPDATE jogadores SET 
                         nivel = ?, experiencia = ?,
                         forca_base = forca_base + ?,
                         resistencia_base = resistencia_base + ?,
                         velocidade_base = velocidade_base + ?,
                         sentidos_base = sentidos_base + ?,
                         inteligencia_base = inteligencia_base + ?,
                         poder_magico_base = poder_magico_base + ?,
                         mana_maxima = ?, mana_atual = mana_maxima,
                         vida_maxima = ?, vida_atual = vida_maxima,
                         pontos_atributo = ?,
                         rank = ?,
                         won = won + ?
                         WHERE id = ?`,
                        [
                            nivel, xp,
                            bonusForca, bonusResistencia, bonusVelocidade,
                            bonusSentidos, bonusInteligencia, bonusPoderMagico,
                            manaMaxima, vidaMaxima, pontosAtributo,
                            novoRank, rankBonus.won, jogadorId
                        ],
                        async (err) => {
                            if (err) {
                                console.error("Erro ao atualizar nível:", err.message);
                                return resolve(null);
                            }
                            
                            // Recalcular totais dos atributos (novo sistema central)
                            await AtributoSystem.recalcularAtributos(jogadorId);
                            
                            resolve({
                                subiuNivel: true,
                                nivelAntigo: jogador.nivel,
                                nivelNovo: nivel,
                                rank: novoRank,
                                rankAntigo: jogador.rank,
                                subiuRank: subiuRank,
                                rankMensagem: rankMensagem,
                                pontosGanhos: pontosGanhos,
                                bonusAtributos: {
                                    forca: bonusForca,
                                    resistencia: bonusResistencia,
                                    velocidade: bonusVelocidade,
                                    sentidos: bonusSentidos,
                                    inteligencia: bonusInteligencia,
                                    poderMagico: bonusPoderMagico
                                }
                            });
                        }
                    );
                } else {
                    resolve({
                        subiuNivel: false,
                        nivel: nivel,
                        xpAtual: xp,
                        xpNecessario: this.getXpNecessario(nivel)
                    });
                }
            });
        });
    }
    
    /**
     * Aplica um rank ao jogador (usado pelo sistema de avaliação)
     */
    static async aplicarRank(jogadorId, novoRank) {
        return new Promise((resolve) => {
            db.get("SELECT * FROM jogadores WHERE id = ?", [jogadorId], async (err, jogador) => {
                if (!jogador) return resolve({ success: false, mensagem: "Jogador nao encontrado." });
                
                const requisito = RANK_REQUISITOS[novoRank];
                if (!requisito) return resolve({ success: false, mensagem: "Rank invalido." });
                if (jogador.nivel < requisito.nivel) {
                    return resolve({ success: false, mensagem: `Nivel insuficiente. Necessario ${requisito.nivel}, atual: ${jogador.nivel}.` });
                }
                
                const ranksOrdem = ["E", "D", "C", "B", "A", "S"];
                const indexAtual = ranksOrdem.indexOf(jogador.rank);
                const indexNovo = ranksOrdem.indexOf(novoRank);
                if (indexNovo <= indexAtual) {
                    return resolve({ success: false, mensagem: `Jogador ja possui rank ${jogador.rank} ou superior.` });
                }
                
                const bonus = RANK_BONUS[novoRank] || { pontos: 0, won: 0 };
                
                db.run(
                    `UPDATE jogadores SET 
                     rank = ?, 
                     pontos_atributo = pontos_atributo + ?,
                     won = won + ?
                     WHERE id = ?`,
                    [novoRank, bonus.pontos, bonus.won, jogadorId],
                    (err) => {
                        if (err) return resolve({ success: false, mensagem: "Erro ao aplicar rank." });
                        
                        AtributoSystem.recalcularAtributos(jogadorId);
                        
                        resolve({ 
                            success: true, 
                            mensagem: `Rank ${novoRank} aplicado! Bonus: ${bonus.pontos} pontos de atributo e ${bonus.won} Won.` 
                        });
                    }
                );
            });
        });
    }
    
    /**
     * Recalcula atributos totais do jogador (soma base + buffs)
     */
    static async recalcularTotais(jogador) {
        return new Promise((resolve) => {
            const forca_total = Number(jogador.forca_base || 0) + Number(jogador.forca_buff || 0);
            const resistencia_total = Number(jogador.resistencia_base || 0) + Number(jogador.resistencia_buff || 0);
            const velocidade_total = Number(jogador.velocidade_base || 0) + Number(jogador.velocidade_buff || 0);
            const sentidos_total = Number(jogador.sentidos_base || 0) + Number(jogador.sentidos_buff || 0);
            const inteligencia_total = Number(jogador.inteligencia_base || 0) + Number(jogador.inteligencia_buff || 0);
            const poder_magico_total = Number(jogador.poder_magico_base || 0) + Number(jogador.poder_magico_buff || 0);
            
            const manaMaxima = Math.max(100, (jogador.inteligencia_base || 0) * 100 + (jogador.nivel || 1) * 10);
            const vidaMaxima = Math.max(100, (jogador.resistencia_base || 0) * 3 + (jogador.nivel || 1) * 20);
            
            db.run(
                `UPDATE jogadores SET 
                 forca_total = ?, resistencia_total = ?, velocidade_total = ?,
                 sentidos_total = ?, inteligencia_total = ?, poder_magico_total = ?,
                 mana_maxima = ?, vida_maxima = ?
                 WHERE id = ?`,
                [
                    forca_total, resistencia_total, velocidade_total,
                    sentidos_total, inteligencia_total, poder_magico_total,
                    manaMaxima, vidaMaxima,
                    jogador.id
                ],
                (error) => {
                    resolve(!error);
                }
            );
        });
    }
    
    static async adicionarXp(jogadorId, quantidade, motivo) {
        return new Promise((resolve) => {
            db.run("UPDATE jogadores SET experiencia = experiencia + ? WHERE id = ?", [quantidade, jogadorId]);
            db.run("INSERT INTO experiencia_historico (jogador_id, quantidade, motivo, data) VALUES (?, ?, ?, datetime('now'))",
                [jogadorId, quantidade, motivo]);
            
            this.verificarProgressao(jogadorId).then(resolve);
        });
    }
    
    static getInfoNivel(jogador) {
        return {
            nivel: jogador.nivel,
            xpAtual: jogador.experiencia,
            xpNecessario: this.getXpNecessario(jogador.nivel),
            rank: jogador.rank,
            progresso: Math.floor((jogador.experiencia / this.getXpNecessario(jogador.nivel)) * 100)
        };
    }
}

module.exports = LevelSystem;
