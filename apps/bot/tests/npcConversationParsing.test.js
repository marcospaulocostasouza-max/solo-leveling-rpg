const test = require("node:test");
const assert = require("node:assert/strict");
const { extrairConversaNPC, isConversaNPC } = require("../src/npc/npcConversa");
const NPCManager = require("../src/npc/npcManager");

test("primeira linha e o comando e todo o restante e a cena", () => {
    const texto = "!ophilia\r\nO jogador entra na igreja.\r\n\r\n— Boa noite, Ophilia.";
    assert.deepEqual(extrairConversaNPC(texto), {
        comando: "ophilia",
        cena: "O jogador entra na igreja.\n\n— Boa noite, Ophilia."
    });
    assert.equal(isConversaNPC(texto), true);
});

test("todos os NPCs aceitam comando por ID e preservam a cena", () => {
    const npcs = NPCManager.listarNPCs();
    assert.ok(npcs.length > 0);
    const ids = new Set();

    for (const npc of npcs) {
        assert.ok(npc.id, `NPC sem ID: ${npc.nome || "desconhecido"}`);
        assert.equal(npc.id, npc.id.toLowerCase(), `ID deve estar em minusculas: ${npc.id}`);
        assert.equal(ids.has(npc.id), false, `ID duplicado: ${npc.id}`);
        ids.add(npc.id);

        const cena = `Cena de ${npc.id}.\n\n— Dialogo do jogador.`;
        const texto = `!${npc.id}\n${cena}`;
        assert.equal(isConversaNPC(texto), true, `Comando nao reconhecido: !${npc.id}`);
        assert.deepEqual(extrairConversaNPC(texto), { comando: npc.id, cena });
    }
});
