"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { CardinalAdminService } = require("../admin/service");
const { planNatural } = require("../admin/planner");
const { cardinalError } = require("../../apps/bot/src/commands/cardinalError");
const { CardinalAssistant } = require("../core/assistant");

test("consulta de custo usa catálogo e não inventa proficiência", async () => {
  const assistant = new CardinalAssistant({
    retriever: { searchKnowledge: async () => [{ id: 1, file: "database:tecnicas", entity: "Enfraquecer", content: "classe: Mago Maldição\ncategoria: Inicial\ncusto_maestria: 10\nnivel_desbloqueio: 1" }] },
    client: { chat: async () => { throw new Error("Consulta objetiva não deve depender do modelo"); } }
  });
  const result = await assistant.ask("Quanto custa Enfraquecer em Maestria?");
  assert.match(result.text, /10 de Maestria/);
  assert.doesNotMatch(result.text, /Proficiência/);
});

test("pedidos iguais em mensagens novas executam; reentrega preserva a chave", async () => {
  const service = new CardinalAdminService({ database: {} });
  service.executePlan = async (_actor, plan) => plan;
  const first = await service.executeNatural("adm", "dê 100 XP para Luna", { requestId: "message-1" });
  const retry = await service.executeNatural("adm", "dê 100 XP para Luna", { requestId: "message-1" });
  const next = await service.executeNatural("adm", "dê 100 XP para Luna", { requestId: "message-2" });
  assert.equal(first.idempotency_key, retry.idempotency_key);
  assert.notEqual(first.idempotency_key, next.idempotency_key);
});

test("concessões em linguagem natural dispensam o modelo", () => {
  for (const verb of ["conceda", "entregue", "adicionar", "dê"]) {
    const plan = planNatural(`${verb} 100 maestria para jogador Luna`);
    assert.equal(plan.intent, "give_mastery");
    assert.equal(plan.parameters.amount, 100);
    assert.equal(plan.parameters.player, "luna");
  }
});

test("confirmação contém comando executável com o identificador", () => {
  const view = cardinalError({ code: "CARDINAL_CONFIRMATION_REQUIRED", details: { confirmation_id: "confirm_123-ab" } });
  assert.match(JSON.stringify(view), /!cardinal confirmar confirm_123-ab/);
});

test("pergunta de continuação recupera o assunto anterior", async () => {
  const searches = [];
  const assistant = new CardinalAssistant({
    retriever: { searchKnowledge: async query => { searches.push(query); return []; } },
    client: { chat: async () => { throw new Error("Sem fonte não deve inventar"); } }
  });
  await assistant.ask("Torrente Arcana");
  await assistant.ask("e quanto custa?");
  assert.equal(searches.at(-1), "Torrente Arcana e quanto custa?");
});
