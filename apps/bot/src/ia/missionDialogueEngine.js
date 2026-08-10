/**
 * MISSION DIALOGUE ENGINE
 *
 * Responsavel por todas as falas relacionadas a missoes.
 *
 * Quando o jogador aceita, conclui, falha ou recusa uma missao,
 * este modulo utiliza o Ollama para gerar uma fala natural do NPC
 * baseada no estado da missao e na personalidade do personagem.
 *
 * Este modulo NAO cria missoes.
 * Este modulo NAO altera o banco de dados.
 * Ele apenas gera o dialogo apropriado para cada situacao.
 */

const { perguntarIA } = require("./ollama");

// Estados de dialogo suportados
const ESTADOS_DIALOGO = [
    "oferecer",
    "aceitar",
    "recusar",
    "concluir",
    "falhar",
    "progresso",
    "lembrar"
];

/**
 * Construi o prompt para gerar o dialogo de missao
 */
function construirPromptDialogo(npc, jogador, missao, estado, contextoExtra) {
    const nomeJogador = jogador ? (jogador.nome || "Jogador") : "Jogador";

    let situacao = "";
    let instrucao = "";

    switch (estado) {
        case "oferecer":
            situacao = "O NPC esta oferecendo a missao ao jogador.";
            instrucao = "Apresente a missao de forma natural, sem sair do personagem. Nao entregue automaticamente - faca parecer que o NPC realmente precisa compartilhar isso.";
            break;
        case "aceitar":
            situacao = "O jogador aceitou a missao.";
            instrucao = "Reaja a aceitacao do jogador de forma natural, demonstrando emocao coerente com sua personalidade. Pode dar detalhes adicionais sobre a missao.";
            break;
        case "recusar":
            situacao = "O jogador recusou a missao.";
            instrucao = "Reage a recusa de forma natural. Pode demonstrar decepcao, compreensao ou neutralidade, dependendo da personalidade.";
            break;
        case "concluir":
            situacao = "O jogador concluiu a missao com sucesso.";
            instrucao = "Reconheca a conclusao da missao. Demonstre gratidao, alivio ou orgulho, coerente com sua personalidade. Pode mencionar recompensas naturalmente.";
            break;
        case "falhar":
            situacao = "O jogador falhou na missao.";
            instrucao = "Reaja ao fracasso de forma natural. Pode demonstrar tristeza, compreensao ou frustracao, dependendo da personalidade. Nunca seja cruel.";
            break;
        case "progresso":
            situacao = "O jogador reportou progresso na missao.";
            instrucao = "Reconheca o progresso do jogador. Pode dar encorajamento, dicas ou preocupacao, dependendo da situacao.";
            break;
        case "lembrar":
            situacao = "O NPC esta lembrando o jogador sobre a missao ativa.";
            instrucao = "Lembre o jogador sobre a missao de forma natural, como algo que o NPC realmente precisa que seja feito.";
            break;
        default:
            situacao = "Situacao generica de missao.";
            instrucao = "Responda de forma natural como o personagem.";
    }

    return `
Voce esta interpretando ${npc.nome} em um RPG.

Situacao: ${situacao}
Missao: ${missao.nome}
Descricao: ${missao.descricao || "Nao especificada"}

Personalidade: ${npc.personalidade || "Nao especificada"}
Forma de falar: ${npc.formaFalar || "Natural"}

Instrucao: ${instrucao}

REGRAS:
- Responda SEMPRE em portugues do Brasil.
- Nunca saia do personagem.
- Nunca diga que e uma IA.
- Inclua uma breve narracao de suas acoes e expressoes.
- O dialogo deve parecer natural e espontaneo.
- Nao use frases prontas ou genericas.

${contextoExtra ? "Contexto adicional: " + contextoExtra : ""}

Responda como ${npc.nome}:
`;
}

/**
 * Gera um dialogo de missao baseado no estado
 *
 * @param {Object} npc - Dados do NPC
 * @param {Object} jogador - Dados do jogador
 * @param {Object} missao - Dados da missao
 * @param {string} estado - Estado do dialogo (oferecer, aceitar, recusar, concluir, falhar, progresso, lembrar)
 * @param {string} contextoExtra - Contexto adicional (opcional)
 * @returns {Promise<string>} Dialogo gerado
 */
async function gerarDialogo(npc, jogador, missao, estado, contextoExtra) {
    try {
        if (!npc || !missao || !ESTADOS_DIALOGO.includes(estado)) {
            return null;
        }

        const prompt = construirPromptDialogo(npc, jogador, missao, estado, contextoExtra);
        const resposta = await perguntarIA(prompt);

        return resposta || null;
    } catch (error) {
        console.error("[MISSION_DIALOGUE] Erro ao gerar dialogo:", error.message);
        return null;
    }
}

/**
 * Gera dialogo de oferecimento de missao
 */
async function gerarDialogoOferecer(npc, jogador, missao, contextoExtra) {
    return gerarDialogo(npc, jogador, missao, "oferecer", contextoExtra);
}

/**
 * Gera dialogo de aceitacao de missao
 */
async function gerarDialogoAceitar(npc, jogador, missao, contextoExtra) {
    return gerarDialogo(npc, jogador, missao, "aceitar", contextoExtra);
}

/**
 * Gera dialogo de recusa de missao
 */
async function gerarDialogoRecusar(npc, jogador, missao, contextoExtra) {
    return gerarDialogo(npc, jogador, missao, "recusar", contextoExtra);
}

/**
 * Gera dialogo de conclusao de missao
 */
async function gerarDialogoConcluir(npc, jogador, missao, contextoExtra) {
    return gerarDialogo(npc, jogador, missao, "concluir", contextoExtra);
}

/**
 * Gera dialogo de falha de missao
 */
async function gerarDialogoFalhar(npc, jogador, missao, contextoExtra) {
    return gerarDialogo(npc, jogador, missao, "falhar", contextoExtra);
}

/**
 * Gera dialogo de progresso de missao
 */
async function gerarDialogoProgresso(npc, jogador, missao, contextoExtra) {
    return gerarDialogo(npc, jogador, missao, "progresso", contextoExtra);
}

/**
 * Gera dialogo de lembranca de missao ativa
 */
async function gerarDialogoLembrar(npc, jogador, missao, contextoExtra) {
    return gerarDialogo(npc, jogador, missao, "lembrar", contextoExtra);
}

module.exports = {
    gerarDialogo,
    gerarDialogoOferecer,
    gerarDialogoAceitar,
    gerarDialogoRecusar,
    gerarDialogoConcluir,
    gerarDialogoFalhar,
    gerarDialogoProgresso,
    gerarDialogoLembrar,
    ESTADOS_DIALOGO
};