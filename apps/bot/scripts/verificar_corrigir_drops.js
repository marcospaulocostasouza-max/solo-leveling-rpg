/*
 * VERIFICAÇÃO E CORREÇÃO DE CATEGORIAS DE DROPS
 * 
 * Verifica todos os itens do dungeon_drops.json e corrige as categorias
 * para que correspondam aos slots do InventorySystem.
 */

const fs = require("fs");
const path = require("path");

const arquivoDrops = path.join(__dirname, "..", "src", "database", "dungeon_drops.json");

// =====================================
// MAPEAMENTO DE ITENS POR SLOT
// Baseado na Biblioteca de Equipamentos
// =====================================

// Palavras-chave para Cabeça (apenas termos específicos de cabeça)
const KEYWORDS_CABECA = [
    "capacete", "elmo", "coroa", "diadema", "tiara", "circlete",
    "bandana", "capuz", "chapéu", "cartola", "boina", "boné",
    "máscara facial", "máscara respiratória", "máscara de tecido", "máscara pequena",
    "meia-máscara", "respirador médico", "protetor facial", "viseira",
    "óculos", "goggles", "monóculo", "tapa-olho", "auréola",
    "chifres artificiais", "chifres ornamentais", "orelhas artificiais", "antenas",
    "crista", "penacho", "pluma", "cocar", "turbante", "keffiyeh", "kufi",
    "solidéu", "mitra", "grinalda", "guirlanda",
    "touca", "gorro", "balaclava", "peruca", "trança postiça",
    "prendedor de cabelo", "presilha", "grampos", "fivela de cabelo",
    "protetor de testa", "protetor craniano", "protetor auricular",
    "abafador", "headset tático", "headphone",
    "dispositivo craniano", "interface neural",
    "coroa mecânica", "arnês craniano", "exoesqueleto craniano",
    "visor holográfico", "scanner ocular", "lentes inteligentes", "lupa ocular",
    "olho mecânico", "implante ocular", "monóculo tecnológico", "visor térmico",
    "visor noturno", "visor mágico", "visor espiritual", "visor de combate",
    "coroa flutuante", "halo",
    "cristal frontal", "gema frontal", "símbolo frontal", "selo frontal",
    "emblema frontal", "placa frontal", "pingente de testa", "corrente de testa",
    "corrente craniana", "adorno de testa", "adorno de cabelo", "adorno cerimonial",
    "ornamento craniano", "enfeite plumado", "enfeite metálico", "enfeite ósseo",
    "enfeite cristalino", "enfeite floral",
    "véu facial", "véu de cabeça", "capelo",
    "capacete integral", "capacete aberto", "capacete modular", "capacete tático",
    "capacete de piloto", "capacete de mergulho", "capacete espacial",
    "capacete ritualístico", "capacete tribal", "capacete esportivo",
    "capacete de mineração", "capacete de construção", "capacete ceremonial",
    "coroa de espinhos", "coroa de flores", "coroa de folhas",
    "touca de couro", "touca acolchoada", "touca metálica", "touca de malha",
    "tiara esportiva", "laço de cabeça", "fita de cabeça",
    "dispositivo de comunicação craniano"
];

