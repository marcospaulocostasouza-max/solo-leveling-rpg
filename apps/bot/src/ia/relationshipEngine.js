/**
 * RELATIONSHIP ENGINE
 *
 * Responsável por analisar uma cena/interação (via Ollama) e decidir
 * como o VÍNCULO e a HOSTILIDADE entre o NPC e o jogador mudaram.
 *
 * Este módulo NÃO salva nada no banco — ele só analisa e devolve um
 * objeto com o resultado. Quem persiste é o relationshipManager.js,
 * através de aplicarResultadoDeCena().
 *
 * Substitui o antigo modelo de 7 campos (confianca, respeito,
 * amizade, admiracao, carinho, desconfianca, medo) por apenas dois
 * valores, que passam a ser a base única de comparação para todo o
 * resto do sistema (missões, combate, ataques secretos, romances):
 *
 *   - vinculo: sentimentos positivos (cenas boas, ajuda mútua,
 *     aproximação genuína, gestos de confiança).
 *   - hostilidade: sentimentos negativos (ofensas, invasões de
 *     espaço sem vínculo suficiente, ataques desnecessários, deboche).
 *
 * Resposta esperada do modelo (JSON):
 * {
 *   "interacaoSignificativa": true,
 *   "deltaVinculo": 4,
 *   "deltaHostilidade": 0,
 *   "motivo": "O jogador ajudou o NPC sem esperar recompensa."
 * }
 *
 * Quando a cena não teve interação real (ex: "pediu um copo d'água e
 * foi embora"), o modelo deve responder com interacaoSignificativa:
 * false e os dois deltas em 0 — isso faz o comando !fim de interação
 * avisar o jogador em vez de aplicar qualquer mudança.
 */

const { perguntarIA } = require("./ollama");

// Limite de variação por cena avaliada (pontos percentuais).
// Uma interação comum deve variar pouco; eventos muito fortes
// (traição grave, salvar a vida do NPC, declaração de amor
// correspondida, etc) podem chegar ao limite máximo.
const LIMITE_MIN = -12;
const LIMITE_MAX = 12;

/**
 * Formata o histórico de mensagens para o prompt.
 */
function formatarHistorico(npc, historico) {
    if (!historico || historico.length === 0) return "(sem histórico)";
    let texto = "";
    for (const msg of historico) {
        if (msg.papel === "jogador") {
            texto += `Jogador: ${msg.conteudo}\n`;
        } else if (msg.papel === "npc") {
            texto += `${npc.nome}: ${msg.conteudo}\n`;
        }
    }
    return texto || "(sem histórico)";
}

function formatarMemorias(memorias) {
    if (!memorias || memorias.length === 0) return "(sem memórias)";
    return memorias
        .map((m) => `- [${m.tipo || "geral"}] (importância ${m.importancia || 5}): ${m.memoria}`)
        .join("\n");
}

function formatarRelacionamentoAtual(relacionamentoAtual) {
    if (!relacionamentoAtual) return "(sem relacionamento prévio — jogador é um estranho para o NPC)";
    const vinculo = relacionamentoAtual.vinculo || 0;
    const hostilidade = relacionamentoAtual.hostilidade || 0;
    return `Vínculo atual: ${vinculo}%\nHostilidade atual: ${hostilidade}%`;
}

/**
 * Constrói o prompt de análise da cena.
 */
