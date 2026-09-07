"use strict";

const database = require("../../../../packages/database");
const { provider } = require("../../../../packages/database/config");
const Banners = require("./gachaBannerService");
const AdminCore = require("../core/adminCore");
const GachaEngine = require("./gachaEngine");

const STATUS = Object.freeze({ DRAFT: "DRAFT", ACTIVE: "ACTIVE", INACTIVE: "INACTIVE", ARCHIVED: "ARCHIVED" });
const RANKS = ["E", "D", "C", "B", "A", "S"];
const TIPOS_INCOMPATIVEIS_MOTOR = new Set(["TOKEN", "FRAGMENTOS", "PROJETO"]);
const TIPOS_ITEM = new Set(["ITEM", "EQUIPAMENTO", "ARMA", "ACESSORIO", "MATERIAL", "CONSUMIVEL", "CAIXA", "ITEM_ESPECIAL_BANNER"]);

function id(valor, campo = "ID") {
    const numero = Number(valor);
    if (!Number.isSafeInteger(numero) || numero <= 0) throw new Error(`${campo} invalido.`);
    return numero;
}
function json(valor) { return valor == null ? null : JSON.stringify(valor); }
function dataIso(valor, campo) {
    if (valor == null || valor === "") return null;
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) throw new Error(`${campo} invalida.`);
    return data.toISOString();
}
async function autorizar(administrador) {
    await database.ensureGachaEngineSchema();
    const numero = String(administrador || "").trim();
    if (!numero || !await AdminCore.isAdmin(numero)) throw new Error("Operacao restrita a administradores.");
    return numero;
}
async function auditar(query, administrador, acao, bannerId, anterior, novo) {
    await query.run("INSERT INTO gacha_admin_audit (administrador, acao, banner_id, valor_anterior, valor_novo) VALUES (?, ?, ?, ?, ?)",
        [administrador, acao, bannerId || null, json(anterior), json(novo)]);
}
async function lockBanner(query, bannerId) {
    return query.get(provider === "postgres" ? "SELECT id FROM gacha_banners WHERE id=? FOR UPDATE" : "SELECT id FROM gacha_banners WHERE id=?", [bannerId]);
}
async function bannerExistente(bannerId, query = database) {
    const banner = await query.get("SELECT * FROM gacha_banners WHERE id = ?", [id(bannerId, "Banner")]);
    if (!banner) throw new Error("Banner nao encontrado.");
    return banner;
}
function exigirEditavel(banner) {
    if (Number(banner.ativo) || banner.status === STATUS.ACTIVE) throw new Error("Desative o Banner antes de alterar pool, pesos, Destaques ou Grande Premio.");
    if (banner.status === STATUS.ARCHIVED) throw new Error("Banner arquivado nao pode ser editado.");
}

async function createBanner(administrador, dados) {
    const actor = await autorizar(administrador);
    const banner = await Banners.criarBanner({ ...dados, ativo: false });
    await database.transaction(async query => {
        await query.run("UPDATE gacha_banners SET status = 'DRAFT' WHERE id = ?", [banner.id]);
        await auditar(query, actor, "CREATE_BANNER", banner.id, null, { ...banner, status: STATUS.DRAFT });
    });
    return getBannerAdminView(actor, banner.id);
}

