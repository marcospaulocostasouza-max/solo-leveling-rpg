/**
 * BUFFS DE CLASSES
 * 
 * Define os bônus de atributos para cada classe.
 * Usado no sistema de criação de jogadores.
 */

module.exports = {
    // Lutador
    "Lutador": {
        forca_buff: 5,
        resistencia_buff: 3,
        velocidade_buff: 2,
        sentidos_buff: 1,
        inteligencia_buff: 0,
        poder_magico_buff: 0
    },
    
    // Assassino
    "Assassino": {
        forca_buff: 2,
        resistencia_buff: 1,
        velocidade_buff: 5,
        sentidos_buff: 3,
        inteligencia_buff: 1,
        poder_magico_buff: 0
    },
    
    // Tanker
    "Tanker": {
        forca_buff: 3,
        resistencia_buff: 5,
        velocidade_buff: 0,
        sentidos_buff: 1,
        inteligencia_buff: 1,
        poder_magico_buff: 2
    },
    
    // Ranger
    "Ranger": {
        forca_buff: 2,
        resistencia_buff: 1,
        velocidade_buff: 4,
        sentidos_buff: 4,
        inteligencia_buff: 2,
        poder_magico_buff: 0
    },

    // Ranger Fisico: especializacao ofensiva em Forca
    "Ranger Físico": {
        forca_buff: 5,
        resistencia_buff: 1,
        velocidade_buff: 4,
        sentidos_buff: 4,
        inteligencia_buff: 0,
        poder_magico_buff: 0
    },

    // Ranger Magico: especializacao ofensiva em Poder Magico
    "Ranger Mágico": {
        forca_buff: 0,
        resistencia_buff: 1,
        velocidade_buff: 4,
        sentidos_buff: 4,
        inteligencia_buff: 2,
        poder_magico_buff: 5
    },
    
    // Curador
    "Curador": {
        forca_buff: 0,
        resistencia_buff: 1,
        velocidade_buff: 2,
        sentidos_buff: 2,
        inteligencia_buff: 4,
        poder_magico_buff: 5
    },
    
    // Mago Elemental
    "Mago Elemental": {
        forca_buff: 0,
        resistencia_buff: 1,
        velocidade_buff: 1,
        sentidos_buff: 2,
        inteligencia_buff: 4,
        poder_magico_buff: 6
    },
    
    // Mago Invocador
    "Mago Invocador": {
        forca_buff: 0,
        resistencia_buff: 1,
        velocidade_buff: 2,
        sentidos_buff: 3,
        inteligencia_buff: 5,
        poder_magico_buff: 4
    },
    
    // Mago Barreira
    "Mago de Barreira": {
        forca_buff: 1,
        resistencia_buff: 4,
        velocidade_buff: 1,
        sentidos_buff: 2,
        inteligencia_buff: 4,
        poder_magico_buff: 4
    },
    
    // Mago Maldição
    "Mago de Maldicao": {
        forca_buff: 0,
        resistencia_buff: 2,
        velocidade_buff: 2,
        sentidos_buff: 3,
        inteligencia_buff: 5,
        poder_magico_buff: 4
    }
};

// Classe padrão para clases não definidas
module.exports.default = {
    forca_buff: 0,
    resistencia_buff: 0,
    velocidade_buff: 0,
    sentidos_buff: 0,
    inteligencia_buff: 0,
    poder_magico_buff: 0
};
