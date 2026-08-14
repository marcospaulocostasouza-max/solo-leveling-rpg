const classes = require("./classes");

function normalizarTexto(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
}

const aliases = new Map(Object.keys(classes).map(nome => [normalizarTexto(nome), nome]));

function registrarAlias(alias, nomeNormalizado) {
    const canonica = aliases.get(nomeNormalizado);
    if (canonica) aliases.set(alias, canonica);
}

registrarAlias("mago barreira", "mago de barreira");
registrarAlias("mago maldicao", "mago de maldicao");
aliases.set("ranger fisico", "Ranger Físico");
aliases.set("ranger magico", "Ranger Mágico");

function obterClasseCanonica(valor) {
    return aliases.get(normalizarTexto(valor)) || null;
}

function listarClasses() {
    return Object.keys(classes)
        .filter(nome => nome !== "Ranger")
        .concat("Ranger Físico", "Ranger Mágico");
}

module.exports = { normalizarTexto, obterClasseCanonica, listarClasses };
