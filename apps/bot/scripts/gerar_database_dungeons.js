/*
 * GERADOR DE DATABASE DE DUNGEONS (700 masmorras)
 * 
 * Gera o arquivo dungeons.json com 700 masmorras distribuídas
 * pelos ranks E, D, C, B, A e S, usando os templates do compêndio.
 */

const fs = require("fs");
const path = require("path");

// =====================================
// TEMPLATES DO COMPÊNDIO
// =====================================

// Nomes de masmorras (prefixos)
const PREFIXOS = [
    "Vertentes", "Cristas", "Torres", "Ruínas", "Grutas", "Fortalezas", 
    "Cavernas", "Colunas", "Arenas", "Espirais", "Catacumbas", "Vielas",
    "Necrópoles", "Cidadelas", "Fendas", "Galerias", "Câmaras", "Cavidades",
    "Cristais", "Túneis", "Santuários", "Abismos", "Salões", "Passagens"
];

// Sufixos de masmorras
const SUFIXOS = [
    "do Trovão", "das Chamas", "do Vento", "da Alma Presa", "Sagradas",
    "da Cinza", "do Caos", "Rachadas", "Profundas da Maré", "do Gelo Eterno",
    "Silenciosas", "da Areia", "da Alma", "das Sombras", "dos Ecos",
    "Ardentes", "do Cristal Negro", "Ocultas", "Perdidas", "da Neblina",
    "Gélidas", "Esquecidas", "Incandescentes", "Sombrias", "do Abismo",
    "Sussurrantes", "da Luz Perdida", "Eternas", "da Tempestade",
    "Uivantes", "Corrompidas", "Cintilantes", "Devastadas", "do Silêncio",
    "Ancestrais", "da Maré", "Suspensas", "da Cinza", "do Eco",
    "da Cinza Eterna", "das Raízes", "do Trovão", "Congeladas",
    "da Escuridão", "do Vazio", "Esquecidas do Tempo"
];

// Temas por rank
const TEMAS_RANK = {
    "E": ["Deserto", "Montanha", "Caverna", "Cristal", "Magma", "Terra", "Jogos"],
    "D": ["Gelo", "Água", "Cristal", "Deserto", "Magma", "Montanha", "Neve", "Vento"],
    "C": ["Fogo", "Floresta", "Planta", "Caverna", "Neve", "Luz", "Raio", "Alma"],
    "B": ["Luz", "Sombria", "Magma", "Floresta", "Jogos", "Água", "Vento", "Cristal"],
    "A": ["Deserto", "Montanha", "Vento", "Terra", "Neve", "Cristal", "Água", "Caverna"],
    "S": ["Justiça", "Jogos", "Cristal", "Sombria", "Vento", "Fogo", "Raio", "Planta"]
};

// Elementos por rank
const ELEMENTOS_RANK = {
    "E": ["Terra", "Fogo", "Água", "Ar", "Caos"],
    "D": ["Água", "Terra", "Fogo", "Ar", "Sombra"],
    "C": ["Fogo", "Natureza", "Água", "Luz", "Eletricidade"],
    "B": ["Luz", "Sombra", "Fogo", "Natureza", "Caos", "Ar"],
    "A": ["Terra", "Vento", "Água", "Eletricidade", "Caos"],
    "S": ["Luz", "Sombra", "Sagrado", "Espiritual", "Caos", "Ar"]
};

// Monstros por tipo de descrição
const MONSTROS = {
    "E": ["Sentinela de Cristal", "Espinho Vivo", "Cinzalma", "Marionete de Osso", "Vulto Silencioso", "Eco Uivante"],
    "D": ["Lâmina de Gelo", "Sombra Errante", "Cinza Ambulante", "Ciclonefugo", "Devorador de Luz", "Pústula Rastejante"],
    "C": ["Chama Cativa", "Raiz Rasgada", "Cravo de Trovão", "Larva de Magma", "Guardião de Musgo", "Fragmento Voraz"],
    "B": ["Serpente de Areia", "Espectro de Névoa", "Espinho Vivo", "Vulto Silencioso", "Cinzalma", "Sombra Errante"],
    "A": ["Cinzalma", "Ciclonefugo", "Lâmina de Gelo", "Fragmento Voraz", "Sentinela de Cristal", "Eco Uivante"],
    "S": ["Anemovórtice", "Corruptrix", "Cristalhonna", "Terrafólego", "Gelidrak", "Piraxion"]
};

// Descrições de monstro
const MONSTRO_DESCRICOES = {
    "Ser de aparência frágil": "Ser de aparência frágil, mas com movimentos imprevisíveis que dificultam a previsão de ataques. Utiliza o ambiente ao seu redor para emboscar caçadores desatentos.",
    "Massa semi-sólida": "Massa semi-sólida que se arrasta lentamente, mas compensa a lentidão com ataques de longo alcance capazes de atravessar obstáculos rasos.",
    "Criatura territorial": "Criatura territorial que emite um som contínuo de aviso antes de atacar, dando uma janela curta para que caçadores experientes reajam a tempo.",
    "Entidade que se camufla": "Entidade que se camufla no cenário, revelando-se apenas no momento do ataque, geralmente mirando o membro mais distante do grupo.",
    "Criatura de forma instável": "Criatura de forma instável, composta por energia elemental condensada que se dissipa e reagrupa constantemente. Ataca em rajadas curtas, priorizando alvos isolados e recuando após cada investida."
};

