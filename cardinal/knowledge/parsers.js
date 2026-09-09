"use strict";

const path = require("path");
const { categorizar } = require("./categories");

function normalizarTexto(texto) { return String(texto || "").replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim(); }
function fragmentar(texto, size = 2400, overlap = 240) {
    const value = normalizarTexto(texto); if (!value) return [];
    const chunks = []; let start = 0;
    while (start < value.length) {
        let end = Math.min(value.length, start + size);
        if (end < value.length) { const natural = Math.max(value.lastIndexOf("\n\n", end), value.lastIndexOf("\n", end), value.lastIndexOf(". ", end)); if (natural > start + size * .55) end = natural + 1; }
        chunks.push(value.slice(start, end).trim());
        if (end >= value.length) break;
        start = Math.max(start + 1, end - overlap);
    }
    return chunks.filter(Boolean);
}
function entidadeDoConteudo(content, fallback) {
    const match = content.match(/(?:^|\n)\s*(?:#{1,3}\s*|["']?(?:nome|name)["']?\s*[:=]\s*["']?)([^\n"',}{]{2,100})/i);
    return (match?.[1] || fallback).trim();
}
function parseFile(file, relative, content, options = {}) {
    const ext = path.extname(file).toLowerCase(); const size = options.chunkSize || 2400; const overlap = options.chunkOverlap || 240;
    let normalized = normalizarTexto(content);
    if (ext === ".json") {
        try { normalized = JSON.stringify(JSON.parse(content), null, 2); } catch { /* texto inválido ainda pode ser pesquisado */ }
    }
    const category = categorizar(relative, normalized);
    return fragmentar(normalized, size, overlap).map((chunk, index) => ({
        sourceKey: `file:${relative}#${index + 1}`, source: "file", file: relative, category, system: category,
        entity: entidadeDoConteudo(chunk, path.basename(file, ext)), type: ext.slice(1) || "text", content: chunk,
        metadata: { chunk: index + 1, extension: ext, authoritative: true, ...(relative.replace(/\\/g, "/") === "docs/RPG_CANON_CARDINAL.md" ? { priority: "canonical" } : {}) }
    }));
}

module.exports = { normalizarTexto, fragmentar, parseFile, entidadeDoConteudo };
