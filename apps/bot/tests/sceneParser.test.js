const assert = require('assert');
const { analisarCena, formatarCenaParaPrompt, textoObservavelParaAnalise } = require('../src/npc/sceneParser');

const cena = analisarCena('_Guardo a espada e me aproximo._\n*"Não quero lutar."*\n> Espero que ela acredite em mim.');

assert.deepStrictEqual(cena.acoes, ['Guardo a espada e me aproximo.']);
assert.deepStrictEqual(cena.falas, ['"Não quero lutar."']);
assert.deepStrictEqual(cena.pensamentos, ['Espero que ela acredite em mim.']);
assert.strictEqual(cena.textoLivre.length, 0);

const prompt = formatarCenaParaPrompt(cena);
assert.match(prompt, /AÇÕES VISÍVEIS AO NPC/);
assert.match(prompt, /FALAS AUDÍVEIS AO NPC/);
assert.match(prompt, /PENSAMENTOS PRIVADOS DO JOGADOR/);
assert.match(prompt, /NÃO OUVE/);
assert.strictEqual(textoObservavelParaAnalise(cena), '"Não quero lutar."');

const semMolde = analisarCena('Não assuma que isto foi uma fala.');
assert.deepStrictEqual(semMolde.falas, []);
assert.deepStrictEqual(semMolde.textoLivre, ['Não assuma que isto foi uma fala.']);
assert.strictEqual(textoObservavelParaAnalise(semMolde), '');

console.log('sceneParser.test.js: ok');