const MONSTRO_TIPOS = Object.keys(MONSTRO_DESCRICOES);

// Bosses por rank
const BOSSES = {
    "E": ["Cinzaroth", "Fulgurhax", "Glacielle", "Sombraxis", "Piraxion", "Ventrasca"],
    "D": ["Chamavorax", "Gelidrak", "Umbraliche", "Cristalhonna", "Espinhaxor", "Radianthys"],
    "C": ["Syvarhoot", "Trovonaxx", "Magmagoth", "Necrovyn", "Terrafólego", "Areiathan"],
    "B": ["Corruptrix", "Cinzaroth", "Ventrasca", "Sombraxis", "Anemovórtice", "Gelidrak"],
    "A": ["Sylvarhoot", "Chamavorax", "Radianthys", "Escuridão", "Cristalhonna", "Espinhaxor"],
    "S": ["Corruptrix", "Sombraxis", "Necrovyn", "Anemovórtice", "Gelidrak", "Piraxion"]
};

// Descrições de boss
const BOSS_DESCRICOES = {
    "Uma entidade de proporções imponentes": "Uma entidade de proporções imponentes, cujo corpo é moldado pela essência do domínio da masmorra. Movimenta-se com uma confiança predatória, testando o grupo antes de comprometer-se a um ataque direto.",
    "Guardião nomeado": "Guardião nomeado pelo próprio domínio, capaz de canalizar grandes quantidades de energia elemental em ataques de área devastadores.",
    "Manifestação corrompida": "Manifestação corrompida do elemento que governa a masmorra, com uma presença que distorce o ambiente ao redor conforme sua fúria aumenta.",
    "Criatura ancestral": "Criatura ancestral que parece ter aguardado séculos dentro daquele espaço. Seus movimentos são precisos e calculados, alternando entre investidas diretas e manobras evasivas."
};

const BOSS_TIPOS = Object.keys(BOSS_DESCRICOES);

// Habilidades
const HABILIDADES = [
    "Colapso Dirigido — concentra energia em um ponto único do campo de batalha, criando uma explosão atrasada que força reposicionamento.",
    "Chamado do Vazio — invoca fragmentos menores do próprio corpo para auxiliar em combate por um curto período.",
    "Fúria Contida — ao atingir metade da vida, entra em um estado de fúria que aumenta a velocidade dos ataques por tempo limitado.",
    "Investida Elemental — avança em linha reta canalizando energia do domínio, causando dano de impacto e derrubando quem estiver no caminho.",
    "Ruptura de Área — libera uma onda de energia concentrada ao redor do próprio corpo, empurrando e atordoando alvos próximos.",
    "Marca do Domínio — aplica uma marca temporária no alvo que amplifica o dano recebido de ataques subsequentes do chefe.",
    "Barreira Instável — gera um escudo temporário que reduz drasticamente o dano recebido, quebrável apenas por ataques concentrados.",
    "Golpe Final — usado apenas quando a vida está criticamente baixa, um ataque de altíssimo dano em uma única direção."
];

// Entradas (portais)
const ENTRADAS = [
    "Um portal {COR} surge repentinamente em {LOCAL}, iluminando a área no exato instante em que a chave aparece no inventário do caçador. A passagem conduz a {AMBIENTE}.",
    "Sem aviso, o céu sobre {LOCAL} se distorce e um portal {COR} se forma, sugando o ar ao redor. Do outro lado, {AMBIENTE2}.",
    "A chave vibra no inventário do caçador momentos antes de um rasgo no ar se abrir perto de {LOCAL}. Ao atravessá-lo, o grupo encontra {AMBIENTE2}."
];

const CORES = ["esverdeado", "violeta", "vermelho", "azul", "dourado", "cinza-esfumaçado"];
const LOCAIS = [
    "um bairro abandonado da cidade", "as ruínas de um templo antigo", 
    "um túnel subterrâneo interditado", "as margens de um rio esquecido",
    "o topo de um prédio comercial", "um estacionamento vazio à noite",
    "as bordas de uma floresta urbana", "um distrito movimentado de Seul",
    "uma estação de trem desativada", "um parque isolado nos arredores",
    "uma área industrial desativada", "os arredores de uma vila remota"
];
const AMBIENTES = [
    "salões submersos parcialmente, com água gelada até os joelhos e reflexos distorcidos dançando nas paredes",
    "uma vasta caverna cujas paredes pulsam com veios luminosos, enquanto ecos distantes sugerem movimento nas sombras",
    "um labirinto de colunas desgastadas, cobertas por musgo e símbolos que brilham fracamente sob a luz filtrada",
    "corredores de pedra ancestral marcados por rachaduras profundas, de onde escapam correntes incessantes de energia elemental",
    "um vale estreito cercado por rochedos afiados, açoitado por rajadas que carregam um cheiro metálico no ar",
    "uma planície fechada por muralhas naturais, onde o solo range a cada passo como se estivesse vivo"
];

