"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { parseFile } = require("./parsers");

const EXTENSIONS = new Set([".md", ".json", ".yaml", ".yml", ".js", ".ts", ".sql"]);
const EXCLUDED = /(?:^|[\\/])(?:node_modules|\.git|\.next|build|dist|cache|logs|models|backups|\.wwebjs_auth|\.wwebjs_cache|NPC_LORA|RELATORIOS_ETAPA8)(?:[\\/]|$)/i;
const SECRET = /(?:^|[\\/])\.env(?:\.|$)|credential|secret|token\.json|auth/i;
const ROOTS = ["README.md", "docs", "packages/database", "packages/datasets", "packages/rpg-core", "apps/bot/src/commands", "apps/bot/src/systems", "apps/bot/src/database", "apps/site/lib/architect-catalog.ts"];

function descobrirArquivos(projectRoot, roots = ROOTS) {
    const files = [];
    function visit(target) {
        if (!fs.existsSync(target) || EXCLUDED.test(target) || SECRET.test(target)) return;
        const stat = fs.statSync(target);
        if (stat.isDirectory()) return fs.readdirSync(target, { withFileTypes: true }).forEach(entry => visit(path.join(target, entry.name)));
        if (EXTENSIONS.has(path.extname(target).toLowerCase()) && stat.size <= 8 * 1024 * 1024) files.push({ path: target, stat });
    }
    roots.forEach(root => visit(path.resolve(projectRoot, root)));
    return files.sort((a, b) => a.path.localeCompare(b.path));
}
function hash(content) { return crypto.createHash("sha256").update(content).digest("hex"); }
function carregarDocumentos(projectRoot, options = {}) {
    const docs = [];
    for (const item of descobrirArquivos(projectRoot, options.roots)) {
        const relative = path.relative(projectRoot, item.path).replace(/\\/g, "/");
        const content = fs.readFileSync(item.path, "utf8");
        for (const doc of parseFile(item.path, relative, content, options)) docs.push({ ...doc, hash: hash(`${doc.content}\n${doc.category}\n${doc.system}\n${doc.entity}\n${doc.type}`), mtime: item.stat.mtime.toISOString() });
    }
    return docs;
}

function carregarDocumentosCanonicos(projectRoot) {
    const databaseFile = path.join(projectRoot, "packages", "database", "index.js");
    if (!fs.existsSync(databaseFile)) return [];
    const { slots } = require(databaseFile);
    const entries = Object.entries(slots || {});
    if (!entries.length) return [];
    const content = ["Slots oficiais de equipamento:", ...entries.map(([name, capacity]) => `- ${name}: capacidade ${capacity}`), "Regra de armas: uma Arma 2 (2FP) ocupa seu proprio slot, desequipa as Armas 1 existentes e bloqueia Arma 1. Arma 1 possui capacidade 2 quando nao estiver bloqueada e nao impede que uma Arma 2 seja equipada depois."].join("\n");
    return [{ sourceKey: "runtime:packages/database/index.js#slots", source: "runtime-export", file: "packages/database/index.js", category: "equipment", system: "equipment", entity: "slots de equipamento", type: "structured", content, hash: hash(content), mtime: fs.statSync(databaseFile).mtime.toISOString(), metadata: { authoritative: true, exportedSymbol: "slots", priority: "canonical" } }];
}

module.exports = { ROOTS, EXCLUDED, SECRET, descobrirArquivos, carregarDocumentos, carregarDocumentosCanonicos, hash };
