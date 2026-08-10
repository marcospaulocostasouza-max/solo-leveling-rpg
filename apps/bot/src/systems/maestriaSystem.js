/**
 * Recurso de Maestria.
 *
 * `qi` permanece somente como formato legado dos arquivos de técnicas. A
 * persistência do jogador e toda interface nova usam exclusivamente
 * `maestria`.
 */

const NOME_RECURSO = "Maestria";

function obterCustoMaestria(tecnica) {
    return Number(tecnica?.custo_maestria ?? tecnica?.custo_qi ?? 0);
}

function formatarCustoMaestria(valor) {
    return `${Number(valor || 0)} de ${NOME_RECURSO}`;
}

function normalizarTecnica(tecnica) {
    if (!tecnica) return tecnica;
    const custo = obterCustoMaestria(tecnica);
    return {
        ...tecnica,
        custo_maestria: custo,
        custo_maestria_formatado: formatarCustoMaestria(custo)
    };
}

function normalizarJogador(jogador) {
    if (!jogador) return jogador;
    return {
        ...jogador,
        maestria: Number(jogador.maestria ?? jogador.qi ?? 0)
    };
}

module.exports = {
    NOME_RECURSO,
    obterCustoMaestria,
    formatarCustoMaestria,
    normalizarTecnica,
    normalizarJogador
};
