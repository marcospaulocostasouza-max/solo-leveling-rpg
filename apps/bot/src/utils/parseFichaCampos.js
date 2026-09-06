function limpar(valor) {
    return String(valor || "")
        .trim()
        .replace(/^[*_>\s]+|[*_\s]+$/g, "")
        .replace(/^\[|\]$/g, "")
        .trim();
}

function normalizarChave(chave) {
    return limpar(chave)
        .replace(/^[#•\-–—]+\s*/, "")
        .replace(/\s*[.:;]+$/, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Lê linhas de ficha em formatos que jogadores normalmente usam no WhatsApp.
 * Aceita `Nome:`, `Nome -`, `Nome —` e `Nome =`, com ou sem markdown.
 * Não trata frases comuns como campos: há sempre um separador explícito.
 */
function separarLinhaCampo(linha) {
    const texto = String(linha || "").trim();
    const encontrado = texto.match(/^\s*[*_>\s]*([^:=—–-][^:=—–-]{0,80}?)\s*(?::|=|—|–|\s-\s)\s*(.+?)\s*$/);
    if (!encontrado) return null;

    const chave = normalizarChave(encontrado[1]);
    const valor = limpar(encontrado[2]);
    return chave && valor ? { chave, valor } : null;
}

function parseFichaCampos(texto) {
    const saida = {};
    for (const linha of String(texto || "").split(/\r?\n/)) {
        const campo = separarLinhaCampo(linha);
        if (campo) saida[campo.chave] = campo.valor;
    }
    return saida;
}

module.exports = parseFichaCampos;
module.exports.limpar = limpar;
module.exports.normalizarChave = normalizarChave;
module.exports.separarLinhaCampo = separarLinhaCampo;
