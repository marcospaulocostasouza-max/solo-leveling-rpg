"use strict";

const MessageService = require("../core/messageService");
const Admin = require("../systems/gachaAdminService");

const ajuda = `*GACHA ADM — NÚCLEO 6*

!gachaadm banner listar
!gachaadm banner ver <id>
!gachaadm banner criar Nome | Descrição | permanente
!gachaadm banner criar Nome | Descrição | temporario | início ISO | fim ISO | imagem
!gachaadm banner editar <id> <nome|descricao|imagem|permanente|inicio|fim> <valor>
!gachaadm banner validar <id>
!gachaadm banner ativar <id>
!gachaadm banner desativar <id>
!gachaadm banner arquivar <id>

!gachaadm pool adicionar <banner> <tipo> <referência|-> <quantidade> <peso> [unica] [fragmentos]
!gachaadm pool remover <banner> <recompensa>
!gachaadm pool peso <banner> <recompensa> <peso>
!gachaadm pool ativo <banner> <recompensa> <sim|nao>
!gachaadm destaques <banner> <id1,id2,id3,id4>
!gachaadm premio <banner> <recompensa>

!gachaadm buscar item <nome>
!gachaadm buscar conjunto <nome> [rank]`;

function bool(valor) { return ["1", "sim", "true", "permanente", "ativo"].includes(String(valor || "").toLowerCase()); }
function formatarValidacao(validacao) {
    return `${validacao.valid ? "✅ VÁLIDO" : "❌ INVÁLIDO"}${validacao.errors.length ? `\nErros:\n${validacao.errors.map(item => `• ${item}`).join("\n")}` : ""}${validacao.warnings.length ? `\nAvisos:\n${validacao.warnings.map(item => `• ${item}`).join("\n")}` : ""}`;
}
function formatarView(view) {
    const b = view.banner;
    const pool = view.pool.map(item => `#${item.id} ${item.nome} [${item.reward_type}] Rank:${item.rank || "-"} Raridade:${item.raridade || "-"}\n  Qtd:${item.quantidade} Peso:${item.peso} Chance:${item.chance.toFixed(2)}% ${item.destaque_ordem ? `Destaque ${item.destaque_ordem}` : ""} ${Number(item.grande_premio) ? "GRANDE PRÊMIO" : ""}${item.conjunto ? `\n  Conjunto: ${item.conjunto.nome} [${item.conjunto.rank}]` : ""}${Number(item.unica) ? `\n  Única — duplicata: ${item.duplicate_fragment_value ?? "NÃO CONFIGURADA"}` : ""}`).join("\n");
    return `*BANNER #${b.id} — ${b.nome}*\nStatus: ${b.status}\nTipo: ${Number(b.permanente) ? "Permanente" : "Temporário"}\nPeríodo: ${b.inicio_em || "-"} → ${b.fim_em || "-"}\nImagem: ${b.imagem || "-"}\nDescrição: ${b.descricao}\nPulls: ${view.pulls}\nHard Pity: ${view.hardPity}\nPeso total: ${view.pesoTotal}\n\n*POOL*\n${pool || "Vazio"}\n\n${formatarValidacao(view.validation)}`;
}

