/**
 * SISTEMA DE CUSTO DE TÉCNICAS EM QI
 * 
 * Regras:
 * - Técnicas iniciais: 10 Qi base
 * - Técnicas avançadas: 200 Qi base
 * - Custo progressivo: cada próxima técnica custa 2x o valor da anterior
 * 
 * Fórmula: custo = custo_base * (2 ** (indice - 1))
 * 
 * Exemplo (iniciais):
 * - 1ª técnica: 10 Qi
 * - 2ª técnica: 20 Qi
 * - 3ª técnica: 40 Qi
 * 
 * Exemplo (avançadas):
 * - 1ª técnica: 200 Qi
 * - 2ª técnica: 400 Qi
 * - 3ª técnica: 800 Qi
 */

const SISTEMA_QI = {
    CUSTO_BASE_INICIAL: 10,
    CUSTO_BASE_AVANCADA: 200,
    MULTIPLICADOR: 2,
    
    /**
     * Calcula o custo de uma técnica baseado no índice (ordem de aprendizado)
     * @param {number} indice - Índice da técnica (1 = primeira, 2 = segunda, etc)
     * @param {string} categoria - "Classe" para inicial, "Avançada" para avançada
     * @returns {number} Custo em Qi
     */
    calcularCusto(indice, categoria = "Classe") {
        if (indice < 1) indice = 1;
        
        const custoBase = categoria === "Avançada" 
            ? this.CUSTO_BASE_AVANCADA 
            : this.CUSTO_BASE_INICIAL;
        
        return custoBase * (this.MULTIPLICADOR ** (indice - 1));
    },
    
    /**
     * Obtém o custo formatado de uma técnica
     * @param {number} indice - Índice da técnica
     * @param {string} categoria - "Classe" ou "Avançada"
     * @returns {string} Custo formatado em Qi
     */
    getCustoFormatado(indice, categoria = "Classe") {
        const custo = this.calcularCusto(indice, categoria);
        return `${custo} Qi`;
    },
    
    /**
     * Lista todos os custos até um limite
     * @param {number} limite - Número máximo de técnicas
     * @param {string} categoria - "Classe" ou "Avançada"
     * @returns {Array} Lista de custos
     */
    listarCustos(limite = 10, categoria = "Classe") {
        const custos = [];
        for (let i = 1; i <= limite; i++) {
            custos.push({
                indice: i,
                custo: this.calcularCusto(i, categoria),
                formatado: this.getCustoFormatado(i, categoria)
            });
        }
        return custos;
    }
};

/**
 * Aplica o sistema de Qi às técnicas de uma classe
 * @param {Object} classeTecnicas - Objeto com as técnicas da classe
 * @returns {Object} Técnicas com custos em Qi aplicados
 */
function aplicarSistemaQi(classeTecnicas) {
    const categoria = classeTecnicas.categoria || "Classe";
    
    // Aplicar custo à técnica inicial
    if (classeTecnicas.tecnicaInicial) {
        classeTecnicas.tecnicaInicial.custo_qi = SISTEMA_QI.calcularCusto(1, categoria);
        classeTecnicas.tecnicaInicial.custo_qi_formatado = SISTEMA_QI.getCustoFormatado(1, categoria);
    }
    
    // Aplicar custos às técnicas adicionais
    if (classeTecnicas.tecnicas && Array.isArray(classeTecnicas.tecnicas)) {
        classeTecnicas.tecnicas.forEach((tecnica, idx) => {
            const indiceTecnica = idx + 2; // +2 porque a inicial é a #1
            tecnica.custo_qi = SISTEMA_QI.calcularCusto(indiceTecnica, categoria);
            tecnica.custo_qi_formatado = SISTEMA_QI.getCustoFormatado(indiceTecnica, categoria);
        });
    }
    
    return classeTecnicas;
}

/**
 * Aplica custos de Qi a técnicas avançadas
 * @param {Array} tecnicas - Array de técnicas avançadas
 * @returns {Array} Técnicas com custos aplicados
 */
function aplicarSistemaQiAvancadas(tecnicas) {
    if (!Array.isArray(tecnicas)) return tecnicas;
    
    // Agrupar por classe para calcular índices corretos
    const porClasse = {};
    tecnicas.forEach(tec => {
        const classe = tecnica.classe || "Geral";
        if (!porClasse[classe]) porClasse[classe] = [];
        porClasse[classe].push(tec);
    });
    
    // Aplicar custos por classe
    Object.values(porClasse).forEach(tecnicasClasse => {
        tecnicasClasse.forEach((tecnica, idx) => {
            const indice = idx + 1;
            tecnica.custo_qi = SISTEMA_QI.calcularCusto(indice, "Avançada");
            tecnica.custo_qi_formatado = SISTEMA_QI.getCustoFormatado(indice, "Avançada");
        });
    });
    
    return tecnicas;
}

module.exports = { 
    SISTEMA_QI, 
    aplicarSistemaQi, 
    aplicarSistemaQiAvancadas 
};