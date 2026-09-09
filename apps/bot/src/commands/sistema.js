const MessageService = require("../core/messageService");
const Paimon = require("../systems/systemAssistantService");
const adminCore = require("../core/adminCore");

function formatarPaimon(texto) {
    const fala = String(texto || "").trim().replace(/^_([\s\S]*)_$/, "$1");
    const linhas = fala.split(/\n+/).map(linha => linha.trim()).filter(Boolean).map(linha => /^[•▪◦\-]/.test(linha) ? linha : `> ${linha}`);
    return [
        "*═══ PAIMON — GUIA DO SISTEMA ═══*",
        "",
        "*─── Orientação ───*",
        ...linhas,
        "",
        "_Sistema Online • Paimon_"
    ].join("\n");
}

function pedeDadosDeOutroJogador(pergunta) {
    const texto = String(pergunta || "");
    return /\b(?:n[ií]vel|rank|ficha|perfil|classe|saldo|won|cristais|invent[aá]rio|t[eé]cnicas?|passivas?|t[ií]tulos?)\b[\s\S]{0,80}\b(?:do|da|de)\s+(?:player|jogador)\s+(?!meu\b|minha\b|eu\b)/i.test(texto)
        || /\b(?:ficha|perfil|invent[aá]rio|saldo|n[ií]vel|rank|t[eé]cnicas?)\s+(?:do|da)\s+(?!sistema\b|rpg\b|meu\b|minha\b)[\p{L}\p{N}_-]{2,}/iu.test(texto);
}

async function responder(msg, pergunta) {
    const numero = msg.author || msg.from;
    try {
        if (pedeDadosDeOutroJogador(pergunta)) {
            return MessageService.send({ message: msg, text: formatarPaimon("Não posso consultar ou revelar dados de outro jogador. Para ver seus próprios dados, pergunte sobre sua ficha; consultas de terceiros são exclusivas da ADM pelo *.#Cardinal*.") });
        }
        if (Paimon.deveEncerrar(pergunta)) {
            await Paimon.definirSessao(numero, false);
            return MessageService.send({ message: msg, text: formatarPaimon("Tudo bem! Quando precisar, é só chamar com *!paimon*. ✨") });
        }
        const resposta = await Paimon.responderPergunta(numero, pergunta, await adminCore.isAdmin(numero));
        if (!resposta) throw new Error("Resposta vazia do modelo.");
        return MessageService.send({ message: msg, text: formatarPaimon(resposta) });
    } catch (error) {
        console.error("[PAIMON]", error.message);
        return MessageService.send({ message: msg, text: formatarPaimon("Não consegui consultar essa informação agora. Sua ficha ou o serviço de IA pode estar indisponível; tente novamente em alguns instantes. Se a dúvida for sobre um comando, envie o nome dele junto da pergunta.") });
    }
}

module.exports = async msg => {
    const pergunta = String(msg.body || "").replace(/^!paimon\b/i, "").trim();
    if (!pergunta) return MessageService.send({ message: msg, text: formatarPaimon("Envie sempre o comando e a mensagem logo abaixo:\n\n`!paimon`\n`Sua dúvida ou continuação da conversa`\n\nEu vou lembrar do histórico mesmo quando você me chamar novamente mais tarde.") });
    return responder(msg, pergunta);
};

module.exports.formatarPaimon = formatarPaimon;
module.exports.pedeDadosDeOutroJogador = pedeDadosDeOutroJogador;
