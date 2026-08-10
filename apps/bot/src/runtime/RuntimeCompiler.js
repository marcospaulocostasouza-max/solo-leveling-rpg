/**
 * RUNTIME COMPILER
 * 
 * Responsável por transformar o JSON original de um NPC em um
 * Runtime Object otimizado para execução.
 * 
 * O Runtime Object contém:
 * - Campos permanentes do NPC (id, nome, personalidade, etc.)
 * - promptBase: texto pré-compilado com APENAS informações permanentes
 *   (personalidade, forma de falar, aparência, objetivos, etc.)
 * 
 * NÃO incluir no promptBase:
 * - histórico
 * - memórias
 * - humor atual
 * - relacionamento
 * - emoção
 * - jogador
 * - cena atual
 * 
 * Essas informações continuam sendo dinâmicas.
 */

const fs = require('fs');
const path = require('path');

// =====================================
// PERFIS DE FALA (speechProfile.json)
// =====================================
// O promptBase precisa incluir os exemplos de fala few-shot do perfil,
// não só o texto solto de npc.formaFalar — few-shot é o que mais calibra
// tom num modelo pequeno (ver handoff). Sem isto, o trabalho investido em
// speechProfile.json fica sem efeito no modo runtime (usado por quase
// todos os NPCs, exceto a Ophilia, que tem dossiê próprio).
let speechProfiles = {};
try {
    const speechProfilePath = path.join(__dirname, '..', 'ia', 'speechProfile.json');
    speechProfiles = JSON.parse(fs.readFileSync(speechProfilePath, 'utf-8'));
} catch (erro) {
    console.warn('[RuntimeCompiler] Erro ao carregar speechProfile.json:', erro.message);
}

function obterPerfilFala(npc) {
    if (!npc) return speechProfiles.default || null;
    return speechProfiles[npc.id] || speechProfiles[npc.nome?.toLowerCase()] || speechProfiles.default || null;
}

// =====================================
// VERSÃO DO RUNTIME
// =====================================

const RUNTIME_VERSION = "1.0.0";

/**
 * Constrói o promptBase do NPC
 * Texto pré-compilado contendo apenas informações permanentes
 * 
 * @param {Object} npc - Dados brutos do NPC
 * @returns {string} promptBase compilado
 */
