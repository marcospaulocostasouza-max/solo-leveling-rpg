const test = require("node:test");
const assert = require("node:assert/strict");

const AdvancedClassSystem = require("../src/systems/advancedClassSystem");
const aprovarClasse = require("../src/commands/aprovadaClasseAvancada");
const advancedClasses = require("../src/utils/advancedClasses");

function jogador(classe) {
    return {
        classe,
        forca_base: 100,
        resistencia_base: 100,
        velocidade_base: 100,
        sentidos_base: 100,
        inteligencia_base: 100,
        poder_magico_base: 100
    };
}

test("Rangers fisico e magico recebem as classes avancadas de Ranger", () => {
    for (const classe of ["Ranger", "Ranger Físico", "Ranger Mágico"]) {
        const nomes = AdvancedClassSystem.getClassesDisponiveis(jogador(classe)).map(item => item.nome);
        assert.ok(nomes.includes("Rastreador"), classe);
        assert.ok(nomes.length > 2, classe);
    }
});

test("todas as classes iniciais de Mago recebem as opcoes avancadas de Mago", () => {
    for (const classe of [
        "Mago de Água", "Mago de Fogo", "Mago de Gelo", "Mago de Terra",
        "Mago de Vento", "Mago de Raio", "Mago Invocador", "Mago de Barreira",
        "Mago de Maldição"
    ]) {
        assert.ok(AdvancedClassSystem.getClassesDisponiveis(jogador(classe)).length > 2, classe);
    }
});

test("nomes de classes avancadas aceitam ausencia de acentos", () => {
    assert.equal(AdvancedClassSystem.getClasseByName("heroi do escudo")?.nome, "Herói do Escudo");
});

test("aprovacao ADM aceita comando com e sem acento", () => {
    const comAcento = aprovarClasse.extrairNomeEClasse("!aprovada para classe avançada Maria Herói do Escudo");
    const semAcento = aprovarClasse.extrairNomeEClasse("!aprovada para classe avancada Maria heroi do escudo");
    assert.deepEqual(comAcento, { nomeJogador: "Maria", nomeClasse: "Herói do Escudo" });
    assert.deepEqual(semAcento, { nomeJogador: "Maria", nomeClasse: "Herói do Escudo" });
});

test("todas as classes livres possuem rota compativel, requisitos e bonus", () => {
    const bases = ["Lutador", "Assassino", "Tanker", "Ranger Físico", "Ranger Mágico", "Curador", "Mago de Barreira"];
    const jogadores = bases.map(jogador);
    for (const classe of Object.values(advancedClasses)) {
        assert.ok(Object.keys(classe.requisitos || {}).length, `${classe.nome}: requisitos`);
        assert.ok(Object.keys(classe.bonusAtributos || {}).length, `${classe.nome}: bonus`);
        if (classe.bloqueada) continue;
        assert.ok(
            jogadores.some(item => AdvancedClassSystem.getClassesDisponiveis(item).some(opcao => opcao.nome === classe.nome)),
            `${classe.nome}: sem rota de classe inicial`
        );
    }
});

test("validacao central rejeita classe inicial incompativel e atributos insuficientes", () => {
    const oraculo = AdvancedClassSystem.getClasseByName("oraculo");
    assert.equal(AdvancedClassSystem.classeCompativelComJogador(oraculo, jogador("Curador")), true);
    assert.equal(AdvancedClassSystem.classeCompativelComJogador(oraculo, jogador("Assassino")), false);
    assert.equal(AdvancedClassSystem.atendeRequisitos(oraculo, jogador("Curador")), true);
    assert.equal(AdvancedClassSystem.atendeRequisitos(oraculo, { classe: "Curador" }), false);
});
