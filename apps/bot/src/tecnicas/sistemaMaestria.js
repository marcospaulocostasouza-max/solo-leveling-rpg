/** Regras de custo em Maestria. Os valores são os mesmos do sistema legado. */
const { formatarCustoMaestria } = require("../systems/maestriaSystem");

const SISTEMA_MAESTRIA = {
    CUSTO_BASE_INICIAL: 10,
    CUSTO_BASE_AVANCADA: 200,
    MULTIPLICADOR: 2,
    calcularCusto(indice, categoria = "Classe") {
        const ordem = Math.max(1, Number(indice) || 1);
        const categoriaNormalizada = String(categoria || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();
        const base = categoriaNormalizada.includes("avancada")
            ? this.CUSTO_BASE_AVANCADA
            : this.CUSTO_BASE_INICIAL;
        return base * (this.MULTIPLICADOR ** (ordem - 1));
    },
    getCustoFormatado(indice, categoria = "Classe") {
        return formatarCustoMaestria(this.calcularCusto(indice, categoria));
    }
};

function aplicarSistemaMaestria(classeTecnicas) {
    const categoria = classeTecnicas.categoria || "Classe";
    const aplicar = (tecnica, indice) => {
        tecnica.custo_maestria = SISTEMA_MAESTRIA.calcularCusto(indice, categoria);
        tecnica.custo_maestria_formatado = SISTEMA_MAESTRIA.getCustoFormatado(indice, categoria);
    };
    if (classeTecnicas.tecnicaInicial) aplicar(classeTecnicas.tecnicaInicial, 1);
    (classeTecnicas.tecnicas || []).forEach((tecnica, indice) => aplicar(tecnica, indice + 2));
    return classeTecnicas;
}

module.exports = { SISTEMA_MAESTRIA, aplicarSistemaMaestria };
