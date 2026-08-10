/**
 * SISTEMA DE DADOS D6
 * Sistema universal de dados baseado em D6 (1 a 6).
 * Reutilizável em eventos, minigames, missões, exploração, etc.
 */

class DiceSystem {
    /**
     * Rola um dado D6
     * @returns {number} 1-6
     */
    static rolarD6() {
        return Math.floor(Math.random() * 6) + 1;
    }

    /**
     * Rola múltiplos D6
     * @param {number} quantidade 
     * @returns {number[]}
     */
    static rolarD6Multiplo(quantidade = 1) {
        const resultados = [];
        for (let i = 0; i < quantidade; i++) {
            resultados.push(this.rolarD6());
        }
        return resultados;
    }

    /**
     * Rola D6 com modificador
     * @param {number} modificador 
     * @returns {number}
     */
    static rolarComModificador(modificador = 0) {
        return Math.max(1, Math.min(6, this.rolarD6() + modificador));
    }

    /**
     * Interpreta o resultado do D6
     * @param {number} valor 
     * @returns {string}
     */
    static interpretarResultado(valor) {
        const interpretacoes = {
            1: "Falha critica",
            2: "Falha",
            3: "Resultado abaixo da media",
            4: "Sucesso simples",
            5: "Grande sucesso",
            6: "Sucesso critico"
        };
        return interpretacoes[valor] || "Resultado desconhecido";
    }

    /**
     * Rola com chance percentual
     * @param {number} chance - 0-100
     * @returns {boolean}
     */
    static chancePercentual(chance) {
        return Math.random() * 100 < chance;
    }

    /**
     * Sorteia um item de uma lista com pesos
     * @param {Array} itens - Array de {item, peso}
     * @returns {*}
     */
    static sortearComPeso(itens) {
        const totalPeso = itens.reduce((acc, i) => acc + i.peso, 0);
        let sorteio = Math.random() * totalPeso;
        for (const item of itens) {
            sorteio -= item.peso;
            if (sorteio <= 0) return item.item;
        }
        return itens[itens.length - 1].item;
    }

    /**
     * Roda um dado para resultado de ação
     * @param {number} dificuldade - 1-6 (quanto maior, mais difícil)
     * @param {number} bonus - bônus do jogador
     * @returns {{resultado: number, interpretacao: string, sucesso: boolean}}
     */
    static testeDeHabilidade(dificuldade = 3, bonus = 0) {
        const resultado = this.rolarComModificador(bonus);
        return {
            resultado,
            interpretacao: this.interpretarResultado(resultado),
            sucesso: resultado >= dificuldade
        };
    }
}

module.exports = DiceSystem;