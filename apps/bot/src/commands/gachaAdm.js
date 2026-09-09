"use strict";

const MessageService = require("../core/messageService");
const Admin = require("../systems/gachaAdminService");
const database = require("../../../../packages/database");
const Banners = require("../systems/gachaBannerService");
const Wizard = require("../systems/creationWizardService");

const FICHA_BANNER = `*═══ FICHA DE CRIAÇÃO DE BANNER ═══*
──────────────────────────
_Preencha todos os campos mantendo o comando na primeira linha._

!criar banner
*─── Identidade do Banner ───*
> *NOME DO BANNER:*
> *DESCRIÇÃO BREVE:*

*─── Conteúdo da Convergência ───*
> *CONJUNTOS:*
> *TÍTULO:*
> *PASSIVAS:*
> *ITEM SECRETO:*

*─── Período de Atividade ───*
> *DATA INICIAL:* DD/MM/AAAA HH:mm
> *DATA FINAL:* DD/MM/AAAA HH:mm

──────────────────────────
_Separe vários Conjuntos ou Passivas por vírgula. Todo conteúdo precisa existir no catálogo raro._`;

function normalizar(valor) { return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/^\s*\[personalizado\]\s*/i, "").replace(/[^a-z0-9]+/g, " ").trim(); }
function lista(valor) { return String(valor || "").split(/[,;]+/).map(item => item.trim()).filter(Boolean); }
function dataDaFicha(valor, campo) {
    const texto = String(valor || "").trim();
    const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
    const data = br ? new Date(`${br[3]}-${br[2]}-${br[1]}T${br[4] || "00"}:${br[5] || "00"}:00-03:00`) : new Date(texto);
    if (!texto || Number.isNaN(data.getTime())) throw new Error(`${campo} inválida. Use DD/MM/AAAA HH:mm.`);
    return data.toISOString();
}
function lerFichaBanner(texto) {
    const campos = {};
    for (const linha of String(texto || "").replace(/^!criar banner\s*/i, "").split(/\r?\n/)) {
        const separador = linha.indexOf(":");
        if (separador < 0) continue;
        campos[normalizar(linha.slice(0, separador))] = linha.slice(separador + 1).trim();
    }
    return {
        nome: campos["nome do banner"] || campos.nome,
        descricao: campos["descricao breve"] || campos.descricao,
        conjuntos: lista(campos.conjuntos || campos.conjunto), titulo: campos.titulo,
        passivas: lista(campos.passivas || campos.passiva), itemSecreto: campos["item secreto"],
        inicioEm: campos["data inicial"], fimEm: campos["data final"]
    };
}

