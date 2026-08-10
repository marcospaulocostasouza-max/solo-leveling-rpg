/**
 * OLLAMA SERVICE
 *
 * Serviço centralizado para comunicação com o Ollama.
 * Gerencia conexão HTTP, métricas, streaming e configurações do modelo.
 *
 * Funcionalidades:
 * - Conexão HTTP reutilizável (keep-alive)
 * - Timeout configurável
 * - Métricas de desempenho
 * - Suporte a streaming
 * - Configurações otimizadas do modelo
 */

const axios = require('axios');
const os = require('os');

// =====================================
// CONFIGURAÇÃO CENTRALIZADA DO MODELO
// =====================================
const { MODEL_CONFIG, OLLAMA_THINKING } = require('./modelConfig');

const CONFIG_MODELO = {
    ...MODEL_CONFIG,
    num_thread: MODEL_CONFIG.num_thread ?? detectarNucleosCPU()
};

/**
 * Detecta automaticamente a quantidade de núcleos físicos da CPU
 * @returns {number} Número de núcleos físicos
 */
function detectarNucleosCPU() {
    const cpus = os.cpus();
    // Contar apenas núcleos físicos (desconsiderar hyper-threading)
    const nucleosFisicos = cpus.filter((cpu, index, self) => {
        return index === self.findIndex(c => c.model === cpu.model);
    }).length;
    
    return nucleosFisicos || cpus.length / 2 || 4;
}

// =====================================
// CLIENTE AXIOS REUTILIZÁVEL
// =====================================

const httpClient = axios.create({
    baseURL: 'http://localhost:11434',
    timeout: 600000, // 10 minutos
    httpAgent: new (require('http').Agent)({
        keepAlive: true,
        maxSockets: 10
    }),
    httpsAgent: new (require('https').Agent)({
        keepAlive: true,
        maxSockets: 10
    }),
    decompress: true, // Habilitar compressão
    headers: {
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
    }
});

// =====================================
// PARSER NDJSON ROBUSTO
// =====================================
// O Ollama envia NDJSON; chunks HTTP podem conter linhas parciais ou múltiplas.
// Este parser acumula dados em buffer, separa por newline e faz JSON.parse
// somente em linhas completas, processando a última linha restante no final.
async function* lerNDJSON(stream) {
    let buffer = '';
    for await (const chunk of stream) {
        buffer += chunk.toString('utf8');
        const linhas = buffer.split(/\r?\n/);
        // A última parte pode ser uma linha incompleta; mantém no buffer
        buffer = linhas.pop();
        for (const linha of linhas) {
            const linhaLimpa = linha.trim();
            if (linhaLimpa) {
                try {
                    yield JSON.parse(linhaLimpa);
                } catch (erro) {
                    console.warn('[OllamaService] Linha NDJSON inválida ignorada:', erro.message);
                }
            }
        }
    }
    // Processar a última linha restante quando o stream terminar
    if (buffer.trim()) {
        try {
            yield JSON.parse(buffer.trim());
        } catch (erro) {
            console.warn('[OllamaService] Linha NDJSON final inválida ignorada:', erro.message);
        }
    }
}

// =====================================
// DEBUG TEMPORÁRIO
// =====================================

function exibirDebugPayload(payload, prompt) {
    console.log('\n============================================================');
    console.log('🔬 DEBUG OLLAMA');
    console.log('============================================================');
    console.log('Modelo       :', payload.model);
    console.log('Think        :', payload.think);
    console.log('Contexto     :', payload.options.num_ctx);
    console.log('Threads      :', payload.options.num_thread);
    console.log('Temperature  :', payload.options.temperature);
    console.log('Top P        :', payload.options.top_p);
    console.log('Top K        :', payload.options.top_k);
    console.log('Prompt chars :', prompt.length);
    console.log('Prompt ~tok  :', Math.ceil(prompt.length / 4));
    console.log('============================================================\n');
}

