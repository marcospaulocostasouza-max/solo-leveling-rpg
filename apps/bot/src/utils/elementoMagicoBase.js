const elementos = require("../elementos/listaElementos");

const ELEMENTOS_COM_TECNICAS = new Set([
    "fogo", "agua", "terra", "vento", "raio", "gelo", "planta"
]);

function normalizar(valor) {
    return require("./normalizarDadosFicha").limparPontuacaoFinal(valor).normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function resolverElementoMagicoBase(nome) {
    const elemento = elementos.find(item => normalizar(item.nome) === normalizar(nome));
    if (!elemento) return { elemento: null, base: null, corrigido: false };
    if (ELEMENTOS_COM_TECNICAS.has(normalizar(elemento.nome))) {
        return { elemento, base: elemento.nome, corrigido: false };
    }

    const origens = String(elemento.origem || "").split("+").map(item => item.trim());
    const base = origens.map(origem => elementos.find(item => normalizar(item.nome) === normalizar(origem)))
        .find(item => item && ELEMENTOS_COM_TECNICAS.has(normalizar(item.nome)));
    return { elemento, base: base?.nome || null, corrigido: Boolean(base) };
}

module.exports = { resolverElementoMagicoBase, ELEMENTOS_COM_TECNICAS };