async function updateBanner(administrador, bannerId, dados) {
    const actor = await autorizar(administrador); const banner = await bannerExistente(bannerId);
    const permitidosAtivo = new Set(["descricao", "imagem"]);
    if (Number(banner.ativo) && Object.keys(dados || {}).some(campo => !permitidosAtivo.has(campo))) {
        throw new Error("Banner ativo permite editar somente descricao e imagem.");
    }
    if (banner.status === STATUS.ARCHIVED) throw new Error("Banner arquivado nao pode ser editado.");
    const novo = { ...banner };
    if (dados.nome !== undefined) { novo.nome = String(dados.nome).trim(); if (!novo.nome) throw new Error("Nome obrigatorio."); }
    if (dados.descricao !== undefined) { novo.descricao = String(dados.descricao).trim(); if (!novo.descricao) throw new Error("Descricao obrigatoria."); }
    if (dados.imagem !== undefined) novo.imagem = dados.imagem ? String(dados.imagem).trim() : null;
    if (dados.permanente !== undefined) novo.permanente = dados.permanente ? 1 : 0;
    if (dados.inicioEm !== undefined) novo.inicio_em = dataIso(dados.inicioEm, "Data inicial");
    if (dados.fimEm !== undefined) novo.fim_em = dataIso(dados.fimEm, "Data final");
    if (!Number(novo.permanente)) {
        if (novo.inicio_em && novo.fim_em && new Date(novo.inicio_em) >= new Date(novo.fim_em)) throw new Error("A data final deve ser posterior a inicial.");
    }
    await database.transaction(async query => {
        await query.run(`UPDATE gacha_banners SET nome=?, descricao=?, imagem=?, permanente=?, inicio_em=?, fim_em=?,
            status=CASE WHEN status='DRAFT' THEN 'DRAFT' ELSE status END, atualizado_em=CURRENT_TIMESTAMP WHERE id=?`,
        [novo.nome, novo.descricao, novo.imagem, novo.permanente, novo.inicio_em, novo.fim_em, banner.id]);
        await auditar(query, actor, "UPDATE_BANNER", banner.id, banner, novo);
    });
    return getBannerAdminView(actor, banner.id);
}

async function addReward(administrador, bannerId, dados) {
    const actor = await autorizar(administrador); const banner = await bannerExistente(bannerId); exigirEditavel(banner);
    if (dados?.garantidoConjunto) await database.ensureEquipmentSetSchema();
    const tipo = String(dados?.tipo || "").toUpperCase();
    const referencia = dados?.referenciaId == null ? null : String(dados.referenciaId);
    if (!Banners.TIPOS_RECOMPENSA.includes(tipo)) throw new Error("Tipo de recompensa nao suportado.");
    const ref = await Banners.validarReferencia(tipo, referencia); if (!ref.valida) throw new Error(ref.erro);
    const quantidade = Number(dados.quantidade ?? 1); const peso = Number(dados.peso);
    if (!Number.isSafeInteger(quantidade) || quantidade <= 0) throw new Error("Quantidade deve ser um inteiro positivo.");
    if (!Number.isFinite(peso) || peso <= 0) throw new Error("Peso deve ser maior que zero.");
    const unica = dados.unica ? 1 : 0; const duplicata = dados.duplicateFragmentValue == null ? null : Number(dados.duplicateFragmentValue);
    if (duplicata != null && (!Number.isSafeInteger(duplicata) || duplicata <= 0)) throw new Error("duplicate_fragment_value invalido.");
    if (!unica && duplicata != null) throw new Error("Somente recompensa unica aceita duplicate_fragment_value.");
    const raridade = dados.raridade || ref.entidade?.tier || ref.entidade?.rank || ref.entidade?.raridade || null;
    return database.transaction(async query => {
        await lockBanner(query, banner.id);
        const existente = await query.get(`SELECT id FROM gacha_banner_rewards WHERE banner_id=? AND reward_type=?
            AND COALESCE(referencia_id, '')=COALESCE(?, '')`, [banner.id, tipo, referencia]);
        if (existente) throw new Error("Esta recompensa ja pertence ao pool; altere o peso do registro existente.");
    const garantiaConjunto = dados.garantidoConjunto ? 1 : 0;
    if (garantiaConjunto) {
        if (tipo !== "ITEM") throw new Error("A garantia de conjunto aceita somente recompensa do tipo ITEM.");
        const parte = await query.get("SELECT 1 FROM equipment_set_items WHERE item_id=?", [Number(referencia)]);
        if (!parte) throw new Error("A recompensa marcada para garantia deve ser uma peça de conjunto existente.");
    }
    const sql = `INSERT INTO gacha_banner_rewards (banner_id,reward_type,referencia_id,quantidade,peso,raridade,
            destaque_ordem,grande_premio,exclusivo_banner,unica,duplicate_fragment_value,garantido_conjunto,ativo) VALUES (?,?,?,?,?,?,NULL,0,?,?,?,?,1)`;
        const criado = await query.run(provider === "postgres" ? `${sql} RETURNING id` : sql,
            [banner.id, tipo, referencia, quantidade, peso, raridade, dados.exclusivoBanner ? 1 : 0, unica, duplicata, garantiaConjunto]);
        const recompensa = await query.get("SELECT * FROM gacha_banner_rewards WHERE id=?", [Number(criado.lastID)]);
        await auditar(query, actor, "ADD_REWARD", banner.id, null, recompensa);
        return recompensa;
    });
}

