/*
 * GERADOR DE DATABASE DE DROPS DE DUNGEONS
 * 
 * Gera o arquivo dungeon_drops.json com os itens de cada dungeon.
 * Cada dungeon tem 2-3 itens disponíveis para o prêmio "Item Misterioso".
 */

const fs = require("fs");
const path = require("path");

// Carregar database de dungeons
const dungeons = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src", "database", "dungeons.json"), "utf8"));

// Epítetos por tema/elemento
const EPITETOS = [
    "Colapso Telúrico", "Falha Primordial", "Muralha Esquecida", "Fratura do Caos",
    "Labareda Sagrada", "Granito Selado", "Vazio Sombrio", "Sopro dos Mortos",
    "Sussurro dos Ventos", "Onda Silenciosa", "Farol Celeste", "Fagulha Imortal",
    "Facho Divino", "Brilho Sagrado", "Cinzas do Vulcão", "Raiz Selvagem",
    "Seiva Viva", "Copa Ancestral", "Floresta Sussurrante", "Musgo Sagrado",
    "Broto Eterno", "Vinha Rastejante", "Sussurro Verde", "Poeira do Tempo",
    "Pedra Rachada", "Núcleo Rochoso", "Raiz Ancestral", "Colapso Dimensional",
    "Cisão Absoluta", "Ruído Primordial", "Anomalia Selvagem", "Delírio Sombrio",
    "Distorção Rastejante", "Vórtice Instável", "Eclipse Silencioso", "Penumbra Selada",
    "Manto das Trevas", "Noite Eterna", "Breu Ancestral", "Sombra da Memória",
    "Eco Espectral", "Alma Vagante", "Elo Perdido", "Presença Silenciosa",
    "Véu Espiritual", "Sopro do Vendaval", "Brisa Cortante", "Correnteza Aérea",
    "Rajada Eterna", "Céu Rasgado", "Vento Fantasma", "Turbilhão Sereno",
    "Abismo Azul", "Maré Sussurrante", "Lágrima do Oceano", "Véu das Profundezas",
    "Corrente Selada", "Orvalho Eterno", "Redemoinho Ancestral",
    "Chama Vingativa", "Brasa Eterna", "Fornalha Ancestral", "Incêndio Selado",
    "Fogo Fátuo", "Labareda Sagrada", "Centelha Viva", "Tempestade Elétrica",
    "Relâmpago Cativo", "Descarga Ancestral", "Trovão Selado", "Corrente Fulminante",
    "Arco Voltaico", "Fúria do Raio", "Aurora Eterna", "Luz Inextinguível",
    "Alvorada Radiante", "Clarão Ancestral", "Resplendor Puro", "Facho Divino",
    "Farol Celeste", "Brilho Sagrado", "Chama Consagrada", "Bênção Ancestral",
    "Graça Eterna", "Juramento Puro", "Relíquia Divina", "Selo Celestial",
    "Altar Esquecido", "Voto Sagrado", "Abismo Negro"
];