function exibirResultado(metricas, texto, thinking) {
    console.log('\n============================================================');
    console.log('⚡ RESULTADO OLLAMA');
    console.log('============================================================');
    console.log('TTFT         :', `${metricas.tempoTTFT} ms`);
    console.log('Tempo total  :', `${metricas.tempo} ms`);
    console.log('Tokens       :', metricas.tokens);
    console.log('Velocidade   :', `${metricas.velocidade} tok/s`);
    console.log('Thinking     :', thinking);
    console.log('Resposta     :', `${texto.length} caracteres`);
    // Métricas reais da API do Ollama (quando disponíveis)
    if (metricas.metricasAPI) {
        const m = metricas.metricasAPI;
        console.log('--- Métricas da API ---');
        console.log('Prompt tokens:', m.promptEvalCount ?? 'n/d');
        console.log('Output tokens:', m.evalCount ?? 'n/d');
        console.log('Prompt eval  :', m.promptEvalDurationMs ? `${m.promptEvalDurationMs} ms` : 'n/d');
        console.log('Load duration:', m.loadDurationMs ? `${m.loadDurationMs} ms` : 'n/d');
        console.log('-----------------------');
    }
    if (!texto) console.warn('Resposta vazia: Ollama finalizou sem conteúdo em response.');
    console.log('============================================================\n');
}

// =====================================
// OLLAMA SERVICE
// =====================================

class OllamaService {
    constructor() {
        this.metricas = {
            totalChamadas: 0,
            totalTokens: 0,
            tempoTotal: 0,
            erros: 0,
            ultimaChamada: null
        };
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutos
    }

    /**
     * Decide se deve usar cache para a chamada.
     *
     * Geração narrativa (think=false) NÃO deve ser cacheada, pois cada
     * cena é dinâmica e depende do contexto específico do jogador.
     *
     * @param {Object} opcoes - Opções da chamada
     * @returns {boolean} True se deve usar cache
     * @private
     */
    _deveUsarCache(opcoes = {}) {
        // Se OLLAMA_THINKING=false (modo narrativo), desativa cache.
        // Chamadas utilitárias podem forcar cache com opcoes.usarCache=true.
        if (!OLLAMA_THINKING && !opcoes.usarCache) return false;
        return true;
    }

    /**
     * Monta o payload padrão para o Ollama
     * @param {string} prompt - Prompt otimizado
     * @param {Object} opcoes - Opções customizadas
     * @returns {Object} Payload
     * @private
     */
    _montarPayload(prompt, opcoes = {}) {
        // Durante o teste controlado (OLLAMA_THINKING=false), TODAS as chamadas
        // usam think=false, independente de opcoes.thinking.
        // Para reativar o thinking, basta mudar OLLAMA_THINKING para true.
        const thinkEfetivo = OLLAMA_THINKING ? (opcoes.thinking ?? OLLAMA_THINKING) : false;

        return {
            model: CONFIG_MODELO.model,
            prompt: prompt,
            stream: true,
            // Suporte ao modo thinking do Qwen3
            think: thinkEfetivo,
            options: {
                temperature: opcoes.temperature ?? CONFIG_MODELO.temperature,
                top_p: opcoes.top_p ?? CONFIG_MODELO.top_p,
                top_k: opcoes.top_k ?? CONFIG_MODELO.top_k,
                repeat_penalty: opcoes.repeat_penalty ?? CONFIG_MODELO.repeat_penalty,
                num_ctx: opcoes.num_ctx ?? CONFIG_MODELO.num_ctx,
                num_predict: opcoes.num_predict ?? CONFIG_MODELO.num_predict,
                num_thread: opcoes.num_thread ?? CONFIG_MODELO.num_thread
            }
        };
    }

