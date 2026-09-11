const test = require("node:test");
const assert = require("node:assert/strict");
const extrair = require("../src/utils/extrairAparencia");
const { formatarLista } = require("../src/commands/aparencias");

test("aparência ao lado do campo", () => {
    assert.equal(extrair("Nome: Hana\n*Aparência:* Frieren - Sousou no Frieren\nClasse: Curador"), "Frieren - Sousou no Frieren");
});
test("aparência abaixo preserva linhas e não inclui o campo seguinte", () => {
    assert.equal(extrair("*Aparência:*\nMaoMao\nDiários de uma Apotecária\n*História:*\nUma longa jornada"), "MaoMao\nDiários de uma Apotecária");
    assert.equal(extrair("Aparencia\nSaber (Fate)\nClasse desejada: Lutador"), "Saber (Fate)");
});
test("lista preserva descrições e divide mensagens", () => {
    const jogadores = Array.from({ length: 20 }, (_, i) => ({ nome: `Player ${i}`, aparencia: "Descrição ".repeat(50) }));
    const mensagens = formatarLista(jogadores);
    assert.ok(mensagens.length > 1);
    assert.ok(mensagens.every(text => text.length <= 3500));
    for (const j of jogadores) assert.ok(mensagens.join("\n").includes(`*${j.nome}*`));
    assert.match(formatarLista([])[0], /Nenhuma aparência/);
});
