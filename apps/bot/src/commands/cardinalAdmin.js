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
let service, forge, balance, memory;
const memoryInstance = () => memory ||= new (require("../../../../cardinal/memory").ContextManager)({ root: require("path").resolve(__dirname, "../../../..") });
const instance = () => service ||= createAdminService();
const forgeInstance = () => forge ||= new CardinalForgeService();
const balanceInstance = () => balance ||= new BalanceEngine();
const send = (msg, dto) => MessageService.send({ message: msg, text: renderers.whatsapp.render(dto) });

function levelQuestion(text) {
  return String(text || "").match(/(?:qual(?:\s+[eé])?\s+o\s+)?n[ií]vel\s+(?:do|da)\s+(?:player|jogador)\s+(.+?)[?.!]*$/i)?.[1]?.trim() || null;
}

function playerDetailsQuestion(text) {
  const value = String(text || "").trim();
  const match = value.match(/(?:ficha|perfil|invent[aá]rio|saldo|atributos|t[eé]cnicas?)\s+(?:do|da)?\s*(?:player|jogador)\s+(.+?)[?.!]*$/i)
    || value.match(/(?:mostre|consulte|veja)\s+(?:a\s+)?(?:ficha|perfil|invent[aá]rio|saldo|atributos|t[eé]cnicas?)\s+(?:de|do|da)\s+(.+?)[?.!]*$/i);
  return match?.[1]?.trim() || null;
}

