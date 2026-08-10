const MessageService = require("../core/messageService");

/**
 * EVENTO DE BOAS-VINDAS
 * 
 * Mensagem de boas-vindas exibida no grupo de fichas.
 * Mostra a imagem do sistema e informações iniciais.
 */

const GROUP_FICHAS = "120363427833722192@g.us";
const templates = require("../utils/templatesMensagens");

module.exports = async (msg) => {
    // Verificar se está no grupo de fichas
    const grupoId = msg.from;
    if (grupoId !== GROUP_FICHAS) {
        return;
    }
    
    // Verificar se é um evento de entrada de membro
    const isEntrada = msg.body && msg.body.includes("entrou no grupo");
    
    if (isEntrada || msg.type === "group_join") {
        const boasVindas = templates.boasVindas();
        
        try {
            await MessageService.send({ chatId: grupoId, text: boasVindas });
        } catch (e) {
            console.log("Erro ao enviar boas-vindas:", e);
        }
    }
};
