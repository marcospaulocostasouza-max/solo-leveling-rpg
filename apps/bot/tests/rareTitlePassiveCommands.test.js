"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const database = require("../../../packages/database");
const comando = require("../src/commands/criarTituloPassiva");

test("fichas próprias criam Título e Passiva no catálogo raro", async () => {
    const sufixo = `${Date.now()}_${Math.random().toString(16).slice(2)}`; const ids = [];
    try {
        const titulo = comando.lerFicha(`!Título Criar\n> *NOME:* Soberano ${sufixo}\n> *CATEGORIA:* Conquista\n> *RANK:* S\n> *DESCRIÇÃO:* Título de teste\n> *EFEITOS:* Força ampliada\n> *COMO OBTER:* Banner`, "TITULO");
        const criadoTitulo = await comando.criar("__teste_admin__", "TITULO", titulo); ids.push(criadoTitulo.id);
        const passiva = comando.lerFicha(`!Passiva Criar\n> *NOME:* Instinto ${sufixo}\n> *CATEGORIA:* Combate\n> *RANK:* A\n> *DESCRIÇÃO:* Passiva de teste\n> *EFEITO:* Aumenta a defesa\n> *CONDIÇÃO DE ATIVAÇÃO:* Ao defender`, "PASSIVA");
        const criadaPassiva = await comando.criar("__teste_admin__", "PASSIVA", passiva); ids.push(criadaPassiva.id);
        const tipos = await database.all(`SELECT tipo FROM banner_rare_items WHERE item_id IN (?,?) ORDER BY tipo`, ids);
        assert.deepEqual(tipos.map(item => item.tipo), ["PASSIVA", "TITULO"]);
    } finally {
        for (const id of ids) { await database.run("DELETE FROM banner_rare_items WHERE item_id=?", [id]); await database.run("DELETE FROM itens WHERE id=?", [id]); }
    }
});
