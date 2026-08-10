const MessageService = require("../core/messageService");

const fs = require("fs");
const { MessageMedia } = require("whatsapp-web.js");

const caminhoPDF = "C:/Users/Marcos/Downloads/Solo_Leveling_Base_Perguntas_IA.pdf";

module.exports = async (msg) => {
    try {
        if (!fs.existsSync(caminhoPDF)) {
            return MessageService.send({ message: msg, text: "*✖ Arquivo PDF de arquitetura não encontrado.*" });
        }

        const buffer = fs.readFileSync(caminhoPDF);
        const media = new MessageMedia(
            "application/pdf",
            buffer.toString("base64"),
            "Solo_Leveling_Base_Perguntas_IA.pdf"
        );

        await MessageService.sendMedia({ message: msg, media, opcoesAdicionais: { caption: "Base de perguntas e respostas do sistema Solo Leveling RPG" } });
    } catch (error) {
        console.error("Erro ao enviar PDF:", error);
        return MessageService.send({ message: msg, text: "*✖ Erro ao enviar o arquivo PDF.*" });
    }
};