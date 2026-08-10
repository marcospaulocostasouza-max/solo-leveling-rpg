/**
 * MEMORY ENGINE
 *
 * Responsável por analisar conversas utilizando o Ollama e decidir
 * quais acontecimentos devem virar memórias permanentes.
 *
 * Recebe:
 * - NPC
 * - Jogador
 * - Histórico da conversa
 *
 * Envia essas informações ao Qwen solicitando apenas acontecimentos importantes.
 *
 * O modelo responde exclusivamente em JSON no formato:
 * [
 *     {
 *         "tipo": "promessa",
 *         "memoria": "Marcos prometeu ajudar o templo.",
 *         "importancia": 9
 *     }
 * ]
 *
 * Caso não exista nenhuma memória relevante, retorna [].
 *
 * Este módulo NÃO salva nada no banco.
 * Apenas retorna o array de memórias.
 *
 * Preparado para integração futura com o MemoryManager.
 */

const { perguntarIA } = require("./ollama");

// Tipos de memória válidos
const TIPOS_VALIDOS = [
    "promessa",
    "revelacao",
    "missao",
    "favor",
    "decisao",
    "evento",
    "emocional",
    "relacao",
    "geral"
];

/**
 * Constrói o prompt para extração de memórias
 *
 * @param {Object} npc - Dados do NPC
 * @param {Object} jogador - Dados do jogador
 * @param {Array} historico - Histórico da conversa
 * @returns {string} Prompt formatado
 */
function construirPromptMemorias(npc, jogador, historico) {
    // Formatar histórico
    let historicoTexto = "";
    if (historico && historico.length > 0) {
        for (const msg of historico) {
            if (msg.papel === "jogador") {
                historicoTexto += `Jogador: ${msg.conteudo}\n`;
            } else if (msg.papel === "npc") {
                historicoTexto += `${npc.nome}: ${msg.conteudo}\n`;
            }
        }
    } else {
        historicoTexto = "(sem histórico)";
    }

    const nomeJogador = jogador ? (jogador.nome || "Jogador") : "Jogador";

    return `
Você é um analisador de memórias de um RPG.

Analise a conversa entre ${npc.nome} (NPC) e ${nomeJogador} (jogador).

Extraia apenas acontecimentos que façam sentido um personagem lembrar futuramente.

IGNORE:
- Cumprimentos
- Mensagens comuns
- Perguntas simples
- Conversas sem importância
- Cortesias genéricas

EXTRAIA apenas:
- Promessas
- Revelações pessoais
- Missões
- Favores
- Decisões importantes
- Eventos marcantes
- Acontecimentos emocionais
- Fatos que mudam a relação entre NPC e jogador

Responda EXCLUSIVAMENTE em JSON, sem texto adicional.

Formato esperado:
[
    {
        "tipo": "promessa",
        "memoria": "Descrição da memória.",
        "importancia": 9
    }
]

Caso não exista nenhuma memória relevante, responda apenas:
[]

Tipos válidos: ${TIPOS_VALIDOS.join(", ")}

Importância: número de 1 a 10 (10 = extremamente importante).

==============================
NPC: ${npc.nome}
==============================

==============================
JOGADOR: ${nomeJogador}
==============================

==============================
HISTÓRICO DA CONVERSA:
==============================
${historicoTexto}
`;
}

/**
 * Valida e normaliza o JSON retornado pelo modelo
 *
 * @param {string} textoResposta - Resposta bruta do Ollama
 * @returns {Array} Array de memórias válidas
 */
function validarResposta(textoResposta) {
    try {
        // Tentar parsear diretamente
        let dados = JSON.parse(textoResposta);

        // Se não for array, tentar extrair JSON do texto
        if (!Array.isArray(dados)) {
            const match = textoResposta.match(/\[[\s\S]*\]/);
            if (match) {
                dados = JSON.parse(match[0]);
            }
        }

        if (!Array.isArray(dados)) {
            return [];
        }

        // Filtrar e normalizar cada memória
        const memoriasValidas = dados
            .filter(item => item && item.memoria && typeof item.memoria === "string")
            .map(item => {
                // Normalizar tipo
                let tipo = (item.tipo || "geral").toLowerCase().trim();
                if (!TIPOS_VALIDOS.includes(tipo)) {
                    tipo = "geral";
                }

                // Normalizar importância (1 a 10)
                let importancia = parseInt(item.importancia) || 5;
                importancia = Math.max(1, Math.min(10, importancia));

                return {
                    tipo: tipo,
                    memoria: item.memoria.trim(),
                    importancia: importancia
                };
            });

        return memoriasValidas;
    } catch (e) {
        console.error("[MEMORY_ENGINE] Erro ao validar resposta:", e.message);
        return [];
    }
}

/**
 * Analisa uma conversa e extrai memórias importantes
 *
 * @param {Object} npc - Dados do NPC
 * @param {Object} jogador - Dados do jogador
 * @param {Array} historico - Histórico da conversa
 * @returns {Promise<Array>} Array de memórias extraídas
 */
async function analisarConversa(npc, jogador, historico) {
    try {
        // Construir prompt para extração de memórias
        const prompt = construirPromptMemorias(npc, jogador, historico);

        // Enviar para o Ollama
        const resposta = await perguntarIA(prompt);

        if (!resposta) {
            return [];
        }

        // Validar e normalizar a resposta
        return validarResposta(resposta);
    } catch (error) {
        console.error("[MEMORY_ENGINE] Erro ao analisar conversa:", error.message);
        return [];
    }
}

module.exports = {
    analisarConversa,
    validarResposta,
    construirPromptMemorias
};