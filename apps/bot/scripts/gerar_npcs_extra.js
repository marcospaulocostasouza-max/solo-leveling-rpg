/**
 * GERADOR DE NPCs EXTRAS
 * 
 * Gera todos os NPCs dos datasets:
 * - Octopath Traveler 0 (OT0)
 * - Octopath Traveler: Champions of the Continent (CotC)
 * - Vilões/Bosses do OT1
 * - Vilões complementares
 * - Vilões da Ordem da Meia-Noite (OT2)
 * 
 * Com classes corrigidas para as válidas do sistema.
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
    "Hrymir", "Freyr", "Berserk", "Herói do Escudo", "Construtor",
    "Paladino", "Escudeiro", "Uthabiti", "Morax", "Viking",
    "Herói da Espada", "Monge", "Samurai", "Inquisitor", "Esgrimista",
    "Lâmina Sombria", "Sword Dancer", "Corsário", "Shinobi", "Thanakir",
    "Palhaço", "Ardito", "Raijin", "Herói da Lança",
    "Pneuma-Ousia", "Rastreador", "Andarilho",
    "Herói do Arco", "Harmonic", "Chefe", "Domador",
    "Apotecário", "Músico", "Oráculo", "Estigmas", "Nazhir",
    "Calamitas", "Mago de Luz",
    "Alquimista", "Grande Mago", "Feiticeiros", "Druida", "Catalys",
    "Archon", "Warden", "Arcanista", "Taoísta", "Sábio", "Mago Rúnico",
    "Onmyouji", "Bruxo", "Mago de Ignição",
    "Necromante", "Taumaturgo", "Bokor", "Mago de Escuridão", "Nidhogg"
];

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
    
    const mapa = {
        "arquiteta": "Lutador",
        "maga": "Mago Elemental",
        "mago elemental": "Mago Elemental",
        "mago da maldicao": "Mago de Maldição",
        "mago da maldição": "Mago de Maldição",
        "mago de maldicao": "Mago de Maldição",
        "mago de maldição": "Mago de Maldição",
        "mago de luz": "Mago Elemental",
        "mago invocador": "Mago Invocador",
        "mago de barreira": "Mago de Barreira",
        "mago": "Mago Elemental",
        "assassino": "Assassino",
        "ranger": "Ranger",
        "curador": "Curador",
        "lutador": "Lutador",
        "tanker": "Tanker"
    };
    
    for (const classe of CLASSES_INICIAIS) {
        if (classeLower === classe.toLowerCase()) return classe;
    }
    for (const [chave, valor] of Object.entries(mapa)) {
        if (classeLower.includes(chave)) return valor;
    }
    return "Lutador";
}

function corrigirClasseAvancada(classeAvancadaOriginal, classeInicial) {
    if (!classeAvancadaOriginal) return "Nenhuma";
    
    let classe = classeAvancadaOriginal.split("—")[0].trim();
    classe = classe.split("-")[0].trim();
    classe = classe.replace(/Monarca.*/i, "").trim();
    classe = classe.replace(/monarca.*/i, "").trim();
    classe = classe.replace(/\s+/g, " ").trim();
    if (!classe) return "Nenhuma";
    
    const classeLower = classe.toLowerCase();
    for (const ca of CLASSES_AVANCADAS) {
        if (classeLower === ca.toLowerCase()) {
            const disponiveis = MAPA_CLASSE_AVANCADA[classeInicial] || [];
            if (disponiveis.some(c => c.toLowerCase() === classeLower)) return ca;
            return disponiveis[0] || "Nenhuma";
        }
    }
    
    const mapaAvancada = {
        "engenheira de cerco": "Construtor",
        "atirador de precisao": "Herói do Arco",
        "sacerdotisa da chama azul": "Mago de Luz",
        "lamina contratada": "Lâmina Sombria",
        "medica de emergencia": "Apotecário",
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
        "imperatriz do tempo congelado": "Sábio",
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
    
    for (const [chave, valor] of Object.entries(mapaAvancada)) {
        if (classeLower.includes(chave)) {
            const disponiveis = MAPA_CLASSE_AVANCADA[classeInicial] || [];
            if (disponiveis.some(c => c.toLowerCase() === valor.toLowerCase())) return valor;
            return disponiveis[0] || "Nenhuma";
        }
    }
    
    const disponiveis = MAPA_CLASSE_AVANCADA[classeInicial] || [];
    return disponiveis[0] || "Nenhuma";
}

function corrigirElemento(elementoOriginal) {
    if (!elementoOriginal) return "Fogo";
    const elementoLower = elementoOriginal.toLowerCase();
    const mapa = {
        "luz": "Luz", "raio": "Raio", "metal": "Metal", "terra": "Terra",
        "escuridão": "Escuridão", "escuridao": "Escuridão", "vento": "Vento",
        "gelo": "Gelo", "planta": "Planta", "fogo": "Fogo", "água": "Água",
        "agua": "Água", "cristal": "Cristal", "sombra": "Sombra",
        "madeira": "Madeira", "tempestade": "Tempestade", "lava": "Lava",
        "fumaça": "Fumaça", "fumaca": "Fumaça", "areia": "Areia"
    };
    for (const [chave, valor] of Object.entries(mapa)) {
        if (elementoLower.includes(chave)) return valor;
    }
    return "Fogo";
}

