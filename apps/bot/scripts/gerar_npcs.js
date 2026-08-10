/**
 * GERADOR DE NPCs
 * 
 * Processa todos os NPCs do dataset, corrige classes para as válidas do sistema,
 * remove "Monarca" das classes avançadas e gera:
 * 1. Arquivos JSON em src/npc/data/
 * 2. Comandos em src/commands/npc_<id>.js
 * 3. Registro no commandHandler.js
 * 4. Rotinas no scheduler.js
 */

const fs = require("fs");
const path = require("path");

// =====================================
// CLASSES VÁLIDAS DO SISTEMA
// =====================================
const CLASSES_INICIAIS = [
    "Lutador", "Assassino", "Tanker", "Ranger", "Curador",
    "Mago Elemental", "Mago de Maldição", "Mago de Barreira", "Mago Invocador"
];

const CLASSES_AVANCADAS = [
    // Lutador
    "Hrymir", "Freyr", "Berserk", "Herói do Escudo", "Construtor",
    "Paladino", "Escudeiro", "Uthabiti", "Morax", "Viking",
    "Herói da Espada", "Monge", "Samurai", "Inquisitor", "Esgrimista",
    // Assassino
    "Lâmina Sombria", "Sword Dancer", "Corsário", "Shinobi", "Thanakir",
    "Palhaço", "Ardito", "Raijin", "Herói da Lança",
    // Tanker
    "Pneuma-Ousia", "Rastreador", "Andarilho",
    // Ranger
    "Herói do Arco", "Harmonic", "Chefe", "Domador",
    // Curador
    "Apotecário", "Músico", "Oráculo", "Estigmas", "Nazhir",
    "Calamitas", "Mago de Luz",
    // Mago Elemental
    "Alquimista", "Grande Mago", "Feiticeiros", "Druida", "Catalys",
    "Archon", "Warden", "Arcanista", "Taoísta", "Sábio", "Mago Rúnico",
    "Onmyouji", "Bruxo", "Mago de Ignição",
    // Mago de Maldição
    "Necromante", "Taumaturgo", "Bokor", "Mago de Escuridão", "Nidhogg"
];

// =====================================
// MAPEAMENTO DE CLASSES AVANÇADAS POR CLASSE INICIAL
// =====================================
const MAPA_CLASSE_AVANCADA = {
    "Lutador": ["Hrymir", "Freyr", "Berserk", "Herói do Escudo", "Construtor", "Paladino", "Escudeiro", "Uthabiti", "Morax", "Viking", "Herói da Espada", "Monge", "Samurai", "Inquisitor", "Esgrimista"],
    "Assassino": ["Lâmina Sombria", "Sword Dancer", "Corsário", "Shinobi", "Thanakir", "Palhaço", "Ardito", "Raijin", "Herói da Lança"],
    "Tanker": ["Pneuma-Ousia", "Rastreador", "Andarilho"],
    "Ranger": ["Herói do Arco", "Harmonic", "Chefe", "Domador"],
    "Curador": ["Apotecário", "Músico", "Oráculo", "Estigmas", "Nazhir", "Calamitas", "Mago de Luz"],
    "Mago Elemental": ["Alquimista", "Grande Mago", "Feiticeiros", "Druida", "Catalys", "Archon", "Warden", "Arcanista", "Taoísta", "Sábio", "Mago Rúnico", "Onmyouji", "Bruxo", "Mago de Ignição"],
    "Mago de Maldição": ["Necromante", "Taumaturgo", "Bokor", "Mago de Escuridão", "Nidhogg"],
    "Mago de Barreira": ["Warden", "Arcanista", "Sábio", "Mago Rúnico"],
    "Mago Invocador": ["Domador", "Onmyouji", "Bruxo", "Necromante"]
};

// =====================================
// MAPEAMENTO DE ELEMENTOS VÁLIDOS
// =====================================
const ELEMENTOS_VALIDOS = ["Fogo", "Água", "Gelo", "Terra", "Vento", "Raio", "Planta", "Luz", "Escuridão", "Metal", "Cristal", "Sombra", "Madeira", "Tempestade", "Lava", "Fumaça", "Areia"];

// =====================================
// FUNÇÕES AUXILIARES
// =====================================
function gerarId(nome) {
    return nome.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "_")
        .trim();
}

function corrigirClasse(classeOriginal) {
    if (!classeOriginal) return "Lutador";
    
    const classeLower = classeOriginal.toLowerCase();
    
    // Mapear classes originais para classes válidas
    const mapa = {
        "heroína": "Curador",
        "herói": "Lutador",
        "maga": "Mago Elemental",
        "mago elemental": "Mago Elemental",
        "mago da maldicao": "Mago de Maldição",
        "mago da maldição": "Mago de Maldição",
        "mago de maldicao": "Mago de Maldição",
        "mago de maldição": "Mago de Maldição",
        "mago de luz": "Mago Elemental",
        "mago de gelo": "Mago Elemental",
        "mago de fogo": "Mago Elemental",
        "mago de agua": "Mago Elemental",
        "mago de água": "Mago Elemental",
        "mago de terra": "Mago Elemental",
        "mago de vento": "Mago Elemental",
        "mago de raio": "Mago Elemental",
        "mago de planta": "Mago Elemental",
        "mago invocador": "Mago Invocador",
        "mago de barreira": "Mago de Barreira",
        "mago elemental": "Mago Elemental",
        "mago": "Mago Elemental",
        "arquiteta": "Lutador",
        "assassino": "Assassino",
        "ranger": "Ranger",
        "curador": "Curador",
        "lutador": "Lutador",
        "tanker": "Tanker"
    };
    
    // Verificar se a classe original já é válida
    for (const classe of CLASSES_INICIAIS) {
        if (classeLower === classe.toLowerCase()) return classe;
    }
    
    // Buscar no mapa
    for (const [chave, valor] of Object.entries(mapa)) {
        if (classeLower.includes(chave)) return valor;
    }
    
    return "Lutador";
}

function corrigirClasseAvancada(classeAvancadaOriginal, classeInicial) {
    if (!classeAvancadaOriginal) return "Nenhuma";
    
    // Remover "Monarca" e tudo que vem depois
    let classe = classeAvancadaOriginal.split("—")[0].trim();
    classe = classe.split("-")[0].trim();
    classe = classe.replace(/Monarca.*/i, "").trim();
    classe = classe.replace(/monarca.*/i, "").trim();
    
    // Limpar espaços extras
    classe = classe.replace(/\s+/g, " ").trim();
    
    // Se ficou vazio, usar a classe inicial
    if (!classe) return "Nenhuma";
    
    // Verificar se a classe avançada é válida
    const classeLower = classe.toLowerCase();
    for (const classeAvancada of CLASSES_AVANCADAS) {
        if (classeLower === classeAvancada.toLowerCase()) {
            // Verificar se é compatível com a classe inicial
            const disponiveis = MAPA_CLASSE_AVANCADA[classeInicial] || [];
            if (disponiveis.some(c => c.toLowerCase() === classeLower)) {
                return classeAvancada;
            }
            // Se não for compatível, escolher a primeira disponível
            return disponiveis[0] || "Nenhuma";
        }
    }
    
    // Mapear classes avançadas originais para válidas
    const mapaAvancada = {
        "maga de luz": "Mago de Luz",
        "maga >e luz": "Mago de Luz",
        "maga e luz": "Mago de Luz",
        "archon": "Archon",
        "shinobi": "Shinobi",
        "heroi da espada": "Herói da Espada",
        "heroi da lanca": "Herói da Lança",
        "heroi do arco": "Herói do Arco",
        "dancarino das espadas": "Sword Dancer",
        "apotecario": "Apotecário",
        "nidhogg": "Nidhogg",
        "rastreadores": "Rastreador",
        "viking": "Viking",
        "lamina sombria": "Lâmina Sombria",
        "oraculo": "Oráculo",
        "calamitas": "Calamitas",
        "taumaturgo": "Taumaturgo",
        "bokor": "Bokor",
        "necromante": "Necromante",
        "escuridao": "Mago de Escuridão",
        "musico": "Músico",
        "harmonic": "Harmonic",
        "engenheira de cerco": "Construtor",
        "atirador de precisao": "Herói do Arco",
        "sacerdotisa da chama azul": "Mago de Luz",
        "lamina contratada": "Lâmina Sombria",
        "medica de emergencia": "Apotecário",
        "guardiã dos arquivos": "Sábio",
        "guardiã dos arquivos": "Sábio",
        "colecionador de reliquias": "Herói da Espada",
        "mediador de rotas": "Shinobi",
        "coordenadora de alivio": "Shinobi",
        "acompanhante do luto": "Mago de Luz",
        "artista das ruinas": "Sword Dancer",
        "estudioso da justica": "Archon",
        "cacadora de duelos": "Herói do Arco",
        "curandeira do deserto": "Apotecário",
        "sobrevivente das ilhas perdidas": "Sword Dancer",
        "campea da arena": "Herói da Espada",
        "fantasma das areias": "Shinobi",
        "comandante exilado": "Herói da Espada",
        "rainha do castelo oco": "Druida",
        "rei sem reino": "Herói da Espada",
        "estrategista aposentado": "Sábio",
        "capita sem bandeira": "Herói do Arco",
        "cavaleiro do juramento esquecido": "Paladino",
        "sabia da ilha isolada": "Sábio",
        "guardião das trilhas": "Herói da Lança",
        "defensora solitaria": "Herói da Espada",
        "imperatriz do tempo congelado": "Mago de Gelo",
        "sacerdote da fachada impecavel": "Mago de Luz",
        "o traidor de ferro": "Herói da Espada",
        "o chefe do submundo": "Lâmina Sombria",
        "o parceiro que traiu": "Shinobi",
        "fera corrompida das montanhas geladas": "Berserk",
        "o voluntario de sorriso vazio": "Lâmina Sombria",
        "devorador colossal das rotas": "Berserk",
        "o reitor usurpador": "Archon",
        "a conselheira das sombras": "Lâmina Sombria",
        "a benfeitora envenenadora": "Apotecário",
        "o magistrado da extorsao": "Herói da Espada",
        "o punho dos corvos": "Berserk",
        "a lamina venenosa dos corvos": "Lâmina Sombria",
        "o diretor da disciplina cruel": "Herói da Espada",
        "o domador cruel": "Domador",
        "a entidade que absorve o sofrimento": "Necromante",
        "o usurpador do cla": "Herói da Espada",
        "o conselheiro traidor": "Shinobi",
        "a produtora das sombras": "Lâmina Sombria",
        "a jornalista que nunca foi quem dizia ser": "Shinobi",
        "o pesquisador traidor": "Taumaturgo",
        "a manipuladora de traumas": "Bokor",
        "a capita consumida pela vinganca": "Herói da Espada",
        "o fundador vazio": "Lâmina Sombria",
        "o cacador sombrio": "Domador"
    };
    
    // Buscar no mapa
    for (const [chave, valor] of Object.entries(mapaAvancada)) {
        if (classeLower.includes(chave)) {
            // Verificar compatibilidade
            const disponiveis = MAPA_CLASSE_AVANCADA[classeInicial] || [];
            if (disponiveis.some(c => c.toLowerCase() === valor.toLowerCase())) {
                return valor;
            }
            return disponiveis[0] || "Nenhuma";
        }
    }
    
    // Se não encontrou, escolher a primeira disponível para a classe inicial
    const disponiveis = MAPA_CLASSE_AVANCADA[classeInicial] || [];
    return disponiveis[0] || "Nenhuma";
}

