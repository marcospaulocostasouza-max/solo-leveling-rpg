const MessageService = require("../core/messageService");
const Paimon = require("../systems/systemAssistantService");
const adminCore = require("../core/adminCore");

const CABECALHO_PAIMON = "_*「 PAIMON — GUIA DO SISTEMA 」*_";

function formatarPaimon(texto) {
    const fala = String(texto || "").trim().replace(/^_([\s\S]*)_$/, "$1");
    return `${CABECALHO_PAIMON}\n\n_${fala}_`;
}

async function responder(msg, pergunta) {
    const numero = msg.author || msg.from;
    try {
        if (Paimon.deveEncerrar(pergunta)) {
            await Paimon.definirSessao(numero, false);
            return MessageService.send({ message: msg, text: formatarPaimon("Tudo bem! Quando precisar, é só chamar com *!paimon*. ✨") });
        }
        const resposta = await Paimon.responderPergunta(numero, pergunta, await adminCore.isAdmin(numero));
        if (!resposta) throw new Error("Resposta vazia do modelo.");
        return MessageService.send({ message: msg, text: formatarPaimon(resposta) });
    } catch (error) {
        console.error("[PAIMON]", error.message);
        return MessageService.send({ message: msg, text: formatarPaimon("Tive um probleminha para consultar o Sistema agora. Tente novamente em alguns instantes.") });
    }
}

module.exports = async msg => {
    const pergunta = String(msg.body || "").replace(/^!paimon\b/i, "").trim();
    if (!pergunta) return MessageService.send({ message: msg, text: formatarPaimon("Envie sempre o comando e a mensagem logo abaixo:\n\n`!paimon`\n`Sua dúvida ou continuação da conversa`\n\nEu vou lembrar do histórico mesmo quando você me chamar novamente mais tarde.") });
    return responder(msg, pergunta);
};

module.exports.formatarPaimon = formatarPaimon;
