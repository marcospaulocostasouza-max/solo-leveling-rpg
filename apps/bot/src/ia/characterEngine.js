/**
 * CHARACTER ENGINE
 *
 * Responsável por definir o estado atual do NPC antes da geração da resposta.
 *
 * Recebe todas as informações disponíveis sobre o NPC e o jogador
 * e gera um objeto chamado estadoPersonagem.
 *
 * Este módulo NÃO conversa com o Ollama.
 * Este módulo NÃO monta prompts.
 * Este módulo NÃO altera banco de dados.
 * Ele apenas interpreta os dados disponíveis e define como o NPC deve agir.
 *
 * Arquitetura modular para facilitar adição de novos estados no futuro.
 */

// =====================================
// FUNÇÕES AUXILIARES DE INTERPRETAÇÃO
// =====================================

/**
 * Determina o humor do NPC baseado no estado emocional e personalidade
 */
function determinarHumor(npc, estadoEmocional, relacionamento) {
    // Se há estado emocional, usar como base
    if (estadoEmocional && estadoEmocional.emocao) {
        return estadoEmocional.emocao;
    }

    // Se não há estado emocional, inferir da personalidade
    const personalidade = (npc.personalidade || "").toLowerCase();

    if (personalidade.includes("gentil") || personalidade.includes("calmo")) return "calmo";
    if (personalidade.includes("bruto") || personalidade.includes("irritado")) return "irritado";
    if (personalidade.includes("alegre") || personalidade.includes("animado")) return "animado";
    if (personalidade.includes("triste") || personalidade.includes("melancolico")) return "triste";
    if (personalidade.includes("serio") || personalidade.includes("frio")) return "pensativo";

    return "neutro";
}

/**
 * Determina a energia do NPC baseado no nível e humor
 */
function determinarEnergia(npc, estadoEmocional) {
    // Base: nível do NPC
    let energia = 50;

    // Ajustar por nível
    if (npc.nivel) {
        energia = Math.min(100, Math.max(10, Math.floor(npc.nivel / 2)));
    }

    // Ajustar por humor
    if (estadoEmocional && estadoEmocional.emocao) {
        const emocoesCansadas = ["cansado", "triste", "deprimido", "melancolico"];
        const emocoesEnergicas = ["animado", "feliz", "esperancoso", "determinado"];

        if (emocoesCansadas.includes(estadoEmocional.emocao)) {
            energia = Math.max(10, energia - 20);
        } else if (emocoesEnergicas.includes(estadoEmocional.emocao)) {
            energia = Math.min(100, energia + 15);
        }
    }

    return energia;
}

/**
 * Determina a disponibilidade do NPC
 */
function determinarDisponibilidade(npc, missaoAtual, energia) {
    // Se está em missão, menos disponível
    if (missaoAtual) {
        return "ocupado";
    }

    // Se energia baixa, menos disponível
    if (energia < 30) {
        return "limitado";
    }

    return "disponivel";
}

/**
 * Determina o objetivo atual do NPC
 */
function determinarObjetivoAtual(npc, missaoAtual) {
    // Se tem missão, esse é o objetivo
    if (missaoAtual) {
        return missaoAtual;
    }

    // Se tem objetivos definidos no JSON
    if (npc.objetivos) {
        return npc.objetivos;
    }

    // Se tem profissão, inferir objetivo
    if (npc.profissao) {
        return `Exercer sua função como ${npc.profissao}`;
    }

    return "Viver seu dia normalmente";
}

/**
 * Determina a atitude do NPC com o jogador baseado no relacionamento
 */
function determinarAtitudeComJogador(npc, relacionamento) {
    if (!relacionamento) {
        return "neutra";
    }

    const confianca = relacionamento.confianca || 0;
    const amizade = relacionamento.amizade || 0;
    const desconfianca = relacionamento.desconfianca || 0;
    const medo = relacionamento.medo || 0;
    const carinho = relacionamento.carinho || 0;

    // Calcular score geral
    const score = confianca + amizade + carinho - desconfianca - medo;

    if (score >= 20) return "muito amigavel";
    if (score >= 10) return "amigavel";
    if (score >= 5) return "cordial";
    if (score >= 0) return "neutra";
    if (score >= -5) return "reservada";
    if (score >= -10) return "fria";
    return "hostil";
}

/**
 * Determina o tom de voz baseado no humor e atitude
 */
function determinarTomDeVoz(humor, atitude) {
    const tons = {
        "feliz": "alegre",
        "calmo": "suave",
        "esperancoso": "otimista",
        "preocupado": "apreensivo",
        "triste": "baixo",
        "irritado": "seco",
        "nervoso": "tenso",
        "cansado": "cansado",
        "animado": "entusiasmado",
        "surpreso": "surpreso",
        "pensativo": "reflexivo",
        "neutro": "normal"
    };

    let tom = tons[humor] || "normal";

    // Ajustar por atitude
    if (atitude === "hostil") tom = "hostil";
    if (atitude === "fria") tom = "distante";
    if (atitude === "muito amigavel") tom = "caloroso";

    return tom;
}

/**
 * Determina a iniciativa do NPC
 */
