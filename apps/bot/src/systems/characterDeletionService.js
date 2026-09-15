"use strict";

const database = require("../../../../packages/database");
const { provider } = require("../../../../packages/database/config");
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const quote = value => { if (!IDENTIFIER.test(value)) throw new Error(`Identificador inválido: ${value}`); return `"${value}"`; };

function buildSchema(tables, columns, foreignKeys) {
  const columnMap = new Map(tables.map(table => [table, new Set()]));
  for (const row of columns) columnMap.get(row.table_name)?.add(row.column_name);
  return { tables: new Set(tables), columns: columnMap, foreignKeys };
}

async function schema(query, selectedProvider = provider) {
  if (selectedProvider === "postgres") {
    const tables = (await query.all("SELECT table_name AS name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")).map(row => row.name);
    const columns = await query.all("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public'");
    const foreignKeys = await query.all(`SELECT tc.table_name,kcu.column_name,ccu.table_name AS foreign_table_name,ccu.column_name AS foreign_column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name AND ccu.table_schema=tc.table_schema WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public'`);
    return buildSchema(tables, columns, foreignKeys);
  }
  const tables = (await query.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'" )).map(row => row.name);
  const columns = [], foreignKeys = [];
  for (const table of tables) {
    for (const row of await query.all(`PRAGMA table_info(${quote(table)})`)) columns.push({ table_name: table, column_name: row.name });
    for (const row of await query.all(`PRAGMA foreign_key_list(${quote(table)})`)) foreignKeys.push({ table_name: table, column_name: row.from, foreign_table_name: row.table, foreign_column_name: row.to });
  }
  return buildSchema(tables, columns, foreignKeys);
}

function playerColumns(meta) {
  const result = new Map();
  for (const [table, columns] of meta.columns) if (table !== "jogadores" && columns.has("jogador_id")) result.set(table, new Set(["jogador_id"]));
  for (const fk of meta.foreignKeys) {
    if (fk.table_name === "jogadores" || fk.foreign_table_name !== "jogadores" || fk.foreign_column_name !== "id") continue;
    if (!result.has(fk.table_name)) result.set(fk.table_name, new Set());
    result.get(fk.table_name).add(fk.column_name);
  }
  return result;
}

function childFirstOrder(tables, foreignKeys) {
  const selected = new Set(tables), parents = new Map(tables.map(table => [table, []])), memo = new Map();
  for (const fk of foreignKeys) if (selected.has(fk.table_name) && selected.has(fk.foreign_table_name)) parents.get(fk.table_name).push(fk.foreign_table_name);
  const depth = (table, visiting = new Set()) => {
    if (memo.has(table)) return memo.get(table);
    if (visiting.has(table)) return 0;
    const next = new Set(visiting); next.add(table);
    const value = Math.max(0, ...parents.get(table).map(parent => 1 + depth(parent, next)));
    memo.set(table, value); return value;
  };
  return [...tables].sort((a, b) => depth(b) - depth(a) || a.localeCompare(b));
}

async function deleteWhere(query, table, columns, value) {
  const where = columns.map(column => `${quote(column)}=?`).join(" OR ");
  await query.run(`DELETE FROM ${quote(table)} WHERE ${where}`, columns.map(() => value));
}

function isExpired(value) { const timestamp = Date.parse(value); return Number.isFinite(timestamp) && timestamp <= Date.now(); }

function createCharacterDeletionService(db = database, selectedProvider = provider) {
  return { async remove(number) {
    return db.transaction(async query => {
      const pending = await query.get(selectedProvider === "postgres" ? "SELECT * FROM processos_exclusao WHERE numero=? AND status='aguardando' FOR UPDATE" : "SELECT * FROM processos_exclusao WHERE numero=? AND status='aguardando'", [number]);
      if (!pending) return { status: "not_pending" };
      if (isExpired(pending.data_expiracao)) { await query.run("DELETE FROM processos_exclusao WHERE numero=?", [number]); return { status: "expired" }; }
      const player = await query.get(selectedProvider === "postgres" ? "SELECT * FROM jogadores WHERE numero=? FOR UPDATE" : "SELECT * FROM jogadores WHERE numero=?", [number]);
      const meta = await schema(query, selectedProvider);
      let guildMembership = null;
      if (player && meta.tables.has("guilda_membros") && meta.columns.get("guilda_membros")?.has("cargo")) {
        guildMembership = await query.get("SELECT guilda_id,cargo FROM guilda_membros WHERE jogador_id=?", [player.id]);
        if (["líder", "lider"].includes(String(guildMembership?.cargo || "").toLowerCase())) {
          const error = new Error("Transfira a liderança ou dissolva sua guilda antes de apagar o personagem."); error.code = "GUILD_LEADER"; throw error;
        }
      }
      if (player) {
        const references = playerColumns(meta);
        for (const table of childFirstOrder([...references.keys()], meta.foreignKeys)) await deleteWhere(query, table, [...references.get(table)], player.id);
        if (guildMembership && meta.tables.has("guildas") && meta.columns.get("guildas")?.has("membros")) {
          await query.run("UPDATE guildas SET membros=CASE WHEN membros>0 THEN membros-1 ELSE 0 END WHERE id=?", [guildMembership.guilda_id]);
        }
        await query.run("DELETE FROM jogadores WHERE id=?", [player.id]);
      }
      // Registros que nascem antes da ficha não possuem jogador_id e precisam
      // ser limpos pelo número do WhatsApp.
      for (const table of ["fichas_pendentes", "afinidades_pre_ficha", "aprovacao_fichas", "compras_pendentes", "paimon_mensagens", "paimon_sessoes"]) {
        if (meta.tables.has(table) && meta.columns.get(table)?.has("numero")) await deleteWhere(query, table, ["numero"], number);
      }
      for (const table of ["habilidades_unicas_pendentes", "itens_unicos_pendentes"]) if (meta.tables.has(table) && meta.columns.get(table)?.has("criado_por")) await deleteWhere(query, table, ["criado_por"], number);
      await query.run("DELETE FROM processos_exclusao WHERE numero=?", [number]);
      return { status: "deleted", name: player?.nome || pending.jogador_nome || "dados de cadastro" };
    });
  }};
}

module.exports = { createCharacterDeletionService, isExpired, schema, playerColumns, childFirstOrder };
