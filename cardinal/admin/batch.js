"use strict";
const crypto = require("node:crypto");
const { planNatural } = require("./planner");
const { normalize } = require("./resolver");
const { AdminError, CODES } = require("./errors");
const targets = { player: "jogadores", item: "itens", banner: "gacha_banners", dungeon: "dungeons", mission: "missoes", guild: "guildas" };
const labels = { give_xp: "Dar XP", give_mastery: "Dar Maestria", give_crystals: "Dar Cristais", give_wons: "Dar Won", give_item: "Entregar item", remove_item: "Retirar item", remove_wons: "Retirar Won", remove_crystals: "Retirar Cristais", set_wons: "Definir Won", set_crystals: "Definir Cristais", edit_player: "Alterar ficha", adjust_rank: "Alterar rank", activate_banner: "Ativar banner", deactivate_banner: "Desativar banner", edit_banner: "Alterar banner", update_dungeon: "Alterar dungeon", update_mission: "Alterar missão", edit_guild: "Alterar guilda" };

function recipients(text) {
    const result = [], pattern = /"([^"]+)"|'([^']+)'|([^,"']+)/g;
    for (const match of String(text).matchAll(pattern)) {
        if (match[1] || match[2]) result.push(match[1] || match[2]);
        else result.push(...match[3].split(/\s+e\s+/i));
    }
    return [...new Map(result.map(value => value.trim().replace(/^(?:o\s+|a\s+)?(?:jogador(?:es)?|players?)\s+/i, "").replace(/[.!]+$/, "")).filter(Boolean).map(value => [normalize(value), value])).values()];
}

function naturalBatch(message) {
    const clauses = String(message).trim().split(/\s*;\s*|\n+|\s+e\s+(?=(?:dê|de|adicione|conceda|entregue|altere|mude|troque|ajuste|defina|ative|desative|retire|remova)\s)/i).filter(Boolean);
    return clauses.map(clause => {
        const plan = planNatural(clause);
        if (plan.parameters.player && plan.intent.startsWith("give_")) {
            const destination = clause.match(/\s+(?:para|ao|a)\s+(.+)$/i)?.[1];
            const names = recipients(destination || plan.parameters.player);
            if (names.length === 1 && /^(?:todos|todas)(?:\s+os|\s+as)?\s+(?:jogadores|players)$/i.test(names[0])) {
                delete plan.parameters.player;
                plan.parameters.all_players = true;
            } else { delete plan.parameters.player; plan.parameters.players = names; }
        }
        return plan;
    });
}

