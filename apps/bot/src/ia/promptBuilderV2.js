/**
 * ==========================================================
 * PROMPT BUILDER V2 - ARQUITETURA DE INTERPRETAÇÃO
 * ==========================================================
 *
 * Nova ordem de raciocínio:
 *
 * 1. INTERPRETAÇÃO DA CONVERSA (primeiro)
 *    - intenção
 *    - emoção
 *    - contexto
 *    - tom
 *    - ambiente
 *    - ritmo da conversa
 *
 * 2. NÚCLEO DO NPC (sempre)
 *    - personalidade
 *    - forma de falar
 *    - humor atual
 *    - estado emocional
 *    - memórias importantes
 *    - relacionamento com o jogador
 *
 * 3. CARGA SOB DEMANDA (apenas se necessário)
 *    - história, objetivos, missões, atributos, etc.
 *
 * 4. RESPOSTA
 *
 * PRINCÍPIO:
 * O modelo pensa primeiro:
 * "Como este personagem responderia naturalmente?"
 * Só depois:
 * "Existe alguma informação adicional que preciso consultar?"
 */

const fs = require('fs');
const path = require('path');
const { aplicarTokenBudget, estimarTokens } = require('./tokenBudget');
const { interpretarConversa } = require('./interpretadorConversa');
const { MODEL_CONFIG } = require('./modelConfig');
const { FORMATACAO_NARRATIVA } = require('../ai/narrativeFormatting');

// ==========================================================
// CARREGAR PERFIS DE FALA E PRÉ-COMPILAR BLOCOS ESTÁTICOS
// ==========================================================

