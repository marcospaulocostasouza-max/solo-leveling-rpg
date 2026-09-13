"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), sqlite3 = require("sqlite3");
const { CardinalAdminService } = require("../admin/service");
const { naturalBatch, describeBatch } = require("../admin/batch");

async function fixture(t) {
    const sqlite = new sqlite3.Database(":memory:"); let tail = Promise.resolve();
    const database = {
        run(sql, args = []) { return new Promise((resolve, reject) => sqlite.run(sql, args, function(error) { error ? reject(error) : resolve({ changes: this.changes }); })); },
        get(sql, args = []) { return new Promise((resolve, reject) => sqlite.get(sql, args, (error, row) => error ? reject(error) : resolve(row))); },
        all(sql, args = []) { return new Promise((resolve, reject) => sqlite.all(sql, args, (error, rows) => error ? reject(error) : resolve(rows))); },
        transaction(work) { const task = tail.then(async () => { await this.run("BEGIN IMMEDIATE"); try { const result = await work(this); await this.run("COMMIT"); return result; } catch (error) { await this.run("ROLLBACK"); throw error; } }); tail = task.catch(() => {}); return task; }
    };
    t.after(() => new Promise(resolve => sqlite.close(resolve)));
    for (const sql of [
        "CREATE TABLE administradores(numero TEXT,nome TEXT,nivel INTEGER,permissao TEXT)",
        "INSERT INTO administradores VALUES('adm','ADM',1,'avaliador'),('other','Outro ADM',1,'avaliador')",
        "CREATE TABLE jogadores(id INTEGER PRIMARY KEY,nome TEXT,numero TEXT,experiencia INTEGER DEFAULT 0,won INTEGER DEFAULT 0,cristais INTEGER DEFAULT 0,maestria INTEGER DEFAULT 0,rank TEXT DEFAULT 'E')",
        "INSERT INTO jogadores(id,nome,numero) VALUES(1,'Lúcia','554185053970@c.us'),(2,'Sung','22222222222@c.us'),(3,'Sung Jin','33333333333@c.us')",
        "CREATE TABLE itens(id INTEGER PRIMARY KEY,nome TEXT)",
        "INSERT INTO itens VALUES(1,'Picareta do Minerador'),(2,'Poção')",
        "CREATE TABLE inventario_jogador(id INTEGER PRIMARY KEY,jogador_id INTEGER,item_id INTEGER,quantidade INTEGER,equipado INTEGER,item_inicial INTEGER)"
    ]) await database.run(sql);
    const service = new CardinalAdminService({ database, writesEnabled: true, provider: "sqlite" });
    return { database, service, options: { channelId: "group" } };
}

test("XP e item para múltiplos destinos: identificar, confirmar e entregar exatamente uma vez", async t => {
    const { service, database, options } = await fixture(t);
    const prepared = await service.prepareNatural("adm", "Dê 100 XP para Lucia e Sung Jin; entregue 2 itens Poção para Lucia, Sung", options);
    assert.equal(prepared.operation.actions.length, 4);
    assert.match(describeBatch(prepared), /Lúcia \(ID 1\)/);
    assert.match(describeBatch(prepared), /Poção \(ID 2\)/);
    assert.equal((await database.get("SELECT SUM(experiencia) AS n FROM jogadores")).n, 0);
    assert.equal((await database.get("SELECT COUNT(*) AS n FROM inventario_jogador")).n, 0);
    const outcome = await service.confirm("adm", prepared.confirmation_id, options);
    assert.equal(outcome.actions.length, 4);
    assert.deepEqual(await database.all("SELECT experiencia FROM jogadores ORDER BY id"), [{ experiencia: 100 }, { experiencia: 0 }, { experiencia: 100 }]);
    assert.deepEqual(await database.all("SELECT jogador_id,item_id,quantidade FROM inventario_jogador ORDER BY jogador_id"), [{ jogador_id: 1, item_id: 2, quantidade: 2 }, { jogador_id: 2, item_id: 2, quantidade: 2 }]);
    await assert.rejects(service.confirm("adm", prepared.confirmation_id, options), { code: "CARDINAL_CONFIRMATION_EXPIRED" });
    assert.equal((await database.get("SELECT COUNT(*) AS n FROM cardinal_admin_operations")).n, 4);
});

