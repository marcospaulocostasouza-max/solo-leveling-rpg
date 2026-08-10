/*
 * SCRIPT DE GERAÇÃO DA DATABASE DE DUNGEONS
 * 
 * Processa o texto do compêndio de masmorras e gera o arquivo dungeons.json.
 * A lista original está em masmorras.txt
 */

const fs = require("fs");
const path = require("path");

// Arquivo com as masmorras em texto
const arquivoTexto = path.join(__dirname, "..", "masmorras.txt");
// Arquivo de saída
const arquivoSaida = path.join(__dirname, "..", "src", "database", "dungeons.json");

// Premiações por rank
const PREMIACOES = {
    "E": { xp: 4000, won: 20000 },
    "D": { xp: 8000, won: 50000 },
    "C": { xp: 16000, won: 100000 },
    "B": { xp: 26000, won: 190000 },
    "A": { xp: 60000, won: 500000 },
    "S": { xp: 200000, won: 1000000 }
};

// Habilidades do compêndio
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

// Descriptions de monstros
const MONSTRO_DESCRICOES = {
    "Ser de aparência frágil": "Ser de aparência frágil, mas com movimentos imprevisíveis que dificultam a previsão de ataques. Utiliza o ambiente ao seu redor para emboscar caçadores desatentos.",
    "Massa semi-sólida": "Massa semi-sólida que se arrasta lentamente, mas compensa a lentidão com ataques de longo alcance capazes de atravessar obstáculos rasos.",
    "Criatura territorial": "Criatura territorial que emite um som contínuo de aviso antes de atacar, dando uma janela curta para que caçadores experientes reajam a tempo.",
    "Entidade que se camufla": "Entidade que se camufla no cenário, revelando-se apenas no momento do ataque, geralmente mirando o membro mais distante do grupo.",
    "Criatura de forma instável": "Criatura de forma instável, composta por energia elemental condensada que se dissipa e reagrupa constantemente. Ataca em rajadas curtas, priorizando alvos isolados e recuando após cada investida."
};

// Descrições de boss
const BOSS_DESCRICOES = {
    "Uma entidade de proporções imponentes": "Uma entidade de proporções imponentes, cujo corpo é moldado pela essência do domínio da masmorra. Movimenta-se com uma confiança predatória, testando o grupo antes de comprometer-se a um ataque direto.",
    "Guardião nomeado": "Guardião nomeado pelo próprio domínio, capaz de canalizar grandes quantidades de energia elemental em ataques de área devastadores.",
    "Manifestação corrompida": "Manifestação corrompida do elemento que governa a masmorra, com uma presença que distorce o ambiente ao redor conforme sua fúria aumenta.",
    "Criatura ancestral": "Criatura ancestral que parece ter aguardado séculos dentro daquele espaço. Seus movimentos são precisos e calculados, alternando entre investidas diretas e manobras evasivas."
};

function processar() {
    try {
        // Ler arquivo de texto
        const texto = fs.readFileSync(arquivoTexto, "utf8");
        console.log("Arquivo lido com sucesso: " + texto.length + " caracteres");
        
        // Dividir por MASMORRA
        const blocos = texto.split(/MASMORRA\s+(\d+)\s+—\s+/);
        console.log("Blocos encontrados: " + Math.floor(blocos.length / 2));
        
        const dungeons = [];
        
        for (let i = 1; i < blocos.length; i += 2) {
            const id = parseInt(blocos[i]);
            const conteudo = blocos[i + 1] || "";
            
            try {
                const dungeon = parseMasmorra(id, conteudo);
                dungeons.push(dungeon);
            } catch (e) {
                console.error("Erro ao processar masmorra " + id + ": " + e.message);
            }
        }
        
        console.log("Dungeons processadas: " + dungeons.length);
        
        // Salvar JSON
        fs.writeFileSync(arquivoSaida, JSON.stringify(dungeons, null, 2), "utf8");
        console.log("Arquivo " + arquivoSaida + " gerado com sucesso!");
        
    } catch (e) {
        console.error("Erro:", e.message);
    }
}

