const test = require("node:test");
const assert = require("node:assert/strict");

const classes = require("../src/utils/classes");
const buffs = require("../src/utils/buffsClasses");
const { obterClasseCanonica } = require("../src/utils/normalizarClasse");
const obterBuffsClasse = require("../src/utils/obterBuffsClasse");
const { resolverConsultaClasse } = require("../src/commands/tecnicasClasse");
const { normalizarDadosFicha } = require("../src/utils/normalizarDadosFicha");
const { obterEstiloCanonico } = require("../src/utils/normalizarEstiloLuta");

test("reconhece todas as classes oficiais ignorando caixa e acentos", () => {
    for (const nome of Object.keys(classes)) {
        assert.equal(obterClasseCanonica(nome), nome);
        assert.equal(obterClasseCanonica(nome.toUpperCase()), nome);
        assert.ok(buffs[nome], `Buff ausente para ${nome}`);
    }
});

test("normaliza idade e atributos textuais antes do PostgreSQL", () => {
    const dados = normalizarDadosFicha({ idade: "25 anos", forca: "5 pontos", resistencia: 3 });
    assert.equal(dados.idade, 25);
    assert.equal(dados.forca, 5);
    assert.equal(dados.resistencia, 3);
});

test("resolve comandos de tecnicas sem confundir subclasses de mago", () => {
    assert.deepEqual(resolverConsultaClasse("mago de barreira"), {
        titulo: "Mago de Barreira",
        nomes: ["Mago de Barreira", "Mago Barreira"],
        padrao: "mago%barreira"
    });
    assert.deepEqual(resolverConsultaClasse("mago de maldicao").nomes, ["Mago de Maldição", "Mago Maldição"]);
    assert.deepEqual(resolverConsultaClasse("mago de fogo").nomes, ["Mago Elemental"]);
    assert.deepEqual(resolverConsultaClasse("ranger fisico").nomes, ["Ranger"]);
});

test("reconhece aliases dos magos de barreira e maldicao", () => {
    assert.equal(obterClasseCanonica("Mago de Barreira"), "Mago de Barreira");
    assert.equal(obterClasseCanonica("mago barreira"), "Mago de Barreira");
    assert.equal(obterClasseCanonica("  MAGO DE BARREIRA  "), "Mago de Barreira");
    assert.equal(obterClasseCanonica("mago de maldicao"), "Mago de Maldicao");
    assert.equal(obterClasseCanonica("Mago Maldição"), "Mago de Maldicao");
});

test("nao aceita classe desconhecida por aproximacao", () => {
    assert.equal(obterClasseCanonica("mago de barreir"), null);
    assert.equal(obterClasseCanonica("arqueiro"), null);
});

test("reconhece variacoes de Cajados e Orbes na ficha", () => {
    const esperado = "Proficiência em Cajados e Orbes";
    for (const valor of [
        "Cajados e Orbe",
        "Cajado e Orbe",
        "Cajados e Orbes",
        "Proficiência em Cajados e Orbes",
        "Cajados/Orbe",
        "Cajados & Orbes",
        "> *Cajados e Orbe.*"
    ]) {
        assert.equal(obterEstiloCanonico(valor), esperado, valor);
    }
});

test("diferencia Ranger Fisico de Ranger Magico", () => {
    assert.equal(obterClasseCanonica("Ranger Físico"), "Ranger Físico");
    assert.equal(obterClasseCanonica("ranger fisico"), "Ranger Físico");
    assert.equal(obterClasseCanonica("Ranger Mágico"), "Ranger Mágico");
    assert.equal(obterClasseCanonica("> *Ranger Físico*"), "Ranger Físico");
    assert.equal(obterClasseCanonica("> _Ranger Mágico_"), "Ranger Mágico");
    assert.notDeepEqual(buffs["Ranger Físico"], buffs["Ranger Mágico"]);
    assert.equal(buffs["Ranger Físico"].forca_buff, 5);
    assert.equal(buffs["Ranger Mágico"].poder_magico_buff, 5);
    assert.equal(obterBuffsClasse("Ranger Físico", { forca: 8 }).forca_buff, 4);
    assert.equal(obterBuffsClasse("Ranger Mágico", { poder_magico: 6 }).poder_magico_buff, 3);
    assert.equal(obterBuffsClasse("Ranger Físico", { forca: 8 }).poder_magico_buff, 0);
});

test("integra Mago Elemental e Mago de Maldicao como classes iniciais", () => {
    const AtributoSystem = require("../src/systems/atributoSystem");
    assert.equal(obterClasseCanonica("Mago Elemental"), "Mago Elemental");
    assert.equal(obterClasseCanonica("> *Mago de Maldição*"), "Mago de Maldicao");
    assert.deepEqual(resolverConsultaClasse("mago elemental").nomes, ["Mago Elemental"]);
    assert.match(resolverConsultaClasse("mago de maldicao").padrao, /maldi/);
    for (const classe of ["Mago Elemental", "Mago Invocador", "Mago de Barreira", "Mago de Maldicao"]) {
        assert.deepEqual(AtributoSystem.getBonusClasseInicial(classe), {
            atributo: "poder_magico_base", bonus: 0.5
        }, classe);
    }
});

test("Mago de Maldicao consta entre as classes iniciais e possui comando", () => {
    const fs = require("node:fs");
    const path = require("node:path");
    const classesCommand = fs.readFileSync(path.join(__dirname, "../src/commands/classes.js"), "utf8");
    const commandHandler = fs.readFileSync(path.join(__dirname, "../src/core/commandHandler.js"), "utf8");
    assert.match(classesCommand, /"Mago de Maldição"/);
    assert.match(classesCommand, /"Mago de Maldicao"/);
    assert.match(commandHandler, /"!mago de maldicao"/);
    assert.equal(obterClasseCanonica("mago de maldição"), "Mago de Maldicao");
});
