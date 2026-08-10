/**
 * MESSAGE SERVICE - Camada Única de Envio de Mensagens
 * 
 * Responsável exclusivamente pelo envio de mensagens para o WhatsApp.
 * Nenhum outro arquivo deve chamar diretamente:
 * - client.sendMessage()
 * - chat.sendMessage()
 * - message.reply()
 * 
 * Fluxo automático:
 * 1. Se existir uma Message original → usa message.reply(texto)
 * 2. Caso NÃO exista Message original → usa client.sendMessage(chatId, texto)
 * 
 * Benefícios:
 * - Todo o projeto usa apenas um sistema de envio
 * - Futuras alterações (menções, emojis, anexos, botões, reações)
 *   podem ser implementadas apenas aqui
 */

// Referência ao client do WhatsApp (registrado após inicialização)
let _client = null;

// O projeto usa caracteres de texto e divisores próprios como padrão visual.
// A limpeza na camada única de envio impede que módulos legados enviem emojis.
function removerEmojis(texto) {
    return String(texto ?? "").replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]/gu, "");
}

/**
 * Registra o client do WhatsApp no serviço.
 * Deve ser chamado após a inicialização do client.
 * 
 * @param {Object} client - Instância do client whatsapp-web.js
 */
function registrarClient(client) {
    _client = client;
}

/**
 * Obtém o client do WhatsApp.
 * 
 * @returns {Object} Instância do client whatsapp-web.js
 */
function getClient() {
    if (!_client) {
        throw new Error("[MessageService] Client não registrado. Chame registrarClient() primeiro.");
    }
    return _client;
}

/**
 * Envia uma mensagem para o WhatsApp.
 * 
 * Decisão automática:
 * - Se `message` existir → usa message.reply(texto)
 * - Se NÃO existir `message` → usa client.sendMessage(chatId, texto)
 * 
 * @param {Object} opcoes - Opções de envio
 * @param {Object} [opcoes.message] - Objeto de mensagem original do WhatsApp (para reply)
 * @param {string} [opcoes.chatId] - ID do chat/grupo/número para sendMessage
 * @param {string} opcoes.text - Texto da mensagem a ser enviada
 * @param {Object} [opcoes.opcoesAdicionais] - Opções adicionais (caption, etc.)
 * @returns {Promise<Object>} Resultado do envio
 */
async function send({ message, chatId, text, opcoesAdicionais = {} }) {
    try {
        const textoLimpo = removerEmojis(text);
        // Se existir uma Message original, usar reply
        if (message) {
            // Workaround: WhatsApp Web (atualização de jul/2026) renomeou a 
            // propriedade interna de _serialized para $1 em mensagens com 
            // participant @lid, quebrando o reply() nativo da lib (issue 
            // conhecida, PR wwebjs/whatsapp-web.js#201832 ainda não publicado 
            // em stable). Corrigimos manualmente antes de citar.
            if (!message.id._serialized && message.id['$1']) {
                message.id._serialized = message.id['$1'];
            }
            const resultado = await message.reply(textoLimpo, null, { ignoreQuoteErrors: false, ...opcoesAdicionais });
            return { sucesso: true, metodo: 'reply', resultado };
        }

        // Caso contrário, usar sendMessage
        if (!chatId) {
            throw new Error("[MessageService] Nenhum message ou chatId fornecido para envio.");
        }

        const client = getClient();
        const resultado = await client.sendMessage(chatId, textoLimpo, opcoesAdicionais);
        return { sucesso: true, metodo: 'sendMessage', resultado };
    } catch (erro) {
        console.error("[MessageService] Erro ao enviar mensagem:", erro.message);
        return { sucesso: false, metodo: null, erro: erro.message };
    }
}

/**
 * Envia uma mensagem de mídia (imagem, PDF, etc.) para o WhatsApp.
 * 
 * @param {Object} opcoes - Opções de envio
 * @param {Object} [opcoes.message] - Objeto de mensagem original do WhatsApp (para reply)
 * @param {string} [opcoes.chatId] - ID do chat/grupo/número para sendMessage
 * @param {Object} opcoes.media - Objeto MessageMedia do whatsapp-web.js
 * @param {Object} [opcoes.opcoesAdicionais] - Opções adicionais (caption, etc.)
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendMedia({ message, chatId, media, opcoesAdicionais = {} }) {
    try {
        // Se existir uma Message original, usar reply
        if (message) {
            const resultado = await message.reply(media, null, opcoesAdicionais);
            return { sucesso: true, metodo: 'reply', resultado };
        }

        // Caso contrário, usar sendMessage
        if (!chatId) {
            throw new Error("[MessageService] Nenhum message ou chatId fornecido para envio de mídia.");
        }

        const client = getClient();
        const resultado = await client.sendMessage(chatId, media, opcoesAdicionais);
        return { sucesso: true, metodo: 'sendMessage', resultado };
    } catch (erro) {
        console.error("[MessageService] Erro ao enviar mídia:", erro.message);
        return { sucesso: false, metodo: null, erro: erro.message };
    }
}

// =====================================
// EXPORTAÇÕES
// =====================================

module.exports = {
    send,
    sendMedia,
    removerEmojis,
    registrarClient,
    getClient
};