async function removeReward(administrador, bannerId, rewardId) {
    const actor = await autorizar(administrador); const banner = await bannerExistente(bannerId); exigirEditavel(banner);
    const recompensa = await database.get("SELECT * FROM gacha_banner_rewards WHERE id=? AND banner_id=?", [id(rewardId, "Recompensa"), banner.id]);
    if (!recompensa) throw new Error("Recompensa nao encontrada no Banner.");
    await database.transaction(async query => {
        await lockBanner(query, banner.id);
        await query.run("DELETE FROM gacha_banner_rewards WHERE id=? AND banner_id=?", [recompensa.id, banner.id]);
        await auditar(query, actor, "REMOVE_REWARD", banner.id, recompensa, null);
    });
    return true;
}

async function updateReward(administrador, bannerId, rewardId, dados) {
    const actor = await autorizar(administrador); const banner = await bannerExistente(bannerId); exigirEditavel(banner);
    const atual = await database.get("SELECT * FROM gacha_banner_rewards WHERE id=? AND banner_id=?", [id(rewardId, "Recompensa"), banner.id]);
    if (!atual) throw new Error("Recompensa nao encontrada no Banner.");
    const peso = dados.peso === undefined ? Number(atual.peso) : Number(dados.peso);
    const quantidade = dados.quantidade === undefined ? Number(atual.quantidade) : Number(dados.quantidade);
    const ativo = dados.ativo === undefined ? Number(atual.ativo ?? 1) : (dados.ativo ? 1 : 0);
    const unica = dados.unica === undefined ? Number(atual.unica) : (dados.unica ? 1 : 0);
    const duplicata = dados.duplicateFragmentValue === undefined ? atual.duplicate_fragment_value : dados.duplicateFragmentValue;
    if (!Number.isFinite(peso) || peso <= 0) throw new Error("Peso deve ser maior que zero; use ativo=false para retirar do sorteio.");
    if (!Number.isSafeInteger(quantidade) || quantidade <= 0) throw new Error("Quantidade deve ser um inteiro positivo.");
    if (duplicata != null && (!Number.isSafeInteger(Number(duplicata)) || Number(duplicata) <= 0)) throw new Error("duplicate_fragment_value invalido.");
    if (!unica && duplicata != null) throw new Error("Somente recompensa unica aceita duplicate_fragment_value.");
    const novo = { ...atual, peso, quantidade, ativo, unica, duplicate_fragment_value: duplicata == null ? null : Number(duplicata) };
    await database.transaction(async query => {
        await lockBanner(query, banner.id);
        await query.run("UPDATE gacha_banner_rewards SET peso=?, quantidade=?, ativo=?, unica=?, duplicate_fragment_value=? WHERE id=? AND banner_id=?",
            [peso, quantidade, ativo, unica, novo.duplicate_fragment_value, atual.id, banner.id]);
        await auditar(query, actor, dados.peso === undefined ? "UPDATE_REWARD" : "UPDATE_WEIGHT", banner.id, atual, novo);
    });
    return novo;
}