function corrigirElemento(elementoOriginal) {
    if (!elementoOriginal) return "Fogo";
    
    const elementoLower = elementoOriginal.toLowerCase();
    
    const mapa = {
        "luz": "Luz",
        "raio": "Raio",
        "metal": "Metal",
        "terra": "Terra",
        "escuridão": "Escuridão",
        "escuridao": "Escuridão",
        "vento": "Vento",
        "gelo": "Gelo",
        "planta": "Planta",
        "fogo": "Fogo",
        "água": "Água",
        "agua": "Água",
        "cristal": "Cristal",
        "sombra": "Sombra",
        "madeira": "Madeira",
        "tempestade": "Tempestade",
        "lava": "Lava",
        "fumaça": "Fumaça",
        "fumaca": "Fumaça",
        "areia": "Areia"
    };
    
    for (const [chave, valor] of Object.entries(mapa)) {
        if (elementoLower.includes(chave)) return valor;
    }
    
    return "Fogo";
}

// =====================================
// DADOS DOS NPCs (extraídos do dataset)
// =====================================
const NPCS = [
    // ===== OT1 =====
    {
        "papel": "Heroína",
        "base_em": "Ophilia (Octopath Traveler)",
        "nome": "Ophilia Clement",
        "idade": "21",
        "nacionalidade": "Sul-coreana, criada nos Templos budistas da Coreia",
        "aparencia": "Cabelos loiros presos por uma faixa cerimonial, veste um manto branco e azul de sacerdotisa sobre o uniforme padrão de caçadora. Carrega sempre um báculo de madeira entalhado com símbolos de luz.",
        "altura_peso": "1,63m / 52kg",
        "personalidade": "Gentil, compassiva e extremamente devota, mas capaz de firmeza inabalável quando alguém sob sua proteção é ameaçado. Carrega o peso de nunca conseguir salvar todo mundo, e por isso se dedica ainda mais aos que consegue alcançar.",
        "historia": "Adotada ainda criança por um sacerdote dos Templos após perder a família em um colapso de dungeon, Ophilia cresceu servindo como curandeira voluntária da comunidade religiosa nas montanhas. Seu despertar como Caçadora aconteceu durante um resgate: um grupo de fiéis ficou soterrado após um tremor ligado à abertura de um portal, e a luz que emanou de suas mãos ao tentar salvá-los foi reconhecida pela Associação como um Despertar de Rank A. Desde então, viaja entre templos e dungeons levando cura e orientação espiritual a caçadores feridos, recusando-se a cobrar por seus serviços. É vista como uma figura quase lendária entre caçadores de baixo rank, que a chamam de 'A Luz de Hallasan' por seu trabalho recorrente na região vulcânica.",
        "classe": "[✦] Curador",
        "classe_avancada": "Maga >e Luz",
        "rank": "A",
        "nivel": 88,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 28, "resistencia": 45, "velocidade": 40, "sentidos": 55, "inteligencia": 78, "poder_magico": 90},
        "elemento": "Luz",
        "habilidade_unica": "Bênção das Almas Guardiãs — invoca temporariamente os espíritos de curandeiras que vieram antes dela para curar em área e purificar debuffs de todo o grupo por 3 turnos.",
        "titulo": "A Sacerdotisa de Hallasan",
        "equipamentos": {"arma": "Báculo Sagrado de Flandre", "itens": "Manto Cerimonial de Luz, Rosário de Purificação, Kit de Primeiros Socorros Abençoado"},
        "tecnicas": ["Círculo de Cura Radiante", "Julgamento da Aurora", "Escudo dos Fiéis"]
    },
    {
        "papel": "Herói",
        "base_em": "Cyrus Albright (Octopath Traveler)",
        "nome": "Cyrus Albright",
        "idade": "29",
        "nacionalidade": "Sul-coreano, ex-professor universitário",
        "aparencia": "Óculos de leitura, cabelo castanho sempre desarrumado e um longo casaco acadêmico surrado por viagens. Carrega uma pilha de grimórios amarrados com corda que ele consulta mesmo em pleno combate.",
        "altura_peso": "1,80m / 68kg",
        "personalidade": "Curioso ao extremo, distraído com qualquer mistério novo, mas brilhante e leal aos amigos. Sua obsessão por conhecimento às vezes o coloca em perigo, pois esquece o próprio risco diante de um enigma interessante.",
        "historia": "Professor de história arcana antes de seu Despertar, Cyrus era famoso por suas teorias sobre a origem dos portais - teorias que a academia tradicional ridicularizava. Tudo mudou quando, investigando ruínas próximas a uma dungeon colapsada, ele acidentalmente ativou um núcleo de mana antigo, despertando poderes elementais latentes. Expulso da universidade por 'insubordinação acadêmica' após revelar publicamente documentos que a Associação preferia manter em sigilo, Cyrus agora viaja como caçador independente, catalogando dungeons anômalas e resolvendo mistérios que os órgãos oficiais preferem ignorar. É consultado informalmente por vários guildas quando um fenômeno foge do comum.",
        "classe": "[✦] Mago Elemental",
        "classe_avancada": "Archon — Monarca de Gelo/Fogo/Água/Terra/Planta/Raios",
        "rank": "A",
        "nivel": 90,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 22, "resistencia": 38, "velocidade": 35, "sentidos": 60, "inteligencia": 95, "poder_magico": 88},
        "elemento": "Raio",
        "habilidade_unica": "Compêndio Elemental — analisa a fraqueza elemental de qualquer inimigo em um turno e conjura instantaneamente o elemento ideal para explorá-la, dobrando o dano do próximo ataque mágico.",
        "titulo": "O Erudito dos Portais",
        "equipamentos": {"arma": "Orbe de Cristal Multielemental", "itens": "Biblioteca Portátil de Grimórios, Óculos Analisadores de Mana, Tinteiro Encantado"},
        "tecnicas": ["Rajada Quádrupla Elemental", "Análise Arcana", "Tempestade de Conhecimento"]
    },
    {
        "papel": "Heroína",
        "base_em": "Tressa Colzione (Octopath Traveler)",
        "nome": "Tressa Colzione",
        "idade": "17",
        "nacionalidade": "Sul-coreana, filha de comerciantes",
        "aparencia": "Baixinha e enérgica, cabelos castanhos em duas tranças curtas, veste um casaco de viagem cheio de bolsos e carrega duas adagas curvas na cintura junto a uma bolsa de moedas sempre tilintando.",
        "altura_peso": "1,52m / 45kg",
        "personalidade": "Curiosa, otimista e movida por uma vontade incontrolável de ver o que existe além do horizonte. Apesar da pouca idade, tem um instinto afiado para reconhecer quando alguém está tentando enganá-la.",
        "historia": "Filha de donos de uma pequena loja de itens para caçadores, Tressa cresceu ouvindo histórias de dungeons trazidas por clientes exaustos. Seu Despertar ocorreu aos 16 anos, quando negociou a própria sobrevivência com um Monstro de dungeon usando itens que carregava na bolsa — um ato tão inesperado que a Associação não soube nem como classificá-lo a princípio. Hoje viaja comprando e vendendo relíquias raras encontradas em masmorras, financiando expedições de caçadores novatos que não têm recursos, e sonha em um dia mapear todos os portais conhecidos da Coreia do Sul.",
        "classe": "[✦] Assassino",
        "classe_avancada": "Shinobi — Monarca da Paciência",
        "rank": "B",
        "nivel": 65,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 30, "resistencia": 32, "velocidade": 58, "sentidos": 70, "inteligencia": 62, "poder_magico": 20},
        "elemento": "Metal",
        "habilidade_unica": "Barganha do Destino — oferece um item ao inimigo (ou aliado) em troca de um efeito instantâneo escolhido por ela: cura, buff ou dano; funciona apenas uma vez por batalha.",
        "titulo": "A Mercadora Errante",
        "equipamentos": {"arma": "Par de Adagas Cravejadas de Moedas", "itens": "Bolsa Dimensional de Comércio, Balança de Avaliação Mágica, Diário de Rotas"},
        "tecnicas": ["Corte da Barganha Justa", "Investimento Arriscado", "Retirada Lucrativa"]
    },
    {
        "papel": "Herói",
        "base_em": "Olberic Eisenberg (Octopath Traveler)",
        "nome": "Olberic Eisenberg",
        "idade": "43",
        "nacionalidade": "Sul-coreano, ex-instrutor de um dojo extinto",
        "aparencia": "Corpo musculoso marcado por cicatrizes de batalhas antigas, cabelos grisalhos curtos e uma cicatriz que atravessa a sobrancelha esquerda. Veste uma armadura pesada de placas sobre o uniforme de caçador, sempre com uma espada larga presa às costas.",
        "altura_peso": "1,88m / 95kg",
        "personalidade": "Disciplinado, honrado e reservado, carrega o peso de ter falhado em proteger algo importante no passado. Trata jovens caçadores com paciência quase paternal, mas é implacável contra quem abusa dos fracos.",
        "historia": "Antes de seu Despertar, Olberic era mestre de um pequeno dojo de artes marciais que treinava aspirantes a caçador. Quando uma guilda rival corrompida invadiu sua cidade natal em busca de controle sobre um portal recém-descoberto, o dojo foi destruído e seus alunos mortos ou dispersos. Foi durante esse massacre que seu poder latente despertou — tarde demais para salvar a todos. Desde então, Olberic vaga como caçador solitário de Rank S, enfrentando guildas corruptas e traficantes de itens de dungeon, sempre em busca de notícias sobre o mercenário responsável pela queda de seu dojo.",
        "classe": "[✦] Lutador",
        "classe_avancada": "Heroi da Espada — Monarca das Chamas Brancas",
        "rank": "S",
        "nivel": 100,
        "estilo_luta": "Proficiência em Espadas",
        "atributos": {"forca": 92, "resistencia": 88, "velocidade": 60, "sentidos": 55, "inteligencia": 40, "poder_magico": 15},
        "elemento": "Terra",
        "habilidade_unica": "Golpe do Guerreiro Caído — concentra toda a força restante em um único corte capaz de ignorar parte da defesa do alvo; quanto menor o HP de Olberic, maior o dano causado.",
        "titulo": "O Último Mestre de Hornburg",
        "equipamentos": {"arma": "Espada Larga Herdada do Dojo", "itens": "Armadura de Placas Reforçada, Faixa de Honra do Mestre, Pedra de Amolar Encantada"},
        "tecnicas": ["Corte Decisivo", "Postura Inabalável", "Fúria do Guerreiro Caído"]
    },
    {
        "papel": "Heroína",
        "base_em": "Primrose Azelhart (Octopath Traveler)",
        "nome": "Primrose Azelhart",
        "idade": "24",
        "nacionalidade": "Sul-coreana, ex-integrante de uma casa noturna clandestina",
        "aparencia": "Elegante e sedutora, cabelos ruivos ondulados, veste trajes de dança adaptados com reforços leves para combate. Duas adagas finas ficam escondidas nas mangas de seu figurino.",
        "altura_peso": "1,66m / 50kg",
        "personalidade": "Fria e calculista na superfície, escondendo uma dor profunda por trás de sorrisos ensaiados. É implacável com quem fez mal a quem ama, mas genuinamente protetora com os poucos em quem confia.",
        "historia": "Filha de um líder de guilda assassinado por associados que buscavam controlar as rotas de itens raros extraídos de dungeons, Primrose foi vendida a uma casa de entretenimento clandestina ainda jovem. Foi lá, dançando para clientes suspeitos, que absorveu mana suficiente de um artefato roubado para Despertar. Usando sua nova força, escapou e passou anos infiltrando guildas criminosas sob o disfarce de dançarina, eliminando um por um os responsáveis pela morte do pai. Hoje, com sua vingança quase completa, começa a se perguntar o que fará de sua vida quando não houver mais ninguém a caçar.",
        "classe": "[✦] Assassino",
        "classe_avancada": "Dancarino das Espadas — Monarca dos Cavaleiros",
        "rank": "A",
        "nivel": 92,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 55, "resistencia": 40, "velocidade": 82, "sentidos": 85, "inteligencia": 58, "poder_magico": 35},
        "elemento": "Escuridão",
        "habilidade_unica": "Convocação das Sombras Gêmeas — invoca duas cópias espectrais de si mesma para atacar simultaneamente por 2 turnos, confundindo a defesa do inimigo.",
        "titulo": "A Dançarina Vingativa",
        "equipamentos": {"arma": "Par de Adagas Ocultas 'Sussurro'", "itens": "Figurino Reforçado de Combate, Máscara de Infiltração, Perfume Neutralizador de Odor"},
        "tecnicas": ["Valsa das Lâminas", "Ilusão do Palco Sombrio", "Ato Final"]
    },
    {
        "papel": "Herói",
        "base_em": "Alfyn Greengrass (Octopath Traveler)",
        "nome": "Alfyn Greengrass",
        "idade": "22",
        "nacionalidade": "Sul-coreano, de uma vila interiorana próxima a dungeons de baixo rank",
        "aparencia": "Robusto e de sorriso fácil, cabelos loiros bagunçados sob um chapéu de viagem surrado. Carrega um machado grande nas costas e uma caixa de ferramentas cheia de ervas e poções às costas.",
        "altura_peso": "1,78m / 80kg",
        "personalidade": "Caloroso, direto e incapaz de ignorar alguém precisando de ajuda, mesmo quando isso o coloca em perigo. Tem um senso de justiça simples, mas inabalável: ninguém deveria morrer por falta de socorro.",
        "historia": "Criado por um curandeiro da vila que o adotou após encontrá-lo ferido nas proximidades de uma dungeon, Alfyn cresceu aprendendo a preparar poções com ervas colhidas em zonas de risco. Seu Despertar ocorreu quando, sozinho, enfrentou um monstro fugitivo para proteger um caçador ferido que ninguém mais ousava socorrer. Hoje viaja como uma espécie de médico de campo itinerante, respondendo a chamados de emergência em vilas próximas a portais, cobrando o mínimo possível e recusando pagamento de quem não tem condições. Guildas o contratam informalmente como suporte de emergência em incursões de alto risco.",
        "classe": "[✦] Curador",
        "classe_avancada": "Apotecario — Monarca das Pragas",
        "rank": "A",
        "nivel": 85,
        "estilo_luta": "Proficiência em Machados",
        "atributos": {"forca": 65, "resistencia": 70, "velocidade": 42, "sentidos": 50, "inteligencia": 68, "poder_magico": 60},
        "elemento": "Planta",
        "habilidade_unica": "Panaceia Universal — mistura instantânea de ervas raras que cura HP em área e remove qualquer status negativo do grupo inteiro, uma vez por dungeon.",
        "titulo": "O Curandeiro de Campo",
        "equipamentos": {"arma": "Machado de Colheita Reforçado", "itens": "Caixa de Ervas Medicinais, Kit de Preparo de Poções Portátil, Cantil de Água Purificada"},
        "tecnicas": ["Golpe Vital", "Concoção de Emergência", "Abraço da Terra Boa"]
    },
    {
        "papel": "Herói",
        "base_em": "Therion (Octopath Traveler)",
        "nome": "Therion",
        "idade": "26",
        "nacionalidade": "Sul-coreano, sem endereço fixo",
        "aparencia": "Magro e ágil, cabelos prateados curtos, uma cicatriz cobre parcialmente um dos olhos. Veste roupas escuras e discretas, ideais para se mover sem ser notado, com um algema quebrada ainda presa a um dos pulsos.",
        "altura_peso": "1,75m / 62kg",
        "personalidade": "Cínico, desconfiado e relutante em admitir que se importa com alguém. Cresceu sozinho e aprendeu a depender só de si mesmo, mas por trás da fachada arisca existe alguém leal a quem conquista sua confiança.",
        "historia": "Órfão criado nas ruas próximas às zonas de dungeons abandonadas, Therion sobreviveu roubando itens de caçadores incautos até ser capturado pela Associação e obrigado a trabalhar sob supervisão como forma de pena. Seu Despertar aconteceu durante uma fuga, quando escalou uma torre de uma dungeon em colapso para escapar de guardas — o pico de adrenalina revelou uma velocidade sobre-humana. Hoje, ainda usando uma algema quebrada como lembrete de onde veio, trabalha como 'recuperador' freelance, entrando em dungeons de alto risco para resgatar itens raros perdidos por outras equipes, sempre ficando com uma taxa generosa para si mesmo.",
        "classe": "[✦] Assassino",
        "classe_avancada": "Nidhogg — Monarca do Espaço",
        "rank": "S",
        "nivel": 97,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 60, "resistencia": 48, "velocidade": 95, "sentidos": 90, "inteligencia": 55, "poder_magico": 25},
        "elemento": "Vento",
        "habilidade_unica": "Passo Fantasma — desaparece por um instante, tornando-se intangível a ataques físicos por um turno e reaparecendo atrás do inimigo com um ataque surpresa garantido.",
        "titulo": "O Ladrão das Sombras",
        "equipamentos": {"arma": "Adaga Curva 'Silêncio'", "itens": "Kit de Arrombamento Encantado, Capa de Camuflagem, Algema Quebrada (relíquia pessoal)"},
        "tecnicas": ["Roubo Relâmpago", "Passo no Vazio", "Corte das Mil Sombras"]
    },
    {
        "papel": "Heroína",
        "base_em": "H'aanit (Octopath Traveler)",
        "nome": "H'aanit",
        "idade": "20",
        "nacionalidade": "Sul-coreana, de uma vila isolada nas montanhas nevadas",
        "aparencia": "Alta e atlética, cabelos escuros presos em um rabo de cavalo longo, veste roupas de caça reforçadas com peles. Um grande felino branco domesticado a acompanha em suas jornadas.",
        "altura_peso": "1,74m / 64kg",
        "personalidade": "Calma, observadora e de poucas palavras, fala em um dialeto rural que soa antiquado até para outros caçadores. Extremamente leal a seu mestre e à sua besta companheira, prefere resolver conflitos evitando derramamento de sangue desnecessário.",
        "historia": "Treinada desde criança por um caçador veterano em uma vila remota famosa por domar bestas de dungeon, H'aanit despertou seu poder ao vincular-se de forma incompleta a um raro felino-monstro durante uma caçada, um processo que quase a matou mas resultou em um vínculo permanente. Quando seu mestre desapareceu durante uma expedição a uma dungeon de rank S não catalogada, H'aanit assumiu a missão de encontrá-lo, viajando pelo país acompanhada de sua besta domada e aceitando contratos de caça a monstros fugitivos pelo caminho.",
        "classe": "[✦] Ranger",
        "classe_avancada": "Rastreadores — Monarca da Guerra",
        "rank": "S",
        "nivel": 100,
        "estilo_luta": "Proficiência em Arcos",
        "atributos": {"forca": 68, "resistencia": 62, "velocidade": 75, "sentidos": 98, "inteligencia": 45, "poder_magico": 30},
        "elemento": "Gelo",
        "habilidade_unica": "Vínculo da Caçadora — luta lado a lado com sua besta companheira por 3 turnos, dobrando a precisão de ambas e permitindo ataques combinados que ignoram esquiva.",
        "titulo": "A Guardiã das Terras Geladas",
        "equipamentos": {"arma": "Arco Longo Entalhado à Mão", "itens": "Machado de Caça Reserva, Coleira Ritual da Besta Companheira, Kit de Rastreamento"},
        "tecnicas": ["Flecha Perfurante", "Investida do Predador Gêmeo", "Silêncio da Neve"]
    },
    // ===== OT2 =====
    {
        "papel": "Herói",
        "base_em": "Hikari Ku (Octopath Traveler II)",
        "nome": "Hikari Ku",
        "idade": "25",
        "nacionalidade": "Sul-coreano, herdeiro afastado de uma família tradicional de artes marciais",
        "aparencia": "Postura imponente e séria, cabelos negros longos amarrados, cicatriz de queimadura parcialmente escondida sob a manga. Veste um uniforme de combate de corte tradicional adaptado para dungeons modernas.",
        "altura_peso": "1,82m / 78kg",
        "personalidade": "Formal, contido e assombrado por decisões do passado que custaram vidas. Encara o próprio poder com desconfiança, temendo repetir os erros que o exilaram, mas nunca hesita em agir quando é necessário proteger alguém.",
        "historia": "Herdeiro de uma das famílias fundadoras da Associação de Caçadores, Hikari foi afastado do posto de liderança quando seu irmão mais velho orquestrou um golpe interno, culpando-o por uma operação de resgate que terminou em tragédia. Exilado e caçado por assassinos da própria família, Hikari despertou seu verdadeiro poder durante uma emboscada, incinerando uma equipe inteira de perseguidores em um acesso de fúria que ele mesmo mal controlou. Agora reúne aliados de confiança em segredo para reconquistar seu lugar e expor a corrupção que tomou conta da liderança de sua guilda de origem.",
        "classe": "[✦] Lutador",
        "classe_avancada": "Viking — Monarca do Derramamento",
        "rank": "S",
        "nivel": 100,
        "estilo_luta": "Proficiência em Espadas",
        "atributos": {"forca": 95, "resistencia": 75, "velocidade": 72, "sentidos": 60, "inteligencia": 50, "poder_magico": 20},
        "elemento": "Fogo",
        "habilidade_unica": "Lâmina do Herdeiro Caído — acumula fúria a cada golpe recebido; ao atingir o limite, desfere um corte devastador que ignora completamente a defesa do alvo.",
        "titulo": "O Príncipe Exilado",
        "equipamentos": {"arma": "Espada da Família Ku (Selada)", "itens": "Armadura Tradicional Reforçada, Selo Real Quebrado, Faixa de Luto"},
        "tecnicas": ["Corte do Herdeiro", "Fúria Contida", "Golpe Final da Redenção"]
    },
    {
        "papel": "Heroína",
        "base_em": "Agnea Bristarni (Octopath Traveler II)",
        "nome": "Agnea Bristarni",
        "idade": "18",
        "nacionalidade": "Sul-coreana, de uma pequena vila agrícola",
        "aparencia": "Sorridente e cheia de energia, cabelos loiros claros em um penteado alto, veste um figurino de dança colorido adaptado com reforços leves. Fitas decorativas em seus braços escondem lâminas curtas.",
        "altura_peso": "1,58m / 47kg",
        "personalidade": "Otimista, extrovertida e determinada a brilhar com luz própria, sem depender da sombra de ninguém. Às vezes ingênua sobre os perigos do mundo dos caçadores, mas cresce rapidamente através da experiência.",
        "historia": "Inspirada pela irmã mais velha, uma dançarina de rua que também é caçadora e cuida dela desde a morte dos pais em um colapso de dungeon, Agnea sempre sonhou em se tornar tão admirada quanto sua irmã. Seu Despertar aconteceu durante uma apresentação pública, quando um monstro invadiu a praça e ela, movida por instinto puro de proteger o público, canalizou mana em suas fitas de dança para repeli-lo. Hoje viaja como caçadora e artista itinerante, competindo em torneios de exibição que também servem para recrutar novos talentos para guildas menores, sempre em busca de reconhecimento por seus próprios méritos.",
        "classe": "[✦] Assassino",
        "classe_avancada": "Heroi da Lanca — Monarca do Amor",
        "rank": "B",
        "nivel": 68,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 35, "resistencia": 30, "velocidade": 62, "sentidos": 58, "inteligencia": 40, "poder_magico": 30},
        "elemento": "Cristal",
        "habilidade_unica": "Palco de Encorajamento — sua dança em combate eleva o moral do grupo, concedendo um bônus temporário de velocidade e taxa crítica a todos os aliados próximos.",
        "titulo": "A Estrela Nascente",
        "equipamentos": {"arma": "Fitas de Combate com Lâminas Ocultas", "itens": "Figurino de Apresentação Reforçado, Sapatilhas Leves Encantadas, Retrato da Irmã"},
        "tecnicas": ["Giro Radiante", "Passo do Aplauso", "Fita Cortante Dupla"]
    },
    {
        "papel": "Heroína",
        "base_em": "Castti Florenz (Octopath Traveler II)",
        "nome": "Castti Florenz",
        "idade": "23",
        "nacionalidade": "Sul-coreana (identidade original desconhecida)",
        "aparencia": "Serena e gentil, cabelos loiro-acinzentados curtos, veste um jaleco de campo sobre o uniforme de caçadora, sempre carregando um machado de colheita e uma bolsa cheia de frascos de ingredientes.",
        "altura_peso": "1,65m / 55kg",
        "personalidade": "Calorosa e maternal com quem encontra pelo caminho, mas assombrada pela amnésia que apaga boa parte de seu passado. Determinada a recuperar suas memórias sem deixar que isso a impeça de ajudar os outros no presente.",
        "historia": "Encontrada à deriva perto de uma zona de colapso de dungeon sem memória de quem era, Castti foi acolhida por um grupo itinerante de curandeiros que viajava tratando vítimas de acidentes em portais. Descobriu ter um talento natural com poções e ervas, e seu Despertar ocorreu quando, sozinha, salvou uma vila inteira de uma praga espalhada por um monstro tipo veneno. Aos poucos, fragmentos de sua vida anterior voltam através de rostos e lugares que reconhece sem saber por quê, incluindo uma ligação perturbadora com um antigo colega de trabalho agora tornado inimigo perigoso.",
        "classe": "[✦] Curador",
        "classe_avancada": "Calamitas — Monarca da Pureza",
        "rank": "A",
        "nivel": 87,
        "estilo_luta": "Proficiência em Machados",
        "atributos": {"forca": 58, "resistencia": 65, "velocidade": 45, "sentidos": 55, "inteligencia": 70, "poder_magico": 72},
        "elemento": "Água",
        "habilidade_unica": "Antídoto Universal — neutraliza qualquer veneno, maldição ou efeito de status do grupo instantaneamente e converte parte do dano recebido em cura.",
        "titulo": "A Curandeira Sem Memórias",
        "equipamentos": {"arma": "Machado de Colheita Reforçado", "itens": "Bolsa de Ingredientes Raros, Diário de Memórias Fragmentadas, Kit de Antídotos"},
        "tecnicas": ["Golpe Purificador", "Mistura de Emergência", "Chuva Curativa"]
    },
    {
        "papel": "Herói",
        "base_em": "Osvald V. Vanstein (Octopath Traveler II)",
        "nome": "Osvald V. Vanstein",
        "idade": "48",
        "nacionalidade": "Sul-coreano, ex-pesquisador-chefe da Associação",
        "aparencia": "Alto e magro, óculos de aro fino, cabelos grisalhos penteados para trás. Veste um casaco escuro de pesquisador, sempre carregando um caderno de anotações e um cajado adornado com símbolos de maldição.",
        "altura_peso": "1,85m / 70kg",
        "personalidade": "Frio, calculista e obcecado por vingança, mas escondendo um coração ainda partido pela perda da família. Trata aliados com distância profissional até que provem merecer sua confiança.",
        "historia": "Renomado pesquisador de fenômenos ligados a portais, Osvald foi incriminado por um colega ambicioso pela morte de sua própria esposa e o desaparecimento da filha, sendo preso injustamente por anos. Seu Despertar aconteceu na prisão, quando o desespero e a raiva acumulados romperam seus limites mentais, manifestando magia de maldição destrutiva o suficiente para destruir as próprias celas. Escapou e agora caça sistematicamente o verdadeiro culpado, usando sua inteligência analítica para desmontar esquemas de corrupção dentro da própria Associação enquanto busca pistas do paradeiro da filha.",
        "classe": "[✦] Mago da Maldicao",
        "classe_avancada": "Taumaturgo — Monarca da Ruptura",
        "rank": "A",
        "nivel": 93,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 25, "resistencia": 42, "velocidade": 38, "sentidos": 65, "inteligencia": 96, "poder_magico": 90},
        "elemento": "Lava",
        "habilidade_unica": "Julgamento Racional — analisa o inimigo por um turno, revelando todas as suas fraquezas e reduzindo permanentemente sua resistência mágica pelo resto da batalha.",
        "titulo": "O Erudito Vingativo",
        "equipamentos": {"arma": "Cajado de Maldição Selada", "itens": "Caderno de Provas Incriminatórias, Óculos de Análise Arcana, Retrato de Família Rasgado"},
        "tecnicas": ["Maldição da Verdade Absoluta", "Explosão de Rancor", "Julgamento Final"]
    },
    {
        "papel": "Herói",
        "base_em": "Partitio Yellowil (Octopath Traveler II)",
        "nome": "Partitio Yellowil",
        "idade": "27",
        "nacionalidade": "Sul-coreano, de uma cidade mineradora em decadência",
        "aparencia": "Robusto e sorridente, cabelos ruivos curtos sob um boné de trabalhador, veste um colete cheio de bolsos para ferramentas e negócios. Carrega uma lança curta e um arco compacto às costas.",
        "altura_peso": "1,76m / 82kg",
        "personalidade": "Otimista, trabalhador e movido pelo desejo de erguer quem foi deixado para trás pelo sistema. Acredita que riqueza deve circular, não se acumular, e trata todo mundo — rico ou pobre — com o mesmo respeito genuíno.",
        "historia": "Filho de mineradores que perderam tudo quando uma corporação de exploração de recursos de dungeon assumiu o controle da cidade natal, Partitio cresceu vendo a comunidade mergulhar na pobreza enquanto poucos enriqueciam com os recursos extraídos das masmorras locais. Seu Despertar ocorreu durante uma negociação que se tornou violenta, quando ele usou uma arma improvisada para proteger companheiros de trabalho de seguranças corporativos. Hoje viaja pela Coreia do Sul como uma espécie de 'caçador social', usando lucros de recuperação de itens de dungeon para financiar cooperativas locais e enfrentar monopólios que exploram comunidades vulneráveis.",
        "classe": "[✦] Ranger",
        "classe_avancada": "Harmonic — Monarca da Glória",
        "rank": "B",
        "nivel": 70,
        "estilo_luta": "Proficiência em Arcos",
        "atributos": {"forca": 55, "resistencia": 60, "velocidade": 48, "sentidos": 62, "inteligencia": 58, "poder_magico": 25},
        "elemento": "Tempestade",
        "habilidade_unica": "Rede de Apoio Mútuo — convoca aliados temporários (trabalhadores armados) para lutar ao seu lado por 2 turnos, distraindo inimigos e absorvendo dano.",
        "titulo": "O Mercador da Prosperidade",
        "equipamentos": {"arma": "Lança e Arco Combinados", "itens": "Colete Multifuncional, Registro de Investimentos Comunitários, Apito de Convocação"},
        "tecnicas": ["Golpe do Trabalhador", "Flecha da Oportunidade", "Convocação Coletiva"]
    },
    {
        "papel": "Heroína",
        "base_em": "Ochette (Octopath Traveler II)",
        "nome": "Ochette",
        "idade": "19",
        "nacionalidade": "Sul-coreana, de uma vila isolada em floresta densa",
        "aparencia": "Ágil e selvagem em seus movimentos, cabelos verdes curtos com adornos de pena, veste roupas leves de caça feitas de materiais naturais. Garras retráteis reforçadas com mana cobrem seus punhos.",
        "altura_peso": "1,60m / 54kg",
        "personalidade": "Direta, instintiva e mais confortável na natureza do que entre pessoas. Fala pouco e prefere agir, mas desenvolve laços profundos e leais com quem conquista seu respeito, humano ou monstro.",
        "historia": "Criada por uma comunidade isolada que vive nas proximidades de uma zona de portais instáveis, Ochette foi treinada desde criança para capturar e domar as criaturas que emergem das dungeons ao invés de simplesmente exterminá-las. Seu Despertar veio da fúria e do luto, quando uma criatura que ela mesma criou desde filhote foi corrompida por uma anomalia de mana e usada para atacar sua vila. Obrigada a derrotá-la com as próprias mãos, Ochette jurou entender a origem dessas corrupções, viajando com uma coleção de monstros capturados e domados que lutam ao seu lado.",
        "classe": "[✦] Ranger",
        "classe_avancada": "Heroi do Arco — Monarca dos Heróis",
        "rank": "S",
        "nivel": 98,
        "estilo_luta": "Proficiência em Arcos",
        "atributos": {"forca": 78, "resistencia": 60, "velocidade": 85, "sentidos": 92, "inteligencia": 35, "poder_magico": 28},
        "elemento": "Madeira",
        "habilidade_unica": "Chamado da Alcateia — invoca uma criatura capturada para lutar ao seu lado por 3 turnos, com efeitos variando conforme o monstro escolhido dentre sua coleção.",
        "titulo": "A Guardiã das Feras",
        "equipamentos": {"arma": "Garras Retráteis Reforçadas + Arco Curto", "itens": "Coleira de Vínculo com Monstros, Apito de Chamado da Floresta, Bolsa de Iscas"},
        "tecnicas": ["Investida Selvagem", "Golpe Duplo da Fera", "Chamado Ancestral"]
    },
    {
        "papel": "Herói",
        "base_em": "Temenos Mistral (Octopath Traveler II)",
        "nome": "Temenos Mistral",
        "idade": "24",
        "nacionalidade": "Sul-coreano, ex-clérigo investigador da Associação",
        "aparencia": "Elegante e sereno, cabelos loiros ondulados, veste um manto clerical adaptado com um distintivo de investigador. Um sorriso calmo raramente sai do rosto, mesmo diante de situações tensas.",
        "altura_peso": "1,79m / 66kg",
        "personalidade": "Educado, observador e brutalmente racional por trás da fachada gentil. Faz qualquer coisa — inclusive mentir — em nome de descobrir a verdade, mesmo que isso exija manipular quem está à sua frente.",
        "historia": "Clérigo formado para servir templos ligados à Associação, Temenos descobriu cedo um talento para notar mentiras e reconstruir eventos a partir de pequenos detalhes. Seu Despertar ocorreu durante a investigação do assassinato de seu mentor, quando confrontou o verdadeiro culpado e, tomado por fúria fria e controlada, manifestou poder de cura convertido em arma de julgamento. Desde então, atua oficialmente como investigador ligado à Associação, mas extraoficialmente rastreia uma organização secreta que manipula guildas e políticos através de rituais proibidos envolvendo mana corrompida.",
        "classe": "[✦] Curador",
        "classe_avancada": "Oraculo",
        "rank": "A",
        "nivel": 90,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 32, "resistencia": 48, "velocidade": 52, "sentidos": 80, "inteligencia": 88, "poder_magico": 75},
        "elemento": "Fumaça",
        "habilidade_unica": "Interrogatório Absoluto — força o inimigo a revelar sua próxima ação e uma fraqueza oculta; usado com frequência para desmontar estratégias de organizações inteiras.",
        "titulo": "O Investigador do Véu",
        "equipamentos": {"arma": "Báculo Clerical de Investigação", "itens": "Distintivo Oficial da Associação, Caderno de Provas Codificadas, Lupa Encantada"},
        "tecnicas": ["Luz da Confissão", "Golpe do Julgamento", "Véu da Verdade"]
    },
    {
        "papel": "Heroína",
        "base_em": "Throné Anguis (Octopath Traveler II)",
        "nome": "Throné Anguis",
        "idade": "18",
        "nacionalidade": "Sul-coreana, criada dentro de uma organização criminosa",
        "aparencia": "Magra e alerta, cabelos negros curtos cobrindo parcialmente o rosto, veste roupas escuras de infiltração. Uma coleira de metal — hoje desativada — ainda marca seu pescoço como lembrete de seu passado.",
        "altura_peso": "1,64m / 48kg",
        "personalidade": "Desconfiada, contida e acostumada a esconder emoções para sobreviver, mas cultivando aos poucos uma fome genuína por liberdade e conexões reais. Reage com violência a qualquer tentativa de controlá-la.",
        "historia": "Criada desde muito cedo por uma organização criminosa que treinava crianças órfãs como ladras e assassinas, forçadas a competir entre si pela aprovação de um líder cruel e manipulador, Throné cresceu sem conhecer nada além de obediência e violência. Seu Despertar aconteceu no auge de uma dessas provações, quando, ao invés de atacar uma 'irmã' de organização como ordenado, virou-se contra seus próprios captores. Após escapar, dedica-se a caçar remanescentes da organização para libertar outras crianças ainda presas ao mesmo sistema, recusando qualquer guilda que tente impor regras rígidas demais sobre ela.",
        "classe": "[✦] Assassino",
        "classe_avancada": "Lamina Sombria ",
        "rank": "S",
        "nivel": 96,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 62, "resistencia": 50, "velocidade": 90, "sentidos": 88, "inteligencia": 48, "poder_magico": 22},
        "elemento": "Areia",
        "habilidade_unica": "Fuga do Colar Quebrado — ao ser atingida por um golpe fatal, tem uma chance de sobreviver com 1 HP e contra-atacar imediatamente com dano triplicado, ativável uma vez por dungeon.",
        "titulo": "A Serpente Liberta",
        "equipamentos": {"arma": "Adagas Gêmeas 'Liberdade'", "itens": "Coleira Desativada (relíquia pessoal), Kit de Infiltração Silenciosa, Mapa de Esconderijos Criminosos"},
        "tecnicas": ["Golpe da Serpente", "Fuga nas Sombras", "Corte da Liberdade"]
    },
    // ===== VILÕES =====
    {
        "papel": "Vilã",
        "base_em": "Lyblac (Octopath Traveler)",
        "nome": "Lyblac",
        "idade": "Aparenta 30 anos (idade real desconhecida, possivelmente séculos)",
        "nacionalidade": "Origem desconhecida, associada a cultos pré-Associação",
        "aparencia": "Bela e imponente, cabelos negros longos, veste trajes escuros ornamentados com símbolos de um culto extinto. Seus olhos mudam de cor quando canaliza grandes quantidades de mana corrompida.",
        "altura_peso": "1,70m / desconhecido",
        "personalidade": "Manipuladora, paciente e assustadoramente racional mesmo em meio à devastação que causa. Trata pessoas como peças em um jogo de décadas, mas nutre um amor genuíno e distorcido pelo próprio pai.",
        "historia": "Filha de uma entidade primordial selada há séculos sob uma antiga instalação hoje conhecida como 'Portal de Hornburg', Lyblac dedicou sua longuíssima existência a reunir artefatos e catalisadores de mana capazes de romper o selo que prende seu pai. Infiltrou guildas, corrompeu líderes de associações regionais e orquestrou a queda de cidades inteiras usando agentes sob controle mental, tudo em nome de reunir a família. A Associação sabe de sua existência apenas por fragmentos de relatórios de caçadores que a enfrentaram e desapareceram logo depois — ela é oficialmente classificada como 'Ameaça Nível Extinção, Origem Não Catalogada'.",
        "classe": "[✦] Mago da Maldicao",
        "classe_avancada": "Bokor — Monarca dos Mortos",
        "rank": "S",
        "nivel": 100,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 45, "resistencia": 70, "velocidade": 55, "sentidos": 80, "inteligencia": 92, "poder_magico": 98},
        "elemento": "Escuridão",
        "habilidade_unica": "Marionetes de Obsidiana — controla à distância caçadores corrompidos por mana negra, forçando-os a lutar contra seus próprios aliados até serem libertados ou eliminados.",
        "titulo": "A Filha do Selo Rompido",
        "equipamentos": {"arma": "Cajado Ritualístico de Ossos Selados", "itens": "Fragmentos do Selo de Hornburg, Grimório Proibido, Máscara Cerimonial do Culto"},
        "tecnicas": ["Ritual da Corrupção", "Convocação de Marionetes", "Sussurro do Selo"]
    },
    {
        "papel": "Vilão",
        "base_em": "Galdera (Octopath Traveler)",
        "nome": "Galdera",
        "idade": "Incontável — entidade pré-Associação",
        "nacionalidade": "Não-humano; origem ligada à formação dos primeiros portais",
        "aparencia": "Um colosso composto por incontáveis corpos fundidos de vítimas de dungeons antigas, com uma armadura negra orgânica e um único olho onisciente cravado no centro do peito. Sua voz soa como centenas falando ao mesmo tempo.",
        "altura_peso": "Aproximadamente 8m / massa indeterminada",
        "personalidade": "Frio, indiferente à individualidade humana e obcecado por reunir de volta as almas que perdeu ao ser selado. Não age por ódio ou maldade convencional, mas por uma lógica alienígena de restauração de si mesmo.",
        "historia": "Antes da fundação da Associação de Caçadores, Galdera é tido como a origem de um evento cataclísmico que abriu os primeiros grandes portais da história registrada, consumindo cidades inteiras para formar seu corpo atual. Selado por uma aliança esquecida de caçadores lendários sob as ruínas que hoje sustentam a cidade de Hornburg, permanece adormecido — mas não morto — aguardando o momento em que o selo, mantido por sua própria filha Lyblac à distância, finalmente se rompa. Relatos de sua presença aparecem apenas em registros classificados da Associação como 'Evento Nível Ômega: Contenção Absoluta'.",
        "classe": "[✦] Mago da Maldicao",
        "classe_avancada": "Necromante — Monarca das Sombras",
        "rank": "S",
        "nivel": 100,
        "estilo_luta": "Proficiência em Espadas",
        "atributos": {"forca": 99, "resistencia": 99, "velocidade": 40, "sentidos": 70, "inteligencia": 85, "poder_magico": 99},
        "elemento": "Escuridão",
        "habilidade_unica": "Véu das Almas Perdidas — torna-se completamente invulnerável enquanto três extensões de seu corpo (garra, lâmina e olho) permanecerem intactas; cada extensão destruída libera uma explosão de mana corrompida em área.",
        "titulo": "O Deus Caído, Devorador de Cidades",
        "equipamentos": {"arma": "Lâmina do Caído (fusão com o próprio corpo)", "itens": "Restos do Selo Original, Núcleo de Mana Primordial"},
        "tecnicas": ["Banimento das Almas", "Criação de Almas", "Véu das Trevas Absoluto"]
    },
    {
        "papel": "Vilão",
        "base_em": "Vide, o Deus Perverso (Octopath Traveler II)",
        "nome": "Vide, o Corruptor",
        "idade": "Incontável — entidade anterior à Associação",
        "nacionalidade": "Não-humano; fonte original da 'Sombra' que corrompe portais",
        "aparencia": "Uma presença quase sem forma fixa, alternando entre uma silhueta humanoide de fumaça negra e um vórtice de mana corrompida capaz de engolir luz ao redor. Sua manifestação física completa é rara e catastrófica.",
        "altura_peso": "Variável / sem massa fixa",
        "personalidade": "Niilista, desdenhoso da esperança humana e absolutamente convencido de que o fim de tudo é inevitável e desejável. Não sente ódio pelos caçadores que o enfrentam — apenas um desprezo calmo e cansado.",
        "historia": "Cultuado em segredo por uma seita conhecida como Ordem da Meia-Noite, Vide é apontado como a origem da 'Sombra', uma corrupção de mana que se espalha silenciosamente através de portais instáveis, transformando pessoas comuns em fanáticos dispostos a acelerar o colapso do mundo. Diferente de Galdera, que busca restauração física, Vide deseja apenas o fim — extinguir toda luz e mana do mundo para retornar ao vazio original que antecedeu a criação dos primeiros portais. A Associação trata sua existência como teoria não confirmada, mas guildas que investigaram a Ordem da Meia-Noite de perto nunca mais foram ouvidas.",
        "classe": "[✦] Mago da Maldicao",
        "classe_avancada": "Escuridao — Monarca do Vazio",
        "rank": "S",
        "nivel": 100,
        "estilo_luta": "Proficiência em Combate Desarmado",
        "atributos": {"forca": 80, "resistencia": 85, "velocidade": 78, "sentidos": 90, "inteligencia": 90, "poder_magico": 99},
        "elemento": "Escuridão",
        "habilidade_unica": "Devorador de Luz — anula temporariamente todos os efeitos de cura e buffs elementais de luz no campo de batalha, convertendo parte desse mana anulado em dano direto contra o grupo.",
        "titulo": "O Deus da Sombra Que Consome",
        "equipamentos": {"arma": "Nenhuma (manifestação de mana pura)", "itens": "Fragmentos de Fiéis Corrompidos, Núcleo da Sombra Original"},
        "tecnicas": ["Colapso do Vazio", "Sussurro Niilista", "Extinção da Aurora"]
    },
    {
        "papel": "Vilão",
        "base_em": "Trousseau (Octopath Traveler II)",
        "nome": "Trousseau",
        "idade": "29",
        "nacionalidade": "Sul-coreano, ex-membro de uma ONG de assistência médica em zonas de dungeon",
        "aparencia": "Magro e pálido, cabelos brancos, olhos vermelho-escuros marcados por olheiras profundas. Veste um manto escuro com capuz e uma máscara de peste artesanal para se proteger dos próprios venenos.",
        "altura_peso": "1,77m / 60kg",
        "personalidade": "Gentil e empático na aparência, mas quebrado por dentro, convencido de que a única cura verdadeira para o sofrimento é a extinção da própria vida. Age com calma serena mesmo cometendo atos monstruosos, genuinamente acreditando ajudar.",
        "historia": "Antigo curandeiro de campo dedicado, membro de uma organização humanitária que tratava feridos em vilas próximas a portais instáveis, Trousseau via cada vida salva como uma vitória pessoal — até perder a irmã caçula para uma doença que nenhuma poção conseguiu curar. Devastado, foi encontrado nesse momento de fragilidade por um agente da Ordem da Meia-Noite, que lhe revelou registros históricos sombrios sobre o verdadeiro custo da existência dos portais. Quebrado pelo desespero e pela revelação, Trousseau concluiu que a vida em si era a doença, e passou a usar seu conhecimento de venenos para espalhar 'chuvas de misericórdia' sobre vilas inteiras, convencido de estar livrando-as do sofrimento.",
        "classe": "[✦] Curador",
        "classe_avancada": "Musico — Monarca da Loucura",
        "rank": "A",
        "nivel": 80,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 30, "resistencia": 45, "velocidade": 40, "sentidos": 55, "inteligencia": 75, "poder_magico": 82},
        "elemento": "Planta",
        "habilidade_unica": "Chuva da Misericórdia — libera uma nuvem tóxica em área que causa dano contínuo e reduz gradualmente a resistência mágica de todos os atingidos a cada turno.",
        "titulo": "O Mestre das Pragas Silenciosas",
        "equipamentos": {"arma": "Cajado Envenenado 'Último Suspiro'", "itens": "Máscara de Peste Artesanal, Frascos de Toxinas Raras, Retrato Amarelado da Irmã"},
        "tecnicas": ["Névoa da Misericórdia", "Toque do Fim Suave", "Colapso Silencioso"]
    }
];

