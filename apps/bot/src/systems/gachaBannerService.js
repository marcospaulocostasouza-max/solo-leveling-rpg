const database = require("../../../../packages/database");
const { provider } = require("../../../../packages/database/config");

const TIPOS_RECOMPENSA = Object.freeze([
    "ITEM", "EQUIPAMENTO", "ARMA", "ACESSORIO", "MATERIAL", "CONSUMIVEL", "CAIXA",
    "TECNICA", "PASSIVA", "TITULO", "PROJETO", "CONJUNTO_ITEM", "MAESTRIA", "XP",
    "WON", "CRISTAIS", "TOKEN", "FRAGMENTOS", "ITEM_ESPECIAL_BANNER"
]);
const TIPOS_NUMERICOS = new Set(["MAESTRIA", "XP", "WON", "CRISTAIS", "TOKEN", "FRAGMENTOS"]);
const TIPOS_ITEM = new Set(["ITEM", "EQUIPAMENTO", "ARMA", "ACESSORIO", "MATERIAL", "CONSUMIVEL", "CAIXA", "ITEM_ESPECIAL_BANNER"]);
const passivas = require("../database/data/passivas.json");
const titulos = require("../database/data/titulos.json");

function inteiroPositivo(valor, campo) {
    const numero = Number(valor);
    if (!Number.isSafeInteger(numero) || numero <= 0) throw new Error(`${campo} deve ser um inteiro positivo.`);
    return numero;
}
function idValido(valor, campo = "ID") { return inteiroPositivo(valor, campo); }
function booleano(valor) { return valor ? 1 : 0; }
function dataIso(valor, campo) {
    if (valor == null || valor === "") return null;
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) throw new Error(`${campo} inválida.`);
    return data.toISOString();
}
async function inserirComId(sql, params) {
    const resultado = await database.run(provider === "postgres" ? `${sql} RETURNING id` : sql, params);
    return Number(resultado.lastID);
}

async function garantirEstrutura() { return database.ensureGachaBannerSchema(); }

async function criarBanner(dados) {
    await garantirEstrutura();
    const nome = String(dados?.nome || "").trim();
    const descricao = String(dados?.descricao || "").trim();
    if (!nome || !descricao) throw new Error("Nome e descrição do Banner são obrigatórios.");
    if (dados.ativo) throw new Error("Um Banner novo deve ser configurado e validado antes de ser ativado.");
    const permanente = Boolean(dados.permanente);
    const inicio = dataIso(dados.inicioEm, "Data de início");
    const fim = dataIso(dados.fimEm, "Data de término");
    if (!permanente && inicio && fim && new Date(inicio) >= new Date(fim)) throw new Error("O término deve ocorrer depois do início.");
    const id = await inserirComId("INSERT INTO gacha_banners (nome, descricao, imagem, ativo, permanente, inicio_em, fim_em) VALUES (?, ?, ?, 0, ?, ?, ?)", [nome, descricao, dados.imagem || null, booleano(permanente), inicio, fim]);
    return getBannerPorId(id);
}

async function listarBanners() {
    await garantirEstrutura();
    return database.all("SELECT * FROM gacha_banners ORDER BY id");
}
async function getBannerPorId(id) {
    await garantirEstrutura();
    return database.get("SELECT * FROM gacha_banners WHERE id = ?", [idValido(id, "Banner")]);
}
async function getPoolDoBanner(id) {
    await garantirEstrutura();
    return database.all("SELECT * FROM gacha_banner_rewards WHERE banner_id = ? ORDER BY grande_premio DESC, destaque_ordem, id", [idValido(id, "Banner")]);
}
async function getDestaquesDoBanner(id) {
    await garantirEstrutura();
    return database.all("SELECT * FROM gacha_banner_rewards WHERE banner_id = ? AND destaque_ordem IS NOT NULL ORDER BY destaque_ordem", [idValido(id, "Banner")]);
}
async function getGrandePremioDoBanner(id) {
    await garantirEstrutura();
    return database.get("SELECT * FROM gacha_banner_rewards WHERE banner_id = ? AND grande_premio = 1", [idValido(id, "Banner")]);
}

