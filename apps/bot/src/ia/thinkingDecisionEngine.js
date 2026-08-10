/**
 * ==========================================================
 * THINKING DECISION ENGINE
 * ==========================================================
 *
 * Módulo central responsável por decidir automaticamente
 * quando o modelo deve utilizar:
 *
 * - think=false (modo rápido/instântaneo)
 * - think=true (modo de raciocínio profundo)
 *
 * A decisão considera múltiplos fatores:
 *
 * 1. Complexidade da mensagem (0-100)
 * 2. Peso da categoria/intenção detectada
 * 3. Exceções (sempre thinking / sempre rápido)
 * 4. Memória de conversa (continuidade de assunto)
 * 5. Cache de decisões (evitar alternância excessiva)
 *
 * Fluxo de decisão:
 *
 * 1. Verificar exceções rápidas → think=false
 * 2. Verificar exceções profundas → think=true
 * 3. Verificar memória de assunto ativo → think=true
 * 4. Calcular pontuação: complexidade + peso da intenção
 * 5. Comparar com limite configurável → decidir
 * 6. Aplicar cache para estabilidade
 *
 * Princípios SOLID:
 * - Single Responsibility: apenas decide o modo thinking
 * - Open/Closed: configurável via JSON externo
 * - Dependency Injection: recebe analisadores como dependências
 *
 * Este módulo NÃO conversa com o Ollama e NÃO monta prompts.
 * Ele apenas retorna a decisão de thinking.
 */

const fs = require('fs');
const path = require('path');

// ==========================================================
// CONFIGURAÇÃO PADRÃO (sobrescrita pela configuração externa)
// ==========================================================

const CONFIG_PADRAO = {
    limiteThinking: 40,
    pesoIntencao: {
        // Conversação
        'cumprimento': 0,
        'despedida': 0,
        'conversaCasual': 5,
        'agradecimento': 5,
        'brincadeiras': 10,

        // RPG
        'combate': 25,
        'missao': 25,
        'exploracao': 15,
        'comercio': 15,
        'crafting': 20,
        'evolucao': 30,
        'inventario': 15,

        // NPC
        'personalidade': 35,
        'emocao': 10,
        'sentimentos': 35,
        'relacionamento': 35,
        'confianca': 40,
        'romance': 45,
        'amizade': 35,

        // História
        'passado': 50,
        'lore': 50,
        'acontecimentos': 50,
        'guerra': 55,
        'politica': 55,
        'faccoes': 50,
        'reinos': 50,

        // Estratégia
        'planejamento': 50,
        'tatica': 50,
        'investigacao': 65,
        'resolucaoProblemas': 45,

        // Filosofia
        'etica': 60,
        'moral': 60,
        'dilema': 60,
        'opniao': 50,

        // Eventos Especiais
        'boss': 90,
        'eventoMundial': 80,
        'missaoPrincipal': 75,
        'julgamento': 85,
        'escolhaPermanente': 85
    },

    // Lista de categorias que SEMPRE exigem thinking
    categoriasSempreThinking: [
        'boss',
        'eventoMundial',
        'missaoPrincipal',
        'julgamento',
        'escolhaPermanente',
        'boss',
        'investigacao',
        'dilema',
        'moral',
        'etica'
    ],

    // Lista de categorias que SEMPRE são rápidas
    categoriasSempreRapido: [
        'cumprimento',
        'despedida',
        'agradecimento',
        'brincadeiras'
    ],

    // Configuração de memória de assunto
    memoria: {
        assuntosAtivosMax: 3,
        mensagensAposFimAssunto: 3,
        thinkContinuoSeUltimoFoiThinking: true,
        reverterAposAssuntoTerminar: true
    },

    // Configuração de cache
    cache: {
        ativo: true,
        maxTrocasPorMinuto: 3,
        mensagensMinimasEntreTrocas: 2,
        cooldownMs: 10000
    },

    performance: {
        logAtivo: true,
        detalhado: true
    }
};

/**
 * ==========================================================
 * THINKING DECISION ENGINE
 * ==========================================================
 */