    /**
     * Gera uma resposta usando o Ollama (sem streaming)
     * @param {string} prompt - Prompt completo
     * @param {Object} opcoes - Opções customizadas
     * @param {boolean} opcoes.thinking - Se true, ativa o modo raciocínio do Qwen3
     * @returns {Promise<Object>} Resposta com texto e métricas
     */
    async gerarResposta(prompt, opcoes = {}) {
        const inicio = Date.now();
        const tempoInicioChamada = Date.now();
        
        try {
            // Verificar cache (desativado para geração narrativa)
            const usarCache = this._deveUsarCache(opcoes);
            const chaveCache = usarCache ? this.gerarChaveCache(prompt, opcoes) : null;
            const cacheHit = usarCache ? this.obterCache(chaveCache) : null;
            
            if (cacheHit) {
                return cacheHit;
            }

            // Otimizar prompt antes de enviar
            const promptOtimizado = this.otimizarPrompt(prompt);
            
            const payload = this._montarPayload(promptOtimizado, opcoes);
            exibirDebugPayload(payload, promptOtimizado);

            const response = await httpClient.post('/api/generate', payload, {
                responseType: 'stream'
            });

            const stream = response.data;
            let respostaCompleta = '';
            let raciocinioCompleto = '';
            let dentroDeRaciocinio = false;
            let primeiroToken = false;
            let tempoTTFT = 0;
            let metricasAPI = null;

            for await (const json of lerNDJSON(stream)) {
                // Capturar métricas reais da API no objeto final (done: true)
                if (json.done && json.prompt_eval_count !== undefined) {
                    metricasAPI = {
                        promptEvalCount: json.prompt_eval_count,
                        promptEvalDurationMs: json.prompt_eval_duration ? Math.round(json.prompt_eval_duration / 1e6) : 0,
                        evalCount: json.eval_count,
                        evalDurationMs: json.eval_duration ? Math.round(json.eval_duration / 1e6) : 0,
                        totalDurationMs: json.total_duration ? Math.round(json.total_duration / 1e6) : 0,
                        loadDurationMs: json.load_duration ? Math.round(json.load_duration / 1e6) : 0
                    };
                }
                if (json.response) {
                    const textoChunk = json.response;
                    
                    // Medir TTFT no primeiro token
                    if (!primeiroToken) {
                        primeiroToken = true;
                        tempoTTFT = Date.now() - tempoInicioChamada;
                    }

                    respostaCompleta += textoChunk;

                    // Quando think=false, a resposta é tratada diretamente como texto final.
                    // Não há tags de thinking para processar.
                    if (!payload.think) {
                        continue;
                    }

                    // Separar raciocínio (tags ímprovis) da resposta final
                    if (textoChunk.includes('|im_start|>') || textoChunk.includes('|im_end|>')) {
                        const partes = textoChunk.split(/(\|im_start\|>|\|im_end\|>)/g);
                        for (const parte of partes) {
                            if (parte === '|im_start|>') {
                                if (respostaCompleta.includes('|im_start|>think')) {
                                    dentroDeRaciocinio = true;
                                }
                            } else if (parte === '|im_end|>') {
                                dentroDeRaciocinio = false;
                            }
                        }
                    } else if (dentroDeRaciocinio) {
                        raciocinioCompleto += textoChunk;
                    }
                }
            }

            const tempo = Date.now() - inicio;
            const tempoGeracao = primeiroToken ? Math.max(0, tempo - tempoTTFT) : 0;
            
            // Extrair resposta, removendo bloco de raciocínio se necessário
            const textoCompleto = respostaCompleta || '';
            let textoFinal = this.extrairResposta(textoCompleto, payload.think);
            
            // FALLBACK: Se a extracao removeu todo o conteudo, usar o texto original
            if (!textoFinal && textoCompleto) {
                console.warn('[OllamaService] extrairResposta removeu todo o conteudo. Usando texto original como fallback.');
                textoFinal = textoCompleto.trim();
            }
            
            // Atualizar métricas
            this.atualizarMetricas(tempo, textoFinal);
            
            const tokensGerados = this.estimarTokens(textoFinal);
            const velocidade = tempoGeracao > 0 ? (tokensGerados / (tempoGeracao / 1000)).toFixed(2) : 0;
            
            const resultado = {
                texto: textoFinal,
                raciocínio: payload.think ? this.extrairRaciocinio(textoCompleto) : null,
                metricas: {
                    tempo: tempo,
                    tempoTTFT: tempoTTFT,
                    tempoGeracao: tempoGeracao,
                    tokens: tokensGerados,
                    tokensComRaciocinio: this.estimarTokens(textoCompleto),
                    velocidade: parseFloat(velocidade),
                    prompt: promptOtimizado,
                    thinking: payload.think
                }
            };

            // Adicionar métricas reais da API do Ollama (quando disponíveis)
            if (metricasAPI) {
                resultado.metricas.metricasAPI = metricasAPI;
                // Usar contagem real de tokens e velocidade quando disponível
                if (metricasAPI.evalCount !== undefined && metricasAPI.evalCount > 0) {
                    resultado.metricas.tokens = metricasAPI.evalCount;
                }
                if (metricasAPI.evalDurationMs > 0 && metricasAPI.evalCount > 0) {
                    resultado.metricas.velocidade = parseFloat((metricasAPI.evalCount / (metricasAPI.evalDurationMs / 1000)).toFixed(2));
                }
            }

            exibirResultado(resultado.metricas, textoFinal, payload.think);

            // Salvar no cache APENAS se a resposta nao for vazia E o cache estiver habilitado
            if (usarCache) {
                if (textoFinal && textoFinal.length > 0) {
                    this.salvarCache(chaveCache, resultado);
                } else {
                    console.warn('[OllamaService] Resposta vazia nao foi cacheada.');
                }
            }
            
            return resultado;

        } catch (erro) {
            this.metricas.erros++;
            console.error('[OllamaService] Erro ao gerar resposta:', erro.message);
            throw erro;
        }
    }