async function criarConjunto(dados) {
    await garantirEstrutura();
    const nome = String(dados?.nome || "").trim();
    if (!nome) throw new Error("Nome do conjunto é obrigatório.");
    const id = await inserirComId("INSERT INTO gacha_item_sets (nome, descricao) VALUES (?, ?)", [nome, dados.descricao || null]);
    for (const entrada of dados.itens || []) await adicionarItemAoConjunto(id, entrada.itemId, entrada.quantidade || 1);
    return database.get("SELECT * FROM gacha_item_sets WHERE id = ?", [id]);
}
async function adicionarItemAoConjunto(conjuntoId, itemId, quantidade = 1) {
    await garantirEstrutura();
    const conjunto = await database.get("SELECT id FROM gacha_item_sets WHERE id = ?", [idValido(conjuntoId, "Conjunto")]);
    if (!conjunto) throw new Error("Conjunto não encontrado.");
    const item = await database.get("SELECT id FROM itens WHERE id = ?", [idValido(itemId, "Item")]);
    if (!item) throw new Error("Item do conjunto não existe no catálogo original.");
    const qtd = inteiroPositivo(quantidade, "Quantidade");
    await database.run("INSERT INTO gacha_item_set_entries (conjunto_id, item_id, quantidade) VALUES (?, ?, ?) ON CONFLICT(conjunto_id, item_id) DO UPDATE SET quantidade = excluded.quantidade", [conjunto.id, item.id, qtd]);
    return true;
}
async function getItensDoConjunto(conjuntoId) {
    await garantirEstrutura();
    return database.all("SELECT i.*, e.quantidade FROM gacha_item_set_entries e JOIN itens i ON i.id = e.item_id WHERE e.conjunto_id = ? ORDER BY i.nome", [idValido(conjuntoId, "Conjunto")]);
}

