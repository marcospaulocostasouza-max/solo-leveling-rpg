/*
 * Regras determinísticas de disponibilidade das missões de NPC.
 * O conteúdo permanece nos JSONs; este módulo apenas o classifica.
 */

const RECOMENDACOES_ARCO = {
    1: "15–20",
    2: "30–35",
    3: "40–50",
    4: "50–60",
    5: "60–70"
};

function numeroMissao(missao) {
    return Number(missao && missao.numero);
}

function ehArco(missao) {
    const numero = numeroMissao(missao);
    return numero >= 1 && numero <= 4 &&
        missao.categoria === "principal" && missao.tipo === "historia";
}

function classificarMissoes(missoes) {
    const ordenadas = [...(missoes || [])].sort((a, b) => numeroMissao(a) - numeroMissao(b));
    const simples = ordenadas.filter((missao) => !ehArco(missao));

    return ordenadas.map((missao) => {
        if (ehArco(missao)) {
            const arco = numeroMissao(missao);
            return {
                ...missao,
                classificacao: "arco",
                vinculoNecessario: arco * 25,
                nivelRecomendado: RECOMENDACOES_ARCO[arco] || null
            };
        }

        const indiceSimples = simples.indexOf(missao);
        return {
            ...missao,
            classificacao: "missao_simples",
            vinculoNecessario: (indiceSimples + 1) * 10,
            nivelRecomendado: null
        };
    });
}

function missoesDisponiveis(missoes, vinculo) {
    const vinculoAtual = Math.max(0, Math.min(100, Number(vinculo) || 0));
    return classificarMissoes(missoes)
        .filter((missao) => vinculoAtual >= missao.vinculoNecessario);
}

module.exports = {
    RECOMENDACOES_ARCO,
    ehArco,
    classificarMissoes,
    missoesDisponiveis
};
