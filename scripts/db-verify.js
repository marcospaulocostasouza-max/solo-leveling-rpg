"use strict";

// PostgreSQL é o banco canônico. SQLite é arquivo legado: contagens entre os
// dois não são critério de falha nem indicam que o runtime está dessincronizado.
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { provider } = require("../packages/database/config");
const { query, close } = require("../packages/database/postgres");

const REQUIRED = ["jogadores", "itens", "inventario_jogador", "fichas_dungeon", "chaves_dungeon", "participacao_dungeon", "atividades_registro", "npc_relationships", "gacha_banners", "gacha_banner_rewards"];

async function main() {
  if (provider !== "postgres") throw new Error("DATABASE_PROVIDER precisa ser postgres para o ambiente canônico.");
  const tabelas = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()");
  const existentes = new Set(tabelas.rows.map(row => row.table_name));
  const faltantes = REQUIRED.filter(nome => !existentes.has(nome));
  const [semNome, dungeonsOrfas, banners] = await Promise.all([
    query("SELECT COUNT(*)::int AS total FROM jogadores WHERE nome IS NULL OR BTRIM(nome) = ''"),
    query("SELECT COUNT(*)::int AS total FROM fichas_dungeon f LEFT JOIN jogadores j ON j.id = f.jogador_id WHERE j.id IS NULL"),
    query("SELECT COUNT(*)::int AS total FROM gacha_banners")
  ]);
  console.log(JSON.stringify({
    provider,
    tabelasObrigatorias: REQUIRED.length,
    faltantes,
    jogadoresSemNome: semNome.rows[0].total,
    dungeonsOrfas: dungeonsOrfas.rows[0].total,
    banners: banners.rows[0].total
  }, null, 2));
  if (faltantes.length || Number(dungeonsOrfas.rows[0].total) > 0) process.exitCode = 1;
}

main().catch(error => { console.error(`Verificação falhou: ${error.message}`); process.exitCode = 1; }).finally(close);
