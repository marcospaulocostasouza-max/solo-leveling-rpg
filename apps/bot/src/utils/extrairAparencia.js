const { limpar, normalizarChave } = require("./parseFichaCampos");

module.exports = function extrairAparencia(texto) {
    const linhas = String(texto || "").split(/\r?\n/);
    const inicio = linhas.findIndex(linha => /^apar[eê]ncia\b/i.test(limpar(linha)));
    if (inicio < 0) return null;
    const primeira = limpar(linhas[inicio]).replace(/^apar[eê]ncia\s*[*_]*\s*(?::|=|—|–|-)?\s*/i, "");
    const partes = primeira ? [limpar(primeira)] : [];
    const campos = /^(?:nome|idade|sexo|genero|nacionalidade|altura|peso|personalidade|historia|classe(?: desejada)?|estilo(?: de luta)?|proficiencia|arma(?: inicial)?|afinidade(?: elemental)?|elemento|forca|resistencia|velocidade|sentidos|inteligencia|poder magico|atributos)\s*(?::|=|—|–|-|$)/;
    for (let i = inicio + 1; i < linhas.length; i++) {
        const valor = limpar(linhas[i]);
        if (campos.test(normalizarChave(valor))) break;
        if (/^[─━═\-\s]+$/.test(valor)) break;
        if (valor) partes.push(valor);
    }
    return partes.join("\n").trim() || null;
};
