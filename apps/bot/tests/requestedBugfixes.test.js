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

test("slots aceitam categorias legadas e canonicas de equipamento", () => {
    const InventorySystem = require("../src/systems/inventorySystem");
    const { itemSlot } = require("../../../packages/database");

    assert.equal(InventorySystem.getSlotDoItem({ categoria: "Capacete" }), "Cabeça");
    assert.equal(InventorySystem.getSlotDoItem({ categoria: "Armadura" }), "Corpo");
    assert.equal(InventorySystem.getSlotDoItem({ categoria: "Escudo", escudo: 1 }), "Arma 1");
    assert.equal(itemSlot({ categoria: "Capacete" }), "Cabeça");
    assert.equal(itemSlot({ categoria: "Armadura" }), "Corpo");
    assert.equal(itemSlot({ categoria: "Escudo", escudo: 1 }), "Arma 1");
});

test("equipar um item recalcule atributos sem quebrar o fluxo", async () => {
    const InventorySystem = require("../src/systems/inventorySystem");
    const db = require("../src/core/database");

    const estadoInicial = await new Promise((resolve, reject) => {
        db.get(
            "SELECT equipado FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?",
            [3, 31],
            (err, row) => err ? reject(err) : resolve(row)
        );
    });

    const primeiro = await InventorySystem.equiparItem(3, 31);
    const segundo = await InventorySystem.equiparItem(3, 31);

    const estadoFinal = await new Promise((resolve, reject) => {
        db.get(
            "SELECT equipado FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?",
            [3, 31],
            (err, row) => err ? reject(err) : resolve(row)
        );
    });

    assert.equal(primeiro.sucesso, true);
    assert.equal(segundo.sucesso, true);
    assert.equal(Number(estadoFinal?.equipado || 0), Number(estadoInicial?.equipado || 0));
});

test("a API aplica bonus de equipamento registrado no efeito legado", () => {
    const { itemBonus } = require("../../../packages/database");
    assert.deepEqual(itemBonus({ efeito: "Forca: +12, Poder Magico: +7" }), {
        forca: 12,
        resistencia: 0,
        velocidade: 0,
        sentidos: 0,
        inteligencia: 0,
        poder_magico: 7
    });
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
    assert.ok(nomes.length >= 10);
    assert.ok(nomes.includes("Soco Potente"));
});

test("comandos de armas sao resolvidos", () => {
    const { resolverConsultaClasse } = require("../src/commands/tecnicasClasse");
    assert.equal(resolverConsultaClasse("foice").estilo, "Foices");
    assert.equal(resolverConsultaClasse("pistola").estilo, "Pistolas");
    assert.equal(resolverConsultaClasse("arco").estilo, "Arcos");
    assert.equal(resolverConsultaClasse("espadão").estilo, "Espadas Pesadas");
});

test("tecnicas avancadas exigem a classe avancada correta", () => {
    const { compativel } = require("../src/systems/techniquePurchaseSystem");
    assert.equal(
        compativel({ classe: "Lutador", classe_avancada: "Nenhuma", estilo_luta: "Facas" }, { categoria: "Avancada", classe: "Hrymir" }),
        false
    );
    assert.equal(
        compativel({ classe: "Lutador", classe_avancada: "Hrymir", estilo_luta: "Facas" }, { categoria: "Avancada", classe: "Hrymir" }),
        true
    );
});

test("tecnicas de proficiencia respeitam o estilo canonico", () => {
    const { compativel } = require("../src/systems/techniquePurchaseSystem");
    assert.equal(
        compativel({ classe: "Lutador", classe_avancada: "Nenhuma", estilo_luta: "Proficiência em Facas" }, { categoria: "Proficiencia", classe: "Facas" }),
        true
    );
});