class ThinkingDecisionEngine {
    constructor() {
        this.configuracao = { ...CONFIG_PADRAO };
        this._carregarConfiguracao();

        // Cache da configuração externa (evita ler JSON do disco a cada chamada)
        this._configCache = null;
        this._carregarConfigCache();

        // Estado interno (por jogador+npc)
        this.estados = new Map();

        // Cache de decisões recentes
        this.cacheDecisoes = [];
        this.ultimaTroca = {
            timestamp: 0,
            direcao: null
        };
    }

    /**
     * Carrega e cacheia a configuração externa uma única vez
     * @private
     */
    _carregarConfigCache() {
        try {
            const configPath = path.join(__dirname, 'thinking-config.json');
            if (fs.existsSync(configPath)) {
                this._configCache = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            }
        } catch (erro) {
            console.warn('[ThinkingDecision] Erro ao carregar cache de configuração:', erro.message);
            this._configCache = null;
        }
    }

    /**
     * Obtém a configuração cacheada (sem ler do disco)
     * @returns {Object|null} Configuração cacheada
     * @private
     */
    _getConfig() {
        return this._configCache;
    }

    /**
     * Decide se a mensagem deve usar thinking
     *
     * @param {Object} parametros - Parâmetros para decisão
     * @param {string} parametros.mensagem - Mensagem do jogador
     * @param {Object} parametros.analiseIntencao - Resultado do IntentAnalyzer
     * @param {Object} parametros.analiseComplexidade - Resultado do ComplexityAnalyzer
     * @param {string} parametros.jogadorId - ID do jogador
     * @param {string} parametros.npcId - ID do NPC
     * @param {Object} parametros.historico - Histórico da conversa
     * @returns {Object} Decisão de thinking
     */
    decidir(parametros) {
        const inicio = Date.now();

        const {
            mensagem = '',
            analiseIntencao = null,
            analiseComplexidade = null,
            jogadorId = 'default',
            npcId = 'default',
            historico = []
        } = parametros;

        // =====================================
        // 1. VERIFICAR ESTADO DA CONVERSA
        // =====================================
        const estado = this._getEstado(jogadorId, npcId);

        // =====================================
        // 2. EXCEÇÕES SEMPRE RÁPIDAS
        // =====================================
        const excecaoRapida = this._verificarExcecaoRapida(mensagem);
        if (excecaoRapida.encontrada) {
            const decisao = {
                thinking: false,
                motivo: excecaoRapida.motivo,
                pontuacao: 0,
                complexidade: analiseComplexidade?.pontuacao || 0,
                categoria: analiseIntencao?.categoria || 'conversaCasual',
                pesoCategoria: analiseIntencao?.peso || 0,
                confianca: analiseIntencao?.confianca || 0,
                modo: 'rapido'
            };
            this._registrarDecisao(estado, decisao);
            return this._finalizar(decisao, inicio);
        }

        // =====================================
        // 3. EXCEÇÕES SEMPRE THINKING
        // =====================================
        const excecaoThinking = this._verificarExcecaoThinking(mensagem);
        if (excecaoThinking.encontrada) {
            const decisao = {
                thinking: true,
                motivo: excecaoThinking.motivo,
                pontuacao: 100,
                complexidade: analiseComplexidade?.pontuacao || 0,
                categoria: analiseIntencao?.categoria || 'conversaCasual',
                pesoCategoria: analiseIntencao?.peso || 0,
                confianca: analiseIntencao?.confianca || 0,
                modo: 'profundo'
            };
            this._registrarDecisao(estado, decisao);
            return this._finalizar(decisao, inicio);
        }

        // =====================================
        // 4. CATEGORIAS SEMPRE THINKING
        // =====================================
        const categoria = analiseIntencao?.categoria || 'conversaCasual';
        if (this.configuracao.categoriasSempreThinking.includes(categoria)) {
            const decisao = {
                thinking: true,
                motivo: `Categoria exige thinking: ${categoria}`,
                pontuacao: 100,
                complexidade: analiseComplexidade?.pontuacao || 0,
                categoria: categoria,
                pesoCategoria: analiseIntencao?.peso || 0,
                confianca: analiseIntencao?.confianca || 0,
                modo: 'profundo'
            };
            this._registrarDecisao(estado, decisao);
            return this._finalizar(decisao, inicio);
        }

        // =====================================
        // 5. MEMÓRIA DE ASSUNTO ATIVO
        // =====================================
        if (this._verificarAssuntoAtivo(estado, categoria)) {
            const decisao = {
                thinking: true,
                motivo: 'Assunto anterior ainda em desenvolvimento',
                pontuacao: 100,
                complexidade: analiseComplexidade?.pontuacao || 0,
                categoria: categoria,
                pesoCategoria: analiseIntencao?.peso || 0,
                confianca: analiseIntencao?.confianca || 0,
                modo: 'continuidade'
            };
            this._registrarDecisao(estado, decisao);
            return this._finalizar(decisao, inicio);
        }

        // =====================================
        // 6. CALCULAR PONTUAÇÃO COMPOSTA
        // =====================================
        const complexidade = analiseComplexidade?.pontuacao || 0;
        const pesoIntencao = this._getPesoIntencao(categoria);
        const confianca = analiseIntencao?.confianca || 0;

        // Fórmula: 60% complexidade + 40% peso da intenção (ajustado pela confiança)
        const pontuacaoComposta = Math.min(100, Math.round(
            (complexidade * 0.6) +
            (pesoIntencao * 0.4 * (1 + (confianca / 100)))
        ));

        const limite = this.configuracao.limiteThinking;
        let thinking = pontuacaoComposta >= limite;

        // =====================================
        // 7. APLICAR CACHE DE ESTABILIDADE
        // =====================================
        const decisaoBruta = {
            thinking: thinking,
            motivo: thinking
                ? `Pontuação ${pontuacaoComposta} ≥ limite ${limite}`
                : `Pontuação ${pontuacaoComposta} < limite ${limite}`,
            pontuacao: pontuacaoComposta,
            complexidade: complexidade,
            categoria: categoria,
            pesoCategoria: pesoIntencao,
            confianca: confianca,
            modo: thinking ? 'profundo' : 'rapido'
        };

        const decisaoFinal = this._aplicarCacheEstabilidade(estado, decisaoBruta, categoria);
        this._registrarDecisao(estado, decisaoFinal);

        return this._finalizar(decisaoFinal, inicio);
    }

