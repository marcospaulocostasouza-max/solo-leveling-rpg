/**
 * ==========================================================
 * INTERPRETADOR DE CONVERSA
 * ==========================================================
 *
 * Núcleo da nova arquitetura de interpretação da IA.
 *
 * O foco principal NÃO é mais pesquisar informações.
 * O foco principal é INTERPRETAR A CONVERSA.
 *
 * Como uma pessoa real:
 * - Primeiro entende o que foi dito
 * - Depois responde
 * - Somente se necessário consulta informações específicas
 *
 * FLUXO DE RACIOCÍNIO:
 *
 * 1. Receber o comando (ex: !Cyrus)
 * 2. Ler a mensagem enviada pelo jogador
 *    - intenção
 *    - emoção
 *    - contexto
 *    - tom
 *    - ambiente
 *    - ritmo da conversa
 * 3. Carregar APENAS as informações essenciais do NPC
 *    - personalidade
 *    - forma de falar
 *    - humor atual
 *    - estado emocional
 *    - memórias importantes
 *    - relacionamento com aquele jogador
 * 4. Interpretar completamente a conversa
 *    - Primeiro: "Como este personagem responderia naturalmente?"
 *    - Depois: "Existe alguma informação adicional que preciso consultar?"
 *
 * Este módulo NÃO carrega dados.
 * Este módulo NÃO monta prompts.
 * Ele apenas interpreta a mensagem e define COMO o personagem deve raciocinar.
 */

// ==========================================================
// ANÁLISE DE TOM E EMOÇÃO
// ==========================================================

const TONS = {
    formal: ['gostaria', 'poderia', 'senhor', 'senhora', 'por gentileza', 'se possível', 'se possivel', 'aguardo', 'atenciosamente', 'cumprimentos'],
    casual: ['cara', 'mano', 'véi', 'vei', 'e aí', 'e ai', 'tipo', 'meio', 'tá ligado', 'ta ligado', 'rolê', 'role', 'parceiro'],
    carinhoso: ['amor', 'querido', 'querida', 'meu bem', 'lindo', 'linda', 'bonito', 'bonita', 'gatinho', 'gatinha', 'paixão', 'paixao'],
    respeitoso: ['mestre', 'senhor', 'lorde', 'vossa', 'sua majestade', 'digno', 'respeito', 'admiro', 'envio'],
    sarcastico: ['claro que não', 'claro que nao', 'óbvio', 'obvio', 'ah sim', 'lógico', 'logico', 'como não', 'como nao', 'certo', 'claro', 'maravilha'],
    brincalhao: ['kkk', 'kkkk', 'haha', 'hehe', 'rsrs', 'zoeira', 'brincadeira', 'zuando', 'meme', 'engraçado', 'engracado', 'divertido'],
    tenso: ['ameaça', 'ameaca', 'perigo', 'sério', 'serio', 'grave', 'urgente', 'problema', 'risco', 'cuidado', 'perigosamente', 'violência', 'violencia'],
    triste: ['triste', 'perdi', 'morreu', 'morte', 'luto', 'dor', 'sofrimento', 'saudade', 'chorar', 'perda', 'desolado', 'deprimido'],
    animado: ['que ótimo', 'que otimo', 'excelente', 'maravilhoso', 'incrível', 'incrivel', 'fantástico', 'fantastico', 'uau', 'demais', 'sensacional', 'top'],
    irritado: ['raiva', 'ódio', 'odio', 'irritado', 'furioso', 'inaceitável', 'inaceitavel', 'revoltante', 'ultrajante', 'aborrecido', 'chateado', 'não acredito', 'nao acredito'],
    curioso: ['como', 'o que', 'por que', 'porque', 'quando', 'onde', 'quem', 'quanto', 'qual', 'por quê', 'me explica', 'me explica', 'curioso', 'interessante'],
    indiferente: ['tanto faz', 'tanto fez', 'dane-se', 'foda-se', 'nem aí', 'nem ai', 'tanto me faz', 'tanto me fez', 'irrelevante', 'tanto pra mim']
};

// ==========================================================
// ANÁLISE DE CONTEXTO
// ==========================================================

