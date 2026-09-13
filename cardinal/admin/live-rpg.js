"use strict";
const { Rbac } = require("./rbac");
const normalize = value => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
// Only game state: never authentication, credentials or administrative identities.
const safeTable = name => /^[a-z][a-z0-9_]*$/.test(name) && !/admin|auth|session|token|secret|password|sqlite_|migration|cardinal_/.test(name);
const safeField = name => !/senha|password|token|secret|auth|numero|telefone|email|imagem|image|base64/.test(name);
const aliases = { itens: /\b(itens|item|armas|arma)\b/, tecnicas: /\b(tecnicas?|habilidades?)\b/, jogadores: /\b(players?|jogador(?:es)?|fichas?)\b/, npcs: /\bnpcs?\b/, missoes: /\bmiss(?:oes|ao)\b/, dungeons: /\b(dungeons?|masmorras?)\b/, gacha_banners: /\bbanners?\b/, guildas: /\bguildas?\b/ };
async function readRpg(database, actor, question) {
    await new Rbac({ database }).authorize(actor, "CARDINAL_READ");
    const q = normalize(question);
    let tables;
    try { tables = (await database.all("SELECT table_name AS name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")).map(row => row.name); }
    catch { tables = (await database.all("SELECT name FROM sqlite_master WHERE type='table'")).map(row => row.name); }
    tables = tables.filter(safeTable);
    if (/\b(base de dados|banco de dados|tabelas|bases de dados)\b/.test(q) && !Object.values(aliases).some(pattern => pattern.test(q))) {
        return { text: `Bases do RPG disponíveis para consulta: ${tables.sort().join(", ")}. Pergunte o total ou informe o nome/ID que deseja consultar.`, sources: [] };
    }
    let table = Object.keys(aliases).find(name => tables.includes(name) && aliases[name].test(q)) || tables.find(name => q.includes(name));
    if (!table) {
        const matches = [];
        for (const name of Object.keys(aliases).filter(name => tables.includes(name))) {
            let candidates;
            try { candidates = await database.all(`SELECT nome FROM ${name}`); }
            catch (error) { if (/column.*nome|no such column/i.test(error.message)) continue; throw error; }
            if (candidates.some(row => row.nome && normalize(row.nome).length >= 3 && q.includes(normalize(row.nome)))) matches.push(name);
        }
        if (matches.length > 1) return { text: `Encontrei esse nome em ${matches.join(", ")}. Informe se deseja consultar o jogador, item, técnica ou outra entidade.`, sources: [] };
        table = matches[0];
    }
    if (!table) return null;
    if (/\b(quantos|quantas|total|quantidade)\b/.test(q) && !/\b(xp|experiencia|maestria|cristais|won|custo|custa)\b/.test(q)) {
        const row = await database.get(`SELECT COUNT(*) AS total FROM ${table}`);
        return { text: `${table}: ${row.total} registros no banco atual.`, sources: [{ file: `database-live:${table}` }] };
    }
    const list = /\b(quais|liste|listar|lista|todos|todas)\b/.test(q);
    const nameMatch = question.match(/(?:chamad[oa]|nome|sobre|busque|procure|consultar|consulte)\s+["']?(.+?)["'?.!]*$/i);
    let columns;
    try { columns = (await database.all("SELECT column_name AS name FROM information_schema.columns WHERE table_schema='public' AND table_name=?", [table])).map(row => row.name); }
    catch { columns = (await database.all(`PRAGMA table_info(${table})`)).map(row => row.name); }
    columns = columns.filter(name => /^[a-z][a-z0-9_]*$/.test(name) && safeField(name));
    if (!columns.length) return null;
    let rows = columns.includes("nome") ? await database.all(`SELECT ${columns.includes("id") ? "id," : ""}nome FROM ${table}`) : await database.all(`SELECT ${columns.join(",")} FROM ${table} LIMIT 15`);
    const mentions = rows.filter(row => row.nome && q.includes(normalize(row.nome)));
    if (mentions.length) rows = mentions;
    else if (nameMatch) rows = rows.filter(row => row.nome && normalize(row.nome).includes(normalize(nameMatch[1])));
    else if (!list) return null;
    if (columns.includes("nome") && columns.includes("id")) {
        const ids = rows.map(row => row.id);
        rows = ids.length ? await database.all(`SELECT ${columns.join(",")} FROM ${table} WHERE id IN (${ids.map(() => "?").join(",")})`, ids) : [];
    }
    if (/\bativ[oa]s?\b/.test(q)) rows = rows.filter(row => Number(row.ativo) === 1 || row.status === "ativo");
    const shown = rows.slice(0, 15);
    return { text: shown.length ? `Dados atuais de ${table}${rows.length > shown.length ? ` (mostrando ${shown.length} de ${rows.length}; refine a consulta)` : ""}:\n${shown.map(row => Object.entries(row).filter(([key, value]) => safeField(key) && value != null).map(([key, value]) => `${key}: ${String(value).slice(0, 400)}`).join("\n")).join("\n\n")}` : `Nenhum registro correspondente em ${table}.`, sources: [{ file: `database-live:${table}` }] };
}
module.exports = { readRpg, safeTable, safeField };
