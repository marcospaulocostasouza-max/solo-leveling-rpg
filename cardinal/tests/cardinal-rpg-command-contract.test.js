"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const CardinalCommand = require("../../apps/bot/src/commands/cardinalAdmin");
const Paimon = require("../../apps/bot/src/systems/systemAssistantService");
const { planNatural } = require("../admin/planner");

test(".#Cardinal preserva apenas a ordem abaixo do cabeçalho", () => {
  assert.equal(CardinalCommand.cardinalText(".#Cardinal\nAprovado"), "Aprovado");
  assert.equal(CardinalCommand.cardinalText("!cardinal\nDê 100 XP para Flins"), "Dê 100 XP para Flins");
});

test("Cardinal entende XP e técnica/feitiço sem depender do modelo", () => {
  const plan = planNatural("Dê 100 XP para o jogador Flins");
  assert.equal(plan.intent, "give_xp");
  assert.equal(plan.parameters.amount, 100);
  assert.equal(plan.parameters.player, "flins");
  assert.equal(CardinalCommand.forgeType("Crie um feitiço Rank D de fogo"), "technique");
  assert.equal(CardinalCommand.forgeType("Crie uma passiva de velocidade"), "passive");
});

test("Paimon responde progresso por regra canônica e não por nível aleatório", () => {
  const answer = Paimon.responderOrientacaoCanonica("como eu upo?");
  assert.match(answer, /Quest diária.*50 a 100 palavras/i);
  assert.match(answer, /One Post.*1\.000/i);
  assert.doesNotMatch(answer, /seu nível/i);
});

test("Paimon orienta fluxos de gacha e Dungeon com comandos concretos", () => {
  assert.match(Paimon.responderOrientacaoCanonica("como eu giro no gacha?"), /!convergir 10/);
  assert.match(Paimon.responderOrientacaoCanonica("como abro chave de dungeon?"), /!ficha de dungeon/);
});