async function prepararFichaBanner(texto) {
    const ficha = lerFichaBanner(texto); const erros = [];
    for (const [campo, valor] of [["Nome do banner", ficha.nome], ["Descrição breve", ficha.descricao], ["Título", ficha.titulo], ["Item secreto", ficha.itemSecreto]]) if (!String(valor || "").trim()) erros.push(`${campo} não foi preenchido.`);
    if (!ficha.conjuntos.length) erros.push("Informe ao menos um conjunto.");
    if (!ficha.passivas.length) erros.push("Informe ao menos uma passiva.");
    let inicioEm; let fimEm;
    try { inicioEm = dataDaFicha(ficha.inicioEm, "Data inicial"); } catch (e) { erros.push(e.message); }
    try { fimEm = dataDaFicha(ficha.fimEm, "Data final"); } catch (e) { erros.push(e.message); }
    if (inicioEm && fimEm && new Date(inicioEm) >= new Date(fimEm)) erros.push("A data final deve ser posterior à data inicial.");
    await Promise.all([Banners.garantirEstrutura(), database.ensureEquipmentSetSchema()]);
    const [conjuntosBanco, itensBanco, bannersBanco] = await Promise.all([database.all("SELECT id,nome,rank FROM equipment_sets ORDER BY nome"), database.all("SELECT * FROM itens ORDER BY nome"), Banners.listarBanners()]);
    if (ficha.nome && bannersBanco.some(item => normalizar(item.nome) === normalizar(ficha.nome))) erros.push(`Já existe um Banner chamado ${ficha.nome}.`);
    const conjuntos = ficha.conjuntos.map(nome => conjuntosBanco.find(item => normalizar(item.nome) === normalizar(nome)));
    ficha.conjuntos.forEach((nome, i) => { if (!conjuntos[i]) erros.push(`Conjunto não encontrado: ${nome}.`); });
    const catalogoRaro = await database.all("SELECT i.*,bri.tipo FROM banner_rare_items bri JOIN itens i ON i.id=bri.item_id ORDER BY i.nome");
    const titulo = catalogoRaro.find(item => item.tipo === "TITULO" && normalizar(item.nome) === normalizar(ficha.titulo));
    if (ficha.titulo && !titulo) erros.push(`Título raro não encontrado: ${ficha.titulo}. Crie-o antes com !Fitem e PERTENCENTE: Item Raro.`);
    const passivasEncontradas = ficha.passivas.map(nome => catalogoRaro.find(item => item.tipo === "PASSIVA" && normalizar(item.nome) === normalizar(nome)));
    ficha.passivas.forEach((nome, i) => { if (!passivasEncontradas[i]) erros.push(`Passiva rara não encontrada: ${nome}. Crie-a antes com !Fitem e PERTENCENTE: Item Raro.`); });
    const itemSecreto = itensBanco.find(item => normalizar(item.nome) === normalizar(ficha.itemSecreto));
    if (ficha.itemSecreto && !itemSecreto) erros.push(`Item secreto não encontrado: ${ficha.itemSecreto}.`);
    else if (itemSecreto && !await database.get("SELECT item_id FROM banner_rare_items WHERE item_id=? AND tipo='ITEM'", [itemSecreto.id])) erros.push(`O item secreto ${ficha.itemSecreto} não foi criado como Item Raro.`);
    const itensConjuntos = [];
    for (const conjunto of conjuntos.filter(Boolean)) {
        const itens = await database.all("SELECT i.* FROM equipment_set_items esi JOIN itens i ON i.id=esi.item_id WHERE esi.set_id=? ORDER BY i.id", [conjunto.id]);
        if (!itens.length) erros.push(`O conjunto ${conjunto.nome} existe, mas não possui itens cadastrados.`);
        itensConjuntos.push(...itens);
    }
    return { ficha: { ...ficha, inicioEm, fimEm }, erros, conjuntos: conjuntos.filter(Boolean), itensConjuntos: [...new Map(itensConjuntos.map(item => [item.id, item])).values()], titulo, passivas: passivasEncontradas.filter(Boolean), itemSecreto };
}