    /**
     * Finaliza a decisão com informações de performance
     *
     * @param {Object} decisao - Decisão tomada
     * @param {number} inicio - Timestamp de início
     * @returns {Object} Decisão final com metadados
     * @private
     */
    _finalizar(decisao, inicio) {
        const tempoDecisao = Date.now() - inicio;

        // Registrar no log de performance
        if (this.configuracao.performance.logAtivo) {
            const log = {
                tipo: 'thinking_decision',
                timestamp: new Date().toISOString(),
                mensagem: decisao.motivo,
                thinking: decisao.thinking,
                pontuacao: decisao.pontuacao,
                complexidade: decisao.complexidade,
                categoria: decisao.categoria,
                tempoDecisao: tempoDecisao
            };

            if (this.configuracao.performance.detalhado) {
                log.pesoCategoria = decisao.pesoCategoria;
                log.confianca = decisao.confianca;
                log.modo = decisao.modo;
            }

            console.log(`[ThinkingDecision] ${JSON.stringify(log)}`);
        }

        return {
            ...decisao,
            tempoDecisao: tempoDecisao
        };
    }

    /**
     * Obtém o estado de uma conversa
     *
     * @param {string} jogadorId - ID do jogador
     * @param {string} npcId - ID do NPC
     * @returns {Object} Estado da conversa
     * @private
     */
    _getEstado(jogadorId, npcId) {
        const chave = `${jogadorId}:${npcId}`;

        if (!this.estados.has(chave)) {
            this.estados.set(chave, {
                chave: chave,
                ultimoThinking: null,
                ultimaCategoria: null,
                assuntosAtivos: [],
                contadorMensagens: 0,
                trocasRecentres: [],
                ultimaDecisao: null
            });
        }

        return this.estados.get(chave);
    }