// Palavras-chave para Corpo
const KEYWORDS_CORPO = [
    "armadura", "couraça", "peitoral", "cota de malha", "gibão", "jaqueta", "casaco",
    "sobretudo", "manto", "capa", "poncho", "colete", "uniforme", "túnica", "robe",
    "vestes", "traje", "macacão", "kimono", "haori", "yukata", "hanfu", "hanbok",
    "cheongsam", "manto sacerdotal", "hábito", "batina", "jaleco", "avental",
    "camisa", "camiseta", "blusa", "regata", "moletom", "suéter", "cardigã",
    "casaca", "fraque", "paletó", "blazer", "casaco de pele", "casaco acolchoado",
    "casaco impermeável", "capa de chuva", "capa de viagem", "capa de invisibilidade",
    "manto real", "manto imperial", "manto de guerra", "manto de comando",
    "manto cerimonial", "toga", "tabardo", "gambesão", "corselete", "corpete",
    "espartilho", "arnês", "arnês tático", "arnês peitoral", "harness",
    "faixa torácica", "bandoleira", "suspensório tático", "exoesqueleto",
    "exoesqueleto parcial", "exoesqueleto completo", "placas peitorais",
    "blindagem torácica", "carapaça", "carapaça biológica", "casulo", "envoltório",
    "mortalha", "xale", "estola", "pelerine", "capa curta", "capa longa",
    "túnica de batalha", "túnica de viagem", "uniforme escolar", "uniforme militar",
    "uniforme médico", "uniforme operacional", "uniforme ceremonial",
    "roupa de caçador", "roupa de mercenário", "roupa de alquimista",
    "roupa de ferreiro", "roupa de sacerdote", "roupa de monge", "roupa de assassino",
    "roupa de ninja", "roupa de mago", "roupa de arqueiro", "roupa de explorador",
    "roupa de sobrevivência", "roupa térmica", "roupa antichamas",
    "roupa anticorrosiva", "roupa camuflada", "roupa de treinamento",
    "vestimenta ritual", "vestimenta nobre", "vestimenta tribal",
    "vestimenta tradicional", "vestimenta de gala", "vestimenta de caça",
    "vestimenta de guerra", "vestimenta de campo", "vestimenta de expedição",
    "vestimenta de patrulha", "vestimenta de elite", "vestimenta tática",
    "vestimenta reforçada", "vestimenta leve", "vestimenta pesada",
    "vestimenta modular", "vestimenta adaptativa", "módulo peitoral",
    "unidade torácica", "plastrão", "escudo peitoral", "couraça segmentada",
    "couraça articulada", "couraça leve", "couraça pesada", "colete tático",
    "colete balístico", "traje de combate", "traje cerimonial", "traje formal",
    "traje tático", "traje de exploração", "traje espacial", "traje de mergulho",
    "macacão tático", "hakama superior", "manto de comando", "sobretudo longo",
    "sobretudo curto", "jaqueta de couro", "jaqueta militar", "suspensório",
    "blindagem", "torácica", "peitoral", "colete", "túnica", "vestimenta",
    "roupa", "uniforme", "casaco", "capa", "manto", "traje", "macacão"
];

// Palavras-chave para Pernas
const KEYWORDS_PERNAS = [
    "calças", "calça", "bermudas", "shorts", "saia", "saiote", "hakama",
    "saruel", "legging", "calça justa", "calça larga", "calça cargo",
    "calça de explorador", "calça de montaria", "macacão inferior", "tanga",
    "lungi", "kilt", "perneiras", "grevas", "grevas articuladas", "grevas blindadas",
    "grevas metálicas", "caneleiras", "joelheiras", "joelheiras táticas",
    "joelheiras blindadas", "protetores de joelho", "protetores de coxa",
    "protetores de quadril", "protetores de perna", "placas de coxa",
    "placas de perna", "placas de quadril", "blindagem de coxa",
    "blindagem de quadril", "blindagem de perna", "arnês de coxa",
    "arnês de perna", "arnês de quadril", "cinto de coxa", "correia de coxa",
    "correia de perna", "faixa de coxa", "faixa de perna", "faixa de quadril",
    "cinta de quadril", "cinta lombar", "suspensório de coxa", "manga de perna",
    "manga de compressão", "cobertura de perna", "cobertura de coxa",
    "exoperna", "prótese de perna", "prótese de coxa", "interface de perna",
    "módulo de perna", "módulo de coxa", "módulo de quadril",
    "estabilizador de perna", "estabilizador de joelho", "estrutura de quadril",
    "estrutura de perna", "saia blindada", "saia cerimonial", "saia de batalha",
    "saia plissada", "saia longa", "saia curta", "saiote de guerra",
    "saiote tático", "hakama de combate", "hakama ceremonial",
    "cinturão", "cinto", "cinto tático", "cinto de guerra", "cinto ceremonial",
    "cinto de ferramentas", "cinto de utilidades", "cinto de munição",
    "cinto modular", "cinto de explorador", "cinto de sobrevivência",
    "cinto de escalada", "cinto de segurança", "tiras de perna", "tiras de coxa",
    "estribo de perna", "reforço de quadril", "reforço de joelho",
    "reforço de coxa", "faixa de cintura", "calças táticas", "calças de combate",
    "calças militares", "calças de couro", "calças de tecido", "calças reforçadas",
    "calças blindadas", "calças de malha", "calças ceremonial", "calças nobres",
    "calças casuais", "legging de compressão", "perneira", "cinto ornamental",
    "cinto de acessório", "corrente de cintura", "suspensório", "bandoleira",
    "cinto de coxa", "arnês de perna", "arnês de quadril"
];