async function setFeaturedRewards(administrador, bannerId, rewardIds) {
    const actor = await autorizar(administrador); const banner = await bannerExistente(bannerId); exigirEditavel(banner);
    const ids = [...new Set((rewardIds || []).map(valor => id(valor, "Destaque")))];
    if (ids.length !== 4) throw new Error("Informe exatamente 4 recompensas distintas.");
    const rows = await database.all(`SELECT * FROM gacha_banner_rewards WHERE banner_id=? AND id IN (${ids.map(() => "?").join(",")})`, [banner.id, ...ids]);
    if (rows.length !== 4) throw new Error("Todos os Destaques devem pertencer ao pool.");
    if (rows.some(item => Number(item.ativo ?? 1) !== 1)) throw new Error("Destaque deve estar ativo no pool.");
    const anterior = await Banners.getDestaquesDoBanner(banner.id);
    await database.transaction(async query => {
        await lockBanner(query, banner.id);
        await query.run("UPDATE gacha_banner_rewards SET destaque_ordem=NULL WHERE banner_id=?", [banner.id]);
        for (let indice = 0; indice < ids.length; indice++) await query.run("UPDATE gacha_banner_rewards SET destaque_ordem=? WHERE id=? AND banner_id=?", [indice + 1, ids[indice], banner.id]);
        await auditar(query, actor, "SET_FEATURED", banner.id, anterior.map(item => item.id), ids);
    });
    return Banners.getDestaquesDoBanner(banner.id);
}

async function setGrandPrize(administrador, bannerId, rewardId) {
    const actor = await autorizar(administrador); const banner = await bannerExistente(bannerId); exigirEditavel(banner);
    const recompensa = await database.get("SELECT * FROM gacha_banner_rewards WHERE id=? AND banner_id=?", [id(rewardId, "Grande Premio"), banner.id]);
    if (!recompensa) throw new Error("Grande Premio deve pertencer ao pool.");
    if (Number(recompensa.ativo ?? 1) !== 1) throw new Error("Grande Premio deve estar ativo no pool.");
    const anterior = await Banners.getGrandePremioDoBanner(banner.id);
    await database.transaction(async query => {
        await lockBanner(query, banner.id);
        await query.run("UPDATE gacha_banner_rewards SET grande_premio=0 WHERE banner_id=?", [banner.id]);
        await query.run("UPDATE gacha_banner_rewards SET grande_premio=1, destaque_ordem=NULL WHERE id=? AND banner_id=?", [recompensa.id, banner.id]);
        await auditar(query, actor, "SET_GRAND_PRIZE", banner.id, anterior?.id || null, recompensa.id);
    });
    return Banners.getGrandePremioDoBanner(banner.id);
}

async function rankDaRecompensa(recompensa) {
    const referencia = await Banners.validarReferencia(recompensa.reward_type, recompensa.referencia_id);
    const entidade = referencia.entidade;
    const rank = String(recompensa.rank_recompensa || entidade?.tier || entidade?.rank || "").toUpperCase();
    return RANKS.includes(rank) ? rank : null;
}

async function validateBanner(administrador, bannerId) {
    await autorizar(administrador);
    const base = await Banners.validarBanner(bannerId);
    if (!base.banner) return { valid: false, valido: false, errors: base.erros, erros: base.erros, warnings: [], avisos: [] };
    const erros = [...base.erros]; const avisos = [];
    if (base.banner.status === STATUS.ARCHIVED) erros.push("Banner arquivado nao pode ser ativado.");
    const sorteaveis = base.pool.filter(item => Number(item.ativo ?? 1) === 1 && Number(item.peso) > 0);
    if (!sorteaveis.length) erros.push("O pool nao possui recompensa sorteavel ativa.");
    if (sorteaveis.filter(item => item.destaque_ordem != null).length !== 4) erros.push("Os 4 Destaques precisam estar ativos e sorteaveis.");
    if (sorteaveis.filter(item => Number(item.grande_premio) === 1).length !== 1) erros.push("O Grande Premio precisa estar ativo e sorteavel.");
    for (const item of base.pool) if (TIPOS_INCOMPATIVEIS_MOTOR.has(item.reward_type)) erros.push(`${item.reward_type} ainda nao possui entrega oficial no motor.`);
    const ranks = new Set();
    for (const recompensa of sorteaveis) { const rank = await rankDaRecompensa(recompensa); if (rank) ranks.add(rank); }
    for (const rank of RANKS) if (!ranks.has(rank)) erros.push(`O Banner nao contem recompensa elegivel Rank ${rank} para a garantia de 10 giros.`);
    if (Number(base.banner.permanente) && (base.banner.inicio_em || base.banner.fim_em)) avisos.push("Banner permanente ignora as datas de disponibilidade.");
    return { valid: erros.length === 0, valido: erros.length === 0, errors: erros, erros, warnings: avisos, avisos, banner: base.banner, pool: base.pool, ranksDisponiveis: [...ranks] };
}

