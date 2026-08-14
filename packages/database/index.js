"use strict";

/** Server-side shared-data access. PostgreSQL is selected by DATABASE_PROVIDER. Never import this in browser code. */
const fs = require("fs");
const path = require("path");
const { listShopItems, findShopItem } = require("../datasets/catalog");
const { provider } = require("./config");
const postgresCompat = require("./postgres-compat");

const DATABASE_PATH = path.resolve(__dirname, "../../apps/bot/src/database/rpg.db");
const MIGRATIONS_PATH = path.join(__dirname, "migrations");
let database;
let migrationPromise;

// Keep SQLite out of the Next/Vercel dependency graph. It is loaded only by a
// local rollback process after DATABASE_PROVIDER=sqlite has been selected.
function sqliteDriver() {
  const moduleName = ["sqlite", "3"].join("");
  return require(moduleName).verbose();
}

function getDatabase() {
  if (provider === "postgres") throw new Error("Acesso SQLite bloqueado: use os metodos async de packages/database.");
  if (!database) {
    const driver = sqliteDriver();
    database = new driver.Database(DATABASE_PATH);
    database.configure("busyTimeout", 5000);
    database.run("PRAGMA foreign_keys = ON");
  }
  return database;
}

function run(sql, params = []) {
  if (provider === "postgres") return postgresCompat.execute(sql, params).then(result => ({ lastID: result.rows?.[0]?.id, changes: result.rowCount }));
  return new Promise((resolve, reject) => getDatabase().run(sql, params, function (error) {
    if (error) reject(error); else resolve({ lastID: this.lastID, changes: this.changes });
  }));
}
function get(sql, params = []) {
  if (provider === "postgres") return postgresCompat.execute(sql, params).then(result => result.rows[0] || null);
  return new Promise((resolve, reject) => getDatabase().get(sql, params, (error, row) => error ? reject(error) : resolve(row || null)));
}
function all(sql, params = []) {
  if (provider === "postgres") return postgresCompat.execute(sql, params).then(result => result.rows || []);
  return new Promise((resolve, reject) => getDatabase().all(sql, params, (error, rows) => error ? reject(error) : resolve(rows || [])));
}
function exec(sql) {
  if (provider === "postgres") return postgresCompat.execute(sql).then(() => undefined);
  return new Promise((resolve, reject) => getDatabase().exec(sql, error => error ? reject(error) : resolve()));
}

async function applyMigrations() {
  if (provider === "postgres") return;
  if (migrationPromise) return migrationPromise;
  migrationPromise = (async () => {
    await run("CREATE TABLE IF NOT EXISTS schema_migrations (nome TEXT PRIMARY KEY, aplicada_em TEXT DEFAULT (datetime('now'))) ");
    for (const filename of fs.readdirSync(MIGRATIONS_PATH).filter(name => name.endsWith(".sql")).sort()) {
      if (await get("SELECT nome FROM schema_migrations WHERE nome = ?", [filename])) continue;
      await exec("BEGIN IMMEDIATE");
      try {
        await exec(fs.readFileSync(path.join(MIGRATIONS_PATH, filename), "utf8"));
        await run("INSERT INTO schema_migrations (nome) VALUES (?)", [filename]);
        await exec("COMMIT");
      } catch (error) {
        await exec("ROLLBACK").catch(() => undefined);
        throw error;
      }
    }
  })();
  return migrationPromise;
}