// Palavras-chave para Pés
const KEYWORDS_PES = [
    "botas", "botas longas", "botas curtas", "botas de combate", "botas táticas",
    "botas militares", "botas de couro", "botas reforçadas", "botas blindadas",
    "botas pesadas", "botas leves", "botas de montaria", "botas de escalada",
    "botas de caminhada", "botas de caçador", "botas de explorador",
    "botas de aventureiro", "botas de trabalho", "botas de neve", "botas de chuva",
    "botas de mergulho", "botas de piloto", "botas espaciais", "botas magnéticas",
    "botas propulsoras", "botas mecânicas", "botas articuladas", "botas modulares",
    "botas exoesqueléticas", "botas de segurança", "botins", "botinas",
    "sapatos", "sapatos sociais", "sapatos formais", "sapatos de couro",
    "sapatos reforçados", "sapatos de combate", "sapatos táticos",
    "sapatos de corrida", "sapatos de escalada", "sapatos de dança",
    "sapatos ceremonial", "sapatos nobres", "sapatilhas", "sapatilhas de combate",
    "sapatilhas de movimento", "tênis", "tênis esportivos", "tênis de combate",
    "tênis táticos", "tênis de corrida", "tênis reforçados", "sandálias",
    "sandálias de combate", "sandálias de guerreiro", "sandálias de monge",
    "sandálias ceremonial", "sandálias de viagem", "chinelos", "tamancos",
    "alpargatas", "mocassins", "loafers", "coturnos", "coturnos militares",
    "coturnos táticos", "coturnos blindados", "coturnos de campo", "galochas",
    "patins", "patins de combate", "patins magnéticos", "patins mecânicos",
    "nadadeiras", "nadadeiras de mergulho", "grevas de pé", "grevas integrais",
    "protetores de pé", "protetores de calcanhar", "protetores de tornozelo",
    "tornozeleiras", "tornozeleiras de combate", "tornozeleiras reforçadas",
    "tornozeleiras táticas", "tornozeleira", "tornozeleira de corrente",
    "faixas de pé", "faixas de tornozelo", "envoltórios de pé",
    "envoltórios de combate", "meias", "meias reforçadas", "meias táticas",
    "meias de compressão", "solas especiais", "palmilhas", "palmilhas reforçadas",
    "palmilhas de movimento", "estruturas de pé", "próteses de pé",
    "pés mecânicos", "pés biônicos", "módulos de pé", "unidades de movimento",
    "dispositivos de aderência", "dispositivos de salto", "dispositivos de equilíbrio",
    "sapatos de combate", "calçados", "bota", "sapato", "sandalha",
    "tênis de combate", "calcanhar", "tornozelo", "pé", "pés"
];

