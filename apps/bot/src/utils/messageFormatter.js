/**
 * MESSAGE FORMATTER - NPCMessageFormatter
 *
 * Responsável por formatar mensagens dos NPCs adicionando molduras
 * e elementos visuais antes de enviar ao WhatsApp.
 *
 * Funcionalidades atuais:
 * - Adicionar molduras personalizadas para cada NPC
 * - Centralizar nome do NPC na moldura
 * - Símbolo central configurável por categoria de NPC
 *
 * Funcionalidades futuras:
 * - Emojis de sistema
 * - Mensagens de missão
 * - Caixas de recompensa
 * - Avisos
 * - Eventos
 * - Títulos especiais
 *
 * Uso:
 * const { formatarMensagem } = require('./utils/messageFormatter');
 * const mensagemFormatada = formatarMensagem(npc, respostaIA);
 */

// =====================================
// SISTEMA DE MOLDURAS
// =====================================

/**
 * Molduras pré-definidas organizadas por tipo
 */
const MOLDURAS = {
    // Moldura padrão (MOLDURA 10 - com ✦)
    // Cabeçalho único e obrigatório para TODOS os NPCs.
    // Nome completo centralizado com 6 espaços e entre _* (itálico + negrito).
    padrao: {
        topo: "╔══════════════ ✦ ══════════════╗",
        meio: (nome) => `      _*${nome}*_`,
        baixo: "╚══════════════ ✦ ══════════════╝",
        simbolo: "✦"
    },

    // Moldura 01 - Quadrado simples com ◈
    quadrado1: {
        topo: "┏━━━━━━━━━━━◈━━━━━━━━━━━┓",
        meio: (nome) => ` ${nome}`,
        baixo: "┗━━━━━━━━━━━◈━━━━━━━━━━━┛",
        simbolo: "◈"
    },

    // Moldura 02 - Arredondada com ✧
    arredondada: {
        topo: "╭─────────────────────✧─────────────────────╮",
        meio: (nome) => ` ${nome}`,
        baixo: "╰───────────────────────────────────────────╯",
        simbolo: "✧"
    },

    // Moldura 03 - Espada ⚔
    espada: {
        topo: "⚔════════════════════════════⚔",
        meio: (nome) => ` ${nome}`,
        baixo: "⚔════════════════════════════⚔",
        simbolo: "⚔"
    },

    // Moldura 04 - Floral ❀
    floral: {
        topo: "❀═══════•༺❀༻•═══════❀",
        meio: (nome) => ` ${nome}`,
        baixo: "❀═══════•༺❀༻•═══════❀",
        simbolo: "❀"
    },

    // Moldura 05 - Aspas 《》
    aspas: {
        topo: "《══════════════》",
        meio: (nome) => ` ${nome} `,
        baixo: "《══════════════》",
        simbolo: "《》"
    },

    // Moldura 06 - Dupla linha ╓╙
    duplaLinha: {
        topo: "╓────────────────────────╖",
        meio: (nome) => ` ${nome}`,
        baixo: "╙────────────────────────╜",
        simbolo: "╓╙"
    },

    // Moldura 07 - Diamante ◆
    diamante: {
        topo: "◆════════════════════◆",
        meio: (nome) => ` ${nome}`,
        baixo: "◆════════════════════◆",
        simbolo: "◆"
    },

    // Moldura 08 - Losango ◤◥
    losango: {
        topo: "◤══════════════◥",
        meio: (nome) => ` ${nome} `,
        baixo: "◣══════════════◢",
        simbolo: "◤◥"
    },

    // Moldura 09 - Circular ೋ
    circular: {
        topo: "╭═══════ ೋ ═══════╮",
        meio: (nome) => ` ${nome}`,
        baixo: "╰═══════ ೋ ═══════╯",
        simbolo: "ೋ"
    }
};

/**
 * Mapa de NPCs para suas respectivas molduras
 * Cada NPC tem uma moldura pré-definida baseada no exemplo fornecido
 */
