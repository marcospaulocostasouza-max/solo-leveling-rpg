const MessageService = require("../core/messageService");
const db = require("../core/database");
const LevelSystem = require("../systems/levelSystem");

function xpTotalAteNivel(nivel, xpAtual) {
    let total = Number(xpAtual || 0);
    for (let atual = 1; atual < Number(nivel || 1); atual++) total += LevelSystem.getXpNecessario(atual);
    return total;
}

module.exports = async (msg) => {
    try {
        const jogador = await new Promise((resolve, reject) => db.get("SELECT nome, nivel, experiencia, pontos_atributo, rank FROM jogadores WHERE numero = ?", [msg.author || msg.from], (erro, linha) => erro ? reject(erro) : resolve(linha)));
        if (!jogador) return MessageService.send({ message: msg, text: "[!] Não foi possível encontrar sua ficha." });
        const nivel = Number(jogador.nivel || 1);
        const atual = Number(jogador.experiencia || 0);
        const necessario = LevelSystem.getXpNecessario(nivel);
        const falta = Math.max(0, necessario - atual);
        const progresso = necessario > 0 ? Math.min(100, Math.floor((atual / necessario) * 100)) : 100;
        return MessageService.send({ message: msg, text: ["════════════════════════════════════", "*NÍVEL E PROGRESSÃO*", "════════════════════════════════════", "", `› Jogador: *${jogador.nome}*`, `› Nível: *${nivel}* | Rank: *${jogador.rank || "E"}*`, `› XP atual: *${atual.toLocaleString("pt-BR")} / ${necessario.toLocaleString("pt-BR")}*`, `› Falta para subir: *${falta.toLocaleString("pt-BR")} XP*`, `› Progresso: *${progresso}%*`, `› XP total: *${xpTotalAteNivel(nivel, atual).toLocaleString("pt-BR")}*`, `› Pontos para distribuir: *${jogador.pontos_atributo || 0}*`, "", "_Ao subir de nível, o sistema aplica os pontos e atualiza o rank quando os requisitos forem atingidos._"].join("\n") });
    } catch (erro) {
        console.error("Erro ao exibir nível:", erro);
        return MessageService.send({ message: msg, text: "[!] Não foi possível consultar seu nível agora." });
    }
};
