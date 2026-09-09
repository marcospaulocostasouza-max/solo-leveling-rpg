"use strict";

const MessageService = require("../core/messageService");
const adminCore = require("../core/adminCore");
const { WebResearch } = require("../../../../cardinal/web");
const { CardinalForgeService } = require("../../../../cardinal/forge");
const { BalanceEngine } = require("../../../../cardinal/balance");
const { templates, renderers } = require("../../../../cardinal/presentation");

let service, forge, balance;
const instance = () => service ||= new WebResearch();
const forgeInstance = () => forge ||= new CardinalForgeService();
const balanceInstance = () => balance ||= new BalanceEngine();
const send = (msg, dto) => MessageService.send({ message: msg, text: renderers.whatsapp.render(dto) });

function extractQuery(body) {
  return String(body || "")
    .replace(/^\s*(?:!|\.\s*#)\s*cardinal\b\s*/i, "")
    .replace(/^web\s+/i, "")
    .replace(/^(?:search|pesquise|pesquisar)\s*/i, "")
    .trim();
}

module.exports = async msg => {
  const actor = msg.author || msg.from;
  const raw = extractQuery(msg.body);
  try {
    if (!await adminCore.isAdmin(actor)) return send(msg, templates.denied());
    if (!raw) return send(msg, templates.info({ module: "WEB", title: "PESQUISA EXTERNA", summary: "Escreva .#Cardinal na primeira linha e a pesquisa logo abaixo." }));

    const review = /n[aã]o crie|s[oó] a pesquisa/i.test(raw);
    const create = /\b(crie|criar|fa[cç]a|transforme)\b/i.test(raw) && !review;
    if (create) {
      await forgeInstance().ready;
      const result = await instance().createDraft(actor, raw, { forge: forgeInstance(), balance: balanceInstance() });
      return send(msg, templates.info({
        module: "FORGE + WEB",
        title: result.draft.content.nome || "CONTEÚDO EXTERNO",
        status: result.draft.status,
        summary: `Pesquisa ${result.provider || "cache"} concluída; ficha pronta para revisão.`,
        sections: [
          { title: "Proveniência", fields: [{ label: "Modo", value: result.adaptation.mode }, { label: "Fontes", value: result.citations.length }], lines: result.citations.slice(0, 3).map(row => row.title) },
          { title: "Balance", fields: [{ label: "Status", value: result.quality_gate?.passed === false ? "REVISAR" : "APTO PARA REVISÃO" }], lines: [] }
        ]
      }));
    }

    const started = Date.now();
    const result = await instance().research(actor, raw, { review });
    return send(msg, templates.info({
      module: "WEB RESEARCH", title: result.plan.target_entity || raw, status: result.cached ? "CACHE" : "SEARXNG",
      summary: `${result.citations.length} fonte(s) utilizada(s) em ${Date.now() - started}ms.`,
      sections: [
        { title: "Traços centrais", fields: [], lines: (result.core_traits || []).map(row => `${row.importance}: ${row.trait}`) },
        { title: "Fontes", fields: [], lines: result.citations.slice(0, 5).map(row => `${row.type}: ${row.title}`) },
        { title: "Modo", fields: [{ label: "Saída", value: result.output_category }, { label: "Confiança", value: result.confidence }], lines: result.warnings?.map(row => `${row.code}: ${row.engine || row.message || ""}`) || [] }
      ]
    }));
  } catch (error) {
    return send(msg, templates.error({ module: "WEB RESEARCH", summary: error.message, meta: { code: error.code || "CARDINAL_WEB_ERROR" } }));
  }
};

module.exports.extractQuery = extractQuery;