const MAPA_MOLDURAS = {
    "Ophilia Clement": 10,
    "Therion": 2,
    "Cyrus Albright": 3,
    "Olberic Eisenberg": 4,
    "Primrose Azelhart": 5,
    "Tressa Colzione": 6,
    "Alfyn Greengrass": 7,
    "H'aanit": 8,
    "Hikari Ku": 9,
    "Agnea Bristarni": 10,
    "Temenos Mistral": 11,
    "Osvald V. Vanstein": 12,
    "Castti Florenz": 13,
    "Partitio Yellowil": 14,
    "Throné Anguis": 15,
    "Ochette": 16,
    "Sazantos": 17,
    "Richard": 18,
    "Rondo": 19,
    "Elrica": 20,
    "Bargello": 21,
    "Sonia": 22,
    "Alaune": 23,
    "Lars": 24,
    "Fiore": 25,
    "Sofia": 26,
    "Viola": 27,
    "Lynette": 28,
    "Scarecrow": 29,
    "Theo": 30,
    "Millard": 31,
    "Gilderoy": 32,
    "Kouren": 33,
    "Odette": 34,
    "Nicola": 35,
    "Cardona": 36,
    "Tytos": 37,
    "Auguste": 38,
    "Herminia": 39,
    "Tatloch": 40,
    "Rinyuu": 41,
    "Leon": 42,
    "Roland": 43,
    "Frederica": 44,
    "Serenoa": 45,
    "Harvey": 46,
    "Ori": 47,
    "Dolcinaea": 48,
    "Crick": 49,
    "Pirro": 50
};

// =====================================
// FUNÇÕES AUXILIARES
// =====================================

/**
 * Obtém a moldura de um NPC
 * Se o NPC não tiver moldura definida, usa a padrão
 *
 * @param {string} nomeNPC - Nome do NPC
 * @returns {Object} Objeto de moldura
 */
function obterMoldura(nomeNPC) {
    // Todos os NPCs usam SEMPRE a mesma moldura padrão (cabeçalho único).
    return MOLDURAS.padrao;
}

/**
 * Obtém uma moldura pelo número
 *
 * @param {number} numero - Número da moldura (1-75)
 * @returns {Object} Objeto de moldura
 */
function obterMolduraPorNumero(numero) {
    const tiposMolduras = [
        "quadrado1",      // 1
        "arredondada",    // 2
        "espada",         // 3
        "floral",         // 4
        "aspas",          // 5
        "duplaLinha",     // 6
        "diamante",       // 7
        "losango",        // 8
        "circular",       // 9
        "padrao"          // 10
    ];

    // Cicla entre as 10 molduras para números 11-75
    const indice = ((numero - 1) % 10);
    return MOLDURAS[tiposMolduras[indice]];
}

/**
 * Aplica uma moldura personalizada a um NPC
 *
 * @param {string} nomeNPC - Nome do NPC
 * @param {number} numeroMoldura - Número da moldura (1-75)
 */
function definirMolduraParaNPC(nomeNPC, numeroMoldura) {
    if (numeroMoldura < 1 || numeroMoldura > 75) {
        throw new Error("Número de moldura deve estar entre 1 e 75");
    }
    MAPA_MOLDURAS[nomeNPC] = numeroMoldura;
}

/**
 * Centraliza uma linha de texto
 *
 * @param {string} texto - Texto para centralizar
 * @param {number} largura - Largura total da linha
 * @returns {string} Texto centralizado
 */
function centralizarTexto(texto, largura = 28) {
    const espacos = Math.floor((largura - texto.length) / 2);
    return " ".repeat(Math.max(0, espacos)) + texto;
}

// =====================================
// FUNÇÃO PRINCIPAL
// =====================================

/**
 * Formata uma mensagem de NPC adicionando a moldura apropriada
 *
 * @param {Object} npc - Objeto do NPC com propriedade 'nome'
 * @param {string} resposta - Texto da resposta da IA
 * @returns {string} Mensagem formatada com moldura
 *
 * @example
 * const npc = { nome: "Ophilia Clement" };
 * const resposta = '*Ela sorri.*\n\n"Olá."';
 * const formatada = formatarMensagem(npc, resposta);
 * // Retorna:
 * // ╔══════════════ ✦ ══════════════╗
 * //           Ophilia Clement
 * // ╚══════════════ ✦ ══════════════╝
 * //
 * // *Ela sorri.*
 * //
 * // "Olá."
 */
