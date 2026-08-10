const pistola = {
    nome: "Pistola",
    descricao_classe: "Arma de fogo de curto alcance, conhecida por dano penetrante e projéteis mágicos. Causa dano mágico que ignora parte da armadura.",
    categoria: "Classe",
    tecnicaInicial: {
        nome: "Tiro Básico",
        classe: "Pistola",
        categoria: "Inicial",
        tipo: "Física",
        descricao: "Disparo básico de pistola.",
        descricao_completa: "Disparo fundamental da pistola. Causa dano mágico penetrante que ignora 20% da armadura do alvo.",
        custo_mana: 200,
        custo_qi: 10,
        custo_qi_formatado: "10 Qi",
        cooldown: 1,
        nivel_desbloqueio: 1,
        passiva: false
    },
    tecnicas: [
        {
            nome: "Dança das Balas Gêmeas",
            classe: "Pistola",
            categoria: "Inicial",
            tipo: "Mágica",
            descricao: "Dispara duas rajadas simultâneas.",
            descricao_completa: "O usuário dispara duas rajadas simultâneas com ambas as pistolas ou uma só, uma em linha reta e outra em um arco amplo, cobrindo uma área ampla. A primeira rajada causa dano físico, enquanto a segunda aplica um efeito de lentidão.",
            custo_mana: 1500,
            custo_qi: 20,
            custo_qi_formatado: "20 Qi",
            cooldown: 2,
            nivel_desbloqueio: 3,
            passiva: false
        },
        {
            nome: "Fúria das Ondas Cruzadas",
            classe: "Pistola",
            categoria: "Inicial",
            tipo: "Mágica",
            descricao: "Dispara onda cruzada de balas mágicas.",
            descricao_completa: "O usuário canaliza energia por [1 Turno] e dispara uma onda cruzada de balas mágicas que se espalham em um padrão de 'X'. Cada bala causa dano e reduz a armadura do inimigo atingido [-5%].",
            custo_mana: 2500,
            custo_qi: 40,
            custo_qi_formatado: "40 Qi",
            cooldown: 2,
            nivel_desbloqueio: 5,
            passiva: false,
            alcance: "10M"
        },
        {
            nome: "Assalto Relâmpago",
            classe: "Pistola",
            categoria: "Inicial",
            tipo: "Mágica",
            descricao: "Avança rapidamente disparando tiros precisos.",
            descricao_completa: "O usuário avança rapidamente em uma direção [40% de Agilidade por 1 turno], disparando tiros precisos em todos os inimigos no caminho. Cada tiro causa dano adicional com base na quantidade de balas que o atingiu, aumentando em [5% para cada].",
            custo_mana: 2000,
            custo_qi: 80,
            custo_qi_formatado: "80 Qi",
            cooldown: 1,
            nivel_desbloqueio: 7,
            passiva: false
        },
        {
            nome: "Eclipse de Chumbo",
            classe: "Pistola",
            categoria: "Inicial",
            tipo: "Mágica",
            descricao: "Dispara chuva de balas em área circular.",
            descricao_completa: "O usuário dispara uma série de tiros para o céu, que caem como uma chuva de balas em uma área circular após 2 segundos. Inimigos no centro da área recebem dano mágico, enquanto os demais recebem dano físico e são atordoados por [1 Turno].",
            custo_mana: 3500,
            custo_qi: 160,
            custo_qi_formatado: "160 Qi",
            cooldown: 2,
            nivel_desbloqueio: 9,
            passiva: false,
            alcance: "10M"
        },
        {
            nome: "Gatilho infernal",
            classe: "Pistola",
            categoria: "Inicial",
            tipo: "Mágica",
            descricao: "Fúria de 2 turnos com balas contínuas.",
            descricao_completa: "O usuário entra em um estado de fúria por [2 turnos], disparando balas mágicas continuamente em todas as direções. Cada bala causa dano e reduz o tempo de recarga das habilidades do usuário em 1 turno por acerto.",
            custo_mana: 4000,
            custo_qi: 320,
            custo_qi_formatado: "320 Qi",
            cooldown: 5,
            nivel_desbloqueio: 11,
            passiva: false,
            alcance: "10M"
        }
    ]
};

module.exports = pistola;