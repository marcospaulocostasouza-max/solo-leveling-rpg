const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
    classificarMissoes,
    missoesDisponiveis
} = require("../src/missions/missionAvailability");

const arquivo = path.join(__dirname, "..", "src", "missions", "data", "xerc_baek.json");
const missoes = JSON.parse(fs.readFileSync(arquivo, "utf8")).missoes;
const ids = (vinculo) => missoesDisponiveis(missoes, vinculo).map((missao) => missao.numero);
const classificadas = classificarMissoes(missoes);

assert.deepStrictEqual(ids(9), [], "Abaixo de 10% não libera conteúdo");
assert.deepStrictEqual(ids(10), [5], "10% libera a primeira simples");
assert.deepStrictEqual(ids(20), [5, 6], "20% libera a segunda simples");
assert.deepStrictEqual(ids(24), [5, 6], "24% não libera o primeiro arco");
assert.deepStrictEqual(ids(25), [1, 5, 6], "25% libera o arco 1");
assert.deepStrictEqual(ids(50), [1, 2, 5, 6, 7, 8, 9], "50% libera arco 2 e cinco simples");

for (const numero of [1, 2, 3, 4]) {
    const missao = classificadas.find((item) => item.numero === numero);
    assert.strictEqual(missao.classificacao, "arco", `Capítulo ${numero} deve ser arco`);
    assert.ok(missao.nivelRecomendado, `Arco ${numero} precisa de recomendação`);
}
for (const numero of [5, 6, 7, 8, 9, 10]) {
    const missao = classificadas.find((item) => item.numero === numero);
    assert.strictEqual(missao.classificacao, "missao_simples", `Missão ${numero} deve ser simples`);
    assert.strictEqual(missao.nivelRecomendado, null, "Missão simples não tem recomendação de nível");
}

assert.strictEqual(classificadas.find((item) => item.numero === 5).vinculoNecessario, 10);
assert.strictEqual(classificadas.find((item) => item.numero === 10).vinculoNecessario, 60);
console.log("missionAvailability.test.js: OK");
