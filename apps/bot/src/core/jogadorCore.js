/**
 * JOGADOR CORE - Sistema central de gerenciamento de jogadores
 * 
 * Centraliza todas as operações de atualização de jogadores,
 * garantindo que nível, rank e atributos sejam sempre recalculados
 * automaticamente após qualquer alteração.
 */

const db = require("./database");
const LevelSystem = require("../systems/levelSystem");
const AtributoSystem = require("../systems/atributoSystem");

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
        return AtributoSystem.recalcularAtributos(jogadorId);
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
     * Busca jogador pela chave interna. Use este método quando a origem é uma
     * tabela relacional (inventário, participação em dungeon, prêmios etc.).
     */
    static buscarPorId(jogadorId) {
        return new Promise((resolve) => {
            db.get("SELECT * FROM jogadores WHERE id = ?", [jogadorId], (err, jogador) => {
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