// Palavras-chave para Acessórios
const KEYWORDS_ACESSORIOS = [
    "anel", "aliança", "anel de dedo", "anel de polegar", "anel duplo",
    "anel de falange", "anel de sinete", "colar", "gargantilha", "corrente",
    "corrente de pescoço", "corrente corporal", "pingente", "medalhão",
    "amuleto", "talismã", "relicário", "rosário", "grampo", "broche",
    "insígnia", "emblema", "brasão", "distintivo", "medalha", "selo",
    "marca", "símbolo", "cristal", "gema", "pedra", "fragmento", "núcleo",
    "orbe", "esfera", "pérola", "joia", "diamante", "rubi", "safira",
    "esmeralda", "cristal de mana", "cristal elemental", "fragmento dimensional",
    "fragmento espiritual", "fragmento mágico", "núcleo de energia",
    "núcleo arcano", "núcleo artificial", "pedra filosofal", "relíquia",
    "artefato", "ídolo", "estatueta", "totem", "miniatura",
    "medalhão de comando", "placa de identificação", "placa de clã",
    "placa de guilda", "placa militar", "chave", "chave antiga",
    "chave dimensional", "chave mágica", "moeda", "medalha de honra",
    "insígnia militar", "insígnia real", "insígnia de caçador",
    "insígnia de classe", "pingente de cristal", "pingente de pedra",
    "pingente de metal", "pingente de osso", "pingente de madeira",
    "pingente de vidro", "brinco", "brinco duplo", "brinco de argola",
    "brinco de cristal", "brinco de pena", "brinco de corrente",
    "piercing", "piercing facial", "piercing auricular", "piercing nasal",
    "bracelete", "pulseira", "pulseira de couro", "pulseira metálica",
    "pulseira de contas", "pulseira de cristal", "pulseira de corrente",
    "tornozeleira metálica", "luva de acessório", "faixa de braço",
    "faixa de pescoço", "bolsa pequena", "bolsa dimensional", "bolsa de poções",
    "bolsa de componentes", "estojo", "estojo mágico", "estojo de ferramentas",
    "livro pequeno", "grimório portátil", "pergaminho selado", "mapa dobrável",
    "bússola", "bússola mágica", "relógio", "relógio de bolso", "ampulheta",
    "relógio mágico", "máscara pequena", "pingente de relógio", "pena de escrita",
    "caneta", "lápis mágico", "tinta especial", "frasco pequeno", "ampola",
    "cápsula", "recipiente", "garrafa miniatura", "lanterna pequena",
    "luminária portátil", "comunicador", "rádio", "dispositivo de comunicação",
    "sensor", "scanner", "projetor", "holograma portátil", "chip", "implante",
    "interface neural", "dispositivo de rastreamento", "localizador",
    "catalisador", "foco mágico", "canalizador", "bastão curto", "vara curta",
    "orbe flutuante", "familiar artificial", "companheiro mecânico",
    "mascote pequeno", "selo de invocação", "selo de proteção", "selo de controle",
    "luvas", "manoplas", "braceletes", "braçadeiras", "munhequeiras",
    "pulseiras de combate", "protetores de antebraço", "antebraços blindados",
    "cotoveleiras", "mangas", "mangotes", "luvas sem dedos", "luvas de dedo inteiro",
    "luvas longas", "luvas curtas", "luvas táticas", "luvas ceremonial",
    "luvas de couro", "luvas de tecido", "luvas de malha", "luvas metálicas",
    "luvas reforçadas", "luvas isolantes", "luvas de escalada", "luvas de precisão",
    "luvas de operação", "luvas de ferreiro", "luvas de alquimista",
    "luvas cirúrgicas", "luvas de caçador", "luvas de arqueiro",
    "luvas de falcoeiro", "luvas de montaria", "luvas de operador",
    "luvas de piloto", "luvas de motociclista", "luvas de treinamento",
    "garras", "garras metálicas", "garras retráteis", "garras articuladas",
    "garras mecânicas", "garras de escalada", "punhos", "punhos blindados",
    "punhos reforçados", "punhos metálicos", "soqueiras", "soqueiras articuladas",
    "soqueiras pesadas", "manoplas de energia", "manoplas mecânicas",
    "manoplas hidráulicas", "manoplas de impacto", "exobraços", "exobraços táticos",
    "exobraços mecânicos", "próteses de braço", "próteses de antebraço",
    "braço mecânico", "braço biônico", "interface de braço",
    "amplificador de punho", "estabilizador de pulso", "anel de pulso",
    "cinta de pulso", "faixa de pulso", "correia de antebraço",
    "correia de cotovelo", "arnês de braço", "arnês de antebraço",
    "escudo de braço", "escudo de antebraço", "placa de braço",
    "placa de antebraço", "blindagem de cotovelo", "módulo de braço",
    "módulo de punho", "módulo de antebraço", "faixa de braço",
    "faixa de bíceps", "braçal", "braçal militar", "braçal ceremonial",
    "braçal de comando", "insígnia de braço", "emblema de manga",
    "patch tático", "manga blindada", "manga compressora", "manga reforçada",
    "manga ceremonial", "manga tática", "manga longa de combate",
    "manga modular", "cobertura de braço", "cobertura de antebraço",
    "proteção de pulso", "proteção de mão", "proteção de dedos", "dedeiras",
    "exoluva", "interface neural de braço", "unidade de punho",
    "unidade de antebraço", "unidade de cotovelo", "luva", "manopla",
    "bracelete", "braçadeira", "munhequeira", "pulseira", "antebraço",
    "cotoveleira", "manga", "mangote", "garra", "punho", "soqueira",
    "exobraço", "prótese de braço", "braço mecânico", "braço biônico",
    "interface de braço", "amplificador", "estabilizador", "anel de pulso",
    "cinta de pulso", "faixa de pulso", "correia", "arnês de braço",
    "escudo de braço", "placa de braço", "blindagem de cotovelo",
    "módulo", "faixa de braço", "faixa de bíceps", "braçal",
    "insígnia de braço", "emblema de manga", "patch", "manga blindada",
    "manga compressora", "manga reforçada", "manga ceremonial",
    "manga tática", "manga longa", "manga modular", "cobertura de braço",
    "cobertura de antebraço", "proteção de pulso", "proteção de mão",
    "proteção de dedos", "dedeira", "exoluva", "unidade de punho",
    "unidade de antebraço", "unidade de cotovelo", "bracelete",
    "faixa de pescoço", "faixa de cintura", "cinto ornamental",
    "cinto de acessório", "corrente de cintura", "bolsa", "estojo",
    "livro pequeno", "grimório portátil", "pergaminho", "mapa",
    "bússola", "relógio", "ampulheta", "máscara pequena",
    "pingente", "pena", "caneta", "lápis", "tinta", "frasco",
    "ampola", "cápsula", "recipiente", "garrafa", "lanterna",
    "luminária", "comunicador", "rádio", "dispositivo", "sensor",
    "scanner", "projetor", "holograma", "chip", "implante",
    "interface", "localizador", "catalisador", "foco mágico",
    "canalizador", "bastão curto", "vara curta", "orbe flutuante",
    "familiar", "companheiro", "mascote", "selo de invocação",
    "selo de proteção", "selo de controle", "anel", "colar", "amuleto",
    "talismã", "relicário", "rosário", "grampo", "broche", "insígnia",
    "emblema", "brasão", "distintivo", "medalha", "símbolo",
    "cristal", "gema", "pedra", "fragmento", "núcleo", "orbe",
    "esfera", "pérola", "joia", "diamante", "rubi", "safira",
    "esmeralda", "relíquia", "artefato", "ídolo", "estatueta",
    "totem", "miniatura", "chave", "moeda", "brinco", "piercing",
    "pulseira", "tornozeleira", "luva de acessório"
];

