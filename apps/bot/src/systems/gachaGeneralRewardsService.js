"use strict";

// Pool comum de todos os Banners. Os pontos totais do pool comum são 62;
// cada sincronização preserva 38% para o conteúdo específico do Banner.
const database = require("../../../../packages/database");
const starterWeapons = require("../database/itens.json").armas || [];
const COMMON_SHARE = 62;

function rankDoBanner(banner) {
    const match = String(banner.nome || "").toUpperCase().match(/\bRANK\s*([EDCBAS])\b/);
    return match ? match[1] : "E";
}
async function ensureItem(nome, categoria, tier, extra = {}) {
    await database.run(`INSERT INTO itens (nome,categoria,tier,descricao,arma,consumivel)
        VALUES (?,?,?,?,?,?) ON CONFLICT(nome) DO NOTHING`, [nome, categoria, tier,
        extra.descricao || nome, extra.arma ? 1 : 0, extra.consumivel ? 1 : 0]);
    return database.get("SELECT id,nome,tier FROM itens WHERE nome=?", [nome]);
}
async function recompensasBase(banner) {
    const rank = rankDoBanner(banner);
    const rows = [
        { reward_type: "XP", referencia_id: null, quantidade: 200, unidade: 5 },
        { reward_type: "XP", referencia_id: null, quantidade: 500, unidade: 3 },
        { reward_type: "XP", referencia_id: null, quantidade: 1000, unidade: 1 },
        { reward_type: "WON", referencia_id: null, quantidade: 5000, unidade: 5 },
        { reward_type: "WON", referencia_id: null, quantidade: 10000, unidade: 3 },
        { reward_type: "WON", referencia_id: null, quantidade: 20000, unidade: 1 },
        { reward_type: "MAESTRIA", referencia_id: null, quantidade: 25, unidade: 5 },
        { reward_type: "MAESTRIA", referencia_id: null, quantidade: 50, unidade: 3 },
        { reward_type: "MAESTRIA", referencia_id: null, quantidade: 100, unidade: 1 }
    ];
    for (const weapon of starterWeapons) {
        const item = await ensureItem(weapon.nome, weapon.categoria || "Arma 1", weapon.tier || "E", { arma: true, descricao: "Arma inicial obtida em Banner." });
        rows.push({ reward_type: "ARMA", referencia_id: String(item.id), quantidade: 1, unidade: 12 / starterWeapons.length });
    }
    const material = await ensureItem(`Material de Dungeon Rank ${rank}`, "Material", rank, { descricao: `Material de craft obtido em Banner Rank ${rank}.` });
    const nucleo = await ensureItem("Núcleo de Monstro Rank C", "Material", "C", { descricao: "Núcleo de monstro de Rank C." });
    const caixa = await ensureItem("Caixa de Item", "Caixa", rank, { consumivel: true, descricao: "Caixa de recompensa." });
    rows.push(
        { reward_type: "MATERIAL", referencia_id: String(material.id), quantidade: 1, unidade: 10 },
        { reward_type: "MATERIAL", referencia_id: String(nucleo.id), quantidade: 1, unidade: 5 },
        { reward_type: "CAIXA", referencia_id: String(caixa.id), quantidade: 1, unidade: 6 },
        { reward_type: "CHAVE_DUNGEON", referencia_id: rank, quantidade: 1, unidade: 2 }
    );
    return rows;
}
async function garantirTabela() {
    await database.run(`CREATE TABLE IF NOT EXISTS gacha_general_banner_rewards (
        banner_id BIGINT NOT NULL, reward_id BIGINT NOT NULL, PRIMARY KEY (banner_id,reward_id))`);
}
async function sincronizarBanner(bannerId) {
    await garantirTabela();
    const banner = await database.get("SELECT * FROM gacha_banners WHERE id=?", [bannerId]);
    if (!banner) throw new Error("Banner não encontrado.");
    const base = await recompensasBase(banner);
    await database.transaction(async query => {
        for (const item of base) {
            let row = await query.get(`SELECT r.id FROM gacha_banner_rewards r JOIN gacha_general_banner_rewards g
                ON g.reward_id=r.id AND g.banner_id=r.banner_id WHERE r.banner_id=? AND r.reward_type=?
                AND COALESCE(r.referencia_id,'')=COALESCE(?, '') AND r.quantidade=?`, [banner.id, item.reward_type, item.referencia_id, item.quantidade]);
            if (!row) {
                const created = await query.run(`INSERT INTO gacha_banner_rewards (banner_id,reward_type,referencia_id,quantidade,peso,raridade,destaque_ordem,grande_premio,exclusivo_banner,unica,ativo)
                    VALUES (?,?,?,?,?,NULL,NULL,0,0,0,1) RETURNING id`, [banner.id, item.reward_type, item.referencia_id, item.quantidade, item.unidade]);
                const rewardId = Number(created.lastID);
                await query.run("INSERT INTO gacha_general_banner_rewards (banner_id,reward_id) VALUES (?,?) ON CONFLICT DO NOTHING", [banner.id, rewardId]);
            }
        }
        const geral = await query.all("SELECT reward_id FROM gacha_general_banner_rewards WHERE banner_id=?", [banner.id]);
        const ids = geral.map(row => Number(row.reward_id));
        const pool = await query.all("SELECT id,peso FROM gacha_banner_rewards WHERE banner_id=? AND ativo=1", [banner.id]);
        const custom = pool.filter(row => !ids.includes(Number(row.id)));
        const customTotal = custom.reduce((sum, row) => sum + Number(row.peso), 0) || 1;
        const generalTotal = customTotal * COMMON_SHARE / (100 - COMMON_SHARE);
        for (const item of base) {
            const row = await query.get(`SELECT r.id FROM gacha_banner_rewards r JOIN gacha_general_banner_rewards g
                ON g.reward_id=r.id AND g.banner_id=r.banner_id WHERE r.banner_id=? AND r.reward_type=?
                AND COALESCE(r.referencia_id,'')=COALESCE(?, '') AND r.quantidade=?`, [banner.id, item.reward_type, item.referencia_id, item.quantidade]);
            await query.run("UPDATE gacha_banner_rewards SET peso=? WHERE id=?", [generalTotal * item.unidade / COMMON_SHARE, row.id]);
        }
    });
}
async function sincronizarTodos() { const banners = await database.all("SELECT id FROM gacha_banners WHERE status <> 'ARCHIVED'"); for (const banner of banners) await sincronizarBanner(banner.id); }
module.exports = { sincronizarBanner, sincronizarTodos, rankDoBanner, COMMON_SHARE };