// =====================================
// GERAR ARQUIVOS JSON
// =====================================
const DATA_DIR = path.join(__dirname, "..", "src", "npc", "data");
const COMMANDS_DIR = path.join(__dirname, "..", "src", "commands");

// Garantir que as pastas existam
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(COMMANDS_DIR)) fs.mkdirSync(COMMANDS_DIR, { recursive: true });

let totalGerados = 0;
let erros = [];

for (const npcOriginal of NPCS) {
    try {
        // Corrigir classe
        const classe = corrigirClasse(npcOriginal.classe);
        
        // Corrigir classe avançada
        const classeAvancada = corrigirClasseAvancada(npcOriginal.classe_avancada, classe);
        
        // Corrigir elemento
        const elemento = corrigirElemento(npcOriginal.elemento);
        
        // Gerar ID
        const id = gerarId(npcOriginal.nome);
        
        // Montar NPC final
        const npc = {
            id: id,
            papel: npcOriginal.papel,
            base_em: npcOriginal.base_em,
            nome: npcOriginal.nome,
            idade: npcOriginal.idade,
            nacionalidade: npcOriginal.nacionalidade,
            aparencia: npcOriginal.aparencia,
            altura_peso: npcOriginal.altura_peso,
            personalidade: npcOriginal.personalidade,
            historia: npcOriginal.historia,
            classe: classe,
            classe_avancada: classeAvancada,
            rank: npcOriginal.rank,
            nivel: npcOriginal.nivel,
            estilo_luta: npcOriginal.estilo_luta,
            atributos: npcOriginal.atributos,
            elemento: elemento,
            habilidade_unica: npcOriginal.habilidade_unica,
            titulo: npcOriginal.titulo,
            equipamentos: npcOriginal.equipamentos,
            tecnicas: npcOriginal.tecnicas,
            formaFalar: gerarFormaFalar(npcOriginal),
            localizacao: gerarLocalizacao(npcOriginal),
            profissao: gerarProfissao(npcOriginal, classe),
            objetivos: gerarObjetivos(npcOriginal),
            valores: gerarValores(npcOriginal)
        };
        
        // Salvar JSON
        const caminhoJSON = path.join(DATA_DIR, `${id}.json`);
        fs.writeFileSync(caminhoJSON, JSON.stringify(npc, null, 2), "utf8");
        
        // Gerar comando
        gerarComando(npc);
        
        totalGerados++;
        console.log(`[OK] NPC gerado: ${npc.nome} (${id}) - Classe: ${classe} - Avançada: ${classeAvancada}`);
    } catch (err) {
        erros.push(`${npcOriginal.nome}: ${err.message}`);
        console.error(`[ERRO] Falha ao gerar ${npcOriginal.nome}:`, err.message);
    }
}

