const MessageService = require("../core/messageService");

const db = require("../core/database");

module.exports = async (msg) => {
    try {
        const textoCompleto = msg.body.trim();
        const corpo = textoCompleto.toLowerCase();
        
        // Extrair nome e motivo
        const depoisPrefixo = corpo.startsWith("!recusar ficha") 
            ? textoCompleto.substring(corpo.indexOf("ficha") + 6).trim()
            : textoCompleto.substring(corpo.indexOf("recusar") + 8).trim();
        
        if (!depoisPrefixo) {
            return MessageService.send({ message: msg, text: `
*═ USO DO COMANDO*
──────────────────────────
*!recusar ficha <nome> <motivo>*

Exemplo:
> !recusar ficha Jim Mori História fraca
            ` });
        }
        
        const palavras = depoisPrefixo.split(" ");
        const nomeJogador = palavras[0];
        const motivo = palavras.slice(1).join(" ") || "Motivo não especificado";
        
        // Buscar ficha pendente
        const ficha = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM fichas_pendentes WHERE status = 'aguardando'", [], (err, rows) => {
                if (err) return reject(err);
                
                const encontrada = rows.find(f => {
                    try {
                        const dados = JSON.parse(f.dados || "{}");
                        return dados.nome && dados.nome.toLowerCase().includes(nomeJogador.toLowerCase());
                    } catch { return false; }
                });
                
                resolve(encontrada || null);
            });
        });
        
        if (!ficha) {
            return MessageService.send({ message: msg, text: `
*═ FICHA NÃO ENCONTRADA*
──────────────────────────
_Nenhuma ficha pendente encontrada para "${nomeJogador}"._
            ` });
        }
        
        const dados = JSON.parse(ficha.dados || "{}");
        const nomeReal = dados.nome || nomeJogador;
        
        // Atualizar status da ficha
        await new Promise((resolve, reject) => {
            db.run(
                "UPDATE fichas_pendentes SET status = 'recusado', motivo = ? WHERE id = ?",
                [motivo, ficha.id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        // Remover jogador se existir
        await new Promise((resolve) => {
            db.run("DELETE FROM jogadores WHERE nome = ?", [nomeReal], () => resolve());
        });
        
        await MessageService.send({ message: msg, text: `
*═ FICHA RECUSADA*
──────────────────────────
Jogador: *${nomeReal}*
Motivo: _${motivo}_
──────────────────────────
_A ficha foi removida do sistema._
        ` });
        
    } catch (error) {
        console.error("Erro ao recusar ficha:", error);
        return MessageService.send({ message: msg, text: `
*═ ERRO AO RECUSAR FICHA*
──────────────────────────
_Ocorreu um erro ao processar a recusa._
_Tente novamente._
        ` });
    }
};