// =====================================
// DADOS DOS NPCs EXTRAS
// =====================================
const NPCS = [
    // ===== OT0 =====
    {
        "papel": "Heroína", "base_em": "Stia (Octopath Traveler 0)", "nome": "Stia Han",
        "idade": "19", "nacionalidade": "Sul-coreana, de uma pequena vila reconstruída após um colapso de dungeon",
        "aparencia": "Cabelos castanho-avermelhados curtos, sempre com um cinto de ferramentas na cintura e luvas de trabalho gastas. Veste um macacão reforçado com placas leves e carrega um martelo de guerra adaptado de suas ferramentas de construção.",
        "altura_peso": "1,60m / 50kg",
        "personalidade": "Prática, teimosa e incapaz de desistir de um projeto pela metade. Esconde a dor da perda por trás de listas de tarefas e reconstrução constante, mas floresce ao ver a comunidade renascer graças ao próprio esforço.",
        "historia": "Amiga de infância do protagonista, Stia perdeu quase tudo quando sua vila foi arrasada por uma horda de monstros escapada de um portal instável. Em vez de fugir, decidiu ficar e reconstruir, despertando como Caçadora ao erguer sozinha uma viga que selava a passagem de criaturas. Hoje lidera a reconstrução de comunidades devastadas por portais.",
        "classe": "[✦] Arquiteta", "classe_avancada": "Engenheira de Cerco", "rank": "A", "nivel": 78,
        "estilo_luta": "Proficiência em Martelos e Ferramentas Pesadas",
        "atributos": {"forca": 72, "resistencia": 80, "velocidade": 35, "sentidos": 50, "inteligencia": 65, "poder_magico": 20},
        "elemento": "Terra",
        "habilidade_unica": "Fortificação de Emergência — ergue instantaneamente barreiras de escombros ao redor do grupo, reduzindo o dano recebido por 2 turnos e impedindo o cerco de inimigos à distância.",
        "titulo": "A Reconstrutora de Wishvale",
        "equipamentos": {"arma": "Martelo de Guerra Improvisado", "itens": "Cinto de Ferramentas Reforçado, Plantas de Reconstrução, Capacete de Obra Encantado"},
        "tecnicas": ["Golpe da Fundação", "Erguer Barricada", "Demolição Calculada"]
    },
    {
        "papel": "Herói", "base_em": "Phenn (Octopath Traveler 0)", "nome": "Phenn Doyoung",
        "idade": "18", "nacionalidade": "Sul-coreano, de uma vila interiorana destruída em um ataque de portal",
        "aparencia": "Magro e de aparência mais jovem do que a idade real, cabelos claros bagunçados, veste um casaco de caça leve com um arco compacto sempre à mão. Carrega um amuleto simples dado por sua falecida mãe.",
        "altura_peso": "1,70m / 58kg",
        "personalidade": "Gentil, inseguro e frequentemente subestimado por causa da aparência frágil, mas cresce em coragem quando alguém que ama está em perigo.",
        "historia": "Amigo de infância de Stia, Phenn ficou preso em uma gruta gelada após o ataque que destruiu sua vila, sobrevivendo sozinho por dias até ser resgatado. O trauma o fez treinar obsessivamente com arco, e seu Despertar ocorreu durante uma nova incursão.",
        "classe": "[✦] Ranger", "classe_avancada": "Atirador de Precisão", "rank": "B", "nivel": 60,
        "estilo_luta": "Proficiência em Arcos",
        "atributos": {"forca": 40, "resistencia": 45, "velocidade": 62, "sentidos": 75, "inteligencia": 50, "poder_magico": 22},
        "elemento": "Gelo",
        "habilidade_unica": "Tiro da Sobrevivência — concentra-se por um turno e depois desfere um disparo crítico garantido contra o inimigo mais próximo de derrotar um aliado.",
        "titulo": "O Batedor de Snowshard",
        "equipamentos": {"arma": "Arco Curto de Caça", "itens": "Amuleto Materno, Carcás Reforçado, Kit de Rastreamento Improvisado"},
        "tecnicas": ["Flecha Calculada", "Retirada Tática", "Disparo do Resgate"]
    },
    {
        "papel": "Heroína", "base_em": "Laurana (Octopath Traveler 0)", "nome": "Laurana Bae",
        "idade": "20", "nacionalidade": "Sul-coreana, neta de uma sacerdotisa morta em um ataque de guilda criminosa",
        "aparencia": "Cabelos loiro-acinzentados presos em uma trança longa, veste um manto cerimonial azul rasgado e remendado várias vezes. Carrega um cajado entalhado que pertenceu à avó.",
        "altura_peso": "1,62m / 51kg",
        "personalidade": "Doce e devota, mas carregando culpa e raiva reprimidas pela morte da avó diante de seus olhos. Luta internamente entre o desejo de perdoar e a vontade de que os responsáveis paguem.",
        "historia": "Neta de uma respeitada sacerdotisa-curandeira, Laurana testemunhou sua avó ser executada por mercenários de uma guilda corrupta. Seu Despertar veio da fúria e do desespero, canalizados em uma explosão de luz.",
        "classe": "[✦] Curador", "classe_avancada": "Sacerdotisa da Chama Azul", "rank": "A", "nivel": 82,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 25, "resistencia": 42, "velocidade": 38, "sentidos": 58, "inteligencia": 72, "poder_magico": 85},
        "elemento": "Luz",
        "habilidade_unica": "Chama Azul da Vigília — invoca uma chama protetora que cura o grupo a cada turno e queima qualquer inimigo que tente atacar um aliado com menos de 30% de HP.",
        "titulo": "A Guardiã da Chama Ancestral",
        "equipamentos": {"arma": "Cajado Herdado da Avó", "itens": "Manto Cerimonial Remendado, Incensário Ritual, Relicário de Família"},
        "tecnicas": ["Bênção da Chama", "Julgamento Silencioso", "Vigília Curativa"]
    },
    {
        "papel": "Herói", "base_em": "Celsus (Octopath Traveler 0)", "nome": "Celsus Park",
        "idade": "27", "nacionalidade": "Sul-coreano, mercenário independente sediado em Valore",
        "aparencia": "Alto e magro, capuz sempre erguido sobre olhos calculistas, veste roupas escuras de infiltração cheias de bolsos para adagas escondidas.",
        "altura_peso": "1,79m / 66kg",
        "personalidade": "Cético em relação a fé e devoção alheia, testa constantemente as intenções de quem o contrata antes de aceitar qualquer trabalho.",
        "historia": "Ex-agente de uma guilda de recuperação de itens, Celsus tornou-se mercenário independente após presenciar companheiros traírem um contrato. Seu Despertar ocorreu durante uma fuga de uma dungeon armadilhada.",
        "classe": "[✦] Assassino", "classe_avancada": "Lâmina Contratada", "rank": "B", "nivel": 63,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 52, "resistencia": 40, "velocidade": 70, "sentidos": 68, "inteligencia": 55, "poder_magico": 20},
        "elemento": "Sombra",
        "habilidade_unica": "Julgamento do Contrato — avalia as intenções do alvo antes do combate; se identificar traição ou má-fé, garante o próximo golpe como acerto crítico automático.",
        "titulo": "A Lâmina que Questiona",
        "equipamentos": {"arma": "Par de Adagas Simples", "itens": "Capuz de Infiltração, Contrato em Branco, Kit de Interrogatório Silencioso"},
        "tecnicas": ["Corte de Avaliação", "Retirada Sombria", "Golpe da Desconfiança"]
    },
    {
        "papel": "Heroína", "base_em": "Macy (Octopath Traveler 0)", "nome": "Macy Eun",
        "idade": "24", "nacionalidade": "Sul-coreana, curandeira itinerante de Emberglow",
        "aparencia": "Rosto sempre cansado mas sorridente, cabelos castanhos presos displicentemente, veste um avental de curandeira sobre roupas simples de viagem.",
        "altura_peso": "1,64m / 54kg",
        "personalidade": "Calorosa, incansável e incapaz de recusar quem precisa de ajuda, mesmo quando isso significa noites sem dormir.",
        "historia": "Filha de uma família de curandeiros que perdeu a clínica quando um portal se abriu no centro de Emberglow, Macy passou a atender feridos em barracas improvisadas. Seu Despertar aconteceu ao tratar uma criança gravemente ferida.",
        "classe": "[✦] Curador", "classe_avancada": "Médica de Emergência", "rank": "C", "nivel": 55,
        "estilo_luta": "Proficiência em Machados",
        "atributos": {"forca": 48, "resistencia": 55, "velocidade": 38, "sentidos": 45, "inteligencia": 60, "poder_magico": 58},
        "elemento": "Planta",
        "habilidade_unica": "Triagem Instantânea — cura o aliado com menor porcentagem de HP no grupo, com bônus de cura proporcional à gravidade do ferimento.",
        "titulo": "A Curandeira das Ruínas",
        "equipamentos": {"arma": "Machado de Colheita Simples", "itens": "Bolsa de Ervas Improvisada, Avental de Curandeira, Frasco de Herbal de Fortificação"},
        "tecnicas": ["Golpe de Emergência", "Cura Rápida", "Estabilização Vital"]
    },
    {
        "papel": "Heroína", "base_em": "Alexia (Octopath Traveler 0)", "nome": "Alexia Song",
        "idade": "26", "nacionalidade": "Sul-coreana, bibliotecária da Grande Biblioteca de Theatropolis",
        "aparencia": "Postura elegante e reservada, óculos finos, cabelos negros presos em coque impecável. Veste vestes acadêmicas escuras e carrega sempre um orbe de cristal.",
        "altura_peso": "1,68m / 58kg",
        "personalidade": "Meticulosa, discreta e movida por um mistério pessoal que raramente compartilha. Trata conhecimento como um tesouro a ser protegido.",
        "historia": "Bibliotecária responsável por arquivos que a Associação prefere manter fora do público, Alexia começou a investigar fragmentos de cartas antigas sobre uma conspiração ligada à origem de certos portais.",
        "classe": "[✦] Mago Elemental", "classe_avancada": "Guardiã dos Arquivos", "rank": "A", "nivel": 85,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 22, "resistencia": 40, "velocidade": 42, "sentidos": 62, "inteligencia": 90, "poder_magico": 84},
        "elemento": "Raio",
        "habilidade_unica": "Fragmento Revelado — consome um turno para decifrar a estratégia do inimigo, revelando todos os seus próximos ataques ao grupo pelo resto da batalha.",
        "titulo": "A Bibliotecária dos Segredos Proibidos",
        "equipamentos": {"arma": "Orbe de Cristal Codificado", "itens": "Pilha de Cartas Fragmentadas, Óculos de Leitura Arcana, Selo da Biblioteca"},
        "tecnicas": ["Raio Analítico", "Decifração de Combate", "Explosão de Dados Arcanos"]
    },
    {
        "papel": "Herói", "base_em": "Viator (Octopath Traveler 0)", "nome": "Viator Yoon",
        "idade": "31", "nacionalidade": "Sul-coreano, guerreiro errante em busca de relíquias lendárias",
        "aparencia": "Corpo robusto coberto de cicatrizes, cabelos curtos raspados nas laterais, veste armadura pesada simples sem ornamentos.",
        "altura_peso": "1,90m / 98kg",
        "personalidade": "Direto, disciplinado e obcecado por aperfeiçoar sua força através do combate honesto. Prefere golpes poucos e decisivos.",
        "historia": "Guerreiro sem guilda fixa, Viator encontrou durante uma expedição uma chave antiga que, segundo lendas locais, abre o caminho para relíquias perdidas. Viaja reunindo pistas sobre as relíquias.",
        "classe": "[✦] Lutador", "classe_avancada": "Colecionador de Relíquias", "rank": "B", "nivel": 68,
        "estilo_luta": "Proficiência em Espadas",
        "atributos": {"forca": 85, "resistencia": 82, "velocidade": 45, "sentidos": 48, "inteligencia": 35, "poder_magico": 15},
        "elemento": "Terra",
        "habilidade_unica": "Postura do Guerreiro Errante — reduz o dano recebido pela metade por 2 turnos em troca de reduzir seu número de ataques, priorizando golpes poucos porém devastadores.",
        "titulo": "O Caçador de Relíquias Perdidas",
        "equipamentos": {"arma": "Espada Larga Simples", "itens": "Chave Antiga Entalhada, Armadura de Placas Sem Ornamentos, Diário de Lendas"},
        "tecnicas": ["Golpe Decisivo", "Postura Inabalável", "Corte da Relíquia"]
    },
    {
        "papel": "Herói", "base_em": "Ludo (Octopath Traveler 0)", "nome": "Ludo Wei",
        "idade": "29", "nacionalidade": "Sul-coreano, comerciante de rotas entre Sunshade e comunidades vizinhas",
        "aparencia": "Sorriso fácil e postura confiante, cabelos negros curtos, veste um colete de viagem cheio de bolsos e carrega duas adagas curvas.",
        "altura_peso": "1,74m / 70kg",
        "personalidade": "Sociável, pragmático e sem nenhum apego a facções ou guildas específicas. Vê oportunidades onde outros veem apenas problemas.",
        "historia": "Vindo de fora da região, Ludo se estabeleceu como residente após a reconstrução da comunidade, tornando-se o elo comercial entre ela e cidades vizinhas. Seu Despertar aconteceu ao defender uma caravana.",
        "classe": "[✦] Assassino", "classe_avancada": "Mediador de Rotas", "rank": "A", "nivel": 76,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 45, "resistencia": 38, "velocidade": 65, "sentidos": 60, "inteligencia": 58, "poder_magico": 22},
        "elemento": "Vento",
        "habilidade_unica": "Rota Segura — negocia uma trégua temporária com um inimigo de menor rank, removendo-o do combate por 2 turnos em troca de itens do inventário.",
        "titulo": "O Mediador Sem Bandeira",
        "equipamentos": {"arma": "Par de Adagas de Comércio", "itens": "Colete Multibolsos, Registro de Rotas Comerciais, Bússola de Negociação"},
        "tecnicas": ["Corte da Barganha", "Retirada Comercial", "Golpe da Rota Livre"]
    },
    {
        "papel": "Heroína", "base_em": "Carinda (Octopath Traveler 0)", "nome": "Carinda Moon",
        "idade": "38", "nacionalidade": "Sul-coreana, comerciante veterana de Donescu",
        "aparencia": "Postura firme e maternal, cabelos grisalhos presos em um coque prático, veste roupas de viagem reforçadas com um cinto cheio de bolsas de moedas.",
        "altura_peso": "1,66m / 60kg",
        "personalidade": "Determinada e generosa com quem mais precisa, mas dura em negociações quando sabe que pode obter mais para investir na comunidade.",
        "historia": "Comerciante experiente que dedicou a vida a organizar missões de alívio para vilas atingidas por colapsos de dungeon, Carinda despertou durante uma dessas missões ao proteger um comboio.",
        "classe": "[✦] Assassino", "classe_avancada": "Coordenadora de Alívio", "rank": "C", "nivel": 58,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 42, "resistencia": 50, "velocidade": 48, "sentidos": 55, "inteligencia": 62, "poder_magico": 25},
        "elemento": "Metal",
        "habilidade_unica": "Rede de Alívio — distribui suprimentos de emergência ao grupo, curando uma pequena porção de HP de todos os aliados e removendo um debuff cada.",
        "titulo": "A Comerciante dos Comboios de Socorro",
        "equipamentos": {"arma": "Par de Adagas Curtas", "itens": "Balança de Avaliação, Cinto de Bolsas de Moedas, Registro de Missões de Alívio"},
        "tecnicas": ["Corte de Proteção", "Distribuição de Emergência", "Investida do Comboio"]
    },
    {
        "papel": "Herói", "base_em": "Pius (Octopath Traveler 0)", "nome": "Pius Kang",
        "idade": "23", "nacionalidade": "Sul-coreano, clérigo em luto de Cragspear",
        "aparencia": "Semblante sereno mas cansado, cabelos castanho-claros curtos, veste mantos clericais simples e carrega um cajado com um pequeno relicário preso ao topo.",
        "altura_peso": "1,77m / 64kg",
        "personalidade": "Gentil e contemplativo, ainda processando o luto pela perda da mãe. Encontra propósito ajudando outros a lidar com perdas semelhantes.",
        "historia": "Depois de perder a mãe em uma incursão de monstros, Pius passou a visitar regularmente o túmulo dela. Seu Despertar aconteceu quando um monstro atacou o cemitério e ele canalizou luz protetora.",
        "classe": "[✦] Curador", "classe_avancada": "Acompanhante do Luto", "rank": "C", "nivel": 54,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 24, "resistencia": 38, "velocidade": 35, "sentidos": 50, "inteligencia": 58, "poder_magico": 62},
        "elemento": "Luz",
        "habilidade_unica": "Consolo Silencioso — remove todos os debuffs de medo e pânico do grupo e concede resistência temporária a efeitos de terror por 3 turnos.",
        "titulo": "O Clérigo dos Túmulos Silenciosos",
        "equipamentos": {"arma": "Cajado com Relicário Materno", "itens": "Manto Clerical Simples, Incenso de Memória, Flores Secas de Cemitério"},
        "tecnicas": ["Luz da Memória", "Cura Contemplativa", "Escudo do Luto"]
    },
    {
        "papel": "Heroína", "base_em": "Saoirse (Octopath Traveler 0)", "nome": "Saoirse Ryu",
        "idade": "22", "nacionalidade": "Sul-coreana, dançarina residente do Anfiteatro de Theatropolis",
        "aparencia": "Cabelos ruivos longos soltos, figurino de dança vibrante adaptado com fitas reforçadas para combate.",
        "altura_peso": "1,63m / 52kg",
        "personalidade": "Carismática, intuitiva quanto às emoções alheias e apaixonada por transformar tragédia em arte que inspira esperança.",
        "historia": "Dançarina residente do Anfiteatro de Theatropolis, Saoirse ganhou fama transformando histórias de sobreviventes em performances emocionantes. Seu Despertar aconteceu durante uma apresentação interrompida por um ataque de monstro.",
        "classe": "[✦] Assassino", "classe_avancada": "Artista das Ruínas", "rank": "A", "nivel": 84,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 38, "resistencia": 35, "velocidade": 68, "sentidos": 65, "inteligencia": 48, "poder_magico": 40},
        "elemento": "Cristal",
        "habilidade_unica": "Performance de Esperança — sua dança em combate cura levemente o grupo a cada turno enquanto ativa, além de elevar a taxa crítica de todos os aliados próximos.",
        "titulo": "A Estrela do Anfiteatro",
        "equipamentos": {"arma": "Fitas de Combate Reforçadas", "itens": "Figurino Vibrante de Apresentação, Cartaz do Evento Beneficente, Sapatilhas Encantadas"},
        "tecnicas": ["Giro da Esperança", "Passo Hipnótico", "Fita da Salvação"]
    },
    {
        "papel": "Herói", "base_em": "Xerc (Octopath Traveler 0)", "nome": "Xerc Baek",
        "idade": "25", "nacionalidade": "Sul-coreano, estudioso justiceiro de Grandport",
        "aparencia": "Óculos redondos, cabelos negros bagunçados, veste um casaco acadêmico modesto sobre roupas simples. Carrega um cajado de madeira gasto.",
        "altura_peso": "1,75m / 62kg",
        "personalidade": "Idealista, incapaz de fechar os olhos diante de injustiça mesmo quando isso o coloca em desvantagem.",
        "historia": "Estudioso de Grandport especializado em documentar abusos cometidos por nobres contra populações vulneráveis. Despertou ao confrontar um nobre corrupto que explorava trabalhadores.",
        "classe": "[✦] Mago Elemental", "classe_avancada": "Estudioso da Justiça", "rank": "A", "nivel": 80,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 26, "resistencia": 40, "velocidade": 44, "sentidos": 58, "inteligencia": 85, "poder_magico": 80},
        "elemento": "Raio",
        "habilidade_unica": "Dossiê de Provas — revela publicamente as falhas de defesa do inimigo, reduzindo permanentemente sua resistência física e mágica pelo resto do combate.",
        "titulo": "O Estudioso dos Nobres Corruptos",
        "equipamentos": {"arma": "Cajado de Madeira Gasto", "itens": "Casaco Acadêmico Modesto, Dossiê de Corrupção, Óculos Redondos"},
        "tecnicas": ["Raio da Verdade", "Exposição Pública", "Julgamento do Estudioso"]
    },
    {
        "papel": "Heroína", "base_em": "Delitia (Octopath Traveler 0)", "nome": "Delitia Song",
        "idade": "21", "nacionalidade": "Sul-coreana, caçadora de Emberglow em busca do irmão desaparecido",
        "aparencia": "Atlética e competitiva, cabelos castanhos presos em rabo de cavalo alto, veste roupas de caça leves e carrega um arco composto.",
        "altura_peso": "1,69m / 58kg",
        "personalidade": "Competitiva ao extremo, desafia qualquer caçador que cruze seu caminho para testar suas próprias habilidades.",
        "historia": "Caçadora talentosa de Emberglow, Delitia passou a desafiar outros caçadores em duelos na esperança de ficar forte o bastante para encontrar o irmão desaparecido.",
        "classe": "[✦] Ranger", "classe_avancada": "Caçadora de Duelos", "rank": "B", "nivel": 66,
        "estilo_luta": "Proficiência em Arcos",
        "atributos": {"forca": 55, "resistencia": 48, "velocidade": 72, "sentidos": 78, "inteligencia": 40, "poder_magico": 20},
        "elemento": "Vento",
        "habilidade_unica": "Desafio Aberto — provoca o inimigo mais forte em campo a atacá-la primeiro, aumentando sua própria evasão e taxa crítica enquanto o efeito durar.",
        "titulo": "A Desafiante de Emberglow",
        "equipamentos": {"arma": "Arco Composto Artesanal", "itens": "Carcás de Competição, Retrato do Irmão Desaparecido, Faixa de Vitórias em Duelo"},
        "tecnicas": ["Flecha do Desafio", "Investida Competitiva", "Tiro da Busca"]
    },
    {
        "papel": "Heroína", "base_em": "Esperre (Octopath Traveler 0)", "nome": "Esperre Jin",
        "idade": "28", "nacionalidade": "Sul-coreana, curandeira de campo nas Areias de Sufrataljah",
        "aparencia": "Pele bronzeada por anos sob o sol do deserto, cabelos escuros cobertos por um lenço protetor, veste roupas leves adaptadas ao calor extremo.",
        "altura_peso": "1,67m / 56kg",
        "personalidade": "Resiliente e pragmática, acostumada a sobreviver e ajudar em condições extremas. Fala pouco sobre si mesma.",
        "historia": "Curandeira que se estabeleceu nas regiões desérticas próximas a Sufrataljah, tratando caravanas e caçadores vítimas de monstros venenosos.",
        "classe": "[✦] Curador", "classe_avancada": "Curandeira do Deserto", "rank": "C", "nivel": 57,
        "estilo_luta": "Proficiência em Machados",
        "atributos": {"forca": 50, "resistencia": 58, "velocidade": 40, "sentidos": 52, "inteligencia": 55, "poder_magico": 55},
        "elemento": "Terra",
        "habilidade_unica": "Antídoto do Deserto — remove todos os efeitos de veneno e desidratação do grupo, além de conceder resistência temporária a novos venenos por 3 turnos.",
        "titulo": "A Curandeira das Dunas",
        "equipamentos": {"arma": "Machado Curto de Colheita", "itens": "Lenço Protetor do Deserto, Frascos de Antídoto, Cantil de Água Reforçado"},
        "tecnicas": ["Golpe da Sobrevivência", "Purificação das Dunas", "Cura sob o Sol"]
    },
    {
        "papel": "Herói", "base_em": "Goodwin (Octopath Traveler 0)", "nome": "Goodwin Cha",
        "idade": "30", "nacionalidade": "Sul-coreano, sobrevivente de naufrágio em Shipwreck Island",
        "aparencia": "Pele curtida pelo sal e pelo sol, cabelos grisalhos precocemente, veste roupas surradas de marinheiro adaptadas com fitas de dança improvisadas.",
        "altura_peso": "1,81m / 76kg",
        "personalidade": "Grato pela segunda chance na vida, encontra alegria simples em pequenas coisas depois de sobreviver ao que quase o matou.",
        "historia": "Antigo tripulante de um navio de exploração que naufragou perto de uma ilha corrompida por mana instável, Goodwin foi o único sobrevivente. Seu Despertar veio da pura vontade de sobreviver.",
        "classe": "[✦] Assassino", "classe_avancada": "Sobrevivente das Ilhas Perdidas", "rank": "A", "nivel": 79,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 48, "resistencia": 52, "velocidade": 66, "sentidos": 60, "inteligencia": 45, "poder_magico": 28},
        "elemento": "Água",
        "habilidade_unica": "Instinto de Sobrevivência — quando abaixo de 25% de HP, recupera automaticamente uma pequena porção de vida e ganha velocidade aumentada por 2 turnos, uma vez por batalha.",
        "titulo": "O Náufrago que Dança com a Morte",
        "equipamentos": {"arma": "Adagas Improvisadas de Naufrágio", "itens": "Roupas Surradas de Marinheiro, Diário de Sobrevivência, Amuleto de Sorte Recuperado do Mar"},
        "tecnicas": ["Passo do Náufrago", "Corte da Segunda Chance", "Dança da Sobrevivência"]
    },
    {
        "papel": "Heroína", "base_em": "Reime (Octopath Traveler 0)", "nome": "Reime Oh",
        "idade": "24", "nacionalidade": "Sul-coreana, campeã invicta da arena de Victors Hollow",
        "aparencia": "Corpo ágil e definido, cabelos negros curtos com uma faixa de campeã amarrada no braço, veste armadura leve otimizada para velocidade.",
        "altura_peso": "1,71m / 60kg",
        "personalidade": "Confiante, competitiva e obcecada em provar que técnica supera força bruta. Trata cada combate como uma dança calculada.",
        "historia": "Campeã invicta da arena de duelos de Victors Hollow, Reime construiu sua reputação vencendo caçadores muito mais fortes fisicamente através de pura finesse.",
        "classe": "[✦] Lutador", "classe_avancada": "Campeã da Arena", "rank": "S", "nivel": 91,
        "estilo_luta": "Proficiência em Espadas",
        "atributos": {"forca": 70, "resistencia": 55, "velocidade": 88, "sentidos": 80, "inteligencia": 50, "poder_magico": 18},
        "elemento": "Vento",
        "habilidade_unica": "Leitura de Combate — analisa o padrão de ataque do inimigo por um turno, garantindo esquiva total ao próximo golpe recebido e um contra-ataque automático.",
        "titulo": "A Invicta de Victors Hollow",
        "equipamentos": {"arma": "Espada Curva de Duelo", "itens": "Faixa de Campeã, Armadura Leve de Torneio, Registro de Vitórias"},
        "tecnicas": ["Corte da Finesse", "Contra-Ataque Perfeito", "Dança das Lâminas"]
    },
    {
        "papel": "Heroína", "base_em": "Heidne (Octopath Traveler 0)", "nome": "Heidne Ahn",
        "idade": "26", "nacionalidade": "Sul-coreana, ladra elusiva perseguida em várias regiões",
        "aparencia": "Esguia e furtiva, cabelos negros curtos escondidos sob uma capa surrada, olhos sempre calculando rotas de fuga.",
        "altura_peso": "1,65m / 54kg",
        "personalidade": "Arisca, desconfiada de qualquer autoridade e movida por um código pessoal de sobrevivência acima de tudo.",
        "historia": "Ladra que sobrevive roubando de guildas corruptas e nobres exploradores, Heidne foi caçada por caçadores contratados diversas vezes. Seus roubos financiam refugiados de vilas destruídas.",
        "classe": "[✦] Assassino", "classe_avancada": "Fantasma das Areias", "rank": "B", "nivel": 71,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 50, "resistencia": 42, "velocidade": 80, "sentidos": 75, "inteligencia": 48, "poder_magico": 22},
        "elemento": "Sombra",
        "habilidade_unica": "Fuga Calculada — ao ser encurralada, tem chance de desaparecer completamente do campo de visão inimigo por um turno, reaparecendo com um ataque surpresa.",
        "titulo": "A Ladra dos Refugiados",
        "equipamentos": {"arma": "Adagas Gastas de Fuga", "itens": "Capa Surrada de Infiltração, Mapa de Rotas de Fuga, Bolsa de Itens Roubados"},
        "tecnicas": ["Corte Furtivo", "Desaparecimento nas Areias", "Golpe do Fantasma"]
    },
    // ===== CotC =====
    {
        "papel": "Herói", "base_em": "Bargello (Champions of the Continent)", "nome": "Bargello Yeon",
        "idade": "34", "nacionalidade": "Sul-coreano, líder de guilda caído em desgraça em Valore",
        "aparencia": "Corpo imponente com armadura pesada de placas escurecidas pelo tempo, cabelos negros curtos e uma cicatriz cruzando o queixo. Carrega uma espada larga.",
        "altura_peso": "1,92m / 100kg",
        "personalidade": "Orgulhoso, disciplinado e assombrado por decisões que custaram a queda de sua própria guilda. Busca redenção através de atos de proteção.",
        "historia": "Antigo líder de uma guilda respeitada, Bargello viu sua organização ruir após um ataque coordenado a um portal instável. Exilado, agora protege comunidades de ameaças.",
        "classe": "[✦] Lutador", "classe_avancada": "Comandante Exilado", "rank": "A", "nivel": 88,
        "estilo_luta": "Proficiência em Espadas",
        "atributos": {"forca": 88, "resistencia": 80, "velocidade": 50, "sentidos": 52, "inteligencia": 45, "poder_magico": 20},
        "elemento": "Terra",
        "habilidade_unica": "Comando do Caído — assume o dano de um aliado prestes a ser derrotado, redirecionando o golpe para si mesmo e recebendo redução de dano ao fazê-lo.",
        "titulo": "O Comandante que Caiu com sua Guilda",
        "equipamentos": {"arma": "Espada Larga da Guilda Extinta", "itens": "Armadura de Placas Escurecida, Estandarte Guardado, Lista de Nomes Perdidos"},
        "tecnicas": ["Golpe do Comando", "Escudo do Sacrifício", "Corte da Redenção"]
    },
    {
        "papel": "Vilã", "base_em": "Alaune (Champions of the Continent)", "nome": "Alaune Yeong",
        "idade": "Aparenta 35 anos (idade real desconhecida)", "nacionalidade": "Sul-coreana, autoproclamada 'Rainha' de um reino de dungeon abandonado",
        "aparencia": "Bela e imponente, cabelos loiro-esverdeados longos entrelaçados com vinhas vivas, veste trajes reais decadentes cobertos por musgo e flores negras.",
        "altura_peso": "1,73m / desconhecido",
        "personalidade": "Fria, teatral e convencida de sua própria realeza mesmo sem súditos vivos. Trata intrusos como usurpadores de um trono que só ela reconhece.",
        "historia": "Ex-líder de uma comunidade que se isolou dentro de um castelo erguido sobre um portal profundo, Alaune foi corrompida por uma anomalia de mana, fundindo-a a uma força vegetal ancestral.",
        "classe": "[✦] Mago Elemental", "classe_avancada": "Rainha do Castelo Oco", "rank": "S", "nivel": 96,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 42, "resistencia": 68, "velocidade": 48, "sentidos": 65, "inteligencia": 78, "poder_magico": 92},
        "elemento": "Planta",
        "habilidade_unica": "Domínio da Corte Oca — invoca raízes espectrais que prendem os inimigos no lugar por um turno, drenando parte de seu HP para curar a própria Alaune.",
        "titulo": "A Rainha do Trono Apodrecido",
        "equipamentos": {"arma": "Cetro Vivo Entrelaçado", "itens": "Trajes Reais Decadentes, Coroa Coberta de Musgo, Selo da Corte Extinta"},
        "tecnicas": ["Ordem da Rainha", "Raízes do Trono", "Julgamento Vegetal"]
    },
    {
        "papel": "Herói", "base_em": "Richard (Champions of the Continent)", "nome": "Richard Han",
        "idade": "45", "nacionalidade": "Sul-coreano, ex-líder de uma grande guilda regional",
        "aparencia": "Postura régia mesmo desgastado pelos anos, cabelos grisalhos penteados para trás, veste uma armadura ornamentada que já viu dias melhores.",
        "altura_peso": "1,86m / 88kg",
        "personalidade": "Justo, cansado e carregando o peso de decisões que sacrificaram alguns para salvar muitos.",
        "historia": "Antigo líder de uma poderosa guilda, Richard foi forçado a tomar decisões impopulares durante uma crise de contenção. Hoje vive isolado nas ruínas do que já foi sua fortaleza.",
        "classe": "[✦] Lutador", "classe_avancada": "Rei sem Reino", "rank": "A", "nivel": 89,
        "estilo_luta": "Proficiência em Espadas",
        "atributos": {"forca": 78, "resistencia": 75, "velocidade": 48, "sentidos": 58, "inteligencia": 60, "poder_magico": 25},
        "elemento": "Metal",
        "habilidade_unica": "Decreto do Sacrifício — sacrifica parte do próprio HP para conceder um grande buff de ataque e defesa a todo o grupo por 3 turnos.",
        "titulo": "O Rei Entre a Vida e a Morte",
        "equipamentos": {"arma": "Espada Cerimonial Ornamentada", "itens": "Armadura Real Desgastada, Selo da Guilda Extinta, Retrato da Fortaleza Perdida"},
        "tecnicas": ["Corte do Decreto", "Postura Real", "Golpe do Legado"]
    },
    {
        "papel": "Herói", "base_em": "Solon (Champions of the Continent)", "nome": "Solon Wi",
        "idade": "58", "nacionalidade": "Sul-coreano, estrategista veterano aposentado da Associação",
        "aparencia": "Idoso mas de olhar penetrante, longa barba branca trançada, veste vestes de estrategista adornadas com símbolos de conselho.",
        "altura_peso": "1,70m / 68kg",
        "personalidade": "Sábio, paciente e disposto a jogar o longo jogo mesmo quando isso significa parecer passivo demais para os mais jovens.",
        "historia": "Ex-conselheiro estratégico de uma das maiores guildas, Solon retirou-se após décadas de serviço. Seu Despertar veio quando decidiu agir por conta própria contra uma ameaça.",
        "classe": "[✦] Mago Elemental", "classe_avancada": "Estrategista Aposentado", "rank": "B", "nivel": 74,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 30, "resistencia": 45, "velocidade": 35, "sentidos": 68, "inteligencia": 94, "poder_magico": 76},
        "elemento": "Água",
        "habilidade_unica": "Tabuleiro Estratégico — planeja a próxima rodada inteira do grupo, concedendo a todos os aliados uma ação extra garantida no turno seguinte.",
        "titulo": "O Estrategista que se Recusa a se Calar",
        "equipamentos": {"arma": "Cajado de Apoio Entalhado", "itens": "Vestes de Conselheiro, Mapa Estratégico Portátil, Registro de Batalhas Passadas"},
        "tecnicas": ["Água do Cálculo", "Movimento Antecipado", "Xeque-Mate Elemental"]
    },
    {
        "papel": "Herói", "base_em": "Eltrix (Champions of the Continent)", "nome": "Eltrix Noh",
        "idade": "36", "nacionalidade": "Sul-coreana, capitã de uma guarda de elite dissolvida",
        "aparencia": "Postura militar rígida, cabelos negros curtos presos sob um capacete de campanha, veste armadura funcional de capitã com insígnias de uma guilda que não existe mais.",
        "altura_peso": "1,78m / 70kg",
        "personalidade": "Disciplinada, leal até o fim aos poucos sobreviventes de sua antiga unidade, e implacável contra qualquer ameaça.",
        "historia": "Ex-capitã de uma guarda de elite responsável por proteger uma fortaleza, Eltrix viu sua unidade dizimada durante uma incursão maciça. Sobrevivente, reúne os remanescentes.",
        "classe": "[✦] Ranger", "classe_avancada": "Capitã sem Bandeira", "rank": "A", "nivel": 86,
        "estilo_luta": "Proficiência em Arcos",
        "atributos": {"forca": 62, "resistencia": 65, "velocidade": 58, "sentidos": 74, "inteligencia": 55, "poder_magico": 28},
        "elemento": "Metal",
        "habilidade_unica": "Comando de Unidade — coordena ataques simultâneos entre até três aliados por um turno, aumentando drasticamente a chance de acerto crítico de cada um.",
        "titulo": "A Capitã da Guarda Dissolvida",
        "equipamentos": {"arma": "Arco de Guerra e Lança Curta", "itens": "Armadura Funcional de Capitã, Insígnia da Unidade Extinta, Registro dos Sobreviventes"},
        "tecnicas": ["Flecha de Comando", "Investida Coordenada", "Postura da Última Guarda"]
    },
    {
        "papel": "Herói", "base_em": "Rondo (Champions of the Continent)", "nome": "Rondo Baek",
        "idade": "27", "nacionalidade": "Sul-coreano, cavaleiro de uma ordem congelada no tempo",
        "aparencia": "Armadura ornamentada de estilo antiquado, cabelos prateados curtos, sempre carrega um estandarte desbotado junto à espada.",
        "altura_peso": "1,83m / 80kg",
        "personalidade": "Formal ao ponto de soar deslocado no mundo moderno, extremamente leal a códigos de honra que a maioria já abandonou.",
        "historia": "Criado dentro de uma ordem de cavaleiros isolada que se recusou a se modernizar, Rondo passou a vida treinando sob código de honra ancestral. Ao descobrir que sua ordem foi esquecida, decidiu sair para o mundo.",
        "classe": "[✦] Lutador", "classe_avancada": "Cavaleiro do Juramento Esquecido", "rank": "B", "nivel": 69,
        "estilo_luta": "Proficiência em Espadas",
        "atributos": {"forca": 74, "resistencia": 70, "velocidade": 52, "sentidos": 55, "inteligencia": 42, "poder_magico": 22},
        "elemento": "Gelo",
        "habilidade_unica": "Juramento Inabalável — enquanto ativo, Rondo não pode ser derrubado abaixo de 1 HP por um único golpe, não importa o dano recebido, uma vez por batalha.",
        "titulo": "O Último Cavaleiro da Ordem Esquecida",
        "equipamentos": {"arma": "Espada Ornamentada Antiga", "itens": "Estandarte Desbotado, Armadura da Ordem Congelada, Código de Honra Manuscrito"},
        "tecnicas": ["Corte do Juramento", "Postura da Ordem", "Investida do Cavaleiro Esquecido"]
    },
    {
        "papel": "Heroína", "base_em": "Isla (Champions of the Continent)", "nome": "Isla Gwon",
        "idade": "Aparenta 20 anos", "nacionalidade": "Sul-coreana, estudiosa da remota Ilha dos Sábios",
        "aparencia": "Traços felinos sutis (orelhas e cauda), cabelos brancos curtos, veste vestes acadêmicas leves adaptadas à vida na ilha isolada.",
        "altura_peso": "1,58m / 46kg",
        "personalidade": "Curiosa, um pouco isolada socialmente, mas extremamente perceptiva sobre padrões que outros não notam.",
        "historia": "Criada isolada em uma ilha remota povoada por estudiosos com traços felinos, Isla dedicou a vida a decifrar fragmentos de cartas antigas sobre a origem dos portais.",
        "classe": "[✦] Mago Elemental", "classe_avancada": "Sábia da Ilha Isolada", "rank": "S", "nivel": 93,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 20, "resistencia": 36, "velocidade": 50, "sentidos": 82, "inteligencia": 98, "poder_magico": 90},
        "elemento": "Vento",
        "habilidade_unica": "Fragmentos Reunidos — combina conhecimento acumulado para revelar instantaneamente todas as fraquezas elementais e físicas do inimigo ao grupo inteiro.",
        "titulo": "A Sábia dos Fragmentos Perdidos",
        "equipamentos": {"arma": "Orbe de Cristal da Ilha", "itens": "Pilha de Fragmentos de Carta, Vestes Acadêmicas Leves, Mapa Incompleto do Continente"},
        "tecnicas": ["Vento do Conhecimento", "Revelação Total", "Tempestade dos Sábios"]
    },
    {
        "papel": "Herói", "base_em": "Sazantos (Champions of the Continent)", "nome": "Sazantos Do",
        "idade": "40", "nacionalidade": "Sul-coreano, guardião voluntário das trilhas de Wishvale",
        "aparencia": "Corpo musculoso marcado por queimaduras antigas, cabelos ruivos grisalhos curtos, veste armadura reforçada com placas resistentes ao fogo.",
        "altura_peso": "1,89m / 96kg",
        "personalidade": "Silencioso e observador, prefere agir a explicar suas motivações. Trata a proteção de rotas como um dever sagrado.",
        "historia": "Guardião voluntário que protege sozinho as trilhas de acesso a Wishvale. Seu Despertar aconteceu durante um incêndio florestal quando conteve as chamas usando seu próprio corpo.",
        "classe": "[✦] Lutador", "classe_avancada": "Guardião das Trilhas", "rank": "S", "nivel": 94,
        "estilo_luta": "Proficiência em Lanças",
        "atributos": {"forca": 84, "resistencia": 78, "velocidade": 55, "sentidos": 70, "inteligencia": 40, "poder_magico": 45},
        "elemento": "Fogo",
        "habilidade_unica": "Escudo Vivo das Trilhas — aparece instantaneamente para bloquear um ataque fatal direcionado a um aliado, absorvendo o dano por completo uma vez por batalha.",
        "titulo": "O Guardião Silencioso das Trilhas",
        "equipamentos": {"arma": "Lança Envolta em Correntes Aquecidas", "itens": "Armadura Resistente ao Fogo, Marcas de Queimadura Antigas, Bússola das Trilhas"},
        "tecnicas": ["Investida Flamejante", "Escudo das Correntes", "Golpe do Guardião"]
    },
    {
        "papel": "Heroína", "base_em": "Elrica (Champions of the Continent)", "nome": "Elrica Edoras",
        "idade": "33", "nacionalidade": "Sul-coreana, guerreira remanescente de Cragspear",
        "aparencia": "Postura firme e cansada, cabelos loiros curtos cortados de forma prática, veste uma armadura leve de combate cheia de marcas de batalha.",
        "altura_peso": "1,72m / 65kg",
        "personalidade": "Pragmática e desconfiada de qualquer aliança temporária, mas cumpre sua palavra até o fim quando decide lutar ao lado de alguém.",
        "historia": "Guerreira de Cragspear que enfrentou sozinha incontáveis incursões. Despertou durante um confronto brutal contra uma horda vinda de um portal recém-aberto.",
        "classe": "[✦] Lutador", "classe_avancada": "Defensora Solitária", "rank": "C", "nivel": 62,
        "estilo_luta": "Proficiência em Espadas",
        "atributos": {"forca": 60, "resistencia": 58, "velocidade": 50, "sentidos": 52, "inteligencia": 38, "poder_magico": 18},
        "elemento": "Terra",
        "habilidade_unica": "Última Linha — enquanto for a única sobrevivente do grupo em combate, recebe um grande aumento de força e resistência até que um aliado seja reanimado.",
        "titulo": "A Defensora Solitária de Cragspear",
        "equipamentos": {"arma": "Espada Curta de Combate Rápido", "itens": "Armadura Leve Marcada por Batalhas, Bandagens de Emergência, Diário de Patrulha"},
        "tecnicas": ["Corte Solitário", "Postura da Última Linha", "Investida Desesperada"]
    },
    {
        "papel": "Vilã", "base_em": "Tatloch (Champions of the Continent)", "nome": "Tatloch",
        "idade": "Aparenta 40 anos (idade real desconhecida)", "nacionalidade": "Sul-coreana, autoproclamada 'Imperatriz' de uma nação congelada no tempo",
        "aparencia": "Imponente e gélida, cabelos brancos longos como gelo entrelaçado, veste trajes imperiais cobertos por uma camada permanente de geada.",
        "altura_peso": "1,76m / desconhecido",
        "personalidade": "Autoritária, presa a costumes e protocolos de uma era que já não existe, e absolutamente convencida de sua própria legitimidade como governante.",
        "historia": "Antiga líder de uma nação erguida ao redor de um portal que parou o tempo, Tatloch governa um território congelado onde nada envelhece, mantendo súditos petrificados.",
        "classe": "[✦] Mago Elemental", "classe_avancada": "Imperatriz do Tempo Congelado", "rank": "S", "nivel": 97,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 40, "resistencia": 72, "velocidade": 45, "sentidos": 68, "inteligencia": 82, "poder_magico": 95},
        "elemento": "Gelo",
        "habilidade_unica": "Decreto do Tempo Parado — congela o campo de batalha por um turno, impedindo qualquer inimigo de agir, exceto ela mesma, que ataca livremente durante esse período.",
        "titulo": "A Imperatriz que Parou o Tempo",
        "equipamentos": {"arma": "Cajado de Gelo Eterno", "itens": "Trajes Imperiais Congelados, Coroa de Geada, Relógio Imperial Parado"},
        "tecnicas": ["Decreto Gélido", "Congelamento Imperial", "Julgamento do Tempo Parado"]
    },
    // ===== Bosses OT1 =====
    {
        "papel": "Vilão", "base_em": "Mattias (Octopath Traveler)", "nome": "Mattias Cardoso",
        "idade": "52", "nacionalidade": "Sul-coreano, ex-alto sacerdote de um dos maiores templos da Associação",
        "aparencia": "Aparência serena e paternal à primeira vista, cabelos grisalhos bem cuidados, veste vestes clericais impecáveis.",
        "altura_peso": "1,75m / 78kg",
        "personalidade": "Manipulador, hipócrita e absolutamente convencido de que os fins justificam qualquer meio necessário para manter seu poder.",
        "historia": "Alto sacerdote respeitado publicamente, Mattias secretamente orquestrou o desaparecimento de sacerdotisas rivais que ameaçavam expor sua corrupção financeira.",
        "classe": "[✦] Curador", "classe_avancada": "Sacerdote da Fachada Impecável", "rank": "S", "nivel": 90,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 35, "resistencia": 58, "velocidade": 42, "sentidos": 60, "inteligencia": 75, "poder_magico": 88},
        "elemento": "Escuridão",
        "habilidade_unica": "Máscara da Devoção — cura a si mesmo massivamente ao mesmo tempo em que lança uma maldição que reduz a cura recebida pelo grupo adversário pela metade.",
        "titulo": "O Sacerdote da Corrupção Oculta",
        "equipamentos": {"arma": "Cajado Ritual Roubado do Templo", "itens": "Vestes Clericais Impecáveis, Documentos Financeiros Falsificados, Relicário Profanado"},
        "tecnicas": ["Bênção Falsa", "Maldição da Fachada", "Julgamento Hipócrita"]
    },
    {
        "papel": "Vilão", "base_em": "Werner (Octopath Traveler)", "nome": "Werner Choi",
        "idade": "46", "nacionalidade": "Sul-coreano, ex-companheiro de armas transformado em traidor",
        "aparencia": "Corpo robusto de guerreiro veterano, cabelos ruivos grisalhos curtos, uma armadura pesada exibindo o emblema de uma guilda que ele mesmo ajudou a destruir.",
        "altura_peso": "1,90m / 102kg",
        "personalidade": "Frio, ambicioso e disposto a sacrificar qualquer laço antigo em nome de poder e reconhecimento.",
        "historia": "Antigo companheiro de armas de um lendário mestre de dojo, Werner vendeu informações sobre as defesas do dojo em troca de poder, resultando na destruição do local.",
        "classe": "[✦] Lutador", "classe_avancada": "O Traidor de Ferro", "rank": "S", "nivel": 95,
        "estilo_luta": "Proficiência em Espadas",
        "atributos": {"forca": 90, "resistencia": 85, "velocidade": 48, "sentidos": 50, "inteligencia": 42, "poder_magico": 15},
        "elemento": "Metal",
        "habilidade_unica": "Golpe da Traição — ignora toda a defesa de um único alvo em um ataque devastador, mas deixa Werner vulnerável a contra-ataques por um turno inteiro.",
        "titulo": "O Guerreiro que Vendeu o Próprio Dojo",
        "equipamentos": {"arma": "Espada Pesada Roubada da Guilda Rival", "itens": "Armadura com Emblema Manchado, Bolsa de Moedas da Traição, Carta de Recomendação Falsa"},
        "tecnicas": ["Corte da Traição", "Fúria de Ferro", "Golpe Sem Honra"]
    },
    {
        "papel": "Vilão", "base_em": "Simeon (Octopath Traveler)", "nome": "Simeon Ha",
        "idade": "40", "nacionalidade": "Sul-coreano, líder de uma organização criminosa disfarçada de guilda legítima",
        "aparencia": "Elegante e refinado, ternos impecáveis mesmo em confrontos violentos, cabelos negros penteados com precisão.",
        "altura_peso": "1,82m / 74kg",
        "personalidade": "Calculista, cruel sob uma fachada de sofisticação, e obcecado em eliminar qualquer ameaça ao controle absoluto que exerce.",
        "historia": "Líder secreto de uma rede criminosa que controla o contrabando de itens raros, Simeon ordenou a execução do líder de uma guilda rival diante da filha deste.",
        "classe": "[✦] Assassino", "classe_avancada": "O Chefe do Submundo", "rank": "S", "nivel": 92,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 58, "resistencia": 45, "velocidade": 78, "sentidos": 82, "inteligencia": 70, "poder_magico": 30},
        "elemento": "Escuridão",
        "habilidade_unica": "Demonstração de Poder — executa um ataque combinado contra o alvo com menor HP no grupo inimigo, com dano aumentado se o alvo estiver abaixo de 50% de vida.",
        "titulo": "O Chefe que Executou um Rival Diante da Filha",
        "equipamentos": {"arma": "Adagas Ocultas de Contrabandista", "itens": "Terno Impecável, Rede de Contatos Criminosos, Relógio de Ouro Roubado"},
        "tecnicas": ["Corte da Execução", "Sombra do Submundo", "Golpe Sem Piedade"]
    },
    {
        "papel": "Vilão", "base_em": "Darius (Octopath Traveler)", "nome": "Darius Kwon",
        "idade": "29", "nacionalidade": "Sul-coreano, ex-parceiro de furtos transformado em inimigo",
        "aparencia": "Magro e ágil, cabelos escuros curtos, veste roupas escuras de infiltração muito parecidas com as de seu antigo parceiro.",
        "altura_peso": "1,77m / 63kg",
        "personalidade": "Ganancioso, invejoso e ressentido por sempre ter sido considerado o parceiro 'menos talentoso'.",
        "historia": "Antigo parceiro de furtos, Darius traiu a dupla durante um roubo, entregando informações a guardas em troca da própria liberdade.",
        "classe": "[✦] Assassino", "classe_avancada": "O Parceiro que Traiu", "rank": "A", "nivel": 87,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 55, "resistencia": 40, "velocidade": 85, "sentidos": 78, "inteligencia": 52, "poder_magico": 24},
        "elemento": "Sombra",
        "habilidade_unica": "Golpe do Parceiro Traído — ataca duas vezes em sequência contra o mesmo alvo, com a segunda instância causando dano extra se o alvo já estiver com algum debuff ativo.",
        "titulo": "O Ladrão que Vendeu o Próprio Parceiro",
        "equipamentos": {"arma": "Adaga Herdada do Antigo Trabalho", "itens": "Roupas de Infiltração Escuras, Mapa de Esconderijos Secretos, Bolsa de Itens Contrabandeados"},
        "tecnicas": ["Corte da Traição Dupla", "Fuga Calculada", "Golpe do Rancor Antigo"]
    },
    {
        "papel": "Vilão", "base_em": "Redeye (Octopath Traveler)", "nome": "Redeye",
        "idade": "Desconhecida — fera corrompida por mana negra", "nacionalidade": "Não-humano; monstro de dungeon corrompido",
        "aparencia": "Um enorme lobo mutado do tamanho de um urso, pelagem negra irregular manchada por veios de mana pulsante vermelha, e um único olho brilhando em vermelho intenso.",
        "altura_peso": "Aproximadamente 3m de comprimento / massa muito acima do normal",
        "personalidade": "Selvagem, territorial e movido por instinto puro de destruição desde que uma anomalia de mana corrompeu seu corpo e mente.",
        "historia": "Antiga fera-guardiã domada por um caçador veterano, Redeye foi exposto a uma anomalia de mana negra, corrompendo permanentemente seu corpo e apagando qualquer vínculo.",
        "classe": "[✦] Lutador", "classe_avancada": "Fera Corrompida das Montanhas Geladas", "rank": "S", "nivel": 93,
        "estilo_luta": "Proficiência em Combate Desarmado (Garras e Presas)",
        "atributos": {"forca": 94, "resistencia": 76, "velocidade": 72, "sentidos": 88, "inteligencia": 20, "poder_magico": 40},
        "elemento": "Escuridão",
        "habilidade_unica": "Fúria Corrompida — quanto menor seu HP, maior sua velocidade e força de ataque, entrando em um estado de fúria descontrolada abaixo de 30% de vida.",
        "titulo": "A Fera de Olho Vermelho",
        "equipamentos": {"arma": "Garras e Presas Naturais", "itens": "Pelagem Corrompida por Mana Negra"},
        "tecnicas": ["Investida Sanguinária", "Uivo da Corrupção", "Mordida do Olho Vermelho"]
    },
    {
        "papel": "Vilão", "base_em": "Miguel (Octopath Traveler)", "nome": "Miguel Bang",
        "idade": "37", "nacionalidade": "Sul-coreano, assassino em série disfarçado de figura pública respeitável",
        "aparencia": "Aparência gentil e comum, cabelos castanhos bem penteados, veste roupas discretas que não chamam atenção.",
        "altura_peso": "1,80m / 72kg",
        "personalidade": "Psicoticamente calmo e metódico, trata assassinatos como um passatempo meticulosamente planejado.",
        "historia": "Por trás de uma reputação impecável como voluntário, Miguel secretamente sequestra e assassina vítimas escolhidas com cuidado obsessivo.",
        "classe": "[✦] Assassino", "classe_avancada": "O Voluntário de Sorriso Vazio", "rank": "A", "nivel": 84,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 50, "resistencia": 44, "velocidade": 75, "sentidos": 80, "inteligencia": 65, "poder_magico": 26},
        "elemento": "Sombra",
        "habilidade_unica": "Caça Meticulosa — marca um alvo no início da batalha; todo dano causado a esse alvo específico é aumentado significativamente pelo resto do combate.",
        "titulo": "O Voluntário que Escondia um Predador",
        "equipamentos": {"arma": "Adaga Discreta de Aço Fosco", "itens": "Roupas Discretas Sem Marcas, Lista de Vítimas Cuidadosamente Escolhidas, Crachá de Voluntário"},
        "tecnicas": ["Corte Silencioso", "Marca do Predador", "Golpe do Sorriso Vazio"]
    },
    // ===== Vilões Complemento =====
    {
        "papel": "Vilão", "base_em": "Gaston (Octopath Traveler)", "nome": "Gaston Rho",
        "idade": "Desconhecida — criatura monstruosa de origem incerta", "nacionalidade": "Não-humano; monstro colossal de dungeon",
        "aparencia": "Uma massa gigantesca de carne e couro escamado do tamanho de uma barcaça, boca desproporcional cheia de dentes irregulares.",
        "altura_peso": "Aproximadamente 7m de comprimento / massa colossal",
        "personalidade": "Guloso ao extremo, sem qualquer malícia calculada — apenas fome insaciável que o faz devorar tudo que encontra pelo caminho.",
        "historia": "Uma anomalia biológica nascida da fusão de um monstro de dungeon com décadas de itens mágicos que engoliu sem nunca digerir.",
        "classe": "[✦] Lutador", "classe_avancada": "Devorador Colossal das Rotas", "rank": "A", "nivel": 83,
        "estilo_luta": "Proficiência em Combate Desarmado (Mordida e Esmagamento)",
        "atributos": {"forca": 88, "resistencia": 90, "velocidade": 25, "sentidos": 40, "inteligencia": 15, "poder_magico": 20},
        "elemento": "Terra",
        "habilidade_unica": "Engolir Relíquia — devora um item aleatório do grupo adversário durante o ataque, ganhando um buff de defesa proporcional ao valor do item engolido.",
        "titulo": "O Devorador de Caravanas",
        "equipamentos": {"arma": "Mandíbulas Naturais Reforçadas", "itens": "Pilha de Relíquias Fundidas ao Corpo, Couro Escamado Espesso"},
        "tecnicas": ["Investida Esmagadora", "Engolir Tudo", "Baba Corrosiva"]
    },
    {
        "papel": "Vilão", "base_em": "Yvon (Octopath Traveler)", "nome": "Yvon Baik",
        "idade": "44", "nacionalidade": "Sul-coreano, ex-reitor de uma academia de formação de caçadores",
        "aparencia": "Postura acadêmica impecável, óculos de aro dourado, cabelos grisalhos penteados com extrema precisão.",
        "altura_peso": "1,78m / 70kg",
        "personalidade": "Arrogante, convencido da própria superioridade intelectual e disposto a qualquer crime para manter o prestígio.",
        "historia": "Reitor de uma prestigiada academia, Yvon assassinou o reitor anterior ao descobrir que este guardava um grimório raro capaz de ampliar drasticamente o poder mágico.",
        "classe": "[✦] Mago Elemental", "classe_avancada": "O Reitor Usurpador", "rank": "A", "nivel": 88,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 28, "resistencia": 45, "velocidade": 40, "sentidos": 58, "inteligencia": 92, "poder_magico": 89},
        "elemento": "Escuridão",
        "habilidade_unica": "Grimório Roubado — conjura um feitiço aleatório de alto poder a cada dois turnos, imprevisível mas sempre devastador.",
        "titulo": "O Reitor que Matou pelo Grimório",
        "equipamentos": {"arma": "Cajado Acadêmico Ornamentado", "itens": "Grimório Roubado do Antigo Reitor, Vestes de Reitor Bordadas, Selo Falsificado da Academia"},
        "tecnicas": ["Explosão Arcana Instável", "Julgamento do Reitor", "Fúria do Conhecimento Roubado"]
    },
    {
        "papel": "Vilã", "base_em": "Lucia (Octopath Traveler)", "nome": "Lucia Yeom",
        "idade": "Aparenta 27 anos (idade real desconhecida)", "nacionalidade": "Sul-coreana, agente infiltrada de origem obscura",
        "aparencia": "Fria e elegante, cabelos negros lisos impecavelmente arrumados, veste roupas discretas de tons escuros.",
        "altura_peso": "1,69m / 55kg",
        "personalidade": "Extremamente paciente, manipuladora nos bastidores e disposta a abandonar qualquer aliado assim que deixa de ser útil.",
        "historia": "Agente infiltrada que serviu como conselheira sombria por trás da ascensão corrupta de um reitor acadêmico.",
        "classe": "[✦] Assassino", "classe_avancada": "A Conselheira das Sombras", "rank": "A", "nivel": 86,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 48, "resistencia": 42, "velocidade": 75, "sentidos": 85, "inteligencia": 80, "poder_magico": 35},
        "elemento": "Sombra",
        "habilidade_unica": "Manipulação Silenciosa — força um inimigo aliado de menor rank a atacar seus próprios companheiros por um turno, sem que ele perceba o controle sofrido.",
        "titulo": "A Sombra Por Trás do Trono Acadêmico",
        "equipamentos": {"arma": "Adagas Ocultas Sem Marca", "itens": "Disfarces Diversos, Rede de Contatos Anônimos, Cifra de Comunicação Secreta"},
        "tecnicas": ["Corte da Manipulação", "Desaparecimento Calculado", "Golpe do Peão Descartado"]
    },
    {
        "papel": "Vilã", "base_em": "Vanessa Hysel (Octopath Traveler)", "nome": "Vanessa Hysel",
        "idade": "39", "nacionalidade": "Sul-coreana, curandeira itinerante disfarçada de benfeitora",
        "aparencia": "Doce e maternal à primeira vista, cabelos castanhos ondulados, veste roupas simples de curandeira de vila.",
        "altura_peso": "1,65m / 58kg",
        "personalidade": "Calculista sob uma fachada calorosa e acolhedora, capaz de fingir compaixão genuína enquanto lucra com o sofrimento.",
        "historia": "Curandeira itinerante que contamina poços de água com toxinas de ação lenta em vilas isoladas, vendendo o antídoto a preços exorbitantes.",
        "classe": "[✦] Curador", "classe_avancada": "A Benfeitora Envenenadora", "rank": "B", "nivel": 72,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 24, "resistencia": 40, "velocidade": 38, "sentidos": 55, "inteligencia": 68, "poder_magico": 70},
        "elemento": "Planta",
        "habilidade_unica": "Cura Envenenada — aplica um efeito de cura aparente no grupo adversário que, após dois turnos, se converte em dano contínuo proporcional ao HP curado.",
        "titulo": "A Curandeira que Envenenava Vilas Inteiras",
        "equipamentos": {"arma": "Cajado de Curandeira Falsa", "itens": "Bolsa de Toxinas Disfarçadas de Remédio, Roupas de Benfeitora, Registro de Preços Exorbitantes"},
        "tecnicas": ["Toque Envenenado", "Falsa Salvação", "Colapso Silencioso"]
    },
    {
        "papel": "Vilão", "base_em": "Gideon (Octopath Traveler)", "nome": "Gideon Ma",
        "idade": "50", "nacionalidade": "Sul-coreano, magistrado corrupto de uma cidade portuária",
        "aparencia": "Corpulento e de voz grave, veste trajes formais de magistrado carregados de joias, cabelos grisalhos penteados para trás.",
        "altura_peso": "1,84m / 105kg",
        "personalidade": "Corrupto até a raiz, usa a própria posição de autoridade para extorquir comerciantes em troca de propina constante.",
        "historia": "Magistrado responsável por arbitrar disputas comerciais, Gideon construiu um esquema de extorsão forçando comerciantes a pagar 'taxas de proteção'.",
        "classe": "[✦] Lutador", "classe_avancada": "O Magistrado da Extorsão", "rank": "B", "nivel": 70,
        "estilo_luta": "Proficiência em Armas Ocultas (Bastão-Lâmina)",
        "atributos": {"forca": 62, "resistencia": 60, "velocidade": 35, "sentidos": 48, "inteligencia": 55, "poder_magico": 20},
        "elemento": "Metal",
        "habilidade_unica": "Taxa de Proteção — obriga o grupo adversário a perder uma porção de itens ou ouro do inventário a cada turno, revertendo parte disso em cura para si mesmo.",
        "titulo": "O Magistrado que Vendia Justiça",
        "equipamentos": {"arma": "Bastão Cerimonial com Lâmina Oculta", "itens": "Trajes Formais Carregados de Joias, Registro de Extorsões, Selo Falsificado do Tribunal"},
        "tecnicas": ["Golpe da Propina", "Julgamento Comprado", "Extorsão Violenta"]
    },
    {
        "papel": "Vilão", "base_em": "Rufus (Octopath Traveler)", "nome": "Rufus Deng",
        "idade": "33", "nacionalidade": "Sul-coreano, executor bruto de uma organização criminosa",
        "aparencia": "Musculatura exagerada visível sob trajes rasgados, cabeça raspada e nós dos dedos cobertos por cicatrizes de socos.",
        "altura_peso": "1,95m / 115kg",
        "personalidade": "Bruto, direto e movido puramente pela violência como forma de expressão.",
        "historia": "Braço direito físico de uma organização criminosa conhecida como Corvos, Rufus atuou como executor pessoal em incontáveis 'mensagens' violentas.",
        "classe": "[✦] Lutador", "classe_avancada": "O Punho dos Corvos", "rank": "B", "nivel": 75,
        "estilo_luta": "Proficiência em Combate Desarmado",
        "atributos": {"forca": 85, "resistencia": 70, "velocidade": 45, "sentidos": 40, "inteligencia": 25, "poder_magico": 10},
        "elemento": "Terra",
        "habilidade_unica": "Mensagem dos Corvos — desfere uma sequência de socos brutais que ignora parte da defesa do alvo, aumentando em intensidade a cada acerto consecutivo.",
        "titulo": "O Braço Direito Físico dos Corvos",
        "equipamentos": {"arma": "Punhos Reforçados com Manoplas de Metal", "itens": "Trajes Rasgados de Propósito, Tatuagem do Corvo, Cicatrizes de Combate"},
        "tecnicas": ["Golpe Esmagador", "Sequência Brutal", "Intimidação Física"]
    },
    {
        "papel": "Vilã", "base_em": "Trish (Octopath Traveler)", "nome": "Trish Yamaguchi",
        "idade": "29", "nacionalidade": "Sul-coreana, executora venenosa de uma organização criminosa",
        "aparencia": "Esguia e sinistra, cabelos negros curtos com mechas roxas, veste roupas escuras justas ideais para infiltração.",
        "altura_peso": "1,68m / 52kg",
        "personalidade": "Fria, calculista e mais interessada em elegância letal do que em violência bruta.",
        "historia": "Parceira de execuções de Rufus dentro da organização Corvos, Trish especializou-se em eliminar alvos através de venenos indetectáveis.",
        "classe": "[✦] Assassino", "classe_avancada": "A Lâmina Venenosa dos Corvos", "rank": "B", "nivel": 74,
        "estilo_luta": "Proficiência em Leques e Lâminas Ocultas",
        "atributos": {"forca": 40, "resistencia": 38, "velocidade": 78, "sentidos": 72, "inteligencia": 60, "poder_magico": 32},
        "elemento": "Planta",
        "habilidade_unica": "Veneno Indetectável — aplica um veneno de dano crescente que não pode ser removido por cura convencional, apenas por antídotos específicos, durante 4 turnos.",
        "titulo": "A Executora Silenciosa dos Corvos",
        "equipamentos": {"arma": "Leque de Metal com Frascos de Veneno", "itens": "Roupas de Infiltração Justas, Coleção de Toxinas Raras, Máscara de Seda"},
        "tecnicas": ["Corte do Leque Envenenado", "Névoa Silenciosa", "Golpe Final Toxico"]
    },
    {
        "papel": "Vilão", "base_em": "Warden Davids (Octopath Traveler)", "nome": "Warden Davids",
        "idade": "55", "nacionalidade": "Sul-coreano, ex-diretor de um centro de detenção para caçadores criminosos",
        "aparencia": "Corpo rígido e uniforme impecavelmente passado, cabelos grisalhos cortados à máquina, sempre carregando um molho de chaves.",
        "altura_peso": "1,86m / 90kg",
        "personalidade": "Autoritário ao extremo, convencido de que crueldade é sinônimo de disciplina eficaz.",
        "historia": "Diretor de um centro de detenção, Warden Davids lucrava secretamente vendendo trabalho forçado de detentos a guildas mineradoras em troca de subornos.",
        "classe": "[✦] Lutador", "classe_avancada": "O Diretor da Disciplina Cruel", "rank": "B", "nivel": 73,
        "estilo_luta": "Proficiência em Bastões e Correntes",
        "atributos": {"forca": 66, "resistencia": 68, "velocidade": 40, "sentidos": 50, "inteligencia": 48, "poder_magico": 18},
        "elemento": "Metal",
        "habilidade_unica": "Disciplina Forçada — imobiliza um alvo com correntes por um turno, impedindo qualquer ação enquanto sofre dano contínuo leve.",
        "titulo": "O Carcereiro que Vendia Detentos",
        "equipamentos": {"arma": "Correntes e Bastão de Disciplina", "itens": "Uniforme Impecável, Molho de Chaves do Centro de Detenção, Registros Falsificados"},
        "tecnicas": ["Golpe das Correntes", "Punição Exemplar", "Investida Autoritária"]
    },
    {
        "papel": "Vilão", "base_em": "Helgenish (Octopath Traveler)", "nome": "Helgenish",
        "idade": "37", "nacionalidade": "Sul-coreano, caçador rival especializado em domar bestas de dungeon",
        "aparencia": "Corpo coberto de peles e trofeus de caça, cabelos longos desgrenhados presos em tranças rústicas, cicatrizes de mordidas cobrindo os braços.",
        "altura_peso": "1,88m / 92kg",
        "personalidade": "Competitivo até a obsessão, vê outros domadores como rivais a serem superados a qualquer custo.",
        "historia": "Domador de bestas rival de uma caçadora respeitada, Helgenish passou a expor feras capturadas a fragmentos de mana corrompida para torná-las mais fortes.",
        "classe": "[✦] Ranger", "classe_avancada": "O Domador Cruel", "rank": "A", "nivel": 81,
        "estilo_luta": "Proficiência em Lanças e Armadilhas",
        "atributos": {"forca": 70, "resistencia": 62, "velocidade": 58, "sentidos": 75, "inteligencia": 45, "poder_magico": 38},
        "elemento": "Terra",
        "habilidade_unica": "Corrupção Forçada — invoca sua besta corrompida para um ataque conjunto devastador, mas ambos recebem dano contínuo pelo resto da batalha.",
        "titulo": "O Domador que Corrompe suas Feras",
        "equipamentos": {"arma": "Lança de Caça Entalhada com Ossos", "itens": "Peles e Trofeus de Caça, Fragmentos de Mana Corrompida, Coleira Forçada"},
        "tecnicas": ["Investida da Fera Corrompida", "Armadilha Cruel", "Golpe Duplo Forçado"]
    },
    {
        "papel": "Vilão", "base_em": "Mother (Octopath Traveler)", "nome": "Entidade 'Mãe'",
        "idade": "Incontável — origem anterior à Associação", "nacionalidade": "Não-humano; entidade parasitária ligada a uma anomalia de mana ancestral",
        "aparencia": "Uma massa orgânica pulsante coberta por dezenas de rostos humanos parcialmente formados na superfície, todos sussurrando ao mesmo tempo.",
        "altura_peso": "Variável / massa crescente conforme absorve vítimas",
        "personalidade": "Fala com uma voz sedutora e maternal que promete acolhimento e cura eterna, mas que na verdade busca apenas absorver e assimilar quem se aproxima.",
        "historia": "Nascida de uma anomalia de mana que corrompeu um antigo santuário de cura, a entidade atrai vítimas enfraquecidas com promessas sussurradas de acolhimento.",
        "classe": "[✦] Curador", "classe_avancada": "A Entidade que Absorve o Sofrimento", "rank": "S", "nivel": 91,
        "estilo_luta": "Proficiência em Manipulação Orgânica",
        "atributos": {"forca": 55, "resistencia": 85, "velocidade": 20, "sentidos": 60, "inteligencia": 50, "poder_magico": 88},
        "elemento": "Escuridão",
        "habilidade_unica": "Abraço Materno — tenta absorver um aliado com menos de 40% de HP; se bem-sucedido, cura a si mesma em grande quantidade e remove o aliado do combate.",
        "titulo": "A Mãe que Devora o Desespero",
        "equipamentos": {"arma": "Nenhuma (manipulação do próprio corpo orgânico)", "itens": "Rostos Sussurrantes Absorvidos, Núcleo do Santuário Corrompido"},
        "tecnicas": ["Sussurro do Acolhimento", "Expansão Parasitária", "Colapso da Massa Materna"]
    },
    // ===== Vilões OT2 Ordem da Meia-Noite =====
    {
        "papel": "Vilão", "base_em": "Mugen (Octopath Traveler II — rota de Hikari)", "nome": "Mugen Ku",
        "idade": "50", "nacionalidade": "Sul-coreano, usurpador de uma guilda tradicional de artes marciais",
        "aparencia": "Corpo maciço coberto por armadura de placas negras entalhadas com símbolos de clã, cabelos grisalhos longos amarrados em um rabo severo.",
        "altura_peso": "1,95m / 110kg",
        "personalidade": "Ambicioso, cruel e absolutamente convencido de que força é a única verdade que importa.",
        "historia": "Antigo instrutor de segunda linha, Mugen orquestrou um golpe sangrento contra a liderança legítima da guilda, culpando um jovem herdeiro.",
        "classe": "[✦] Lutador", "classe_avancada": "O Usurpador do Clã", "rank": "S", "nivel": 96,
        "estilo_luta": "Proficiência em Espadas",
        "atributos": {"forca": 92, "resistencia": 84, "velocidade": 55, "sentidos": 58, "inteligencia": 50, "poder_magico": 35},
        "elemento": "Escuridão",
        "habilidade_unica": "Lâmina Corrosiva do Usurpador — cada golpe acerta com um veneno corrosivo que reduz permanentemente a defesa do alvo, acumulando-se a cada acerto.",
        "titulo": "O Usurpador que Corrompeu o Clã",
        "equipamentos": {"arma": "Espada Negra Corrosiva", "itens": "Armadura de Placas Negras, Símbolos do Clã Usurpado, Registro de Lutadores Leais"},
        "tecnicas": ["Corte da Usurpação", "Fúria do Tirano", "Golpe Corrosivo Final"]
    },
    {
        "papel": "Vilão", "base_em": "Oboro / Kazan (Ordem da Meia-Noite — ligado a Hikari)", "nome": "Kazan",
        "idade": "34", "nacionalidade": "Sul-coreano, ex-conselheiro de confiança tornado agente duplo",
        "aparencia": "Postura calma e confiável, cabelos negros curtos, veste roupas discretas de conselheiro que escondem uma lâmina fina.",
        "altura_peso": "1,77m / 68kg",
        "personalidade": "Paciente, ressentido por décadas e convencido de que o mundo atual não merece continuar existindo.",
        "historia": "Conselheiro de confiança de um importante líder de guilda, Kazan carrega o trauma de ter visto seu reino de origem ser conquistado e destruído.",
        "classe": "[✦] Assassino", "classe_avancada": "O Conselheiro Traidor", "rank": "A", "nivel": 89,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 55, "resistencia": 46, "velocidade": 78, "sentidos": 82, "inteligencia": 75, "poder_magico": 40},
        "elemento": "Sombra",
        "habilidade_unica": "Conselho Envenenado — manipula um aliado inimigo para revelar informações estratégicas do próprio grupo, reduzindo a defesa de toda a equipe adversária por 2 turnos.",
        "titulo": "O Conselheiro que Odeia o Amanhã",
        "equipamentos": {"arma": "Lâmina Fina Escondida nas Vestes", "itens": "Roupas Discretas de Conselheiro, Registro de Manipulações Passadas, Símbolo da Organização Oculta"},
        "tecnicas": ["Corte da Traição Silenciosa", "Sussurro Niilista", "Golpe do Conselheiro Falso"]
    },
    {
        "papel": "Vilã", "base_em": "Tanzy (Ordem da Meia-Noite — ligada a Agnea)", "nome": "Tanzy Woo",
        "idade": "31", "nacionalidade": "Sul-coreana, ex-empresária do meio artístico",
        "aparencia": "Elegante e magnética, cabelos loiros longos impecavelmente cacheados, veste roupas caras de produtora de eventos.",
        "altura_peso": "1,70m / 56kg",
        "personalidade": "Charmosa e calculista, trata talentos artísticos como ativos a serem explorados e descartados.",
        "historia": "Empresária que constrói e destrói carreiras de jovens artistas conforme sua utilidade para uma agenda maior.",
        "classe": "[✦] Assassino", "classe_avancada": "A Produtora das Sombras", "rank": "B", "nivel": 77,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 35, "resistencia": 38, "velocidade": 62, "sentidos": 68, "inteligencia": 72, "poder_magico": 45},
        "elemento": "Cristal",
        "habilidade_unica": "Contrato Vantajoso — oferece um 'acordo' ao inimigo que, se recusado, aplica um debuff severo de sorte e evasão pelo resto da batalha.",
        "titulo": "A Empresária que Descarta Estrelas",
        "equipamentos": {"arma": "Par de Adagas Ornamentadas", "itens": "Contratos em Branco, Roupas de Produtora Elegante, Lista de Talentos Descartados"},
        "tecnicas": ["Corte do Contrato", "Manipulação do Palco", "Golpe da Estrela Apagada"]
    },
    {
        "papel": "Vilão", "base_em": "Ori (Ordem da Meia-Noite — ligado a Partitio)", "nome": "Ori Choi",
        "idade": "26", "nacionalidade": "Sul-coreana, repórter infiltrada de aparência inofensiva",
        "aparencia": "Aparência jovem e desajeitada de propósito, cabelos castanhos bagunçados, sempre carregando um bloco de notas.",
        "altura_peso": "1,60m / 50kg",
        "personalidade": "Extremamente convincente em seu disfarce de repórter desengonçada, escondendo uma frieza calculista completa.",
        "historia": "Disfarçada como jornalista freelancer, Ori coleta informações estratégicas para uma organização oculta interessada em controlar rotas comerciais.",
        "classe": "[✦] Assassino", "classe_avancada": "A Repórter Infiltrada", "rank": "B", "nivel": 68,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 32, "resistencia": 34, "velocidade": 70, "sentidos": 80, "inteligencia": 68, "poder_magico": 30},
        "elemento": "Vento",
        "habilidade_unica": "Reportagem Comprometedora — revela um segredo do inimigo que reduz sua moral, causando dano contínuo leve enquanto o efeito de 'exposição' durar.",
        "titulo": "A Jornalista que Nunca Foi Quem Dizia Ser",
        "equipamentos": {"arma": "Adagas Disfarçadas de Ferramentas de Reportagem", "itens": "Bloco de Notas Codificado, Câmera Improvisada, Crachá de Jornalista Falso"},
        "tecnicas": ["Corte da Exposição", "Fuga do Disfarce", "Golpe da Fonte Anônima"]
    },
    {
        "papel": "Vilão", "base_em": "Harvey (Ordem da Meia-Noite — ligado a Osvald)", "nome": "Harvey Jeong",
        "idade": "51", "nacionalidade": "Sul-coreano, ex-pesquisador-chefe e colega de longa data de um cientista renomado",
        "aparencia": "Aparência acadêmica refinada, cabelos grisalhos bem cuidados, veste casaco de laboratório imaculado mesmo em campo.",
        "altura_peso": "1,80m / 74kg",
        "personalidade": "Obcecado por poder arcano absoluto ao ponto de justificar qualquer crime como 'necessário para o avanço do conhecimento'.",
        "historia": "Ex-parceiro de pesquisa, Harvey assassinou a esposa e a filha do colega, incriminando-o pelo crime para se apropriar de uma pesquisa proibida.",
        "classe": "[✦] Mago da Maldicao", "classe_avancada": "O Pesquisador Traidor", "rank": "S", "nivel": 98,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 30, "resistencia": 50, "velocidade": 42, "sentidos": 62, "inteligencia": 97, "poder_magico": 96},
        "elemento": "Escuridão",
        "habilidade_unica": "Magia Verdadeira Roubada — consome parte de seu próprio HP para desferir um feitiço de dano massivo em área, ignorando qualquer forma de resistência mágica do inimigo.",
        "titulo": "O Pesquisador que Traiu o Melhor Amigo",
        "equipamentos": {"arma": "Cajado de Pesquisa Proibida", "itens": "Casaco de Laboratório Imaculado, Anotações da Magia Primordial Roubada, Frasco de Controle Mental"},
        "tecnicas": ["Explosão da Magia Roubada", "Julgamento do Traidor", "Colapso Arcano Absoluto"]
    },
    {
        "papel": "Vilã", "base_em": "Arcanette (Ordem da Meia-Noite — ligada a Temenos)", "nome": "Arcanette",
        "idade": "Aparenta 29 anos (idade real desconhecida)", "nacionalidade": "Origem desconhecida, associada a rituais anteriores à Associação",
        "aparencia": "Beleza etérea e perturbadora, cabelos prateados longos, veste trajes cerimoniais adornados com símbolos de um culto extinto.",
        "altura_peso": "1,68m / desconhecido",
        "personalidade": "Manipuladora nível mestre, capaz de identificar e explorar traumas alheios com precisão cirúrgica.",
        "historia": "Agente de altíssimo nível de uma organização oculta, Arcanette especializou-se em manipular figuras de autoridade dentro da Associação.",
        "classe": "[✦] Mago da Maldicao", "classe_avancada": "A Manipuladora de Traumas", "rank": "S", "nivel": 95,
        "estilo_luta": "Proficiência em Cajados e Orbes",
        "atributos": {"forca": 38, "resistencia": 55, "velocidade": 52, "sentidos": 78, "inteligencia": 88, "poder_magico": 93},
        "elemento": "Escuridão",
        "habilidade_unica": "Manipulação do Trauma — força um inimigo aleatório a atacar seu próprio aliado mais próximo por um turno, explorando traumas ocultos revelados durante o combate.",
        "titulo": "A Manipuladora por Trás da Vendeta",
        "equipamentos": {"arma": "Cajado Cerimonial de Rituais Proibidos", "itens": "Trajes de Culto Extinto, Registros de Traumas Alheios, Máscara Cerimonial"},
        "tecnicas": ["Sussurro da Vingança", "Ritual da Manipulação", "Colapso do Trauma Revelado"]
    },
    {
        "papel": "Vilã", "base_em": "Kaldena (Octopath Traveler II — rota de Temenos)", "nome": "Kaldena Ryu",
        "idade": "38", "nacionalidade": "Sul-coreana, capitã de guarda obcecada por vingança",
        "aparencia": "Postura militar rígida marcada por cicatrizes de um massacre, cabelos negros cortados curtos, veste armadura de capitã reforçada.",
        "altura_peso": "1,79m / 72kg",
        "personalidade": "Consumida por dor e raiva desde a perda de todo o clã ao qual pertencia, tornou-se implacável na busca por poder.",
        "historia": "Sobrevivente de um massacre orquestrado contra seu clã, Kaldena dedicou a vida a caçar os responsáveis, ascendendo através das fileiras da Associação.",
        "classe": "[✦] Lutador", "classe_avancada": "A Capitã Consumida pela Vingança", "rank": "A", "nivel": 90,
        "estilo_luta": "Proficiência em Espadas",
        "atributos": {"forca": 80, "resistencia": 68, "velocidade": 60, "sentidos": 65, "inteligencia": 48, "poder_magico": 50},
        "elemento": "Escuridão",
        "habilidade_unica": "Fúria do Clã Perdido — quanto mais dano recebe, maior seu próximo golpe, entrando em um estado instável que ignora a própria segurança em busca de vingança.",
        "titulo": "A Capitã que Perdeu Tudo",
        "equipamentos": {"arma": "Espada com Runas de Proteção Instáveis", "itens": "Armadura Marcada pelo Massacre, Símbolo do Clã Perdido, Lista de Suspeitos"},
        "tecnicas": ["Corte da Vingança", "Fúria Instável", "Golpe do Clã Destruído"]
    },
    {
        "papel": "Vilão", "base_em": "Claude (Ordem da Meia-Noite — ligado a Throné)", "nome": "Claude",
        "idade": "Aparenta 25 anos (idade real desconhecida — resultado de experimento oculto)", "nacionalidade": "Origem incerta; criado a partir de um experimento de uma organização oculta",
        "aparencia": "Beleza perturbadora e artificial, cabelos negros perfeitamente simétricos, veste roupas escuras elegantes.",
        "altura_peso": "1,75m / 62kg",
        "personalidade": "Frio de uma forma quase inumana, trata pessoas — incluindo crianças que criou — como ferramentas descartáveis.",
        "historia": "Resultado de um experimento fracassado, Claude escapou de seus criadores e fundou sua própria organização criminosa, treinando crianças órfãs como ladras e assassinas.",
        "classe": "[✦] Assassino", "classe_avancada": "O Fundador Vazio", "rank": "S", "nivel": 94,
        "estilo_luta": "Proficiência em Adagas",
        "atributos": {"forca": 58, "resistencia": 50, "velocidade": 88, "sentidos": 85, "inteligencia": 78, "poder_magico": 55},
        "elemento": "Sombra",
        "habilidade_unica": "Controle da Coleira — inflige um debuff que impede o alvo de usar habilidades especiais por 2 turnos, simbolizando o mesmo controle que exerce sobre seus 'filhos'.",
        "titulo": "O Fundador Sem Coração dos Corvos Negros",
        "equipamentos": {"arma": "Par de Adagas Perfeitamente Simétricas", "itens": "Roupas Escuras Elegantes, Coleiras de Controle Sobressalentes, Registro de 'Filhos' Descartados"},
        "tecnicas": ["Corte do Vazio", "Controle Absoluto", "Golpe do Fundador Sem Alma"]
    },
    {
        "papel": "Vilão", "base_em": "Petrichor (Ordem da Meia-Noite — ligado a Ochette)", "nome": "Petrichor",
        "idade": "Desconhecida — 'Caçador Sombrio' de origem obscura", "nacionalidade": "Origem incerta; caçador ligado a uma organização oculta",
        "aparencia": "Vestido em peles escuras de criaturas corrompidas, rosto quase sempre coberto por uma máscara ritualística.",
        "altura_peso": "1,85m / 78kg",
        "personalidade": "Frio e desapegado da vida que corrompe, vê criaturas e comunidades como recursos a serem explorados.",
        "historia": "Agente de uma organização oculta especializado em corromper deliberadamente a fauna de dungeon através de exposição controlada a mana negra.",
        "classe": "[✦] Ranger", "classe_avancada": "O Caçador Sombrio", "rank": "S", "nivel": 93,
        "estilo_luta": "Proficiência em Lanças e Armadilhas",
        "atributos": {"forca": 75, "resistencia": 65, "velocidade": 70, "sentidos": 90, "inteligencia": 58, "poder_magico": 62},
        "elemento": "Escuridão",
        "habilidade_unica": "Corrupção Deliberada — expõe um monstro aliado a mana negra concentrada, ampliando drasticamente seu poder por 3 turnos ao custo da própria sanidade da criatura.",
        "titulo": "O Caçador que Corrompe o Que Toca",
        "equipamentos": {"arma": "Lança Ritualística de Caça", "itens": "Máscara Ritualística, Peles de Criaturas Corrompidas, Frascos de Mana Negra Concentrada"},
        "tecnicas": ["Investida da Corrupção", "Armadilha Sombria", "Golpe do Caçador Silencioso"]
    }
];