console.log(`\n========================================`);
console.log(`Total de NPCs gerados: ${totalGerados}`);
if (erros.length > 0) {
    console.log(`Erros: ${erros.length}`);
    erros.forEach(e => console.log(`  - ${e}`));
}
console.log(`========================================`);

// =====================================
// FUNÇÕES AUXILIARES PARA GERAR CAMPOS EXTRAS
// =====================================
function gerarFormaFalar(npc) {
    const papel = (npc.papel || "").toLowerCase();
    if (papel.includes("vil")) {
        return "Fala com tom frio e calculista, frequentemente manipulando as palavras para obter vantagem. Suas frases são precisas e raramente revelam emoções verdadeiras.";
    }
    if (npc.classe && npc.classe.includes("Curador")) {
        return "Fala com calma e compaixão, usando palavras gentis e encorajadoras. Sempre disposto a ajudar e confortar os feridos.";
    }
    if (npc.classe && npc.classe.includes("Assassino")) {
        return "Fala de forma direta e observadora, raramente revelando mais do que o necessário. Prefere ações a palavras.";
    }
    if (npc.classe && npc.classe.includes("Lutador")) {
        return "Fala com determinação e honra, valorizando a força e a coragem. Suas palavras são firmes e inspiradoras.";
    }
    if (npc.classe && npc.classe.includes("Ranger")) {
        return "Fala de forma prática e observadora, com um tom calmo e conectado à natureza. Prefere demonstrar habilidade a falar sobre ela.";
    }
    if (npc.classe && npc.classe.includes("Mago")) {
        return "Fala com inteligência e curiosidade, frequentemente fazendo referências a conhecimentos arcanos. Suas explicações são detalhadas e precisas.";
    }
    return "Fala de forma natural e amigável, adaptando o tom conforme a situação.";
}

