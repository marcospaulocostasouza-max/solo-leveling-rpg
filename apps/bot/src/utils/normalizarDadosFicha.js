const CAMPOS_INTEIROS = [
    "idade", "forca", "resistencia", "velocidade",
    "sentidos", "inteligencia", "poder_magico"
];

function extrairInteiro(valor) {
    if (typeof valor === "number") return Number.isInteger(valor) ? valor : Math.trunc(valor);
    const encontrado = String(valor ?? "").match(/-?\d+/);
    return encontrado ? Number.parseInt(encontrado[0], 10) : valor;
}

// Nomes são identificadores exibidos e usados nos comandos da ADM. Espaços
// repetidos nunca devem criar uma segunda variação do mesmo jogador.
function normalizarNomeJogador(valor) {
    return String(valor ?? "").replace(/\s+/g, " ").trim();
}

function limparPontuacaoFinal(valor) {
    return String(valor ?? '').trim().replace(/[\p{P}\s]+$/gu, '').trim();
}

function normalizarDadosFicha(dados) {
    const normalizados = { ...dados };
    if (normalizados.nome !== undefined && normalizados.nome !== null) {
        normalizados.nome = normalizarNomeJogador(normalizados.nome);
    }
    for (const campo of CAMPOS_INTEIROS) {
        if (normalizados[campo] !== undefined && normalizados[campo] !== null && normalizados[campo] !== "") {
            normalizados[campo] = extrairInteiro(normalizados[campo]);
        }
    }
    return normalizados;
}

module.exports = { CAMPOS_INTEIROS, extrairInteiro, normalizarNomeJogador, normalizarDadosFicha, limparPontuacaoFinal };