function determinarIniciativa(npc, humor, atitude) {
    // Personalidades mais ativas
    const personalidade = (npc.personalidade || "").toLowerCase();
    const ativa = personalidade.includes("extrovertido") ||
                  personalidade.includes("falante") ||
                  personalidade.includes("curioso") ||
                  personalidade.includes("bruto");

    // Humores que aumentam iniciativa
    const humorAtivo = ["feliz", "animado", "esperancoso", "irritado"];

    // Atitude que aumenta iniciativa
    const atitudeAtiva = ["amigavel", "muito amigavel", "hostil"];

    let iniciativa = 3; // padrão médio

    if (ativa) iniciativa += 2;
    if (humorAtivo.includes(humor)) iniciativa += 1;
    if (atitudeAtiva.includes(atitude)) iniciativa += 1;
    if (atitude === "reservada" || atitude === "fria") iniciativa -= 1;

    return Math.max(1, Math.min(5, iniciativa));
}

/**
 * Determina o nível de detalhamento da resposta
 */
function determinarNivelDetalhamento(npc, humor, energia) {
    // Base: 3 (médio)
    let nivel = 3;

    // Personalidades mais detalhistas
    const personalidade = (npc.personalidade || "").toLowerCase();
    if (personalidade.includes("sabio") || personalidade.includes("professor") ||
        personalidade.includes("reflexivo") || personalidade.includes("paciente")) {
        nivel += 1;
    }

    // Humores que aumentam detalhamento
    if (humor === "pensativo" || humor === "triste" || humor === "preocupado") {
        nivel += 1;
    }

    // Energia baixa reduz detalhamento
    if (energia < 30) {
        nivel -= 1;
    }

    return Math.max(1, Math.min(5, nivel));
}

/**
 * Gera observações sobre o estado do NPC
 */
function gerarObservacoes(npc, humor, energia, atitude, relacionamento) {
    const observacoes = [];

    // Observação sobre humor
    observacoes.push(`Humor atual: ${humor}`);

    // Observação sobre energia
    if (energia < 30) {
        observacoes.push("Parece cansado");
    } else if (energia > 80) {
        observacoes.push("Parece cheio de energia");
    }

    // Observação sobre atitude
    observacoes.push(`Atitude com o jogador: ${atitude}`);

    // Observação sobre relacionamento
    if (relacionamento) {
        const confianca = relacionamento.confianca || 0;
        if (confianca > 10) observacoes.push("Confia consideravelmente no jogador");
        if (confianca < -5) observacoes.push("Desconfia do jogador");
    }

    return observacoes;
}

// =====================================
// FUNÇÃO PRINCIPAL
// =====================================

/**
 * Gera o estado do personagem NPC
 *
 * @param {Object} dados - Dados de entrada
 * @returns {Object} estadoPersonagem
 */
function gerarEstadoPersonagem(dados) {
    const {
        npc,
        jogador,
        memorias,
        relacionamento,
        historico,
        estadoEmocional,
        missaoAtual,
        localizacao,
        horario,
        clima,
        eventosMundo
    } = dados;

    // Se não há NPC, retornar estado neutro
    if (!npc) {
        return {
            humor: "neutro",
            energia: 50,
            disponibilidade: "disponivel",
            objetivoAtual: null,
            atitudeComJogador: "neutra",
            tomDeVoz: "normal",
            iniciativa: 3,
            nivelDetalhamento: 3,
            observacoes: []
        };
    }

    // =====================================
    // CALCULAR ESTADOS
    // =====================================

    // Humor
    const humor = determinarHumor(npc, estadoEmocional, relacionamento);

    // Energia
    const energia = determinarEnergia(npc, estadoEmocional);

    // Disponibilidade
    const disponibilidade = determinarDisponibilidade(npc, missaoAtual, energia);

    // Objetivo atual
    const objetivoAtual = determinarObjetivoAtual(npc, missaoAtual);

    // Atitude com jogador
    const atitudeComJogador = determinarAtitudeComJogador(npc, relacionamento);

    // Tom de voz
    const tomDeVoz = determinarTomDeVoz(humor, atitudeComJogador);

    // Iniciativa
    const iniciativa = determinarIniciativa(npc, humor, atitudeComJogador);

    // Nível de detalhamento
    const nivelDetalhamento = determinarNivelDetalhamento(npc, humor, energia);

    // Observações
    const observacoes = gerarObservacoes(npc, humor, energia, atitudeComJogador, relacionamento);

    // Adicionar observações de contexto
    if (localizacao) observacoes.push(`Local: ${localizacao}`);
    if (horario) observacoes.push(`Horário: ${horario}`);
    if (clima) observacoes.push(`Clima: ${clima}`);
    if (eventosMundo && eventosMundo.length > 0) {
        observacoes.push(`Eventos do mundo: ${eventosMundo.join(", ")}`);
    }

    // =====================================
    // MONTAR ESTADO DO PERSONAGEM
    // =====================================
    return {
        humor,
        energia,
        disponibilidade,
        objetivoAtual,
        atitudeComJogador,
        tomDeVoz,
        iniciativa,
        nivelDetalhamento,
        observacoes
    };
}

module.exports = {
    gerarEstadoPersonagem
};