async function exactTarget(database, table, value, cache = new Map()) {
    const text = String(value ?? "").trim().replace(/^id\s*[:#]?\s*/i, "");
    if (!text) throw new AdminError(CODES.INVALID_INPUT, `Informe o destino em ${table}.`);
    if (!cache.has(table)) cache.set(table, await database.all(`SELECT id,nome${table === "jogadores" ? ",numero" : ""} FROM ${table}`));
    const rows = cache.get(table);
    if (/^\d{1,8}$/.test(text) || (/^id\s*[:#]?\s*\d+$/i.test(String(value)) && Number.isSafeInteger(Number(text)))) {
        const row = rows.find(row => String(row.id) === String(Number(text)));
        if (row && String(row.nome || "").trim()) return { id: row.id, nome: row.nome };
        throw new AdminError(CODES.ENTITY_NOT_FOUND, `ID ${text} não encontrado em ${table}.`);
    }
    const phone = text.replace(/\D/g, "");
    const phoneKey = number => { const digits = String(number || "").split("@")[0].replace(/\D/g, ""); return /^55\d{10,11}$/.test(digits) ? digits.slice(2) : digits; };
    const matches = rows.filter(row => normalize(row.nome) === normalize(text) || (table === "jogadores" && phone.length >= 10 && phoneKey(row.numero) === phoneKey(phone)));
    if (matches.length === 1) return { id: matches[0].id, nome: matches[0].nome };
    const candidates = matches.length ? matches : rows.filter(row => normalize(row.nome).includes(normalize(text)));
    throw new AdminError(candidates.length ? CODES.AMBIGUOUS_TARGET : CODES.ENTITY_NOT_FOUND,
        candidates.length ? `Identificação incompleta de "${value}". Informe o nome completo ou ID: ${candidates.slice(0, 20).map(row => `${row.nome} (ID ${row.id})`).join(", ")}. Nada foi executado.` : `Não encontrei "${value}" em ${table}. Nada foi executado.`,
        { matches: candidates.slice(0, 20).map(row => ({ id: row.id, nome: row.nome })) });
}

async function prepareBatch(service, actor, message, options = {}) {
    await service.rbac.authorize(actor, "CARDINAL_READ");
    const confirmationId = options.requestId ? `confirm_${crypto.createHash("sha256").update(JSON.stringify([actor, options.channelId || null, options.requestId])).digest("hex").slice(0, 32)}` : null;
    if (confirmationId && !options.dryRun && service.writesEnabled) {
        await service.repository.initialize();
        const old = await service.database.get("SELECT * FROM cardinal_admin_confirmations WHERE confirmation_id=? AND admin_number=?", [confirmationId, actor]);
        if (old) {
            if (!old.confirmed_at && Date.parse(old.expires_at) <= Date.now()) throw new AdminError(CODES.CONFIRMATION_EXPIRED, "Essa ordem já expirou ou foi cancelada. Envie uma nova mensagem.");
            return { operation: JSON.parse(old.operation_json), confirmation_id: old.confirmation_id, expires_at: old.expires_at, already_applied: Boolean(old.confirmed_at), dry_run: false };
        }
    }
    let plans;
    try { plans = naturalBatch(message); }
    catch (error) {
        if (!service.client) throw error;
        plans = await require("./llm-planner").planBatchWithModel(service.client, message, service.registry);
    }
    if (!Array.isArray(plans) || !plans.length) throw new AdminError(CODES.INVALID_INPUT, "Informe pelo menos uma ação, seu objeto e seus destinos.");
    const actions = [], problems = [], cache = new Map();
    for (const plan of plans) {
        if (!labels[plan.intent]) throw new AdminError(CODES.UNSUPPORTED, `A ação ${plan.intent} não possui execução confirmada em lote. Informe uma ordem de ficha, economia, item, banner, missão, dungeon ou guilda.`);
        const tool = service.registry.get(plan.intent);
        const admin = await service.rbac.authorize(actor, tool.permission);
        const base = { ...plan.parameters };
        let destinations = base.players || (base.player != null ? [base.player] : [null]);
        if (base.all_players) {
            if (!/\b(?:todos|todas)(?:\s+os|\s+as)?\s+(?:jogadores|players)\b/.test(normalize(message))) throw new AdminError(CODES.INVALID_INPUT, "O grupo de jogadores precisa estar explícito na ordem.");
            destinations = (await service.database.all("SELECT id FROM jogadores ORDER BY id")).map(row => row.id);
        }
        if (!Array.isArray(destinations) || !destinations.length) throw new AdminError(CODES.INVALID_INPUT, "Nenhum jogador selecionado. Informe os nomes ou IDs.");
        delete base.players; delete base.all_players;
        const seen = new Set();
        for (const destination of destinations) {
            const parameters = { ...base, ...(destination != null ? { player: destination } : {}) }, identities = [];
            try {
                for (const [key, table] of Object.entries(targets)) if (parameters[key] != null) {
                    const identity = await exactTarget(service.database, table, parameters[key], cache);
                    parameters[key] = identity.id;
                    identities.push({ key, table, ...identity });
                }
                if (!identities.length) throw new AdminError(CODES.INVALID_INPUT, "A ação precisa de objeto e destino identificados.");
                const signature = JSON.stringify(parameters);
                if (seen.has(signature)) continue;
                seen.add(signature);
                for (const key of tool.input_schema?.required || []) if (parameters[key] == null || parameters[key] === "") throw new AdminError(CODES.INVALID_INPUT, `Informe ${key}.`);
                const preview = await tool.execute({ query: service.database, database: service.database, admin, dryRun: true }, parameters);
                actions.push({ intent: plan.intent, parameters, identities, before: preview.before, after: preview.after });
            } catch (error) { problems.push(error.message); }
        }
    }
    if (problems.length) throw new AdminError(CODES.INVALID_INPUT, `Não posso pedir confirmação ainda:\n${problems.join("\n")}\nCorrija os alvos e reenvie a ordem completa. Nenhuma ação foi executada.`);
    const operation = { intent: "confirmed_batch", actions, original_message: message, channel_id: options.channelId || null, ready: !options.requireDelivery, operation_id: `op_${crypto.randomUUID()}`, request_id: options.requestId || crypto.randomUUID() };
    if (options.dryRun || !service.writesEnabled) return { operation, dry_run: true };
    await service.repository.initialize();
    // A fresh order replaces the prior unconfirmed plan in this conversation.
    const pending = await service.database.all("SELECT confirmation_id,operation_json FROM cardinal_admin_confirmations WHERE admin_number=? AND confirmed_at IS NULL", [actor]);
    for (const row of pending) { const old = JSON.parse(row.operation_json); if (row.confirmation_id !== confirmationId && old.intent === operation.intent && old.channel_id === operation.channel_id) await service.database.run("UPDATE cardinal_admin_confirmations SET expires_at=? WHERE confirmation_id=?", [new Date().toISOString(), row.confirmation_id]); }
    const confirmation = await service.repository.createConfirmation(actor, operation, 15 * 60 * 1000, confirmationId);
    const stored = await service.database.get("SELECT operation_json,confirmed_at FROM cardinal_admin_confirmations WHERE confirmation_id=?", [confirmation.confirmation_id]);
    return { operation: JSON.parse(stored.operation_json), ...confirmation, already_applied: Boolean(stored.confirmed_at), dry_run: false };
}

async function confirmBatch(service, actor, id, options = {}) {
    if (!service.writesEnabled) throw new AdminError(CODES.PERMISSION_DENIED, "Escritas desativadas; nada foi aplicado.");
    await service.rbac.authorize(actor, "CARDINAL_READ");
    const result = await service.repository.transaction(async query => {
        const operation = await service.repository.consumeConfirmationWithQuery(query, id, actor);
        if (operation.intent !== "confirmed_batch") throw new AdminError(CODES.INVALID_INPUT, "Confirmação não corresponde a um lote.");
        if (operation.ready === false) throw new AdminError(CODES.INVALID_INPUT, "A lista completa ainda não foi entregue. Aguarde ou reenvie a ordem. Nada foi aplicado.");
        if (operation.channel_id && operation.channel_id !== options.channelId) throw new AdminError(CODES.PERMISSION_DENIED, "Confirme na mesma conversa em que os destinos foram identificados.");
        // Lock every object/destination in a stable order, then revalidate identities.
        const identities = [...new Map(operation.actions.flatMap(action => action.identities).map(identity => [`${identity.table}:${identity.id}`, identity])).values()].sort((a, b) => `${a.table}:${a.id}`.localeCompare(`${b.table}:${b.id}`));
        for (const identity of identities) {
            const row = await query.get(`SELECT id,nome FROM ${identity.table} WHERE id=?${service.provider === "postgres" ? " FOR UPDATE" : ""}`, [identity.id]);
            if (!row || row.nome !== identity.nome) throw new AdminError(CODES.INVALID_INPUT, `O alvo ${identity.nome} (ID ${identity.id}) mudou ou foi removido. Reenvie a ordem para identificar novamente. Nada foi aplicado.`);
        }
        const outcomes = [];
        for (const [index, action] of operation.actions.entries()) {
            const tool = service.registry.get(action.intent), admin = await service.rbac.authorize(actor, tool.permission);
            const output = await tool.execute({ query, database: service.database, admin, dryRun: false }, action.parameters);
            if (output._postCommit) throw new AdminError(CODES.UNSUPPORTED, "Essa ação requer publicação separada.");
            const rendered = { success: true, intent: action.intent, identities: action.identities, entity: output.entity, before: output.before, after: output.after, result: output.result };
            await service.repository.record(query, { operationId: `${operation.operation_id}_${index}`, idempotencyKey: `batch:${id}:${index}`, admin: { number: actor, name: admin.nome }, originalMessage: operation.original_message, intent: action.intent, tool: action.intent, risk: tool.risk, parameters: action.parameters, ...output, result: rendered, status: "SUCCESS", confirmationId: id });
            outcomes.push(rendered);
        }
        return { success: true, operation_id: operation.operation_id, actions: outcomes };
    });
    return result;
}

function describeBatch(prepared) {
    const lines = prepared.operation.actions.map((action, index) => {
        const names = action.identities.map(identity => `${{ player: "Jogador", item: "Item", banner: "Banner", dungeon: "Dungeon", mission: "Missão", guild: "Guilda" }[identity.key]}: ${identity.nome} (ID ${identity.id})`).join("\n");
        const values = action.parameters.amount != null ? `: ${action.parameters.amount}` : action.parameters.quantity != null ? `: ${action.parameters.quantity} unidade(s)` : `: ${Object.entries(action.after || {}).map(([key, value]) => `${key.replace(/_/g, " ")} = ${value}`).join(", ")}`;
        return `${index + 1}. ${labels[action.intent]}${values}\n${names}`;
    });
    return [`Identifiquei ${lines.length} ação(ões):`, ...lines, prepared.dry_run ? "Simulação: nada será aplicado." : `Posso executar todas essas ações? Responda !cardinal sim ou !cardinal confirmar ${prepared.confirmation_id}.\nValidade: 15 minutos. Nada foi aplicado ainda. Para desistir: !cardinal cancelar.`].join("\n\n");
}
function describeCompleted(result) {
    return `Concluí ${result.actions.length} ação(ões):\n\n${result.actions.map((action, index) => `${index + 1}. ${labels[action.intent]} — ${action.identities.map(row => `${row.nome} (ID ${row.id})`).join(" → ")}\n${Object.entries(action.after || {}).map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`).join(", ")}`).join("\n\n")}\n\nTodas as ações foram registradas.`;
}
module.exports = { prepareBatch, confirmBatch, naturalBatch, exactTarget, describeBatch, describeCompleted };