async function criarPelaFicha(actor, texto) {
    const dados = await prepararFichaBanner(texto);
    if (dados.erros.length) throw new Error(`A ficha possui informações incorretas:\n• ${dados.erros.join("\n• ")}`);
    const view = await Admin.createBanner(actor, { nome: dados.ficha.nome, descricao: dados.ficha.descricao, permanente: false, inicioEm: dados.ficha.inicioEm, fimEm: dados.ficha.fimEm });
    const candidatas = [];
    for (const item of dados.itensConjuntos) candidatas.push(await Admin.addReward(actor, view.banner.id, { tipo: "ITEM", referenciaId: item.id, quantidade: 1, peso: 10 }));
    candidatas.push(await Admin.addReward(actor, view.banner.id, { tipo: "TITULO", referenciaId: dados.titulo.id, quantidade: 1, peso: 5, unica: true, duplicateFragmentValue: 10 }));
    for (const passiva of dados.passivas) candidatas.push(await Admin.addReward(actor, view.banner.id, { tipo: "PASSIVA", referenciaId: passiva.id, quantidade: 1, peso: 5, unica: true, duplicateFragmentValue: 10 }));
    const secreto = await Admin.addReward(actor, view.banner.id, { tipo: "ITEM_ESPECIAL_BANNER", referenciaId: dados.itemSecreto.id, quantidade: 1, peso: 1, unica: true, duplicateFragmentValue: 25, exclusivoBanner: true });
    if (candidatas.length >= 4) await Admin.setFeaturedRewards(actor, view.banner.id, candidatas.slice(0, 4).map(item => item.id));
    await Admin.setGrandPrize(actor, view.banner.id, secreto.id);
    return view.banner;
}

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
    return `${validacao.valid ? "_[+] CONFIGURAÇÃO VÁLIDA_" : "_[!] CONFIGURAÇÃO INVÁLIDA_"}${validacao.errors.length ? `\n_*Erros:*_\n${validacao.errors.map(item => `_• ${item}_`).join("\n")}` : ""}${validacao.warnings.length ? `\n_*Avisos:*_\n${validacao.warnings.map(item => `_• ${item}_`).join("\n")}` : ""}`;
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
        if (/^!criar banner\s*$/i.test(original)) return MessageService.send({ message: msg, text: `_*「 CRIAÇÃO GUIADA DE BANNER 」*_\n\n${await Wizard.start(actor, "BANNER")}\n\n_Responda apenas à pergunta. Use !cancelar criação para interromper._` });
        if (/^!criar banner\b/i.test(original)) {
            const banner = await criarPelaFicha(actor, original);
            return MessageService.send({ message: msg, text: `_*「 FICHA DE BANNER VALIDADA 」*_\n\n_Todas as informações foram reconhecidas pelo Sistema._\n_• Banner:_ *${banner.nome}*\n_• Estado: Rascunho_\n\n_*PRÓXIMA ETAPA*_\n_Envie a imagem usando como legenda:_\n*!anexar imagem banner ${banner.nome}*` });
        }
        if (/^!anexar imagem banner\b/i.test(original)) {
            const nome = original.replace(/^!anexar imagem banner\b/i, "").trim();
            if (!nome) throw new Error("Informe o nome do Banner após o comando.");
            if (!msg.hasMedia || typeof msg.downloadMedia !== "function") throw new Error("Envie a imagem anexada e use o comando na legenda.");
            const media = await msg.downloadMedia();
            const sessao = await Wizard.get(actor);
            let result;
            if (sessao?.tipo === "BANNER" && sessao.status === "AGUARDANDO_IMAGEM") result = await Wizard.attachImage(actor, "BANNER", nome, media);
            else {
                if (!media?.data || !/^image\//i.test(media.mimetype || "")) throw new Error("O anexo precisa ser uma imagem válida.");
                const listaBanners = await Admin.listBannersAdmin(actor);
                const banner = listaBanners.find(item => normalizar(item.nome) === normalizar(nome));
                if (!banner) throw new Error(`Banner não encontrado: ${nome}.`);
                await Admin.updateBanner(actor, banner.id, { imagem: `data:${media.mimetype};base64,${media.data}` });
                result = `Imagem vinculada ao Banner *${banner.nome}*.`;
            }
            return MessageService.send({ message: msg, text: `_*「 IMAGEM DO BANNER 」*_\n\n_[+] ${result}` });
        }
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
        return MessageService.send({ message: msg, text: `_*「 ADMINISTRAÇÃO DE BANNERS 」*_\n\n${resposta}` });
    } catch (erro) {
        return MessageService.send({ message: msg, text: `_*「 ADMINISTRAÇÃO DE BANNERS 」*_\n_[!] ${erro.message}_` });
    }
}

module.exports = executar;
module.exports.formatarView = formatarView;
module.exports.lerFichaBanner = lerFichaBanner;
module.exports.prepararFichaBanner = prepararFichaBanner;
module.exports.criarPelaFicha = criarPelaFicha;
