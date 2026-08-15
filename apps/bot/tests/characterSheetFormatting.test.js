const assert = require("node:assert/strict");
const { obterEstiloCanonico } = require("../src/utils/normalizarEstiloLuta");
const reconhecerFicha = require("../src/utils/reconhecerFicha");
const confirmarFicha = require("../src/commands/confirmarFicha");
const estilos = require("../src/estilos/listaEstilos");

assert.equal(obterEstiloCanonico("Proficiência em arco"), "Proficiência em Arcos");
assert.equal(obterEstiloCanonico("> _Proficiência em Arcos_"), "Proficiência em Arcos");
assert.equal(reconhecerFicha.extrairCampo("*NOME:* _Sung Jin Woo_", "NOME"), "Sung Jin Woo");
assert.equal(reconhecerFicha.extrairCampo("> *PERTENCENTE:* _Sung Jin Woo_", "PERTENCENTE"), "Sung Jin Woo");
assert.equal(reconhecerFicha.extrairCampo("_SLOT:_ > Arma 1", "SLOT"), "Arma 1");
assert.equal(confirmarFicha.VALIDACOES.peso.validar("70,5 kg"), null);
assert.equal(confirmarFicha.VALIDACOES.peso.validar("500,0 kg"), null);
assert.match(confirmarFicha.VALIDACOES.peso.validar("500,1 kg"), /máximo/i);
for (const estilo of estilos) assert.equal(obterEstiloCanonico(estilo.nome), estilo.nome);
console.log("characterSheetFormatting.test.js: OK");