// =====================================
// GERAR ARQUIVOS
// =====================================
const DATA_DIR = path.join(__dirname, "..", "src", "npc", "data");
const COMMANDS_DIR = path.join(__dirname, "..", "src", "commands");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(COMMANDS_DIR)) fs.mkdirSync(COMMANDS_DIR, { recursive: true });

let totalGerados = 0;
const erros = [];

for (const npcOriginal of NPCS) {
    try {
        const classe = corrigirClasse(npcOriginal.classe);
        const classeAvancada = corrigirClasseAvancada(npcOriginal.classe_avancada, classe);
        const elemento = corrigirElemento(npcOriginal.elemento);
        const id = gerarId(npcOriginal.nome);
        
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
            localizacao: (npcOriginal.papel || "").toLowerCase().includes("vil") ? "Localização desconhecida — opera nas sombras" : "Coreia do Sul",
            profissao: (npcOriginal.papel || "").toLowerCase().includes("vil") ? "Antagonista" : `Caçador(a) ${classe}`,
            objetivos: (npcOriginal.papel || "").toLowerCase().includes("vil") ? "Expandir seu poder e influência, eliminando qualquer ameaça aos seus planos." : "Proteger os inocentes, evoluir como caçador e desvendar os mistérios dos portais.",
            valores: (npcOriginal.papel || "").toLowerCase().includes("vil") ? "O poder é o único caminho. A fraqueza é imperdoável. Os fins justificam os meios." : "A vida é preciosa. A coragem é essencial. A lealdade é inegociável."
        };
        
        const caminhoJSON = path.join(DATA_DIR, `${id}.json`);
        fs.writeFileSync(caminhoJSON, JSON.stringify(npc, null, 2), "utf8");
        
        gerarComando(npc);
        
        totalGerados++;
        console.log(`[OK] NPC gerado: ${npc.nome} (${id}) - Classe: ${classe} - Avançada: ${classeAvancada}`);
    } catch (err) {
        erros.push(`${npcOriginal.nome}: ${err.message}`);
        console.error(`[ERRO] Falha ao gerar ${npcOriginal.nome}:`, err.message);
    }
}

console.log(`\n========================================`);
console.log(`Total de NPCs extras gerados: ${totalGerados}`);
if (erros.length > 0) {
    console.log(`Erros: ${erros.length}`);
    erros.forEach(e => console.log(`  - ${e}`));
}
console.log(`========================================`);

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
        return "Fala de forma prática e observadora, com um tom calmo e conectado à natureza.";
    }
    if (npc.classe && npc.classe.includes("Mago")) {
        return "Fala com inteligência e curiosidade, frequentemente fazendo referências a conhecimentos arcanos.";
    }
    return "Fala de forma natural e amigável, adaptando o tom conforme a situação.";
}

function gerarComando(npc) {
    const id = npc.id;
    const nome = npc.nome;
    
    const conteudo = `/**
 * COMANDO: !${id}
 * 
 * Exibe a ficha completa do NPC ${nome}.
 */

const NPCManager = require("../npc/npcManager");

module.exports = async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    
    const npc = NPCManager.carregarNPC("${id}");
    
    if (!npc) {
        return msg.reply("*✖ NPC não encontrado.*");
    }
    
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