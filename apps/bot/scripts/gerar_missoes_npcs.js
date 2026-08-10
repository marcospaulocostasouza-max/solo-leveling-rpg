/**
 * GERADOR DE MISSÕES DOS NPCs
 * 
 * Cria arquivos JSON com as missões de cada NPC.
 * Cada NPC tem 10 missões:
 * - 4 missões de História Principal
 * - 2 missões de Loja
 * - 2 missões de Produção
 * - 2 missões de Caça
 * 
 * As missões são salvas em src/missions/data/<npc_id>.json
 * e registradas no banco de dados via missionManager.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "src", "npc", "data");
const MISSIONS_DIR = path.join(__dirname, "..", "src", "missions", "data");

// Criar pasta de missões se não existir
if (!fs.existsSync(MISSIONS_DIR)) {
    fs.mkdirSync(MISSIONS_DIR, { recursive: true });
}

// Listar todos os NPCs
const arquivos = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json"));
const npcs = [];
for (const arquivo of arquivos) {
    try {
        const dados = JSON.parse(fs.readFileSync(path.join(DATA_DIR, arquivo), "utf8"));
        if (dados.id && dados.id !== "ophilia" && dados.id !== "vysache") {
            npcs.push(dados);
        }
    } catch (e) {}
}

// Função para gerar missões de um NPC
function gerarMissoesNPC(npc) {
    const id = npc.id;
    const nome = npc.nome;
    const titulo = npc.titulo;
    const rank = npc.rank;
    const elemento = npc.elemento;
    const estiloLuta = npc.estilo_luta || "Combate Geral";
    const isVilao = (npc.papel || "").toLowerCase().includes("vil");
    const arma = npc.equipamentos?.arma || "Arma Padrão";
    
    // Extrair tipo de arma do estilo de luta
    let tipoArma = "Arma";
    if (estiloLuta.includes("Espadas")) tipoArma = "Espadas";
    else if (estiloLuta.includes("Adagas")) tipoArma = "Adagas";
    else if (estiloLuta.includes("Arcos")) tipoArma = "Arcos";
    else if (estiloLuta.includes("Machados")) tipoArma = "Machados";
    else if (estiloLuta.includes("Cajados")) tipoArma = "Cajados e Orbes";
    else if (estiloLuta.includes("Lanças")) tipoArma = "Lanças";
    else if (estiloLuta.includes("Martel")) tipoArma = "Martelos e Ferramentas Pesadas";
    else if (estiloLuta.includes("Desarmado")) tipoArma = "Combate Desarmado";
    else if (estiloLuta.includes("Leques")) tipoArma = "Leques e Lâminas Ocultas";
    else if (estiloLuta.includes("Bastões")) tipoArma = "Bastões e Correntes";
    else if (estiloLuta.includes("Armas Ocultas")) tipoArma = "Armas Ocultas (Bastão-Lâmina)";
    else if (estiloLuta.includes("Manipulação")) tipoArma = "Manipulação Orgânica";
    
    // Calcular recompensas baseadas no rank
    const multiplicadorRank = {
        "S": 1.5,
        "A": 1.0,
        "B": 0.8,
        "C": 0.6,
        "D": 0.4,
        "E": 0.2
    };
    const mult = multiplicadorRank[rank] || 1.0;
    
    // Monstros baseados no elemento
    const monstrosElemento = {
        "Luz": "Espíritos da Luz",
        "Raio": "Elementais de Raio",
        "Metal": "Autômatos de Metal",
        "Terra": "Golens de Pedra",
        "Escuridão": "Sombras Corrompidas",
        "Vento": "Espíritos do Vento",
        "Gelo": "Feras Geladas",
        "Planta": "Criaturas Vegetais",
        "Fogo": "Elementais de Fogo",
        "Água": "Criaturas Aquáticas",
        "Cristal": "Constructos de Cristal",
        "Sombra": "Sombras Rastejantes",
        "Madeira": "Guardiões de Madeira",
        "Tempestade": "Fúrias da Tempestade",
        "Lava": "Elementais de Lava",
        "Fumaça": "Espectros de Fumaça",
        "Areia": "Vermes das Dunas"
    };
    
    const monstro = monstrosElemento[elemento] || "Criaturas Corrompidas";
    
    // Quantidade de monstros baseada no rank
    const qtdNormal = rank === "S" ? 40 : rank === "A" ? 35 : rank === "B" ? 30 : 25;
    const qtdFortalecida = rank === "S" ? 9 : rank === "A" ? 8 : rank === "B" ? 7 : 6;
    
    // Itens de recompensa
    const itensEquipamento = npc.equipamentos?.itens || "Item Padrão";
    const primeiroItem = itensEquipamento.split(",")[0].trim();
    
    const missoes = [];
    
    if (isVilao) {
        // ===== MISSÕES DE VILÃO =====
        
        // Missão 1 - História Principal - Capítulo 1: Rumores
        missoes.push({
            id: `${id}_01`,
            npcId: id,
            numero: 1,
            nome: `Capítulo 1: Rumores sobre ${nome}`,
            descricao: `Relatos alarmantes começam a circular entre guildas sobre ${nome}. ${npc.historia?.substring(0, 200) || "Uma ameaça que precisa ser investigada."}...`,
            categoria: "principal",
            tipo: "historia",
            rank: rank,
            nivelMinimo: rank === "S" ? 80 : rank === "A" ? 60 : 40,
            objetivo: `Investigue 3 relatos de testemunhas sobre ${nome}`,
            recompensas: {
                xp: Math.floor(17100 * mult),
                won: Math.floor(114000 * mult),
                item: primeiroItem
            }
        });
        
        // Missão 2 - História Principal - Capítulo 2: Rastreando
        missoes.push({
            id: `${id}_02`,
            npcId: id,
            numero: 2,
            nome: `Capítulo 2: Rastreando ${titulo}`,
            descricao: `Reúna evidências concretas da atividade de ${nome} antes que a Associação classifique o caso como perdido.`,
            categoria: "principal",
            tipo: "historia",
            rank: rank,
            nivelMinimo: rank === "S" ? 80 : rank === "A" ? 60 : 40,
            objetivo: `Reúna provas em 2 locais diferentes ligados a ${nome}`,
            recompensas: {
                xp: Math.floor(19800 * mult),
                won: Math.floor(132000 * mult),
                item: primeiroItem
            }
        });
        
        // Missão 3 - História Principal - Capítulo 3: Confronto
        missoes.push({
            id: `${id}_03`,
            npcId: id,
            numero: 3,
            nome: `Capítulo 3: Confronto com ${nome}`,
            descricao: `É hora de enfrentar ${nome} diretamente. Prepare-se: como ${titulo}, este será um combate de Rank ${rank}.`,
            categoria: "principal",
            tipo: "historia",
            rank: rank,
            nivelMinimo: rank === "S" ? 80 : rank === "A" ? 60 : 40,
            objetivo: `Derrote ${nome} em combate direto`,
            recompensas: {
                xp: Math.floor(22500 * mult),
                won: Math.floor(150000 * mult),
                item: `Réplica Reforçada de: ${arma}`
            }
        });
        
        // Missão 4 - História Principal - Capítulo 4: A Queda
        missoes.push({
            id: `${id}_04`,
            npcId: id,
            numero: 4,
            nome: `Capítulo 4: A Queda de ${titulo}`,
            descricao: `Com ${nome} neutralizado(a), reste apenas reportar o caso à Associação e lidar com as consequências reveladas.`,
            categoria: "principal",
            tipo: "historia",
            rank: rank,
            nivelMinimo: rank === "S" ? 80 : rank === "A" ? 60 : 40,
            objetivo: `Entregue o relatório final sobre ${nome} à Associação`,
            recompensas: {
                xp: Math.floor(25200 * mult),
                won: Math.floor(168000 * mult),
                item: `Réplica Reforçada de: ${arma}`
            }
        });
    } else {
        // ===== MISSÕES DE HERÓI =====
        
        // Missão 1 - História Principal - Capítulo 1: O Despertar
        missoes.push({
            id: `${id}_01`,
            npcId: id,
            numero: 1,
            nome: `Capítulo 1: O Despertar de ${nome}`,
            descricao: `Acompanhe os primeiros passos de ${nome} como Caçador(a). ${npc.historia?.substring(0, 200) || "Uma jornada que está apenas começando."}...`,
            categoria: "principal",
            tipo: "historia",
            rank: rank,
            nivelMinimo: rank === "S" ? 80 : rank === "A" ? 60 : rank === "B" ? 40 : 20,
            objetivo: `Complete a introdução: converse com ${nome} e participe de sua primeira incursão`,
            recompensas: {
                xp: Math.floor(17100 * mult),
                won: Math.floor(114000 * mult),
                item: primeiroItem
            }
        });
        
        // Missão 2 - História Principal - Capítulo 2: A Trilha
        missoes.push({
            id: `${id}_02`,
            npcId: id,
            numero: 2,
            nome: `Capítulo 2: A Trilha de ${titulo}`,
            descricao: `${nome} pede ajuda para investigar pistas ligadas ao seu passado, aprofundando o mistério por trás de seu título de '${titulo}'.`,
            categoria: "principal",
            tipo: "historia",
            rank: rank,
            nivelMinimo: rank === "S" ? 80 : rank === "A" ? 60 : rank === "B" ? 40 : 20,
            objetivo: `Ajude ${nome} a reunir 3 pistas em diferentes localizações`,
            recompensas: {
                xp: Math.floor(19800 * mult),
                won: Math.floor(132000 * mult),
                item: itensEquipamento.split(",")[1]?.trim() || primeiroItem
            }
        });
        
        // Missão 3 - História Principal - Capítulo 3: O Confronto
        missoes.push({
            id: `${id}_03`,
            npcId: id,
            numero: 3,
            nome: `Capítulo 3: O Confronto de ${nome}`,
            descricao: `O passado de ${nome} finalmente alcança o presente. Enfrente ao lado dele(a) a ameaça central de sua história.`,
            categoria: "principal",
            tipo: "historia",
            rank: rank,
            nivelMinimo: rank === "S" ? 80 : rank === "A" ? 60 : rank === "B" ? 40 : 20,
            objetivo: `Vença o confronto decisivo ao lado de ${nome}`,
            recompensas: {
                xp: Math.floor(22500 * mult),
                won: Math.floor(150000 * mult),
                item: `Réplica Reforçada de: ${arma}`
            }
        });
        
        // Missão 4 - História Principal - Capítulo 4: Consagração
        missoes.push({
            id: `${id}_04`,
            npcId: id,
            numero: 4,
            nome: `Capítulo 4: ${titulo}`,
            descricao: `Com a ameaça derrotada, ${nome} consolida seu lugar no mundo dos caçadores, consagrando-se como ${titulo}.`,
            categoria: "principal",
            tipo: "historia",
            rank: rank,
            nivelMinimo: rank === "S" ? 80 : rank === "A" ? 60 : rank === "B" ? 40 : 20,
            objetivo: `Complete a missão final e testemunhe o desfecho da história de ${nome}`,
            recompensas: {
                xp: Math.floor(25200 * mult),
                won: Math.floor(168000 * mult),
                item: `Réplica Reforçada de: ${arma}`
            }
        });
    }
    
    // Missão 5 - Loja - Reforço
    missoes.push({
        id: `${id}_05`,
        npcId: id,
        numero: 5,
        nome: `Reforço de ${nome}`,
        descricao: `${nome} pede que você adquira, em qualquer Loja de Itens da Associação, um equipamento de Rank ${rank} compatível com ${tipoArma} para reforçar seu arsenal de combate.`,
        categoria: "secundaria",
        tipo: "loja",
        rank: rank,
        nivelMinimo: rank === "S" ? 80 : rank === "A" ? 60 : rank === "B" ? 40 : 20,
        objetivo: `Comprar 1 equipamento de Rank ${rank} (peça de armadura ou arma)`,
        recompensas: {
            xp: Math.floor(5400 * mult),
            won: Math.floor(36000 * mult),
            item: `Réplica Reforçada de: ${arma}`
        }
    });
    
    // Missão 6 - Loja - Provisões
    missoes.push({
        id: `${id}_06`,
        npcId: id,
        numero: 6,
        nome: `Provisões de ${nome}`,
        descricao: `Antes da próxima incursão, ${nome} pede que você compre poções de recuperação e um acessório de afinidade elemental ${elemento} na loja mais próxima.`,
        categoria: "secundaria",
        tipo: "loja",
        rank: rank,
        nivelMinimo: rank === "S" ? 80 : rank === "A" ? 60 : rank === "B" ? 40 : 20,
        objetivo: `Comprar 3 poções + 1 acessório elemental`,
        recompensas: {
            xp: Math.floor(4950 * mult),
            won: Math.floor(33000 * mult),
            item: itensEquipamento.split(",")[1]?.trim() || primeiroItem
        }
    });
    
    // Missão 7 - Produção - Receita
    missoes.push({
        id: `${id}_07`,
        npcId: id,
        numero: 7,
        nome: `Receita de ${nome}`,
        descricao: `Usando materiais coletados em dungeons de afinidade ${elemento}, produza o item indicado por ${nome} em uma bancada de criação da guilda.`,
        categoria: "secundaria",
        tipo: "producao",
        rank: rank,
        nivelMinimo: rank === "S" ? 80 : rank === "A" ? 60 : rank === "B" ? 40 : 20,
        objetivo: `Produzir 1 item de afinidade ${elemento} (Rank ${rank})`,
        recompensas: {
            xp: Math.floor(5850 * mult),
            won: Math.floor(39000 * mult),
            item: `Fragmento de Mana (${elemento})`
        }
    });
    
    // Missão 8 - Produção - Suprimento Especial
    missoes.push({
        id: `${id}_08`,
        npcId: id,
        numero: 8,
        nome: `Suprimento Especial de ${nome}`,
        descricao: `${nome} ensina uma técnica pessoal de preparo; produza 3 unidades de um item de suporte (poção, munição ou material) ligado ao estilo de combate de ${tipoArma}.`,
        categoria: "secundaria",
        tipo: "producao",
        rank: rank,
        nivelMinimo: rank === "S" ? 80 : rank === "A" ? 60 : rank === "B" ? 40 : 20,
        objetivo: `Produzir 3 itens de suporte`,
        recompensas: {
            xp: Math.floor(6300 * mult),
            won: Math.floor(42000 * mult),
            item: `Fragmento de Mana (${elemento})`
        }
    });
    
    // Missão 9 - Caça - Treino de Combate
    missoes.push({
        id: `${id}_09`,
        npcId: id,
        numero: 9,
        nome: `Treino de Combate com ${nome}`,
        descricao: `${nome} solicita ajuda para conter uma infestação: derrote ${monstro.toLowerCase()} em dungeons de Rank ${rank} ou inferior.`,
        categoria: "cacada",
        tipo: "caca",
        rank: rank,
        nivelMinimo: rank === "S" ? 80 : rank === "A" ? 60 : rank === "B" ? 40 : 20,
        objetivo: `Derrotar ${qtdNormal} ${monstro}`,
        recompensas: {
            xp: Math.floor(7200 * mult),
            won: Math.floor(48000 * mult),
            item: itensEquipamento.split(",")[0]?.trim() || primeiroItem
        }
    });
    
    // Missão 10 - Caça - Caçada Recomendada
    missoes.push({
        id: `${id}_10`,
        npcId: id,
        numero: 10,
        nome: `Caçada Recomendada por ${nome}`,
        descricao: `Uma variante mais forte de ${monstro.toLowerCase()} tem aparecido nas rondas de ${nome}; elimine essas ameaças antes que evoluam.`,
        categoria: "cacada",
        tipo: "caca",
        rank: rank,
        nivelMinimo: rank === "S" ? 80 : rank === "A" ? 60 : rank === "B" ? 40 : 20,
        objetivo: `Derrotar ${qtdFortalecida} ${monstro} (variante fortalecida)`,
        recompensas: {
            xp: Math.floor(9000 * mult),
            won: Math.floor(60000 * mult),
            item: `Réplica Reforçada de: ${arma}`
        }
    });
    
    return missoes;
}

// Gerar missões para todos os NPCs
let totalMissoes = 0;
let totalNPCs = 0;

for (const npc of npcs) {
    try {
        const missoes = gerarMissoesNPC(npc);
        const caminhoArquivo = path.join(MISSIONS_DIR, `${npc.id}.json`);
        fs.writeFileSync(caminhoArquivo, JSON.stringify({
            npcId: npc.id,
            npcNome: npc.nome,
            npcTitulo: npc.titulo,
            totalMissoes: missoes.length,
            missoes: missoes
        }, null, 2), "utf8");
        
        totalMissoes += missoes.length;
        totalNPCs++;
        console.log(`[OK] ${missoes.length} missões geradas para ${npc.nome} (${npc.id})`);
    } catch (err) {
        console.error(`[ERRO] Falha ao gerar missões para ${npc.nome}:`, err.message);
    }
}

console.log(`\n========================================`);
console.log(`Total de NPCs com missões: ${totalNPCs}`);
console.log(`Total de missões geradas: ${totalMissoes}`);
console.log(`========================================`);