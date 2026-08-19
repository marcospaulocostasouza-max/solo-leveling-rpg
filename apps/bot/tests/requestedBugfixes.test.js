const test = require("node:test");
const assert = require("node:assert/strict");

test("distribuir entende poder magico junto com outro atributo", () => {
    const { parseDistribuicao } = require("../src/commands/distribuir");
    assert.deepEqual(parseDistribuicao("5 poder magico 2 forca"), {
        alteracoes: { poder_magico_base: 5, forca_base: 2 },
        pontosRequisitados: 7,
        erros: []
    });
    assert.deepEqual(parseDistribuicao("pm 5 agi 2").alteracoes, {
        poder_magico_base: 5,
        velocidade_base: 2
    });
});

test("equipar prioriza item equipavel mesmo com pontuacao no nome", () => {
    const { escolherItem } = require("../src/commands/equipar");
    const itens = [
        { nome: "Pocao do Aspirante", categoria: "Item de Apoio", consumivel: 1 },
        { nome: "Adaga do Aspirante", categoria: "Arma 1", consumivel: 0 }
    ];
    assert.equal(escolherItem(itens, "Adaga do Aspirante.*").nome, "Adaga do Aspirante");
    assert.equal(escolherItem(itens, "Aspirante").nome, "Adaga do Aspirante");
});

test("item de apoio so e consumivel quando marcado como consumivel", () => {
    const InventorySystem = require("../src/systems/inventorySystem");
    assert.equal(InventorySystem.isConsumivel({ categoria: "Item de Apoio", consumivel: 0 }), false);
    assert.equal(InventorySystem.isConsumivel({ categoria: "Item de Apoio", consumivel: 1 }), true);
});

test("compra de tecnica usa custo salvo na ficha da tecnica", () => {
    const { techniqueMasteryCost, calculateTechniqueMasteryCost } = require("../../../packages/database");
    assert.equal(techniqueMasteryCost({ custo_maestria: 320 }, 12, false), 320);
    assert.equal(techniqueMasteryCost({ custo_qi: 640 }, 12, false), 640);
    assert.equal(techniqueMasteryCost({}, 2, false), calculateTechniqueMasteryCost(2, false));
});

test("registrador coleta tecnicas das formas do lutador", () => {
    const { coletarTecnicas } = require("../src/core/registrarSistemas");
    const lutador = require("../src/tecnicas/iniciais/lutador");
    const nomes = coletarTecnicas(lutador).map(tecnica => tecnica.nome);
    assert.ok(nomes.includes("Golpe do Abismo"));
    assert.ok(nomes.length > 20);
});

test("comandos de armas sao resolvidos", () => {
    const { resolverConsultaClasse } = require("../src/commands/tecnicasClasse");
    assert.deepEqual(resolverConsultaClasse("foice").nomes, ["Foice"]);
    assert.deepEqual(resolverConsultaClasse("pistola").nomes, ["Pistola"]);
    assert.deepEqual(resolverConsultaClasse("arco").nomes, ["Ranger"]);
    assert.deepEqual(resolverConsultaClasse("espadão").nomes, ["Lutador"]);
});
