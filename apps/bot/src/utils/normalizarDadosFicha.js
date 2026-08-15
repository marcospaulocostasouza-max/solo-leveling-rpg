const CAMPOS_INTEIROS = [
    "idade", "forca", "resistencia", "velocidade",
    "sentidos", "inteligencia", "poder_magico"
];

function extrairInteiro(valor) {
    if (typeof valor === "number") return Number.isInteger(valor) ? valor : Math.trunc(valor);
    const encontrado = String(valor ?? "").match(/-?\d+/);
    return encontrado ? Number.parseInt(encontrado[0], 10) : valor;
}

function normalizarDadosFicha(dados) {
    const normalizados = { ...dados };
    for (const campo of CAMPOS_INTEIROS) {
        if (normalizados[campo] !== undefined && normalizados[campo] !== null && normalizados[campo] !== "") {
            normalizados[campo] = extrairInteiro(normalizados[campo]);
        }
    }
    return normalizados;
}

module.exports = { CAMPOS_INTEIROS, extrairInteiro, normalizarDadosFicha };