async function activateBanner(administrador, bannerId) {
    const actor = await autorizar(administrador); const validacao = await validateBanner(actor, bannerId);
    if (!validacao.valid) throw new Error(`Banner invalido: ${validacao.errors.join(" ")}`);
    const anterior = validacao.banner;
    await database.transaction(async query => {
        await query.run("UPDATE gacha_banners SET ativo=1, status='ACTIVE', atualizado_em=CURRENT_TIMESTAMP WHERE id=?", [anterior.id]);
        await auditar(query, actor, "ACTIVATE_BANNER", anterior.id, anterior, { ...anterior, ativo: 1, status: STATUS.ACTIVE });
    });
    return Banners.getBannerPorId(anterior.id);
}

async function deactivateBanner(administrador, bannerId) {
    const actor = await autorizar(administrador); const banner = await bannerExistente(bannerId);
    await database.transaction(async query => {
        await query.run("UPDATE gacha_banners SET ativo=0, status='INACTIVE', atualizado_em=CURRENT_TIMESTAMP WHERE id=?", [banner.id]);
        await auditar(query, actor, "DEACTIVATE_BANNER", banner.id, banner, { ...banner, ativo: 0, status: STATUS.INACTIVE });
    });
    return Banners.getBannerPorId(banner.id);
}

async function archiveBanner(administrador, bannerId) {
    const actor = await autorizar(administrador); const banner = await bannerExistente(bannerId);
    await database.transaction(async query => {
        await query.run("UPDATE gacha_banners SET ativo=0, status='ARCHIVED', atualizado_em=CURRENT_TIMESTAMP WHERE id=?", [banner.id]);
        await auditar(query, actor, "ARCHIVE_BANNER", banner.id, banner, { ...banner, ativo: 0, status: STATUS.ARCHIVED });
    });
    return Banners.getBannerPorId(banner.id);
}

async function deleteUnusedBanner(administrador, bannerId) {
    const actor = await autorizar(administrador); const banner = await bannerExistente(bannerId); exigirEditavel(banner);
    const pulls = Number((await database.get("SELECT COUNT(*) total FROM gacha_operacoes WHERE banner_id=?", [banner.id])).total);
    if (pulls > 0) throw new Error("Banner com historico nao pode ser apagado; arquive-o.");
    await database.transaction(async query => {
        await auditar(query, actor, "DELETE_UNUSED_BANNER", banner.id, banner, null);
        await query.run("DELETE FROM gacha_banner_rewards WHERE banner_id=?", [banner.id]);
        // A auditoria referencia o Banner; preservar identidade é preferível a apagar fisicamente.
        await query.run("UPDATE gacha_banners SET ativo=0, status='ARCHIVED' WHERE id=?", [banner.id]);
    });
    return { archived: true };
}

async function buscarRecompensas(administrador, filtros = {}) {
    await autorizar(administrador);
    const termo = `%${String(filtros.termo || "").trim()}%`; const params = [termo, termo];
    let sql = `SELECT i.id, i.nome, i.categoria AS tipo, i.tier AS rank, es.id AS conjunto_id, es.nome AS conjunto_nome
      FROM itens i LEFT JOIN equipment_set_items esi ON esi.item_id=i.id LEFT JOIN equipment_sets es ON es.id=esi.set_id
      WHERE (LOWER(i.nome) LIKE LOWER(?) OR CAST(i.id AS TEXT) LIKE ?)`;
    if (filtros.rank) { sql += " AND UPPER(i.tier)=?"; params.push(String(filtros.rank).toUpperCase()); }
    if (filtros.conjunto) { sql += " AND LOWER(es.nome) LIKE LOWER(?)"; params.push(`%${filtros.conjunto}%`); }
    sql += " ORDER BY i.nome LIMIT 50";
    return database.all(sql, params);
}

