"use strict";

const MessageService = require("../core/messageService");
const adminCore = require("../core/adminCore");
const database = require("../../../../packages/database");
const { CardinalForgeService } = require("../../../../cardinal/forge");
const { BalanceEngine, qualityGate } = require("../../../../cardinal/balance");
const { createAdminService } = require("../../../../cardinal/admin");
const { renderAdmin } = require("../../../../cardinal/admin/renderer");
const { templates, renderers } = require("../../../../cardinal/presentation");
const { cardinalError } = require("./cardinalError");
let service, forge, balance;
const instance = () => service ||= createAdminService();
const forgeInstance = () => forge ||= new CardinalForgeService();
const balanceInstance = () => balance ||= new BalanceEngine();
const send = (msg, dto) => MessageService.send({ message: msg, text: renderers.whatsapp.render(dto) });

function levelQuestion(text) {
  return String(text || "").match(/(?:qual(?:\s+[eé])?\s+o\s+)?n[ií]vel\s+(?:do|da)\s+(?:player|jogador)\s+(.+?)[?.!]*$/i)?.[1]?.trim() || null;
}

async function playerLevel(name) {
  return database.get("SELECT nome,nivel,rank,experiencia,classe FROM jogadores WHERE LOWER(TRIM(nome))=LOWER(TRIM(?)) LIMIT 1", [name]);
}

function forgeType(text) {
  const value = String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (!/\b(?:crie|criar|gere|gerar|forje|forjar)\b/.test(value)) return null;
  if (/\b(?:coroa|elmo|capacete|cabeca|armadura|peitoral|botas?)\b/.test(value)) return "armor";
  if (/\b(?:acessorio|anel|colar|amuleto)\b/.test(value)) return "accessory";
  if (/\b(?:arma|espada|lanca|arco|adaga|machado)\b/.test(value)) return "weapon";
  if (/\b(?:pocao|consumivel)\b/.test(value)) return "consumable";
  if (/\b(?:material|recurso)\b/.test(value)) return "material";
  if (/\b(?:conjunto|set)\b/.test(value)) return "set";
  if (/\bpassiva\b/.test(value)) return "passive";
  if (/\b(?:titulo|title)\b/.test(value)) return "title";
  if (/\b(?:missao|quest)\b/.test(value)) return "mission";
  if (/\b(?:dungeon|masmorra|gate)\b/.test(value)) return "dungeon";
  if (/\bbanner\b/.test(value)) return "banner";
  if (/\bevento\b/.test(value)) return "event";
  if (/\bitem\b/.test(value)) return "equipment";
  return null;
}

function externalCreationRequest(text) {
  const value = String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return /\b(?:crie|criar|gere|gerar|forje|forjar)\b/.test(value) && /\b(?:bankai|shikai|ichigo|bleach|genshin|honkai|fate|solo leveling)\b/.test(value);
}

function approvalRequest(text) {
  const match = String(text || "").trim().match(/^(?:aprovado|aprovar|confirmado|confirmar)(?:\s+(draft_[a-z0-9-]+))?[.!]*$/i);
  return match ? { draftId: match[1] || null } : null;
}

function automaticCorrectionRequest(text) {
  return /^(?:corrigir|corrija)(?:\s+automaticamente)?[.!]*$/i.test(String(text || "").trim());
}