    /**
     * Gera uma resposta usando streaming
     * @param {string} prompt - Prompt completo
     * @param {Function} callback - Função chamada para cada token
     * @param {Object} opcoes - Opções customizadas
     * @param {boolean} opcoes.thinking - Se true, ativa o modo raciocínio do Qwen3
     * @returns {Promise<Object>} Resposta completa e métricas
     */
    async gerarRespostaStreaming(prompt, callback, opcoes = {}) {
        const inicio = Date.now();
        const tempoInicioChamada = Date.now();
        let respostaCompleta = '';
        let raciocinioCompleto = '';
        let dentroDeRaciocinio = false;
        let primeiroToken = false;
        let tempoTTFT = 0;
        let metricasAPI = null;
        
        try {
            const promptOtimizado = this.otimizarPrompt(prompt);
            
            const payload = this._montarPayload(promptOtimizado, opcoes);
            exibirDebugPayload(payload, promptOtimizado);

            const response = await httpClient.post('/api/generate', payload, {
                responseType: 'stream'
            });

            const stream = response.data;
            
            for await (const json of lerNDJSON(stream)) {
                // Capturar métricas reais da API no objeto final (done: true)
                if (json.done && json.prompt_eval_count !== undefined) {
                    metricasAPI = {
                        promptEvalCount: json.prompt_eval_count,
                        promptEvalDurationMs: json.prompt_eval_duration ? Math.round(json.prompt_eval_duration / 1e6) : 0,
                        evalCount: json.eval_count,
                        evalDurationMs: json.eval_duration ? Math.round(json.eval_duration / 1e6) : 0,
                        totalDurationMs: json.total_duration ? Math.round(json.total_duration / 1e6) : 0,
                        loadDurationMs: json.load_duration ? Math.round(json.load_duration / 1e6) : 0
                    };
                }
                if (json.response) {
                    const textoChunk = json.response;
                    
                    // Medir TTFT no primeiro token
                    if (!primeiroToken) {
                        primeiroToken = true;
                        tempoTTFT = Date.now() - tempoInicioChamada;
                    }

                    respostaCompleta += textoChunk;

                    // Quando think=false, envia response.response diretamente ao callback.
                    // Não envia o conteúdo de thinking para o jogador.
                    if (!payload.think) {
                        if (typeof callback === 'function') {
                            callback(textoChunk);
                        }
                        continue;
                    }

                    // Separar raciocínio (tags ímprovis) da resposta final
                    if (textoChunk.includes('|im_start|>') || textoChunk.includes('|im_end|>')) {
                        const partes = textoChunk.split(/(\|im_start\|>|\|im_end\|>)/g);
                        for (const parte of partes) {
                            if (parte === '|im_start|>') {
                                if (respostaCompleta.includes('|im_start|>think')) {
                                    dentroDeRaciocinio = true;
                                }
                            } else if (parte === '|im_end|>') {
                                dentroDeRaciocinio = false;
                            } else if (!dentroDeRaciocinio) {
                                if (typeof callback === 'function') {
                                    callback(parte);
                                }
                            }
                        }
                    } else if (!dentroDeRaciocinio) {
                        if (typeof callback === 'function') {
                            callback(textoChunk);
                        }
                    } else {
                        raciocinioCompleto += textoChunk;
                    }
                }
            }

            const tempo = Date.now() - inicio;
            const tempoGeracao = primeiroToken ? Math.max(0, tempo - tempoTTFT) : 0;

            // Extrair texto final (remover tags e bloco thinking)
            const textoFinal = this.extrairResposta(respostaCompleta, payload.think);
            
            this.atualizarMetricas(tempo, textoFinal);

            const tokensGerados = this.estimarTokens(textoFinal);
            const velocidade = tempoGeracao > 0 ? (tokensGerados / (tempoGeracao / 1000)).toFixed(2) : 0;

            const resultado = {
                texto: textoFinal,
                raciocinio: payload.think ? this.extrairRaciocinio(respostaCompleta) : null,
                metricas: {
                    tempo: tempo,
                    tempoTTFT: tempoTTFT,
                    tempoGeracao: tempoGeracao,
                    tokens: tokensGerados,
                    tokensComRaciocinio: this.estimarTokens(respostaCompleta),
                    velocidade: parseFloat(velocidade),
                    prompt: promptOtimizado,
                    thinking: payload.think
                }
            };

            // Adicionar métricas reais da API do Ollama (quando disponíveis)
            if (metricasAPI) {
                resultado.metricas.metricasAPI = metricasAPI;
                // Usar contagem real de tokens e velocidade quando disponível
                if (metricasAPI.evalCount !== undefined && metricasAPI.evalCount > 0) {
                    resultado.metricas.tokens = metricasAPI.evalCount;
                }
                if (metricasAPI.evalDurationMs > 0 && metricasAPI.evalCount > 0) {
                    resultado.metricas.velocidade = parseFloat((metricasAPI.evalCount / (metricasAPI.evalDurationMs / 1000)).toFixed(2));
                }
            }

            exibirResultado(resultado.metricas, textoFinal, payload.think);

            return resultado;

        } catch (erro) {
            this.metricas.erros++;
            console.error('[OllamaService] Erro no streaming:', erro.message);
            throw erro;
        }
    }