test("destino parcial, inexistente e objeto desconhecido bloqueiam o lote inteiro", async t => {
    const { service, database } = await fixture(t);
    for (const command of ["dê 100 XP para Lucia, Sun", "dê 100 XP para Lucia, Desconhecido", "entregue o item Inexistente para Lucia, Sung", "dê 100 XP para todos", "dê 100 XP para 2 jogadores"]) await assert.rejects(service.prepareNatural("adm", command));
    assert.equal((await database.get("SELECT SUM(experiencia) AS n FROM jogadores")).n, 0);
    await service.repository.initialize();
    assert.equal((await database.get("SELECT COUNT(*) AS n FROM cardinal_admin_confirmations")).n, 0);
});

test("telefone e ID identificam a mesma pessoa sem duplicar destinatários", async t => {
    const { service, options } = await fixture(t);
    const prepared = await service.prepareNatural("adm", "dê 100 XP para +55 41 8505-3970, ID 1, Lucia", options);
    assert.equal(prepared.operation.actions.length, 1);
    assert.equal(prepared.operation.actions[0].parameters.player, 1);
});

test("somente ADM autor, mesma conversa e plano ainda válido podem confirmar", async t => {
    const { service, database, options } = await fixture(t);
    const prepared = await service.prepareNatural("adm", "dê 100 XP para Lucia", options);
    await assert.rejects(service.confirm("other", prepared.confirmation_id, options));
    await assert.rejects(service.confirm("adm", prepared.confirmation_id, { channelId: "elsewhere" }));
    await assert.rejects(service.prepareNatural("player", "dê 100 XP para Lucia", options));
    await database.run("UPDATE cardinal_admin_confirmations SET expires_at='2000-01-01' WHERE confirmation_id=?", [prepared.confirmation_id]);
    await assert.rejects(service.confirm("adm", prepared.confirmation_id, options));
    assert.equal((await database.get("SELECT SUM(experiencia) AS n FROM jogadores")).n, 0);
});

test("falha durante execução desfaz todos os prêmios e permite corrigir e tentar novamente", async t => {
    const { service, database, options } = await fixture(t);
    const prepared = await service.prepareNatural("adm", "dê 100 XP para Lucia e Sung", options);
    const original = database.run; let failed = false;
    database.run = function(sql, args) { if (!failed && sql.startsWith("INSERT INTO cardinal_admin_operations") && args[0].endsWith("_1")) { failed = true; return Promise.reject(new Error("Simulated failure")); } return original.call(this, sql, args); };
    await assert.rejects(service.confirm("adm", prepared.confirmation_id, options), /Simulated failure/);
    assert.equal((await database.get("SELECT SUM(experiencia) AS n FROM jogadores")).n, 0);
    assert.equal((await database.get("SELECT COUNT(*) AS n FROM cardinal_admin_operations")).n, 0);
    assert.equal((await database.get("SELECT confirmed_at FROM cardinal_admin_confirmations WHERE confirmation_id=?", [prepared.confirmation_id])).confirmed_at, null);
    await service.confirm("adm", prepared.confirmation_id, options);
    assert.equal((await database.get("SELECT SUM(experiencia) AS n FROM jogadores")).n, 200);
});

test("todos os jogadores mantém a seleção apresentada; ordens acumulam e aceites concorrentes não duplicam", async t => {
    const { service, database, options } = await fixture(t);
    const prepared = await service.prepareNatural("adm", "dê 100 XP para todos os jogadores e dê 50 XP para Lucia", options);
    assert.equal(prepared.operation.actions.length, 4);
    await database.run("INSERT INTO jogadores(id,nome) VALUES(4,'Novo')");
    const results = await Promise.allSettled([service.confirm("adm", prepared.confirmation_id, options), service.confirm("adm", prepared.confirmation_id, options)]);
    assert.equal(results.filter(row => row.status === "fulfilled").length, 1);
    assert.deepEqual(await database.all("SELECT experiencia FROM jogadores ORDER BY id"), [{ experiencia: 150 }, { experiencia: 100 }, { experiencia: 100 }, { experiencia: 0 }]);
});

