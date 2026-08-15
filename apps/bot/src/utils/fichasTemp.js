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
        await new Promise((resolve, reject) => db.run(
            `INSERT INTO fichas_pendentes (numero, dados, status, data_envio, aprovado_por, motivo)
             VALUES (?, ?, 'aguardando', NULL, '', '')
             ON CONFLICT(numero) DO UPDATE SET
                dados = excluded.dados,
                status = 'aguardando',
                data_envio = NULL,
                aprovado_por = '',
                motivo = ''`,
            [numero, JSON.stringify(ficha)],
            err => err ? reject(err) : resolve()
        ));
        
        const resultado = { sucesso: true, ficha };
        delete fichasTemp[numero];
        
        return resultado;
    }
};
