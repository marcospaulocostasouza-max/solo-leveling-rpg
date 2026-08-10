const advancedClasses = {
    "Hrymir": {
        categoria: "Geral",
        classeInicial: null,
        bloqueada: false,
        nome: "Hrymir",
        descricao: "Inpirados no deus nórdico de mesmo nome, Hrymir é uma classe para aqueles que se tornam um espírito ligado ao mundo dos mortos.",
        requisitos: { forca: 40, resistencia: 40, velocidade: 40, sentidos: 40, poder_magico: 40 },
        bonusAtributos: { forca: 40, resistencia: 40, velocidade: 40, sentidos: 40, poder_magico: 40 }
    },
    "Freyr": {
        categoria: "Geral",
        classeInicial: null,
        bloqueada: false,
        nome: "Freyr",
        descricao: "Especialmente conectados aos espíritos malignos, os Freyr interagem com criaturas mágicas como Majins e Djinns.",
        requisitos: { forca: 40, resistencia: 40, velocidade: 40, sentidos: 40, poder_magico: 40 },
        bonusAtributos: { forca: 40, resistencia: 40, velocidade: 40, sentidos: 40, poder_magico: 40 }
    },
    "Berserk": {
        categoria: "Tanker",
        classeInicial: "Tanker",
        bloqueada: false,
        nome: "Berserk",
        descricao: "Maior resiliência com ataques que absorvem HP e defesa aumentada perto da morte.",
        requisitos: { forca: 35, resistencia: 35 },
        bonusAtributos: { forca: 15, resistencia: 25 }
    },
    "Herói do Escudo": {
        categoria: "Tanker",
        classeInicial: "Tanker",
        bloqueada: false,
        nome: "Herói do Escudo",
        descricao: "Segura apenas um escudo capaz de absorver materiais de monstros para evoluir e clonar novos escudos.",
        requisitos: { resistencia: 50, poder_magico: 15 },
        bonusAtributos: { resistencia: 20, poder_magico: 10 }
    },
    "Construtor": {
        categoria: "Tanker",
        classeInicial: "Tanker",
        bloqueada: false,
        nome: "Construtor",
        descricao: "Gera armas mágicas e equipamentos através do artesanato, focando resistência e força.",
        requisitos: { resistencia: 50, forca: 30, velocidade: 15 },
        bonusAtributos: { resistencia: 20, forca: 15, velocidade: 10 }
    },
    "Paladino": {
        categoria: "Tanker",
        classeInicial: "Tanker",
        bloqueada: false,
        nome: "Paladino",
        descricao: "Guerreiro nato com espada e pequeno escudo, ideal para segurar bosses e proteger o grupo.",
        requisitos: { resistencia: 45, poder_magico: 15, forca: 15 },
        bonusAtributos: { resistencia: 20, poder_magico: 10, forca: 10 }
    },
    "Escudeiro": {
        categoria: "Tanker",
        classeInicial: "Tanker",
        bloqueada: false,
        nome: "Escudeiro",
        descricao: "Apoia aliados reparando e aprimorando armas e montando acampamentos de suporte.",
        requisitos: { resistencia: 45, poder_magico: 35 },
        bonusAtributos: { resistencia: 20, poder_magico: 15 }
    },
    "Uthabiti": {
        categoria: "Tanker",
        classeInicial: "Tanker",
        bloqueada: false,
        nome: "Uthabiti",
        descricao: "Ataque e defesa simétricos: o dano cresce com a intensidade da resistência.",
        requisitos: { resistencia: 70 },
        bonusAtributos: { resistencia: 30 }
    },
    "Morax": {
        categoria: "Tanker",
        classeInicial: "Tanker",
        bloqueada: false,
        nome: "Morax",
        descricao: "Ganha força com o número de aliados ou inimigos ao alcance de suas habilidades passivas.",
        requisitos: { resistencia: 35, forca: 20 },
        bonusAtributos: { resistencia: 15, forca: 10 }
    },
    "Viking": {
        categoria: "Tanker",
        classeInicial: "Tanker",
        bloqueada: false,
        nome: "Viking",
        descricao: "Combatente agressivo, domina machados e cresce em adaptabilidade quanto mais tempo fica em batalha.",
        requisitos: { forca: 60, resistencia: 60 },
        bonusAtributos: { forca: 30, resistencia: 30 }
    },
    "Lâmina Sombria": {
        categoria: "Assassino",
        classeInicial: "Assassino",
        bloqueada: false,
        nome: "Lâmina Sombria",
        descricao: "Especializada em furtividade, explosão de dano e ataques a pontos vitais.",
        requisitos: { forca: 60, velocidade: 50 },
        bonusAtributos: { forca: 20, velocidade: 20 }
    },
    "Sword Dancer": {
        categoria: "Assassino",
        classeInicial: "Assassino",
        bloqueada: false,
        nome: "Sword Dancer",
        descricao: "Empunhadura dupla com foco em combos constantes e danos estáveis.",
        requisitos: { forca: 35, poder_magico: 35 },
        bonusAtributos: { forca: 15, poder_magico: 15 }
    },
    "Corsário": {
        categoria: "Assassino",
        classeInicial: "Assassino",
        bloqueada: false,
        nome: "Corsário",
        descricao: "Saques, explosivos e dois NPCs auxiliando em combate.",
        requisitos: { forca: 50, velocidade: 20 },
        bonusAtributos: { forca: 20, velocidade: 10 }
    },
    "Shinobi": {
        categoria: "Assassino",
        classeInicial: "Assassino",
        bloqueada: false,
        nome: "Shinobi",
        descricao: "Especialista em ninjutsu, espionagem, sabotagem e assassinatos furtivos.",
        requisitos: { velocidade: 70, poder_magico: 20 },
        bonusAtributos: { velocidade: 30, poder_magico: 10 }
    },
    "Thanakir": {
        categoria: "Assassino",
        classeInicial: "Assassino",
        bloqueada: false,
        nome: "Thanakir",
        descricao: "Controla a cura inimiga, bloqueando qualquer cura ou escudo aplicado aos adversários.",
        requisitos: { velocidade: 45, forca: 30 },
        bonusAtributos: { velocidade: 20, forca: 15 }
    },
    "Pneuma-Ousia": {
        categoria: "Assassino",
        classeInicial: "Assassino",
        bloqueada: false,
        nome: "Pneuma-Ousia",
        descricao: "Canaliza energia elementar de água para amplificar o dano físico de forma devastadora.",
        requisitos: { inteligencia: 35, forca: 35 },
        bonusAtributos: { inteligencia: 20, forca: 15 }
    },
    "Nidhogg": {
        categoria: "Assassino",
        classeInicial: "Assassino",
        bloqueada: true,
        nome: "Nidhogg",
        descricao: "Conjurador híbrido que mistura energia arcana com agressividade corporal e domínio espacial.",
        requisitos: { sentidos: 60, velocidade: 70, forca: 30 },
        bonusAtributos: { sentidos: 25, velocidade: 20, forca: 15 }
    },
    "Rastreador": {
        categoria: "Ranger",
        classeInicial: "Ranger",
        bloqueada: false,
        nome: "Rastreador",
        descricao: "Segue alvos sem ser detectado e se move no escuro com grande furtividade.",
        requisitos: { sentidos: 60, velocidade: 40 },
        bonusAtributos: { sentidos: 20, velocidade: 15 }
    },
    "Andarilho": {
        categoria: "Ranger",
        classeInicial: "Ranger",
        bloqueada: false,
        nome: "Andarilho",
        descricao: "Melhora velocidade, fuga e recuperação quando joga sozinho, mas perde eficiência em grupo.",
        requisitos: { sentidos: 40, forca: 40, velocidade: 40, resistencia: 40 },
        bonusAtributos: { sentidos: 20, forca: 15, velocidade: 15, resistencia: 15 }
    },
    "Herói do Arco": {
        categoria: "Ranger",
        classeInicial: "Ranger",
        bloqueada: false,
        nome: "Herói do Arco",
        descricao: "Segura apenas arco e domina absorção de materiais de monstros para evoluir sua arma.",
        requisitos: { poder_magico: 15, velocidade: 60 },
        bonusAtributos: { velocidade: 20, poder_magico: 10 }
    },
    "Palhaço": {
        categoria: "Ranger",
        classeInicial: "Ranger",
        bloqueada: false,
        nome: "Palhaço",
        descricao: "Especializado no uso de adagas, incluindo ataques à distância com lâminas lançadas.",
        requisitos: { forca: 35, velocidade: 45 },
        bonusAtributos: { forca: 15, velocidade: 15 }
    },
    "Ardito": {
        categoria: "Ranger",
        classeInicial: "Ranger",
        bloqueada: false,
        nome: "Ardito",
        descricao: "Especialista em granadas e explosivos, utilizando magia para ampliar o alcance dos projéteis.",
        requisitos: { poder_magico: 35, velocidade: 30 },
        bonusAtributos: { poder_magico: 20, velocidade: 10 }
    },
    "Raijin": {
        categoria: "Ranger",
        classeInicial: "Ranger",
        bloqueada: false,
        nome: "Raijin",
        descricao: "Canaliza relâmpagos em projéteis com poder igual a Força + Inteligência + Velocidade.",
        requisitos: { inteligencia: 25, forca: 25, velocidade: 25 },
        bonusAtributos: { inteligencia: 15, forca: 10, velocidade: 10 }
    },
    "Harmonic": {
        categoria: "Ranger",
        classeInicial: "Ranger",
        bloqueada: false,
        nome: "Harmonic",
        descricao: "Harmoniza ataques com elementos e copia habilidades elementais para disparos únicos.",
        requisitos: { inteligencia: 35, forca: 25 },
        bonusAtributos: { inteligencia: 20, forca: 10 }
    },
    "Chefe": {
        categoria: "Healer",
        classeInicial: "Curador",
        bloqueada: false,
        nome: "Chefe",
        descricao: "Cria receitas alimentares que imitam magias e podem aplicar efeitos de buff e cura.",
        requisitos: { poder_magico: 30, forca: 30, inteligencia: 15 },
        bonusAtributos: { poder_magico: 20, forca: 10, inteligencia: 10 }
    },
    "Apotecário": {
        categoria: "Healer",
        classeInicial: "Curador",
        bloqueada: false,
        nome: "Apotecário",
        descricao: "Cria poções avançadas para curar HP, doenças e aplicar efeitos de suporte.",
        requisitos: { forca: 30, poder_magico: 35, inteligencia: 25 },
        bonusAtributos: { poder_magico: 20, inteligencia: 15 }
    },
    "Músico": {
        categoria: "Healer",
        classeInicial: "Curador",
        bloqueada: false,
        nome: "Músico",
        descricao: "Especialista em curas contínuas e suporte à distância com feitiços de pulso e cura instantânea.",
        requisitos: { poder_magico: 60, inteligencia: 10 },
        bonusAtributos: { poder_magico: 30, inteligencia: 10 }
    },
    "Oráculo": {
        categoria: "Healer",
        classeInicial: "Curador",
        bloqueada: false,
        nome: "Oráculo",
        descricao: "Prevê e interfere nos ataques inimigos através de profecias divinas.",
        requisitos: { poder_magico: 45, inteligencia: 15 },
        bonusAtributos: { poder_magico: 20, inteligencia: 15 }
    },
    "Estigmas": {
        categoria: "Healer",
        classeInicial: "Curador",
        bloqueada: false,
        nome: "Estigmas",
        descricao: "Usa fogo e luz divina para curar aliados ou causar danos massivos aos inimigos.",
        requisitos: { inteligencia: 35, poder_magico: 25 },
        bonusAtributos: { inteligencia: 15, poder_magico: 15 }
    },
    "Nazhir": {
        categoria: "Healer",
        classeInicial: "Curador",
        bloqueada: false,
        nome: "Nazhir",
        descricao: "Concede escudos elementais adaptativos com base no tipo de inimigo enfrentado.",
        requisitos: { inteligencia: 65 },
        bonusAtributos: { inteligencia: 25 }
    },
    "Calamitas": {
        categoria: "Healer",
        classeInicial: "Curador",
        bloqueada: false,
        nome: "Calamitas",
        descricao: "Aumenta o ataque de aliados e de si mesma com base na força de ataque atual.",
        requisitos: { inteligencia: 15, forca: 55 },
        bonusAtributos: { inteligencia: 10, forca: 20 }
    },
    "Mago de Luz": {
        categoria: "Healer",
        classeInicial: "Curador",
        bloqueada: true,
        nome: "Mago de Luz",
        descricao: "Manipula luz absoluta, movendo-se em velocidade quase ondulatória e provocando dano devastador.",
        requisitos: { poder_magico: 150, inteligencia: 50 },
        bonusAtributos: { poder_magico: 50, inteligencia: 20 }
    },
    "Samurai": {
        categoria: "Lutador",
        classeInicial: "Lutador",
        bloqueada: false,
        nome: "Samurai",
        descricao: "Utiliza equipamentos japoneses como katana e daiyoroi, com alta evasão e poder de combate.",
        requisitos: { forca: 50, resistencia: 40 },
        bonusAtributos: { forca: 20, resistencia: 15 }
    },
    "Herói da Espada": {
        categoria: "Lutador",
        classeInicial: "Lutador",
        bloqueada: false,
        nome: "Herói da Espada",
        descricao: "Segura apenas uma espada poderosa que absorve materiais de monstros para evoluir.",
        requisitos: { forca: 80 },
        bonusAtributos: { forca: 35 }
    },
    "Monge": {
        categoria: "Lutador",
        classeInicial: "Lutador",
        bloqueada: false,
        nome: "Monge",
        descricao: "Alta vida e evasão, usa armaduras leves e possui resistência maior a ataques mágicos.",
        requisitos: { forca: 35, poder_magico: 30, resistencia: 25 },
        bonusAtributos: { forca: 15, poder_magico: 10, resistencia: 15 }
    },
    "Inquisitor": {
        categoria: "Lutador",
        classeInicial: "Lutador",
        bloqueada: false,
        nome: "Inquisitor",
        descricao: "Especializado em combater magos com machados e martelos poderosos.",
        requisitos: { resistencia: 70, forca: 10 },
        bonusAtributos: { resistencia: 25, forca: 10 }
    },
    "Esgrimista": {
        categoria: "Lutador",
        classeInicial: "Lutador",
        bloqueada: false,
        nome: "Esgrimista",
        descricao: "Rápidas estocadas com florete e movimentos ágeis para dominar combates corpo a corpo.",
        requisitos: { forca: 45, velocidade: 45 },
        bonusAtributos: { forca: 15, velocidade: 15 }
    },
    "Herói da Lança": {
        categoria: "Lutador",
        classeInicial: "Lutador",
        bloqueada: false,
        nome: "Herói da Lança",
        descricao: "Segura apenas uma lança poderosa que evolui com materiais de monstros.",
        requisitos: { forca: 80 },
        bonusAtributos: { forca: 35 }
    },
    "Alquimista": {
        categoria: "Magos Gerais",
        classeInicial: "Mago",
        bloqueada: false,
        nome: "Alquimista",
        descricao: "Utiliza a lei da troca equivalente para transformar materiais e manipular o ambiente.",
        requisitos: { poder_magico: 70 },
        bonusAtributos: { poder_magico: 30 }
    },
    "Grande Mago": {
        categoria: "Magos Gerais",
        classeInicial: "Mago",
        bloqueada: false,
        nome: "Grande Mago",
        descricao: "Cria itens consumíveis e lança feitiços poderosos com maior custo de mana e desempenho elevado.",
        requisitos: { poder_magico: 90 },
        bonusAtributos: { poder_magico: 40 }
    },
    "Feiticeiros": {
        categoria: "Magos Gerais",
        classeInicial: "Mago",
        bloqueada: false,
        nome: "Feiticeiros",
        descricao: "Controla Mana Negativa e aprimora atributos físicos enquanto usa menos técnicas mágicas.",
        requisitos: { poder_magico: 65, resistencia: 35 },
        bonusAtributos: { poder_magico: 25, resistencia: 15 }
    },
    "Druida": {
        categoria: "Magos Gerais",
        classeInicial: "Mago",
        bloqueada: false,
        nome: "Druida",
        descricao: "Controla a natureza para apoiar aliados ou se transformar em monstros de batalha.",
        requisitos: { poder_magico: 45, inteligencia: 35 },
        bonusAtributos: { poder_magico: 20, inteligencia: 15 }
    },
    "Catalys": {
        categoria: "Magos Exclusivos",
        nome: "Catalys",
        descricao: "Cria reações elementais poderosas usando a sinergia entre elementos.",
        requisitos: { inteligencia: 80 },
        bonusAtributos: { inteligencia: 30 }
    },
    "Archon": {
        categoria: "Magos Exclusivos",
        nome: "Archon",
        descricao: "Mestre de um único elemento, explorando seu potencial ao máximo.",
        requisitos: { inteligencia: 100 },
        bonusAtributos: { inteligencia: 40 }
    },
    "Warden": {
        categoria: "Magos Exclusivos",
        nome: "Warden",
        descricao: "Corrói o elemento primário para versões sombrias e destrutivas.",
        requisitos: { inteligencia: 25, poder_magico: 55 },
        bonusAtributos: { inteligencia: 15, poder_magico: 30 }
    },
    "Arcanista": {
        categoria: "Magos Exclusivos",
        nome: "Arcanista",
        descricao: "Híbrido focado em consumo acadêmico, criando pergaminhos, runas e amuletos mágicos.",
        requisitos: { poder_magico: 50, inteligencia: 15, resistencia: 10 },
        bonusAtributos: { poder_magico: 20, inteligencia: 10, resistencia: 10 }
    },
    "Taoísta": {
        categoria: "Magos Exclusivos",
        nome: "Taoísta",
        descricao: "Usa talismãs mágicos para atacar, curar e aplicar maldições em inimigos.",
        requisitos: { poder_magico: 35, inteligencia: 30 },
        bonusAtributos: { poder_magico: 15, inteligencia: 15 }
    },
    "Sábio": {
        categoria: "Magos Exclusivos",
        nome: "Sábio",
        descricao: "Manipula elementos e cria portais dimensionais com técnicas superiores.",
        requisitos: { poder_magico: 30, inteligencia: 55 },
        bonusAtributos: { inteligencia: 25, poder_magico: 10 }
    },
    "Mago Rúnico": {
        categoria: "Magos Exclusivos",
        nome: "Mago Rúnico",
        descricao: "Especialista em matrizes rúnicas que amplificam magia com precisão e paciência.",
        requisitos: { inteligencia: 45, poder_magico: 35 },
        bonusAtributos: { inteligencia: 20, poder_magico: 20 }
    },
    "Domador": {
        categoria: "Magos Exclusivos",
        nome: "Domador",
        descricao: "Domestica monstros e controla criaturas que desaparecem ao morrer.",
        requisitos: { poder_magico: 60, inteligencia: 10 },
        bonusAtributos: { poder_magico: 25, inteligencia: 10 }
    },
    "Onmyouji": {
        categoria: "Magos Exclusivos",
        nome: "Onmyouji",
        descricao: "Invoca espíritos divinos e usa Yin e Yang para causar dano em área.",
        requisitos: { poder_magico: 80 },
        bonusAtributos: { poder_magico: 35 }
    },
    "Bruxo": {
        categoria: "Magos Exclusivos",
        nome: "Bruxo",
        descricao: "Comanda espíritos malignos e demônios para lutar ao seu lado.",
        requisitos: { poder_magico: 75, inteligencia: 10 },
        bonusAtributos: { poder_magico: 30, inteligencia: 10 }
    },
    "Mago de Ignição": {
        categoria: "Magos Exclusivos",
        nome: "Mago de Ignição",
        descricao: "Funde magia com tecnologia para criar mechas e armas robóticas.",
        requisitos: { forca: 25, resistencia: 25, velocidade: 25, sentidos: 25, inteligencia: 25, poder_magico: 25 },
        bonusAtributos: { forca: 10, resistencia: 10, velocidade: 10, sentidos: 10, inteligencia: 10, poder_magico: 10 }
    },
    "Necromante": {
        categoria: "Magos Exclusivos",
        nome: "Necromante",
        descricao: "Convoca mortos-vivos e usa suas criaturas como aliados em combate.",
        requisitos: { poder_magico: 100 },
        bonusAtributos: { poder_magico: 40 }
    },
    "Taumaturgo": {
        categoria: "Magos Exclusivos",
        nome: "Taumaturgo",
        descricao: "Altera atributos e tamanho de alvos em combate, fortalecendo aliados ou encolhendo inimigos.",
        requisitos: { poder_magico: 30, inteligencia: 30, velocidade: 30 },
        bonusAtributos: { poder_magico: 20, inteligencia: 15, velocidade: 15 }
    },
    "Bokor": {
        categoria: "Magos Exclusivos",
        nome: "Bokor",
        descricao: "Usa vodu para ressuscitar mortos e amaldiçoar inimigos à distância.",
        requisitos: { poder_magico: 50, inteligencia: 15, forca: 25 },
        bonusAtributos: { poder_magico: 25, inteligencia: 10, forca: 10 }
    },
    "Mago de Escuridão": {
        categoria: "Magos Exclusivos",
        classeInicial: "Mago Elemental",
        bloqueada: true,
        nome: "Mago de Escuridão",
        descricao: "Combina necromancia e magia elemental para manipular sombras ilimitadamente.",
        requisitos: { poder_magico: 100, inteligencia: 20 },
        bonusAtributos: { poder_magico: 45, inteligencia: 15 }
    }
};

module.exports = advancedClasses;