// Premiações por rank
const PREMIACOES = {
    "E": { xp: 4000, won: 20000 },
    "D": { xp: 8000, won: 50000 },
    "C": { xp: 16000, won: 100000 },
    "B": { xp: 26000, won: 190000 },
    "A": { xp: 60000, won: 500000 },
    "S": { xp: 200000, won: 1000000 }
};

// =====================================
// GERADOR
// =====================================

function gerarDungeons() {
    const dungeons = [];
    const ranks = ["E", "D", "C", "B", "A", "S"];
    
    // Distribuição: ~116-117 por rank para totalizar 700
    const contagem = { E: 117, D: 117, C: 117, B: 117, A: 116, S: 116 };
    
    let id = 1;
    
    ranks.forEach(rank => {
        const rankAtual = rank;
        const temasLista = TEMAS_RANK[rankAtual];
        const elementosLista = ELEMENTOS_RANK[rankAtual];
        const monstrosLista = MONSTROS[rankAtual];
        const bossesLista = BOSSES[rankAtual];
        
        for (let i = 0; i < contagem[rankAtual]; i++) {
            // Nome
            const prefixo = PREFIXOS[Math.floor(Math.random() * PREFIXOS.length)];
            const sufixo = SUFIXOS[Math.floor(Math.random() * SUFIXOS.length)];
            const nome = prefixo + " " + sufixo;
            
            // Tema e elemento
            const tema = temasLista[Math.floor(Math.random() * temasLista.length)];
            const elemento = elementosLista[Math.floor(Math.random() * elementosLista.length)];
            
            // Entrada
            const entradaTemplate = ENTRADAS[Math.floor(Math.random() * ENTRADAS.length)];
            const cor = CORES[Math.floor(Math.random() * CORES.length)];
            const local = LOCAIS[Math.floor(Math.random() * LOCAIS.length)];
            const ambiente = AMBIENTES[Math.floor(Math.random() * AMBIENTES.length)];
            const ambiente2 = AMBIENTES[Math.floor(Math.random() * AMBIENTES.length)].charAt(0).toUpperCase() + AMBIENTES[Math.floor(Math.random() * AMBIENTES.length)].slice(1);
            
            let entrada = entradaTemplate
                .replace("{COR}", cor)
                .replace("{LOCAL}", local)
                .replace("{AMBIENTE}", ambiente)
                .replace("{AMBIENTE2}", ambiente2);
            
            // Monstro
            const tipoMonstro = MONSTRO_TIPOS[Math.floor(Math.random() * MONSTRO_TIPOS.length)];
            const monstroNome = monstrosLista[Math.floor(Math.random() * monstrosLista.length)];
            
            // Boss
            const tipoBoss = BOSS_TIPOS[Math.floor(Math.random() * BOSS_TIPOS.length)];
            const bossNome = bossesLista[Math.floor(Math.random() * bossesLista.length)];
            
            // Habilidades (3 aleatórias)
            const habilidades = [...HABILIDADES].sort(() => Math.random() - 0.5).slice(0, 3);
            
            // Recompensas
            const premiacaoBase = PREMIACOES[rankAtual];
            const itemMisterioso = Math.random() < 0.3;
            const dropTecnica = Math.random() < 0.25;
            
            const dungeon = {
                id: id,
                nome: nome,
                rank: rankAtual,
                tema: tema,
                elemento: elemento,
                entrada: entrada,
                monstro: {
                    nome: monstroNome,
                    descricao: MONSTRO_DESCRICOES[tipoMonstro]
                },
                boss: {
                    nome: bossNome,
                    descricao: BOSS_DESCRICOES[tipoBoss],
                    habilidades: habilidades
                },
                recompensas: {
                    xp: premiacaoBase.xp,
                    won: premiacaoBase.won,
                    item_misterioso: itemMisterioso,
                    drop_tecnica: dropTecnica
                }
            };
            
            dungeons.push(dungeon);
            id++;
        }
    });
    
    return dungeons;
}

// =====================================
// PRINCIPAL
// =====================================

const dungeons = gerarDungeons();
const arquivoSaida = path.join(__dirname, "..", "src", "database", "dungeons.json");

fs.writeFileSync(arquivoSaida, JSON.stringify(dungeons, null, 2), "utf8");

// Verificar contagem
const contagem = { E: 0, D: 0, C: 0, B: 0, A: 0, S: 0 };
dungeons.forEach(d => contagem[d.rank]++);

console.log("=== DATABASE DE DUNGEONS GERADA ===");
console.log("Total de dungeons: " + dungeons.length);
console.log("Distribuição por rank:");
Object.entries(contagem).forEach(([rank, total]) => {
    console.log("  Rank " + rank + ": " + total + " dungeons");
});
console.log("Arquivo salvo em: " + arquivoSaida);