const MessageService = require("../core/messageService");

/**
 * COMANDO: !ver fila
 * 
 * Exibe a lista de todas as fichas pendentes na fila de aprovação.
 * Disponível apenas no grupo de aprovação.
 */

const db = require("../core/database");

module.exports = async (msg) => {
    const numero = msg.author || msg.from;
    
    // Buscar todas as fichas pendentes
    const fichas = await new Promise((resolve, reject) => db.all(
        "SELECT * FROM fichas_pendentes WHERE status IN ('aguardando', 'avaliacao', 'pendente') ORDER BY data_envio ASC", [],
        (err, rows) => err ? reject(err) : resolve(rows || [])
    )).catch(err => {
        console.error("[FILA] Erro ao buscar fila:", err);
        return null;
    });
    if (!fichas) return MessageService.send({ message: msg, text: "*✖ Erro ao buscar fila de aprovação.*" });
        
        if (!fichas || fichas.length === 0) {
            return MessageService.send({ message: msg, text: "*✓ FILA VAZIA*\n\n_Não há fichas pendentes para aprovação no momento._" });
        }
        
        // Construir mensagem da fila
        let mensagem = `*✦ FILA DE APROVAÇÃO DE FICHAS ✦*\n\n`;
        mensagem += `_Total de fichas pendentes: ${fichas.length}_\n\n`;
        
        fichas.forEach((ficha, index) => {
            const dados = JSON.parse(ficha.dados || "{}");
            const nome = dados.nome || "Nome não encontrado";
            const classe = dados.classe || "Classe não encontrada";
            const dataEnvio = ficha.data_envio || "Data não registrada";
            
            mensagem += `*${index + 1}. ${nome}*\n`;
            mensagem += `> Classe: ${classe}\n`;
            mensagem += `> Enviado em: ${dataEnvio}\n`;
            mensagem += `> Use: !avaliar ficha ${nome}\n\n`;
        });
        
        mensagem += `────────────────────────══\n`;
        mensagem += `_Use !avaliar ficha [nome] para ver a ficha completa_\n`;
        mensagem += `_Use !aprovar ficha [nome] [habilidade] para aprovar_\n`;
        mensagem += `_Use !recusar ficha [nome] [motivo] para recusar_`;
        
        return MessageService.send({ message: msg, text: mensagem });
};
