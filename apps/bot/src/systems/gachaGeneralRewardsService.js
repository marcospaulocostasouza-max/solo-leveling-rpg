"use strict";

// Shared rewards sum to 93.3% at three stars and 2.75% at four stars.
// The remaining 3.25% of four stars belongs to each banner's featured set.
const database = require("../../../../packages/database");
const starterWeapons = require("../database/itens.json").armas || [];
const THREE_STAR_TOTAL = 93.3;
const FOUR_STAR_GENERAL_TOTAL = 2.75;

function rankDoBanner(banner) {
    const match = String(banner.nome || "").toUpperCase().match(/\bRANK\s*([EDCBAS])\b/);
    return match ? match[1] : "E";
}
function nextRank(rank) {
    const ranks = ["E", "D", "C", "B", "A", "S"];
    return ranks[Math.min(ranks.indexOf(rank) + 1, ranks.length - 1)] || "E";
}
async function ensureItem(nome, categoria, tier, extra = {}) {
    await database.run("INSERT INTO itens (nome,categoria,tier,descricao,arma,consumivel) VALUES (?,?,?,?,?,?) ON CONFLICT(nome) DO NOTHING", [nome, categoria, tier, extra.descricao || nome, extra.arma ? 1 : 0, extra.consumivel ? 1 : 0]);
    if (/^(Material de Dungeon Rank|Chave de Dungeon Rank) /.test(nome)) await database.run('UPDATE itens SET consumivel=1 WHERE nome=?', [nome]);
    return database.get("SELECT id,nome,tier FROM itens WHERE nome=?", [nome]);
}
async function recompensasBase(banner) {
    const rank = rankDoBanner(banner);
    const rows = [
        { reward_type: "XP", quantidade: 200, peso: 15, estrelas: 3 },
        { reward_type: "WON", quantidade: 5000, peso: 12, estrelas: 3 },
        { reward_type: "MAESTRIA", quantidade: 25, peso: 12, estrelas: 3 },
        { reward_type: "XP", quantidade: 500, peso: 0.5, estrelas: 4 },
        { reward_type: "XP", quantidade: 1000, peso: 0.25, estrelas: 4 },
        { reward_type: "WON", quantidade: 10000, peso: 0.5, estrelas: 4 },
        { reward_type: "WON", quantidade: 20000, peso: 0.25, estrelas: 4 },
        { reward_type: "MAESTRIA", quantidade: 50, peso: 0.5, estrelas: 4 },
        { reward_type: "MAESTRIA", quantidade: 100, peso: 0.25, estrelas: 4 }
    ];
    const weaponWeight = 30.3 / Math.max(starterWeapons.length, 1);
    for (const weapon of starterWeapons) {
        const item = await ensureItem(weapon.nome, weapon.categoria || "Arma", "E", { arma: true, descricao: weapon.descricao || "Arma simples obtida em Banner." });
        rows.push({ reward_type: "ITEM", referencia_id: String(item.id), quantidade: 1, peso: weaponWeight, estrelas: 3 });
    }
    const material = await ensureItem(`Material de Dungeon Rank ${rank}`, "Material", rank, { consumivel: true, descricao: `Use !usar para sortear um material da loja deste rank. Material de craft obtido em Banner Rank ${rank}.` });
    const materialRaro = await ensureItem(`Material de Dungeon Rank ${nextRank(rank)}`, "Material", nextRank(rank), { consumivel: true, descricao: `Use !usar para sortear um material da loja deste rank. Material de craft raro obtido em Banner Rank ${rank}.` });
    const nucleo = await ensureItem("Nucleo de Monstro Rank C", "Material", "C", { descricao: "Nucleo de monstro de Rank C." });
    const caixa = await ensureItem("Caixa de Item", "Caixa", rank, { consumivel: true, descricao: "Caixa de recompensa." });
    const chave = await ensureItem(`Chave de Dungeon Rank ${rank}`, "Chave", rank, { consumivel: true, descricao: `Chave para uma Dungeon Rank ${rank}.` });
    rows.push(
        { reward_type: "ITEM", referencia_id: String(material.id), quantidade: 1, peso: 12, estrelas: 3 },
        { reward_type: "ITEM", referencia_id: String(nucleo.id), quantidade: 1, peso: 5, estrelas: 3 },
        { reward_type: "ITEM", referencia_id: String(caixa.id), quantidade: 1, peso: 5, estrelas: 3 },
        { reward_type: "ITEM", referencia_id: String(chave.id), quantidade: 1, peso: 2, estrelas: 3 },
        { reward_type: "ITEM", referencia_id: String(materialRaro.id), quantidade: 1, peso: 0.5, estrelas: 4 }
    );
    return rows;
}
async function garantirTabela() {
    await database.run("CREATE TABLE IF NOT EXISTS gacha_general_banner_rewards (banner_id BIGINT NOT NULL, reward_id BIGINT NOT NULL, PRIMARY KEY (banner_id,reward_id))");
}
function raridade(estrelas) { return `${estrelas} estrelas`; }
async function sincronizarBanner(bannerId) {
    await garantirTabela();
    const banner = await database.get("SELECT * FROM gacha_banners WHERE id=?", [bannerId]);
    if (!banner) throw new Error("Banner nao encontrado.");
    const base = await recompensasBase(banner);
    await database.transaction(async query => {
        for (const item of base) {
            let row = await query.get("SELECT r.id FROM gacha_banner_rewards r WHERE r.banner_id=? AND r.reward_type=? AND COALESCE(r.referencia_id,'')=COALESCE(?, '') AND r.quantidade=? AND r.estrelas=?", [banner.id, item.reward_type, item.referencia_id || null, item.quantidade, item.estrelas]);
            if (!row) {
                const created = await query.run("INSERT INTO gacha_banner_rewards (banner_id,reward_type,referencia_id,quantidade,peso,raridade,estrelas,destaque_ordem,grande_premio,exclusivo_banner,unica,ativo,garantido_conjunto) VALUES (?,?,?,?,?,?,?,NULL,0,0,0,1,0) RETURNING id", [banner.id, item.reward_type, item.referencia_id || null, item.quantidade, item.peso, raridade(item.estrelas), item.estrelas]);
                row = { id: Number(created.lastID) };
            }
            await query.run("INSERT INTO gacha_general_banner_rewards (banner_id,reward_id) VALUES (?,?) ON CONFLICT DO NOTHING", [banner.id, row.id]);
            await query.run("UPDATE gacha_banner_rewards SET peso=?, raridade=?, estrelas=?, ativo=1 WHERE id=?", [item.peso, raridade(item.estrelas), item.estrelas, row.id]);
        }
        // Older banners used a single 93.3% placeholder reward.  Once the
        // common pool exists it must no longer remain alongside it.
        await query.run("UPDATE gacha_banner_rewards SET ativo=0 WHERE banner_id=? AND estrelas=3 AND peso>=90 AND id NOT IN (SELECT reward_id FROM gacha_general_banner_rewards WHERE banner_id=?)", [banner.id, banner.id]);
        const featured = await query.all("SELECT id FROM gacha_banner_rewards WHERE banner_id=? AND ativo=1 AND garantido_conjunto=1 AND id NOT IN (SELECT reward_id FROM gacha_general_banner_rewards WHERE banner_id=?)", [banner.id, banner.id]);
        if (featured.length) {
            const perFeatured = (6 - FOUR_STAR_GENERAL_TOTAL) / featured.length;
            for (const item of featured) await query.run("UPDATE gacha_banner_rewards SET peso=?, raridade=?, estrelas=4 WHERE id=?", [perFeatured, raridade(4), item.id]);
        }
        const general = await query.all("SELECT reward_id FROM gacha_general_banner_rewards WHERE banner_id=?", [banner.id]);
        const ids = new Set(general.map(row => Number(row.reward_id)));
        const pool = await query.all("SELECT id,estrelas,peso FROM gacha_banner_rewards WHERE banner_id=? AND ativo=1", [banner.id]);
        const threeStars = pool.filter(row => ids.has(Number(row.id)) && Number(row.estrelas) === 3).reduce((sum, row) => sum + Number(row.peso), 0);
        if (Math.abs(threeStars - THREE_STAR_TOTAL) > 0.0001) throw new Error("Pool geral de 3 estrelas nao fecha em 93.3%.");
    });
}
async function sincronizarTodos() {
    const banners = await database.all("SELECT id FROM gacha_banners WHERE status <> 'ARCHIVED'");
    for (const banner of banners) await sincronizarBanner(banner.id);
}
module.exports = { sincronizarBanner, sincronizarTodos, rankDoBanner, THREE_STAR_TOTAL, FOUR_STAR_GENERAL_TOTAL };