async function buscarConjuntos(administrador, filtros = {}) {
    await autorizar(administrador); const params = [`%${String(filtros.termo || "").trim()}%`];
    let sql = `SELECT es.id, es.nome, es.rank, COUNT(esi.item_id) pecas FROM equipment_sets es
      LEFT JOIN equipment_set_items esi ON esi.set_id=es.id WHERE LOWER(es.nome) LIKE LOWER(?)`;
    if (filtros.rank) { sql += " AND es.rank=?"; params.push(String(filtros.rank).toUpperCase()); }
    sql += " GROUP BY es.id, es.nome, es.rank ORDER BY es.nome LIMIT 50";
    const conjuntos = await database.all(sql, params);
    for (const conjunto of conjuntos) conjunto.itens = await database.all("SELECT i.id,i.nome,i.slot,i.tier AS rank FROM equipment_set_items esi JOIN itens i ON i.id=esi.item_id WHERE esi.set_id=? ORDER BY i.nome", [conjunto.id]);
    return conjuntos;
}

async function getBannerAdminView(administrador, bannerId) {
    await autorizar(administrador); const banner = await bannerExistente(bannerId); const pool = await Banners.getPoolDoBanner(banner.id);
    const totalPeso = pool.filter(item => Number(item.ativo ?? 1) === 1).reduce((soma, item) => soma + Number(item.peso), 0);
    const operacoes = Number((await database.get("SELECT COUNT(*) total FROM gacha_operacoes WHERE banner_id=?", [banner.id])).total);
    const detalhado = [];
    for (const item of pool) {
        const ref = await Banners.validarReferencia(item.reward_type, item.referencia_id);
        const conjunto = !TIPOS_ITEM.has(item.reward_type) || item.referencia_id == null ? null : await database.get(`SELECT es.id,es.nome,es.rank FROM equipment_set_items esi
            JOIN equipment_sets es ON es.id=esi.set_id WHERE esi.item_id=?`, [Number(item.referencia_id)]);
        detalhado.push({ ...item, nome: ref.entidade?.nome || item.reward_type, rank: await rankDaRecompensa(item), raridade: item.raridade || null,
            chance: Number(item.ativo ?? 1) === 1 && totalPeso > 0 ? Number(item.peso) / totalPeso * 100 : 0, conjunto });
    }
    const validation = await validateBanner(administrador, banner.id);
    return { banner, pool: detalhado, pesoTotal: totalPeso, pulls: operacoes, hardPity: GachaEngine.HARD_PITY || 100, validation,
        preview: { nome: banner.nome, periodo: Number(banner.permanente) ? "Permanente" : `${banner.inicio_em} - ${banner.fim_em}`,
            destaques: detalhado.filter(item => item.destaque_ordem != null), grandePremio: detalhado.find(item => Number(item.grande_premio) === 1) || null } };
}

async function listBannersAdmin(administrador) {
    await autorizar(administrador); const banners = await Banners.listarBanners(); const lista = [];
    for (const banner of banners) { const view = await getBannerAdminView(administrador, banner.id); lista.push({ id: banner.id, nome: banner.nome,
        status: banner.status || (Number(banner.ativo) ? STATUS.ACTIVE : STATUS.DRAFT), permanente: Boolean(Number(banner.permanente)), inicio: banner.inicio_em,
        fim: banner.fim_em, recompensas: view.pool.length, destaques: view.pool.filter(item => item.destaque_ordem != null).length,
        grandePremio: view.pool.some(item => Number(item.grande_premio) === 1), valido: view.validation.valid }); }
    return lista;
}

module.exports = { STATUS, autorizar, createBanner, updateBanner, addReward, removeReward, updateReward, setFeaturedRewards,
    setGrandPrize, validateBanner, activateBanner, deactivateBanner, archiveBanner, deleteUnusedBanner,
    buscarRecompensas, buscarConjuntos, getBannerAdminView, listBannersAdmin };
