/**
 * CONTEXT OPTIMIZER
 *
 * Módulo responsável por otimizar o contexto enviado à IA.
 * Analisa a mensagem do jogador e decide quais partes do contexto
 * são relevantes, reduzindo tokens e melhorando a qualidade das respostas.
 *
 * Fluxo:
 * ContextManager → ContextOptimizer → PromptBuilder → Ollama
 *
 * IMPORTANTE: O contexto otimizado deve MANTER a mesma estrutura
 * do contexto original do ContextManager, para que o PromptBuilder
 * possa acessar contexto.npc, contexto.estadoEmocional, contexto.mundo, etc.
 *
 * Este módulo NÃO cria prompts.
 * Este módulo NÃO conversa com o Ollama.
 * Este módulo NÃO altera a personalidade do NPC.
 */

// =====================================
// SISTEMA DE CLASSIFICAÇÃO DE MENSAGENS
// =====================================

/**
 * Palavras-chave para classificação da mensagem
 */
const PALAVRAS_CHAVE = {
    combate: ['luta', 'treino', 'duelo', 'batalha', 'batalhar', 'treinar', 'espadada', 'golpe', 'ataque', 'defesa', 'magia', 'feitiço', 'habilidade', 'técnica', 'golpear'],
    
    missao: ['missão', 'missao', 'tarefa', 'objetivo', 'recompensa', 'quest', 'trabalho', 'serviço', 'pedido'],
    
    comercio: ['comprar', 'vender', 'loja', 'preço', 'dinheiro', 'ouro', 'item', 'equipamento', 'negociar', 'trocar', 'mercado'],
    
    treinamento: ['treino', 'treinar', 'aprender', 'praticar', 'melhorar', 'evoluir', 'nível', 'rank', 'aumentar', 'força', 'forca', 'resistência', 'resistencia'],
    
    lembranca: ['lembra', 'lembrança', 'lembranca', 'passado', 'antigo', 'antes', 'promessa', 'juramento', 'conhecemos', 'primeira vez', 'quando nos conhecemos'],
    
    relacionamento: ['confiança', 'confianca', 'amigo', 'amizade', 'gosto', 'sentimento', 'emoção', 'emocao', 'coração', 'coracao', 'amor', 'ódio', 'odio', 'ódio'],
    
    aparencia: ['aparência', 'aparencia', 'roupas', 'roupa', 'cabelo', 'olhos', 'corpo', 'altura', 'vestido', 'armadura', 'arma', 'como você é', 'aparência'],
    
    localizacao: ['onde', 'local', 'lugar', 'chegar', 'caminho', 'mapa', 'norte', 'sul', 'leste', 'oeste', 'cidade', 'vila', 'dungeon', 'masmorra'],
    
    magia: ['magia', 'mágico', 'magico', 'elemento', 'fogo', 'água', 'agua', 'vento', 'raio', 'luz', 'escuridão', 'escuridao', 'cura', 'curação', 'curacao', 'feiticeiro', 'mago'],
    
    habilidades: ['habilidade', 'técnica', 'tecnica', 'poder', 'dom', 'skill', 'capacidade', 'competência', 'competencia'],
    
    despedida: ['tchau', 'adeus', 'até', 'ate', 'logo', 'volto', 'falo depois', 'preciso ir', 'indo embora'],
    
    saudacao: ['olá', 'ola', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'e ai', 'eae', 'salut', 'eai']
};

/**
 * Classifica a mensagem do jogador em categorias
 * 
 * @param {string} mensagem - Mensagem do jogador
 * @returns {Array<string>} Categorias identificadas
 */
function classificarMensagem(mensagem) {
    const mensagemLower = mensagem.toLowerCase();
    const categorias = [];
    
    for (const [categoria, palavras] of Object.entries(PALAVRAS_CHAVE)) {
        for (const palavra of palavras) {
            if (mensagemLower.includes(palavra)) {
                categorias.push(categoria);
                break;
            }
        }
    }
    
    // Se não encontrou nenhuma categoria, é uma conversa genérica
    if (categorias.length === 0) {
        categorias.push('conversa');
    }
    
    return categorias;
}

// =====================================
// SISTEMA DE RESUMOS
// =====================================

/**
 * Gera um resumo curto de textos longos
 * 
 * @param {string} texto - Texto original
 * @param {number} maxCaracteres - Máximo de caracteres no resumo
 * @returns {string} Texto resumido
 */
function resumirTexto(texto, maxCaracteres = 150) {
    if (!texto || texto.length <= maxCaracteres) {
        return texto;
    }
    
    // Pegar primeira frase
    const primeiraFrase = texto.split('.')[0];
    if (primeiraFrase.length <= maxCaracteres) {
        return primeiraFrase + '.';
    }
    
    // Cortar texto
    const resumo = texto.substring(0, maxCaracteres);
    const ultimaPonto = resumo.lastIndexOf('.');
    
    if (ultimaPonto > maxCaracteres * 0.7) {
        return resumo.substring(0, ultimaPonto + 1);
    }
    
    return resumo + '...';
}