const CONTEXTOS = {
    saudacao: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'e aí', 'e ai', 'opa', 'salve', 'bem vindo'],
    despedida: ['tchau', 'adeus', 'até logo', 'ate logo', 'até mais', 'ate mais', 'até amanhã', 'ate amanha', 'vou indo', 'preciso ir', 'fui', 'flw', 'nos vemos', 'te vejo'],
    agradecimento: ['obrigado', 'obrigada', 'valeu', 'agradeço', 'agradeco', 'muito obrigado', 'muito obrigada', 'grato', 'grata'],
    pedido: ['pode', 'poderia', 'poderia me', 'me ajuda', 'me ajude', 'preciso de', 'quero', 'gostaria', 'pedir', 'favor', 'por favor', 'poderia'],
    pergunta: ['?', 'o que', 'qual', 'quem', 'como', 'quando', 'onde', 'por que', 'porquê', 'porque', 'quanto', 'será', 'sera'],
    informacao: ['sabe', 'descobri', 'ouvi', 'vi', 'falaram', 'disseram', 'aconteceu', 'acontecendo', 'notícia', 'noticia', 'chegou', 'chegou uma'],
    boato: ['ouvi dizer', 'dizem que', 'contaram', 'fofoca', 'rumor', 'boato', 'comentam', 'falaram que'],
    piada: ['kkk', 'kkkk', 'haha', 'zoeira', 'piada', 'engraçado', 'engracado', 'brincadeira', 'zuando', 'meme'],
    provocacao: ['ousa', 'cade', 'cadê', 'enfrenta', 'duvido', 'topa', 'desafia', 'vem', 'encara', 'corajoso', 'covarde'],
    segredo: ['segredo', 'confidencia', 'escondido', 'oculto', 'confissão', 'confissao', 'revelar', 'não conte', 'nao conte', 'entre nós', 'entre nos'],
    elogio: ['admiro', 'gosto de você', 'gosto de voce', 'você é incrível', 'voce e incrivel', 'parabéns', 'parabens', 'admirável', 'admirável', 'inspira', 'excelente'],
    ofensa: ['idiota', 'burro', 'estúpido', 'estupido', 'feio', 'nojento', 'patético', 'patetico', 'inútil', 'inutil', 'otário', 'otario']
};

// ==========================================================
// INTERPRETAÇÃO DA CONVERSA
// ==========================================================

/**
 * Normaliza o texto para análise
 *
 * @param {string} texto - Texto original
 * @returns {string} Texto normalizado
 */
