"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const database = require("../../../packages/database");
const Sets = require("../src/systems/equipmentSetService");
const Banners = require("../src/systems/gachaBannerService");

test("Itens Raros e criação administrativa de conjuntos", async () => {
    await Sets.garantirEstrutura();
    const sufixo = `${Date.now()}_${Math.random().toString(16).slice(2)}`; const itemIds = []; let setId;
    try {
        for (let i = 1; i <= 7; i++) {
            const criado = await database.run("INSERT INTO itens (nome,categoria,slot,tier,item_unico) VALUES (?, 'Armadura', 'Corpo', 'S', 1)", [`[Personalizado] Raro ${i} ${sufixo}`]);
            itemIds.push(Number(criado.lastID));
            if (i <= 6) await database.run("INSERT INTO banner_rare_items (item_id,criado_por) VALUES (?,?)", [criado.lastID, "teste"]);
        }
        for (const tipo of ["TITULO", "PASSIVA"]) {
            const criado = await database.run("INSERT INTO itens (nome,categoria,slot,tier,item_unico) VALUES (?, ?, 'Item de Apoio', 'S', 1)", [`[Personalizado] ${tipo} ${sufixo}`, tipo]);
            itemIds.push(Number(criado.lastID)); await database.run("INSERT INTO banner_rare_items (item_id,tipo,criado_por) VALUES (?,?,?)", [criado.lastID, tipo, "teste"]);
            assert.equal((await Banners.validarReferencia(tipo, criado.lastID)).valida, true);
        }
        await assert.rejects(Sets.criarConjuntoCompleto({ nome: `Inválido ${sufixo}`, rank: "S", itemIds, estagios: [] }), /Itens Raros/);
        const criado = await Sets.criarConjuntoCompleto({ nome: `Conjunto ${sufixo}`, descricao: "Exclusivo", rank: "S", itemIds: itemIds.slice(0, 6), estagios: [
            { pecas: 2, forca: 10, descricao: "Dois" }, { pecas: 4, resistencia: 20, descricao: "Quatro" }, { pecas: 6, poder_magico: 30, descricao: "Seis" }
        ] });
        setId = criado.conjunto.id;
        assert.equal(criado.itens.length, 6); assert.deepEqual(criado.bonus.map(item => Number(item.required_pieces)), [2, 4, 6]);
    } finally {
        if (setId) { await database.run("DELETE FROM equipment_set_bonuses WHERE set_id=?", [setId]); await database.run("DELETE FROM equipment_set_items WHERE set_id=?", [setId]); await database.run("DELETE FROM equipment_sets WHERE id=?", [setId]); }
        for (const id of itemIds) { await database.run("DELETE FROM banner_rare_items WHERE item_id=?", [id]); await database.run("DELETE FROM itens WHERE id=?", [id]); }
    }
});
