/**
 * OLLAMA - COMPATIBILIDADE
 *
 * Este arquivo agora reexporta perguntarIA do ollamaService.js
 * para manter compatibilidade com os engines que ainda importam
 * de "./ollama" em vez de "./ollamaService".
 *
 * Isso elimina a duplicação de chamadas HTTP ao Ollama e
 * centraliza cache, métricas e keep-alive em um único serviço.
 */

const { ollamaService } = require("./ollamaService");

/**
 * Gera resposta de forma simples (compatibilidade com código existente)
 * Agora usa o ollamaService centralizado com cache, keep-alive e métricas.
 *
 * @param {string} prompt - Prompt para enviar
 * @returns {Promise<string>} Resposta do modelo
 */
async function perguntarIA(prompt) {
    try {
        const resultado = await ollamaService.gerarResposta(prompt);
        return resultado.texto;
    } catch (erro) {
        console.error('[Ollama] Erro em perguntarIA:', erro.message);
        return null;
    }
}

module.exports = { perguntarIA };