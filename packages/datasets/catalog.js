"use strict";

// Compatibility adapter: the legacy bot catalog stays authoritative while items are
// progressively materialized into SQLite when a player buys them.
const { ITENS_LOJA } = require("../../apps/bot/src/utils/lojaItens");

const categoryMap = {
  "Slot de Cabeça": "Cabeça", "Slot de Corpo": "Corpo", "Slot de Pernas": "Pernas",
  "Slot de Pés": "Pés", "Slot de Acessórios": "Acessórios", "Item de Apoio": "Item de Apoio",
  "Arma 1": "Arma 1", "Arma 2": "Arma 2"
};
function bonusFields(text) {
  const fields = { forca_bonus: 0, resistencia_bonus: 0, velocidade_bonus: 0, sentidos_bonus: 0, inteligencia_bonus: 0, poder_magico_bonus: 0 };
  const map = { "forca": "forca_bonus", "força": "forca_bonus", "resistencia": "resistencia_bonus", "resistência": "resistencia_bonus", "agilidade": "velocidade_bonus", "velocidade": "velocidade_bonus", "sentidos": "sentidos_bonus", "inteligencia": "inteligencia_bonus", "inteligência": "inteligencia_bonus", "poder magico": "poder_magico_bonus", "poder mágico": "poder_magico_bonus" };
  for (const match of String(text || "").matchAll(/([^,:]+):\s*\+?(\d+)/g)) { const key = map[match[1].trim().toLowerCase()]; if (key) fields[key] += Number(match[2]); }
  return fields;
}
function listShopItems() {
  return Object.entries(ITENS_LOJA).flatMap(([rank, categories]) => Object.entries(categories).flatMap(([legacyCategory, items]) => items.map(item => ({ ...item, id: `legacy:${rank}:${encodeURIComponent(item.nome)}`, rank, categoria: categoryMap[legacyCategory] || legacyCategory, legacyCategory, ...bonusFields(item.bonus), consumivel: item.tipo === "consumivel" ? 1 : 0, arma: item.tipo === "arma" ? 1 : 0 }))));
}
function findShopItem(id) { return listShopItems().find(item => item.id === id) || null; }
module.exports = { listShopItems, findShopItem };
