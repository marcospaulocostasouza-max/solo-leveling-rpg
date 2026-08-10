/**
 * SISTEMA DE CLASSES AVANÇADAS E SEUS BUFFS
 * 
 * Cada classe avançada possui bônus específicos que são aplicados
 * automaticamente quando o jogador escolhe sua classe avançada.
 */

const CLASSES_AVANCADAS = {
    // =====================================
    // TANK
    // =====================================
    "Hrymir": {
        nome: "Monarca dos Glacinatas",
        classe_base: "Tanker",
        bonus: "+50% em Resistência",
        atributo: "resistencia",
        multiplicador: 1.5,
        descricao: "Ganha +50% de resistência e habilidades relacionadas ao gelo"
    },
    "Freyr": {
        nome: "Monarca da Caça",
        classe_base: "Tanker",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades de caça"
    },
    "Paladino": {
        nome: "Monarca do Azar",
        classe_base: "Tanker",
        bonus: "+50% em Resistência",
        atributo: "resistencia",
        multiplicador: 1.5,
        descricao: "Ganha +50% de resistência e habilidades de proteção"
    },
    "Escudeiro": {
        nome: "Monarca do Sacrifício",
        classe_base: "Tanker",
        bonus: "+50% em Resistência",
        atributo: "resistencia",
        multiplicador: 1.5,
        descricao: "Ganha +50% de resistência e habilidades de escudo"
    },
    "Uthabiti": {
        nome: "Monarca do Desafio",
        classe_base: "Tanker",
        bonus: "+50% em Resistência",
        atributo: "resistencia",
        multiplicador: 1.5,
        descricao: "Ganha +50% de resistência e habilidades de desafio"
    },
    "Morax": {
        nome: "Monarca do Núcleo",
        classe_base: "Tanker",
        bonus: "+50% em Resistência",
        atributo: "resistencia",
        multiplicador: 1.5,
        descricao: "Ganha +50% de resistência e habilidades de núcleo"
    },
    "Berserker": {
        nome: "Monarca das Presas",
        classe_base: "Tanker",
        bonus: "+50% em Força",
        atributo: "forca",
        multiplicador: 1.5,
        descricao: "Ganha +50% de força e habilidades de fúria"
    },
    "Heroi do Escudo": {
        nome: "Monarca do Corpo de Ferro",
        classe_base: "Tanker",
        bonus: "+50% em Resistência",
        atributo: "resistencia",
        multiplicador: 1.5,
        descricao: "Ganha +50% de resistência e habilidades de escudo avançado"
    },
    "Construtor": {
        nome: "Monarca do Caos",
        classe_base: "Tanker",
        bonus: "+50% em Resistência",
        atributo: "resistencia",
        multiplicador: 1.5,
        descricao: "Ganha +50% de resistência e habilidades de construção"
    },
    
    // =====================================
    // ASSASSINO
    // =====================================
    "Corsario": {
        nome: "Monarca dos Mares",
        classe_base: "Assassino",
        bonus: "+50% em Sentidos",
        atributo: "sentidos",
        multiplicador: 1.5,
        descricao: "Ganha +50% de sentidos e habilidades aquáticas"
    },
    "Shinobi": {
        nome: "Monarca da Paciência",
        classe_base: "Assassino",
        bonus: "+50% em Sentidos",
        atributo: "sentidos",
        multiplicador: 1.5,
        descricao: "Ganha +50% de sentidos e habilidades de stealth"
    },
    "Thanakir": {
        nome: "Monarca da Vida",
        classe_base: "Assassino",
        bonus: "+50% em Sentidos",
        atributo: "sentidos",
        multiplicador: 1.5,
        descricao: "Ganha +50% de sentidos e habilidades de vida"
    },
    "Pneuma-ousia": {
        nome: "Monarca dos Abyssais",
        classe_base: "Assassino",
        bonus: "+50% em Sentidos",
        atributo: "sentidos",
        multiplicador: 1.5,
        descricao: "Ganha +50% de sentidos e habilidades abissais"
    },
    "Lamina Sombria": {
        nome: "Monarca da Morte",
        classe_base: "Assassino",
        bonus: "+50% em Força",
        atributo: "forca",
        multiplicador: 1.5,
        descricao: "Ganha +50% de força e habilidades de sombra"
    },
    "Heroi da Lanca": {
        nome: "Monarca do Amor",
        classe_base: "Assassino",
        bonus: "+50% em Sentidos",
        atributo: "sentidos",
        multiplicador: 1.5,
        descricao: "Ganha +50% de sentidos e habilidades de lança"
    },
    "Dancarino das Espadas": {
        nome: "Monarca dos Cavaleiros",
        classe_base: "Assassino",
        bonus: "+50% em Sentidos",
        atributo: "sentidos",
        multiplicador: 1.5,
        descricao: "Ganha +50% de sentidos e habilidades de dança"
    },
    "Nidhogg": {
        nome: "Monarca do Espaço",
        classe_base: "Assassino",
        bonus: "+50% em Sentidos",
        atributo: "sentidos",
        multiplicador: 1.5,
        descricao: "Ganha +50% de sentidos e habilidades espaciais"
    },
    
    // =====================================
    // RANGER
    // =====================================
    "Palhaco": {
        nome: "Monarca do Fim",
        classe_base: "Ranger",
        bonus: "+50% em Sentidos",
        atributo: "sentidos",
        multiplicador: 1.5,
        descricao: "Ganha +50% de sentidos e habilidades de combate"
    },
    "Ardito": {
        nome: "Monarca da Verdade",
        classe_base: "Ranger",
        bonus: "+50% em Sentidos",
        atributo: "sentidos",
        multiplicador: 1.5,
        descricao: "Ganha +50% de sentidos e habilidades de verdade"
    },
    "Raijin": {
        nome: "Monarca das Trevas",
        classe_base: "Ranger",
        bonus: "+50% em Sentidos",
        atributo: "sentidos",
        multiplicador: 1.5,
        descricao: "Ganha +50% de sentidos e habilidades de trevas"
    },
    "Harmonic": {
        nome: "Monarca da Glória",
        classe_base: "Ranger",
        bonus: "+50% em Sentidos",
        atributo: "sentidos",
        multiplicador: 1.5,
        descricao: "Ganha +50% de sentidos e habilidades de glória"
    },
    "Rastreadores": {
        nome: "Monarca da Guerra",
        classe_base: "Ranger",
        bonus: "+50% em Sentidos",
        atributo: "sentidos",
        multiplicador: 1.5,
        descricao: "Ganha +50% de sentidos e habilidades de rastreamento"
    },
    "Andarilho": {
        nome: "Monarca dos Combates",
        classe_base: "Ranger",
        bonus: "+50% em Sentidos",
        atributo: "sentidos",
        multiplicador: 1.5,
        descricao: "Ganha +50% de sentidos e habilidades de combate"
    },
    "Heroi do Arco": {
        nome: "Monarca dos Heróis",
        classe_base: "Ranger",
        bonus: "+50% em Sentidos",
        atributo: "sentidos",
        multiplicador: 1.5,
        descricao: "Ganha +50% de sentidos e habilidades de arco"
    },
    
    // =====================================
    // HEALER
    // =====================================
    "Oraculo": {
        nome: "Monarca do Futuro",
        classe_base: "Curador",
        bonus: "+50% em Inteligência",
        atributo: "inteligencia",
        multiplicador: 1.5,
        descricao: "Ganha +50% de inteligência e habilidades de cura"
    },
    "Estigmas": {
        nome: "Monarca das Estrelas",
        classe_base: "Curador",
        bonus: "+50% em Inteligência",
        atributo: "inteligencia",
        multiplicador: 1.5,
        descricao: "Ganha +50% de inteligência e habilidades de estrelas"
    },
    "Nazhir": {
        nome: "Monarca do Dia",
        classe_base: "Curador",
        bonus: "+50% em Inteligência",
        atributo: "inteligencia",
        multiplicador: 1.5,
        descricao: "Ganha +50% de inteligência e habilidades de luz"
    },
    "Calamitas": {
        nome: "Monarca da Pureza",
        classe_base: "Curador",
        bonus: "+50% em Inteligência",
        atributo: "inteligencia",
        multiplicador: 1.5,
        descricao: "Ganha +50% de inteligência e habilidades de pureza"
    },
    "Chefe": {
        nome: "Monarca da Fome",
        classe_base: "Curador",
        bonus: "+50% em Inteligência",
        atributo: "inteligencia",
        multiplicador: 1.5,
        descricao: "Ganha +50% de inteligência e habilidades de fome"
    },
    "Apotecario": {
        nome: "Monarca das Pragas",
        classe_base: "Curador",
        bonus: "+50% em Inteligência",
        atributo: "inteligencia",
        multiplicador: 1.5,
        descricao: "Ganha +50% de inteligência e habilidades de poções"
    },
    "Musico": {
        nome: "Monarca da Loucura",
        classe_base: "Curador",
        bonus: "+50% em Inteligência",
        atributo: "inteligencia",
        multiplicador: 1.5,
        descricao: "Ganha +50% de inteligência e habilidades musicais"
    },
    "Luz": {
        nome: "Monarca da Ordem",
        classe_base: "Curador",
        bonus: "+50% em Inteligência",
        atributo: "inteligencia",
        multiplicador: 1.5,
        descricao: "Ganha +50% de inteligência e habilidades de luz"
    },
    
    // =====================================
    // LUTADOR
    // =====================================
    "Inquisidor": {
        nome: "Monarca das Copas",
        classe_base: "Lutador",
        bonus: "+50% em Força",
        atributo: "forca",
        multiplicador: 1.5,
        descricao: "Ganha +50% de força e habilidades de inquisição"
    },
    "Esgrimista": {
        nome: "Monarca do Ouro",
        classe_base: "Lutador",
        bonus: "+50% em Força",
        atributo: "forca",
        multiplicador: 1.5,
        descricao: "Ganha +50% de força e habilidades de esgrima"
    },
    "Noktal": {
        nome: "Monarca da Noite",
        classe_base: "Lutador",
        bonus: "+50% em Força",
        atributo: "forca",
        multiplicador: 1.5,
        descricao: "Ganha +50% de força e habilidades noturnas"
    },
    "Traveler": {
        nome: "Monarca da Retenção",
        classe_base: "Lutador",
        bonus: "+50% em Força",
        atributo: "forca",
        multiplicador: 1.5,
        descricao: "Ganha +50% de força e habilidades de retenção"
    },
    "Espadachim": {
        nome: "Monarca da Piedade",
        classe_base: "Lutador",
        bonus: "+50% em Força",
        atributo: "forca",
        multiplicador: 1.5,
        descricao: "Ganha +50% de força e habilidades de espada"
    },
    "Heroi da Espada": {
        nome: "Monarca das Chamas Brancas",
        classe_base: "Lutador",
        bonus: "+50% em Força",
        atributo: "forca",
        multiplicador: 1.5,
        descricao: "Ganha +50% de força e habilidades de espada flamejante"
    },
    "Monge": {
        nome: "Monarca da Destruição",
        classe_base: "Lutador",
        bonus: "+50% em Força",
        atributo: "forca",
        multiplicador: 1.5,
        descricao: "Ganha +50% de força e habilidades de destruição"
    },
    "Viking": {
        nome: "Monarca do Derramamento",
        classe_base: "Lutador",
        bonus: "+50% em Força",
        atributo: "forca",
        multiplicador: 1.5,
        descricao: "Ganha +50% de força e habilidades vikings"
    },
    
    // =====================================
    // MAGO GERAL
    // =====================================
    "Grande Mago": {
        nome: "Monarca da Dádiva",
        classe_base: "Mago",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades de dádiva"
    },
    "Feiticeiro": {
        nome: "Monarca da Divindade",
        classe_base: "Mago",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades de feitiçaria"
    },
    "Druida": {
        nome: "Monarca do Passado",
        classe_base: "Mago",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades da natureza"
    },
    "Alquimista": {
        nome: "Monarca da Transmutação",
        classe_base: "Mago",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades de alquimia"
    },
    
    // =====================================
    // ELEMENTAL
    // =====================================
    "Catalys": {
        nome: "Monarca do Cataclismo",
        classe_base: "Mago Elemental",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades de cataclismo"
    },
    "Archon": {
        nome: "Monarca de Gelo/Fogo/Água/Terra/Planta/Raios",
        classe_base: "Mago Elemental",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e domínio elemental"
    },
    "Warden": {
        nome: "Monarca do Defensor",
        classe_base: "Mago Elemental",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades de defesa"
    },
    
    // =====================================
    // BARREIRA/MALDICAO/INVOCADOR
    // =====================================
    "Taoista": {
        nome: "Monarca dos Shikigamis",
        classe_base: "Mago de Barreira",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades de shikigami"
    },
    "Sabio": {
        nome: "Monarca do Presente",
        classe_base: "Mago de Barreira",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades de sabedoria"
    },
    "Onmyouji": {
        nome: "Monarca da Ascensão",
        classe_base: "Mago de Barreira",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades de onmyou"
    },
    "Runico": {
        nome: "Monarca das Runas",
        classe_base: "Mago de Barreira",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades rúnicas"
    },
    "Arcanista": {
        nome: "Monarca do Início",
        classe_base: "Mago de Barreira",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades arcanas"
    },
    "Taumaturgo": {
        nome: "Monarca da Ruptura",
        classe_base: "Mago de Maldição",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades de ruptura"
    },
    "Bokor": {
        nome: "Monarca dos Mortos",
        classe_base: "Mago de Maldição",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades de mortos-vivos"
    },
    "Necromante": {
        nome: "Monarca das Sombras",
        classe_base: "Mago de Maldição",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades de necromancia"
    },
    "Escuridao": {
        nome: "Monarca do Vazio",
        classe_base: "Mago de Maldição",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades de vazio"
    },
    "Ignicao": {
        nome: "Monarca da Mecânica",
        classe_base: "Mago Invocador",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades mecânicas"
    },
    "Domador": {
        nome: "Monarca da Transfiguração",
        classe_base: "Mago Invocador",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades de invocação"
    },
    "Bruxo": {
        nome: "Monarca do Desejo",
        classe_base: "Mago Invocador",
        bonus: "+50% em Poder Mágico",
        atributo: "poder_magico",
        multiplicador: 1.5,
        descricao: "Ganha +50% de poder mágico e habilidades de desejo"
    }
};

/**
 * Busca dados de uma classe avançada pelo nome
 */
function getClasseAvancada(nomeClasse) {
    return CLASSES_AVANCADAS[nomeClasse] || null;
}

/**
 * Aplica os buffs de uma classe avançada ao jogador
 */
function aplicarBuffsClasseAvancada(jogador, nomeClasseAvancada) {
    const classe = getClasseAvancada(nomeClasseAvancada);
    
    if (!classe) {
        console.error(`Classe avançada não encontrada: ${nomeClasseAvancada}`);
        return null;
    }
    
    return {
        bonus: classe.bonus,
        atributo: classe.atributo,
        multiplicador: classe.multiplicador,
        descricao: classe.descricao
    };
}

module.exports = {
    CLASSES_AVANCADAS,
    getClasseAvancada,
    aplicarBuffsClasseAvancada
};