// Palavras-chave para Item de Apoio (Consumível)
const KEYWORDS_APOIO = [
    "bolsa de moedas", "bolsa de cristais", "bolsa de gemas", "bolsa de ingredientes",
    "bolsa de relíquias", "bolsa de caça", "bolsa de pesca", "bolsa de ervas",
    "bolsa de mineração", "bolsa de arqueologia", "bolsa de coleta",
    "bolsa de transporte", "bolsa oculta", "bolsa compactadora", "bolsa sem fundo",
    "mochila de escalada", "mochila militar", "mochila de campanha",
    "mochila de sobrevivência", "mochila de combate", "mochila de explorador",
    "mochila de alpinista", "mochila de mergulho", "mochila de caçador",
    "mochila de alquimista", "mochila de engenheiro", "picareta", "pá",
    "machado", "facão", "foice", "tesoura", "alicate", "martelo",
    "chave inglesa", "chave de fenda", "serra", "furadeira", "broca",
    "escova de escavação", "kit de escavação", "kit arqueológico",
    "kit de pesquisa", "kit de investigação", "kit de rastreamento",
    "kit de sobrevivência", "kit de caçador", "kit de explorador",
    "kit de navegação", "lupa", "lente de investigação", "lente de análise",
    "lente de rastreamento", "cristal de rastreamento", "esfera de rastreamento",
    "sensor de movimento", "sensor de presença", "sensor de calor",
    "sensor de mana", "sensor de energia", "detector de armadilhas",
    "detector de monstros", "detector de tesouros", "detector de portais",
    "detector dimensional", "scanner de área", "scanner corporal",
    "scanner de cristal", "analisador de mana", "analisador de núcleo",
    "medidor de energia", "medidor de pressão", "medidor de profundidade",
    "medidor de distância", "comunicador portátil", "rádio tático",
    "transmissor", "receptor", "intercomunicador", "cristal de comunicação",
    "cristal de voz", "cristal de mensagem", "pergaminho de comunicação",
    "carta mágica", "sinalizador", "sinalizador luminoso",
    "sinalizador de emergência", "baliza", "torre portátil", "antena portátil",
    "barraca", "barraca portátil", "barraca camuflada", "barraca reforçada",
    "tenda", "tenda militar", "tenda de expedição", "cama portátil",
    "rede", "rede de descanso", "saco de dormir", "cobertor", "manta térmica",
    "colchonete", "fogareiro", "fogueira portátil", "fornalha portátil",
    "panela", "utensílios de cozinha", "kit de cozinha", "cantil",
    "cantil reforçado", "filtro de água", "purificador de água", "reservatório",
    "bolsa médica", "kit médico", "kit cirúrgico", "kit de emergência",
    "kit de cura", "estojo médico", "bandagem", "atadura", "gaze",
    "curativo", "sutura", "agulha médica", "seringa", "injetor",
    "estimulante", "analgésico", "antídoto", "neutralizador", "remédio",
    "erva medicinal", "compressa", "máscara médica", "respirador médico",
    "caldeirão", "frasco alquímico", "tubo de ensaio", "recipiente de mistura",
    "destilador", "filtro alquímico", "balança", "colher de mistura",
    "pilão", "almofariz", "forno pequeno", "kit de alquimia",
    "caixa de ingredientes", "livro de receitas", "caderno de pesquisa",
    "catalisador", "reagente", "conservante", "extrator de essência",
    "caixa organizadora", "caixa modular", "caixa blindada", "caixa selada",
    "cofre portátil", "cofre dimensional", "armário portátil", "estante compacta",
    "organizador de itens", "estojo modular", "compartimento oculto",
    "compartimento secreto", "contêiner", "contêiner blindado",
    "recipiente de mana", "recipiente de energia", "tocha", "lanterna",
    "lanterna mágica", "lanterna infinita", "vela", "luz química",
    "mapa de dungeon", "mapa incompleto", "mapa revelado", "bússola de dungeon",
    "chave de atalho", "marcador de caminho", "griz", "marcador mágico",
    "bandeira de marcação", "estaca", "sensor de armadilha", "detector de sala",
    "detector de tesouro", "detector de boss", "cristal de retorno",
    "portal de retorno", "pergaminho de fuga", "sinalizador de localização",
    "âncora dimensional", "rede", "rede reforçada", "rede elétrica",
    "rede mágica", "armadilha", "armadilha portátil", "armadilha de captura",
    "jaula portátil", "prisão portátil", "algemas", "algemas reforçadas",
    "correntes de contenção", "grilhões", "selo de contenção",
    "frasco de captura", "recipiente de monstro", "cristal de captura",
    "esfera de captura", "cápsula de contenção", "cubo dimensional",
    "cristal de memória", "cristal de registro", "diário de aventura",
    "livro de registros", "fragmento antigo", "estátua pequena",
    "amuleto de viagem", "medalhão de emergência", "chave mestra",
    "passe dimensional", "selo antigo", "fragmento de portal",
    "gerador de portal", "portal portátil", "núcleo portátil",
    "fonte de energia portátil", "mochila", "bolsa de", "kit de",
    "kit médico", "estojo", "cantil", "bandagem", "atadura",
    "gaze", "curativo", "sutura", "seringa", "injetor",
    "estimulante", "analgésico", "antídoto", "neutralizador",
    "remédio", "erva medicinal", "compressa", "caldeirão",
    "frasco alquímico", "tubo de ensaio", "destilador", "filtro",
    "almofariz", "forno", "caixa", "cofre", "armário",
    "estante", "organizador", "compartimento", "contêiner",
    "tocha", "lanterna", "vela", "mapa", "marcador",
    "bandeira", "estaca", "cristal de retorno", "pergaminho de fuga",
    "sinalizador", "âncora", "rede", "armadilha", "jaula",
    "prisão", "algemas", "grilhões", "frasco de captura",
    "cristal de captura", "esfera de captura", "cápsula de contenção",
    "cubo", "cristal de memória", "diário", "livro de registros",
    "fragmento antigo", "estátua", "chave mestra", "passe dimensional",
    "selo antigo", "fragmento de portal", "gerador de portal",
    "portal portátil", "núcleo portátil", "fonte de energia",
    "mochila de campanha", "bolsa de mineração", "bolsa de componentes",
    "bolsa de poções", "bolsa de ervas", "bolsa de caça", "bolsa de relíquias",
    "bolsa de ingredientes", "bolsa de pesca", "bolsa dimensional",
    "bolsa sem fundo", "cofre portátil", "cofre dimensional",
    "caixa blindada", "caixa modular", "caixa de ingredientes",
    "compartimento oculto", "compartimento secreto", "contêiner",
    "recipiente", "cápsula de contenção", "frasco de captura",
    "esfera de captura", "prisão portátil", "jaula portátil",
    "algemas", "tenda", "barraca", "barraca camuflada",
    "colchonete", "saco de dormir", "cama portátil", "manta térmica",
    "cobertor", "kit de emergência", "kit de alquimia", "kit de investigação",
    "kit de rastreamento", "kit de navegação", "kit de explorador",
    "estojo de ferramentas", "estojo médico", "estojo modular",
    "estojo mágico", "mochila de alpinista", "mochila de explorador",
    "mochila militar", "bandoleira", "mapa revelado", "bússola de dungeon",
    "detector de tesouro", "detector de armadilha", "detector de portais",
    "detector de monstros", "sensor de energia", "sensor de movimento",
    "sensor de presença", "scanner de cristal", "lanterna pequena",
    "lanterna infinita", "tocha", "forno pequeno", "caldeirão",
    "destilador", "filtro alquímico", "antídoto", "erva medicinal",
    "pergaminho selado", "pergaminho de fuga", "chave antiga",
    "chave mágica", "chave dimensional", "chave de atalho",
    "âncora dimensional", "passe dimensional", "cristal de retorno",
    "sinalizador", "sinalizador luminoso", "familiar artificial",
    "companheiro mecânico", "miniatura", "mascote pequeno",
    "diário de aventura", "carta mágica", "ampulheta", "relógio de bolso",
    "caneta", "tinta especial", "pena de escrita", "lápis mágico",
    "frasco alquímico", "injetor", "seringa", "agulha médica",
    "colher de mistura", "almofariz", "pá", "escova de escavação",
    "picareta", "grampo", "grampos", "pérola", "joia", "adorno",
    "adorno de cabelo", "fivela de cabelo", "prendedor de cabelo",
    "laço", "guirlanda", "enfeite", "enfeite floral", "enfeite metálico",
    "enfeite ósseo", "brasão", "símbolo", "relicário", "totem",
    "ídolo", "estatueta", "moeda", "fragmento", "fragmento mágico",
    "fragmento dimensional", "fragmento espiritual", "fragmento de portal",
    "pedra", "pedra filosofal", "orbe", "orbe flutuante", "esfera",
    "esfera de captura", "cápsula", "cápsula de contenção",
    "mochila de campanha", "bolsa de mineração", "bolsa de componentes",
    "bolsa de poções", "bolsa de ervas", "bolsa de caça", "bolsa de relíquias",
    "bolsa de ingredientes", "bolsa de pesca", "bolsa dimensional",
    "bolsa sem fundo", "cofre portátil", "cofre dimensional",
    "caixa blindada", "caixa modular", "caixa de ingredientes",
    "compartimento oculto", "compartimento secreto", "contêiner",
    "recipiente", "cápsula de contenção", "frasco de captura",
    "esfera de captura", "prisão portátil", "jaula portátil",
    "algemas", "tenda", "barraca", "barraca camuflada",
    "colchonete", "saco de dormir", "cama portátil", "manta térmica",
    "cobertor", "kit de emergência", "kit de alquimia", "kit de investigação",
    "kit de rastreamento", "kit de navegação", "kit de explorador",
    "estojo de ferramentas", "estojo médico", "estojo modular",
    "estojo mágico", "mochila de alpinista", "mochila de explorador",
    "mochila militar", "bandoleira", "mapa revelado", "bússola de dungeon",
    "detector de tesouro", "detector de armadilha", "detector de portais",
    "detector de monstros", "sensor de energia", "sensor de movimento",
    "sensor de presença", "scanner de cristal", "lanterna pequena",
    "lanterna infinita", "tocha", "forno pequeno", "caldeirão",
    "destilador", "filtro alquímico", "antídoto", "erva medicinal",
    "pergaminho selado", "pergaminho de fuga", "chave antiga",
    "chave mágica", "chave dimensional", "chave de atalho",
    "âncora dimensional", "passe dimensional", "cristal de retorno",
    "sinalizador", "sinalizador luminoso", "familiar artificial",
    "companheiro mecânico", "miniatura", "mascote pequeno",
    "diário de aventura", "carta mágica", "ampulheta", "relógio de bolso",
    "caneta", "tinta especial", "pena de escrita", "lápis mágico",
    "frasco alquímico", "injetor", "seringa", "agulha médica",
    "colher de mistura", "almofariz", "pá", "escova de escavação",
    "picareta", "grampo", "grampos", "pérola", "joia", "adorno",
    "adorno de cabelo", "fivela de cabelo", "prendedor de cabelo",
    "laço", "guirlanda", "enfeite", "enfeite floral", "enfeite metálico",
    "enfeite ósseo", "brasão", "símbolo", "relicário", "totem",
    "ídolo", "estatueta", "moeda", "fragmento", "fragmento mágico",
    "fragmento dimensional", "fragmento espiritual", "fragmento de portal",
    "pedra", "pedra filosofal", "orbe", "orbe flutuante", "esfera",
    "esfera de captura", "cápsula", "cápsula de contenção"
];