    /**
     * Extrai a resposta final, removendo o bloco de raciocínio
     * do Qwen3 (tags ímprovis ou bloco thinking)
     *
     * @param {string} texto - Texto completo retornado pelo modelo
     * @param {boolean} thinking - Se o modo thinking estava ativo
     * @returns {string} Apenas a resposta final visível ao jogador
     */
    extrairResposta(texto, thinking = false) {
        if (!texto) return '';

        let resultado = texto;

        // 1. Remover bloco thinking (formato Qwen3 com ímprovis)
        // Formato: |im_start|>think\n...\n|im_end|>
        resultado = resultado.replace(/\|im_start\|>think[\s\S]*?\|im_end\|>/g, '');

        // 2. Remover bloco thinking real do Qwen3 (<think>...</think>)
        // Essa é a tag que o modelo qwen3:4b-thinking-2507 realmente usa.
        resultado = resultado.replace(/<think>[\s\S]*?<\/think>/gi, '');

        // 2b. Caso o modelo tenha sido cortado (num_predict) no meio do
        // raciocínio e nunca fechou a tag, remove tudo a partir de <think>.
        resultado = resultado.replace(/<think>[\s\S]*$/gi, '');

        // 2c. Variante antiga (mantida por segurança, caso apareça)
        resultado = resultado.replace(/<thinking>[\s\S]*?<\/thinking>/g, '');

        // 3. Remover tags ímprovis restantes de conversa
        resultado = resultado.replace(/\|im_start\|>/g, '');
        resultado = resultado.replace(/\|im_end\|>/g, '');

        // 4. Se thinking estava ativo mas o texto começa com "think" (resposta bruta)
        if (thinking) {
            resultado = resultado.replace(/^think\s*\n?/i, '');
        }

        // 5. Remover a tag final "|im_end|>"
        resultado = resultado.replace(/\|im_end\|>\s*$/g, '');

        return resultado.trim();
    }

