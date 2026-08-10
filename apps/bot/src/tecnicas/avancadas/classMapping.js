/**
 * MAPEAMENTO DE CLASSES INICIAIS → CLASSES AVANÇADAS
 * 
 * Define quais classes avançadas cada classe inicial pode escolher.
 * Classes GERAIS estão disponíveis para todas as classes iniciais.
 */

const classMapping = {
    // LUTADOR → Lutador + Geral
    "lutador": [
        "Hrymir", "Freyr",  // Geral
        "Samurai", "Herói da Espada", "Monge", "Inquisitor", "Esgrimista", "Viking", "Herói da Lança"
    ],
    
    // ASSASSINO → Assassino + Geral
    "assassino": [
        "Hrymir", "Freyr",  // Geral
        "Lâmina Sombria", "Sword Dancer", "Corsário", "Shinobi", "Thanakir", "Pneuma-Ousia", "Nidhogg"
    ],
    
    // TANKER → Tanker + Geral
    "tanker": [
        "Hrymir", "Freyr",  // Geral
        "Berserk", "Herói do Escudo", "Construtor", "Paladino", "Escudeiro", "Uthabiti", "Morax", "Viking"
    ],
    
    // RANGER → Ranger + Geral
    "ranger": [
        "Hrymir", "Freyr",  // Geral
        "Rastreador", "Andarilho", "Herói do Arco", "Palhaço", "Ardito", "Raijin", "Harmonic", "Nidhogg"
    ],
    
    // CURADOR → Healer + Geral
    "curador": [
        "Hrymir", "Freyr",  // Geral
        "Chefe", "Apotecário", "Músico", "Oráculo", "Estigmas", "Nazhir", "Calamitas", "Mago de Luz"
    ],
    
    // MAGO ELEMENTAL → Magos Gerais + Magos Exclusivos (Elemental) + Geral
    "mago elemental": [
        "Hrymir", "Freyr",  // Geral
        "Alquimista", "Grande Mago", "Feiticeiros", "Druida",  // Magos Gerais
        "Catalys", "Archon", "Warden",  // Magos Exclusivos (Elemental)
        "Mago de Luz"  // Healer/Elemental
    ],
    
    // MAGO INVOCADOR → Magos Exclusivos (Invocador) + Geral
    "mago invocador": [
        "Hrymir", "Freyr",  // Geral
        "Domador", "Onmyouji", "Bruxo", "Mago de Ignição"  // Magos Exclusivos (Invocador)
    ],
    
    // MAGO DE BARREIRA → Magos Exclusivos (Barreira) + Geral
    "mago barreira": [
        "Hrymir", "Freyr",  // Geral
        "Arcanista", "Taoísta", "Sábio", "Mago Rúnico"  // Magos Exclusivos (Barreira)
    ],
    
    // MAGO DE MALDIÇÃO → Magos Exclusivos (Maldição) + Geral
    "mago maldição": [
        "Hrymir", "Freyr",  // Geral
        "Necromante", "Taumaturgo", "Bokor",  // Magos Exclusivos (Maldição)
        "Mago de Escuridão"  // Maldição/Elemental
    ]
};

// Categorias das classes avançadas
const categoriasAvancadas = {
    "Geral": ["Hrymir", "Freyr"],
    "Tanker": ["Berserk", "Herói do Escudo", "Construtor", "Paladino", "Escudeiro", "Uthabiti", "Morax", "Viking"],
    "Assassino": ["Lâmina Sombria", "Sword Dancer", "Corsário", "Shinobi", "Thanakir", "Pneuma-Ousia", "Nidhogg"],
    "Ranger": ["Rastreador", "Andarilho", "Herói do Arco", "Palhaço", "Ardito", "Raijin", "Harmonic", "Nidhogg"],
    "Healer": ["Chefe", "Apotecário", "Músico", "Oráculo", "Estigmas", "Nazhir", "Calamitas", "Mago de Luz"],
    "Lutador": ["Samurai", "Herói da Espada", "Monge", "Inquisitor", "Esgrimista", "Viking", "Herói da Lança"],
    "Magos Gerais": ["Alquimista", "Grande Mago", "Feiticeiros", "Druida"],
    "Magos Exclusivos": ["Catalys", "Archon", "Warden", "Arcanista", "Taoísta", "Sábio", "Mago Rúnico", "Domador", "Onmyouji", "Bruxo", "Mago de Ignição", "Necromante", "Taumaturgo", "Bokor", "Mago de Escuridão"]
};

/**
 * Retorna as classes avançadas disponíveis para uma classe inicial
 */
function getClassesDisponiveis(classeInicial) {
    const chave = (classeInicial || "").toLowerCase().trim();
    return classMapping[chave] || [];
}

/**
 * Retorna a categoria de uma classe avançada
 */
function getCategoriaClasse(nomeClasse) {
    for (const [cat, classes] of Object.entries(categoriasAvancadas)) {
        if (classes.includes(nomeClasse)) return cat;
    }
    return "Desconhecida";
}

module.exports = { classMapping, categoriasAvancadas, getClassesDisponiveis, getCategoriaClasse };