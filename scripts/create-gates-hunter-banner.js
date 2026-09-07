"use strict";

// Idempotent content seed for the permanent Gates Hunter Rank D banner.
const database = require("../packages/database");
const { provider } = require("../packages/database/config");
const Sets = require("../apps/bot/src/systems/equipmentSetService");
const Banners = require("../apps/bot/src/systems/gachaBannerService");

const SET_NAME = "Caçador de Gates — Rank D";
const BANNER_NAME = "Caçador de Gates — Rank D";
const CREATOR = "SYSTEM:CAÇADOR_DE_GATES";
const pieces = [
  ["Anel Antigo de Caçador", "Acessório", "Anel", 0, 0, 0, 8, 4, 0, "Um anel escuro gravado com o selo de um portal fechado. Aguça a leitura de rastros e anomalias."],
  ["Calças de Combate Profundo de Caçador", "Armadura", "Calças", 0, 8, 12, 0, 0, 0, "Calças reforçadas para expedições longas em Gates. Absorvem impacto e preservam a mobilidade."],
  ["Casaco Escarlate de Caçador", "Armadura", "Peitoral", 8, 14, 0, 0, 0, 0, "Casaco vermelho-escuro de tecido encantado, feito para sobreviver à pressão das masmorras."],
  ["Máscara Rúnica de Caçador", "Armadura", "Cabeça", 0, 0, 0, 12, 0, 8, "Máscara rúnica de olhar rubro que filtra a névoa de mana e destaca ameaças ocultas."],
  ["Tridente Arcano de Caçador", "Arma", "Arma 2", 16, 0, 0, 0, 0, 12, "Tridente de aço negro alimentado por cristais de Gate. Conduz golpes físicos e fluxo arcano."],
  ["Botas de Travessia de Gates", "Armadura", "Botas", 0, 0, 14, 8, 0, 0, "Botas de sola rúnica que firmam o passo em pisos instáveis e passagens entre dimensões."]
];

async function insertWithId(sql, params) {
  const result = await database.run(provider === "postgres" ? `${sql} RETURNING id` : sql, params);
  return Number(result.lastID);
}
async function ensureItem([nome, categoria, slot, forca, resistencia, velocidade, sentidos, inteligencia, poderMagico, descricao]) {
  let item = await database.get("SELECT * FROM itens WHERE LOWER(nome)=LOWER(?)", [nome]);
  if (!item) {
    const id = await insertWithId(`INSERT INTO itens (nome,categoria,slot,tier,descricao,arma,armadura,escudo,acessorio,consumivel,forca_bonus,resistencia_bonus,velocidade_bonus,sentidos_bonus,inteligencia_bonus,poder_magico_bonus,efeito,item_unico)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`, [nome, categoria, slot, "D", descricao, categoria === "Arma" ? 1 : 0, categoria === "Armadura" ? 1 : 0, 0, categoria === "Acessório" ? 1 : 0, 0, forca, resistencia, velocidade, sentidos, inteligencia, poderMagico, "Peça do Conjunto Caçador de Gates."]);
    item = await database.get("SELECT * FROM itens WHERE id=?", [id]);
  }
  await database.run("INSERT INTO banner_rare_items (item_id,tipo,criado_por) VALUES (?, 'ITEM', ?) ON CONFLICT(item_id) DO NOTHING", [item.id, CREATOR]);
  return item;
}
async function ensureKikoku() {
  const nome = "Kikoku — Rank B";
  let item = await database.get("SELECT * FROM itens WHERE LOWER(nome)=LOWER(?)", [nome]);
  if (!item) {
    const descricao = "Kikoku, o Lamento do Oni, é uma enorme ōdachi guardada em uma bainha negra marcada por cruzes brancas.\nSua empunhadura arroxeada, os detalhes claros e a corda vermelha tornam sua presença impossível de confundir.\nMesmo grande e pesada, a lâmina conduz mana por toda a extensão antes de liberá-la em cada golpe.\nCom Água, sua afinidade torna a energia aquática uma corrente obediente ao fio da espada.\nNas mãos de um caçador físico e mágico, ela se torna uma extensão precisa de seu poder.";
    const id = await insertWithId(`INSERT INTO itens (nome,categoria,slot,tier,descricao,arma,armadura,escudo,acessorio,consumivel,forca_bonus,resistencia_bonus,velocidade_bonus,sentidos_bonus,inteligencia_bonus,poder_magico_bonus,efeito,item_unico)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`, [nome, "Arma", "Arma 2", "B", descricao, 1, 0, 0, 0, 0, 20, 0, 0, 0, 0, 16, "Cirurgia das Marés: enquanto Kikoku estiver equipada, Técnicas de Água recebem +20% de poder."]);
    item = await database.get("SELECT * FROM itens WHERE id=?", [id]);
  }
  await database.run("INSERT INTO banner_rare_items (item_id,tipo,criado_por) VALUES (?, 'ITEM', ?) ON CONFLICT(item_id) DO NOTHING", [item.id, CREATOR]);
  return item;
}