/**
 * Verifica se a mensagem pergunta sobre passado/história
 * 
 * @param {string} mensagem - Mensagem do jogador
 * @returns {boolean}
 */
function perguntouSobrePassado(mensagem) {
    const mensagemLower = mensagem.toLowerCase();
    const palavrasPassado = ['passado', 'origem', 'família', 'familia', 'igreja', 'reino', 'infância', 'infancia', 'mestre', 'antigo', 'acontecimentos', 'história', 'historia', 'lembra', 'lembrança', 'lembranca'];
    
    return palavrasPassado.some(palavra => mensagemLower.includes(palavra));
}

/**
 * Verifica se a mensagem pergunta sobre aparência
 * 
 * @param {string} mensagem - Mensagem do jogador
 * @returns {boolean}
 */
function perguntouSobreAparencia(mensagem) {
    const mensagemLower = mensagem.toLowerCase();
    const palavrasAparencia = ['aparência', 'aparencia', 'roupas', 'roupa', 'cabelo', 'olhos', 'corpo', 'altura', 'vestido', 'armadura', 'arma', 'como você é', 'aparência'];
    
    return palavrasAparencia.some(palavra => mensagemLower.includes(palavra));
}

/**
 * Verifica se a mensagem envolve combate
 * 
 * @param {string} mensagem - Mensagem do jogador
 * @returns {boolean}
 */
function envolveCombate(mensagem) {
    const mensagemLower = mensagem.toLowerCase();
    const palavrasCombate = ['luta', 'treino', 'duelo', 'batalha', 'batalhar', 'treinar', 'espadada', 'golpe', 'ataque', 'defesa', 'magia', 'feitiço', 'habilidade', 'técnica', 'tecnica'];
    
    return palavrasCombate.some(palavra => mensagemLower.includes(palavra));
}

/**
 * Verifica se a mensagem é sobre localização
 * 
 * @param {string} mensagem - Mensagem do jogador
 * @returns {boolean}
 */
function perguntouSobreLocalizacao(mensagem) {
    const mensagemLower = mensagem.toLowerCase();
    const palavrasLocal = ['onde', 'local', 'lugar', 'chegar', 'caminho', 'mapa', 'norte', 'sul', 'leste', 'oeste', 'cidade', 'vila', 'dungeon', 'masmorra', 'chovendo', 'anoiteceu', 'dia', 'noite', 'clima', 'tempo'];
    
    return palavrasLocal.some(palavra => mensagemLower.includes(palavra));
}

// =====================================
// CONTEXTO
// =====================================

/**
 * Otimiza o contexto completo baseado na mensagem do jogador
 * 
 * MANTÉM A ESTRUTURA ESPERADA PELO PROMPTBUILDER:
 * - contexto.npc (objeto completo)
 * - contexto.jogador
 * - contexto.historico
 * - contexto.memorias
 * - contexto.favorabilidade
 * - contexto.estadoEmocional
 * - contexto.missaoAtual
 * - contexto.mundo
 * 
 * @param {Object} contextoCompleto - Contexto completo do ContextManager
 * @param {string} mensagemJogador - Mensagem atual do jogador
 * @returns {Object} Contexto otimizado
 */