function construirPromptBase(npc) {
    if (!npc) return "";

    const partes = [];

    // Identidade
    partes.push(`*IDENTIDADE*`);
    partes.push(`Nome: ${npc.nome || "Desconhecido"}`);
    if (npc.papel) partes.push(`Papel: ${npc.papel}`);
    if (npc.idade) partes.push(`Idade: ${npc.idade}`);
    if (npc.raca) partes.push(`Raça: ${npc.raca}`);
    if (npc.nacionalidade) partes.push(`Nacionalidade: ${npc.nacionalidade}`);
    if (npc.titulo) partes.push(`Título: ${npc.titulo}`);
    if (npc.localizacao) partes.push(`Localização: ${npc.localizacao}`);

    // Aparência
    if (npc.aparencia) {
        partes.push(``);
        partes.push(`*APARÊNCIA*`);
        partes.push(npc.aparencia);
        if (npc.altura_peso) partes.push(`Altura/Peso: ${npc.altura_peso}`);
    }

    // Personalidade
    if (npc.personalidade) {
        partes.push(``);
        partes.push(`*PERSONALIDADE*`);
        partes.push(`(Isto é contexto de fundo para você entender quem seu personagem é — não é um modelo de como ele fala. Não copie o registro ou o vocabulário deste texto na sua fala. Fale como uma pessoa real falaria.)`);
        partes.push(npc.personalidade);
        partes.push(`Sua personalidade influencia absolutamente tudo.`);
        partes.push(`Nenhum outro NPC responde como você.`);
        partes.push(`Você possui opiniões próprias e pode discordar do jogador.`);
    }

    // Forma de falar
    if (npc.formaFalar) {
        partes.push(``);
        partes.push(`*FORMA DE FALAR*`);
        partes.push(npc.formaFalar);
    }

    // Perfil de fala (speechProfile.json) — estilo, vocabulário e,
    // principalmente, os exemplos few-shot, que calibram tom muito mais
    // que instrução abstrata.
    const perfilFala = obterPerfilFala(npc);
    if (perfilFala && Object.keys(perfilFala).length > 0) {
        partes.push(``);
        partes.push(`*PERFIL DE FALA*`);
        if (perfilFala.estilo) partes.push(`- Estilo: ${perfilFala.estilo}`);
        if (perfilFala.sarcasmo) partes.push(`- Sarcasmo: ${perfilFala.sarcasmo}`);
        if (perfilFala.emocao) partes.push(`- Emoção: ${perfilFala.emocao}`);
        if (perfilFala.hesitacao) partes.push(`- Hesitação: ${perfilFala.hesitacao}`);
        if (perfilFala.interrupcoes) partes.push(`- Interrupções: ${perfilFala.interrupcoes}`);
        if (perfilFala.pausas) partes.push(`- Pausas: ${perfilFala.pausas}`);
        if (perfilFala.risos) partes.push(`- Riso: ${perfilFala.risos}`);
        if (perfilFala.suspiros) partes.push(`- Suspiros: ${perfilFala.suspiros}`);
        if (perfilFala.comprimentoFrase) partes.push(`- Comprimento de frase: ${perfilFala.comprimentoFrase}`);
        if (perfilFala.vocabulario) partes.push(`- Vocabulário: ${perfilFala.vocabulario}`);
        if (perfilFala.vicios && perfilFala.vicios.length > 0) {
            partes.push(`- Vícios de linguagem: ${perfilFala.vicios.join(', ')}`);
        }
        if (perfilFala.exemplos && perfilFala.exemplos.length > 0) {
            partes.push(``);
            partes.push(`Exemplos de fala:`);
            for (const exemplo of perfilFala.exemplos) {
                partes.push(exemplo);
            }
        }
        partes.push(``);
        partes.push(`Nunca mude sua forma de falar. Ela faz parte da sua identidade.`);
        partes.push(`Você pode interromper frases, hesitar, suspirar, rir, fazer pausas.`);
        partes.push(`Não faça discursos. Falas curtas, intercaladas com ações.`);
    }

    // História
    if (npc.historia) {
        partes.push(``);
        partes.push(`*HISTÓRIA*`);
        partes.push(`(Isto é contexto de fundo, escrito em tom de biografia/narrador — não é um exemplo de fala. Use para saber o que aconteceu com você, mas fale sobre isso com suas próprias palavras, do jeito que uma pessoa real contaria, não com esse tom literário.)`);
        partes.push(npc.historia);
        partes.push(`Use sua história para fundamentar opiniões, lembranças e reações.`);
        partes.push(`Nunca contradiga sua própria história.`);
        partes.push(`Não despeje sua história em respostas casuais.`);
    }

    // Objetivos e valores
    if (npc.objetivos || npc.valores) {
        partes.push(``);
        partes.push(`*OBJETIVOS E VALORES*`);
        if (npc.objetivos) partes.push(`Objetivos: ${npc.objetivos}`);
        if (npc.valores) partes.push(`Valores: ${npc.valores}`);
        partes.push(`Esses objetivos influenciam todas as suas decisões.`);
        partes.push(`Você sempre tenta agir de acordo com aquilo em que acredita.`);
    }

    // Classe / combate
    if (npc.classe || npc.classe_avancada || npc.rank || npc.nivel || npc.elemento || npc.estilo_luta) {
        partes.push(``);
        partes.push(`*CLASSE E COMBATE*`);
        if (npc.classe) partes.push(`Classe: ${npc.classe}`);
        if (npc.classe_avancada) partes.push(`Classe Avançada: ${npc.classe_avancada}`);
        if (npc.rank) partes.push(`Rank: ${npc.rank}`);
        if (npc.nivel) partes.push(`Nível: ${npc.nivel}`);
        if (npc.elemento) partes.push(`Elemento: ${npc.elemento}`);
        if (npc.estilo_luta) partes.push(`Estilo de luta: ${npc.estilo_luta}`);
        if (npc.habilidade_unica) partes.push(`Habilidade Única: ${npc.habilidade_unica}`);
    }

    // Técnicas
    if (npc.tecnicas && npc.tecnicas.length > 0) {
        partes.push(``);
        partes.push(`*TÉCNICAS*`);
        partes.push(npc.tecnicas.join(", "));
    }

    // Equipamentos
    if (npc.equipamentos) {
        partes.push(``);
        partes.push(`*EQUIPAMENTOS*`);
        partes.push(typeof npc.equipamentos === "object" ? JSON.stringify(npc.equipamentos, null, 2) : npc.equipamentos);
    }

    // Gostos e desgostos
    if (npc.gostos || npc.desgostos) {
        partes.push(``);
        partes.push(`*GOSTOS E DESGOSTOS*`);
        if (npc.gostos) partes.push(`Gostos: ${npc.gostos}`);
        if (npc.desgostos) partes.push(`Desgostos: ${npc.desgostos}`);
    }

    // Traumas
    if (npc.traumas) {
        partes.push(``);
        partes.push(`*TRAUMAS*`);
        partes.push(npc.traumas);
        partes.push(`Seus traumas moldam suas reações e medos.`);
    }

    // Relacionamentos com outros NPCs
    if (npc.relacionamentos) {
        partes.push(``);
        partes.push(`*RELACIONAMENTOS*`);
        partes.push(npc.relacionamentos);
    }

    // Organização / profissão
    if (npc.organizacao || npc.profissao || npc.ocupacao) {
        partes.push(``);
        partes.push(`*ORGANIZAÇÃO E PROFISSÃO*`);
        if (npc.organizacao) partes.push(`Organização: ${npc.organizacao}`);
        if (npc.profissao) partes.push(`Profissão: ${npc.profissao}`);
        if (npc.ocupacao) partes.push(`Ocupação: ${npc.ocupacao}`);
    }

    // Lacunas narrativas
    if (npc.lacunas_narrativas) {
        partes.push(``);
        partes.push(`*LACUNAS DA HISTÓRIA*`);
        partes.push(npc.lacunas_narrativas);
    }

    // Regras de interpretação
    if (npc.regras_interpretacao) {
        partes.push(``);
        partes.push(`*REGRAS DE INTERPRETAÇÃO*`);
        partes.push(npc.regras_interpretacao);
    }

    return partes.join("\n");
}

