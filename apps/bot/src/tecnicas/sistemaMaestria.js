/** Curva de custo em Maestria usada por classes e proficiências. */
const { formatarCustoMaestria } = require("../systems/maestriaSystem");
const CURVA = [10, 20, 40, 70, 110, 160, 230, 320, 450, 650];
const CURVA_AVANCADA = [200, 300, 450, 650, 900, 1200, 1550, 1950, 2400, 3000];
const SISTEMA_MAESTRIA = {
    calcularCusto(indice, categoria = "Classe") {
        const ordem = Math.max(1, Number(indice) || 1);
        const cat = String(categoria || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const curva = cat.includes("avancada") ? CURVA_AVANCADA : CURVA;
        if (ordem <= curva.length) return curva[ordem - 1];
        const passo = cat.includes("avancada") ? 500 : 250;
        return curva[curva.length - 1] + ((ordem - curva.length) * passo);
    },
    getCustoFormatado(indice, categoria = "Classe") { return formatarCustoMaestria(this.calcularCusto(indice, categoria)); }
};
function aplicarSistemaMaestria(classeTecnicas) {
    const categoria = classeTecnicas.categoria || "Classe";
    const todas = [classeTecnicas.tecnicaInicial, ...(classeTecnicas.tecnicas || [])].filter(Boolean);
    todas.forEach((tecnica, i) => {
        tecnica.custo_qi = SISTEMA_MAESTRIA.calcularCusto(i + 1, categoria);
        tecnica.custo_qi_formatado = SISTEMA_MAESTRIA.getCustoFormatado(i + 1, categoria);
        tecnica.custo_maestria = tecnica.custo_qi;
        tecnica.custo_maestria_formatado = tecnica.custo_qi_formatado;
    });
    return classeTecnicas;
}
module.exports = { SISTEMA_MAESTRIA, aplicarSistemaMaestria, CURVA, CURVA_AVANCADA };
