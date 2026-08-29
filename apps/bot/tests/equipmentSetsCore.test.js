"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const database = require("../../../packages/database");
const Sets = require("../src/systems/equipmentSetService");
const Inventory = require("../src/systems/inventorySystem");
const Atributos = require("../src/systems/atributoSystem");

test("Nucleo de Conjuntos de Equipamentos", async t => {
    await Sets.garantirEstrutura();
    const sufixo = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const itemIds = []; const setIds = []; let jogadorId;
    async function item(nome, slot, bonus = 1) {
        const flags = { arma: slot.startsWith("Arma") ? 1 : 0, armadura: ["Cabeça", "Corpo", "Pernas", "Pés"].includes(slot) ? 1 : 0, acessorio: slot === "Acessórios" ? 1 : 0 };
        const linha = await database.run("INSERT INTO itens (nome, categoria, slot, tier, arma, armadura, acessorio, forca_bonus) VALUES (?, ?, ?, 'D', ?, ?, ?, ?)", [`${nome} ${sufixo}`, slot, slot, flags.arma, flags.armadura, flags.acessorio, bonus]);
        itemIds.push(Number(linha.lastID)); return Number(linha.lastID);
    }
    async function conjunto(nome, itens, estagios) {
        const criado = await Sets.criarConjunto({ nome: `${nome} ${sufixo}`, descricao: "Fixture", rank: "D" }); setIds.push(Number(criado.id));
        for (const id of itens) await Sets.associarItem(criado.id, id);
        for (const estagio of estagios) await Sets.configurarEstagio(criado.id, estagio.pecas, estagio.bonus);
        return criado;
    }
    try {
        const jogador = await database.run(`INSERT INTO jogadores (numero, nome, rank, nivel, forca_base, resistencia_base, velocidade_base, sentidos_base, inteligencia_base, poder_magico_base)
            VALUES (?, ?, 'E', 1, 10, 10, 10, 10, 10, 10)`, [`__sets_${sufixo}`, `Sets ${sufixo}`]);
        jogadorId = Number(jogador.lastID);
        const pecas = [await item("Elmo", "Cabeça"), await item("Corpo", "Corpo"), await item("Botas", "Pés"), await item("Pernas", "Pernas"), await item("Anel", "Acessórios")];
        const principal = await conjunto("Cinco peças", pecas, [
            { pecas: 2, bonus: { forca: 10 } }, { pecas: 3, bonus: { forca: 20, resistencia: 5 } },
            { pecas: 4, bonus: { forca: 30 } }, { pecas: 5, bonus: { forca: 50, velocidade: 10 } }
        ]);

        await t.test("item sem conjunto e uma peca nao ativam bonus", async () => {
            const antigo = await item("Antigo", "Item de Apoio", 3);
            await database.run("INSERT INTO inventario_jogador (jogador_id, item_id, quantidade, equipado) VALUES (?, ?, 1, 1)", [jogadorId, antigo]);
            await database.run("INSERT INTO inventario_jogador (jogador_id, item_id, quantidade, equipado) VALUES (?, ?, 1, 1)", [jogadorId, pecas[0]]);
            assert.deepEqual(await Sets.calcularBonusConjuntos(jogadorId), { forca: 0, resistencia: 0, velocidade: 0, sentidos: 0, inteligencia: 0, poder_magico: 0 });
        });
        await t.test("2, 3, 4 e 5 pecas usam somente o maior estagio", async () => {
            const esperados = [{ quantidade: 2, forca: 10 }, { quantidade: 3, forca: 20 }, { quantidade: 4, forca: 30 }, { quantidade: 5, forca: 50 }];
            for (const esperado of esperados) {
                await database.run("UPDATE inventario_jogador SET equipado = 0 WHERE jogador_id = ? AND item_id IN (?, ?, ?, ?, ?)", [jogadorId, ...pecas]);
                for (const id of pecas.slice(0, esperado.quantidade)) {
                    if (!await database.get("SELECT id FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogadorId, id])) await database.run("INSERT INTO inventario_jogador (jogador_id, item_id, quantidade, equipado) VALUES (?, ?, 1, 1)", [jogadorId, id]);
                    else await database.run("UPDATE inventario_jogador SET equipado = 1 WHERE jogador_id = ? AND item_id = ?", [jogadorId, id]);
                }
                const bonus = await Sets.calcularBonusConjuntos(jogadorId);
                assert.equal(bonus.forca, esperado.forca);
            }
        });
        await t.test("bonus e derivado, entra no total e nao altera a base", async () => {
            await Atributos.recalcularAtributos(jogadorId);
            const jogadorAtual = await database.get("SELECT forca_base, forca_total, velocidade_base, velocidade_total FROM jogadores WHERE id = ?", [jogadorId]);
            assert.equal(Number(jogadorAtual.forca_base), 10);
            assert.equal(Number(jogadorAtual.forca_total), 68); // base 10 + itens 8 + conjunto 50
            assert.equal(Number(jogadorAtual.velocidade_base), 10);
            assert.equal(Number(jogadorAtual.velocidade_total), 20);
            await Atributos.recalcularAtributos(jogadorId);
            assert.equal(Number((await database.get("SELECT forca_total FROM jogadores WHERE id = ?", [jogadorId])).forca_total), 68);
        });
        await t.test("desequipar reduz estagio e remove bonus sem fantasma", async () => {
            await database.run("UPDATE inventario_jogador SET equipado = 0 WHERE jogador_id = ? AND item_id = ?", [jogadorId, pecas[4]]);
            assert.equal((await Sets.calcularBonusConjuntos(jogadorId)).forca, 30);
            await database.run("UPDATE inventario_jogador SET equipado = 0 WHERE jogador_id = ?", [jogadorId]);
            assert.equal((await Sets.calcularBonusConjuntos(jogadorId)).forca, 0);
            assert.equal(Number((await database.get("SELECT forca_base FROM jogadores WHERE id = ?", [jogadorId])).forca_base), 10);
        });
        await t.test("duas armas 1FP e dois conjuntos simultaneos respeitam o sistema real", async () => {
            const armas = [await item("Adaga A", "Arma 1"), await item("Adaga B", "Arma 1")];
            const dual = await conjunto("Armas duplas", armas, [{ pecas: 2, bonus: { sentidos: 12 } }]);
            const extras = [await item("Broche", "Acessórios"), await item("Amuleto", "Acessórios")];
            await conjunto("Acessorios", extras, [{ pecas: 2, bonus: { inteligencia: 9 } }]);
            for (const id of [...armas, ...extras]) await database.run("INSERT INTO inventario_jogador (jogador_id, item_id, quantidade, equipado) VALUES (?, ?, 1, 0)", [jogadorId, id]);
            assert.equal((await Inventory.equiparItem(jogadorId, armas[0])).sucesso, true);
            assert.equal((await Inventory.equiparItem(jogadorId, armas[1])).sucesso, true);
            assert.equal((await Sets.getBonusConjunto(jogadorId, dual.id)).quantidadeEquipada, 2);
            await Inventory.equiparItem(jogadorId, extras[0]); await Inventory.equiparItem(jogadorId, extras[1]);
            const bonus = await Sets.calcularBonusConjuntos(jogadorId);
            assert.equal(bonus.sentidos, 12); assert.equal(bonus.inteligencia, 9);
        });
        await t.test("estrutura aceita somente seis atributos fixos e comandos respeitam apresentacao", async () => {
            assert.deepEqual(Sets.ATRIBUTOS, ["forca", "resistencia", "velocidade", "sentidos", "inteligencia", "poder_magico"]);
            await assert.rejects(Sets.configurarEstagio(principal.id, 2, { forca: "10%" }), /inteiro fixo/);
            const jogadorFonte = fs.readFileSync(path.resolve(__dirname, "../src/commands/jogador.js"), "utf8");
            const equipadosFonte = fs.readFileSync(path.resolve(__dirname, "../src/commands/verSlots.js"), "utf8");
            assert.doesNotMatch(jogadorFonte, /Bônus de Conjunto/);
            assert.match(equipadosFonte, /CONJUNTOS ATIVOS/); assert.match(equipadosFonte, /quantidadeEquipada/); assert.match(equipadosFonte, /proximoEstagio/);
        });
        await t.test("migracao e calculo sao idempotentes", async () => {
            await Sets.garantirEstrutura(); await Sets.garantirEstrutura();
            const antes = await Sets.calcularBonusConjuntos(jogadorId); const depois = await Sets.calcularBonusConjuntos(jogadorId);
            assert.deepEqual(depois, antes);
        });
    } finally {
        if (jogadorId) await database.run("DELETE FROM inventario_jogador WHERE jogador_id = ?", [jogadorId]);
        if (jogadorId) await database.run("DELETE FROM jogadores WHERE id = ?", [jogadorId]);
        for (const id of setIds) await database.run("DELETE FROM equipment_set_bonuses WHERE set_id = ?", [id]);
        for (const id of setIds) await database.run("DELETE FROM equipment_set_items WHERE set_id = ?", [id]);
        for (const id of setIds) await database.run("DELETE FROM equipment_sets WHERE id = ?", [id]);
        for (const id of itemIds) await database.run("DELETE FROM itens WHERE id = ?", [id]);
    }
});