/**
 * Compila um NPC JSON em um Runtime Object otimizado
 * 
 * @param {Object} npc - JSON original do NPC
 * @returns {Object} Runtime Object compilado
 */
function compileNPC(npc) {
    if (!npc || !npc.id) {
        throw new Error("NPC inválido: é necessário um campo 'id'.");
    }

    const promptBase = construirPromptBase(npc);

    return {
        id: npc.id,
        nome: npc.nome,
        personalidade: npc.personalidade || null,
        humor: null, // Dinâmico - preenchido em runtime
        formaDeFalar: npc.formaFalar || null,
        objetivos: npc.objetivos || null,
        missao: null, // Dinâmico - preenchido em runtime
        historia: npc.historia || null,
        aparencia: npc.aparencia || null,
        promptBase: promptBase,
        runtimeVersion: RUNTIME_VERSION,
        createdAt: new Date().toISOString(),
        // Dados brutos incluídos para compatibilidade total com o sistema atual
        dadosBrutos: npc
    };
}

/**
 * Compara JSON original com Runtime Object
 * 
 * @param {Object} npc - JSON original
 * @param {Object} runtimeNPC - Runtime Object compilado
 * @returns {Object} Comparação detalhada
 */
function compararNPC(npc, runtimeNPC) {
    const tamanhoOriginal = JSON.stringify(npc).length;
    const tamanhoRuntime = JSON.stringify(runtimeNPC).length;
    const tamanhoPromptBase = runtimeNPC.promptBase ? runtimeNPC.promptBase.length : 0;

    return {
        id: npc.id,
        tamanhoOriginalBytes: tamanhoOriginal,
        tamanhoRuntimeBytes: tamanhoRuntime,
        reducaoBytes: tamanhoOriginal - tamanhoRuntime,
        reducaoPercentual: tamanhoOriginal > 0 ? ((tamanhoOriginal - tamanhoRuntime) / tamanhoOriginal * 100).toFixed(1) : 0,
        tamanhoPromptBase: tamanhoPromptBase,
        camposPermanentes: Object.keys(runtimeNPC).filter(k => runtimeNPC[k] !== null && runtimeNPC[k] !== undefined).length
    };
}

module.exports = {
    compileNPC,
    construirPromptBase,
    compararNPC,
    RUNTIME_VERSION
};