// =====================================
// FUNÇÃO DE VERIFICAÇÃO
// =====================================

function determinarSlot(nome) {
    const nomeLower = nome.toLowerCase();
    
    // Verificar Armas primeiro (pelo nome do item)
    // Armas 2-FP
    const armas2FP = ["odachi", "nodachi", "montante", "alabarda", "gadanha", "foice curta", "foice longa", "foice de mão", "kama", "kusarigama", "naginata", "yari", "trident", "hamberge", "bardiche", "zambaton", "machado de guerra", "machado bárbaro", "machado longo", "maça de bicos", "maça de esferas", "clava", "kanabo", "tessen", "facha", "lança montada", "javelin", "ranseur", "glaive", "shuriken gigante", "grimório", "orb", "cajado", "bastão curto", "florete", "rapieira", "longsword", "arco recurvo", "arco longo", "arco composto", "arco simples"];
    for (const arma of armas2FP) {
        if (nomeLower.startsWith(arma.toLowerCase())) return "Arma 2";
    }
    
    // Armas 1-FP
    const armas1FP = ["faca de combate", "kunai", "balisong", "tanto", "katar", "ninja-to", "shuriken", "faca borboleta", "canivete", "navalha", "sai", "chakram", "gladius", "sansetsuki", "nunchacu", "tonfa", "soqueiras", "bagh nakh", "neko-te", "kris", "machete", "cutelo", "khopesh", "cimitarra", "sabre", "rapieira", "alfange", "wakizashi", "pistola", "magnum", "mini-metralhadora", "escopeta", "fuzil de assalto", "fuzil de precisão", "arco recurvo", "arco simples", "arco longo", "arco composto", "chicote", "correntes de combate", "manopla", "luvas de combate", "soqueiras", "leque de combate", "punhos metálicos", "garras retráteis", "corrente de combate"];
    for (const arma of armas1FP) {
        if (nomeLower.startsWith(arma.toLowerCase())) return "Arma 1";
    }
    
    // Verificar Cabeça
    for (const kw of KEYWORDS_CABECA) {
        if (nomeLower.includes(kw.toLowerCase())) return "Cabeça";
    }
    
    // Verificar Pés
    for (const kw of KEYWORDS_PES) {
        if (nomeLower.includes(kw.toLowerCase())) return "Pés";
    }
    
    // Verificar Pernas
    for (const kw of KEYWORDS_PERNAS) {
        if (nomeLower.includes(kw.toLowerCase())) return "Pernas";
    }
    
    // Verificar Corpo
    for (const kw of KEYWORDS_CORPO) {
        if (nomeLower.includes(kw.toLowerCase())) return "Corpo";
    }
    
    // Verificar Item de Apoio
    for (const kw of KEYWORDS_APOIO) {
        if (nomeLower.includes(kw.toLowerCase())) return "Item de Apoio";
    }
    
    // Verificar Acessórios
    for (const kw of KEYWORDS_ACESSORIOS) {
        if (nomeLower.includes(kw.toLowerCase())) return "Acessórios";
    }
    
    // Se não encontrou nada, retornar Acessórios como padrão
    return "Acessórios";
}