function normalizarTexto(texto) {
    if (!texto) return '';
    return texto.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Analisa o tom da mensagem
 *
 * @param {string} mensagem - Mensagem do jogador
 * @returns {Object} Análise de tom
 */
function analisarTom(mensagem) {
    const texto = normalizarTexto(mensagem);
    const tonsDetectados = [];

    for (const [ton, palavras] of Object.entries(TONS)) {
        for (const palavra of palavras) {
            if (texto.includes(palavra)) {
                tonsDetectados.push({
                    ton: ton,
                    palavra: palavra
                });
            }
        }
    }

    // Tom predominante
    let tomPredominante = 'neutro';
    if (tonsDetectados.length > 0) {
        // Contar ocorrências por tom
        const contagem = {};
        for (const item of tonsDetectados) {
            contagem[item.ton] = (contagem[item.ton] || 0) + 1;
        }

        // Ordenar por maior contagem
        const ordenado = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
        tomPredominante = ordenado[0][0];
    }

    // Intensidade do tom (0-100)
    let intensidade = tonsDetectados.length * 20;
    if (mensagem.trim().endsWith('!')) intensidade += 15;
    if (mensagem.trim().endsWith('?')) intensidade += 5;
    intensidade = Math.min(100, intensidade);

    return {
        tomPredominante: tomPredominante,
        tonsDetectados: tonsDetectados,
        intensidade: intensidade,
        possuiCaracteresExclamacao: mensagem.includes('!'),
        ehPergunta: mensagem.trim().endsWith('?')
    };
}

/**
 * Analisa o contexto da conversa
 *
 * @param {string} mensagem - Mensagem do jogador
 * @returns {Object} Análise de contexto
 */
function analisarContexto(mensagem) {
    const texto = normalizarTexto(mensagem);
    const contextosDetectados = [];

    for (const [contexto, palavras] of Object.entries(CONTEXTOS)) {
        for (const palavra of palavras) {
            if (texto.includes(palavra)) {
                contextosDetectados.push({
                    contexto: contexto,
                    palavra: palavra
                });
                break;
            }
        }
    }

    return {
        contextosDetectados: contextosDetectados,
        contextoPredominante: contextosDetectados[0]?.contexto || 'conversa'
    };
}

/**
 * Analisa a intenção da mensagem
 *
 * @param {string} mensagem - Mensagem do jogador
 * @returns {Object} Análise de intenção
 */
function analisarIntencao(mensagem) {
    const texto = normalizarTexto(mensagem);
    const ehPergunta = mensagem.trim().endsWith('?') ||
        /\b(o que|qual|quais|como|onde|quando|quem|por que|porque|por quê)\b/i.test(mensagem);

    // Detectar tipo de intenção
    let tipoIntencao = 'afirmacao';

    // Pedido tem prioridade sobre pergunta (ex: "Pode me ajudar?")
    if (/(quero|vou|preciso|gostaria|pode|poderia|por favor|me ajuda|me ajude|favor)\b/i.test(texto)) {
        tipoIntencao = 'pedido';
    } else if (ehPergunta) {
        tipoIntencao = 'pergunta';
    } else if (/^(não|nao|nunca|jamais|nem)\b/i.test(texto)) {
        tipoIntencao = 'negacao';
    } else if (/^(sim|claro|ok|okay|certo|com certeza|concordo)\b/i.test(texto)) {
        tipoIntencao = 'afirmacao';
    }

    // Assunto principal (palavras-chave de destaque)
    const assuntos = [];
    
    // Detectar assunto emocional
    const emocional = ['amor', 'ódio', 'odio', 'medo', 'tristeza', 'raiva', 'felicidade', 'esperança', 'esperanca', 'saudade', 'dor', 'sofrimento', 'paixão', 'paixao', 'sentimento'];
    if (emocional.some(p => texto.includes(p))) assuntos.push('emocional');

    // Detectar assunto de memória
    const memoria = ['lembra', 'lembrança', 'lembranca', 'passado', 'história', 'historia', 'memória', 'memoria', 'recorda', 'esqueceu', 'antigamente'];
    if (memoria.some(p => texto.includes(p))) assuntos.push('memoria');

    // Detectar assunto prático
    const pratico = ['missão', 'missao', 'tarefa', 'quest', 'comprar', 'vender', 'preço', 'preco', 'item', 'arma', 'equipamento', 'loja', 'negociar'];
    if (pratico.some(p => texto.includes(p))) assuntos.push('pratico');

    // Detectar assunto emocional-relacional
    const relacional = ['amigo', 'amiga', 'confiança', 'confianca', 'relacionamento', 'nós', 'nos', 'você e eu', 'voce e eu', 'amizade', 'parceiro', 'aliado'];
    if (relacional.some(p => texto.includes(p))) assuntos.push('relacional');

    return {
        ehPergunta: ehPergunta,
        tipoIntencao: tipoIntencao,
        assuntos: assuntos,
        assuntosPrioritarios: assuntos.slice(0, 3)
    };
}

/**
 * Analisa o tamanho e ritmo da mensagem
 *
 * @param {string} mensagem - Mensagem do jogador
 * @returns {Object} Análise de ritmo
 */
function analisarRitmo(mensagem) {
    const texto = mensagem.trim();
    const palavras = texto.split(/\s+/).filter(p => p.length > 0);
    const caracteres = texto.length;

    let ritmo = 'curto';
    if (caracteres <= 20) ritmo = 'curto';
    else if (caracteres <= 60) ritmo = 'medio';
    else if (caracteres <= 200) ritmo = 'longo';
    else ritmo = 'muitoLongo';

    return {
        ritmo: ritmo,
        palavras: palavras.length,
        caracteres: caracteres,
        ehMensagemCurta: caracteres <= 20,
        ehMensagemLonga: caracteres > 200
    };
}

/**
 * Analisa o estágio da conversa
 *
 * @param {Array} historico - Histórico da conversa
 * @returns {Object} Análise do estágio
 */
function analisarEstagioConversa(historico = []) {
    const numMensagens = historico ? historico.length : 0;

    let estagio = 'inicio';
    if (numMensagens === 0) {
        estagio = 'inicio';
    } else if (numMensagens <= 2) {
        estagio = 'primeirosContatos';
    } else if (numMensagens <= 6) {
        estagio = 'conhecendo';
    } else if (numMensagens <= 12) {
        estagio = 'desenvolvendo';
    } else {
        estagio = 'aprofundado';
    }

    return {
        estagio: estagio,
        numMensagens: numMensagens
    };
}

/**
 * Função principal: interpreta completamente a mensagem do jogador
 *
 * @param {string} mensagem - Mensagem do jogador
 * @param {Object} contexto - Contexto da conversa (npc, historico, etc.)
 * @returns {Object} Interpretação completa
 */
function interpretarConversa(mensagem, contexto = {}) {
    const inicio = Date.now();

    // 1. Analisar tom
    const tom = analisarTom(mensagem);

    // 2. Analisar contexto
    const contextoAnalise = analisarContexto(mensagem);

    // 3. Analisar intenção
    const intencao = analisarIntencao(mensagem);

    // 4. Analisar ritmo
    const ritmo = analisarRitmo(mensagem);

    // 5. Analisar estágio da conversa
    const estagio = analisarEstagioConversa(contexto.historico || []);

    return {
        // Tom
        tom: tom,

        // Contexto
        contexto: contextoAnalise,

        // Intenção
        intencao: intencao,

        // Ritmo
        ritmo: ritmo,

        // Estágio
        estagio: estagio,

        // Metadados
        _meta: {
            tempoInterpretacao: Date.now() - inicio
        }
    };
}

/**
 * Define a orientação de interpretação - como o personagem deve pensar
 *
 * @param {Object} tom - Análise de tom
 * @param {Object} contexto - Análise de contexto
 * @param {Object} intencao - Análise de intenção
 * @param {Object} ritmo - Análise de ritmo
 * @param {Object} estagio - Análise de estágio
 * @returns {Object} Orientação para o modelo
 */
function definirOrientacao(tom, contexto, intencao, ritmo, estagio) {
    // Prioridade 1: interpretar a conversa primeiro
    let pensamentoPrincipal = "Como este personagem responderia naturalmente?";

    // Ajustar com base no estágio
    if (estagio.estagio === 'inicio') {
        pensamentoPrincipal = "É o início da conversa. Como uma pessoa real, responda de forma natural, simples e curiosa.";
    } else if (estagio.estagio === 'primeirosContatos') {
        pensamentoPrincipal = "Vocês estão se conhecendo. Reaja com naturalidade, faça perguntas simples, comente o ambiente.";
    } else if (estagio.estagio === 'conhecendo') {
        pensamentoPrincipal = "Já há uma conversa em andamento. Mantenha o fluxo natural, mostre personalidade, reaja ao que foi dito.";
    } else if (estagio.estagio === 'desenvolvendo') {
        pensamentoPrincipal = "A relação está se desenvolvendo. Pode mostrar um pouco mais de abertura e personalidade.";
    } else if (estagio.estagio === 'aprofundado') {
        pensamentoPrincipal = "A relação já tem base. Pode aprofundar conversas quando fizer sentido.";
    }

    // Ajustar com base no tom
    let ajusteTom = '';
    if (tom.tomPredominante === 'formal') {
        ajusteTom = "Responda com mais formalidade e distância.";
    } else if (tom.tomPredominante === 'brincalhao') {
        ajusteTom = "Pode entrar no clima leve e brincar junto, se fizer sentido para o personagem.";
    } else if (tom.tomPredominante === 'tenso') {
        ajusteTom = "A situação é séria. Reaja com tensão, cuidado e atenção.";
    } else if (tom.tomPredominante === 'carinhoso') {
        ajusteTom = "Perceba o carinho na mensagem e responda de acordo com o relacionamento.";
    } else if (tom.tomPredominante === 'irritado') {
        ajusteTom = "A mensagem tem tom irritado. Reaja com honestidade, mas de acordo com a personalidade.";
    } else if (tom.tomPredominante === 'sarcastico') {
        ajusteTom = "Há sarcasmo na mensagem. Responsa com inteligência, sem quebrar o personagem.";
    }

    // Prioridade 2: só depois consultar informações adicionais
    const consultaAdicional = intencao.ehPergunta || intencao.assuntos.includes('memoria');

    return {
        pensamentoPrincipal: pensamentoPrincipal,
        ajusteTom: ajusteTom,
        consultaAdicional: consultaAdicional,
        instrucaoFinal: "Primeiro pense como este personagem responderia. Só depois consulte informações adicionais se necessário."
    };
}

module.exports = {
    interpretarConversa,
    analisarTom,
    analisarContexto,
    analisarIntencao,
    analisarRitmo,
    analisarEstagioConversa,
    TONS,
    CONTEXTOS
};