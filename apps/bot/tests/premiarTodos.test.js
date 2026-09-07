"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const comando = require("../src/commands/premiarTodos");

test("premiação global aceita recursos permitidos e exige confirmação explícita", () => {
    const previa = comando.lerPedido("!premiar todos cristais 250");
    assert.equal(previa.erro, undefined);
    assert.equal(previa.recurso.coluna, "cristais");
    assert.equal(previa.quantidade, 250);
    assert.equal(previa.confirmado, false);

    const confirmado = comando.lerPedido("!premiar todos XP 1000 confirmar");
    assert.equal(confirmado.recurso.coluna, "experiencia");
    assert.equal(confirmado.confirmado, true);
});

test("premiação global rejeita recursos, valores e formatos inseguros", () => {
    assert.ok(comando.lerPedido("!premiar todos agilidade 10").erro);
    assert.ok(comando.lerPedido("!premiar todos xp -10 confirmar").erro);
    assert.ok(comando.lerPedido("!premiar todos xp 0 confirmar").erro);
    assert.ok(comando.lerPedido("!premiar todos xp").erro);
});