function formatarMensagem(npc, resposta, estadoEmocional = null) {
    // Validações básicas
    if (!npc || !npc.nome) {
        console.warn("[MessageFormatter] NPC sem nome fornecido");
        return resposta;
    }

    if (!resposta || typeof resposta !== 'string') {
        console.warn("[MessageFormatter] Resposta inválida fornecida");
        return resposta;
    }

    // Obter moldura apropriada para o NPC
    const moldura = obterMoldura(npc.nome);

    // Construir linha central com nome
    const linhaNome = moldura.meio(npc.nome);

    // Montar mensagem formatada
    const emocao = estadoEmocional?.emocao || "calmo";
    const estado = emocao.charAt(0).toUpperCase() + emocao.slice(1);
    const mensagemFormatada = `${moldura.topo}\n${linhaNome}\n> Estado emocional: ${estado}.\n${moldura.baixo}\n\n${resposta}`;

    return mensagemFormatada;
}

// =====================================
// FUNÇÕES DE FORMATAÇÃO AVANÇADA
// (Para expansão futura)
// =====================================

/**
 * Formata uma mensagem de sistema com emoji
 *
 * @param {string} emoji - Emoji do sistema
 * @param {string} mensagem - Texto da mensagem
 * @returns {string} Mensagem formatada
 */
function formatarMensagemSistema(emoji, mensagem) {
    return `[${emoji}] ${mensagem}`;
}

/**
 * Formata uma mensagem de missão
 *
 * @param {string} tituloMissao - Título da missão
 * @param {string} descricao - Descrição da missão
 * @param {string} objetivo - Objetivo atual
 * @returns {string} Mensagem de missão formatada
 */
function formatarMensagemMissao(tituloMissao, descricao, objetivo) {
    const header = "═══════════════════════════";
    return `${header}\n📜 MISSÃO: ${tituloMissao}\n${header}\n\n${descricao}\n\n🎯 Objetivo: ${objetivo}`;
}

/**
 * Formata uma caixa de recompensa
 *
 * @param {Array} recompensas - Array de recompensas
 * @returns {string} Caixa de recompensa formatada
 */
function formatarCaixaRecompensa(recompensas) {
    const header = "╔═══════════════════════╗";
    const footer = "╚═══════════════════════╝";
    
    let texto = `${header}\n`;
    texto += `        🎁 RECOMPENSAS\n`;
    texto += `${footer}\n\n`;
    
    recompensas.forEach(rec => {
        texto += `• ${rec.nome} x${rec.quantidade}\n`;
    });
    
    return texto;
}

/**
 * Formata um aviso
 *
 * @param {string} aviso - Texto do aviso
 * @param {string} nivel - Nível: 'info', 'warning', 'error'
 * @returns {string} Aviso formatado
 */
function formatarAviso(aviso, nivel = 'info') {
    const emojis = {
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌'
    };
    
    const emoji = emojis[nivel] || emojis.info;
    return `${emoji} ${aviso}`;
}

/**
 * Formata uma mensagem de evento
 *
 * @param {string} nomeEvento - Nome do evento
 * @param {string} descricao - Descrição do evento
 * @param {string} tempo - Tempo restante
 * @returns {string} Mensagem de evento formatada
 */
function formatarEvento(nomeEvento, descricao, tempo) {
    const header = "╔══════════════════════════╗";
    const footer = "╚══════════════════════════╝";
    
    return `${header}\n         ⚡ EVENTO ⚡\n${header}\n\n`;
}

/**
 * Formata um título especial
 *
 * @param {string} titulo - Título especial
 * @param {string} subtitulo - Subtítulo opcional
 * @returns {string} Título formatado
 */
function formatarTituloEspecial(titulo, subtitulo = "") {
    const moldura = "❖════════════════════❖";
    let texto = `${moldura}\n`;
    texto += `   ★ ${titulo} ★\n`;
    texto += `${moldura}`;
    
    if (subtitulo) {
        texto += `\n\n${subtitulo}`;
    }
    
    return texto;
}

// =====================================
// EXPORTAÇÕES
// =====================================

module.exports = {
    // Função principal
    formatarMensagem,
    
    // Funções auxiliares
    obterMoldura,
    obterMolduraPorNumero,
    definirMolduraParaNPC,
    centralizarTexto,
    
    // Funções de expansão futura
    formatarMensagemSistema,
    formatarMensagemMissao,
    formatarCaixaRecompensa,
    formatarAviso,
    formatarEvento,
    formatarTituloEspecial,
    
    // Molduras disponíveis (para referência)
    MOLDURAS,
    MAPA_MOLDURAS
};