function gerarLocalizacao(npc) {
    const papel = (npc.papel || "").toLowerCase();
    if (papel.includes("vil")) {
        return "Localização desconhecida — opera nas sombras";
    }
    return "Coreia do Sul";
}

function gerarProfissao(npc, classe) {
    const papel = (npc.papel || "").toLowerCase();
    if (papel.includes("vil")) {
        return "Antagonista";
    }
    return `Caçador(a) ${classe}`;
}

function gerarObjetivos(npc) {
    const papel = (npc.papel || "").toLowerCase();
    if (papel.includes("vil")) {
        return "Expandir seu poder e influência, eliminando qualquer ameaça aos seus planos.";
    }
    return "Proteger os inocentes, evoluir como caçador e desvendar os mistérios dos portais.";
}

function gerarValores(npc) {
    const papel = (npc.papel || "").toLowerCase();
    if (papel.includes("vil")) {
        return "O poder é o único caminho. A fraqueza é imperdoável. Os fins justificam os meios.";
    }
    return "A vida é preciosa. A coragem é essencial. A lealdade é inegociável.";
}

// =====================================
// GERAR COMANDO PARA CADA NPC
// =====================================
function gerarComando(npc) {
    const id = npc.id;
    const nome = npc.nome;
    const titulo = npc.titulo;
    const classe = npc.classe;
    const classeAvancada = npc.classe_avancada;
    const rank = npc.rank;
    const nivel = npc.nivel;
    const elemento = npc.elemento;
    const habilidade = npc.habilidade_unica;
    const tecnicas = npc.tecnicas || [];
    const atributos = npc.atributos;
    
    const conteudo = `/**
 * COMANDO: !${id}
 * 
 * Exibe a ficha completa do NPC ${nome}.
 * 
 * Uso:
 * - !${id} - Exibe a ficha do NPC
 * - !${id} ficha - Exibe a ficha detalhada
 * - !${id} conversar - Inicia conversa com o NPC
 */

const NPCManager = require("../npc/npcManager");

module.exports = async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    const numero = msg.author || msg.from;
    
    // Buscar NPC
    const npc = NPCManager.carregarNPC("${id}");
    
    if (!npc) {
        return msg.reply("*✖ NPC não encontrado.*");
    }
    
    // =====================================
    // !${id} ficha - Exibe ficha detalhada
    // =====================================
    if (texto === "!${id} ficha" || texto === "!${id} ficha completa") {
        let mensagem = \`*═══ FICHA DE ${nome.toUpperCase()} ═══*\n\`;
        mensagem += \`──────────────────────────\n\n\`;
        mensagem += \`*IDENTIDADE*\n\`;
        mensagem += \`> *Nome:* \${npc.nome}\n\`;
        mensagem += \`> *Título:* \${npc.titulo}\n\`;
        mensagem += \`> *Papel:* \${npc.papel}\n\`;
        mensagem += \`> *Idade:* \${npc.idade}\n\`;
        mensagem += \`> *Nacionalidade:* \${npc.nacionalidade}\n\`;
        mensagem += \`> *Localização:* \${npc.localizacao}\n\n\`;
        mensagem += \`*APARÊNCIA*\n\`;
        mensagem += \`> \${npc.aparencia}\n\`;
        mensagem += \`> *Altura/Peso:* \${npc.altura_peso}\n\n\`;
        mensagem += \`*PERSONALIDADE*\n\`;
        mensagem += \`> \${npc.personalidade}\n\n\`;
        mensagem += \`*HISTÓRIA*\n\`;
        mensagem += \`> \${npc.historia}\n\n\`;
        mensagem += \`*CLASSE*\n\`;
        mensagem += \`> *Classe:* \${npc.classe}\n\`;
        mensagem += \`> *Classe Avançada:* \${npc.classe_avancada}\n\`;
        mensagem += \`> *Rank:* \${npc.rank} | *Nível:* \${npc.nivel}\n\`;
        mensagem += \`> *Elemento:* \${npc.elemento}\n\n\`;
        mensagem += \`*ATRIBUTOS*\n\`;
        mensagem += \`> *Força:* \${npc.atributos.forca}\n\`;
        mensagem += \`> *Resistência:* \${npc.atributos.resistencia}\n\`;
        mensagem += \`> *Velocidade:* \${npc.atributos.velocidade}\n\`;
        mensagem += \`> *Sentidos:* \${npc.atributos.sentidos}\n\`;
        mensagem += \`> *Inteligência:* \${npc.atributos.inteligencia}\n\`;
        mensagem += \`> *Poder Mágico:* \${npc.atributos.poder_magico}\n\n\`;
        mensagem += \`*HABILIDADE ÚNICA*\n\`;
        mensagem += \`> \${npc.habilidade_unica}\n\n\`;
        mensagem += \`*TÉCNICAS*\n\`;
        (npc.tecnicas || []).forEach(t => {
            mensagem += \`> ✦ \${t}\n\`;
        });
        mensagem += \`\n──────────────────────────\n\`;
        mensagem += \`_Para conversar com \${npc.nome}, use:_\n\`;
        mensagem += \`> !\${npc.id}\n\`;
        mensagem += \`> Sua mensagem aqui\`;
        
        await msg.reply(mensagem);
        return;
    }
    
    // =====================================
    // !${id} - Exibe ficha resumida
    // =====================================
    let mensagem = \`*═══ \${npc.nome.toUpperCase()} ═══*\n\`;
    mensagem += \`──────────────────────────\n\n\`;
    mensagem += \`*"\${npc.titulo}"*\n\n\`;
    mensagem += \`*Papel:* \${npc.papel}\n\`;
    mensagem += \`*Classe:* \${npc.classe}\n\`;
    mensagem += \`*Classe Avançada:* \${npc.classe_avancada}\n\`;
    mensagem += \`*Rank:* \${npc.rank} | *Nível:* \${npc.nivel}\n\`;
    mensagem += \`*Elemento:* \${npc.elemento}\n\n\`;
    mensagem += \`*Aparência:*\n\`;
    mensagem += \`> \${npc.aparencia}\n\n\`;
    mensagem += \`*Personalidade:*\n\`;
    mensagem += \`> \${npc.personalidade}\n\n\`;
    mensagem += \`*Habilidade Única:*\n\`;
    mensagem += \`> \${npc.habilidade_unica}\n\n\`;
    mensagem += \`*Técnicas:*\n\`;
    (npc.tecnicas || []).forEach(t => {
        mensagem += \`> ✦ \${t}\n\`;
    });
    mensagem += \`\n──────────────────────────\n\`;
    mensagem += \`*Comandos:*\n\`;
    mensagem += \`> !\${npc.id} ficha - Ficha completa\n\`;
    mensagem += \`> !\${npc.id} conversar - Conversar com o NPC\n\`;
    mensagem += \`\n_Para conversar, envie:_\n\`;
    mensagem += \`> !\${npc.id}\n\`;
    mensagem += \`> Sua mensagem aqui\`;
    
    await msg.reply(mensagem);
};
`;

    const caminhoComando = path.join(COMMANDS_DIR, `npc_${id}.js`);
    fs.writeFileSync(caminhoComando, conteudo, "utf8");
    console.log(`[OK] Comando gerado: npc_${id}.js`);
}