    /**
     * Extrai apenas o conteúdo do raciocínio do modelo
     *
     * @param {string} texto - Texto completo retornado pelo modelo
     * @returns {string|null} Conteúdo do raciocínio ou null
     */
    extrairRaciocinio(texto) {
        if (!texto) return null;

        // Formato Qwen3 com ímprovis
        const matchImprovis = texto.match(/\|im_start\|>think\n?([\s\S]*?)\|im_end\|>/);
        if (matchImprovis) {
            return matchImprovis[1].trim();
        }

        // Formato alternativo com <thinking> tags
        const matchTags = texto.match(/<thinking>([\s\S]*?)<\/thinking>/);
        if (matchTags) {
            return matchTags[1].trim();
        }

        return null;
    }

    /**
     * Otimiza o prompt antes de enviar ao modelo
     * @param {string} prompt - Prompt original
     * @returns {string} Prompt otimizado
     */
    otimizarPrompt(prompt) {
        if (!prompt || typeof prompt !== 'string') {
            return '';
        }

        // Remover espaços extras
        let otimizado = prompt.replace(/ +/g, ' ');
        
        // Remover linhas vazias consecutivas (mantém no máximo 2)
        otimizado = otimizado.replace(/\n{3,}/g, '\n\n');
        
        // Remover linhas que contém apenas espaços
        otimizado = otimizado.split('\n')
            .map(linha => linha.trim())
            .filter(linha => linha.length > 0)
            .join('\n');
        
        // Remover seções vazias (padrão: "NOME\n====\n\n")
        otimizado = otimizado.replace(/#{3,}.*\n#{3,}\n\n/g, '');
        
        // Trim final
        otimizado = otimizado.trim();
        
        return otimizado;
    }

    /**
     * Estima o número de tokens em um texto
     * @param {string} texto - Texto para contar
     * @returns {number} Estimativa de tokens
     */
    estimarTokens(texto) {
        if (!texto) return 0;
        // Estimativa: ~4 caracteres por token
        return Math.ceil(texto.length / 4);
    }

    /**
     * Atualiza as métricas do serviço
     * @param {number} tempo - Tempo da chamada em ms
     * @param {string} resposta - Resposta do modelo
     */
    atualizarMetricas(tempo, resposta) {
        this.metricas.totalChamadas++;
        this.metricas.tempoTotal += tempo;
        this.metricas.ultimaChamada = Date.now();
        
        if (resposta) {
            this.metricas.totalTokens += this.estimarTokens(resposta);
        }
    }

    /**
     * Retorna as métricas atuais
     * @returns {Object} Métricas de desempenho
     */
    getMetricas() {
        return {
            ...this.metricas,
            tempoMedio: this.metricas.totalChamadas > 0 
                ? Math.round(this.metricas.tempoTotal / this.metricas.totalChamadas)
                : 0,
            tokensMedios: this.metricas.totalChamadas > 0
                ? Math.round(this.metricas.totalTokens / this.metricas.totalChamadas)
                : 0
        };
    }

    /**
     * Reseta as métricas
     */
    resetarMetricas() {
        this.metricas = {
            totalChamadas: 0,
            totalTokens: 0,
            tempoTotal: 0,
            erros: 0,
            ultimaChamada: null
        };
    }

    /**
     * Verifica se o Ollama está disponível
     * @returns {Promise<boolean>} True se disponível
     */
    async verificarDisponibilidade() {
        try {
            const response = await httpClient.get('/api/tags', { timeout: 5000 });
            return response.status === 200;
        } catch (erro) {
            console.error('[OllamaService] Ollama não disponível:', erro.message);
            return false;
        }
    }

    /**
     * Lista os modelos disponíveis
     * @returns {Promise<Array>} Lista de modelos
     */
    async listarModelos() {
        try {
            const response = await httpClient.get('/api/tags');
            return response.data.models || [];
        } catch (erro) {
            console.error('[OllamaService] Erro ao listar modelos:', erro.message);
            return [];
        }
    }

    /**
     * Obtém informações do modelo atual
     * @returns {Object} Informações do modelo
     */
    getInfoModelo() {
        return {
            nome: CONFIG_MODELO.model,
            configuracao: { ...CONFIG_MODELO },
            metricas: this.getMetricas()
        };
    }

    /**
     * Atualiza configurações do modelo
     * @param {Object} novasConfiguracoes - Novas configurações
     */
    atualizarConfiguracao(novasConfiguracoes) {
        Object.assign(CONFIG_MODELO, novasConfiguracoes);
    }

    /**
     * Gera uma chave única para o cache
     * @param {string} prompt - Prompt
     * @param {Object} opcoes - Opções
     * @returns {string} Chave de cache
     */
    gerarChaveCache(prompt, opcoes) {
        const dados = JSON.stringify({ prompt, opcoes });
        return dados; // Usar o próprio JSON como chave
    }

    /**
     * Obtém uma resposta do cache
     * @param {string} chave - Chave do cache
     * @returns {Object|null} Resultado em cache ou null
     */
    obterCache(chave) {
        const item = this.cache.get(chave);
        
        if (!item) return null;
        
        // Verificar TTL
        if (Date.now() - item.timestamp > this.cacheTTL) {
            this.cache.delete(chave);
            return null;
        }
        
        return item.resultado;
    }

    /**
     * Salva uma resposta no cache
     * @param {string} chave - Chave do cache
     * @param {Object} resultado - Resultado para cache
     */
    salvarCache(chave, resultado) {
        this.cache.set(chave, {
            resultado: resultado,
            timestamp: Date.now()
        });
        
        // Limpar cache antigo se muito grande
        if (this.cache.size > 100) {
            const primeiro = this.cache.keys().next().value;
            this.cache.delete(primeiro);
        }
    }

    /**
     * Limpa o cache de respostas
     */
    limparCache() {
        this.cache.clear();
    }
}

// =====================================
// INSTÂNCIA SINGLETON
// =====================================

const ollamaService = new OllamaService();
ollamaService.limparCache();

// =====================================
// FUNÇÕES AUXILIARES
// =====================================

/**
 * Gera resposta de forma simples (compatibilidade com código existente)
 * @param {string} prompt - Prompt para enviar
 * @returns {Promise<string>} Resposta do modelo
 */
async function perguntarIA(prompt) {
    try {
        const resultado = await ollamaService.gerarResposta(prompt);
        return resultado.texto;
    } catch (erro) {
        console.error('[OllamaService] Erro em perguntarIA:', erro.message);
        return null;
    }
}

// =====================================
// EXPORTAÇÕES
// =====================================

module.exports = {
    OllamaService,
    ollamaService,
    perguntarIA,
    CONFIG_MODELO
};