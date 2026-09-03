"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { KnowledgeIndexer, KnowledgeRetriever, ContextBuilder } = require("../knowledge");
const { CardinalAssistant } = require("../core");

async function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "cardinal-knowledge-")); const docs = path.join(root, "docs"); fs.mkdirSync(docs);
    fs.writeFileSync(path.join(docs, "equipment.md"), "# Slots de Equipamento\nArma 1 possui dois espaços. Arma 2 possui um espaço e bloqueia Arma 1. Acessórios possuem quatro espaços.");
    fs.writeFileSync(path.join(docs, "guilds.md"), "# Guildas\nUma guilda sobe de nível por experiência de guilda. O nível cinco libera benefícios descritos pela regra de guildas.");
    fs.writeFileSync(path.join(docs, "items.json"), JSON.stringify([{ nome: "Espada do Teste", categoria: "Arma", atributo: "Força" }]));
    const indexPath = path.join(root, "index.db"); const indexer = new KnowledgeIndexer({ projectRoot: root, roots: ["docs"], indexPath, chunkSize: 500, chunkOverlap: 20 });
    await indexer.rebuild({ clear: true }); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    return { root, docs, indexPath, indexer, retriever: new KnowledgeRetriever({ indexPath, maxResults: 6, config: { knowledge: { max_results: 6 } } }) };
}

test("busca exata encontra entidade conhecida", async t => {
    const { retriever } = await fixture(t); const results = await retriever.searchKnowledge("Espada do Teste");
    assert.ok(results.some(item => item.content.includes("Espada do Teste")));
});

test("busca semântica leve entende sinônimos em português", async t => {
    const { retriever } = await fixture(t); const results = await retriever.searchKnowledge("Quantos espaços existem para lâminas?");
    assert.ok(results.some(item => item.file.endsWith("equipment.md")));
});

test("consulta inexistente não vira evidência nem chama o modelo", async t => {
    const { retriever } = await fixture(t); let called = false;
    const assistant = new CardinalAssistant({ retriever, client: { chat: async () => { called = true; return { text: "inventado" }; } }, contextBuilder: new ContextBuilder({ maxChars: 1000, maxResults: 4, config: { knowledge: {} } }) });
    const result = await assistant.ask("Qual é o limite oficial de unicórnios cósmicos?");
    assert.match(result.text, /Não encontrei informação oficial/); assert.equal(called, false);
});

test("filtro restringe a categoria", async t => {
    const { retriever } = await fixture(t); const results = await retriever.searchKnowledge("arma", { category: "weapons" });
    assert.ok(results.length > 0); assert.ok(results.every(item => item.category === "weapons"));
});

test("atualização detecta fonte alterada", async t => {
    const { docs, indexer } = await fixture(t); fs.appendFileSync(path.join(docs, "guilds.md"), "\nNova regra de teste.");
    const update = await indexer.rebuild(); assert.ok(update.updated + update.inserted > 0);
});

test("context builder respeita limites", () => {
    const builder = new ContextBuilder({ maxChars: 700, maxResults: 3, config: { knowledge: {} } });
    const context = builder.build(Array.from({ length: 8 }, (_, id) => ({ id, system: "rules", category: "rules", entity: "Teste", file: "teste.md", content: "x".repeat(500), score: 1 })));
    assert.ok(context.chars <= 700); assert.ok(context.results.length <= 3); assert.ok(context.estimatedTokens <= 175);
});