    /**
     * Verifica exceções rápidas (mensagens curtas de cumprimento)
     *
     * @param {string} mensagem - Mensagem do jogador
     * @returns {Object} Resultado da verificação
     * @private
     */
    _verificarExcecaoRapida(mensagem) {
        const texto = mensagem.toLowerCase().trim();

        try {
            const config = this._getConfig();
            const excecoes = config ? (config.excecoesSempreRapido || []) : [];

            for (const excecao of excecoes) {
                if (texto === excecao || texto.startsWith(excecao + ' ') || texto.endsWith(' ' + excecao)) {
                    return { encontrada: true, motivo: `Exceção rápida: "${excecao}"` };
                }
            }
        } catch (erro) {
            // Fallback para lista interna
            const excecoesPadrao = [
                'bom dia', 'boa tarde', 'boa noite', 'oi', 'olá', 'ola',
                'e aí', 'e ai', 'tudo bem', 'como vai', 'tchau', 'até logo',
                'ate logo', 'até mais', 'ate mais', 'obrigado', 'obrigada',
                'valeu', 'prazer', 'sim', 'não', 'nao', 'ok', 'okay',
                'kkk', 'kkkk', 'haha', 'legal', 'entendi', 'certo'
            ];

            for (const excecao of excecoesPadrao) {
                if (texto === excecao || texto.startsWith(excecao + ' ') || texto.endsWith(' ' + excecao)) {
                    return { encontrada: true, motivo: `Exceção rápida: "${excecao}"` };
                }
            }
        }

        return { encontrada: false, motivo: null };
    }

    /**
     * Verifica exceções profundas (mensagens que sempre exigem thinking)
     *
     * @param {string} mensagem - Mensagem do jogador
     * @returns {Object} Resultado da verificação
     * @private
     */
    _verificarExcecaoThinking(mensagem) {
        const texto = mensagem.toLowerCase().trim();

        try {
            const config = this._getConfig();
            const excecoes = config ? (config.excecoesSempreThinking || []) : [];

            for (const excecao of excecoes) {
                if (texto.includes(excecao)) {
                    return { encontrada: true, motivo: `Exceção profunda: "${excecao}"` };
                }
            }
        } catch (erro) {
            // Fallback para lista interna
            const excecoesPadrao = [
                'quem matou', 'quem matou o', 'quem matou a',
                'por que você', 'por que voce', 'por quê você', 'por quê voce',
                'conte sua história', 'conte sua historia',
                'me conte sua história', 'me conte sua historia',
                'qual sua origem', 'você se lembra', 'voce se lembra',
                'você lembra', 'voce lembra', 'o que aconteceu', 'o que houve',
                'o que está acontecendo', 'o que esta acontecendo',
                'por que isso aconteceu', 'o que você faria', 'o que voce faria',
                'como você se sente', 'como voce se sente',
                'o que você sente', 'o que voce sente',
                'você confia em mim', 'voce confia em mim',
                'você gosta de mim', 'voce gosta de mim',
                'você me ama', 'voce me ama', 'você me trairia', 'voce me trairia',
                'o que você esconde', 'o que voce esconde',
                'o que você sabe', 'o que voce sabe',
                'o que você viu', 'o que voce viu',
                'você já matou', 'voce ja matou',
                'conte-me', 'conte me', 'me conte', 'explique',
                'por que matou', 'porque matou', 'quem traiu'
            ];

            for (const excecao of excecoesPadrao) {
                if (texto.includes(excecao)) {
                    return { encontrada: true, motivo: `Exceção profunda: "${excecao}"` };
                }
            }
        }

        return { encontrada: false, motivo: null };
    }

    /**
     * Obtém o peso de uma intenção
     *
     * @param {string} categoria - Categoria da intenção
     * @returns {number} Peso da intenção
     * @private
     */
    _getPesoIntencao(categoria) {
        // Prioridade: configuração externa cacheada
        const config = this._getConfig();
        if (config && config.pesosPrioridade && config.pesosPrioridade[categoria] !== undefined) {
            return config.pesosPrioridade[categoria];
        }

        // Fallback: mapa interno
        const peso = this.configuracao.pesoIntencao[categoria];
        if (peso !== undefined) return peso;

        // Fallback: categoria desconhecida
        return 5;
    }

