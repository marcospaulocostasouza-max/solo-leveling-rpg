/**
 * JOGADOR CORE - Sistema central de gerenciamento de jogadores
 * 
 * Centraliza todas as operações de atualização de jogadores,
 * garantindo que nível, rank e atributos sejam sempre recalculados
 * automaticamente após qualquer alteração.
 */

const db = require("./database");
const LevelSystem = require("../systems/levelSystem");

class JogadorCore {
    
    /**
     * Adiciona valor a um campo do jogador (soma ao existente)
     * Após adicionar XP, verifica progressão de nível automaticamente.
     * Após adicionar atributo base, recalcula totais automaticamente.
     */
    static async adicionarValor(jogadorId, campo, quantidade) {
        return new Promise((resolve) => {
            db.run(
                `UPDATE jogadores SET ${campo} = ${campo} + ? WHERE id = ?`,
                [quantidade, jogadorId],
                async (err) => {
                    if (err) {
                        console.error(`Erro ao adicionar ${campo}:`, err.message);
                        return resolve(false);
                    }
                    
                    // Se for XP, verificar progressão de nível
                    if (campo === 'experiencia') {
                        await this.verificarEAtualizarNivel(jogadorId);
                    }
                    
                    // Se for atributo base OU buff, recalcular totais
                    if (['forca_base', 'resistencia_base', 'velocidade_base',
                         'sentidos_base', 'inteligencia_base', 'poder_magico_base',
                         'forca_buff', 'resistencia_buff', 'velocidade_buff',
                         'sentidos_buff', 'inteligencia_buff', 'poder_magico_buff'].includes(campo)) {
                        await this.recalcularTotais(jogadorId);
                    }
                    
                    resolve(true);
                }
            );
        });
    }
    
    /**
     * Atualiza um campo do jogador (substitui valor)
     */
    static async atualizarCampo(jogadorId, campo, valor) {
        return new Promise((resolve) => {
            db.run(
                `UPDATE jogadores SET ${campo} = ? WHERE id = ?`,
                [valor, jogadorId],
                async (err) => {
                    if (err) {
                        console.error(`Erro ao atualizar ${campo}:`, err.message);
                        return resolve(false);
                    }
                    
                    // Se for XP, verificar progressão de nível
                    if (campo === 'experiencia') {
                        await this.verificarEAtualizarNivel(jogadorId);
                    }
                    
                    // Se for atributo base OU buff, recalcular totais
                    if (['forca_base', 'resistencia_base', 'velocidade_base',
                         'sentidos_base', 'inteligencia_base', 'poder_magico_base',
                         'forca_buff', 'resistencia_buff', 'velocidade_buff',
                         'sentidos_buff', 'inteligencia_buff', 'poder_magico_buff'].includes(campo)) {
                        await this.recalcularTotais(jogadorId);
                    }
                    
                    resolve(true);
                }
            );
        });
    }
    
    /**
     * Verifica e atualiza nível do jogador baseado na XP atual
     * Usa LevelSystem que já recalcula totais após subir nível
     */
    static async verificarEAtualizarNivel(jogadorId) {
        const resultado = await LevelSystem.verificarProgressao(jogadorId);
        return resultado;
    }
    
    /**
     * Recalcula atributos totais do jogador (base + buffs)
     * E atualiza vida/mana máxima baseado nos atributos
     */
    static async recalcularTotais(jogadorId) {
        return new Promise((resolve) => {
            db.get("SELECT * FROM jogadores WHERE id = ?", [jogadorId], (err, jogador) => {
                if (err || !jogador) return resolve(false);

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
                        jogadorId
                    ],
                    (error) => {
                        if (error) {
                            console.error("Erro ao recalcular totais:", error.message);
                            resolve(false);
                        } else {
                            resolve(true);
                        }
                    }
                );
            });
        });
    }
    
    /**
     * Busca jogador por número de telefone
     */
    static buscarPorNumero(numero) {
        return new Promise((resolve) => {
            db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], (err, jogador) => {
                if (err) return resolve(null);
                resolve(jogador || null);
            });
        });
    }
    
    /**
     * Busca jogador por nome (exato)
     */
    static buscarPorNome(nome) {
        return new Promise((resolve) => {
            db.get("SELECT * FROM jogadores WHERE LOWER(nome) = LOWER(?)", [nome], (err, jogador) => {
                if (err) return resolve(null);
                resolve(jogador || null);
            });
        });
    }
    
    /**
     * Busca jogador por nome (LIKE)
     */
    static buscarPorNomeLike(nome) {
        return new Promise((resolve) => {
            db.get("SELECT * FROM jogadores WHERE LOWER(nome) LIKE LOWER(?)", [`%${nome}%`], (err, jogador) => {
                if (err) return resolve(null);
                resolve(jogador || null);
            });
        });
    }
}

module.exports = JogadorCore;