function forgeDraftResponse(draft, gate) {
  const dto = templates.forgeResult(draft);
  const issues = gate.report?.issues || [];
  const canApprove = draft.validation.valid && gate.passed;
  const problems = draft.validation.errors || [];
  dto.module = "FORGE + BALANCE";
  dto.status = canApprove ? "AGUARDANDO APROVAÇÃO" : "REVISAR";
  dto.summary = "Ficha gerada para revisão. Nada foi publicado.";
  if (draft.auto_completed?.length) dto.sections.push({
    title: "Definições automáticas",
    fields: [],
    lines: draft.auto_completed.map(field => `• ${field} definido automaticamente com valor seguro.`)
  });
  if (!draft.validation.valid) {
    dto.sections[1] = {
      title: "Problemas encontrados",
      fields: [],
      lines: problems.map(problem => `• ${problem.message}`)
    };
    dto.sections.push({
      title: "Pendências obrigatórias",
      fields: [],
      lines: problems.map(problem => `• ${problem.message}`).slice(0, 8).concat(["Corrija os pontos acima ou envie uma nova ordem com ‘corrigir automaticamente’.”"])
    });
  }
  dto.sections.push({
    title: "Balance",
    fields: [{ label: "Resultado", value: gate.passed ? "Apto para publicação" : "Revisão obrigatória" }],
    lines: issues.length ? issues.map(issue => `${issue.severity}: ${issue.message}`) : ["Nenhum bloqueio crítico identificado."]
  });
  dto.sections.push({
    title: "Confirmação",
    fields: [],
    lines: canApprove
      ? ["Após revisar a ficha, envie em duas linhas:", ".#Cardinal", "Aprovado", "A aprovação publica somente a última ficha válida criada por você."]
      : ["Corrija os avisos de validação ou balance antes de aprovar. Nada será publicado agora."]
  });
  dto.meta = { ...dto.meta, draftId: draft.id, code: canApprove ? "AGUARDANDO_APROVACAO" : "REVISAO_NECESSARIA" };
  return dto;
}

async function approveLatestDraft(actor, requestedDraftId) {
  await forgeInstance().ready;
  const draft = requestedDraftId
    ? await forgeInstance().store.getDraft(requestedDraftId)
    : await forgeInstance().store.latestByAuthor(actor);
  if (!draft) {
    const error = new Error("Nenhum rascunho válido seu está aguardando aprovação.");
    error.code = "DRAFT_NOT_FOUND";
    throw error;
  }
  if (draft.author !== actor) {
    const error = new Error("Você só pode aprovar rascunhos criados pela sua própria conta de ADM.");
    error.code = "CARDINAL_PERMISSION_DENIED";
    throw error;
  }
  if (draft.status !== "VALID") {
    const error = new Error("Esse rascunho não está aguardando aprovação. Ele já foi publicado ou precisa ser revisado.");
    error.code = "DRAFT_NOT_APPROVABLE";
    throw error;
  }
  await balanceInstance().ready;
  const gate = await qualityGate({ engine: balanceInstance(), type: draft.type, content: draft.content });
  if (!draft.validation.valid || !gate.passed) return { draft, gate, published: false };
  await instance().ready;
  const plan = instance().plan(`publique o draft ${draft.id}`);
  const result = await instance().executePlan(actor, plan);
  return { draft, gate, published: true, result };
}

async function correctLatestDraft(actor) {
  await forgeInstance().ready;
  const current = await forgeInstance().store.latestByAuthor(actor, { status: null });
  if (!current) {
    const error = new Error("Nenhuma ficha sua foi encontrada para corrigir.");
    error.code = "DRAFT_NOT_FOUND";
    throw error;
  }
  if (current.status === "PUBLISHED") {
    const error = new Error("A ficha já foi publicada e não pode ser corrigida automaticamente como rascunho.");
    error.code = "DRAFT_NOT_APPROVABLE";
    throw error;
  }
  const revision = await forgeInstance().revise(current.id, "Corrija automaticamente todos os problemas de schema, qualidade, Rank, slot e descrição indicados na validação. Preserve o conceito central pedido pelo ADM e não aumente atributos além do limite oficial.", { author: actor });
  await balanceInstance().ready;
  const gate = await qualityGate({ engine: balanceInstance(), type: revision.draft.type, content: revision.draft.content });
  return { draft: revision.draft, gate };
}

