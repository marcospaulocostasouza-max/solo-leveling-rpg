const ATRIBUTOS = [
    ["Força", "forca_total"],
    ["Resistência", "resistencia_total"],
    ["Velocidade", "velocidade_total"],
    ["Sentidos", "sentidos_total"],
    ["Inteligência", "inteligencia_total"],
    ["Poder mágico", "poder_magico_total"]
];

const FAIXAS = [
    { minimo: 1, maximo: 5, nome: "Fraco", descricao: "Caçador recém-desperto, civil ou pouco treinado." },
    { minimo: 6, maximo: 19, nome: "Básico", descricao: "Capacidade funcional de um caçador iniciante." },
    { minimo: 20, maximo: 49, nome: "Médio", descricao: "Caçador treinado, apto a portais e missões comuns." },
    { minimo: 50, maximo: 149, nome: "Forte", descricao: "Atributo perigoso, capaz de mudar uma cena de combate." },
    { minimo: 150, maximo: 299, nome: "Muito forte", descricao: "Especialista ou ameaça real em campo." },
    { minimo: 300, maximo: 799, nome: "Devastador", descricao: "Caçador de elite, grande ameaça de campo ou líder." },
    { minimo: 800, maximo: 1199, nome: "Além do humano", descricao: "Poder anormal entre caçadores; início da transcendência." },
    { minimo: 1200, maximo: Infinity, nome: "Ápice", descricao: "Ultrapassa os limites humanos conhecidos." }
];

function faixaPara(valor) {
    const numero = Math.max(0, Number(valor) || 0);
    return FAIXAS.find((faixa) => numero >= faixa.minimo && numero <= faixa.maximo) || FAIXAS[0];
}

function atributosFinais(jogador) {
    return ATRIBUTOS.map(([nome, campo]) => ({
        nome,
        valor: Number(jogador[campo] || 0),
        faixa: faixaPara(jogador[campo])
    }));
}

function diferencaPercentual(valorA, valorB) {
    const maior = Math.max(Number(valorA) || 0, Number(valorB) || 0);
    const menor = Math.min(Number(valorA) || 0, Number(valorB) || 0);
    return maior === 0 ? 0 : ((maior - menor) / maior) * 100;
}

function classificarDiferenca(percentual) {
    if (percentual <= 30) return "Pequena";
    if (percentual <= 50) return "Vantagem clara";
    if (percentual <= 70) return "Grande";
    if (percentual <= 90) return "Esmagadora";
    return "Absurda";
}

module.exports = { ATRIBUTOS, FAIXAS, faixaPara, atributosFinais, diferencaPercentual, classificarDiferenca };
