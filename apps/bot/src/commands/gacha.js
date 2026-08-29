"use strict";

const database = require("../../../../packages/database");
const MessageService = require("../core/messageService");
const banners = require("../systems/gachaBannerService");
const engine = require("../systems/gachaEngine");

function formatarResultado(resultado, indice) {
    const marcas = [resultado.grandePremio ? "ITEM ESPECIAL / GRANDE PREMIO" : null, resultado.pityForcado ? "PITY 100" : null, resultado.destaque ? `DESTAQUE ${resultado.destaque}` : null, resultado.garantidoRank ? `GARANTIA RANK ${resultado.rank}` : null].filter(Boolean);
    const conversao = resultado.duplicata ? `\n   -> Ja possuida; convertida em +${resultado.fragmentosInvocacaoRecebidos} Fragmentos de Invocacao` : "";
    return `${indice + 1}. ${resultado.nome} x${resultado.quantidade}${resultado.raridade ? ` [${resultado.raridade}]` : ""}${marcas.length ? ` - ${marcas.join(" / ")}` : ""}${conversao}`;
}

module.exports = async function gachaCommand(msg) {
    const texto = String(msg.body || "").trim();
    const argumento = texto.replace(/^!gacha\b/i, "").trim();
    try {
        if (!argumento) {
            const disponiveis = await banners.getBannersDisponiveis();
            const linhas = disponiveis.map(item => `#${item.id} - ${item.nome}`);
            return MessageService.send({ message: msg, text: `*GACHA - BANNERS DISPONIVEIS*\n\n${linhas.length ? linhas.join("\n") : "Nenhum banner disponivel."}\n\nDetalhes: !gacha <id>\n1 giro: !gacha girar <id>\n10 giros: !gacha girar10 <id>` });
        }
        if (/^hist[oó]rico$/i.test(argumento)) {
            const jogador = await database.playerByPhone(msg.author || msg.from);
            if (!jogador) throw new Error("Voce precisa ter uma ficha aprovada.");
            const historico = await database.getUltimosGiros(jogador.id, 10);
            const linhas = historico.map(item => `${item.grande_premio ? "[GP] " : ""}${item.nome} x${item.quantidade}${item.duplicata ? ` -> +${item.fragmentos_invocacao_recebidos} Fragmentos` : ""} (${item.banner_nome || `Banner #${item.banner_id}`})`);
            return MessageService.send({ message: msg, text: `*ULTIMOS GIROS*\n\n${linhas.length ? linhas.join("\n") : "Nenhum giro registrado."}` });
        }
        const giro = argumento.match(/^girar(10)?\s+(\d+)$/i);
        if (giro) {
            const jogador = await database.playerByPhone(msg.author || msg.from);
            if (!jogador) throw new Error("Voce precisa ter uma ficha aprovada.");
            const resultado = await engine.realizarGiros(jogador.id, Number(giro[2]), giro[1] ? 10 : 1);
            return MessageService.send({ message: msg, text: `*GACHA CONCLUIDO - ${resultado.banner.nome}*\nCusto: ${resultado.custo} Cristais\nSaldo: ${resultado.saldoAtual} Cristais\nGrande Premio: ${resultado.pityDepois}/100\n\n${resultado.resultados.map(formatarResultado).join("\n")}` });
        }
        if (/^\d+$/.test(argumento)) {
            const banner = await banners.getBannerPorId(Number(argumento));
            if (!banner || !banners.estaNoPeriodo(banner)) throw new Error("Banner indisponivel no momento.");
            const jogador = await database.playerByPhone(msg.author || msg.from);
            if (!jogador) throw new Error("Voce precisa ter uma ficha aprovada.");
            await database.ensureGachaEngineSchema();
            const pity = await database.consultarPityGacha(jogador.id, banner.id);
            const pool = await banners.getPoolDoBanner(banner.id);
            const destaques = pool.filter(item => item.destaque_ordem != null).sort((a, b) => a.destaque_ordem - b.destaque_ordem);
            const gp = pool.find(item => Number(item.grande_premio) === 1);
            return MessageService.send({ message: msg, text: `*${banner.nome}*\n${banner.descricao}\n\nDestaques: ${destaques.map(item => `#${item.destaque_ordem} ${item.reward_type} ${item.raridade || ""}`.trim()).join(", ")}\nGrande Premio: ${gp ? `${gp.reward_type} ${gp.raridade || ""}`.trim() : "Nao configurado"}\nPity atual: ${pity}/100\n\n1 giro: 100 Cristais\n10 giros: 1.000 Cristais (1 recompensa exatamente do seu Rank)` });
        }
        throw new Error("Uso: !gacha | !gacha <id> | !gacha girar <id> | !gacha girar10 <id>");
    } catch (erro) {
        return MessageService.send({ message: msg, text: `*[GACHA]* ${erro.message}` });
    }
};
