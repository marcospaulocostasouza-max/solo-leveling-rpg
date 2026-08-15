const estilos = require("../estilos/listaEstilos");
const normalizar = valor => String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[>*_]/g, "")
    .trim()
    .toLowerCase();

function normalizarChave(valor) {
    return normalizar(valor)
        .replace(/^proficiencia\s+em\s+/, "")
        .replace(/[&/+]/g, " e ")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map(palavra => palavra !== "e" && palavra !== "de" && palavra.length > 3 && palavra.endsWith("s")
            ? palavra.slice(0, -1)
            : palavra)
        .join(" ");
}

function obterEstiloCanonico(valor) {
    const alvo = normalizarChave(valor);
    const encontrado = estilos.find(estilo => normalizarChave(estilo.nome) === alvo);
    return encontrado?.nome || null;
}
module.exports = { obterEstiloCanonico, normalizar, normalizarChave };
