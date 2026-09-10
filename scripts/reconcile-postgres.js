"use strict";

/**
 * Reconcilia conteúdo seguro do SQLite legado com o PostgreSQL canônico.
 *
 * Nunca limpa PostgreSQL e nunca copia jogadores por ID: os dois bancos
 * possuem identidades numéricas divergentes. O Gacha é migrado por nome de
 * item e recebe novos IDs no PostgreSQL, evitando que uma recompensa aponte
 * para outro item apenas por ter o mesmo número antigo.
 *
 * Uso:
 *   node scripts/reconcile-postgres.js          # relatório, sem gravar
 *   node scripts/reconcile-postgres.js --apply  # aplica a reconciliação
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const sqlite3 = require("sqlite3").verbose();
const { query, close } = require("../packages/database/postgres");
const shared = require("../packages/database");

const APPLY = process.argv.includes("--apply");
const sqlite = new sqlite3.Database(path.resolve(__dirname, "../apps/bot/src/database/rpg.db"), sqlite3.OPEN_READONLY);
const allSqlite = (sql, params = []) => new Promise((resolve, reject) => sqlite.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows || [])));
const quote = value => `"${String(value).replace(/"/g, '""')}"`;
const normalizarNome = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

async function colunasComuns(tabela, excluir = []) {
  const origem = await allSqlite(`PRAGMA table_info(${quote(tabela)})`);
  const destino = await query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1",
    [tabela]
  );
  const permitidas = new Set(destino.rows.map(row => row.column_name));
  return origem.map(row => row.name).filter(nome => permitidas.has(nome) && !excluir.includes(nome));
}

async function obterOuMigrarItem(itemLegado, colunas) {
  const existente = await query("SELECT id, nome FROM itens WHERE LOWER(nome) = LOWER($1) LIMIT 1", [itemLegado.nome]);
  if (existente.rowCount) return { id: Number(existente.rows[0].id), criado: false };
  if (!APPLY) return { id: null, criado: true };

  const valores = colunas.map(coluna => itemLegado[coluna]);
  const marcadores = colunas.map((_, indice) => `$${indice + 1}`).join(", ");
  const inserido = await query(
    `INSERT INTO itens (${colunas.map(quote).join(", ")}) VALUES (${marcadores}) RETURNING id`,
    valores
  );
  return { id: Number(inserido.rows[0].id), criado: true };
}

async function reconciliarGacha() {
  const [banners, recompensas, raros] = await Promise.all([
    allSqlite("SELECT * FROM gacha_banners"),
    allSqlite("SELECT * FROM gacha_banner_rewards"),
    allSqlite("SELECT * FROM banner_rare_items")
  ]);
  if (!banners.length) return { itensCriados: 0, bannersCriados: 0, recompensasCriadas: 0, rarosCriados: 0 };

  const idsReferenciados = new Set([
    ...raros.map(linha => Number(linha.item_id)),
    ...recompensas.filter(linha => /^ITEM/.test(String(linha.reward_type))).map(linha => Number(linha.referencia_id))
  ].filter(Number.isSafeInteger));
  const itensLegados = await allSqlite(`SELECT * FROM itens WHERE id IN (${[...idsReferenciados].map(() => "?").join(",")})`, [...idsReferenciados]);
  const itensPorId = new Map(itensLegados.map(item => [Number(item.id), item]));
  const colunasItem = await colunasComuns("itens", ["id"]);
  const itemMap = new Map();
  let itensCriados = 0;

  for (const [idLegado, item] of itensPorId) {
    const resultado = await obterOuMigrarItem(item, colunasItem);
    if (resultado.criado) itensCriados += 1;
    // No relatório seco não há ID novo do PostgreSQL ainda; um marcador
    // mantém a validação de referências sem efetuar escrita.
    if (resultado.id || !APPLY) itemMap.set(idLegado, resultado.id || `DRY_RUN_${idLegado}`);
  }

  let bannersCriados = 0;
  let recompensasCriadas = 0;
  let rarosCriados = 0;
  const colunasBanner = await colunasComuns("gacha_banners", ["id"]);
  const colunasRecompensa = await colunasComuns("gacha_banner_rewards", ["id", "banner_id"]);

  for (const banner of banners) {
    let encontrado = await query("SELECT id FROM gacha_banners WHERE LOWER(nome) = LOWER($1) LIMIT 1", [banner.nome]);
    let bannerId = encontrado.rowCount ? Number(encontrado.rows[0].id) : null;
    if (!bannerId && !APPLY) bannersCriados += 1;
    if (!bannerId && APPLY) {
      const valores = colunasBanner.map(coluna => banner[coluna]);
      const inserido = await query(
        `INSERT INTO gacha_banners (${colunasBanner.map(quote).join(", ")}) VALUES (${colunasBanner.map((_, indice) => `$${indice + 1}`).join(", ")}) RETURNING id`,
        valores
      );
      bannerId = Number(inserido.rows[0].id);
      bannersCriados += 1;
    }

    for (const premio of recompensas.filter(linha => Number(linha.banner_id) === Number(banner.id))) {
      let referenciaId = premio.referencia_id;
      if (/^ITEM/.test(String(premio.reward_type))) {
        referenciaId = itemMap.get(Number(premio.referencia_id));
        if (!referenciaId) throw new Error(`Item legado ${premio.referencia_id} não foi encontrado para a recompensa ${premio.id}.`);
      }
      const existente = await query(
        "SELECT id FROM gacha_banner_rewards WHERE banner_id = $1 AND reward_type = $2 AND COALESCE(referencia_id, '') = COALESCE($3, '') LIMIT 1",
        [bannerId, premio.reward_type, String(referenciaId || "")]
      );
      if (existente.rowCount) continue;
      if (!APPLY) { recompensasCriadas += 1; continue; }
      const valores = colunasRecompensa.map(coluna => coluna === "referencia_id" ? String(referenciaId || "") : premio[coluna]);
      await query(
        `INSERT INTO gacha_banner_rewards (banner_id, ${colunasRecompensa.map(quote).join(", ")}) VALUES ($1, ${colunasRecompensa.map((_, indice) => `$${indice + 2}`).join(", ")})`,
        [bannerId, ...valores]
      );
      recompensasCriadas += 1;
    }
  }

  for (const raro of raros) {
    const itemId = itemMap.get(Number(raro.item_id));
    if (!itemId) continue;
    if (!APPLY) {
      const existe = await query("SELECT 1 FROM banner_rare_items WHERE item_id = $1", [itemId]);
      if (!existe.rowCount) rarosCriados += 1;
      continue;
    }
    const inserido = await query(
      "INSERT INTO banner_rare_items (item_id, criado_por, criado_em, tipo) VALUES ($1, $2, $3, $4) ON CONFLICT (item_id) DO NOTHING RETURNING item_id",
      [itemId, raro.criado_por, raro.criado_em, raro.tipo]
    );
    if (inserido.rowCount) rarosCriados += 1;
  }

  return { itensCriados, bannersCriados, recompensasCriadas, rarosCriados };
}

async function auditarIdentidades() {
  const jogadoresSqlite = await allSqlite("SELECT numero, nome FROM jogadores WHERE numero IS NOT NULL");
  const conflitos = [];
  for (const jogador of jogadoresSqlite) {
    const destino = await query("SELECT nome FROM jogadores WHERE numero = $1", [jogador.numero]);
    if (!destino.rowCount) continue;
    const origemNome = normalizarNome(jogador.nome);
    const destinoNome = normalizarNome(destino.rows[0].nome);
    if (origemNome && destinoNome && origemNome !== destinoNome) conflitos.push({ numero: jogador.numero, sqlite: jogador.nome, postgres: destino.rows[0].nome });
  }
  const semNome = await query("SELECT id, numero FROM jogadores WHERE nome IS NULL OR BTRIM(nome) = '' ORDER BY id");
  return { conflitos, semNome: semNome.rows };
}

async function main() {
  if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_SERVERLESS) throw new Error("DATABASE_URL ausente; reconciliação não iniciada.");
  await shared.ensureGachaEngineSchema();
  const [gacha, identidades] = await Promise.all([reconciliarGacha(), auditarIdentidades()]);
  console.log(JSON.stringify({ modo: APPLY ? "APPLY" : "DRY_RUN", gacha, identidades }, null, 2));
  if (!APPLY) console.log("Nenhuma alteração foi feita. Execute com --apply após revisar este relatório.");
}

main().catch(error => { console.error(`Reconciliação falhou: ${error.message}`); process.exitCode = 1; })
  .finally(async () => { sqlite.close(); await close(); });
