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

const MissionManager = require("../missions/missionManager");

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

async function avaliarMissoes(dados) {
    const { npc, jogador, relacionamento, mood, emotion, memorias, historico, horario, local, rotinaAtual } = dados;
    const npcId = npc ? npc.id : null;
    const jogadorId = jogador ? (jogador.numero || jogador.id) : null;

    const resultadoPadrao = {
        oferecerMissao: false, missaoId: null, missaoNome: null,
        motivo: "Nenhuma missao disponivel no momento.", instrucaoPrompt: null
    };

    if (!npcId || !jogadorId) return resultadoPadrao;

    if (verificarPrimeiraConversa(historico)) {
        return { ...resultadoPadrao, motivo: "Primeira conversa - deixe o jogador conhecer o NPC primeiro." };
    }

    if (!verificarDisponibilidadeNPC(mood, emotion, rotinaAtual)) {
        return { ...resultadoPadrao, motivo: "NPC nao esta disponivel para oferecer missoes no momento." };
    }

    const temMissaoAtiva = await verificarTemMissaoAtivaNPC(jogadorId, npcId);
    if (temMissaoAtiva) {
        return { ...resultadoPadrao, motivo: "Jogador ja possui uma missao ativa com este NPC." };
    }

    const missoesNPC = await MissionManager.listarMissoesNPC(npcId);
    if (missoesNPC.length === 0) return resultadoPadrao;

    for (const missao of missoesNPC) {
        if (!missao.ativo) continue;
        const jaAtiva = await verificarMissaoAtiva(jogadorId, missao);
        if (jaAtiva) continue;
        const podeRepetir = await verificarRepetivel(jogadorId, missao);
        if (!podeRepetir) continue;
        if (!verificarNivel(jogador, missao)) continue;
        const anteriorOk = await verificarMissaoAnterior(jogadorId, missao);
        if (!anteriorOk) continue;
        if (!verificarRelacionamento(relacionamento, missao)) continue;

        return {
            oferecerMissao: true, missaoId: missao.id, missaoNome: missao.nome,
            missaoDescricao: missao.descricao, missaoRank: missao.rank, missaoCategoria: missao.categoria,
            motivo: "O jogador atende a todos os requisitos.",
            instrucaoPrompt: construirInstrucaoPrompt(npc, missao)
        };
    }

    return resultadoPadrao;
}

module.exports = {
    avaliarMissoes, verificarNivel, verificarMissaoAnterior,
    verificarRepetivel, verificarRelacionamento, verificarDisponibilidadeNPC
};
