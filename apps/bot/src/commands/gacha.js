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
    if (!nome) return null;
    const busca = normalizar(nome);
    const exatos = disponiveis.filter(item => normalizar(item.nome) === busca);
    const encontrados = exatos.length ? exatos : disponiveis.filter(item => normalizar(item.nome).includes(busca));
    if (encontrados.length > 1) throw new Error("Nome ambíguo. Informe o nome completo de um dos banners: " + encontrados.map(item => item.nome).join(", "));
    return encontrados[0] || null;
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
            return MessageService.send({ message: msg, text: `_*「 BANNERS DISPONÍVEIS 」*_\n_— Convergências atualmente reconhecidas pelo Sistema._\n\n${linhas.length ? linhas.join("\n") : "_• Nenhum Banner disponível._"}\n\n_Use *!Banner nome do banner* para consultar e *!Convergir 1 nome do banner* ou *!Convergir 10 nome do banner* para girar._` });
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
            const { quantidade, nome } = interpretarConvergencia(argumento);
            const banner = localizarBanner(nome, disponiveis);
            if (!banner) throw new Error('Banner não encontrado ou indisponível. Consulte !Banners.');
            const jogador = await database.playerByPhone(msg.author || msg.from);
            if (!jogador) throw new Error("Você precisa ter uma ficha aprovada.");
            const resultado = await engine.realizarGiros(jogador.id, banner.id, quantidade);
            return MessageService.send({ message: msg, text: `_*「 CONVERGÊNCIA CONCLUÍDA 」*_\n_— ${resultado.banner.nome}_\n\n_• Custo: ${resultado.custo} Cristais_\n_• Saldo: ${resultado.saldoAtual} Cristais_\n_• Grande Prêmio: ${resultado.pityDepois}/100_\n\n_*RESULTADOS*_\n${resultado.resultados.map(formatarResultado).join("\n")}` });
        }
        throw new Error("Use !Banners, !Banner <nome> ou !Convergir <1 ou 10> <nome do banner>.");
    } catch (erro) { return MessageService.send({ message: msg, text: `_*「 GACHA 」*_\n_[!] ${erro.message}_` }); }
};
function interpretarConvergencia(argumento) {
    const match = String(argumento || "").trim().match(/^(1|10)\s+(.+)$/);
    if (!match) throw new Error("Informe quantidade e banner: !Convergir 1 <nome do banner> ou !Convergir 10 <nome do banner>.");
    return { quantidade: Number(match[1]), nome: match[2].trim() };
}
module.exports.interpretarConvergencia = interpretarConvergencia;
module.exports.normalizar = normalizar;
module.exports.localizarBanner = localizarBanner;
