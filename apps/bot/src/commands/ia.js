const MessageService = require("../core/messageService");

/**
 * COMANDO: !ia
 *
 * Comando de teste para integração com IA local (Ollama/Qwen).
 *
 * Uso:
 * !ia Olá
 *
 * O texto após "!ia" é enviado para a função perguntarIA() do Ollama,
 * e a resposta do Qwen é retornada no WhatsApp.
 */

const { perguntarIA } = require("../ia/ollama");

module.exports = async (msg) => {
    const texto = msg.body.trim();

    // Extrair o prompt (tudo após "!ia")
    const prompt = texto.replace(/^!ia\s*/i, "").trim();

    if (!prompt) {
        return MessageService.send({ message: msg, text: 
            "*🤖 COMANDO IA*\n\n" +
            "Digite o texto que deseja perguntar à IA.\n\n" +
            "_Exemplo: !ia Olá_"
         });
    }

    try {
        const resposta = await perguntarIA(prompt);

        if (!resposta) {
            return MessageService.send({ message: msg, text: "*⚠ A IA não retornou nenhuma resposta.*" });
        }

        await MessageService.send({ message: msg, text: resposta });
    } catch (error) {
        console.error("[IA] Erro ao consultar Ollama:", error.message);
        await MessageService.send({ message: msg, text: 
            "*⚠ ERRO NA CONEXÃO COM A IA*\n\n" +
            "O serviço do Ollama parece estar indisponível.\n" +
            "> Verifique se o Ollama está rodando em *http://localhost:11434*"
         });
    }
};