function construirPromptRelacionamento(npc, jogador, historico, memorias, relacionamentoAtual) {
    const nomeJogador = jogador ? jogador.nome || "Jogador" : "Jogador";

    return `
Você é o analisador de relacionamento de um RPG de texto (estilo Solo Leveling).

Sua função é ler a cena/interação entre o NPC ${npc.nome} e o jogador ${nomeJogador} e decidir
como isso afetou dois valores, cada um de 0% a 100%:

- VÍNCULO: quão positivos são os sentimentos do NPC pelo jogador (confiança, amizade, admiração,
  carinho, atração). Sobe com cenas boas, ajuda mútua, gestos genuínos de aproximação.
- HOSTILIDADE: quão negativos são os sentimentos do NPC pelo jogador (raiva, desconfiança, ódio,
  desprezo). Sobe com ofensas, deboche, invasão de espaço/intimidade sem vínculo suficiente para
  isso, ataques ou ameaças sem necessidade real.

REGRAS IMPORTANTES:
1. Avalie a cena inteira, não apenas a última mensagem.
2. Mudanças normais ficam entre -3 e +3. Eventos fortes e raros podem chegar a ±${LIMITE_MAX}.
3. Se o jogador tentou uma aproximação forte demais (romântica, física, íntima) sem vínculo
   suficiente para isso, isso deve gerar hostilidade, não vínculo.
4. Considere a personalidade do NPC: o mesmo gesto pode agradar um NPC e irritar outro.
5. Se a interação foi VAZIA ou SUPERFICIAL demais para gerar qualquer sentimento real — por
   exemplo, o jogador só pediu uma informação simples e foi embora, sem construir uma cena —
   marque "interacaoSignificativa": false e ambos os deltas como 0. Isso é o resultado esperado
   com mais frequência do que se imagina: nem toda interação merece mudar o relacionamento.
6. Responda APENAS com o JSON abaixo, sem nenhum texto antes ou depois.

Formato de resposta:
{
  "interacaoSignificativa": true,
  "deltaVinculo": 0,
  "deltaHostilidade": 0,
  "motivo": "Breve explicação da decisão, em uma frase."
}

==============================
NPC: ${npc.nome}
==============================
Personalidade: ${npc.personalidade || "Não especificada"}
Forma de falar: ${npc.formaFalar || "Não especificada"}

==============================
JOGADOR: ${nomeJogador}
==============================

==============================
RELACIONAMENTO ATUAL:
==============================
${formatarRelacionamentoAtual(relacionamentoAtual)}

==============================
MEMÓRIAS IMPORTANTES:
==============================
${formatarMemorias(memorias)}

==============================
CENA / HISTÓRICO DA INTERAÇÃO:
==============================
${formatarHistorico(npc, historico)}
`;
}

/**
 * Valida e normaliza o JSON retornado pelo modelo.
 */
function validarResposta(textoResposta) {
    try {
        let dados = JSON.parse(textoResposta);

        if (typeof dados !== "object" || Array.isArray(dados)) {
            const match = textoResposta.match(/\{[\s\S]*\}/);
            if (match) {
                dados = JSON.parse(match[0]);
            }
        }

        if (typeof dados !== "object" || Array.isArray(dados)) {
            return null;
        }

        let deltaVinculo = parseInt(dados.deltaVinculo);
        if (isNaN(deltaVinculo)) deltaVinculo = 0;
        deltaVinculo = Math.max(LIMITE_MIN, Math.min(LIMITE_MAX, deltaVinculo));

        let deltaHostilidade = parseInt(dados.deltaHostilidade);
        if (isNaN(deltaHostilidade)) deltaHostilidade = 0;
        deltaHostilidade = Math.max(LIMITE_MIN, Math.min(LIMITE_MAX, deltaHostilidade));

        let interacaoSignificativa = dados.interacaoSignificativa;
        if (typeof interacaoSignificativa !== "boolean") {
            // Se o modelo esqueceu o campo, inferimos pela presença de deltas.
            interacaoSignificativa = deltaVinculo !== 0 || deltaHostilidade !== 0;
        }

        // Coerência: se marcou como não significativa, os deltas são zerados.
        if (!interacaoSignificativa) {
            deltaVinculo = 0;
            deltaHostilidade = 0;
        }

        return {
            interacaoSignificativa,
            deltaVinculo,
            deltaHostilidade,
            motivo: dados.motivo || (interacaoSignificativa ? "Alteração no relacionamento." : "Nenhuma interação significativa o suficiente.")
        };
    } catch (e) {
        console.error("[RELATIONSHIP_ENGINE] Erro ao validar resposta:", e.message);
        return null;
    }
}

/**
 * Analisa uma cena e determina as alterações de vínculo/hostilidade.
 *
 * @returns {Promise<{interacaoSignificativa, deltaVinculo, deltaHostilidade, motivo}|null>}
 */
async function analisarConversa(npc, jogador, historico, memorias, relacionamentoAtual) {
    try {
        const prompt = construirPromptRelacionamento(npc, jogador, historico, memorias, relacionamentoAtual);
        const resposta = await perguntarIA(prompt);
        if (!resposta) return null;
        return validarResposta(resposta);
    } catch (error) {
        console.error("[RELATIONSHIP_ENGINE] Erro ao analisar conversa:", error.message);
        return null;
    }
}

module.exports = {
    analisarConversa,
    validarResposta,
    construirPromptRelacionamento,
    LIMITE_MIN,
    LIMITE_MAX
};
