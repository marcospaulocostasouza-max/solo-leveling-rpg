const fuzil = {
    nome: "Fuzil",
    descricao_classe: "Arma de fogo de longo alcance, conhecida por alta cadência de disparos e poder penetrativo. Os projéteis ignoram escudos mágicos e causam dano baseado no poder mágico.",
    categoria: "Classe",
    tecnicaInicial: {
        nome: "Rajada de Plasma Veloz",
        classe: "Fuzil",
        categoria: "Inicial",
        tipo: "Mágica",
        descricao: "Dispara rajada rápida com dano crescente.",
        descricao_completa: "O usuário dispara uma rajada rápida de projéteis de plasma com seu fuzil de assalto, que penetram nos inimigos e causam dano crescente com cada acerto consecutivo. Inimigos atingidos por múltiplos tiros ficam marcados, recebendo dano adicional no próximo ataque.[1% a cada tiro consecutivo][Máximo de 30%].",
        custo_mana: 1500,
        custo_qi: 10,
        custo_qi_formatado: "10 Qi",
        cooldown: 1,
        nivel_desbloqueio: 1,
        passiva: false
    },
    tecnicas: [
        {
            nome: "Barragem Tóxica",
            classe: "Fuzil",
            categoria: "Inicial",
            tipo: "Mágica",
            descricao: "Dispara dardos tóxicos em cone.",
            descricao_completa: "O usuário canaliza sua metralhadora para disparar uma onda de dardos tóxicos em um cone amplo. Cada dardo causa dano e aplica um efeito de veneno que reduz a velocidade de movimento em [-20%]. Inimigos atingidos por múltiplos dardos ficam em lentidão por mais tempo.[2-3Turnos].",
            custo_mana: 2000,
            custo_qi: 20,
            custo_qi_formatado: "20 Qi",
            cooldown: 3,
            nivel_desbloqueio: 3,
            passiva: false
        },
        {
            nome: "Fúria Elétrica",
            classe: "Fuzil",
            categoria: "Inicial",
            tipo: "Mágica",
            descricao: "Dispara tiros elétricos que saltam entre inimigos.",
            descricao_completa: "O usuário sobrecarrega seu fuzil de assalto com energia elétrica, disparando tiros que causam dano em área de [1M] e saltam entre inimigos próximos. Cada salto reduz a armadura dos inimigos atingidos em [10%], aumentando o dano recebido por eles.",
            custo_mana: 2500,
            custo_qi: 40,
            custo_qi_formatado: "40 Qi",
            cooldown: 3,
            nivel_desbloqueio: 5,
            passiva: false
        },
        {
            nome: "Avanço Relâmpago",
            classe: "Fuzil",
            categoria: "Inicial",
            tipo: "Mágica",
            descricao: "Avança rapidamente disparando tiros.",
            descricao_completa: "O usuário avança rapidamente em uma direção [+20% de Agilidade], disparando uma rajada de tiros de metralhadora enquanto se move. Os tiros causam dano reduzido [-20%], mas aplicam um efeito de lentidão [-40% de Agilidade].",
            custo_mana: 5000,
            custo_qi: 80,
            custo_qi_formatado: "80 Qi",
            cooldown: 3,
            nivel_desbloqueio: 7,
            passiva: false
        },
        {
            nome: "Tempestade de Descarga Final",
            classe: "Fuzil",
            categoria: "Inicial",
            tipo: "Mágica",
            descricao: "Dispara projétil super carregado explosivo.",
            descricao_completa: "O usuário canaliza toda a energia de sua metralhadora para disparar um único projétil super carregado que viaja em linha reta, causando dano massivo ao primeiro inimigo atingido[+20% adicional]. Após o impacto, o projétil explode em uma tempestade elétrica, causando dano em área e aplicando um efeito de atordoamento de [1 Turno]. Inimigos atingidos pela explosão também ficam marcados, recebendo dano adicional de ataques subsequentes [40%]. A marca dura por [2 turnos].",
            custo_mana: 8000,
            custo_qi: 160,
            custo_qi_formatado: "160 Qi",
            cooldown: 3,
            nivel_desbloqueio: 9,
            passiva: false
        },
        {
            nome: "Mira de Precisão Letal",
            classe: "Fuzil",
            categoria: "Inicial",
            tipo: "Passiva",
            descricao: "Aumenta dano em pontos vitais.",
            descricao_completa: "O usuário desenvolve uma mira excepcional, conseguindo identificar e atingir pontos vitais dos inimigos com precisão cirúrgica. Aumenta o dano em +40% quando acerta cabeça, coração ou outros pontos vitais. Também aumenta o alcance efetivo do fuzil em 20%.",
            custo_mana: 0,
            custo_qi: 50000,
            custo_qi_formatado: "50000 Qi",
            cooldown: 0,
            nivel_desbloqueio: 11,
            passiva: true
        }
    ]
};

module.exports = fuzil;