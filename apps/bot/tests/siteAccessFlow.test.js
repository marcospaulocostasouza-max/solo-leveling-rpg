"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("!site envia acesso estilizado e o token abre a pagina inicial", () => {
    const command = fs.readFileSync(path.resolve(__dirname, "../src/commands/site.js"), "utf8");
    const tokenPage = fs.readFileSync(path.resolve(__dirname, "../../site/app/auth/token/[token]/page.tsx"), "utf8");
    assert.match(command, /PORTAL DO CAÇADOR/);
    assert.match(command, /Destino:\* Página Inicial/);
    assert.match(command, /Validade:\* 10 minutos/);
    assert.match(command, /Não compartilhe/);
    assert.match(tokenPage, /window\.location\.replace\("\/"\)/);
    assert.doesNotMatch(tokenPage, /replace\("\/personagem"\)/);
});