async function main() {
  await Promise.all([database.ensureGachaEngineSchema(), database.ensureEquipmentSetSchema()]);
  const itemIds = [];
  for (const piece of pieces) itemIds.push((await ensureItem(piece)).id);
  let set = await database.get("SELECT * FROM equipment_sets WHERE LOWER(nome)=LOWER(?)", [SET_NAME]);
  if (!set) {
    await Sets.criarConjuntoCompleto({
      nome: SET_NAME, rank: "D", descricao: "Equipamentos de expedição para caçadores que atravessam os portais mais sombrios.", itemIds,
      estagios: [
        { pecas: 2, forca: 5, resistencia: 5, descricao: "Rastro do Caçador: força e resistência elevadas." },
        { pecas: 4, forca: 10, resistencia: 10, velocidade: 5, descricao: "Passagem Segura: defesa reforçada e mobilidade em Gates." },
        { pecas: 6, forca: 15, resistencia: 15, velocidade: 10, sentidos: 5, poder_magico: 10, descricao: "Caçador de Gates: sintonia completa para enfrentar o desconhecido." }
      ]
    });
    set = await database.get("SELECT * FROM equipment_sets WHERE LOWER(nome)=LOWER(?)", [SET_NAME]);
  }
  let setItems = await database.all("SELECT i.* FROM equipment_set_items si JOIN itens i ON i.id=si.item_id WHERE si.set_id=? ORDER BY i.id", [set.id]);
  // The older catalog created this exact set with five visual pieces. Complete it
  // with the sixth slot required by the current 2/4/6 equipment-set rules.
  if (setItems.length === 5) {
    const botas = await ensureItem(pieces[5]);
    await database.run("INSERT INTO equipment_set_items (set_id,item_id) VALUES (?,?) ON CONFLICT(item_id) DO NOTHING", [set.id, botas.id]);
    setItems = await database.all("SELECT i.* FROM equipment_set_items si JOIN itens i ON i.id=si.item_id WHERE si.set_id=? ORDER BY i.id", [set.id]);
  }
  if (setItems.length < 6) throw new Error(`O conjunto ${SET_NAME} existe, mas possui somente ${setItems.length} peças.`);
  for (const item of setItems) await database.run("INSERT INTO banner_rare_items (item_id,tipo,criado_por) VALUES (?, 'ITEM', ?) ON CONFLICT(item_id) DO NOTHING", [item.id, CREATOR]);
  const kikoku = await ensureKikoku();
  let banner = await database.get("SELECT * FROM gacha_banners WHERE LOWER(nome)=LOWER(?)", [BANNER_NAME]);
  if (!banner) {
    banner = await Banners.criarBanner({ nome: BANNER_NAME, descricao: "Convergência de armas para os caçadores que enfrentam o desconhecido. Em cada invocação ×10, uma peça do Conjunto Caçador de Gates Rank D é garantida.", permanente: true });
    const rewards = [];
    for (const item of setItems) rewards.push(await Banners.adicionarRecompensa(banner.id, { tipo: "ITEM", referenciaId: item.id, quantidade: 1, peso: 10, garantidoConjunto: true }));
    const secreto = await Banners.adicionarRecompensa(banner.id, { tipo: "ITEM_ESPECIAL_BANNER", referenciaId: kikoku.id, quantidade: 1, peso: 1, unica: true, duplicateFragmentValue: 25, exclusivoBanner: true });
    await database.transaction(async query => {
      for (const [index, reward] of rewards.slice(0, 4).entries()) await query.run("UPDATE gacha_banner_rewards SET destaque_ordem=? WHERE id=?", [index + 1, reward.id]);
      await query.run("UPDATE gacha_banner_rewards SET grande_premio=1 WHERE id=?", [secreto.id]);
    });
    banner = await Banners.definirBannerAtivo(banner.id, true);
  }
  const pool = await Banners.getPoolDoBanner(banner.id);
  console.log(JSON.stringify({ banner: { id: banner.id, nome: banner.nome, ativo: banner.ativo, permanente: banner.permanente }, conjunto: { id: set.id, nome: set.nome, pecas: setItems.length }, kikoku: { id: kikoku.id, nome: kikoku.nome }, pool: { recompensas: pool.length, pecasGarantidasNo10x: pool.filter(item => Number(item.garantido_conjunto) === 1).length, grandePremio: pool.find(item => Number(item.grande_premio) === 1)?.referencia_id } }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
