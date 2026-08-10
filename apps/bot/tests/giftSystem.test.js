const assert = require("assert");
const { avaliarPresente } = require("../src/npc/giftSystem");

const mago = { classe: "Mago Elemental", estilo_luta: "Cajados e Orbes", personalidade: "Estudioso curioso" };
assert.strictEqual(avaliarPresente(mago, { nome: "Cajado Antigo", categoria: "Arma" }), "gostou");
assert.strictEqual(avaliarPresente(mago, { nome: "Pedra Comum", categoria: "Material" }), "indiferente");

const protetor = { classe: "Curandeiro", personalidade: "Protetor dos inocentes e justo" };
assert.strictEqual(avaliarPresente(protetor, { nome: "Veneno Corrupto", categoria: "Material" }), "desgostou");

console.log("giftSystem.test.js: OK");
