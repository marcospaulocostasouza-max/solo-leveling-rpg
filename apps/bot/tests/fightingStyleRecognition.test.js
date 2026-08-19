const test = require("node:test");
const assert = require("node:assert/strict");
const estilos = require("../src/estilos/listaEstilos");
const { obterEstiloCanonico } = require("../src/utils/normalizarEstiloLuta");

const nome = trecho => estilos.find(estilo => estilo.nome.includes(trecho)).nome;

test("reconhece todos os estilos oficiais com caracteres decorativos", () => {
    for (const estilo of estilos) {
        assert.equal(obterEstiloCanonico(`> *_${estilo.nome}_*`), estilo.nome);
    }
});

test("reconhece nomes populares, singular/plural e erros pequenos", () => {
    const casos = [
        ["***arcco***", nome("Arcos")],
        ["> _Cajdo e Orbe_", nome("Cajados e Orbes")],
        ["proficiência em espadda", nome("Espadas")],
        ["Artes marciais", nome("Combate Desarmado")],
        ["Rifle", nome("Armas de Fogo")],
        ["Faca", nome("Adagas")]
    ];
    for (const [entrada, esperado] of casos) {
        assert.equal(obterEstiloCanonico(entrada), esperado, entrada);
    }
});

test("nao adivinha um estilo quando a entrada nao e reconhecivel", () => {
    assert.equal(obterEstiloCanonico("qualquer coisa inventada"), null);
    assert.equal(obterEstiloCanonico(""), null);
});