// Tipos de item por categoria
const TIPOS_ITEM = {
    "Arma 1-FP": ["Faca de Combate", "Kunai", "Balisong", "Tanto", "Katar", "Ninja-to", "Shuriken", "Faca Borboleta", "Canivete", "Navalha", "Sai", "Chakram", "Gladius", "Sansetsuki", "Nunchacu", "Tonfa", "Soqueiras", "Bagh Nakh", "Neko-te", "Kris", "Machete", "Cutelo", "Khopesh", "Cimitarra", "Sabre", "Rapieira", "Alfange", "Wakizashi", "Pistola", "Magnum", "Mini-Metralhadora", "Escopeta", "Fuzil de Assalto", "Fuzil de Precisão", "Arco Recurvo", "Arco Simples", "Arco Longo", "Arco Composto", "Chicote", "Correntes de Combate", "Manopla", "Luvas de Combate", "Soqueiras", "Leque de Combate", "Punhos Metálicos", "Garras Retráteis", "Corrente de Combate"],
    "Arma 2-FP": ["Odachi", "Nodachi", "Montante", "Alabarda", "Gadanha", "Foice Curta", "Foice Longa", "Foice de Mão", "Kama", "Kusarigama", "Naginata", "Yari", "Trident", "Hamberge", "Bardiche", "Zambaton", "Machado de Guerra", "Machado Bárbaro", "Machado Longo", "Maça de Bicos", "Maça de Esferas", "Clava", "Kanabo", "Tessen", "Facha", "Lança montada", "Javelin", "Ranseur", "Glaive", "Khopesh", "Tessen", "Shuriken Gigante", "Arco Recurvo", "Arco Longo", "Arco Composto", "Grimório", "Orb", "Cajado", "Bastão Curto", "Florete", "Rapieira", "Longsword"],
    "Armadura": ["Couraça Pesada", "Couraça Leve", "Couraça Articulada", "Couraça Segmentada", "Blindagem Torácica", "Plastrão", "Peitoral", "Cota de Malha", "Gambesão", "Túnica de Batalha", "Túnica de Viagem", "Vestimenta de Guerra", "Vestimenta de Patrulha", "Vestimenta de Expedição", "Vestimenta de Elite", "Vestimenta Tática", "Vestimenta Ritual", "Vestimenta Nobre", "Vestimenta Adaptativa", "Vestimenta Reforçada", "Vestimenta Leve", "Traje Tático", "Traje Cerimonial", "Traje Espacial", "Traje de Exploração", "Macacão Tático", "Macacão Inferior", "Uniforme Médico", "Uniforme Militico", "Uniforme Operacional", "Uniforme Cerimonial", "Uniforme Escolar", "Roupa de Sacerdote", "Roupa de Monge", "Roupa de Mago", "Roupa de Mercenário", "Roupa de Caçador", "Roupa de Sobrevivência", "Roupa Anticorrosiva", "Roupa Antichamas", "Roupa Térmica", "Roupa de Ferreiro", "Casaco", "Casaco Acolchoado", "Sobretudo", "Sobretudo Longo", "Sobretudo Curto", "Capa Longa", "Capa Curta", "Capa de Viagem", "Manto", "Manto Sacerdotal", "Manto Real", "Manto de Comando", "Manto Imperial", "Poncho", "Fraque", "Blazer", "Paletó", "Moletom", "Camiseta", "Regata", "Camisa", "Casaco de Pele", "Kimono", "Yukata", "Hanbok", "Hanfu", "Cheongsam", "Toga", "Toga Cerimonial", "Hábito", "Hakama", "Hakama Superior", "Hakama de Combate", "Saia Longa", "Saia Curta", "Saia Plissada", "Saia Blindada", "Saiote", "Saiote Tático", "Kilt", "Calças Blindadas", "Calças de Combate", "Calças de Couro", "Calças de Malha", "Calças Casuais", "Calça Cargo", "Calça Larga", "Saruel", "Grevas", "Grevas Articuladas", "Grevas Metálicas", "Grevas Blindadas"],
    "Acessório": ["Brinco", "Brinco Duplo", "Brinco de Argola", "Brinco de Cristal", "Anel", "Anel Duplo", "Anel de Sinete", "Anel de Polegar", "Pulseira", "Pulseira de Cristal", "Pulseira de Corrente", "Pulseira de Contas", "Pulseira Metálica", "Colar", "Pingente", "Pingente de Cristal", "Pingente de Osso", "Pingente de Pedra", "Pingente de Madeira", "Pingente de Metal", "Pingente de Relógio", "Pingente de testa", "Medalhão", "Medalhão de Comando", "Medalha", "Medalha da", "Emblema", "Emblema frontal", "Emblema de Manga", "Emblema de Caçador", "Emblema de Braço", "Insígnia", "Insígnia Militar", "Insígnia Real", "Insígnia de Classe", "Insígnia de Caçador", "Broche", "Alfinete", "Distintivo", "Selo", "Selo de Controle", "Selo frontal", "Selo de Invocação", "Talismã", "Amuleto", "Amuleto de Viagem", "Relicário", "Totem", "Ídolo", "Gema", "Rubi", "Safira", "Esmeralda", "Diamante", "Pérola", "Cristal", "Cristal Elemental", "Cristal de Mana", "Cristal de Rastreamento", "Cristal de Comunicação", "Fragmento Mágico", "Fragmento Dimensional", "Fragmento Espiritual", "Fragmento de Portal", "Pedra", "Pedra Filosofal", "Orbe", "Orbe Flutuante", "Esfera", "Esfera de Captura", "Cápsula", "Cápsula de Contenção", "Relógio", "Relógio de Bolso", "Bússola", "Bússola Mágica", "Bússola de Dungeon", "Detector", "Detector de Tesouro", "Detector de Armadilha", "Detector de Portais", "Detector de Monstros", "Scanner", "Scanner ocular", "Lentes inteligentes", "Visor", "Visor holográfico", "Visor espiritual", "Visor noturno", "Visor térmico", "Goggles", "Monóculo", "Monóculo tecnológico", "Headphone", "Headset tático", "Antenas", "Coroa", "Coroa mecânica", "Coroa de espinhos", "Tiara", "Circlete", "Faixa", "Faixa de Coxa", "Faixa de Perna", "Faixa de Pescoço", "Faixa de Cintura", "Faixa de Quadril", "Faixa de Braço", "Braçal", "Braçal Cerimonial", "Braçal de Comando", "Cinto", "Cinto de Munição", "Cinto de Utilidades", "Cinto de Acessório", "Cinto de Coxa", "Cinto de Ferramentas", "Cinto de Escalada", "Cinto Ornamental", "Bandoleira", "Harness", "Arnês", "Arnês Tático", "Arnês de Perna", "Arnês de Quadril", "Arnês de Coxa", "Suspensório", "Suspensório Tático", "Suspensório de Coxa"],
    "Botas": ["Botas", "Botas de Segurança", "Botas de Neve", "Botas de Chuva", "Botas de Caminhada", "Botas de Piloto", "Botas de Escalada", "Botas de Mergulho", "Botas Modulares", "Botas Magnéticas", "Botas Mecânicas", "Botas Propulsoras", "Botas Táticas", "Botas Blindadas", "Botas Leves", "Galochas", "Coturnos", "Coturnos Militares", "Coturnos Blindados", "Sapatos", "Sapatos Sociais", "Sapatos Reforçados", "Sapatos de Couro", "Sapatos Táticos", "Sapatos Cerimoniais", "Sapatos Formais", "Sandálias", "Sandálias de Monge", "Sandálias de Viagem", "Sandálias de Combate", "Sandálias de Guerreiro", "Tamancos", "Loafers", "Alpargatas", "Sapatilhas", "Sapatilhas de Combate", "Sapatilhas de Movimento", "Patins", "Patins Mecânicos", "Pés Biônicos", "Pés Mecânicos", "Unidades de Movimento", "Chinelos", "Meias", "Meias Táticas", "Meias de Compressão", "Tornozeleiras", "Tornozeleiras Reforçadas", "Tornozeleiras de Combate", "Tornozeleiras Táticas", "Tornozeleira", "Tornozeleira de Corrente", "Faixas de Tornozelo", "Faixas de Pé", "Palmilhas", "Palmilhas de Movimento", "Palmilhas Reforçadas", "Protetores de Calcanhar", "Protetores de Joelho", "Reforço de Joelho", "Reforço de Quadril", "Reforço de Coxa", "Manga de Perna", "Estribo de Perna", "Prótese de Perna", "Próteses de Pé", "Próteses de Braço", "Prótese de Coxa", "Prótese de Braço", "Estrutura de Perna", "Estrutura de Quadril", "Blindagem de Perna", "Blindagem de Coxa", "Blindagem de Quadril", "Cobertura de Coxa", "Cobertura de Antebraço", "Manga Tática", "Faixas de Pé", "Galochas"],
    "Capacete": ["Capacete", "Capacete aberto", "Capacete integral", "Capacete tático", "Capacete ritualístico", "Capacete ceremonial", "Capacete de piloto", "Capacete de construção", "Capacete espacial", "Capacete tribal", "Coroa", "Coroa mecânica", "Coroa de espinhos", "Tiara", "Circlete", "Faixa", "Cocar", "Kufi", "Keffiyeh", "Turbante", "Boné", "Cartola", "Solidéu", "Gorro", "Capelo", "Máscara", "Máscara facial", "Máscara respiratória", "Máscara Pequena", "Protetor facial", "Véu facial", "Tapa-olho", "Abafador", "Headphone", "Headset tático", "Antenas", "Scanner ocular", "Visor", "Visor holográfico", "Visor espiritual", "Visor noturno", "Visor térmico", "Goggles", "Monóculo", "Monóculo tecnológico", "Protetor de testa", "Adorno de testa", "Adorno cerimonial", "Chifres ornamentais", "Chifres artificiais", "Penacho", "Ornamento craniano", "Corrente craniana", "Exoesqueleto craniano", "Blindagem de Cotovelo", "Blindagem de Coxa", "Blindagem de Perna", "Blindagem Torácica", "Blindagem de Quadril", "Placa frontal", "Placas de Quadril", "Placa de Braço", "Placa de Clã", "Placa de Identificação", "Placa Militar", "Placas Peitorais", "Peitoral", "Unidade Torácica", "Exoperna", "Exoluva", "Exoesqueleto Completo", "Exoesqueleto Parcial", "Carapaça", "Carapaça Biológica", "Casulo", "Cápsula de Contenção"],
    "Consumível": ["Mochila de Campanha", "Bolsa de Mineração", "Bolsa de Componentes", "Bolsa de Poções", "Bolsa de Ervas", "Bolsa de Caça", "Bolsa de Relíquias", "Bolsa de Ingredientes", "Bolsa de Pesca", "Bolsa Dimensional", "Bolsa Sem Fundo", "Cofre Portátil", "Cofre Dimensional", "Caixa Blindada", "Caixa Modular", "Caixa de Ingredientes", "Compartimento Oculto", "Compartimento Secreto", "Contêiner", "Recipiente", "Cápsula de Contenção", "Frasco de Captura", "Esfera de Captura", "Prisão Portátil", "Jaula Portátil", "Algemas", "Tenda", "Barraca", "Barraca Camuflada", "Colchonete", "Saco de Dormir", "Cama Portátil", "Manta Térmica", "Cobertor", "Kit de Emergência", "Kit de Alquimia", "Kit de Investigação", "Kit de Rastreamento", "Kit de Navegação", "Kit de Explorador", "Estojo de Ferramentas", "Estojo Médico", "Estojo Modular", "Estojo Mágico", "Mochila de Alpinista", "Mochila de Explorador", "Mochila Militar", "Bandoleira", "Cinto de Munição", "Cinto de Ferramentas", "Mapa Revelado", "Bússola Mágica", "Bússola de Dungeon", "Detector de Tesouro", "Detector de Armadilha", "Detector de Portais", "Detector de Monstros", "Sensor de Energia", "Sensor de Movimento", "Sensor de Presença", "Scanner de Cristal", "Lanterna", "Lanterna Pequena", "Lanterna Infinita", "Tocha", "Forno Pequeno", "Caldeirão", "Destilador", "Filtro Alquímico", "Antídoto", "Erva Medicinal", "Pergaminho Selado", "Pergaminho de Fuga", "Chave Antiga", "Chave Mágica", "Chave Dimensional", "Chave de Atalho", "Âncora Dimensional", "Passe Dimensional", "Cristal de Retorno", "Sinalizador", "Sinalizador Luminoso", "Flare", "Familiar Artificial", "Companheiro Mecânico", "Miniatura", "Mascote Pequeno", "Diário de Aventura", "Carta Mágica", "Ampulheta", "Relógio de Bolso", "Caneta", "Tinta Especial", "Pena de Escrita", "Lápis Mágico", "Frasco Alquímico", "Injetor", "Seringa", "Agulha Médica", "Colher de Mistura", "Almofariz", "Pá", "Escova de Escavação", "Picareta", "Grampo", "Grampos", "Pérola", "Joia", "Adorno", "Adorno de cabelo", "Fivela de cabelo", "Prendedor de cabelo", "Laço", "Guirlanda", "Enfeite", "Enfeite floral", "Enfeite metálico", "Enfeite ósseo", "Brasão", "Símbolo", "Relicário", "Totem", "Ídolo", "Estatueta", "Moeda", "Moeda da", "Fragmento", "Fragmento Mágico", "Fragmento Dimensional", "Fragmento Espiritual", "Fragmento de Portal", "Pedra", "Pedra Filosofal", "Orbe", "Orbe Flutuante", "Esfera", "Esfera de Captura", "Cápsula", "Cápsula de Contenção"]
};

