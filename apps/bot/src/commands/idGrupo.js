const MessageService = require("../core/messageService");

module.exports = async (msg) => {

    if(!msg.from.endsWith("@g.us")){
        await MessageService.send({ message: msg, text: "*═══ Esse comando só funciona dentro de grupos. ═══*" });
        return;
    }

    await MessageService.send({ message: msg, text: `*═══ ID DESTE GRUPO: ═══*\n> ${msg.from}` });

};