// =====================================
// GERAR ROTINAS PARA O SCHEDULER
// =====================================
function gerarRotinas() {
    let rotinas = `// ROTINAS GERADAS AUTOMATICAMENTE PARA OS NPCs\n`;
    
    for (const npcOriginal of NPCS) {
        const id = gerarId(npcOriginal.nome);
        const nome = npcOriginal.nome;
        const papel = (npcOriginal.papel || "").toLowerCase();
        
        if (papel.includes("vil")) {
            rotinas += `\n// ROTINA PADRAO DO ${nome.toUpperCase()}\n`;
            rotinas += `cadastrarRotina("${id}", [\n`;
            rotinas += `    { hora: 0, acao: "Vigilancia", descricao: "${nome} observa seus dominios nas sombras.", disponivel: false },\n`;
            rotinas += `    { hora: 6, acao: "Planejamento", descricao: "${nome} planeja seus proximos movimentos.", disponivel: false },\n`;
            rotinas += `    { hora: 12, acao: "Manipulacao", descricao: "${nome} manipula aliados e inimigos nos bastidores.", disponivel: true },\n`;
            rotinas += `    { hora: 18, acao: "Execucao", descricao: "${nome} executa seus planos sombrios.", disponivel: true },\n`;
            rotinas += `    { hora: 22, acao: "Recolhimento", descricao: "${nome} se recolhe para recuperar forcas.", disponivel: false }\n`;
            rotinas += `]);\n`;
        } else {
            rotinas += `\n// ROTINA PADRAO DO ${nome.toUpperCase()}\n`;
            rotinas += `cadastrarRotina("${id}", [\n`;
            rotinas += `    { hora: 6, acao: "Acorda e se prepara", descricao: "${nome} acorda e se prepara para o dia.", disponivel: false },\n`;
            rotinas += `    { hora: 8, acao: "Atende cacadores", descricao: "${nome} atende cacadores que buscam ajuda.", disponivel: true },\n`;
            rotinas += `    { hora: 12, acao: "Almoca", descricao: "${nome} faz uma pausa para almocar.", disponivel: false },\n`;
            rotinas += `    { hora: 13, acao: "Treina habilidades", descricao: "${nome} treina suas habilidades de combate.", disponivel: true },\n`;
            rotinas += `    { hora: 18, acao: "Atende novamente", descricao: "${nome} retoma o atendimento aos cacadores.", disponivel: true },\n`;
            rotinas += `    { hora: 21, acao: "Descansa", descricao: "${nome} descansa apos um longo dia.", disponivel: false },\n`;
            rotinas += `    { hora: 23, acao: "Dormindo", descricao: "${nome} esta dormindo.", disponivel: false }\n`;
            rotinas += `]);\n`;
        }
    }
    
    return rotinas;
}

// Salvar rotinas geradas
const rotinasGeradas = gerarRotinas();
const caminhoRotinas = path.join(__dirname, "..", "src", "npc", "rotinas_geradas.js");
fs.writeFileSync(caminhoRotinas, rotinasGeradas, "utf8");
console.log(`[OK] Rotinas geradas em rotinas_geradas.js`);