async function transaction(work) {
  if (provider === "postgres") return postgresCompat.transaction(async client => work({
    run: (sql, params = []) => postgresCompat.execute(sql, params, client).then(result => ({ lastID: result.rows?.[0]?.id, changes: result.rowCount })),
    get: (sql, params = []) => postgresCompat.execute(sql, params, client).then(result => result.rows[0] || null),
    all: (sql, params = []) => postgresCompat.execute(sql, params, client).then(result => result.rows || [])
  }));
  await applyMigrations();
  await exec("BEGIN IMMEDIATE");
  try {
    const result = await work({ run, get, all });
    await exec("COMMIT");
    return result;
  } catch (error) {
    await exec("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

const attributes = ["forca", "resistencia", "velocidade", "sentidos", "inteligencia", "poder_magico"];
const slots = { "Cabeça": 1, "Corpo": 1, "Acessórios": 4, "Item de Apoio": 1, "Pernas": 2, "Pés": 1, "Arma 1": 2, "Arma 2": 1 };
function itemSlot(item) {
  const category = String(item.categoria || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (category.includes("arma 1") || category.includes("arma1")) return "Arma 1";
  if (category.includes("arma 2") || category.includes("arma2")) return "Arma 2";
  if (category.includes("cabec")) return "Cabeça";
  if (category.includes("corpo")) return "Corpo";
  if (category.includes("perna")) return "Pernas";
  if (category.includes("pes") || category.includes("calcad") || category.includes("sapato") || category.includes("bota")) return "Pés";
  if (category.includes("acess")) return "Acessórios";
  if (category.includes("apoio") || category.includes("consum")) return "Item de Apoio";
  if (item.arma) return /2[- ]?fp|duas maos/i.test(item.descricao || "") ? "Arma 2" : "Arma 1";
  if (item.escudo) return "Pés"; // compatibilidade com a regra ativa do bot
  if (item.armadura) return "Corpo";
  return "Acessórios";
}
function isConsumable(item) {
  const category = String(item.categoria || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return Number(item.consumivel) === 1 || category.includes("consumivel") || category.includes("apoio");
}
function itemBonus(item) {
  return Object.fromEntries(attributes.map(key => [key, Number(item[`${key}_bonus`] || 0)]));
}
function classBonus(player) {
  const map = { Lutador: "forca", Assassino: "velocidade", Tanker: "resistencia", Ranger: "sentidos", Curador: "poder_magico", "Mago Elemental": "poder_magico", "Mago Invocador": "inteligencia", "Mago Barreira": "resistencia", "Mago Maldição": "poder_magico" };
  const key = map[player.classe];
  return Object.fromEntries(attributes.map(attribute => [attribute, attribute === key ? Math.floor(Number(player[`${attribute}_base`] || 0) * .5) : 0]));
}
async function recalculateAttributes(playerId, query = { get, all, run }) {
  const player = await query.get("SELECT * FROM jogadores WHERE id = ?", [playerId]);
  if (!player) throw new Error("Jogador não encontrado.");
  const equipped = await query.all("SELECT i.* FROM inventario_jogador inv JOIN itens i ON i.id = inv.item_id WHERE inv.jogador_id = ? AND inv.equipado = 1", [playerId]);
  const classBuff = classBonus(player);
  const total = Object.fromEntries(attributes.map(attribute => {
    const equipment = equipped.reduce((sum, item) => sum + itemBonus(item)[attribute], 0);
    return [attribute, Number(player[`${attribute}_base`] || 0) + Number(player[`${attribute}_buff`] || 0) + classBuff[attribute] + equipment];
  }));
  const mana = Math.max(100, total.inteligencia * 100 + Number(player.nivel || 1) * 10);
  const health = Math.max(100, total.resistencia * 3 + Number(player.nivel || 1) * 20);
  await query.run(`UPDATE jogadores SET ${attributes.map(key => `${key}_total = ?`).join(", ")}, mana_maxima = ?, vida_maxima = ?, mana_atual = MIN(mana_atual, ?), vida_atual = MIN(vida_atual, ?) WHERE id = ?`, [...attributes.map(key => total[key]), mana, health, mana, health, playerId]);
  return { base: Object.fromEntries(attributes.map(key => [key, Number(player[`${key}_base`] || 0)])), buffs: Object.fromEntries(attributes.map(key => [key, Number(player[`${key}_buff`] || 0) + classBuff[key]])), equipment: Object.fromEntries(attributes.map(key => [key, equipped.reduce((sum, item) => sum + itemBonus(item)[key], 0)])), total, manaMaxima: mana, vidaMaxima: health };
}

async function playerById(playerId) { await applyMigrations(); return get("SELECT * FROM jogadores WHERE id = ?", [playerId]); }
async function playerByPhone(phone) { await applyMigrations(); return get("SELECT * FROM jogadores WHERE numero = ?", [phone]); }
async function inventory(playerId) { await applyMigrations(); const rows = await all("SELECT i.*, inv.quantidade, inv.equipado, inv.item_inicial FROM inventario_jogador inv JOIN itens i ON i.id = inv.item_id WHERE inv.jogador_id = ? ORDER BY inv.equipado DESC, i.categoria, i.nome", [playerId]); return rows.map(item => ({ ...item, slot: itemSlot(item), consumivel: isConsumable(item), bonus: itemBonus(item) })); }
async function playerSkills(playerId) { await applyMigrations(); return all("SELECT t.*, jt.nivel, jt.experiencia, jt.equipada, jt.usos, jt.cooldown_atual FROM jogador_tecnicas jt JOIN tecnicas t ON t.id = jt.tecnica_id WHERE jt.jogador_id = ? ORDER BY t.classe, t.nome", [playerId]); }
async function playerTitles(playerId) { const player = await playerById(playerId); return player?.titulo ? [player.titulo] : []; }
async function playerGuild(playerId) { await applyMigrations(); return get("SELECT g.*, gm.cargo FROM guilda_membros gm JOIN guildas g ON g.id = gm.guilda_id WHERE gm.jogador_id = ?", [playerId]); }
async function playerLocation(playerId) { await applyMigrations(); return (await get("SELECT * FROM player_locations WHERE player_id = ?", [playerId])) || { player_id: playerId, country: "Coreia do Sul", city_id: "seoul", region_id: null, place_id: null }; }
async function isAdmin(playerId) { await applyMigrations(); const player = await playerById(playerId); if (!player) return false; return Boolean(await get("SELECT id FROM administradores WHERE numero = ?", [player.numero])); }
async function canInteractWithNpc(playerId, npcId) {
  const [location, npc] = await Promise.all([playerLocation(playerId), get("SELECT * FROM npc_location_overrides WHERE npc_id = ? AND active = 1", [npcId])]);
  const npcLocation = npc?.temporary_location_id || npc?.base_location_id || null;
  if (!npcLocation) return { allowed: false, reason: "A localização estruturada deste NPC ainda não foi configurada.", playerLocation: location, npcLocation: null };
  const allowed = [location.place_id, location.region_id, location.city_id].filter(Boolean).includes(npcLocation);
  return { allowed, reason: allowed ? "Jogador e NPC estão na mesma região permitida." : "Jogador e NPC não estão na mesma cidade/região permitida.", playerLocation: location, npcLocation };
}

async function equipItem(playerId, itemId) {
  return transaction(async query => {
    const item = await query.get("SELECT i.*, inv.equipado FROM inventario_jogador inv JOIN itens i ON i.id = inv.item_id WHERE inv.jogador_id = ? AND inv.item_id = ?", [playerId, itemId]);
    if (!item) throw new Error("Item não encontrado no inventário.");
    if (isConsumable(item)) throw new Error("Itens consumíveis não podem ser equipados.");
    const slot = itemSlot(item);
    if (item.equipado) await query.run("UPDATE inventario_jogador SET equipado = 0 WHERE jogador_id = ? AND item_id = ?", [playerId, itemId]);
    else {
      const equipped = await query.all("SELECT i.* FROM inventario_jogador inv JOIN itens i ON i.id = inv.item_id WHERE inv.jogador_id = ? AND inv.equipado = 1", [playerId]);
      const count = name => equipped.filter(row => itemSlot(row) === name).length;
      if (slot === "Arma 2") {
        if (count(slot) >= 1) throw new Error("Slot de Arma 2 já está ocupado.");
        for (const equippedItem of equipped.filter(row => itemSlot(row) === "Arma 1")) {
          await query.run("UPDATE inventario_jogador SET equipado = 0 WHERE jogador_id = ? AND item_id = ?", [playerId, equippedItem.id]);
        }
      } else if (slot === "Arma 1" && count("Arma 2")) throw new Error("Arma 2FP equipada bloqueia Arma 1.");
      else if (count(slot) >= slots[slot]) throw new Error(`Slot de ${slot} está cheio.`);
      await query.run("UPDATE inventario_jogador SET equipado = 1 WHERE jogador_id = ? AND item_id = ?", [playerId, itemId]);
    }
    const stats = await recalculateAttributes(playerId, query);
    return { item: item.nome, slot, equipped: !item.equipado, attributes: stats };
  });
}

async function shopCatalog() { await applyMigrations(); return listShopItems(); }
async function purchaseItem(playerId, itemId, quantity = 1) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("Quantidade invalida.");
  return transaction(async query => {
    let item = Number.isInteger(itemId) ? await query.get("SELECT * FROM itens WHERE id = ?", [itemId]) : null;
    const legacy = !item && typeof itemId === "string" ? findShopItem(itemId) : null;
    if (!item && legacy) {
      await query.run(`INSERT OR IGNORE INTO itens (nome, categoria, tier, descricao, arma, consumivel, efeito, forca_bonus, resistencia_bonus, velocidade_bonus, sentidos_bonus, inteligencia_bonus, poder_magico_bonus, preco, valor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [legacy.nome, legacy.categoria, legacy.rank, legacy.descricao, legacy.arma, legacy.consumivel, legacy.bonus, legacy.forca_bonus, legacy.resistencia_bonus, legacy.velocidade_bonus, legacy.sentidos_bonus, legacy.inteligencia_bonus, legacy.poder_magico_bonus, legacy.preco, legacy.preco]);
      item = await query.get("SELECT * FROM itens WHERE nome = ?", [legacy.nome]);
    }
    const player = await query.get("SELECT id, won FROM jogadores WHERE id = ?", [playerId]);
    if (!item || !player) throw new Error("Item ou jogador não encontrado.");
    // Um item legacy pode ja existir no banco por ter sido comprado no bot,
    // mas sem preco/valor preenchidos. Nesse caso o catalogo continua sendo
    // a fonte autoritativa do preco; nunca transforme a compra em gratuita.
    const unitPrice = Number(legacy ? legacy.preco : (item.preco ?? item.valor ?? 0));
    const currentWon = Number(player.won);
    const price = unitPrice * quantity;
    if (!Number.isSafeInteger(price) || price < 0) throw new Error("Preco invalido.");
    if (!Number.isSafeInteger(currentWon) || currentWon < price) throw new Error("Won insuficiente.");
    const debit = await query.run("UPDATE jogadores SET won = won - ? WHERE id = ? AND won >= ?", [price, playerId, price]);
    if (debit.changes !== 1) throw new Error("Won insuficiente.");
    // itemId pode ser o identificador textual legacy:*; o inventario sempre
    // referencia o ID numerico do item que foi encontrado/materializado acima.
    const inventoryItemId = Number(item.id);
    if (!Number.isSafeInteger(inventoryItemId)) throw new Error("Item invalido para o inventario.");
    const existing = await query.get("SELECT id FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [playerId, inventoryItemId]);
    if (existing) await query.run("UPDATE inventario_jogador SET quantidade = quantidade + ? WHERE id = ?", [quantity, existing.id]);
    else await query.run("INSERT INTO inventario_jogador (jogador_id, item_id, quantidade, equipado) VALUES (?, ?, ?, 0)", [playerId, inventoryItemId, quantity]);
    await query.run("INSERT INTO transacoes (jogador_id, valor, tipo, motivo, data) VALUES (?, ?, 'gasto', ?, datetime('now'))", [playerId, price, `Compra no site: ${item.nome}`]);
    await query.run("INSERT INTO compras (jogador_id, jogador_nome, item, preco, status, data, registrado_por) SELECT id, nome, ?, ?, 'Concluida', datetime('now'), 'site' FROM jogadores WHERE id = ?", [item.nome, price, playerId]);
    return { item: item.nome, price, won: currentWon - price };
  });
}

function normalizedClass(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase(); }
async function purchaseTechnique(playerId, techniqueId) {
  return transaction(async query => {
    const [player, technique] = await Promise.all([query.get("SELECT * FROM jogadores WHERE id = ?", [playerId]), query.get("SELECT * FROM tecnicas WHERE id = ?", [techniqueId])]);
    if (!player || !technique) throw new Error("Jogador ou técnica não encontrada.");
    const allowed = [player.classe, player.classe_avancada].map(normalizedClass).includes(normalizedClass(technique.classe)) || normalizedClass(technique.classe) === "todas";
    if (!allowed) throw new Error("Técnica incompatível com sua classe.");
    if (Number(player.nivel || 0) < Number(technique.nivel_desbloqueio || 1)) throw new Error("Nível insuficiente para esta técnica.");
    if (await query.get("SELECT id FROM jogador_tecnicas WHERE jogador_id = ? AND tecnica_id = ?", [playerId, techniqueId])) throw new Error("Você já possui esta técnica.");
    const advanced = technique.categoria === "classe avançada" || technique.fonte === "Classe Avançada" || technique.classe === "classe avançada";
    const count = advanced ? 0 : (await query.get("SELECT COUNT(*) AS total FROM jogador_tecnicas jt JOIN tecnicas t ON t.id = jt.tecnica_id WHERE jt.jogador_id = ? AND t.classe = ?", [playerId, technique.classe])).total;
    const cost = advanced ? 500 : 10 * (2 ** Number(count));
    const debit = await query.run("UPDATE jogadores SET maestria = maestria - ? WHERE id = ? AND maestria >= ?", [cost, playerId, cost]);
    if (debit.changes !== 1) throw new Error("Maestria insuficiente.");
    await query.run("INSERT INTO jogador_tecnicas (jogador_id, tecnica_id, nivel, experiencia) VALUES (?, ?, 1, 0)", [playerId, techniqueId]);
    await query.run("CREATE TABLE IF NOT EXISTS historico_maestria (id INTEGER PRIMARY KEY AUTOINCREMENT, jogador_id INTEGER NOT NULL, descricao TEXT NOT NULL, valor INTEGER NOT NULL, data TEXT NOT NULL)");
    await query.run("INSERT INTO historico_maestria (jogador_id, descricao, valor, data) VALUES (?, ?, ?, datetime('now'))", [playerId, `Técnica: ${technique.nome}`, cost]);
    return { technique: technique.nome, cost, maestria: Number(player.maestria || 0) - cost };
  });
}

module.exports = { DATABASE_PATH, getDatabase, applyMigrations, transaction, run, get, all, playerById, playerByPhone, inventory, playerSkills, playerTitles, playerGuild, playerLocation, isAdmin, canInteractWithNpc, itemSlot, slots, recalculateAttributes, equipItem, shopCatalog, purchaseItem, purchaseTechnique };
