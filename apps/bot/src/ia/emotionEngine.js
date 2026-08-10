/**
 * EMOTION ENGINE
 *
 * Responsável por analisar cada conversa entre um NPC e um jogador
 * e determinar como o estado emocional do NPC evolui.
 *
 * Este módulo utiliza o Ollama para interpretar a conversa.
 * Ele NÃO altera diretamente o banco de dados.
 * Ele apenas retorna um objeto com o novo estado emocional.
 *
 * Emoções suportadas:
 * feliz, calmo, esperancoso, preocupado, triste, irritado,
 * nervoso, cansado, animado, surpreso, pensativo
 *
 * Cada emoção possui intensidade (0 a 100).
 *
 * Regras:
 * - As emoções NÃO mudam completamente após uma única conversa.
 * - Mudanças devem ser graduais.
 * - Triste → Feliz não acontece imediatamente.
 *
 * Caso o JSON seja inválido, retorna o estado emocional anterior.
 */

const { perguntarIA } = require("./ollama");

// Emoções suportadas
const EMOCOES_SUPORTADAS = [
    "feliz", "calmo", "esperancoso", "preocupado", "triste",
    "irritado", "nervoso", "cansado", "animado", "surpreso", "pensativo"
];

const INTENSIDADE_MIN = 0;
const INTENSIDADE_MAX = 100;

/**
 * Constrói o prompt para análise de emoção
 */
function construirPromptEmocao(npc, jogador, historico, memorias, relacionamento, estadoEmocionalAtual, mensagemJogador) {
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

    let memoriasTexto = "";
    if (memorias && memorias.length > 0) {
        for (const m of memorias) {
            memoriasTexto += `- [${m.tipo || "geral"}] (importância ${m.importancia || 5}): ${m.memoria}\n`;
        }
    } else {
        memoriasTexto = "(sem memórias)";
    }

    let relTexto = "";
    if (relacionamento) {
        relTexto += `Vínculo: ${relacionamento.vinculo || 0}%\n`;
        relTexto += `Hostilidade: ${relacionamento.hostilidade || 0}%\n`;
    } else {
        relTexto = "(sem relacionamento prévio)";
    }

    let emocaoAtualTexto = "(sem estado emocional anterior)";
    if (estadoEmocionalAtual) {
        emocaoAtualTexto = `Emoção atual: ${estadoEmocionalAtual.emocao || "neutro"}\nIntensidade: ${estadoEmocionalAtual.intensidade || 50}`;
    }

    const nomeJogador = jogador ? (jogador.nome || "Jogador") : "Jogador";

    return `
Você é um analisador de emoções de um RPG.

Analise a conversa entre ${npc.nome} (NPC) e ${nomeJogador} (jogador) e determine como o estado emocional do NPC evoluiu.

Considere:
- Personalidade do NPC: ${npc.personalidade || "Não especificada"}
- Histórico da conversa
- Memórias importantes
- Relacionamento com o jogador
- Acontecimentos da conversa
- Estado emocional anterior

REGRAS:
- As emoções NÃO mudam completamente após uma única conversa.
- Mudanças devem ser graduais.
- Triste → Feliz não acontece imediatamente. Deve passar por estados intermediários.
- A intensidade varia de 0 a 100.
- Mudanças de intensidade devem ser pequenas (normalmente 5 a 15 pontos).

Emoções suportadas: ${EMOCOES_SUPORTADAS.join(", ")}

Responda EXCLUSIVAMENTE em JSON, sem texto adicional.

Formato esperado:
{
    "emocao": "feliz",
    "intensidade": 65,
    "motivo": "Breve explicação da mudança emocional."
}

==============================
NPC: ${npc.nome}
==============================
Personalidade: ${npc.personalidade || "Não especificada"}

==============================
JOGADOR: ${nomeJogador}
==============================

==============================
ESTADO EMOCIONAL ATUAL:
==============================
${emocaoAtualTexto}

==============================
RELACIONAMENTO ATUAL:
==============================
${relTexto}

==============================
MEMÓRIAS IMPORTANTES:
==============================
${memoriasTexto}

==============================
HISTÓRICO DA CONVERSA:
==============================
${historicoTexto}

==============================
MENSAGEM ATUAL DO JOGADOR:
==============================
${mensagemJogador}
`;
}

/**
 * Valida e normaliza o JSON retornado pelo modelo
 */
function validarResposta(textoResposta, estadoEmocionalAtual) {
    const estadoPadrao = estadoEmocionalAtual || {
        emocao: "calmo",
        intensidade: 50,
        motivo: "Estado emocional padrão."
    };

    try {
        let dados = JSON.parse(textoResposta);

        if (typeof dados !== "object" || Array.isArray(dados)) {
            const match = textoResposta.match(/\{[\s\S]*\}/);
            if (match) {
                dados = JSON.parse(match[0]);
            }
        }

        if (typeof dados !== "object" || Array.isArray(dados)) {
            return estadoPadrao;
        }

        let emocao = (dados.emocao || "").toLowerCase().trim();
        if (!EMOCOES_SUPORTADAS.includes(emocao)) {
            emocao = estadoPadrao.emocao || "calmo";
        }

        let intensidade = parseInt(dados.intensidade);
        if (isNaN(intensidade)) {
            intensidade = estadoPadrao.intensidade || 50;
        }
        intensidade = Math.max(INTENSIDADE_MIN, Math.min(INTENSIDADE_MAX, intensidade));

        const motivo = dados.motivo || "Mudança emocional durante a conversa.";

        return { emocao, intensidade, motivo };
    } catch (e) {
        console.error("[EMOTION_ENGINE] Erro ao validar resposta:", e.message);
        return estadoPadrao;
    }
}

/**
 * Analisa uma conversa e determina o novo estado emocional do NPC
 */
async function analisarConversa(npc, jogador, historico, memorias, relacionamento, estadoEmocionalAtual, mensagemJogador) {
    try {
        const prompt = construirPromptEmocao(npc, jogador, historico, memorias, relacionamento, estadoEmocionalAtual, mensagemJogador);
        const resposta = await perguntarIA(prompt);

        if (!resposta) {
            return estadoEmocionalAtual || { emocao: "calmo", intensidade: 50, motivo: "Sem resposta do modelo." };
        }

        return validarResposta(resposta, estadoEmocionalAtual);
    } catch (error) {
        console.error("[EMOTION_ENGINE] Erro ao analisar conversa:", error.message);
        return estadoEmocionalAtual || { emocao: "calmo", intensidade: 50, motivo: "Erro durante a análise." };
    }
}

module.exports = {
    analisarConversa,
    validarResposta,
    construirPromptEmocao,
    EMOCOES_SUPORTADAS
};
