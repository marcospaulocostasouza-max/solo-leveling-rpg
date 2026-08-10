/**
 * MOOD ENGINE
 *
 * Responsável por analisar o histórico recente de acontecimentos envolvendo
 * um NPC e decidir se o humor permanente (Mood) desse NPC deve evoluir.
 *
 * O Mood representa o estado psicológico de longo prazo do personagem.
 * Diferente da Emotion (momentânea), o Mood muda apenas após
 * acontecimentos marcantes.
 *
 * Este módulo utiliza o Ollama para interpretar o contexto.
 * Ele NÃO salva nada diretamente no banco.
 * Ele apenas retorna o novo Mood.
 *
 * Moods suportados:
 * sereno, otimista, esperancoso, determinado, orgulhoso,
 * melancolico, culpado, desmotivado, solitario, deprimido
 *
 * Resposta esperada (JSON):
 * {
 *     "mudou": true,
 *     "mood": "melancolico",
 *     "intensidade": 72,
 *     "motivo": "Após semanas lidando com perdas..."
 * }
 *
 * Caso não exista mudança:
 * {
 *     "mudou": false,
 *     "mood": "sereno",
 *     "intensidade": 83,
 *     "motivo": "Os acontecimentos recentes não justificam alteração."
 * }
 *
 * Caso o JSON seja inválido, retorna o Mood anterior.
 */

const { perguntarIA } = require("./ollama");

// Moods suportados
const MOODS_SUPORTADOS = [
    "sereno", "otimista", "esperancoso", "determinado", "orgulhoso",
    "melancolico", "culpado", "desmotivado", "solitario", "deprimido"
];

const INTENSIDADE_MIN = 0;
const INTENSIDADE_MAX = 100;

/**
 * Constrói o prompt para análise de mudança de Mood
 */
function construirPromptMood(npc, jogador, moodAtual, emocaoAtual, memorias, relacionamento, historico, missaoAtual) {
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
        relTexto += `Confiança: ${relacionamento.confianca || 0}\n`;
        relTexto += `Respeito: ${relacionamento.respeito || 0}\n`;
        relTexto += `Amizade: ${relacionamento.amizade || 0}\n`;
    } else {
        relTexto = "(sem relacionamento prévio)";
    }

    let moodTexto = "(sem mood anterior)";
    if (moodAtual) {
        moodTexto = `Mood atual: ${moodAtual.mood || "sereno"}\nIntensidade: ${moodAtual.intensidade || 50}`;
    }

    let emocaoTexto = "(sem emoção atual)";
    if (emocaoAtual) {
        emocaoTexto = `Emoção atual: ${emocaoAtual.emocao || "calmo"} (intensidade ${emocaoAtual.intensidade || 50})`;
    }

    const nomeJogador = jogador ? (jogador.nome || "Jogador") : "Jogador";

    return `
Você é um analisador de humor permanente (Mood) de um RPG.

IMPORTANTE - Diferença entre Emotion e Mood:
- Emotion = estado emocional MOMENTÂNEO. Muda a cada conversa.
- Mood = estado psicológico PERMANENTE. Muda apenas após acontecimentos marcantes.

Analise se o humor permanente de ${npc.nome} (NPC) deve mudar após os acontecimentos recentes.

Considere:
- Personalidade do NPC: ${npc.personalidade || "Não especificada"}
- História do NPC: ${npc.historia || "Não especificada"}
- Memórias importantes
- Relacionamento com o jogador
- Acontecimentos recentes
- Humor atual (Mood)
- Emoção atual (Emotion)

REGRAS:
- Mudanças de Mood devem ser EXTREMAMENTE RARAS.
- Conversas comuns NÃO alteram o Mood.
- O Mood muda apenas após acontecimentos marcantes como:
  * Perder alguém importante
  * Cumprir um grande objetivo
  * Sofrer uma grande derrota
  * Mudar completamente sua visão sobre o jogador
  * Viver diversos acontecimentos semelhantes durante muito tempo

Moods suportados: ${MOODS_SUPORTADOS.join(", ")}

Intensidade: 0 a 100.

Responda EXCLUSIVAMENTE em JSON, sem texto adicional.

Formato esperado (se mudou):
{
    "mudou": true,
    "mood": "melancolico",
    "intensidade": 72,
    "motivo": "Após semanas lidando com perdas e fracassos, tornou-se mais introspectiva."
}

Caso não exista mudança:
{
    "mudou": false,
    "mood": "sereno",
    "intensidade": 83,
    "motivo": "Os acontecimentos recentes não justificam alteração do humor permanente."
}

==============================
NPC: ${npc.nome}
==============================
Personalidade: ${npc.personalidade || "Não especificada"}
História: ${npc.historia || "Não especificada"}

==============================
JOGADOR: ${nomeJogador}
==============================

==============================
MOOD ATUAL (PERMANENTE):
==============================
${moodTexto}

==============================
EMOÇÃO ATUAL (MOMENTÂNEA):
==============================
${emocaoTexto}

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
MISSÃO ATUAL:
==============================
${missaoAtual || "(nenhuma)"}
`;
}

/**
 * Valida e normaliza o JSON retornado pelo modelo
 */
function validarResposta(textoResposta, moodAnterior) {
    const moodPadrao = moodAnterior || {
        mudou: false,
        mood: "sereno",
        intensidade: 50,
        motivo: "Mood padrão."
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
            return moodPadrao;
        }

        // Validar campo "mudou" (obrigatório)
        const mudou = Boolean(dados.mudou);

        // Validar mood
        let mood = (dados.mood || "").toLowerCase().trim();
        if (!MOODS_SUPORTADOS.includes(mood)) {
            mood = moodPadrao.mood || "sereno";
        }

        // Validar intensidade (0 a 100)
        let intensidade = parseInt(dados.intensidade);
        if (isNaN(intensidade)) {
            intensidade = moodPadrao.intensidade || 50;
        }
        intensidade = Math.max(INTENSIDADE_MIN, Math.min(INTENSIDADE_MAX, intensidade));

        // Motivo obrigatório
        const motivo = dados.motivo || "Análise de mood.";

        return { mudou, mood, intensidade, motivo };
    } catch (e) {
        console.error("[MOOD_ENGINE] Erro ao validar resposta:", e.message);
        return moodPadrao;
    }
}

/**
 * Analisa o contexto e decide se o Mood do NPC deve mudar
 */
async function analisarMood(npc, jogador, moodAtual, emocaoAtual, memorias, relacionamento, historico, missaoAtual) {
    try {
        const prompt = construirPromptMood(npc, jogador, moodAtual, emocaoAtual, memorias, relacionamento, historico, missaoAtual);
        const resposta = await perguntarIA(prompt);

        if (!resposta) {
            return moodAtual || { mudou: false, mood: "sereno", intensidade: 50, motivo: "Sem resposta do modelo." };
        }

        return validarResposta(resposta, moodAtual);
    } catch (error) {
        console.error("[MOOD_ENGINE] Erro ao analisar mood:", error.message);
        return moodAtual || { mudou: false, mood: "sereno", intensidade: 50, motivo: "Erro durante a análise." };
    }
}

module.exports = {
    analisarMood,
    validarResposta,
    construirPromptMood,
    MOODS_SUPORTADOS
};