async function executar(msg) {
    const actor = msg.author || msg.from;
    try {
        await Admin.autorizar(actor);
        const original = String(msg.body || "").trim();
        const entrada = original.replace(/^!gachaadm\s*/i, "").trim();
        if (!entrada || entrada.toLowerCase() === "ajuda") return MessageService.send({ message: msg, text: ajuda });
        const partes = entrada.split(/\s+/); const grupo = partes[0]?.toLowerCase(); const acao = partes[1]?.toLowerCase();
        let resposta;
        if (grupo === "banner" && acao === "listar") {
            const lista = await Admin.listBannersAdmin(actor);
            resposta = lista.length ? lista.map(b => `#${b.id} ${b.nome} — ${b.status} — ${b.recompensas} recompensas — ${b.destaques}/4 destaques — GP:${b.grandePremio ? "sim" : "não"} — ${b.valido ? "válido" : "inválido"}`).join("\n") : "Nenhum Banner.";
        } else if (grupo === "banner" && acao === "ver") resposta = formatarView(await Admin.getBannerAdminView(actor, partes[2]));
        else if (grupo === "banner" && acao === "validar") resposta = formatarValidacao(await Admin.validateBanner(actor, partes[2]));
        else if (grupo === "banner" && acao === "ativar") resposta = `Banner #${(await Admin.activateBanner(actor, partes[2])).id} ativado.`;
        else if (grupo === "banner" && acao === "desativar") resposta = `Banner #${(await Admin.deactivateBanner(actor, partes[2])).id} desativado sem apagar pity ou histórico.`;
        else if (grupo === "banner" && acao === "arquivar") resposta = `Banner #${(await Admin.archiveBanner(actor, partes[2])).id} arquivado.`;
        else if (grupo === "banner" && acao === "criar") {
            const campos = entrada.replace(/^banner\s+criar\s+/i, "").split("|").map(item => item.trim());
            const permanente = campos[2]?.toLowerCase() === "permanente";
            const view = await Admin.createBanner(actor, { nome: campos[0], descricao: campos[1], permanente, inicioEm: campos[3], fimEm: campos[4], imagem: campos[5] });
            resposta = `Banner #${view.banner.id} criado como rascunho.`;
        } else if (grupo === "banner" && acao === "editar") {
            const bannerId = partes[2]; const campo = partes[3]?.toLowerCase(); const valor = partes.slice(4).join(" ");
            const mapa = { nome: "nome", descricao: "descricao", imagem: "imagem", permanente: "permanente", inicio: "inicioEm", fim: "fimEm" };
            if (!mapa[campo]) throw new Error("Campo de edição inválido.");
            const dado = campo === "permanente" ? bool(valor) : valor;
            resposta = `Banner #${(await Admin.updateBanner(actor, bannerId, { [mapa[campo]]: dado })).banner.id} atualizado.`;
        } else if (grupo === "pool" && acao === "adicionar") {
            const unica = partes[7]?.toLowerCase() === "unica"; const duplicata = partes[8] == null ? null : Number(partes[8]);
            const reward = await Admin.addReward(actor, partes[2], { tipo: partes[3], referenciaId: partes[4] === "-" ? null : partes[4], quantidade: Number(partes[5]), peso: Number(partes[6]), unica, duplicateFragmentValue: duplicata });
            resposta = `Recompensa #${reward.id} adicionada ao Banner #${partes[2]}.`;
        } else if (grupo === "pool" && acao === "remover") { await Admin.removeReward(actor, partes[2], partes[3]); resposta = "Recompensa removida."; }
        else if (grupo === "pool" && acao === "peso") { await Admin.updateReward(actor, partes[2], partes[3], { peso: Number(partes[4]) }); resposta = "Peso atualizado."; }
        else if (grupo === "pool" && acao === "ativo") { await Admin.updateReward(actor, partes[2], partes[3], { ativo: bool(partes[4]) }); resposta = "Estado da recompensa atualizado."; }
        else if (grupo === "destaques") { const rows = await Admin.setFeaturedRewards(actor, partes[1], partes[2].split(",")); resposta = `Destaques definidos: ${rows.map(item => `#${item.id}`).join(", ")}.`; }
        else if (grupo === "premio") { const row = await Admin.setGrandPrize(actor, partes[1], partes[2]); resposta = `Grande Prêmio definido: #${row.id}.`; }
        else if (grupo === "buscar" && acao === "item") {
            const rows = await Admin.buscarRecompensas(actor, { termo: partes.slice(2).join(" ") });
            resposta = rows.map(item => `#${item.id} ${item.nome} — ${item.tipo} — Rank ${item.rank || "-"}${item.conjunto_nome ? ` — ${item.conjunto_nome}` : ""}`).join("\n") || "Nenhum item encontrado.";
        } else if (grupo === "buscar" && acao === "conjunto") {
            const rows = await Admin.buscarConjuntos(actor, { termo: partes.slice(2).join(" ") });
            resposta = rows.map(set => `#${set.id} ${set.nome} — Rank ${set.rank} — ${set.pecas} peças\n${set.itens.map(item => `  #${item.id} ${item.nome} (${item.slot})`).join("\n")}`).join("\n") || "Nenhum conjunto encontrado.";
        } else resposta = ajuda;
        return MessageService.send({ message: msg, text: resposta });
    } catch (erro) {
        return MessageService.send({ message: msg, text: `[!] ${erro.message}` });
    }
}

module.exports = executar;
module.exports.formatarView = formatarView;
