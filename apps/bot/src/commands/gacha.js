"use strict";

const { MessageMedia } = require("whatsapp-web.js");
const database = require("../../../../packages/database");
const MessageService = require("../core/messageService");
const banners = require("../systems/gachaBannerService");
const engine = require("../systems/gachaEngine");

function normalizar(valor) { return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
function formatarResultado(resultado, indice) {
    const marcas = [resultado.grandePremio ? "ITEM SECRETO / GRANDE PRÊMIO" : null, resultado.pityForcado ? "PITY 100" : null, resultado.destaque ? `DESTAQUE ${resultado.destaque}` : null, resultado.garantidoRank ? `GARANTIA RANK ${resultado.rank}` : null].filter(Boolean);
    const conversao = resultado.duplicata ? `\n_   ↳ Já possuída; +${resultado.fragmentosInvocacaoRecebidos} Fragmentos de Invocação_` : "";
    return `_${String(indice + 1).padStart(2, "0")} •_ *${resultado.nome}* _x${resultado.quantidade}${resultado.raridade ? ` — ${resultado.raridade}` : ""}${marcas.length ? ` — ${marcas.join(" / ")}` : ""}_${conversao}`;
}
function localizarBanner(nome, disponiveis) {
    if (!nome) return disponiveis[0] || null;
    const busca = normalizar(nome);
    return disponiveis.find(item => normalizar(item.nome) === busca) || disponiveis.find(item => normalizar(item.nome).includes(busca)) || null;
}
async function enviarBanner(msg, banner) {
    const jogador = await database.playerByPhone(msg.author || msg.from);
    if (!jogador) throw new Error("Você precisa ter uma ficha aprovada.");
    await database.ensureGachaEngineSchema();
    const pity = await database.consultarPityGacha(jogador.id, banner.id);
    const pool = await banners.getPoolDoBanner(banner.id);
    const destaques = pool.filter(item => item.destaque_ordem != null).sort((a, b) => a.destaque_ordem - b.destaque_ordem);
    const gp = pool.find(item => Number(item.grande_premio) === 1);
    const texto = `_*「 ${banner.nome.toUpperCase()} 」*_\n_${banner.descricao}_\n\n_*DESTAQUES*_\n${destaques.map(item => `_• ${item.reward_type}${item.raridade ? ` — ${item.raridade}` : ""}_`).join("\n") || "_• Nenhum destaque configurado._"}\n\n_*ITEM SECRETO*_\n_${gp ? `• ${gp.reward_type}${gp.raridade ? ` — ${gp.raridade}` : ""}` : "• Não configurado"}_\n\n_• Grande Prêmio: ${pity}/100_\n_• 1 convergência: 100 Cristais_\n_• 10 convergências: 1.000 Cristais_`;
    const imagem = String(banner.imagem || "").match(/^data:(image\/[\w.+-]+);base64,([\s\S]+)$/i);
    if (imagem) return MessageService.sendMedia({ message: msg, media: new MessageMedia(imagem[1], imagem[2], `banner-${banner.id}`), opcoesAdicionais: { caption: texto } });
    return MessageService.send({ message: msg, text: texto });
}
module.exports = async function gachaCommand(msg) {
    const texto = String(msg.body || "").trim();
    try {
        const disponiveis = await banners.getBannersDisponiveis();
        if (/^!banners\b/i.test(texto)) {
            const linhas = disponiveis.map(item => `_• ${item.nome}_`);
            return MessageService.send({ message: msg, text: `_*「 BANNERS DISPONÍVEIS 」*_\n_— Convergências atualmente reconhecidas pelo Sistema._\n\n${linhas.length ? linhas.join("\n") : "_• Nenhum Banner disponível._"}\n\n_Use *!Banner nome do banner* para consultar._` });
        }
        if (/^!banner\b/i.test(texto)) {
            const nome = texto.replace(/^!banner\b/i, "").trim();
            if (!nome) throw new Error("Informe o nome: !Banner <nome do banner>.");
            const banner = localizarBanner(nome, disponiveis);
            if (!banner) throw new Error(`Banner “${nome}” não encontrado ou indisponível.`);
            return enviarBanner(msg, banner);
        }
        if (/^!convergir\b/i.test(texto)) {
            const argumento = texto.replace(/^!convergir\b/i, "").trim();
            if (argumento && argumento !== "10") throw new Error("Use !Convergir ou !Convergir 10.");
            const quantidade = argumento === "10" ? 10 : 1;
            const banner = localizarBanner("", disponiveis);
            if (!banner) throw new Error("Nenhum banner disponível no momento.");
            const jogador = await database.playerByPhone(msg.author || msg.from);
            if (!jogador) throw new Error("Você precisa ter uma ficha aprovada.");
            const resultado = await engine.realizarGiros(jogador.id, banner.id, quantidade);
            return MessageService.send({ message: msg, text: `_*「 CONVERGÊNCIA CONCLUÍDA 」*_\n_— ${resultado.banner.nome}_\n\n_• Custo: ${resultado.custo} Cristais_\n_• Saldo: ${resultado.saldoAtual} Cristais_\n_• Grande Prêmio: ${resultado.pityDepois}/100_\n\n_*RESULTADOS*_\n${resultado.resultados.map(formatarResultado).join("\n")}` });
        }
        throw new Error("Use !Banners, !Banner <nome>, !Convergir ou !Convergir 10.");
    } catch (erro) { return MessageService.send({ message: msg, text: `_*「 GACHA 」*_\n_[!] ${erro.message}_` }); }
};
module.exports.normalizar = normalizar;
module.exports.localizarBanner = localizarBanner;