async function validarReferencia(tipo, referenciaId) {
    if (tipo === "PASSIVA" || tipo === "TITULO") await database.ensureEquipmentSetSchema();
    if (TIPOS_NUMERICOS.has(tipo)) return referenciaId == null || referenciaId === "" ? { valida: true } : { valida: false, erro: `${tipo} é uma recompensa numérica e não aceita referência.` };
    if (tipo === "PROJETO") return { valida: false, erro: "O projeto atual não possui catálogo estruturado de Projetos para referência segura." };
    const id = Number(referenciaId);
    if (!Number.isSafeInteger(id) || id <= 0) return { valida: false, erro: `${tipo} exige uma referência válida.` };
    if (TIPOS_ITEM.has(tipo)) {
        const item = await database.get("SELECT * FROM itens WHERE id = ?", [id]);
        if (!item) return { valida: false, erro: "Item não existe no catálogo original." };
        const categoria = String(item.categoria || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (tipo === "ARMA" && !item.arma && !categoria.includes("arma")) return { valida: false, erro: "A referência não é uma arma." };
        if (tipo === "ACESSORIO" && !item.acessorio && !categoria.includes("acess")) return { valida: false, erro: "A referência não é um acessório." };
        if (tipo === "CONSUMIVEL" && !item.consumivel) return { valida: false, erro: "A referência não é consumível." };
        if (tipo === "MATERIAL" && !categoria.includes("material")) return { valida: false, erro: "A referência não está catalogada como material." };
        if (tipo === "CAIXA" && !categoria.includes("caixa")) return { valida: false, erro: "A referência não está catalogada como caixa." };
        return { valida: true, entidade: item };
    }
    if (tipo === "TECNICA") { const entidade = await database.get("SELECT * FROM tecnicas WHERE id = ?", [id]); return { valida: Boolean(entidade), entidade, erro: "Técnica não existe no catálogo original." }; }
    if (tipo === "PASSIVA") {
        const rara = await database.get("SELECT i.*,bri.tipo FROM banner_rare_items bri JOIN itens i ON i.id=bri.item_id WHERE bri.item_id=? AND bri.tipo='PASSIVA'", [id]);
        const entidade = rara || passivas.find(item => Number(item.id) === id); return { valida: Boolean(entidade), entidade, erro: "Passiva não existe no catálogo oficial nem no catálogo raro do Banner." };
    }
    if (tipo === "TITULO") {
        const raro = await database.get("SELECT i.*,bri.tipo FROM banner_rare_items bri JOIN itens i ON i.id=bri.item_id WHERE bri.item_id=? AND bri.tipo='TITULO'", [id]);
        const entidade = raro || titulos.find(item => Number(item.id) === id); return { valida: Boolean(entidade), entidade, erro: "Título não existe no catálogo oficial nem no catálogo raro do Banner." };
    }
    if (tipo === "CONJUNTO_ITEM") return { valida: Boolean(await database.get("SELECT id FROM gacha_item_sets WHERE id = ?", [id])), erro: "Conjunto não existe." };
    return { valida: false, erro: `Tipo ${tipo} sem resolvedor de referência.` };
}

async function adicionarRecompensa(bannerId, dados) {
    await garantirEstrutura();
    const idBanner = idValido(bannerId, "Banner");
    if (!await getBannerPorId(idBanner)) throw new Error("Banner não encontrado.");
    const tipo = String(dados?.tipo || "").trim().toUpperCase();
    if (!TIPOS_RECOMPENSA.includes(tipo)) throw new Error("Tipo de recompensa não suportado.");
    const quantidade = inteiroPositivo(dados.quantidade ?? 1, "Quantidade");
    const peso = Number(dados.peso);
    if (!Number.isFinite(peso) || peso <= 0) throw new Error("Peso deve ser maior que zero.");
    const destaqueOrdem = dados.destaqueOrdem == null ? null : Number(dados.destaqueOrdem);
    if (destaqueOrdem != null && (!Number.isInteger(destaqueOrdem) || destaqueOrdem < 1 || destaqueOrdem > 4)) throw new Error("Destaque deve ocupar uma posição entre 1 e 4.");
    if (dados.grandePremio && destaqueOrdem != null) throw new Error("O Grande Prêmio é separado dos quatro Destaques.");
    const referencia = await validarReferencia(tipo, dados.referenciaId);
    if (!referencia.valida) throw new Error(referencia.erro);
    const garantidoConjunto = Boolean(dados.garantidoConjunto);
    if (garantidoConjunto) {
        await database.ensureEquipmentSetSchema();
        if (tipo !== "ITEM") throw new Error("A garantia de conjunto aceita apenas uma peça de equipamento (tipo ITEM).");
        const pertenceAoConjunto = await database.get("SELECT 1 FROM equipment_set_items WHERE item_id = ?", [Number(dados.referenciaId)]);
        if (!pertenceAoConjunto) throw new Error("A recompensa marcada como garantia deve pertencer a um conjunto cadastrado.");
    }
    const unica = Boolean(dados.unica);
    const valorDuplicata = dados.duplicateFragmentValue == null ? null : Number(dados.duplicateFragmentValue);
    if (valorDuplicata != null && (!Number.isSafeInteger(valorDuplicata) || valorDuplicata <= 0)) throw new Error("O valor de conversão de duplicata deve ser um inteiro positivo.");
    if (!unica && valorDuplicata != null) throw new Error("Somente recompensas únicas podem configurar conversão de duplicata.");
    const raridade = dados.raridade || referencia.entidade?.tier || referencia.entidade?.rank || referencia.entidade?.raridade || null;
    const id = await inserirComId("INSERT INTO gacha_banner_rewards (banner_id, reward_type, referencia_id, quantidade, peso, raridade, destaque_ordem, grande_premio, exclusivo_banner, unica, duplicate_fragment_value, garantido_conjunto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [idBanner, tipo, dados.referenciaId == null ? null : String(dados.referenciaId), quantidade, peso, raridade, destaqueOrdem, booleano(dados.grandePremio), booleano(dados.exclusivoBanner), booleano(unica), valorDuplicata, booleano(garantidoConjunto)]);
    return database.get("SELECT * FROM gacha_banner_rewards WHERE id = ?", [id]);
}

async function validarBanner(id) {
    const banner = await getBannerPorId(id);
    const erros = [];
    if (!banner) return { valido: false, erros: ["Banner não encontrado."] };
    if (!String(banner.nome || "").trim() || !String(banner.descricao || "").trim()) erros.push("Nome e descrição são obrigatórios.");
    if (!Number(banner.permanente)) {
        if (!banner.inicio_em || !banner.fim_em) erros.push("Banner temporário exige início e término.");
        else if (new Date(banner.inicio_em) >= new Date(banner.fim_em)) erros.push("Período temporário inválido.");
    }
    const pool = (await getPoolDoBanner(banner.id)).filter(item => Number(item.ativo ?? 1) === 1);
    if (!pool.length) erros.push("Pool vazio.");
    if (pool.filter(item => item.destaque_ordem != null).length !== 4) erros.push("O Banner deve possuir exatamente 4 Destaques.");
    if (pool.filter(item => Number(item.grande_premio) === 1).length !== 1) erros.push("O Banner deve possuir exatamente 1 Grande Prêmio.");
    for (const recompensa of pool) {
        if (!(Number(recompensa.peso) > 0) || !(Number(recompensa.quantidade) > 0)) erros.push(`Recompensa #${recompensa.id} possui peso ou quantidade inválida.`);
        if (Number(recompensa.unica) === 1 && !(Number(recompensa.duplicate_fragment_value) > 0)) erros.push(`Recompensa única #${recompensa.id} exige valor de conversão de duplicata.`);
        const referencia = await validarReferencia(recompensa.reward_type, recompensa.referencia_id);
        if (!referencia.valida) erros.push(`Recompensa #${recompensa.id}: ${referencia.erro}`);
    }
    const permiteDezGiros = pool.some(item => Number(item.garantido_conjunto) === 1);
    return { valido: erros.length === 0, erros, banner, pool, permiteDezGiros };
}

async function definirBannerAtivo(id, ativo) {
    await garantirEstrutura();
    const bannerId = idValido(id, "Banner");
    if (ativo) {
        const validacao = await validarBanner(bannerId);
        if (!validacao.valido) throw new Error(`Banner inválido: ${validacao.erros.join(" ")}`);
    }
    const resultado = await database.run("UPDATE gacha_banners SET ativo = ?, status = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?", [booleano(ativo), ativo ? "ACTIVE" : "INACTIVE", bannerId]);
    if (resultado.changes !== 1) throw new Error("Banner não encontrado.");
    return getBannerPorId(bannerId);
}

function estaNoPeriodo(banner, agora = new Date()) {
    if (!Number(banner.ativo)) return false;
    if (Number(banner.permanente)) return true;
    const inicio = new Date(banner.inicio_em); const fim = new Date(banner.fim_em);
    return !Number.isNaN(inicio.getTime()) && !Number.isNaN(fim.getTime()) && agora >= inicio && agora <= fim;
}
async function getBannersDisponiveis(agora = new Date()) {
    const banners = await listarBanners(); const disponiveis = [];
    for (const banner of banners) {
        if (!estaNoPeriodo(banner, agora)) continue;
        if ((await validarBanner(banner.id)).valido) disponiveis.push(banner);
    }
    return disponiveis;
}

module.exports = { TIPOS_RECOMPENSA, garantirEstrutura, criarBanner, listarBanners, getBannerPorId, getBannersDisponiveis, getPoolDoBanner, getDestaquesDoBanner, getGrandePremioDoBanner, criarConjunto, adicionarItemAoConjunto, getItensDoConjunto, adicionarRecompensa, validarReferencia, validarBanner, definirBannerAtivo, estaNoPeriodo };
