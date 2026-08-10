const db = require("../core/database");
const MessageService = require("../core/messageService");
const recursos = require("../systems/advancedClassFeatureSystem");

const normalizar = (valor = "") => String(valor)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

function linhas(itens, montar, vazio = "Nenhum registro.") {
    return itens && itens.length ? itens.map(montar).join("\n") : `> ${vazio}`;
}

function montarResumo(resumo) {
    const { jogador, classe, registros } = resumo;
    let texto = `*════════════════════════════════════*\n*CLASSE ESPECIAL*\n*════════════════════════════════════*\n\n`;
    texto += `› Jogador: *${jogador.nome}*\n› Classe avançada: *${jogador.classe_avancada || "Nenhuma"}*\n\n`;

    if (classe === "hrymir") {
        texto += "*INSTRUMENTOS DIVINOS*\n";
        texto += linhas(registros.instrumentos, item => `› ${item.nome_recipiente} — espírito: ${item.nome_humano} | ${item.tipo_recipiente} | ${item.estado}`);
        if (registros.templo) texto += `\n\n*TEMPLO*\n› ${registros.templo.nome}${registros.templo.localizacao ? ` — ${registros.templo.localizacao}` : ""}\n› Instrumentos guardados: ${registros.templo.instrumentos_guardados}`;
    } else if (classe === "freyr") {
        texto += "*MAJINS E METAL VESSELS*\n";
        texto += linhas(registros.majins, item => `› ${item.nome_majin} — ${item.metal_vessel} | ${item.status} | método: ${item.metodo}${item.metodo === "cenas" ? ` (${item.cenas_confirmadas}/7 cenas)` : ""}`);
    } else if (classe === "taoista") {
        texto += "*NAGUMO: REINO DOS MONARCAS*\n";
        texto += linhas(registros.nagumo, item => `› Rank-${item.rank_desejado} | ${item.status} | Monarca: ${item.encontro_monarca}`);
        texto += "\n\n› Use: *!classe especial nagumo <C|B|A|S>*";
    } else if (classe === "alquimista") {
        texto += "*PEDRAS FILOSOFAIS*\n";
        texto += linhas(registros.pedrasBoss, item => `› Pedras de Boss Rank-${item.rank_boss}: ${item.quantidade} (${item.status})`, "Nenhuma pedra de Boss registrada.");
        texto += "\n\n*PEDRAS CRIADAS*\n";
        texto += linhas(registros.pedrasFilosofais, item => `› Pedra #${item.id} — Rank-${item.rank_origem} | ${item.status}`);
    } else if (classe === "mago runico") {
        texto += "*RUNAS GLOBAIS*\n";
        texto += linhas(registros.runasGlobais, item => `› #${item.id} ${item.nome_boss} — Rank-${item.rank_boss} | ${item.status}`);
    } else if (classe === "arcanista") {
        texto += "*ENCANTAMENTOS*\n";
        texto += linhas(registros.encantamentos, item => `› #${item.id} Item #${item.item_id} — ${item.status}`);
        texto += "\n\n*RUNAS MÁGICAS*\n";
        texto += linhas(registros.runas, item => `› #${item.id} ${item.nome} — ${item.status}`);
    } else if (classe === "oraculo") {
        texto += "*PODER DIVINO — EQUIPE*\n";
        texto += linhas(registros.equipe, item => `› ${item.nome}: nível atual ${item.nivel} | projeção: ${item.nivelProjetado} | proximidade: ${item.requerProximidade}`, "Nenhuma equipe configurada.");
    } else if (classe === "taumaturgo") {
        texto += "*CONTROLE ABSOLUTO*\n";
        texto += linhas(registros.solicitacoes, item => `› #${item.id} ${item.tipo.replace(/_/g, " ")} — ${item.status}`);
    } else if (classe === "chefe") {
        texto += "*BOLSA DE COZINHA*\n";
        texto += linhas(registros.ingredientes, item => `› ${item.nome}: ${item.quantidade}${item.validade_em ? ` | validade: ${item.validade_em}` : ""}`);
        texto += "\n\n*RECEITAS*\n";
        texto += linhas(registros.receitas, item => `› #${item.id} ${item.nome} (${item.tipo}) — ${item.status}`);
    } else if (classe === "apotecario") {
        texto += "*POÇÕES*\n";
        texto += linhas(registros.pocoes, item => `› #${item.id} ${item.nome} — ${item.status}`);
    } else if (classe === "warden" || classe === "archon") {
        texto += "*SOBERANIA ELEMENTAL*\n";
        texto += registros.soberania ? `› Seu elemento: *${registros.soberania.elemento}* (${registros.soberania.estado})\n` : "> Nenhum elemento reivindicado.\n";
        texto += "\n*PORTADORES JOGADORES*\n";
        texto += registros.elementos.map(item => `› ${item.elemento}: ${item.portador ? `${item.portador.jogador} (${item.portador.classe})` : "disponível"}`).join("\n");
        if (!registros.soberania) texto += "\n\n› Use: *!classe especial soberania <elemento>*";
    } else {
        texto += "> Esta classe avançada ainda não possui um sistema especial nesta etapa.";
    }
    texto += "\n\n*────────────────────────────────────*\n_Consultas e registros narrativos; nenhum efeito de combate é aplicado._";
    return texto;
}

module.exports = async (msg) => {
    try {
        const numero = msg.author || msg.from;
        const jogador = await new Promise(resolve => db.get("SELECT id FROM jogadores WHERE numero = ?", [numero], (erro, linha) => resolve(erro ? null : linha)));
        if (!jogador) return MessageService.send({ message: msg, text: "[!] Você precisa ter uma ficha aprovada para consultar recursos de classe." });

        const partes = msg.body.trim().split(/\s+/);
        const acao = normalizar(partes[2]);
        if (acao === "soberania") {
            const resultado = await recursos.reivindicarSoberaniaElemental(jogador.id, partes.slice(3).join(" "));
            return MessageService.send({ message: msg, text: `[+] Soberania elemental registrada: *${resultado.elemento}*.\n› Nenhum bônus de combate foi aplicado.` });
        }
        if (acao === "nagumo") {
            const resultado = await recursos.solicitarNagumo(jogador.id, partes[3]);
            return MessageService.send({ message: msg, text: `[+] Entrada em Nagumo registrada.\n› Status: *${resultado.status}*\n› Encontro com Monarca: *${resultado.chanceEncontroMonarca}*` });
        }
        const resumo = await recursos.obterResumo(jogador.id);
        return MessageService.send({ message: msg, text: montarResumo(resumo) });
    } catch (erro) {
        console.error("[CLASSE ESPECIAL]", erro.message);
        return MessageService.send({ message: msg, text: `[!] ${erro.message || "Não foi possível consultar o sistema de classe."}` });
    }
};
