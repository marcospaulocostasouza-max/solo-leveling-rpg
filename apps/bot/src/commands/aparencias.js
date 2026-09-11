const database = require("../../../../packages/database");
const MessageService = require("../core/messageService");

function formatarLista(jogadores) {
    const entradas = jogadores.filter(j => String(j.aparencia || "").trim() && String(j.aparencia).trim() !== "?");
    if (!entradas.length) return ["*APARÊNCIAS DO RPG*\n\nNenhuma aparência registrada em fichas aprovadas."];
    const mensagens = [];
    let atual = `*APARÊNCIAS DO RPG*\n*Fichas aprovadas:* ${entradas.length}\n_Atualizada automaticamente após cada aprovação._\n`;
    for (const jogador of entradas) {
        const bloco = `\n*${jogador.nome}*\n${String(jogador.aparencia).trim()}\n`;
        if (atual.length + bloco.length > 3500) { mensagens.push(atual); atual = "*APARÊNCIAS DO RPG — continuação*\n"; }
        atual += bloco;
    }
    mensagens.push(atual);
    return mensagens;
}

module.exports = async function aparencias(msg) {
    try {
        const jogadores = await database.all("SELECT nome, aparencia FROM jogadores WHERE ficha_aprovada = 1 ORDER BY LOWER(nome), id");
        for (const text of formatarLista(jogadores)) await MessageService.send({ message: msg, text });
    } catch (error) {
        console.error("[APARENCIAS] Consulta falhou:", error.message);
        await MessageService.send({ message: msg, text: "Não consegui consultar as aparências agora. Tente novamente em instantes." });
    }
};
module.exports.formatarLista = formatarLista;
