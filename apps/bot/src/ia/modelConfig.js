/**
 * CONFIGURAÇÃO CENTRALIZADA DO MODELO
 *
 * Este é o ÚNICO arquivo que define qual modelo Ollama será utilizado
 * em todo o sistema. Qualquer alteração de modelo deve ser feita aqui.
 *
 * Todos os serviços (ollamaService, npcService, npcServiceV2, engines,
 * testes e utilitários) devem importar deste arquivo.
 */

// Interruptor central do teste. Mude somente este valor para reativar o Thinking.
const OLLAMA_THINKING = false;

const MODEL_CONFIG = {
    // Variante oficial Qwen3-4B-Thinking-2507 disponibilizada pelo Ollama.
    model: 'qwen3:4b-instruct-2507-q4_K_M',

    // Parâmetros de geração
    temperature: 0.6,
    top_p: 0.85,
    top_k: 30,
    repeat_penalty: 1.15,
    // A cena da Ophilia usa o núcleo factual completo e exemplos oficiais
    // relevantes (~9k tokens estimados), preservando margem para histórico
    // e resposta sem forçar a maior parte do modelo para a CPU.
    num_ctx: 16384,
    // Teto de FALLBACK apenas — usado quando quem chama o Ollama não
    // calcula um num_predict dinâmico. O fluxo principal de conversa
    // (npcServiceV2.js) usa calcularNumPredict() em promptBuilderV2.js,
    // que varia o teto conforme o tamanho da mensagem do jogador
    // (~220 curta / ~500 média / 1100-1500 longa), em vez deste valor fixo.
    num_predict: 1500,
    num_thread: 8,

    // URL base do Ollama
    baseURL: 'http://localhost:11434'
};

module.exports = {
    MODEL_CONFIG,
    OLLAMA_THINKING,
    // Alias para compatibilidade
    CONFIG_MODELO: MODEL_CONFIG
};