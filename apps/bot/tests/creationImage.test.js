"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const { downloadCreationImage } = require("../src/utils/downloadCreationImage");
const image = { mimetype: "image/png", data: "aW1hZ2U=" };

test("normaliza o ID antes do download usado pela biblioteca WhatsApp", async () => {
    const msg = { id: { $1: "message-id" }, hasMedia: true, async downloadMedia() {
        assert.equal(this.id._serialized, "message-id");
        return image;
    } };
    assert.equal(await downloadCreationImage(msg), image);
});

test("preserva ID nativo e tenta novamente enquanto a mídia está carregando", async () => {
    let attempts = 0;
    const msg = { id: { _serialized: "native", $1: "other" }, hasMedia: true, async downloadMedia() {
        assert.equal(this.id._serialized, "native");
        return ++attempts === 1 ? undefined : image;
    } };
    assert.equal(await downloadCreationImage(msg), image);
    assert.equal(attempts, 2);
});

test("falha transitória permite nova tentativa; PDF não é imagem", async () => {
    let attempts = 0;
    assert.equal(await downloadCreationImage({ hasMedia: true, async downloadMedia() {
        if (++attempts === 1) throw new Error("download temporariamente indisponível");
        return image;
    } }), image);
    await assert.rejects(downloadCreationImage({ hasMedia: true, downloadMedia: async () => ({ ...image, mimetype: "application/pdf" }) }), /não é uma imagem/);
});

function wizard(tipo) {
    let state = { tipo, status: "AGUARDANDO_IMAGEM", dados: JSON.stringify({ nome: "Criação", bannerNome: "Criação", bannerId: 10, rank: "D", participantes: 3, xp: 50, won: 100 }) };
    const sent = [], saved = [];
    let fail = false;
    const database = {
        get: async () => state,
        run: async sql => { if (sql.startsWith("DELETE")) state = null; }
    };
    const store = async value => { if (fail) throw new Error("falha de persistência"); saved.push(value); };
    const filename = require.resolve("../src/systems/creationWizardService");
    const localRequire = createRequire(filename);
    const replacements = {
        "../../../../packages/database": database,
        "../core/messageService": { send: async ({ text }) => sent.push(text) },
        "./weeklyDungeonSystem": { liberar: async (actor, data) => store(data.imagem) },
        "./gachaAdminService": { updateBanner: async (actor, id, data) => { assert.equal(id, 10); await store(data.imagem); } }
    };
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(filename, "utf8"), { module, console, require: name => replacements[name] || localRequire(name) }, { filename });
    return { service: module.exports, sent, saved, state: () => state, fail: value => { fail = value; } };
}

for (const tipo of ["BANNER", "DUNGEON"]) {
    test(`${tipo}: imagem sem legenda é salva; sessão só é removida após sucesso`, async () => {
        const w = wizard(tipo);
        const msg = { from: "admin", body: "", id: { $1: "media-id" }, hasMedia: true, async downloadMedia() {
            assert.equal(this.id._serialized, "media-id"); return image;
        } };
        w.fail(true);
        assert.equal(await w.service.consumeMessage(msg), true);
        assert(w.state()); assert.equal(w.saved.length, 0);
        assert.match(w.sent.at(-1), /IMAGEM NÃO VINCULADA/);
        w.fail(false);
        assert.equal(await w.service.consumeMessage(msg), true);
        assert.equal(w.saved[0], "data:image/png;base64,aW1hZ2U=");
        assert.equal(w.state(), null); assert.match(w.sent.at(-1), /IMAGEM VINCULADA/);
    });
    test(`${tipo}: legenda explícita vai para o handler, sem anexar ao destino errado`, async () => {
        const w = wizard(tipo);
        assert.equal(await w.service.consumeMessage({ from: "admin", hasMedia: true, body: "!anexar imagem banner Outro", downloadMedia: () => { throw new Error("Não deve baixar aqui"); } }), false);
        assert(w.state()); assert.equal(w.saved.length, 0);
    });
}

test("download vazio mantém criação pendente e orienta reenvio", async () => {
    const w = wizard("DUNGEON");
    let attempts = 0;
    await w.service.consumeMessage({ from: "admin", hasMedia: true, downloadMedia: async () => { attempts++; } });
    assert.equal(attempts, 3); assert(w.state()); assert.equal(w.saved.length, 0);
    assert.match(w.sent.at(-1), /Reenvie a foto/);
});