function cardinalText(body) {
  return String(body || "")
    .replace(/^\s*(?:!|\.\s*#)\s*cardinal\b\s*/i, "")
    .trim();
}

async function playerLevel(name) {
  return database.get("SELECT nome,nivel,rank,experiencia,classe FROM jogadores WHERE LOWER(TRIM(nome))=LOWER(TRIM(?)) LIMIT 1", [name]);
}

async function playerDetails(name) {
  const player = await database.get("SELECT id,nome,nivel,rank,experiencia,classe,estilo_luta,won,cristais,maestria,forca_total,resistencia_total,velocidade_total,sentidos_total,inteligencia_total,poder_magico_total FROM jogadores WHERE LOWER(TRIM(nome))=LOWER(TRIM(?)) LIMIT 1", [name]);
  if (!player) return null;
  const [inventory, techniques] = await Promise.all([
    database.all("SELECT i.nome,i.tier,inv.quantidade,inv.equipado FROM inventario_jogador inv JOIN itens i ON i.id=inv.item_id WHERE inv.jogador_id=? ORDER BY inv.equipado DESC,i.nome LIMIT 20", [player.id]).catch(() => []),
    database.all("SELECT t.nome,t.rank,jt.nivel,jt.equipada FROM jogador_tecnicas jt JOIN tecnicas t ON t.id=jt.tecnica_id WHERE jt.jogador_id=? ORDER BY t.nome LIMIT 20", [player.id]).catch(() => [])
  ]);
  return { player, inventory, techniques };
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
  if (/\b(?:tecnica|técnica|feiti[cç]o|magia|habilidade|skill)\b/.test(value)) return "technique";
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

async function correctLatestDraft(actor, request) {
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
  const revision = await forgeInstance().revise(current.id, request || "Corrija automaticamente todos os problemas de schema, qualidade, Rank, slot e descrição indicados na validação. Preserve o conceito central pedido pelo ADM e não aumente atributos além do limite oficial.", { author: actor });
  await balanceInstance().ready;
  const gate = await qualityGate({ engine: balanceInstance(), type: revision.draft.type, content: revision.draft.content });
  return { draft: revision.draft, gate };
}

async function sendBatchText(msg, text) {
  const chunks = []; let remaining = String(text);
  while (remaining.length > 3500) { let cut = remaining.lastIndexOf("\n", 3500); if (cut < 100) cut = 3500; chunks.push(remaining.slice(0, cut)); remaining = remaining.slice(cut).replace(/^\n/, ""); }
  chunks.push(remaining);
  for (const [index, chunk] of chunks.entries()) {
    const result = await MessageService.send({ message: msg, text: chunks.length > 1 ? `Parte ${index + 1}/${chunks.length}\n${chunk}` : chunk });
    if (result?.sucesso === false) throw new Error("Não foi possível entregar a lista completa. Reenvie a ordem; nada foi aplicado.");
  }
}

async function requestAdministrativeActions(msg, actor, text) {
  await instance().ready;
  const prepared = await instance().prepareNatural(actor, text, { channelId: msg.from, requestId: msg.id?._serialized, dryRun: /\bsimule\b|\bdry[ -]?run\b/i.test(text), requireDelivery: true });
  if (prepared.already_applied) return MessageService.send({ message: msg, text: "Essa ordem já foi confirmada e executada. Não repeti as entregas." });
  await sendBatchText(msg, require("../../../../cardinal/admin/batch").describeBatch(prepared));
  if (!prepared.dry_run) await instance().markBatchReady(actor, prepared.confirmation_id, msg.from);
}

async function confirmCreation(msg, actor, id) {
  const operation = await require('../../../../cardinal/admin/creation-interpretation').consumeCreation(instance(), actor, id, msg.from);
  if (externalCreationRequest(operation.original_message)) return require('./cardinalWeb')({ ...msg, body: `!cardinal ${operation.original_message}` });
  await forgeInstance().ready;
  const result = await forgeInstance().generate(operation.original_message, { type: operation.type, author: actor });
  await balanceInstance().ready;
  const gate = await qualityGate({ engine: balanceInstance(), type: operation.type, content: result.draft.content });
  return send(msg, forgeDraftResponse(result.draft, gate));
}

async function handler(msg) {
  const actor = msg.author || msg.from;
  const text = cardinalText(msg.body);
  try {
    if (!await adminCore.isAdmin(actor)) return send(msg, templates.denied());
    const confirmation = text.match(/^(?:confirmar|confirme)\s+(confirm_[a-z0-9-]+)$/i);
    if (confirmation) {
      await instance().ready;
      const row = await database.get('SELECT operation_json FROM cardinal_admin_confirmations WHERE confirmation_id=? AND admin_number=?', [confirmation[1], actor]);
      if (row && JSON.parse(row.operation_json).intent === 'interpreted_creation') return await confirmCreation(msg, actor, confirmation[1]);
      const result = await instance().confirm(actor, confirmation[1], { channelId: msg.from });
      return result.actions ? sendBatchText(msg, require("../../../../cardinal/admin/batch").describeCompleted(result)) : MessageService.send({ message: msg, text: renderAdmin(result) });
    }
    if (/^(?:cancelar|cancele|não|nao)[.!]*$/i.test(text)) {
      await instance().ready;
      const canceled = await instance().cancelBatch(actor, msg.from);
      return MessageService.send({ message: msg, text: canceled ? "Plano cancelado. Nada foi aplicado." : "Nenhum plano está aguardando confirmação nesta conversa." });
    }
    if (/^(?:sim|pode|pode executar|confirmo|confirmar|aprovado|confirmado)[.!]*$/i.test(text)) {
      await instance().ready;
      const pending = await instance().pendingBatch(actor, msg.from);
      if (pending) {
        if (pending.operation_json && JSON.parse(pending.operation_json).intent === 'interpreted_creation') return await confirmCreation(msg, actor, pending.confirmation_id);
        const result = await instance().confirm(actor, pending.confirmation_id, { channelId: msg.from });
        return sendBatchText(msg, require("../../../../cardinal/admin/batch").describeCompleted(result));
      }
      if (!approvalRequest(text)) return MessageService.send({ message: msg, text: "Nenhum plano está aguardando confirmação nesta conversa. Envie a ordem com os objetos e destinos." });
    }
    if (/^(?:dê|de|dar|adicione|adicionar|conceda|entregue|retire|remova|defina|ative|desative|desativar|altere|mude|troque|ajuste)\s/i.test(text) && !/\b(?:rascunho|draft)\b/i.test(text)) return await requestAdministrativeActions(msg, actor, text);
    const approval = approvalRequest(text);
    if (approval) {
      const outcome = await approveLatestDraft(actor, approval.draftId);
      if (!outcome.published) return send(msg, forgeDraftResponse(outcome.draft, outcome.gate));
      return send(msg, templates.success({
        module: "FORGE + PUBLISHER",
        title: "CONTEÚDO PUBLICADO",
        summary: `${outcome.draft.content.nome || "O conteúdo"} foi publicado com sucesso.`,
        sections: [{ title: "Publicação", fields: [{ label: "Tipo", value: outcome.draft.type }, { label: "Operação", value: outcome.result.operation_id }], lines: ["A ficha aprovada agora está disponível no sistema."] }],
        meta: { draftId: outcome.draft.id, transactionId: outcome.result.operation_id, code: "DRAFT_PUBLISHED" }
      }));
    }
    if (automaticCorrectionRequest(text)) {
      const outcome = await correctLatestDraft(actor);
      return send(msg, forgeDraftResponse(outcome.draft, outcome.gate));
    }
    if (!/\b(?:jogador|player)\b/i.test(text) && /^(?:agora\s+)?(?:altere|mude|troque|ajuste|corrija|reescreva)\s+(?:o\s+|a\s+)?(?:rascunho|draft|ficha|descricao|descrição|nome|rank|slot|efeito|atributos)\b/i.test(text)) {
      const outcome = await correctLatestDraft(actor, text);
      return send(msg, forgeDraftResponse(outcome.draft, outcome.gate));
    }
    const name = levelQuestion(text);
    if (name) {
      const player = await playerLevel(name);
      if (!player) return send(msg, templates.warning({ module: "JOGADOR", title: "NÃO ENCONTRADO", summary: `Não encontrei o jogador ${name}.`, meta: { code: "PLAYER_NOT_FOUND" } }));
      return send(msg, templates.info({ module: "JOGADOR", title: player.nome, summary: `Nível ${Number(player.nivel || 1)} • Rank ${player.rank || "—"}`, sections: [{ title: "Perfil", fields: [{ label: "Nível", value: Number(player.nivel || 1) }, { label: "Rank", value: player.rank || "—" }, { label: "Classe", value: player.classe || "Não definida" }, { label: "Experiência", value: Number(player.experiencia || 0) }], lines: [] }] }));
    }
    const detailsName = playerDetailsQuestion(text);
    if (detailsName) {
      const details = await playerDetails(detailsName);
      if (!details) return send(msg, templates.warning({ module: "JOGADOR", title: "NÃO ENCONTRADO", summary: `Não encontrei o jogador ${detailsName}.`, meta: { code: "PLAYER_NOT_FOUND" } }));
      const p = details.player;
      return send(msg, templates.info({ module: "JOGADOR", title: p.nome, summary: `Nível ${Number(p.nivel || 1)} • Rank ${p.rank || "—"}`, sections: [
        { title: "Perfil", fields: [{ label: "Classe", value: p.classe || "Não definida" }, { label: "Estilo", value: p.estilo_luta || "Nenhum" }, { label: "XP", value: Number(p.experiencia || 0) }, { label: "Won", value: Number(p.won || 0) }, { label: "Cristais", value: Number(p.cristais || 0) }, { label: "Maestria", value: Number(p.maestria || 0) }], lines: [] },
        { title: "Atributos", fields: [{ label: "Força", value: Number(p.forca_total || 0) }, { label: "Resistência", value: Number(p.resistencia_total || 0) }, { label: "Velocidade", value: Number(p.velocidade_total || 0) }, { label: "Sentidos", value: Number(p.sentidos_total || 0) }, { label: "Inteligência", value: Number(p.inteligencia_total || 0) }, { label: "Poder Mágico", value: Number(p.poder_magico_total || 0) }], lines: [] },
        { title: "Inventário", fields: [], lines: details.inventory.length ? details.inventory.map(item => `${Number(item.equipado) ? "• Equipado: " : "• "}${item.nome} x${item.quantidade || 0} (${item.tier || "sem rank"})`) : ["Nenhum item encontrado."] },
        { title: "Técnicas", fields: [], lines: details.techniques.length ? details.techniques.map(item => `• ${item.nome} — Rank ${item.rank || "—"}, nv. ${item.nivel || 1}${Number(item.equipada) ? ", equipada" : ""}`) : ["Nenhuma técnica encontrada."] }
      ] }));
    }
    const type = forgeType(text);
    if (type) {
      await instance().ready;
      const prepared = await require('../../../../cardinal/admin/creation-interpretation').prepareCreation(instance(), actor, text, type, msg.from);
      await sendBatchText(msg, `*INTERPRETAÇÃO DA ORDEM*\n${prepared.operation.summary}\nEstá correto? Responda *!cardinal sim* para gerar o rascunho ou *!cardinal cancelar*.\nNada foi criado nem publicado. A publicação continuará exigindo aprovação do rascunho.\nValidade: 15 minutos.`);
      await instance().markBatchReady(actor, prepared.confirmation_id, msg.from);
      return;
    }
    if (/^(?:balance|qa|simulate|exploit-scan)(?:\s|$)/i.test(text)) return require("./cardinalBalance")(msg);
    if (/^(?:world|mundo)(?:\s|$)/i.test(text)) return require("./cardinalWorld")(msg);
    if (/^(?:narrative|narrativa)(?:\s|$)/i.test(text)) return require("./cardinalNarrative")(msg);
    if (/^(?:analytics|analitica|analítica)(?:\s|$)/i.test(text)) return require("./cardinalAnalytics")(msg);
    if (/^(?:web\s+search|pesquise|pesquisar)(?:\s|$)/i.test(text)) return require("./cardinalWeb")(msg);
    if (/^dev(?:\s|$)/i.test(text)) return require("./cardinalDev")(msg);
    if (/^(?:ops(?:\s|$)|status$|health$|reinicie\s+(?:bot|site|qwen)|(?:bot|site|qwen).*(?:online|caiu))/i.test(text)) return require("./cardinalOps")(msg);
    if (/^(?:workflow|orquestrar)(?:\s|$)/i.test(text)) return require("./cardinalOrchestrator")(msg);
    if (!text || /^(?:oi|olá|ola|ajuda|bom dia|boa tarde|boa noite)[!?.\s]*$/i.test(text)) return send(msg, templates.info({ module: "ADMIN", summary: "Posso consultar regras, criar e revisar conteúdo e executar ordens administrativas. Experimente: !cardinal como funciona a Maestria?; !cardinal crie uma espada Rank D; !cardinal dê 100 XP para Nome Completo." }));
    if (/^(?:qual|quais|como|quanto|quantos|quantas|por que|porque|explique|me explique|o que|quem|onde|continue|e quanto|e como|e qual|tem|existem|existe|liste|mostre|consulte|procure|busque|me diga)\b/i.test(text)) {
      const { CardinalAssistant } = require("../../../../cardinal/core/assistant");
      const answer = await new CardinalAssistant({ memory: memoryInstance() }).ask(text, { actor, channel_id: msg.from });
      return MessageService.send({ message: msg, text: answer.text });
    }
    await instance().ready;
    return await requestAdministrativeActions(msg, actor, text);
  } catch (error) {
    return send(msg, cardinalError(error, "ADMIN"));
  }
}

module.exports = handler;
module.exports.levelQuestion = levelQuestion;
module.exports.playerDetailsQuestion = playerDetailsQuestion;
module.exports.playerDetails = playerDetails;
module.exports.forgeType = forgeType;
module.exports.externalCreationRequest = externalCreationRequest;
module.exports.approvalRequest = approvalRequest;
module.exports.automaticCorrectionRequest = automaticCorrectionRequest;
module.exports.cardinalText = cardinalText;