function otimizarContexto(contextoCompleto, mensagemJogador) {
    const {
        npc,
        jogador,
        historico,
        memorias,
        favorabilidade,
        estadoEmocional,
        missaoAtual,
        mundo
    } = contextoCompleto;

    // Classificar mensagem
    const categorias = classificarMensagem(mensagemJogador);
    const categoriaPrincipal = categorias[0];

    // =====================================
    // CONTEXTO OTIMIZADO
    // =====================================
    // MANTÉM A MESMA ESTRUTURA DO CONTEXTMANAGER
    // para que o PromptBuilder funcione corretamente
    
    // Criar uma cópia do NPC para otimização
    let npcOtimizado = { ...npc };

    // =====================================
    // OTIMIZAÇÕES (remover campos irrelevantes)
    // =====================================

    // HISTÓRIA - Resumir se não perguntar sobre passado
    let historiaCompleta = false;
    if (perguntouSobrePassado(mensagemJogador)) {
        // Manter história completa
        historiaCompleta = true;
    } else {
        // Resumir história para economizar tokens
        if (npcOtimizado.historia && npcOtimizado.historia.length > 150) {
            npcOtimizado.historia = resumirTexto(npcOtimizado.historia, 150);
        }
    }

    // APARÊNCIA - Remover se não perguntar sobre aparência
    let aparenciaCompleta = false;
    if (perguntouSobreAparencia(mensagemJogador)) {
        aparenciaCompleta = true;
    } else {
        // Remover aparência para economizar tokens
        delete npcOtimizado.aparencia;
        delete npcOtimizado.altura_peso;
    }

    // EQUIPAMENTOS - Remover se não envolver combate
    if (!envolveCombate(mensagemJogador)) {
        delete npcOtimizado.equipamentos;
        delete npcOtimizado.estilo_luta;
    }

    // TÉCNICAS - Remover se não envolver combate
    if (!envolveCombate(mensagemJogador)) {
        delete npcOtimizado.tecnicas;
    }

    // Construir contexto otimizado com a MESMA ESTRUTURA do ContextManager
    const contextoOtimizado = {
        // NPC (objeto completo, possivelmente otimizado)
        npc: npcOtimizado,

        // Jogador (sempre)
        jogador: jogador,

        // Histórico (últimas 6 mensagens)
        historico: historico ? historico.slice(-6) : [],

        // Memórias (filtrar apenas relevantes - por enquanto vazio)
        memorias: memorias || [],

        // Favorabilidade (sempre)
        favorabilidade: favorabilidade || { nivel: 0, titulo: "Desconhecido" },

        // Estado emocional (sempre - necessário para o PromptBuilder)
        estadoEmocional: estadoEmocional || { humor: "Neutro" },

        // Missão atual (apenas se perguntar sobre missões)
        missaoAtual: null,

        // Mundo (apenas se perguntar sobre localização)
        mundo: { local: null, horario: null, clima: null }
    };

    // =====================================
    // DECISÕES DE CONTEXTO CONDICIONAIS
    // =====================================

    // MISSÕES - Apenas se perguntar sobre missões
    const palavrasMissao = ['missão', 'missao', 'tarefa', 'recompensa', 'objetivo'];
    const perguntouMissao = palavrasMissao.some(palavra => mensagemJogador.toLowerCase().includes(palavra));
    
    if (perguntouMissao && missaoAtual) {
        contextoOtimizado.missaoAtual = missaoAtual;
    }

    // MUNDO - Apenas se perguntar sobre localização/clima
    if (perguntouSobreLocalizacao(mensagemJogador) && mundo) {
        contextoOtimizado.mundo = mundo;
    }

    // =====================================
    // METADADOS DE DEBUG
    // =====================================
    
    contextoOtimizado._meta = {
        categorias: categorias,
        categoriaPrincipal: categoriaPrincipal,
        tokensEconomizados: calcularTokensEconomizados(contextoCompleto, contextoOtimizado),
        incluiHistoriaCompleta: historiaCompleta,
        incluiAparenciaCompleta: aparenciaCompleta
    };

    return contextoOtimizado;
}

/**
 * Calcula tokens economizados (estimativa)
 * 
 * @param {Object} contextoOriginal - Contexto original
 * @param {Object} contextoOtimizado - Contexto otimizado
 * @returns {number} Estimativa de tokens economizados
 */
function calcularTokensEconomizados(contextoOriginal, contextoOtimizado) {
    // Estimativa simples: 1 token ≈ 4 caracteres
    const tamanhoOriginal = JSON.stringify(contextoOriginal).length;
    const tamanhoOtimizado = JSON.stringify(contextoOtimizado).length;
    const economia = tamanhoOriginal - tamanhoOtimizado;
    
    return Math.floor(economia / 4);
}

// =====================================
// FUNÇÕES AUXILIARES
// =====================================

/**
 * Define manualmente campos para incluir no contexto
 * 
 * @param {Object} contextoOtimizado - Contexto otimizado
 * @param {Array<string>} campos - Lista de campos para forçar inclusão
 * @returns {Object} Contexto com campos forçados
 */
function forcarInclusao(contextoOtimizado, campos) {
    const camposValidos = ['historia', 'aparencia', 'equipamentos', 'tecnicas', 'missaoAtual', 'mundo', 'memorias'];
    
    for (const campo of campos) {
        if (camposValidos.includes(campo)) {
            contextoOtimizado._meta = contextoOtimizado._meta || {};
            contextoOtimizado._meta.camposForcados = contextoOtimizado._meta.camposForcados || [];
            contextoOtimizado._meta.camposForcados.push(campo);
        }
    }
    
    return contextoOtimizado;
}

/**
 * Obtém estatísticas do contexto otimizado
 * 
 * @param {Object} contextoOtimizado - Contexto otimizado
 * @returns {Object} Estatísticas
 */
function obterEstatisticas(contextoOtimizado) {
    const meta = contextoOtimizado._meta || {};
    
    return {
        categorias: meta.categorias || [],
        categoriaPrincipal: meta.categoriaPrincipal || 'conversa',
        tokensEconomizados: meta.tokensEconomizados || 0,
        incluiHistoriaCompleta: meta.incluiHistoriaCompleta || false,
        incluiAparenciaCompleta: meta.incluiAparenciaCompleta || false,
        camposForcados: meta.camposForcados || []
    };
}

// =====================================
// EXPORTAÇÕES
// =====================================

module.exports = {
    // Função principal
    otimizarContexto,
    
    // Sistema de classificação
    classificarMensagem,
    
    // Verificações de intenção
    perguntouSobrePassado,
    perguntouSobreAparencia,
    envolveCombate,
    perguntouSobreLocalizacao,
    
    // Utilitários
    resumirTexto,
    forcarInclusao,
    obterEstatisticas,
    
    // Palavras-chave (para referência/expansão)
    PALAVRAS_CHAVE
};