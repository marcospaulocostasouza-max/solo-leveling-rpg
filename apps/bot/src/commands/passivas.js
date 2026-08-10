const db = require("../core/database");
const MessageService = require("../core/messageService");

module.exports = async (msg) => {
    const comando = msg.body.trim().toLowerCase();
    if (comando === "!passivas") {
        return MessageService.send({ message: msg, text: "*════════════════════════════════════*\n*PASSIVAS*\n*════════════════════════════════════*\n\nPassivas são capacidades permanentes conquistadas na jornada de um Caçador. Elas não são compradas em uma lista comum nem exigem ativação manual: representam marcas de eventos, dungeons, feitos narrativos e escolhas que deixaram efeito duradouro.\n\nCada passiva registrada informa sua descrição e buffs. Elas são distribuídas como recompensas aprovadas em eventos, dungeons e cenas relevantes.\n\n› Para consultar as suas: *!minhas passivas*" });
    }
    const numero = msg.author || msg.from;
    const jogador = await new Promise(resolve => db.get("SELECT nome, passivas_ativas FROM jogadores WHERE numero = ?", [numero], (erro, linha) => resolve(erro ? null : linha)));
    if (!jogador) return MessageService.send({ message: msg, text: "[!] Você precisa ter uma ficha aprovada." });
    let passivas = [];
    try { passivas = JSON.parse(jogador.passivas_ativas || "[]") || []; } catch { passivas = []; }
    if (!passivas.length) return MessageService.send({ message: msg, text: "*════════════════════════════════════*\n*MINHAS PASSIVAS*\n*════════════════════════════════════*\n\n› Nenhuma passiva registrada.\n_Eles podem ser obtidas em eventos, dungeons e recompensas narrativas._" });
    let texto = `*════════════════════════════════════*\n*MINHAS PASSIVAS — ${jogador.nome}*\n*════════════════════════════════════*\n`;
    for (const passiva of passivas) {
        texto += `\n*${passiva.nome || "Passiva"}*\n› ${passiva.descricao || "Sem descrição registrada."}\n`;
        for (const buff of passiva.buffs || []) texto += `› Buff: ${buff.tipo || "efeito"} +${buff.valor || 0}\n`;
    }
    return MessageService.send({ message: msg, text: texto });
};
