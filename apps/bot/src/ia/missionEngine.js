/**
 * MISSION ENGINE
 *
 * Decide qual missao pode aparecer, quando deve aparecer,
 * se o NPC quer oferece-la, se o jogador atende aos requisitos,
 * e se o NPC prefere esperar mais um pouco.
 *
 * Este modulo NAO utiliza IA diretamente.
 * Ele utiliza logica deterministica baseada em requisitos, estado do jogador,
 * estado do NPC e contexto.
 *
 * A IA apenas interpreta a instrucao.
 * Ela nunca cria a missao.
 */

// Compatibilidade dos auxiliares antigos sem inicializar o banco legado no fluxo NPC.
const MissionManager = new Proxy({}, { get: (_, key) => (...args) => require('../missions/missionManager')[key](...args) });

function verificarNivel(jogador, missao) {
    // nivelMinimo é legado informativo: nunca bloqueia uma missão.
    return true;
}

async function verificarMissaoAnterior(jogadorId, missao) {
    if (!missao.requisitos || !missao.requisitos.missaoAnterior) return true;
    return await MissionManager.jaConcluiu(jogadorId, missao.requisitos.missaoAnterior);
}

async function verificarRepetivel(jogadorId, missao) {
    if (!missao.repetivel) {
        const jaFez = await MissionManager.jaConcluiu(jogadorId, missao.id);
        if (jaFez) return false;
    }
    return true;
}

async function verificarMissaoAtiva(jogadorId, missao) {
    return await MissionManager.missaoAtiva(jogadorId, missao.id);
}

async function verificarTemMissaoAtivaNPC(jogadorId, npcId) {
    const missoesNPC = await MissionManager.listarMissoesNPC(npcId);
    for (const missao of missoesNPC) {
        const ativa = await MissionManager.missaoAtiva(jogadorId, missao.id);
        if (ativa) return true;
    }
    return false;
}

function verificarRelacionamento(relacionamento, missao) {
    if (!missao.requisitos || !missao.requisitos.relacionamento) return true;
    if (!relacionamento) return false;
    const req = missao.requisitos.relacionamento;
    const vinculo = relacionamento.vinculo || 0;
    if (req.vinculoMinimo && vinculo < req.vinculoMinimo) return false;
    return true;
}

function verificarDisponibilidadeNPC(mood, emotion, rotinaAtual) {
    if (rotinaAtual && rotinaAtual.acao && rotinaAtual.acao.toLowerCase().includes("dorm")) return false;
    if (mood) {
        const moodsNegativos = ["deprimido", "desmotivado", "culpado"];
        if (moodsNegativos.includes(mood.mood) && (mood.intensidade || 0) > 70) return false;
    }
    if (emotion) {
        const emocoesNegativas = ["irritado", "nervoso"];
        if (emocoesNegativas.includes(emotion.emocao) && (emotion.intensidade || 0) > 80) return false;
    }
    return true;
}

function verificarPrimeiraConversa(historico) {
    return !historico || historico.length === 0;
}

function construirInstrucaoPrompt(npc, missao) {
    return npc.nome + ' deseja oferecer naturalmente a missao "' + missao.nome + '".\n\n' +
        "Nao entregue automaticamente.\n" +
        "Apresente a situacao durante a conversa de forma natural.\n" +
        "Caso o jogador demonstre interesse, explique mais detalhes.\n" +
        "Nunca saia do personagem.\n" +
        "A missao e: " + missao.descricao + "\n\n" +
        "Lembre-se: voce esta interpretando " + npc.nome + ". A missao deve surgir organicamente da conversa.";
}

async function avaliarMissoes({npc,jogador}) {
    const padrao = { oferecerMissao:false, missaoId:null, missaoNome:null, instrucaoPrompt:null };
    if(!npc || !jogador?.id)return padrao;
    const missao = await require('../systems/questSystem').obterOfertaDeMissaoNPC(jogador.id,npc.id);
    if(!missao)return padrao;
    return {...padrao,oferecerMissao:true,missaoId:missao.id,missaoNome:missao.nome,instrucaoPrompt:construirInstrucaoPrompt(npc,missao)};
}

module.exports = {
    avaliarMissoes, verificarNivel, verificarMissaoAnterior,
    verificarRepetivel, verificarRelacionamento, verificarDisponibilidadeNPC
};
