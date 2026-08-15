const fs = require("fs");
const path = require("path");
const { MessageMedia } = require("whatsapp-web.js");
const MessageService = require("../core/messageService");
const templates = require("../utils/templatesMensagens");

/**
 * Registra as boas-vindas automaticas do grupo de fichas.
 * Ao receber um novo membro, envia a imagem do Sistema com a mensagem inicial.
 */

const GROUP_FICHAS = "120363426763457951@g.us";
const IMAGEM_SISTEMA = path.resolve(__dirname, "../../imagens/sistema.png");

function obterGrupoId(notificacao) {
    return notificacao?.chatId
        || notificacao?.from
        || notificacao?.id?.remote
        || notificacao?.id?._serialized
        || "";
}

module.exports = function setupBoasVindas(client) {
    if (!client || typeof client.on !== "function") {
        throw new TypeError("[BOAS-VINDAS] Client do WhatsApp invalido.");
    }

    if (!fs.existsSync(IMAGEM_SISTEMA)) {
        console.error(`[BOAS-VINDAS] Imagem do Sistema nao encontrada: ${IMAGEM_SISTEMA}`);
    }

    client.on("group_join", async (notificacao) => {
        const grupoId = obterGrupoId(notificacao);
        if (grupoId !== GROUP_FICHAS) return;

        try {
            if (!fs.existsSync(IMAGEM_SISTEMA)) {
                const resultadoTexto = await MessageService.send({
                    chatId: GROUP_FICHAS,
                    text: templates.boasVindas()
                });
                if (!resultadoTexto.sucesso) throw new Error(resultadoTexto.erro);
                console.warn("[BOAS-VINDAS] Mensagem enviada sem imagem porque o arquivo nao foi encontrado.");
                return;
            }

            const media = MessageMedia.fromFilePath(IMAGEM_SISTEMA);
            const resultado = await MessageService.sendMedia({
                chatId: GROUP_FICHAS,
                media,
                opcoesAdicionais: { caption: templates.boasVindas() }
            });

            if (!resultado.sucesso) throw new Error(resultado.erro);
            console.log("[BOAS-VINDAS] Imagem e mensagem inicial enviadas no grupo de fichas.");
        } catch (erro) {
            console.error("[BOAS-VINDAS] Erro ao enviar boas-vindas:", erro.message);
        }
    });

    console.log(`[BOAS-VINDAS] Evento configurado para o grupo ${GROUP_FICHAS}`);
};

module.exports.GROUP_FICHAS = GROUP_FICHAS;
module.exports.IMAGEM_SISTEMA = IMAGEM_SISTEMA;
module.exports.obterGrupoId = obterGrupoId;
