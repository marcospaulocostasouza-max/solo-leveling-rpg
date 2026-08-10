const MessageService = require("../core/messageService");

const fichasAvaliacao = require("../utils/fichasAvaliacao");
const db = require("../core/database");
const templates = require("../utils/templatesMensagens");

module.exports = async (msg) => {
    const numero = msg.author || msg.from;
    
    db.get("SELECT * FROM fichas_pendentes WHERE numero = ? AND status = 'avaliacao'", [numero], async (err, ficha) => {
        if (!ficha) return MessageService.send({ message: msg, text: templates.aviso("Você não tem uma ficha para avaliar.") });
        
        const resultado = await fichasAvaliacao.avaliar(ficha);
        
        const mensagem = templates.avaliacao(resultado.status, resultado.notas);
        
        await MessageService.send({ message: msg, text: mensagem });
    });
};
