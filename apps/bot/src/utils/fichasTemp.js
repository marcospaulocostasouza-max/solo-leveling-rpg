/**
 * ARMAZENAMENTO TEMPORÁRIO DE FICHAS
 * 
 * Guarda fichas em memória durante o processo de criação.
 * As fichas são limpas após confirmação ou recusa.
 */

const fichasTemp = {};

module.exports = {
    confirmar: async function(msg) {
        const numero = msg.author || msg.from;
        const ficha = fichasTemp[numero];
        
        if (!ficha) {
            return { erro: "Nenhuma ficha em andamento." };
        }
        
        // Salvar no banco como pendente
        const db = require("../core/database");
        db.run(
            "INSERT OR REPLACE INTO fichas_pendentes (numero, dados, status) VALUES (?, ?, 'aguardando')",
            [numero, JSON.stringify(ficha)]
        );
        
        const resultado = { sucesso: true, ficha };
        delete fichasTemp[numero];
        
        return resultado;
    }
};
