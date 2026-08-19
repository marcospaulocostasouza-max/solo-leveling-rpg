const estilos = require("../estilos/listaEstilos");

const normalizar = valor => String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[>*_`~|()[\]{}]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

function normalizarChave(valor) {
    return normalizar(valor)
        .replace(/^profici[a-z]*\s*(?:em|e|m)?\s*/, "")
        .replace(/[&/+]/g, " e ")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Mapa de aliases para a nova arquitetura de Estilos de Luta.
 * Cada alias aponta para a chave canônica do estilo.
 *
 * ATENÇÃO: A antiga "Proficiência em Arremessos" foi substituída por "Facas".
 * As armas de fogo foram separadas em Pistolas, Escopetas, Fuzis e Rifles de Precisão.
 */
const ALIASES = {
    // Espadas e lâminas
    "espada": "espadas", "espadas": "espadas", "espadachim": "espadas",
    "espadoes": "espadas pesadas", "espadões": "espadas pesadas",
    "espadas pesadas": "espadas pesadas", "espada pesada": "espadas pesadas",
    "espadão": "espadas pesadas", "espadon": "espadas pesadas",
    "espadas pesadas duplas": "espadas pesadas duplas", "espada pesada dupla": "espadas pesadas duplas",
    "espadoes duplos": "espadas pesadas duplas", "espadões duplos": "espadas pesadas duplas",
    "katana": "katanas", "katanas": "katanas",
    "adaga": "adagas", "adagas": "adagas",
    "faca": "facas", "facas": "facas",
    "lanca": "lancas", "lança": "lancas", "lanças": "lancas", "lancas": "lancas",
    "florete": "floretes", "floretes": "floretes",
    "rapieira": "rapieiras", "rapieiras": "rapieiras",
    "sabre": "sabres", "sabres": "sabres",
    "cimitarra": "cimitarras", "cimitarras": "cimitarras",
    "lamina": "laminas duplas", "lamina dupla": "laminas duplas",
    "laminas duplas": "laminas duplas", "lâminas duplas": "laminas duplas",
    "foice": "foices", "foices": "foices",
    "foices duplas": "foices duplas", "foice dupla": "foices duplas",
    "foices dupla": "foices duplas",
    "kama": "kamas", "kamas": "kamas",

    // Armas de haste e impacto
    "cajado": "cajados e orbes", "cajados": "cajados e orbes",
    "cajados e orbes": "cajados e orbes", "cajado e orbe": "cajados e orbes",
    "orbe": "cajados e orbes", "orbes": "cajados e orbes",
    "grimorio": "cajados e orbes", "grimório": "cajados e orbes",
    "baculo": "baculos", "báculo": "baculos", "báculos": "baculos", "baculos": "baculos",
    "bastao": "bastoes", "bastão": "bastoes", "bastões": "bastoes", "bastoes": "bastoes",
    "alabarda": "alabardas", "alabardas": "alabardas",
    "tridente": "tridentes", "tridentes": "tridentes",
    "machado": "machados", "machados": "machados",
    "martelo": "martelos", "martelos": "martelos",
    "clava": "clavas", "clavas": "clavas",
    "mangual": "manguais", "manguais": "manguais",
    "picareta": "picaretas de guerra", "picaretas": "picaretas de guerra",
    "picaretas de guerra": "picaretas de guerra",
    "kanabo": "kanabo",
    "tonfa": "tonfas", "tonfas": "tonfas",
    "nunchaku": "nunchakus", "nunchakus": "nunchakus",

    // Armas de disparo
    "arco": "arcos", "arcos": "arcos", "arqueiro": "arcos",
    "besta": "bestas", "bestas": "bestas",
    "funda": "funda", "fundas": "funda",
    "bumerangue": "bumerangues", "bumerangues": "bumerangues",

    // Armas de fogo (separadas por categoria)
    "pistola": "pistolas", "pistolas": "pistolas",
    "revolver": "pistolas", "revólver": "pistolas", "revólveres": "pistolas", "revolveres": "pistolas",
    "escopeta": "escopetas", "escopetas": "escopetas",
    "espingarda": "escopetas", "espingardas": "escopetas",
    "fuzil": "fuzis", "fuzis": "fuzis",
    "rifle": "fuzis", "rifles": "fuzis", "rifle de assalto": "fuzis",
    "rifles de assalto": "fuzis",
    "rifles de precisao": "rifles de precisao", "rifle de precisao": "rifles de precisao",
    "rifles de precisão": "rifles de precisao", "rifle de precisão": "rifles de precisao",
    "sniper": "rifles de precisao",

    // Combate corpo a corpo
    "punho": "combate desarmado", "punhos": "combate desarmado",
    "artes marciais": "combate desarmado", "combate desarmado": "combate desarmado",
    "manopla": "manoplas", "manoplas": "manoplas",
    "luva": "luvas de combate", "luvas": "luvas de combate",
    "luvas de combate": "luvas de combate", "luva de combate": "luvas de combate",
    "garra": "garras", "garras": "garras",
    "escudo": "escudos", "escudos": "escudos",
    "corrente": "correntes", "correntes": "correntes",
    "chicote": "chicotes", "chicotes": "chicotes",
    "kusarigama": "correntes com foice", "correntes com foice": "correntes com foice",
    "corrente com foice": "correntes com foice",
    "leque": "leques de guerra", "leques": "leques de guerra",
    "leques de guerra": "leques de guerra", "leque de guerra": "leques de guerra",
    "instrumento": "instrumentos musicais", "instrumentos": "instrumentos musicais",
    "instrumentos musicais": "instrumentos musicais", "instrumento musical": "instrumentos musicais",
    "chakram": "chakrams", "chakrams": "chakrams",

    // Legado: Antiga "Proficiência em Arremessos" vira Facas
    "arremesso": "facas", "arremessos": "facas"
};

function distancia(a, b) {
    const linha = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let diagonal = linha[0];
        linha[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const acima = linha[j];
            linha[j] = Math.min(linha[j] + 1, linha[j - 1] + 1,
                diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
            diagonal = acima;
        }
    }
    return linha[b.length];
}

/**
 * Gera a chave canônica de um estilo a partir de seu nome no catálogo
 * (ex: "Proficiência em Facas" → "facas").
 */
function chaveDoEstilo(nomeEstilo) {
    const base = String(nomeEstilo || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/^profici[a-z]*\s*(?:em|e|m)?\s*/i, "")
        .toLowerCase()
        .replace(/[&/+]/g, " e ")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    // O alias preferido é a forma com o "s" final preservado (plural),
    // como usado nos nomes dos estilos ("Facas", "Adagas", "Pistolas"...).
    return ALIASES[base] || ALIASES[base.replace(/\s+/g, " ")] || base;
}

/**
 * Resolve um valor de entrada (ficha, comando) para o nome canônico
 * do Estilo de Luta registrado na lista de estilos.
 * Retorna null se não encontrar correspondência.
 */
function obterEstiloCanonico(valor) {
    const entrada = normalizarChave(valor);
    if (!entrada) return null;

    // "Armas de Fogo" genérico não resolve para um estilo único — retorna null
    // para que o jogador especifique Pistolas, Escopetas, Fuzis ou Rifles de Precisão.
    if (/arma.*fogo|armas.*fogo/.test(entrada)) return null;

    const alvo = ALIASES[entrada] || entrada;

    // 1. Correspondência direta por chave canônica
    for (const estilo of estilos) {
        if (chaveDoEstilo(estilo.nome) === alvo) return estilo.nome;
    }

    // 2. Correspondência exata (nome do estilo sem "Proficiência em")
    for (const estilo of estilos) {
        const nomeCurto = String(estilo.nome || "").replace(/^Profici[êe]ncia\s+(?:em|e|m)\s+/i, "");
        if (normalizar(nomeCurto) === normalizar(valor)) return estilo.nome;
    }

    // 3. Fallback com Levenshtein apenas para entradas similares
    const avaliados = estilos
        .map(estilo => ({ estilo, distancia: distancia(alvo, chaveDoEstilo(estilo.nome)) }))
        .sort((a, b) => a.distancia - b.distancia);
    const [melhor, segundo] = avaliados;
    const limite = alvo.length <= 5 ? 1 : alvo.length <= 12 ? 2 : 3;
    return melhor && melhor.distancia <= limite && (!segundo || segundo.distancia > melhor.distancia)
        ? melhor.estilo.nome
        : null;
}

module.exports = { obterEstiloCanonico, normalizar, normalizarChave, chaveDoEstilo, ALIASES, distancia };