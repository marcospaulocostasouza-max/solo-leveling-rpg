const MessageService = require("../core/messageService");

module.exports = async (msg) => {

    const client = msg.client;
    const chats = await client.getChats();

    let grupos = "*═══ GRUPOS ENCONTRADOS: ═══*\n\n";

    chats.forEach(chat => {
        if(chat.isGroup){
            grupos += `
────────────────────────══
*═══ Nome: ═══* ${chat.name}
> ═ ID: ${chat.id._serialized}
`;
        }
    });

    await MessageService.send({ message: msg, text: grupos });

};