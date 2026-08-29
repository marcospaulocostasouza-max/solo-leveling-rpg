const MessageService = require("../core/messageService");
const Paimon = require("../systems/systemAssistantService");
const adminCore = require("../core/adminCore");

async function responder(msg, pergunta) {
    const numero = msg.author || msg.from;
    try {
        if (Paimon.deveEncerrar(pergunta)) {
            await Paimon.definirSessao(numero, false);
            return MessageService.send({ message: msg, text: "*PAIMON*\n\nTudo bem! Quando precisar, é só chamar com *!paimon*. ✨" });
        }
        const resposta = await Paimon.responderPergunta(numero, pergunta, await adminCore.isAdmin(numero));
        if (!resposta) throw new Error("Resposta vazia do modelo.");
        return MessageService.send({ message: msg, text: `*PAIMON*\n\n${resposta}` });
    } catch (error) {
        console.error("[PAIMON]", error.message);
        return MessageService.send({ message: msg, text: "*PAIMON*\n\nTive um probleminha para consultar o Sistema agora. Tente novamente em alguns instantes." });
    }
}

module.exports = async msg => {
    const pergunta = String(msg.body || "").replace(/^!paimon\b/i, "").trim();
    if (!pergunta) return MessageService.send({ message: msg, text: "*PAIMON — GUIA DO SISTEMA* ✨\n\nEnvie sempre o comando e a mensagem logo abaixo:\n\n`!paimon`\n`Sua dúvida ou continuação da conversa`\n\nEu vou lembrar do histórico mesmo quando você me chamar novamente mais tarde." });
    return responder(msg, pergunta);
};
