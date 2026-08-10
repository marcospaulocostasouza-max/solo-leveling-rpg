const MessageService = require("../core/messageService");

/**
 * COMANDO: !ficha
 * 
 * Envia o modelo de ficha para o jogador preencher.
 */

const templates = require("../utils/templatesMensagens");

module.exports = async (msg) => {
    const fichaTxt = templates.fichaModelo();
    await MessageService.send({ message: msg, text: fichaTxt });
};
