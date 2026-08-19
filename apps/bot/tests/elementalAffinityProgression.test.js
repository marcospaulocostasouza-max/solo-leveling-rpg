const test = require("node:test");
const assert = require("node:assert/strict");
const { determinarSorteio } = require("../src/commands/sortearAfinidade");

test("primeira afinidade continua disponivel normalmente", () => {
    assert.deepEqual(determinarSorteio({ nivel: 1, afinidade_elemental: "Nenhuma" }, 0), {
        permitido: true, slot: 1, nivelNecessario: 1
    });
});

test("somente Mago Elemental recebe afinidades adicionais", () => {
    assert.equal(determinarSorteio({ classe: "Assassino", nivel: 70, afinidade_elemental: "Fogo" }, 0).motivo, "classe");
    assert.equal(determinarSorteio({ classe: "Mago Elemental", nivel: 34, afinidade_elemental: "Fogo" }, 0).motivo, "nivel");
    assert.deepEqual(determinarSorteio({ classe: "Mago Elemental", nivel: 35, afinidade_elemental: "Fogo" }, 0), {
        permitido: true, slot: 2, nivelNecessario: 35
    });
    assert.equal(determinarSorteio({ classe: "Mago Elemental", nivel: 69, afinidade_elemental: "Fogo" }, 1).motivo, "nivel");
    assert.deepEqual(determinarSorteio({ classe: "Mago Elemental", nivel: 70, afinidade_elemental: "Fogo" }, 1), {
        permitido: true, slot: 3, nivelNecessario: 70
    });
    assert.equal(determinarSorteio({ classe: "Mago Elemental", nivel: 100, afinidade_elemental: "Fogo" }, 2).motivo, "limite");
});
