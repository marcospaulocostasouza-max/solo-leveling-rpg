"use strict";

// Message.downloadMedia() usa id._serialized; algumas mensagens chegam com $1.
// A mesma compatibilidade já é necessária nas respostas do MessageService.
async function downloadCreationImage(message) {
    if (!message?.hasMedia || typeof message.downloadMedia !== "function") {
        throw new Error("Envie uma imagem anexada, com o comando na legenda ou durante a etapa de imagem.");
    }
    if (message.id && !message.id._serialized && message.id.$1) {
        message.id._serialized = message.id.$1;
    }
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
        let media;
        try {
            media = await message.downloadMedia();
        } catch (error) {
            lastError = error;
        }
        if (media?.data) {
            if (!/^image\//i.test(media.mimetype || "")) {
                throw new Error("O anexo recebido não é uma imagem. Envie a foto novamente.");
            }
            return media;
        }
        // A biblioteca pode retornar undefined enquanto a mídia está FETCHING.
        if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 400));
    }
    console.error("[CREATION_IMAGE] Download indisponível:", lastError?.message || "WhatsApp retornou mídia vazia");
    throw new Error("Não consegui baixar a imagem do WhatsApp. Reenvie a foto; os dados da criação foram preservados.");
}

module.exports = { downloadCreationImage };
