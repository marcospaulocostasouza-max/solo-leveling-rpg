"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const sqlite3 = require("sqlite3");
const { CardinalAdminService } = require("../admin/service");
const { readRpg } = require("../admin/live-rpg");
const { planNatural } = require("../admin/planner");

test("ADM consulta estado atual, prevê, edita ficha e preserva autorização e idempotência", async t => {
    const sqlite = new sqlite3.Database(":memory:");
    const database = {
        run(sql, args = []) { return new Promise((resolve, reject) => sqlite.run(sql, args, function(error) { error ? reject(error) : resolve({ changes: this.changes }); })); },
        get(sql, args = []) { return new Promise((resolve, reject) => sqlite.get(sql, args, (error, row) => error ? reject(error) : resolve(row))); },
        all(sql, args = []) { return new Promise((resolve, reject) => sqlite.all(sql, args, (error, rows) => error ? reject(error) : resolve(rows))); },
        async transaction(work) { await this.run("BEGIN"); try { const result = await work(this); await this.run("COMMIT"); return result; } catch (error) { await this.run("ROLLBACK"); throw error; } }
    };
    t.after(() => new Promise(resolve => sqlite.close(resolve)));
    await database.run("CREATE TABLE administradores(numero TEXT,nome TEXT,nivel INTEGER,permissao TEXT)");
    await database.run("INSERT INTO administradores VALUES('adm','ADM',1,'avaliador')");
    await database.run("CREATE TABLE jogadores(id INTEGER PRIMARY KEY,nome TEXT,classe TEXT,rank TEXT,nivel INTEGER,token TEXT)");
    await database.run("INSERT INTO jogadores VALUES(1,'Lúcia','Mago','E',1,'credential-hidden')");
    await database.run("CREATE TABLE itens(id INTEGER PRIMARY KEY,nome TEXT)");
    await database.run("INSERT INTO itens VALUES(1,'Picareta')");
    const service = new CardinalAdminService({ database, writesEnabled: true });
    const plan = planNatural("Troque o nome do jogador Lucia para Shanjun");
    assert.deepEqual(plan.parameters, { player: "Lucia", changes: { nome: "Shanjun" } });
    const preview = await service.executePlan("adm", { ...plan, idempotency_key: "message-1" }, { dryRun: true });
    assert.equal((await database.get("SELECT nome FROM jogadores")).nome, "Lúcia");
    assert.deepEqual(preview.before, { nome: "Lúcia" });
    assert.deepEqual(preview.after, { nome: "Shanjun" });
    await service.executePlan("adm", { ...plan, parameters: preview._parameters, idempotency_key: "message-1" }, { confirmed: true });
    const replay = await service.executePlan("adm", { ...plan, idempotency_key: "message-1" }, { confirmed: true });
    assert.equal(replay.idempotent_replay, true);
    const answer = await readRpg(database, "adm", "Quem é o jogador Shanjun?");
    assert.match(answer.text, /Shanjun/);
    assert.doesNotMatch(answer.text, /credential-hidden|token:/);
    assert.match((await readRpg(database, "adm", "Quantos itens existem?")).text, /1 registros/);
    await database.run("INSERT INTO itens VALUES(2,'Espada')");
    assert.match((await readRpg(database, "adm", "Quantos itens existem?")).text, /2 registros/);
    await assert.rejects(readRpg(database, "player", "Quantos itens existem?"), { code: "CARDINAL_PERMISSION_DENIED" });
    await assert.rejects(service.executePlan("player", plan, { confirmed: true }), { code: "CARDINAL_PERMISSION_DENIED" });
    await assert.rejects(service.executePlan("adm", { intent: "edit_player", parameters: { player: "Shanjun", changes: { token: "changed" } } }, { dryRun: true }), { code: "CARDINAL_INVALID_INPUT" });
    assert.equal((await database.get("SELECT COUNT(*) AS n FROM cardinal_admin_operations WHERE status='SUCCESS'")).n, 1);
});

test("comando real apresenta o plano, aguarda aceite e bloqueia lista não entregue", async () => {
    const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
    const source = fs.readFileSync(path.resolve(__dirname, "../../apps/bot/src/commands/cardinalAdmin.js"), "utf8");
    async function run(failExplanation) {
        const events = [], module = { exports: {} }; let ready = false;
        const service = { ready: Promise.resolve(), writesEnabled: true,
            async prepareNatural(actor, text, options) { assert.equal(options.requireDelivery, true); events.push("preview"); return { confirmation_id: "confirm_test" }; },
            async markBatchReady() { ready = true; events.push("ready"); },
            async pendingBatch() { return { confirmation_id: "confirm_test" }; },
            async confirm(actor, id, options) { assert.equal(options.channelId, "group"); if (!ready) throw new Error("not delivered"); events.push("write"); return { actions: [{}] }; }
        };
        vm.runInNewContext(source, { module, console, require(name) {
            if (name === "../core/adminCore") return { isAdmin: async () => true };
            if (name === "../core/messageService") return { async send({ text }) { if (text === "identified-plan") { events.push("explanation"); return { sucesso: !failExplanation }; } events.push("response"); } };
            if (name.endsWith("cardinal/admin")) return { createAdminService: () => service };
            if (name.endsWith("admin/batch")) return { describeBatch: () => "identified-plan", describeCompleted: () => "complete" };
            if (name.endsWith("cardinal/presentation")) return { templates: {}, renderers: { whatsapp: { render: () => "error" } } };
            if (name === "./cardinalError") return { cardinalError: () => ({}) };
            return {};
        } });
        await module.exports({ author: "adm", from: "group", body: "!cardinal troque o nome do jogador Luna para Shanjun", id: { _serialized: "whatsapp-message" } });
        assert.equal(events.includes("write"), false);
        await module.exports({ author: "adm", from: "group", body: "!cardinal sim", id: { _serialized: "confirmation-message" } });
        return events;
    }
    assert.deepEqual(await run(false), ["preview", "explanation", "ready", "write", "response"]);
    assert.deepEqual(await run(true), ["preview", "explanation", "response", "response"]);
});
