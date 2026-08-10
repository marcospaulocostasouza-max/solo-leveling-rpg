const MessageService = require("../core/messageService");

module.exports = async (msg) => {

    try {

        console.log("TESTE ENVIO DIRETO");

        const idGrupo = msg.from;

        await MessageService.send({ message: msg, text: "*═══ Teste de envio direto funcionou! ═══*" });

        console.log("Mensagem enviada para:", idGrupo);

    } catch (erro) {
        console.log("ERRO ENVIO DIRETO:", erro);
    }

};