    /**
     * Verifica se há um assunto ativo que exige continuidade de thinking
     *
     * @param {Object} estado - Estado da conversa
     * @param {string} categoria - Categoria da intenção atual
     * @returns {boolean} True se assunto ativo exige thinking
     * @private
     */
    _verificarAssuntoAtivo(estado, categoria) {
        const config = this.configuracao.memoria;

        if (!config.thinkContinuoSeUltimoFoiThinking) return false;
        if (!estado.ultimoThinking) return false;

        // Se o último foi thinking e estamos na mesma categoria, manter
        if (estado.ultimaCategoria === categoria && estado.ultimoThinking === true) {
            return true;
        }

        // Se há assuntos ativos de thinking
        if (estado.assuntosAtivos && estado.assuntosAtivos.length > 0) {
            const ultimoAssunto = estado.assuntosAtivos[estado.assuntosAtivos.length - 1];
            if (ultimoAssunto.categoria === categoria) {
                return true;
            }

            // Continuidade: se o último assunto era de thinking e a mensagem atual
            // é uma pergunta de acompanhamento curta, manter thinking
            if (ultimoAssunto.categoria !== categoria &&
                ultimoAssunto.mensagens < config.mensagensAposFimAssunto + 3) {
                return true;
            }
        }

        return false;
    }

    /**
     * Aplica o cache de estabilidade para evitar alternância excessiva
     *
     * @param {Object} estado - Estado da conversa
     * @param {Object} decisao - Decisão bruta
     * @param {string} categoria - Categoria da intenção
     * @returns {Object} Decisão final estabilizada
     * @private
     */
    _aplicarCacheEstabilidade(estado, decisao, categoria) {
        const config = this.configuracao.cache;

        if (!config.ativo) return decisao;

        const agora = Date.now();

        // Contar trocas recentes (nos últimos 60 segundos)
        const trocasRecentes = estado.trocasRecentres.filter(
            troca => agora - troca.timestamp < 60000
        );

        // Se houve troca recente (cooldown), manter a decisão anterior
        if (trocasRecentes.length > 0) {
            const ultimaTroca = trocasRecentes[trocasRecentes.length - 1];
            if (agora - ultimaTroca.timestamp < config.cooldownMs) {
                // Manter decisão anterior
                return {
                    ...decisao,
                    thinking: estado.ultimoThinking ?? decisao.thinking,
                    motivo: `${decisao.motivo} (mantido por cooldown)`,
                    modo: estado.ultimoThinking ? 'profundo' : 'rapido'
                };
            }
        }

        // Se excedeu o limite de trocas por minuto
        if (trocasRecentes.length >= config.maxTrocasPorMinuto) {
            return {
                ...decisao,
                thinking: estado.ultimoThinking ?? decisao.thinking,
                motivo: `${decisao.motivo} (limite de trocas atingido)`,
                modo: estado.ultimoThinking ? 'profundo' : 'rapido'
            };
        }

        // Se a decisão mudou em relação à anterior
        if (estado.ultimoThinking !== null && estado.ultimoThinking !== decisao.thinking) {
            // Verificar se mudou recentemente (menos de N mensagens)
            const tempoDesdeUltimaMudanca = agora - (estado.ultimaMudanca || 0);

            if (estado.contadorMensagens < config.mensagensMinimasEntreTrocas &&
                tempoDesdeUltimaMudanca < 30000) {
                return {
                    ...decisao,
                    thinking: estado.ultimoThinking,
                    motivo: `${decisao.motivo} (mínimo de mensagens entre trocas)`,
                    modo: estado.ultimoThinking ? 'profundo' : 'rapido'
                };
            }
        }

        return decisao;
    }

