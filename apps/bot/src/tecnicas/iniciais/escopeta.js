const escopeta = {
    nome: "Escopeta",
    descricao_classe: "Arma de fogo de penetração em massa, conhecida por alta cadência de disparos e poder penetrativo. Os projéteis ignoram escudos mágicos e causam dano baseado no poder mágico.",
    categoria: "Classe",
    tecnicaInicial: {
        nome: "Tiro Básico",
        classe: "Escopeta",
        categoria: "Inicial",
        tipo: "Física",
        descricao: "Disparo básico de escopeta.",
        descricao_completa: "Disparo fundamental da escopeta. Causa dano em cone e tem chance de atordoar inimigos próximos.",
        custo_mana: 300,
        custo_qi: 10,
        custo_qi_formatado: "10 Qi",
        cooldown: 1,
        nivel_desbloqueio: 1,
        passiva: false
    },
    tecnicas: [
        {
            nome: "Canhão da Ruína",
            classe: "Escopeta",
            categoria: "Inicial",
            tipo: "Mágica",
            descricao: "Dispara projétil que explode e atordoa.",
            descricao_completa: "O usuário dispara um poderoso projétil de canhão que explode ao atingir o primeiro inimigo ou no final do alcance, causando dano em área e atordoando os inimigos por [1 Turno]. A explosão também derruba estruturas frágeis, como armadilhas ou escudos mágicos mais fracos que seu PM.",
            custo_mana: 2000,
            custo_qi: 20,
            custo_qi_formatado: "20 Qi",
            cooldown: 1,
            nivel_desbloqueio: 3,
            passiva: false
        },
        {
            nome: "Salto Explosivo",
            classe: "Escopeta",
            categoria: "Inicial",
            tipo: "Mágica",
            descricao: "Salta e dispara rajada em cone.",
            descricao_completa: "O usuário salta para uma área/alvo, disparando uma rajada de tiros de espingarda ao pousar. Os tiros causam dano em cone e empurram os inimigos para trás [2M]. Se o usuário pousar sobre um inimigo, causa dano adicional de 20% e reduz o tempo de recarga desta habilidade em [1 turno].",
            custo_mana: 3500,
            custo_qi: 40,
            custo_qi_formatado: "40 Qi",
            cooldown: 3,
            nivel_desbloqueio: 5,
            passiva: false
        },
        {
            nome: "Barragem de Foguetes",
            classe: "Escopeta",
            categoria: "Inicial",
            tipo: "Mágica",
            descricao: "Dispara foguetes que caem em área.",
            descricao_completa: "O usuário dispara uma série de foguetes em um arco amplo, que caem aleatoriamente em uma área-alvo. Cada foguete causa dano em área [2M] e aplica um efeito de queimadura, Impedindo a cura recebida pelos inimigos atingidos.[1Turno].",
            custo_mana: 3000,
            custo_qi: 80,
            custo_qi_formatado: "80 Qi",
            cooldown: 2,
            nivel_desbloqueio: 7,
            passiva: false
        },
        {
            nome: "Espingarda da Aniquilação",
            classe: "Escopeta",
            categoria: "Inicial",
            tipo: "Mágica",
            descricao: "Tiro poderoso que atravessa inimigos.",
            descricao_completa: "O usuário canaliza por [1 turno] e dispara um tiro poderoso de espingarda que atravessa inimigos e estruturas [30% de Adicional], causando dano crescente com base na distância percorrida [5% a cada 1M]. Inimigos atingidos no final do alcance são empurrados para trás e ficam lentos [-10% de Agilidade].",
            custo_mana: 3500,
            custo_qi: 160,
            custo_qi_formatado: "160 Qi",
            cooldown: 4,
            nivel_desbloqueio: 9,
            passiva: false,
            alcance_maximo: "5M"
        },
        {
            nome: "Fúria do Canhão Duplo",
            classe: "Escopeta",
            categoria: "Inicial",
            tipo: "Mágica",
            descricao: "Fúria de 3 turnos com tiros explosivos.",
            descricao_completa: "O usuário entra em um estado de fúria por [3 Turnos], disparando tiros rápidos e explosivos de um canhão duplo. Cada tiro causa dano em área e reduz a armadura dos inimigos atingidos [30%]. No final da duração, o usuário dispara um último tiro poderoso que causa crítico em [100%].",
            custo_mana: 6000,
            custo_qi: 320,
            custo_qi_formatado: "320 Qi",
            cooldown: 5,
            nivel_desbloqueio: 11,
            passiva: false,
            alcance: "3M"
        }
    ]
};

module.exports = escopeta;