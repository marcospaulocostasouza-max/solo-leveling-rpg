"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const database = require("../../../packages/database");
const Rewards = require("../src/systems/crystalRewardService");
const config = require("../src/config/crystalRewards");
const { sortearPonderado } = require("../src/commands/abrirCaixa");
const QuestSystem = require("../src/systems/questSystem");

test("Nucleo 7 - distribuicao de Cristais", async t => {
    await database.ensureCrystalSchema();
    const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const created = await database.run("INSERT INTO jogadores (numero, nome, rank, nivel, won) VALUES (?, ?, 'E', 1, 1000)", [`__cr7_${suffix}`, `Crystal Seven ${suffix}`]);
    const jogadorId = Number(created.lastID);
    try {
        await t.test("fonte desconfigurada nao credita nem cria historico", async () => {
            const result = await Rewards.concederDungeonAutonarrada(jogadorId, { id: 1, dungeon_rank: "E", dungeon_nome: "Teste" });
            assert.equal(result.quantidade, 0);
            assert.equal(await database.consultarCristais(jogadorId), 0);
            assert.equal((await database.all("SELECT * FROM historico_cristais WHERE jogador_id=?", [jogadorId])).length, 0);
        });

        await t.test("rank real da Dungeon seleciona a configuracao correta", async () => {
            config.dungeonAutonarrada.C = 37;
            config.dungeonAutonarrada.A = 99;
            const result = await Rewards.concederDungeonAutonarrada(jogadorId, { id: `rank_${suffix}`, dungeon_rank: "C", dungeon_nome: "Rank C" });
            assert.equal(result.quantidade, 37);
            assert.equal(await database.consultarCristais(jogadorId), 37);
        });

        await t.test("mesma conclusao e chamadas concorrentes sao idempotentes", async () => {
            const calls = await Promise.all(Array.from({ length: 5 }, () => Rewards.conceder({ jogadorId, quantidade: 20,
                origem: Rewards.ORIGENS.DUNGEON, referencia: `run:${suffix}`, contexto: "run" })));
            assert.equal(calls.filter(item => item.quantidade === 20).length, 1);
            assert.equal(calls.filter(item => item.duplicada).length, 4);
            assert.equal(await database.consultarCristais(jogadorId), 57);
        });

        await t.test("referencias diferentes e todas as origens oficiais funcionam", async () => {
            const cases = [
                [Rewards.concederDungeonSemanal, [jogadorId, `weekly_${suffix}`, "D", "weekly"], "DUNGEON_SEMANAL"],
                [Rewards.concederMissao, [jogadorId, `quest_${suffix}`, 3, "quest"], "MISSAO"],
                [Rewards.concederEvento, [jogadorId, `event_${suffix}`, 4, "event"], "EVENTO"],
                [Rewards.concederBoss, [jogadorId, `boss_${suffix}`, "B", 5, "boss"], "BOSS"],
                [Rewards.concederAdmin, [jogadorId, 6, `adm_${suffix}`, "admin"], "ADMIN"]
            ];
            config.dungeonSemanal.D = 2;
            for (const [fn, args, origem] of cases) {
                const result = await fn(...args); assert.ok(result.quantidade > 0); assert.equal(result.origem, origem);
            }
        });

        await t.test("historico guarda origem, referencia, contexto, saldo e data", async () => {
            const row = await database.get("SELECT * FROM historico_cristais WHERE jogador_id=? AND referencia=?", [jogadorId, `boss:boss_${suffix}`]);
            assert.equal(row.origem, "BOSS"); assert.equal(row.contexto, "boss"); assert.ok(row.criado_em); assert.ok(Number(row.saldo_resultante) > 0);
        });

        await t.test("negativo e referencia vazia sao recusados; zero e no-op", async () => {
            await assert.rejects(() => Rewards.conceder({ jogadorId, quantidade: -1, origem: "EVENTO", referencia: "neg" }));
            await assert.rejects(() => Rewards.conceder({ jogadorId, quantidade: 1, origem: "EVENTO", referencia: "" }));
            const before = (await database.all("SELECT * FROM historico_cristais WHERE jogador_id=?", [jogadorId])).length;
            assert.equal((await Rewards.conceder({ jogadorId, quantidade: 0, origem: "EVENTO", referencia: "zero" })).quantidade, 0);
            assert.equal((await database.all("SELECT * FROM historico_cristais WHERE jogador_id=?", [jogadorId])).length, before);
        });

        await t.test("jogador inexistente nao recebe e transacao nao deixa claim parcial", async () => {
            await assert.rejects(() => Rewards.conceder({ jogadorId: 999999999, quantidade: 1, origem: "EVENTO", referencia: `missing:${suffix}` }));
            assert.equal(await database.get("SELECT id FROM recompensas_cristais_processadas WHERE referencia=?", [`missing:${suffix}`]), null);
        });

        await t.test("caixa usa o mesmo pool ponderado e nao da Cristais ao treinar", () => {
            assert.equal(sortearPonderado([{ tipo: "a", peso: 1 }, { tipo: "cristais", peso: 0 }], () => 0.99).tipo, "a");
            assert.equal(sortearPonderado([{ tipo: "a", peso: 1 }, { tipo: "cristais", peso: 1 }], () => 0.99).tipo, "cristais");
            const treino = fs.readFileSync(path.resolve(__dirname, "../src/commands/aprovarAtividade.js"), "utf8");
            assert.doesNotMatch(treino, /adicionarCristais|conceder.*Cristais/);
        });

        await t.test("missao antiga continua normal e missao configurada entrega uma vez", async () => {
            await QuestSystem.criarMissao(jogadorId, `Antiga ${suffix}`, "Teste", "teste", 1, 2, 3);
            let antiga = await database.get("SELECT * FROM missoes WHERE jogador_id=? AND nome=?", [jogadorId, `Antiga ${suffix}`]);
            const antigaResult = await QuestSystem.atualizarProgresso(jogadorId, antiga.id, 1);
            assert.equal(antigaResult.recompensa.cristais, 0);

            await QuestSystem.criarMissao(jogadorId, `Cristais ${suffix}`, "Teste", "teste", 1, 2, 3, 11);
            const nova = await database.get("SELECT * FROM missoes WHERE jogador_id=? AND nome=?", [jogadorId, `Cristais ${suffix}`]);
            const primeira = await QuestSystem.atualizarProgresso(jogadorId, nova.id, 1);
            const segunda = await QuestSystem.atualizarProgresso(jogadorId, nova.id, 1);
            assert.equal(primeira.recompensa.cristais, 11);
            assert.equal(segunda.duplicada, true);
            const historico = await database.all("SELECT * FROM historico_cristais WHERE jogador_id=? AND referencia=?", [jogadorId, `missao:${nova.id}`]);
            assert.equal(historico.length, 1);
        });

        await t.test("integracoes preservam gacha, saldo, XP, Won e recompensas existentes", () => {
            const dungeon = fs.readFileSync(path.resolve(__dirname, "../src/systems/dungeonInstanciadaSystem.js"), "utf8");
            const quest = fs.readFileSync(path.resolve(__dirname, "../src/systems/questSystem.js"), "utf8");
            assert.match(dungeon, /concederDungeonAutonarrada/); assert.match(dungeon, /premios\.xp/); assert.match(dungeon, /premios\.won/);
            assert.match(quest, /recompensa_cristais/); assert.match(quest, /LevelSystem\.adicionarXp/); assert.match(quest, /recompensa_won/); assert.match(quest, /recompensa_item/);
            assert.equal(require("../src/systems/gachaEngine").CUSTOS?.umGiro || 100, 100);
        });
    } finally {
        config.dungeonAutonarrada.C = null; config.dungeonAutonarrada.A = null; config.dungeonSemanal.D = null;
        await database.run("DELETE FROM historico_cristais WHERE jogador_id=?", [jogadorId]);
        await database.run("DELETE FROM recompensas_cristais_processadas WHERE jogador_id=?", [jogadorId]);
        await database.run("DELETE FROM missoes WHERE jogador_id=? AND nome LIKE ?", [jogadorId, `%${suffix}`]);
        await database.run("DELETE FROM experiencia_historico WHERE jogador_id=?", [jogadorId]);
        await database.run("DELETE FROM jogadores WHERE id=?", [jogadorId]);
    }
});