test("nome alterado, cancelamento e plano novo exigem nova identificação", async t => {
    const { service, database, options } = await fixture(t);
    const old = await service.prepareNatural("adm", "dê 100 XP para Lucia", options);
    await database.run("UPDATE jogadores SET nome='Renomeada' WHERE id=1");
    await assert.rejects(service.confirm("adm", old.confirmation_id, options), /mudou/);
    const next = await service.prepareNatural("adm", "dê 100 XP para Renomeada", options);
    await assert.rejects(service.confirm("adm", old.confirmation_id, options));
    assert.equal((await service.pendingBatch("adm", "group")).confirmation_id, next.confirmation_id);
    await service.cancelBatch("adm", "group");
    await assert.rejects(service.confirm("adm", next.confirmation_id, options));
});

test("lote grande e simulação; lista não entregue impede confirmação", async t => {
    const { service, database, options } = await fixture(t);
    for (let id = 4; id <= 103; id++) await database.run("INSERT INTO jogadores(id,nome) VALUES(?,?)", [id, `Player ${id}`]);
    const simulation = await service.prepareNatural("adm", "dê 100 XP para todos os jogadores", { ...options, dryRun: true });
    assert.equal(simulation.operation.actions.length, 103);
    assert.equal(simulation.confirmation_id, undefined);
    assert.equal((await database.get("SELECT SUM(experiencia) AS n FROM jogadores")).n, 0);
    const large = await service.prepareNatural("adm", "dê 100 XP para todos os jogadores", options);
    assert.equal((await service.confirm("adm", large.confirmation_id, options)).actions.length, 103);
    assert.equal((await database.get("SELECT SUM(experiencia) AS n FROM jogadores")).n, 10300);
    const prepared = await service.prepareNatural("adm", "dê 100 XP para Lucia", { ...options, requireDelivery: true });
    await assert.rejects(service.confirm("adm", prepared.confirmation_id, options), /lista completa/);
    await service.markBatchReady("adm", prepared.confirmation_id, "group");
    await service.confirm("adm", prepared.confirmation_id, options);
});

test("nomes com e podem ser delimitados por aspas", () => {
    const actions = naturalBatch('dê 100 XP para "Lua e Sol", "Sung Jin"');
    assert.deepEqual(actions[0].parameters.players, ["Lua e Sol", "Sung Jin"]);
});

test("reentrega da mensagem original reutiliza o plano e não recria prêmios já confirmados", async t => {
    const { service, database, options } = await fixture(t);
    const request = { ...options, requestId: "original-message" };
    const prepared = await service.prepareNatural("adm", "dê 100 XP para Lucia", request);
    const replay = await service.prepareNatural("adm", "dê 100 XP para Lucia", request);
    assert.equal(replay.confirmation_id, prepared.confirmation_id);
    await service.confirm("adm", prepared.confirmation_id, options);
    const completed = await service.prepareNatural("adm", "dê 100 XP para Lucia", request);
    assert.equal(completed.already_applied, true);
    assert.equal((await database.get("SELECT experiencia FROM jogadores WHERE id=1")).experiencia, 100);
    assert.equal((await database.get("SELECT COUNT(*) AS n FROM cardinal_admin_confirmations")).n, 1);
});

test("modelo interpreta tarefas variadas; objeto inventado ou dados ausentes bloqueiam preparação", async t => {
    const { service, options } = await fixture(t);
    service.client = { chat: async () => ({ text: JSON.stringify({ actions: [
        { intent: "give_xp", parameters: { players: ["Lucia", "Sung"], amount: 200 } },
        { intent: "give_item", parameters: { players: ["Sung Jin"], item: "Poção", quantity: 1 } }
    ] }) }) };
    const prepared = await service.prepareNatural("adm", "Por favor premie Lucia e Sung com 200 XP e dê 1 Poção para Sung Jin", options);
    assert.equal(prepared.operation.actions.length, 3);
    service.client = { chat: async () => ({ text: JSON.stringify({ actions: [{ intent: "give_xp", parameters: { player: "Sung", amount: 100 } }] }) }) };
    await assert.rejects(service.prepareNatural("adm", "Premie Lucia com 100 XP", options), /não foi informado/);
    service.client = { chat: async () => ({ text: JSON.stringify({ actions: [], missing: "Qual é o item e quais são os destinos?" }) }) };
    await assert.rejects(service.prepareNatural("adm", "Dê aquele item", options), /Qual é o item/);
});