async function handler(msg) {
  const actor = msg.author || msg.from;
  const text = String(msg.body || "").replace(/^!cardinal\s*/i, "").trim();
  try {
    if (!await adminCore.isAdmin(actor)) return send(msg, templates.denied());
    const approval = approvalRequest(text);
    if (approval) {
      const outcome = await approveLatestDraft(actor, approval.draftId);
      if (!outcome.published) return send(msg, forgeDraftResponse(outcome.draft, outcome.gate));
      return send(msg, templates.success({
        module: "FORGE + PUBLISHER",
        title: "CONTEÚDO PUBLICADO",
        summary: `${outcome.draft.content.nome || "O conteúdo"} foi publicado com sucesso.`,
        sections: [{ title: "Publicação", fields: [{ label: "Draft", value: outcome.draft.id }, { label: "Tipo", value: outcome.draft.type }, { label: "Operação", value: outcome.result.operation_id }], lines: ["A ficha aprovada agora está disponível no sistema."] }],
        meta: { draftId: outcome.draft.id, transactionId: outcome.result.operation_id, code: "DRAFT_PUBLISHED" }
      }));
    }
    if (automaticCorrectionRequest(text)) {
      const outcome = await correctLatestDraft(actor);
      return send(msg, forgeDraftResponse(outcome.draft, outcome.gate));
    }
    const name = levelQuestion(text);
    if (name) {
      const player = await playerLevel(name);
      if (!player) return send(msg, templates.warning({ module: "JOGADOR", title: "NÃO ENCONTRADO", summary: `Não encontrei o jogador ${name}.`, meta: { code: "PLAYER_NOT_FOUND" } }));
      return send(msg, templates.info({ module: "JOGADOR", title: player.nome, summary: `Nível ${Number(player.nivel || 1)} • Rank ${player.rank || "—"}`, sections: [{ title: "Perfil", fields: [{ label: "Nível", value: Number(player.nivel || 1) }, { label: "Rank", value: player.rank || "—" }, { label: "Classe", value: player.classe || "Não definida" }, { label: "Experiência", value: Number(player.experiencia || 0) }], lines: [] }] }));
    }
    if (externalCreationRequest(text)) return require("./cardinalWeb")(msg);
    const type = forgeType(text);
    if (type) {
      await forgeInstance().ready;
      const result = await forgeInstance().generate(text, { type, author: actor });
      await balanceInstance().ready;
      const gate = await qualityGate({ engine: balanceInstance(), type, content: result.draft.content });
      return send(msg, forgeDraftResponse(result.draft, gate));
    }
    if (/^(?:balance|qa|simulate|exploit-scan)(?:\s|$)/i.test(text)) return require("./cardinalBalance")(msg);
    if (/^(?:world|mundo)(?:\s|$)/i.test(text)) return require("./cardinalWorld")(msg);
    if (/^(?:narrative|narrativa)(?:\s|$)/i.test(text)) return require("./cardinalNarrative")(msg);
    if (/^(?:analytics|analitica|analítica)(?:\s|$)/i.test(text)) return require("./cardinalAnalytics")(msg);
    if (/^(?:web\s+search|pesquise|pesquisar)(?:\s|$)/i.test(text)) return require("./cardinalWeb")(msg);
    if (/^dev(?:\s|$)/i.test(text)) return require("./cardinalDev")(msg);
    if (/^(?:ops(?:\s|$)|status$|health$|reinicie\s+(?:bot|site|qwen)|(?:bot|site|qwen).*(?:online|caiu))/i.test(text)) return require("./cardinalOps")(msg);
    if (/^(?:workflow|orquestrar)(?:\s|$)/i.test(text)) return require("./cardinalOrchestrator")(msg);
    if (!text) return send(msg, templates.info({ module: "ADMIN", summary: "Envie uma ordem administrativa." }));
    const result = await instance().executeNatural(actor, text, { dryRun: /\bsimule\b|\bdry[ -]?run\b/i.test(text) });
    if (result.dry_run) return send(msg, templates.warning({ module: "ADMIN", title: "SIMULAÇÃO — NADA FOI ALTERADO", status: "ESCRITAS DESATIVADAS", summary: "O Cardinal calculou a ordem, mas não atualizou o banco de dados.", sections: [{ title: "Para aplicar de verdade", fields: [], lines: ["No .env local, defina CARDINAL_ADMIN_WRITES_ENABLED=true e reinicie o bot.", "Depois envie a ordem novamente. Operações de maior risco continuarão exigindo confirmação."] }], meta: { code: "CARDINAL_DRY_RUN" } }));
    return MessageService.send({ message: msg, text: renderAdmin(result) });
  } catch (error) {
    return send(msg, cardinalError(error, "ADMIN"));
  }
}

module.exports = handler;
module.exports.levelQuestion = levelQuestion;
module.exports.forgeType = forgeType;
module.exports.externalCreationRequest = externalCreationRequest;
module.exports.approvalRequest = approvalRequest;
module.exports.automaticCorrectionRequest = automaticCorrectionRequest;
