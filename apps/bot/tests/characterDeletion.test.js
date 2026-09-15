"use strict";

const assert = require("assert");
const sqlite3 = require("sqlite3").verbose();
const { createCharacterDeletionService } = require("../src/systems/characterDeletionService");

function fixture() {
  const raw = new sqlite3.Database(":memory:");
  const run = (sql, params = []) => new Promise((resolve, reject) => raw.run(sql, params, function (error) { error ? reject(error) : resolve({ changes: this.changes, lastID: this.lastID }); }));
  const get = (sql, params = []) => new Promise((resolve, reject) => raw.get(sql, params, (error, row) => error ? reject(error) : resolve(row || null)));
  const all = (sql, params = []) => new Promise((resolve, reject) => raw.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows || [])));
  const db = { run, get, all, transaction: async work => { await run("BEGIN"); try { const result = await work({ run, get, all }); await run("COMMIT"); return result; } catch (error) { await run("ROLLBACK"); throw error; } } };
  return { raw, db, run, get };
}

async function setup(f) {
  await f.run("PRAGMA foreign_keys=ON");
  await f.run("CREATE TABLE jogadores(id INTEGER PRIMARY KEY,numero TEXT UNIQUE,nome TEXT)");
  await f.run("CREATE TABLE processos_exclusao(numero TEXT PRIMARY KEY,jogador_nome TEXT,status TEXT,data_expiracao TEXT)");
  await f.run("CREATE TABLE inventario_jogador(id INTEGER PRIMARY KEY,jogador_id INTEGER REFERENCES jogadores(id),nome TEXT)");
  await f.run("CREATE TABLE gacha_operacoes(id INTEGER PRIMARY KEY,jogador_id INTEGER REFERENCES jogadores(id))");
  await f.run("CREATE TABLE gacha_resultados(id INTEGER PRIMARY KEY,operacao_id INTEGER REFERENCES gacha_operacoes(id) ON DELETE CASCADE)");
  await f.run("CREATE TABLE fichas_pendentes(numero TEXT PRIMARY KEY,dados TEXT)");
  await f.run("CREATE TABLE afinidades_pre_ficha(numero TEXT PRIMARY KEY,afinidade TEXT)");
  await f.run("CREATE TABLE paimon_mensagens(numero TEXT,conteudo TEXT)");
}

(async () => {
  const f = fixture();
  await setup(f);
  await f.run("INSERT INTO jogadores VALUES(1,'111','Alvo'),(2,'222','Outro')");
  await f.run("INSERT INTO inventario_jogador(jogador_id,nome) VALUES(1,'Espada'),(2,'Arco')");
  await f.run("INSERT INTO gacha_operacoes VALUES(10,1)");
  await f.run("INSERT INTO gacha_resultados VALUES(20,10)");
  await f.run("INSERT INTO fichas_pendentes VALUES('111','{}')");
  await f.run("INSERT INTO afinidades_pre_ficha VALUES('111','Areia')");
  await f.run("INSERT INTO paimon_mensagens VALUES('111','memória antiga'),('222','preservar')");
  await f.run("INSERT INTO processos_exclusao VALUES('111','Alvo','aguardando',?)", [new Date(Date.now() + 60000).toISOString()]);
  const result = await createCharacterDeletionService(f.db, "sqlite").remove("111");
  assert.equal(result.status, "deleted");
  assert.equal(await f.get("SELECT id FROM jogadores WHERE id=1"), null);
  assert.ok(await f.get("SELECT id FROM jogadores WHERE id=2"));
  assert.equal(await f.get("SELECT id FROM inventario_jogador WHERE jogador_id=1"), null);
  assert.ok(await f.get("SELECT id FROM inventario_jogador WHERE jogador_id=2"));
  assert.equal(await f.get("SELECT id FROM gacha_resultados WHERE id=20"), null);
  assert.equal(await f.get("SELECT numero FROM fichas_pendentes WHERE numero='111'"), null);
  assert.equal(await f.get("SELECT numero FROM afinidades_pre_ficha WHERE numero='111'"), null);
  assert.equal(await f.get("SELECT numero FROM paimon_mensagens WHERE numero='111'"), null);
  assert.ok(await f.get("SELECT numero FROM paimon_mensagens WHERE numero='222'"));
  assert.equal(await f.get("SELECT numero FROM processos_exclusao WHERE numero='111'"), null);
  f.raw.close();

  const rollback = fixture();
  await setup(rollback);
  await rollback.run("INSERT INTO jogadores VALUES(1,'333','Protegido')");
  await rollback.run("INSERT INTO inventario_jogador(jogador_id,nome) VALUES(1,'Item')");
  await rollback.run("INSERT INTO processos_exclusao VALUES('333','Protegido','aguardando',?)", [new Date(Date.now() + 60000).toISOString()]);
  await rollback.run("CREATE TRIGGER impedir_exclusao BEFORE DELETE ON jogadores BEGIN SELECT RAISE(ABORT,'falha simulada'); END");
  await assert.rejects(() => createCharacterDeletionService(rollback.db, "sqlite").remove("333"));
  assert.ok(await rollback.get("SELECT id FROM jogadores WHERE id=1"));
  assert.ok(await rollback.get("SELECT id FROM inventario_jogador WHERE jogador_id=1"));
  assert.ok(await rollback.get("SELECT numero FROM processos_exclusao WHERE numero='333'"));
  rollback.raw.close();
  console.log("characterDeletion.test.js: OK");
})().catch(error => { console.error(error); process.exitCode = 1; });
