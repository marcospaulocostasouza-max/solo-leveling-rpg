"use strict";

const readline = require("readline");
const { CardinalAssistant, CardinalForgeService, createAdminService, ContextManager } = require("../core");
const { parseStructured } = require("../forge/json");
const { renderAdmin } = require("../admin/renderer");

const debug = process.argv.includes("--debug");
function parseCommand(input) { const match = String(input).trim().match(/^(create|validate|show|versions|compare|rollback|edit)\b\s*(.*)$/i); return match ? { command: match[1].toLowerCase(), rest: match[2].trim() } : null; }
function looksLikeForge(input) { return /^(?:cardinal[, :]*)?(?:crie|criar|gere|forje)\b/i.test(String(input).trim()); }
function looksLikeAdmin(input) { return /^(?:cardinal[, :]*)?(?:d[eê]|adicione|publique|ative|aprove)\b/i.test(String(input).trim()) || /^(?:publish|give-wons|give-crystals|history|admin-rollback|confirm|dry-run)\b/i.test(String(input).trim()); }
function explicitAdmin(input) { const parts = String(input).trim().split(/\s+/), command = parts.shift(); let dryRun = false; if (command === "dry-run") { dryRun = true; return { nested: parts.join(" "), dryRun }; } if (command === "publish") return { plan: { intent: "publish_draft", parameters: { draft_id: parts[0] }, original_message: input }, dryRun }; if (["give-wons", "give-crystals"].includes(command)) return { plan: { intent: command.replace("-", "_"), parameters: { player: parts.slice(0, -1).join(" "), amount: Number(parts.at(-1)) }, original_message: input }, dryRun }; return { command, args: parts, dryRun }; }

async function executeForge(forge, parsed, raw) {
    if (!parsed) return forge.generate(raw, { author: "local-cli" });
    const args = parsed.rest.split(/\s+/);
    if (parsed.command === "create") { const type = args.shift(); return forge.generate(args.join(" "), { type, author: "local-cli" }); }
    if (parsed.command === "validate") return forge.validateDraft(args[0]);
    if (parsed.command === "show") return forge.show(args[0], args[1]);
    if (parsed.command === "versions") return forge.versions(args[0]);
    if (parsed.command === "compare") return forge.compare(args[0], args[1], args[2]);
    if (parsed.command === "rollback") return forge.rollback(args[0], args[1], { author: "local-cli" });
    if (parsed.command === "edit") { const id = args.shift(); return forge.edit(id, parseStructured(args.join(" ")), { author: "local-cli" }); }
}
async function processInput(assistant, forge, input, session = {}) {
    try {
        const parsed = parseCommand(input);
        if (looksLikeAdmin(input) && !looksLikeForge(input)) {
            const actor = process.env.CARDINAL_ADMIN_ACTOR; if (!actor) throw new Error("Defina CARDINAL_ADMIN_ACTOR com o número do ADM autenticado.");
            session.admin ||= createAdminService(); await session.admin.ready;
            let request = explicitAdmin(input); if (request.nested) request = { ...explicitAdmin(request.nested), dryRun: true };
            let result;
            if (request.command === "history") result = await session.admin.history(actor);
            else if (request.command === "admin-rollback") result = await session.admin.rollback(actor, request.args[0], { dryRun: request.dryRun });
            else if (request.command === "confirm") result = await session.admin.confirm(actor, request.args[0]);
            else { const plan = request.plan ? { ...request.plan, risk: require("../admin/risk").riskFor(request.plan.intent) } : session.admin.plan(input); result = await session.admin.executePlan(actor, plan, { dryRun: request.dryRun }); }
            console.log(typeof result?.success === "boolean" ? renderAdmin(result) : JSON.stringify(result, null, 2)); return;
        }
        if (parsed || looksLikeForge(input) || (session.activeDraft && /^(?:agora|troque|mude|altere|adicione|remova)\b/i.test(input))) {
            const result = !parsed && !looksLikeForge(input) ? await forge.revise(session.activeDraft, input, { author: "local-cli" }) : await executeForge(forge, parsed, input);
            if (result?.draft?.id) session.activeDraft = result.draft.id;
            const text = result.rendered || JSON.stringify(result, null, 2);
            console.log(`Cardinal> ${text}`); if (debug && result.plan) console.log("Plano>\n" + JSON.stringify(result.plan, null, 2)); return;
        }
        const result = await assistant.ask(input, { actor: "local-cli" }); console.log(`Cardinal> ${result.text}`); if (debug) console.log("Fontes>\n" + JSON.stringify(result.sources, null, 2));
    } catch (error) { console.error(`Cardinal indisponível [${error.code || "ERROR"}]: ${error.message}`); process.exitCode = 1; }
}

async function main() {
    const memory = new ContextManager(); const assistant = new CardinalAssistant({ memory }); const forge = new CardinalForgeService({ client: assistant.client, memory }); const session = {};
    const direct = process.argv.slice(2).filter(item => item !== "--debug").join(" ").trim();
    if (direct) { await processInput(assistant, forge, direct, session); await session.admin?.close?.(); return forge.close(); }
    const health = await assistant.client.healthCheck(); if (!health.ok) throw new Error(health.error || `Health check falhou (HTTP ${health.status}).`);
    const terminal = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "Você> " });
    console.log("Cardinal conectado. Consultas e Cardinal Forge em modo de draft. Digite 'sair' para encerrar."); terminal.prompt();
    terminal.on("line", async line => { if (/^(?:sair|exit|quit)$/i.test(line.trim())) return terminal.close(); if (line.trim()) await processInput(assistant, forge, line, session); terminal.prompt(); });
    terminal.on("close", () => { forge.close().catch(() => {}); session.admin?.close?.().catch(() => {}); });
}
main().catch(error => { console.error(`[CARDINAL] ${error.message}`); process.exitCode = 1; });

module.exports = { parseCommand, looksLikeForge, looksLikeAdmin, explicitAdmin };