function parseMasmorra(id, conteudo) {
    const linhas = conteudo.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    
    // Nome
    let nome = "";
    for (const linha of linhas[0] ? [linhas[0]] : []) {
        if (linha && !linha.includes("Rank")) {
            nome = linha.replace(/\*/g, "").trim();
        }
    }
    
    // Rank, Tema, Elemento
    let rank = "", tema = "", elemento = "";
    const linhaRank = linhas.find(l => l.includes("Rank:") && l.includes("Tema:"));
    if (linhaRank) {
        const rankMatch = linhaRank.match(/Rank:\s*([A-Z])/);
        const temaMatch = linhaRank.match(/Tema:\s*([^|]+)/);
        const elementoMatch = linhaRank.match(/Elemento:\s*(.+)/);
        if (rankMatch) rank = rankMatch[1];
        if (temaMatch) tema = temaMatch[1].trim();
        if (elementoMatch) elemento = elementoMatch[1].trim();
    }
    
    // Entrada
    let entrada = "";
    const idxEntrada = linhas.findIndex(l => l === "Entrada");
    if (idxEntrada >= 0 && idxEntrada + 1 < linhas.length) {
        entrada = linhas[idxEntrada + 1];
    }
    
    // Monstro
    let monstroNome = "", monstroDescricao = "";
    const idxMonstro = linhas.findIndex(l => l.startsWith("Monstro"));
    if (idxMonstro >= 0) {
        monstroNome = linhas[idxMonstro].replace(/^Monstro\s*—\s*/, "").trim();
        if (idxMonstro + 1 < linhas.length) {
            monstroDescricao = linhas[idxMonstro + 1];
        }
    }
    
    // Boss
    let bossNome = "", bossDescricao = "", bossHabilidades = [];
    const idxBoss = linhas.findIndex(l => l.startsWith("Boss"));
    if (idxBoss >= 0) {
        bossNome = linhas[idxBoss].replace(/^Boss\s*—\s*/, "").trim();
        
        // Descrição do boss (próximas linhas até "Habilidades")
        let descricaoBoss = "";
        const idxHab = linhas.findIndex((l, i) => i > idxBoss && l === "Habilidades");
        if (idxHab > idxBoss) {
            descricaoBoss = linhas.slice(idxBoss + 1, idxHab).join(" ");
        }
        bossDescricao = descricaoBoss || "Uma entidade de proporções imponentes, cujo corpo é moldado pela essência do domínio da masmorra.";
        
        // Habilidades (após "Habilidades")
        if (idxHab >= 0) {
            for (let j = idxHab + 1; j < linhas.length; j++) {
                const linha = linhas[j];
                if (linha.startsWith("Recompensas")) break;
                if (linha.includes("—") || linha.includes("-")) {
                    bossHabilidades.push(linha.replace(/^•\s*/, ""));
                }
            }
        }
    }
    
    // Recompensas
    let itemMisterioso = false, dropTecnica = false;
    const linhaRecompensa = linhas.find(l => l.startsWith("Recompensas"));
    if (linhaRecompensa) {
        itemMisterioso = linhaRecompensa.includes("item misterioso") || linhaRecompensa.includes("Item Misterioso");
        dropTecnica = linhaRecompensa.includes("técnica") || linhaRecompensa.includes("tecnica");
    }
    
    const premios = PREMIACOES[rank] || PREMIACOES["E"];
    
    return {
        id: id,
        nome: nome,
        rank: rank,
        tema: tema,
        elemento: elemento,
        entrada: entrada,
        monstro: {
            nome: monstroNome,
            descricao: monstroDescricao
        },
        boss: {
            nome: bossNome,
            descricao: bossDescricao,
            habilidades: bossHabilidades
        },
        recompensas: {
            xp: premios.xp,
            won: premios.won,
            item_misterioso: itemMisterioso,
            drop_tecnica: dropTecnica
        }
    };
}

processar();