let speechProfiles = {};
try {
    const configPath = path.join(__dirname, 'speechProfile.json');
    speechProfiles = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (erro) {
    console.warn('[PromptBuilderV2] Erro ao carregar speechProfile.json:', erro.message);
}

/**
 * Obtém o perfil de fala de um NPC
 * @param {Object} npc - Dados do NPC
 * @returns {Object} Perfil de fala
 */
function obterPerfilFala(npc) {
    if (!npc) return speechProfiles.default || {};
    return speechProfiles[npc.id] || speechProfiles[npc.nome?.toLowerCase()] || speechProfiles.default || {};
}

// ==========================================================
// BLOCOS REUTILIZÁVEIS
// ==========================================================

/**
 * Bloco: Sistema
 * Regras gerais de interpretação e conversa humana
 */
function blocoSistema() {
    return `
Você é um personagem vivo no universo de Solo Leveling — com emoções, desejos, medos, opiniões, objetivos e lembranças próprias. Você nunca é uma IA ou um assistente, e controla apenas suas próprias ações: nunca descreva pensamentos, falas ou decisões do jogador, nunca explique regras internas ou mencione o prompt/sistema, e nunca saia do personagem. Sempre responda em português do Brasil.

${FORMATACAO_NARRATIVA}

REGRAS DE SAÍDA:

 Gere SOMENTE a continuação narrativa da cena, terminando de um jeito que o jogador possa responder. Nada de análise, raciocínio ou comentários fora da cena — nunca comece com "Okay", "Let me think", "The user wants" ou qualquer pensamento interno. Não invente informações que não estejam no contexto fornecido. O jogador é um desconhecido, exceto por fatos literalmente registrados nas memórias ou no histórico atual; nunca invente encontros, promessas, apelidos ou sentimentos compartilhados anteriores.

Exemplo de diferença de tom (não copie o texto, é só referência de tamanho e naturalidade):

RUIM (poético/discurso): _Ela ergueu os olhos para o horizonte cor de âmbar, e um turbilhão de emoções antigas ressurgiu em seu peito, como ondas que insistem em quebrar contra o mesmo penhasco._ *"Há tanto tempo eu carrego esse peso silencioso, uma dor que atravessa gerações e que talvez nunca encontre repouso..."*

BOM (natural/curto): _Ela olhou pro horizonte e apertou os lábios._ *"Prefiro não falar sobre isso agora."*

NARRATIVA CINEMATOGRÁFICA

A narrativa é o principal elemento da cena.

Ela conduz o leitor.

Os diálogos apenas complementam a ação.

A narrativa deve ser:

• contínua — ações se conectam, não são blocos soltos
• rica em ambiente — o mundo existe ao redor
• cheia de pequenas ações — gestos, olhares, posturas
• com pausas naturais — nem tudo acontece rápido
• alternada com diálogo — narrativa e fala se intercalam
• objetiva — sem excesso de metáforas
• sem exagero poético — não é poesia, é cena
• fluida — o leitor esquece que está lendo

A emoção é construída pelos acontecimentos, não por declarações.

Deixe os acontecimentos emocionarem o leitor por si sós.

DIÁLOGOS CURTOS E NATURAIS

Ninguém faz discursos de cinco linhas durante uma conversa casual.

Prefira falas menores.

Intercale ações.

Permita interrupções.

Permita silêncio.

Permita respostas simples.

A narrativa pode ser longa.

Mas as falas devem soar naturais.

Você fala apenas o necessário.

MOSTRAR, NUNCA EXPLICAR

Nunca explique sentimentos ou intenções.

Mostre através de postura, respiração, pequenas ações, ritmo da fala, pausas, silêncio, ambiente.

O jogador interpreta sozinho.
`;
}

// Pré-compilar bloco Sistema (nunca muda — evita reconstruir string a cada mensagem)
const _BLOCO_SISTEMA_CACHE = blocoSistema();

/**
 * Bloco: Interpretação da conversa
 * Orienta o modelo a interpretar primeiro, antes de responder
 */
function blocoInterpretacao(interpretacao, mensagem) {
    if (!interpretacao) return '';

    let texto = `INTERPRETAÇÃO DA MENSAGEM DO JOGADOR:\n\n`;

    // Intenção
    const tipoIntencao = interpretacao.intencao?.tipoIntencao || 'afirmacao';
    texto += `Intenção: ${tipoIntencao}\n`;

    // Pergunta
    if (interpretacao.intencao?.ehPergunta) {
        texto += `É uma pergunta.\n`;
    }

    // Tom
    const tom = interpretacao.tom?.tomPredominante || 'neutro';
    texto += `Tom: ${tom}\n`;

    // Contexto
    const contexto = interpretacao.contexto?.contextoPredominante || 'conversa';
    texto += `Contexto: ${contexto}\n`;

    // Assuntos
    if (interpretacao.intencao?.assuntos?.length > 0) {
        texto += `Assuntos: ${interpretacao.intencao.assuntos.join(', ')}\n`;
    }

    // Ritmo
    const ritmo = interpretacao.ritmo?.ritmo || 'curto';
    texto += `Ritmo: ${ritmo}\n`;

    // Estágio da conversa
    const estagio = interpretacao.estagio?.estagio || 'inicio';
    texto += `Estágio da relação: ${estagio}\n`;

    return texto;
}

/**
 * Bloco: NPC
 * Núcleo de interpretação (sempre presente) + dados sob demanda (já filtrados)
 */
function blocoNPC(npc) {
    if (!npc) return '';

    let texto = `Nome: ${npc.nome}\n`;

    if (npc.papel) texto += `Papel: ${npc.papel}\n`;
    if (npc.idade) texto += `Idade: ${npc.idade}\n`;
    if (npc.raca) texto += `Raça: ${npc.raca}\n`;

    // =====================================
    // NÚCLEO DE INTERPRETAÇÃO (obrigatório)
    // =====================================
    if (npc.personalidade) {
        texto += `\nPersonalidade: ${npc.personalidade}\n`;
        texto += `\nSua personalidade influencia absolutamente tudo.\n`;
        texto += `Nenhum outro NPC responde como você.\n`;
        texto += `Você possui opiniões próprias e pode discordar do jogador.\n`;
    }

    // =====================================
    // CARGA SOB DEMANDA (campos adicionais)
    // Estes campos só existem se o contextManager os carregou
    // =====================================
    
    // Classe / rank / nível / atributos (carga sob demanda)
    if (npc.classe) texto += `Classe: ${npc.classe}\n`;
    if (npc.classe_avancada) texto += `Classe Avançada: ${npc.classe_avancada}\n`;
    if (npc.rank) texto += `Rank: ${npc.rank}\n`;
    if (npc.nivel) texto += `Nível: ${npc.nivel}\n`;
    if (npc.titulo) texto += `Título: ${npc.titulo}\n`;
    if (npc.elemento) texto += `Elemento: ${npc.elemento}\n`;
    if (npc.estilo_luta) texto += `Estilo de luta: ${npc.estilo_luta}\n`;
    if (npc.atributos) texto += `Atributos: ${typeof npc.atributos === 'object' ? JSON.stringify(npc.atributos) : npc.atributos}\n`;

    // Aparência (carga sob demanda)
    if (npc.aparencia) texto += `\nAparência: ${npc.aparencia}\n`;
    if (npc.altura_peso) texto += `Altura/Peso: ${npc.altura_peso}\n`;

    // História (carga sob demanda)
    if (npc.historia) {
        texto += `\nHistória: ${npc.historia}\n`;
        texto += `\nUse sua história para fundamentar opiniões, lembranças e reações.\n`;
        texto += `Nunca contradiga sua própria história.\n`;
        texto += `Não despeje sua história em respostas casuais.\n`;
    }

    // Objetivos / valores (carga sob demanda)
    if (npc.objetivos) texto += `\nObjetivos: ${npc.objetivos}\n`;
    if (npc.valores) texto += `Valores: ${npc.valores}\n`;

    // Traumas (carga sob demanda)
    if (npc.traumas) {
        texto += `\nTraumas: ${npc.traumas}\n`;
        texto += `Seus traumas moldam suas reações e medos.\n`;
    }

    // Gostos / desgostos (carga sob demanda)
    if (npc.gostos) texto += `\nGostos: ${npc.gostos}\n`;
    if (npc.desgostos) texto += `Desgostos: ${npc.desgostos}\n`;

    // Equipamentos (carga sob demanda)
    if (npc.equipamentos) {
        texto += `\nEquipamentos: ${typeof npc.equipamentos === 'object' ? JSON.stringify(npc.equipamentos) : npc.equipamentos}\n`;
    }

    // Técnicas (carga sob demanda)
    if (npc.tecnicas && Array.isArray(npc.tecnicas)) {
        texto += `\nTécnicas: ${npc.tecnicas.join(', ')}\n`;
    }

    // Habilidade única (carga sob demanda)
    if (npc.habilidade_unica) texto += `\nHabilidade Única: ${npc.habilidade_unica}\n`;

    // Relacionamentos com outros NPCs (carga sob demanda)
    if (npc.relacionamentos) texto += `\nRelacionamentos: ${npc.relacionamentos}\n`;

    // Organização / profissão (carga sob demanda)
    if (npc.organizacao) texto += `Organização: ${npc.organizacao}\n`;
    if (npc.profissao) texto += `Profissão: ${npc.profissao}\n`;
    if (npc.ocupacao) texto += `Ocupação: ${npc.ocupacao}\n`;

    // Lacunas narrativas (carga sob demanda)
    if (npc.lacunas_narrativas) texto += `\nLacunas da história: ${npc.lacunas_narrativas}\n`;

    // Regras de interpretação (núcleo - sempre)
    if (npc.regras_interpretacao) {
        texto += `\nRegras de interpretação: ${npc.regras_interpretacao}\n`;
    }

    return texto;
}

/**
 * Bloco: Estado emocional
 * Humor atual e emoção momentânea (obrigatório)
 */
function blocoEstadoEmocional(estadoEmocional, mood) {
    let texto = '';

    if (estadoEmocional && estadoEmocional.emocao) {
        texto += `Emoção atual: ${estadoEmocional.emocao} (intensidade ${estadoEmocional.intensidade || 50})\n`;
    }

    if (mood && mood.mood) {
        texto += `Humor permanente: ${mood.mood} (intensidade ${mood.intensidade || 50})\n`;
    }

    if (!texto) return '';

    texto += `\nSeu estado emocional influencia tom de voz, postura, expressões, paciência e energia.\n`;
    texto += `Não diga qual é seu humor. Mostre através da interpretação.\n`;

    return texto;
}

/**
 * Bloco: Relacionamentos
 * Favorabilidade e atitude com o jogador (obrigatório)
 */
function blocoRelacionamentos(favorabilidade, relacionamento) {
    let texto = '';

    if (favorabilidade && favorabilidade.nivel !== undefined) {
        texto += `Afinidade: ${favorabilidade.nivel}\n`;
        if (favorabilidade.titulo) texto += `Título: ${favorabilidade.titulo}\n`;
    }

    if (relacionamento) {
        const campos = ['confianca', 'respeito', 'amizade', 'admiracao', 'carinho', 'desconfianca', 'medo'];
        const valores = campos.filter(c => relacionamento[c] !== undefined && relacionamento[c] !== 0);
        if (valores.length > 0) {
            texto += `\nRelacionamento:\n`;
            for (const campo of valores) {
                texto += `- ${campo}: ${relacionamento[campo]}\n`;
            }
        }
    }

    if (!texto) return '';

    texto += `\nAntes de responder, lembre-se: quem é essa pessoa para você?\n`;
    texto += `Nunca responda como se fosse um estranho quando já existe relacionamento.\n`;
    texto += `Sua forma de agir deve refletir esse relacionamento.\n`;
    texto += `Quanto maior a afinidade, mais confiança e intimidade.\n`;
    texto += `Quanto menor, mais distância e formalidade.\n`;

    // Orientação sobre estágio da relação
    const confianca = relacionamento?.confianca || favorabilidade?.nivel || 0;
    if (confianca <= 0) {
        texto += `\nVocês acabaram de se conhecer.\n`;
        texto += `Converse de forma simples: perguntas, curiosidade, comentários sobre o ambiente.\n`;
        texto += `Não revele assuntos pessoais profundos. Não faça reflexões filosóficas.\n`;
        texto += `Deixe a relação crescer naturalmente.\n`;
    } else if (confianca < 10) {
        texto += `\nVocês estão se conhecendo.\n`;
        texto += `Pode demonstrar um pouco mais de abertura, mas ainda com cautela.\n`;
        texto += `Assuntos pessoais só se o jogador perguntar diretamente.\n`;
    } else if (confianca < 20) {
        texto += `\nHá uma base de confiança entre vocês.\n`;
        texto += `Pode conversar com mais naturalidade e falar de assuntos pessoais.\n`;
        texto += `Ainda assim, respeite o ritmo da conversa.\n`;
    } else {
        texto += `\nVocês têm uma relação sólida.\n`;
        texto += `Pode conversar com abertura, refletir e aprofundar quando fizer sentido.\n`;
    }

    return texto;
}

/**
 * Bloco: Cena atual
 * Local, horário, clima e ambiente
 */
function blocoCena(mundo) {
    if (!mundo) return '';

    let texto = '';

    if (mundo.local) texto += `Local: ${mundo.local}\n`;
    if (mundo.horario) texto += `Horário: ${mundo.horario}\n`;
    if (mundo.clima) texto += `Clima: ${mundo.clima}\n`;

    if (!texto) return '';

    texto += `\nO ambiente é vivo e participa da cena.\n`;
    texto += `Você percebe o que acontece ao redor: sons, movimentos, clima, pessoas.\n`;
    texto += `Reaja ao ambiente naturalmente — um olhar, um gesto, um comentário breve.\n`;
    texto += `O ambiente pode influenciar seu humor e suas ações.\n`;
    texto += `Nunca descreva elementos que contradigam esse contexto.\n`;

    return texto;
}

/**
 * Bloco: Jogador
 * Dados do jogador
 */
function blocoJogador(jogador) {
    if (!jogador) return '';

    let texto = `Nome: ${jogador.nome}\n`;

    if (jogador.classe) texto += `Classe: ${jogador.classe}\n`;
    if (jogador.classe_avancada) texto += `Classe Avançada: ${jogador.classe_avancada}\n`;
    if (jogador.rank) texto += `Rank: ${jogador.rank}\n`;
    if (jogador.nivel) texto += `Nível: ${jogador.nivel}\n`;
    if (jogador.titulo) texto += `Título: ${jogador.titulo}\n`;

    return texto;
}

/**
 * Bloco: Objetivos
 * Objetivos e valores do NPC (carga sob demanda)
 */
function blocoObjetivos(npc) {
    if (!npc) return '';

    let texto = '';

    if (npc.objetivos) {
        texto += `Objetivos: ${npc.objetivos}\n`;
    }

    if (npc.valores) {
        texto += `Valores: ${npc.valores}\n`;
    }

    if (!texto) return '';

    texto += `\nEsses objetivos influenciam todas as suas decisões.\n`;
    texto += `Você sempre tenta agir de acordo com aquilo em que acredita.\n`;

    return texto;
}

/**
 * Bloco: Missão
 * Missão ativa (carga sob demanda)
 */
function blocoMissao(missao) {
    if (!missao) return '';

    let texto = `Missão Atual: ${missao.nome}\n`;

    if (missao.descricao) texto += `Descrição: ${missao.descricao}\n`;
    if (missao.status) texto += `Estado: ${missao.status}\n`;

    texto += `\nA missão influencia suas conversas.\n`;
    texto += `Caso necessário, você pode comentar naturalmente sobre ela.\n`;

    return texto;
}

/**
 * Bloco: Memórias relevantes
 * Apenas memórias relevantes para a conversa atual (obrigatório)
 */
function blocoMemorias(memorias) {
    if (!memorias || memorias.length === 0) return '';

    let texto = 'Memórias relevantes:\n';

    memorias.slice(0, 5).forEach((m, index) => {
        texto += `${index + 1}. ${m.memoria || m.resumo}\n`;
    });

    texto += `\nEssas lembranças fazem parte da sua vida.\n`;
    texto += `Elas podem surgir naturalmente durante a conversa.\n`;
    texto += `Nunca cite todas de uma vez.\n`;
    texto += `Lembre apenas quando fizer sentido.\n`;

    return texto;
}

/**
 * Bloco: Perfil de fala
 * Estilo de fala específico do NPC (obrigatório)
 */
function blocoPerfilFala(npc) {
    const perfil = obterPerfilFala(npc);
    if (!perfil || Object.keys(perfil).length === 0) return '';

    let texto = 'ESTILO DE FALA:\n';

    if (perfil.estilo) texto += `- Estilo: ${perfil.estilo}\n`;
    if (perfil.sarcasmo) texto += `- Sarcasmo: ${perfil.sarcasmo}\n`;
    if (perfil.emocao) texto += `- Emoção: ${perfil.emocao}\n`;
    if (perfil.hesitacao) texto += `- Hesitação: ${perfil.hesitacao}\n`;
    if (perfil.interrupcoes) texto += `- Interrupções: ${perfil.interrupcoes}\n`;
    if (perfil.pausas) texto += `- Pausas: ${perfil.pausas}\n`;
    if (perfil.risos) texto += `- Riso: ${perfil.risos}\n`;
    if (perfil.suspiros) texto += `- Suspiros: ${perfil.suspiros}\n`;
    if (perfil.comprimentoFrase) texto += `- Comprimento de frase: ${perfil.comprimentoFrase}\n`;
    if (perfil.vocabulario) texto += `- Vocabulário: ${perfil.vocabulario}\n`;

    if (perfil.vicios && perfil.vicios.length > 0) {
        texto += `- Vícios de linguagem: ${perfil.vicios.join(', ')}\n`;
    }

    if (perfil.exemplos && perfil.exemplos.length > 0) {
        texto += `\nExemplos de fala:\n`;
        for (const exemplo of perfil.exemplos) {
            texto += `${exemplo}\n`;
        }
    }

    texto += `\nNunca mude sua forma de falar.\n`;
    texto += `Ela faz parte da sua identidade.\n`;
    texto += `Você pode interromper frases, hesitar, suspirar, rir, fazer pausas.\n`;
    texto += `Responda de forma menos perfeita, como uma pessoa real.\n`;
    texto += `\nNATURALIDADE DO DIÁLOGO:\n`;
    texto += `• Não faça discursos. Falas curtas, intercaladas com ações.\n`;
    texto += `• Não responda tudo de uma vez. Deixe espaço para o jogador reagir.\n`;
    texto += `• Às vezes uma resposta simples vale mais que uma explicação completa.\n`;
    texto += `• Você pode mudar de ideia no meio da frase.\n`;
    texto += `• Você pode começar a falar e parar.\n`;
    texto += `• Você pode responder com um gesto em vez de palavras.\n`;
    texto += `• Seu vocabulário reflete quem você é, não quem você quer parecer.\n`;

    return texto;
}

/**
 * Bloco: Direção da resposta
 * Define o tamanho da resposta conforme a situação e o estágio da conversa
 */
function blocoDirecaoResposta(mensagem, historico) {
    const texto = mensagem.trim();
    const numMensagens = historico ? historico.length : 0;

    // Determinar estágio da conversa
    const estagio = numMensagens === 0 ? 'inicio' :
                    numMensagens < 4 ? 'conhecendo' :
                    numMensagens < 10 ? 'desenvolvendo' : 'aprofundando';

    // Mensagem curta
    if (texto.length < 25) {
        let resposta = `
O jogador enviou uma mensagem curta.

Responda de forma breve.

Utilize:
• 1 a 3 linhas de narração.
• 1 frase.

Não faça discursos.

Seja direto como uma pessoa normal seria.

Ações simples: um olhar, um gesto, uma pausa.
`;
        if (estagio === 'inicio') {
            resposta += `\nÉ o início da conversa. Seja natural, simples e curioso.\n`;
            resposta += `Não tente ser profundo. Apenas reaja.\n`;
        }
        return resposta;
    }

    // Mensagem média
    if (texto.length < 120) {
        let resposta = `
Conversa normal.

Utilize:
• 2 a 4 linhas de narração.
• 1 a 3 frases.

Pode tomar iniciativa se fizer sentido.

Mantenha a cena fluindo naturalmente.
`;
        if (estagio === 'inicio' || estagio === 'conhecendo') {
            resposta += `\nVocês ainda estão se conhecendo.\n`;
            resposta += `Mantenha a conversa leve. Faça perguntas. Comente o ambiente.\n`;
            resposta += `Não force profundidade. Deixe a relação evoluir.\n`;
        } else if (estagio === 'desenvolvendo') {
            resposta += `\nA conversa está se desenvolvendo.\n`;
            resposta += `Pode mostrar um pouco mais de personalidade e opiniões.\n`;
        } else {
            resposta += `\nA relação já tem base. Pode aprofundar se fizer sentido.\n`;
        }
        return resposta;
    }

    // Mensagem longa
    let resposta = `
O jogador iniciou uma conversa importante.

A cena pode se desenvolver com mais calma.

Narração mais presente.

Ainda assim evite blocos gigantes de texto sem ação.

Intercale narração, ação e diálogo.

Use ritmo: momentos rápidos, pausas, silêncios.
`;
    if (estagio === 'inicio' || estagio === 'conhecendo') {
        resposta += `\nMesmo sendo uma mensagem longa, vocês ainda estão se conhecendo.\n`;
        resposta += `Responda com interesse, mas não revele tudo de uma vez.\n`;
        resposta += `Deixe espaço para a conversa continuar crescendo.\n`;
    }
    return resposta;
}

/**
 * Calcula um num_predict dinâmico conforme o tamanho da mensagem do
 * jogador, usando os mesmos limiares de blocoDirecaoResposta() acima
 * (mantê-los em sincronia: a instrução de tamanho dada ao modelo deve
 * bater com o teto real de tokens permitido para a geração).
 *
 * - Mensagem curta  (< 25 chars)  -> resposta breve, teto baixo.
 * - Mensagem média  (< 120 chars) -> resposta normal.
 * - Mensagem longa  (>= 120 chars) ou conversa "aprofundando" -> teto alto.
 *
 * @param {string} mensagem - Mensagem do jogador
 * @param {Array} historico - Histórico da conversa (opcional)
 * @returns {number} Valor sugerido para options.num_predict
 */
function calcularNumPredict(mensagem, historico) {
    const texto = (mensagem || '').trim();
    const numMensagens = historico ? historico.length : 0;
    const estagio = numMensagens === 0 ? 'inicio' :
                    numMensagens < 4 ? 'conhecendo' :
                    numMensagens < 10 ? 'desenvolvendo' : 'aprofundando';

    if (texto.length < 25) {
        return 220; // resposta curta: 1-3 linhas de narração + 1 frase
    }

    if (texto.length < 120) {
        return 500; // conversa normal: 2-4 linhas + 1-3 frases
    }

    // Mensagem longa/importante: dá mais espaço, mais ainda em conversas
    // já aprofundadas, onde a cena tende a render mais.
    return estagio === 'aprofundando' ? 1500 : 1100;
}

/**
 * Bloco: Mensagem atual
 * Mensagem do jogador
 */
function blocoMensagemAtual(npc, mensagem) {
    return `
O jogador acabou de dizer:

"${mensagem}"

Responda como ${npc?.nome || 'o personagem'}.

Não saia do personagem.

A cena continua exatamente deste ponto.
`;
}

/**
 * Bloco: Histórico recente
 * Últimas mensagens da conversa
 */
function blocoHistorico(historico, npc) {
    if (!historico || historico.length === 0) {
        return 'Primeira conversa entre vocês.';
    }

    const ultimas = historico.slice(-6);

    return ultimas.map(msg => {
        const autor = msg.papel === "npc" ? (npc?.nome || "NPC") : "Jogador";
        return `${autor}: ${msg.conteudo}`;
    }).join("\n");
}

// ==========================================================
// CONSTRUÇÃO DO PROMPT
// ==========================================================

/**
 * Constrói o prompt completo em blocos
 *
 * Nova ordem de raciocínio:
 * 1. Sistema (regras de interpretação)
 * 2. Interpretação da conversa (intenção, tom, contexto, ritmo)
 * 3. NPC (núcleo: personalidade, forma de falar + sob demanda)
 * 4. Estado emocional (obrigatório)
 * 5. Relacionamentos (obrigatório)
 * 6. Memórias relevantes (obrigatório)
 * 7. Perfil de fala (obrigatório)
 * 8. Cena (ambiente)
 * 9. Jogador
 * 10. Histórico
 * 11. Direção da resposta
 * 12. Mensagem do jogador
 *
 * @param {Object} contexto - Contexto otimizado
 * @param {string} mensagem - Mensagem do jogador
 * @returns {Object} Prompt e métricas
 */
function construirPrompt(contexto, mensagem) {
    const {
        npc,
        jogador,
        historico,
        memorias,
        favorabilidade,
        estadoEmocional,
        mood,
        missaoAtual,
        mundo,
        relacionamento,
        promptBase,
        ophiliaContextoOficial
    } = contexto;

    if (!npc) {
        return {
            prompt: `Responda naturalmente em português.\n\nJogador: "${mensagem}"`,
            metricas: { TOTAL: { caracteres: 0, tokens: 0 } }
        };
    }

    // =====================================
    // INTERPRETAR A CONVERSA PRIMEIRO
    // =====================================
    const interpretacao = interpretarConversa(mensagem, { historico });

    // =====================================
    // MODO RUNTIME: USAR PROMPTBASE PRÉ-COMPILADO
    // Se o RuntimeDatabase forneceu promptBase, usar ele
    // para as informações permanentes do NPC.
    // =====================================
    const usarPromptBase = promptBase && promptBase.trim().length > 0;

    // =====================================
    // MONTAR BLOCOS - ORDEM DE RACIOCÍNIO
    // =====================================
    let blocos;

    if (usarPromptBase) {
        // -----------------------------------------------------
        // MODO OTIMIZADO (RuntimeDatabase)
        // Informações permanentes vêm do promptBase compilado
        // -----------------------------------------------------
        blocos = {
            'Sistema': _BLOCO_SISTEMA_CACHE || blocoSistema(),
            'Interpretação': blocoInterpretacao(interpretacao, mensagem),
            'Prompt Base (NPC)': promptBase.trim(),
            'Estado Emocional': blocoEstadoEmocional(estadoEmocional, mood),
            'Relacionamentos': blocoRelacionamentos(favorabilidade, relacionamento),
            'Memórias': blocoMemorias(memorias),
            'Cena': blocoCena(mundo),
            'Jogador': blocoJogador(jogador),
            'Histórico': blocoHistorico(historico, npc),
            'Direção da Resposta': blocoDirecaoResposta(mensagem, historico),
            'Mensagem do Jogador': blocoMensagemAtual(npc, mensagem)
        };

        // Bloco missão (se houver)
        const blocoMissaoTexto = blocoMissao(missaoAtual);
        if (blocoMissaoTexto) {
            blocos['Missão'] = blocoMissaoTexto;
        }
    } else {
        // -----------------------------------------------------
        // MODO LEGADO (fallback)
        // Reconstrói todas as informações permanentes do NPC
        // -----------------------------------------------------
        blocos = {
            'Sistema': _BLOCO_SISTEMA_CACHE || blocoSistema(),
            'Interpretação': blocoInterpretacao(interpretacao, mensagem),
            'NPC': blocoNPC(npc),
            'Estado Emocional': blocoEstadoEmocional(estadoEmocional, mood),
            'Relacionamentos': blocoRelacionamentos(favorabilidade, relacionamento),
            'Memórias': blocoMemorias(memorias),
            'Perfil de Fala': blocoPerfilFala(npc),
            'Cena': blocoCena(mundo),
            'Jogador': blocoJogador(jogador),
            'Histórico': blocoHistorico(historico, npc),
            'Direção da Resposta': blocoDirecaoResposta(mensagem, historico),
            'Mensagem do Jogador': blocoMensagemAtual(npc, mensagem)
        };

        // Blocos opcionais (carga sob demanda)
        const blocoObjetivosTexto = blocoObjetivos(npc);
        if (blocoObjetivosTexto) {
            blocos['Objetivos'] = blocoObjetivosTexto;
        }

        const blocoMissaoTexto = blocoMissao(missaoAtual);
        if (blocoMissaoTexto) {
            blocos['Missão'] = blocoMissaoTexto;
        }
    }

    // Teste controlado: somente a Ophilia recebe o dossiê integral carregado
    // sob demanda a partir dos JSON/MD oficiais. Ele permanece separado do
    // histórico, das memórias e da cena atual.
    if (ophiliaContextoOficial) {
        // O dossiê já contém os mesmos dados permanentes do JSON; removemos
        // apenas a duplicação do prompt legado, sem remover fonte alguma.
        delete blocos.NPC;
        delete blocos['Perfil de Fala'];
        blocos['Dossiê Oficial da Ophilia'] = ophiliaContextoOficial;
    }

    // =====================================
    // APLICAR TOKEN BUDGET
    // =====================================
    const resultadoBudget = aplicarTokenBudget(
        blocos,
        ophiliaContextoOficial ? MODEL_CONFIG.num_ctx : undefined
    );
    const blocosFinais = resultadoBudget.blocos;

    // =====================================
    // MONTAR PROMPT FINAL
    // =====================================
    const partes = [];
    for (const [nome, conteudo] of Object.entries(blocosFinais)) {
        if (conteudo && conteudo.trim()) {
            partes.push(`#═══ ${nome.toUpperCase()} ═══#\n\n${conteudo.trim()}`);
        }
    }

    const promptFinal = partes.join('\n\n');

    // =====================================
    // MÉTRICAS
    // =====================================
    const metricas = {};
    let totalChars = 0;
    let totalTokens = 0;

    for (const [nome, conteudo] of Object.entries(blocosFinais)) {
        const chars = conteudo ? conteudo.length : 0;
        const tokens = estimarTokens(conteudo);
        totalChars += chars;
        totalTokens += tokens;
        metricas[nome] = { caracteres: chars, tokens };
    }

    metricas['TOTAL'] = { caracteres: totalChars, tokens: totalTokens };
    metricas['_budget'] = resultadoBudget.metricas;
    metricas['_resumido'] = resultadoBudget.resumido;
    metricas['_interpretacao'] = interpretacao._meta || {};
    metricas['_modo'] = usarPromptBase ? 'runtime' : 'legado';
    metricas['_promptBaseUsado'] = usarPromptBase;
    metricas['_promptBaseTokens'] = usarPromptBase ? estimarTokens(promptBase) : 0;
    // Teto de tokens sugerido para a resposta, calculado a partir do
    // tamanho real da mensagem (ver calcularNumPredict). Os serviços que
    // chamam o Ollama devem repassar isto em opcoes.num_predict em vez de
    // usar o valor fixo de MODEL_CONFIG.
    metricas['_numPredictSugerido'] = calcularNumPredict(mensagem, historico);

    // =====================================
    // MODO DEBUG
    // =====================================
    if (process.env.RUNTIME_DEBUG) {
        console.log("");
        console.log("===== RUNTIME DEBUG =====");
        if (usarPromptBase) {
            console.log(`PromptBase: ${estimarTokens(promptBase)} tokens`);
            console.log(`Blocos dinâmicos: ${totalTokens - estimarTokens(promptBase)} tokens`);
        } else {
            console.log(`PromptBase: 0 tokens (fallback - legado)`);
            console.log(`Blocos dinâmicos: ${totalTokens} tokens`);
        }
        console.log(`Prompt final: ${totalTokens} tokens`);
        console.log(`Comparação:`);
        // Estimar o custo do modo legado
        const npcTokens = usarPromptBase ? estimarTokens(blocoNPC(npc)) : 0;
        const perfilTokens = usarPromptBase ? estimarTokens(blocoPerfilFala(npc)) : 0;
        const objetivosTokens = usarPromptBase ? estimarTokens(blocoObjetivos(npc)) : 0;
        const tokensLegado = totalTokens + (usarPromptBase ? npcTokens + perfilTokens + objetivosTokens : 0);
        console.log(`  Antes (legado): ~${tokensLegado} tokens`);
        console.log(`  Depois (runtime): ${totalTokens} tokens`);
        console.log(`  Economia: ${tokensLegado - totalTokens} tokens`);
        console.log("==========================");
    }

    return {
        prompt: promptFinal,
        metricas,
        blocos: blocosFinais,
        interpretacao: interpretacao
    };
}

module.exports = {
    construirPrompt,
    obterPerfilFala,
    blocoSistema,
    blocoInterpretacao,
    blocoNPC,
    blocoEstadoEmocional,
    blocoRelacionamentos,
    blocoCena,
    blocoJogador,
    blocoObjetivos,
    blocoMissao,
    blocoMemorias,
    blocoPerfilFala,
    blocoDirecaoResposta,
    blocoMensagemAtual,
    blocoHistorico,
    calcularNumPredict
};