// Atributos por rank (valores base)
const ATRIBUTOS_RANK = {
    "E": { min: 9, max: 25 },
    "D": { min: 18, max: 50 },
    "C": { min: 30, max: 85 },
    "B": { min: 45, max: 120 },
    "A": { min: 60, max: 175 },
    "S": { min: 90, max: 210 }
};

// Preços por rank
const PRECOS_RANK = {
    "E": { min: 100000, max: 300000 },
    "D": { min: 280000, max: 580000 },
    "C": { min: 500000, max: 980000 },
    "B": { min: 800000, max: 1560000 },
    "A": { min: 1400000, max: 2600000 },
    "S": { min: 2200000, max: 4550000 }
};

// Nomes de atributos
const NOMES_ATRIBUTOS = ["Força", "Resistência", "Agilidade", "Sentidos", "Inteligência", "Poder Mágico"];

// Descrições de origem
const DESCRICOES_ORIGEM = [
    "Peça recuperada em {DUNGEON}, ainda impregnada da energia do {EPITETO}.",
    "Popular entre aventureiros que enfrentaram {DUNGEON} e sobreviveram à fúria do {EPITETO}.",
    "Encontrado junto aos restos de um caçador que não sobreviveu à investida do {EPITETO}, em {DUNGEON}.",
    "Fragmento arrancado do coração de {DUNGEON}, onde a energia do {EPITETO} ainda ressoa.",
    "Carrega consigo o eco do {EPITETO}, vestígio das profundezas de {DUNGEON}.",
    "Testemunho silencioso das provações em {DUNGEON}, sob a marca do {EPITETO}.",
    "Item recuperado após o colapso de {DUNGEON}, ainda pulsando com a força do {EPITETO}.",
    "Relíquia forjada nas profundezas de {DUNGEON}, moldada pelo poder do {EPITETO}.",
    "Sua superfície guarda marcas antigas do {EPITETO}, seladas nas câmaras de {DUNGEON}.",
    "Vestígio raro de {DUNGEON}, impregnado pelo mistério do {EPITETO}.",
    "Dizem que foi usado por um sobrevivente do assalto a {DUNGEON}, marcado pela essência do {EPITETO}.",
    "Um artefato que reagiu de forma inesperada ao ser tocado, impregnado pela presença do {EPITETO} em {DUNGEON}."
];

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function gerarDrops() {
    const drops = {};
    
    dungeons.forEach(dungeon => {
        const epíteto = randomChoice(EPITETOS);
        const numItens = randomInt(2, 3);
        const itensDungeon = [];
        
        // Categorias disponíveis (excluir consumível se já tem 2 itens)
        const categorias = Object.keys(TIPOS_ITEM);
        const categoriasUsadas = new Set();
        
        for (let i = 0; i < numItens; i++) {
            // Escolher categoria
            let categoria;
            let tentativas = 0;
            do {
                categoria = randomChoice(categorias);
                tentativas++;
            } while (categoriasUsadas.has(categoria) && tentativas < 10);
            categoriasUsadas.add(categoria);
            
            // Escolher tipo de item
            const tipoItem = randomChoice(TIPOS_ITEM[categoria]);
            
            // Determinar se é arma 1-FP, 2-FP ou outro
            let categoriaFinal = "Acessório";
            let isArma = false;
            let fp = 0;
            
            if (categoria === "Arma 1-FP") {
                categoriaFinal = "Arma 1";
                isArma = true;
                fp = 1;
            } else if (categoria === "Arma 2-FP") {
                categoriaFinal = "Arma 2";
                isArma = true;
                fp = 2;
            } else if (categoria === "Armadura") {
                categoriaFinal = "Armadura";
            } else if (categoria === "Botas") {
                categoriaFinal = "Botas";
            } else if (categoria === "Capacete") {
                categoriaFinal = "Capacete";
            } else if (categoria === "Consumível") {
                categoriaFinal = "Consumível";
            }
            
            // Nome do item
            const nome = `${tipoItem} do ${epíteto}`;
            
            // Descrição
            const descTemplate = randomChoice(DESCRICOES_ORIGEM);
            const descricao = descTemplate
                .replace("{DUNGEON}", dungeon.nome)
                .replace("{EPITETO}", epíteto);
            
            // Atributos (2 no máximo, exceto consumíveis que têm efeito)
            const atributos = {};
            const attrRange = ATRIBUTOS_RANK[dungeon.rank] || ATRIBUTOS_RANK["E"];
            
            if (categoriaFinal === "Consumível") {
                // Consumível: efeito de regeneração de mana
                const manaRank = { "E": 11, "D": 21, "C": 37, "B": 57, "A": 83, "S": 120 };
                const manaRegen = manaRank[dungeon.rank] || 11;
                atributos.efeito = `Regenera ${manaRegen} pontos de mana ao ser consumido.`;
            } else {
                // 2 atributos aleatórios
                const numAttrs = randomInt(1, 2);
                const attrsDisponiveis = [...NOMES_ATRIBUTOS].sort(() => Math.random() - 0.5);
                for (let j = 0; j < numAttrs; j++) {
                    const attrNome = attrsDisponiveis[j];
                    const valor = randomInt(attrRange.min, attrRange.max);
                    atributos[attrNome] = valor;
                }
            }
            
            // Preço
            const precoRange = PRECOS_RANK[dungeon.rank] || PRECOS_RANK["E"];
            const preco = randomInt(precoRange.min, precoRange.max);
            // Arredondar para múltiplos de 10000
            const precoFinal = Math.round(preco / 10000) * 10000;
            
            const item = {
                nome: nome,
                rank: dungeon.rank,
                categoria: categoriaFinal,
                descricao: descricao,
                atributos: atributos,
                preco: precoFinal
            };
            
            if (isArma) {
                item.arma = 1;
                item.fp = fp;
            }
            
            itensDungeon.push(item);
        }
        
        drops[dungeon.id] = itensDungeon;
    });
    
    return drops;
}

// Gerar e salvar
const drops = gerarDrops();
const arquivoSaida = path.join(__dirname, "..", "src", "database", "dungeon_drops.json");

fs.writeFileSync(arquivoSaida, JSON.stringify(drops, null, 2), "utf8");

// Estatísticas
let totalItens = 0;
Object.values(drops).forEach(itens => totalItens += itens.length);

console.log("=== DATABASE DE DROPS GERADA ===");
console.log("Total de dungeons com drops: " + Object.keys(drops).length);
console.log("Total de itens: " + totalItens);
console.log("Média por dungeon: " + (totalItens / Object.keys(drops).length).toFixed(1));
console.log("Arquivo salvo em: " + arquivoSaida);