// =====================================
// VERIFICAÇÃO E CORREÇÃO
// =====================================

const drops = JSON.parse(fs.readFileSync(arquivoDrops, "utf8"));

let totalItens = 0;
let itensCorrigidos = 0;
let itensPorSlot = {
    "Arma 1": 0,
    "Arma 2": 0,
    "Cabeça": 0,
    "Corpo": 0,
    "Pernas": 0,
    "Pés": 0,
    "Acessórios": 0,
    "Item de Apoio": 0
};

Object.entries(drops).forEach(([dungeonId, itens]) => {
    itens.forEach(item => {
        totalItens++;
        
        // Determinar slot correto
        const slotCorreto = determinarSlot(item.nome);
        
        // Verificar se a categoria atual está correta
        if (item.categoria !== slotCorreto) {
            console.log(`CORRIGIDO: "${item.nome}"`);
            console.log(`  De: ${item.categoria} → Para: ${slotCorreto}`);
            item.categoria = slotCorreto;
            itensCorrigidos++;
        }
        
        itensPorSlot[slotCorreto]++;
    });
});

// Salvar arquivo corrigido
fs.writeFileSync(arquivoDrops, JSON.stringify(drops, null, 2), "utf8");

console.log("\n=== VERIFICAÇÃO E CORREÇÃO CONCLUÍDA ===");
console.log(`Total de itens verificados: ${totalItens}`);
console.log(`Itens corrigidos: ${itensCorrigidos}`);
console.log(`Itens já corretos: ${totalItens - itensCorrigidos}`);
console.log("\nDistribuição por slot:");
Object.entries(itensPorSlot).forEach(([slot, count]) => {
    console.log(`  ${slot}: ${count} itens`);
});
console.log(`\nArquivo salvo: ${arquivoDrops}`);