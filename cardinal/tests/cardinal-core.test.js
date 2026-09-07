"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { CardinalClient, CardinalError, carregarConfiguracao } = require("../core");

const logger = { info() {}, warn() {}, error() {} };
function servidor(handler) {
    return new Promise(resolve => {
        const instance = http.createServer(handler);
        instance.listen(0, "127.0.0.1", () => resolve(instance));
    });
}
function config(port, extra = {}) { return { ...carregarConfiguracao({ CARDINAL_PORT: String(port) }), timeout_ms: 5000, ...extra, base_url: `http://127.0.0.1:${port}` }; }

test("configuração usa somente host local e contexto ampliado", () => {
    const value = carregarConfiguracao({});
    assert.equal(value.host, "127.0.0.1"); assert.equal(value.port, 8088); assert.equal(value.context_size, 16384); assert.equal(value.timeout_ms, 0);
    assert.throws(() => carregarConfiguracao({ CARDINAL_HOST: "0.0.0.0" }), /máquina local/);
});

test("health check reconhece llama.cpp disponível", async t => {
    const server = await servidor((request, response) => { response.setHeader("content-type", "application/json"); response.end(JSON.stringify({ status: "ok" })); });
    t.after(() => server.close()); const client = new CardinalClient({ config: config(server.address().port), logger });
    assert.equal((await client.healthCheck()).ok, true);
});

test("envia mensagem sem thinking e extrai resposta OpenAI compatível", async t => {
    let payload;
    const server = await servidor((request, response) => { let body = ""; request.on("data", chunk => { body += chunk; }); request.on("end", () => { payload = JSON.parse(body); response.setHeader("content-type", "application/json"); response.end(JSON.stringify({ choices: [{ message: { content: "Sou o Sistema Cardinal." } }], usage: { completion_tokens: 6 } })); }); });
    t.after(() => server.close()); const client = new CardinalClient({ config: config(server.address().port), logger });
    const result = await client.chat("Quem é você?"); assert.equal(result.text, "Sou o Sistema Cardinal.");
    assert.equal(payload.chat_template_kwargs.enable_thinking, false);
});

test("servidor offline não trava e retorna erro controlado", async () => {
    const client = new CardinalClient({ config: config(1, { timeout_ms: 100 }), logger });
    const health = await client.healthCheck(); assert.equal(health.ok, false); assert.equal(health.code, "MODEL_OFFLINE");
});

test("resposta vazia ou inválida é rejeitada", async t => {
    const server = await servidor((request, response) => { response.setHeader("content-type", "application/json"); response.end(JSON.stringify({ choices: [{ message: { content: "" } }] })); });
    t.after(() => server.close()); const client = new CardinalClient({ config: config(server.address().port), logger });
    await assert.rejects(client.chat("Teste"), error => error instanceof CardinalError && error.code === "INVALID_RESPONSE");
});
