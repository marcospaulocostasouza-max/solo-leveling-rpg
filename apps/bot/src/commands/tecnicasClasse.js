const MessageService = require("../core/messageService");

const db = require("../core/database");

module.exports = async (msg, nomeClasse) => {
    const nomeComando = msg.body.toLowerCase().trim();
    
    // Buscar técnicas da classe no banco de dados
    db.all(
        `SELECT * FROM tecnicas WHERE LOWER(classe) = ? ORDER BY nivel_desbloqueio ASC, nome ASC`,
        [nomeClasse.toLowerCase()],
        async (err, tecnicas) => {
            if (err) {
                console.log("Erro ao buscar tecnicas:", err);
                return MessageService.send({ message: msg, text: "*✖ Erro interno ao buscar tecnicas.*" });
            }
            
            if (!tecnicas || tecnicas.length === 0) {
                return MessageService.send({ message: msg, text: `*✖ Nenhuma tecnica encontrada para a classe ${nomeClasse}.*` });
            }
            
            let mensagem = `
*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*
*TÉCNICAS: ${nomeClasse.toUpperCase()}*
*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*

`;
            
            tecnicas.forEach((tecnica, index) => {
                const tipo = tecnica.passiva ? "Passiva" : tecnica.tipo || "Ativa";
                mensagem += `*${index + 1}. ${tecnica.nome}*\n`;
                mensagem += `> *Tipo:* ${tipo}\n`;
                mensagem += `> *Custo:* ${tecnica.custo_mana || 0} MP\n`;
                mensagem += `> *Cooldown:* ${tecnica.cooldown || 0} turno(s)\n`;
                mensagem += `> *Nível:* ${tecnica.nivel_desbloqueio || 1}\n`;
                mensagem += `> *Descrição:* ${(tecnica.descricao || "Sem descrição.").substring(0, 100)}${(tecnica.descricao || "").length > 100 ? "..." : ""}\n\n`;
            });
            
            mensagem += `
────────────────────────══
_Sistema Online_
`;
            
            await MessageService.send({ message: msg, text: mensagem });
        }
    );
};