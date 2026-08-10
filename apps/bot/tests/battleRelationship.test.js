const assert = require("assert");
const BattleSystem = require("../src/systems/battleSystem");

const npc = BattleSystem.criarInimigoNPC({
    id: "teste_npc",
    nome: "NPC de Teste",
    nivel: 10,
    rank: "D",
    atributos: { forca: 12, resistencia: 20, poder_magico: 30 }
});

assert.strictEqual(npc.npcId, "teste_npc");
assert.strictEqual(npc.dano, 30);
assert.strictEqual(npc.defesa, 20);
assert.strictEqual(npc.vida, 300);

const hostil = BattleSystem.determinarModificadorRelacao({ vinculo: 0, hostilidade: 40 });
assert.strictEqual(hostil.multiplicador, 1.05);
assert.strictEqual(hostil.agressivo, true);

const proximo = BattleSystem.determinarModificadorRelacao({ vinculo: 60, hostilidade: 0 });
assert.strictEqual(proximo.multiplicador, 0.85);
assert.strictEqual(proximo.hesitou, true);

const neutro = BattleSystem.determinarModificadorRelacao({ vinculo: 59, hostilidade: 9 });
assert.strictEqual(neutro.multiplicador, 1);

console.log("battleRelationship.test.js: OK");