    /**
     * Registra a decisão no estado da conversa
     *
     * @param {Object} estado - Estado da conversa
     * @param {Object} decisao - Decisão tomada
     * @private
     */
    _registrarDecisao(estado, decisao) {
        const config = this.configuracao.cache;

        // Se houve mudança de modo
        if (estado.ultimoThinking !== null && estado.ultimoThinking !== decisao.thinking) {
            // Registrar troca
            estado.trocasRecentres.push({
                timestamp: Date.now(),
                de: estado.ultimoThinking,
                para: decisao.thinking
            });

            // Manter apenas trocas dos últimos 5 minutos
            estado.trocasRecentres = estado.trocasRecentres.filter(
                troca => Date.now() - troca.timestamp < 300000
            );

            estado.ultimaMudanca = Date.now();

            // Se está voltando para o modo rápido, considerar assunto encerrado
            if (decisao.thinking === false && config.ativo) {
                estado.assuntosAtivos = [];
            }
        }

        // Atualizar estado
        estado.ultimoThinking = decisao.thinking;
        estado.ultimaCategoria = decisao.categoria;
        estado.contadorMensagens++;
        estado.ultimaDecisao = decisao;

        // Gerenciar assuntos ativos
        if (decisao.thinking === true && !estado.assuntosAtivos.some(a => a.categoria === decisao.categoria)) {
            estado.assuntosAtivos.push({
                categoria: decisao.categoria,
                inicio: Date.now(),
                mensagens: 1
            });

            // Limitar número de assuntos ativos
            if (estado.assuntosAtivos.length > this.configuracao.memoria.assuntosAtivosMax) {
                estado.assuntosAtivos.shift();
            }
        } else if (estado.assuntosAtivos.length > 0) {
            // Incrementar contador de mensagens do assunto atual
            const ultimoAssunto = estado.assuntosAtivos[estado.assuntosAtivos.length - 1];
            ultimoAssunto.mensagens++;

            // Encerrar assunto se passou do limite de mensagens sem continuidade
            if (ultimoAssunto.mensagens > this.configuracao.memoria.mensagensAposFimAssunto + 3) {
                estado.assuntosAtivos.shift();
            }
        }
    }

    /**
     * Carrega a configuração externa
     *
     * @private
     */
    _carregarConfiguracao() {
        try {
            const configPath = path.join(__dirname, 'thinking-config.json');
            if (fs.existsSync(configPath)) {
                const configExterna = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

                if (configExterna.limiteThinking !== undefined) {
                    this.configuracao.limiteThinking = configExterna.limiteThinking;
                }

                if (configExterna.pesosPrioridade) {
                    Object.assign(this.configuracao.pesoIntencao, configExterna.pesosPrioridade);
                }

                if (configExterna.memoria) {
                    Object.assign(this.configuracao.memoria, configExterna.memoria);
                }

                if (configExterna.cache) {
                    Object.assign(this.configuracao.cache, configExterna.cache);
                }

                if (configExterna.performance) {
                    Object.assign(this.configuracao.performance, configExterna.performance);
                }
            }
        } catch (erro) {
            console.warn('[ThinkingDecision] Erro ao carregar configuração:', erro.message);
        }
    }

    /**
     * Retorna estatísticas do motor de decisão
     *
     * @returns {Object} Estatísticas
     */
    getEstatisticas() {
        const estados = [...this.estados.values()];

        let totalDecisoes = 0;
        let totalThinking = 0;
        let totalRapido = 0;

        for (const estado of estados) {
            if (estado.contadorMensagens > 0) {
                totalDecisoes += estado.contadorMensagens;
                if (estado.ultimaDecisao) {
                    if (estado.ultimaDecisao.thinking) {
                        totalThinking++;
                    } else {
                        totalRapido++;
                    }
                }
            }
        }

        return {
            conversasAtivas: estados.length,
            totalDecisoes: totalDecisoes,
            totalThinking: totalThinking,
            totalRapido: totalRapido,
            percentualThinking: totalDecisoes > 0
                ? Math.round((totalThinking / totalDecisoes) * 100)
                : 0,
            percentualRapido: totalDecisoes > 0
                ? Math.round((totalRapido / totalDecisoes) * 100)
                : 0,
            cacheAtivo: this.configuracao.cache.ativo,
            limiteThinking: this.configuracao.limiteThinking
        };
    }

    /**
     * Reseta o estado de uma conversa
     *
     * @param {string} jogadorId - ID do jogador
     * @param {string} npcId - ID do NPC
     */
    resetarConversa(jogadorId, npcId) {
        const chave = `${jogadorId}:${npcId}`;
        this.estados.delete(chave);
    }

    /**
     * Reseta todos os estados
     */
    resetarTudo() {
        this.estados.clear();
        this.cacheDecisoes = [];
        this.ultimaTroca = { timestamp: 0, direcao: null };
    }
}

// ==========================================================
// INSTÂNCIA SINGLETON
// ==========================================================

const thinkingDecisionEngine = new ThinkingDecisionEngine();

module.exports = {
    ThinkingDecisionEngine,
    thinkingDecisionEngine
};