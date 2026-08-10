/**
 * BATERIA COMPLETA DE TESTES DO SISTEMA DE DIÁLOGO DOS NPCs
 *
 * Valida todo o pipeline: reconhecimento de comando, envio de mensagem,
 * construção de prompt, Thinking Dinâmico, memória, personalidade e resposta.
 */

const NPCManager = require('../src/npc/npcManager');
const ConversationManager = require('../src/npc/conversationManager');
const { obterContexto } = require('../src/ia/contextManager');
const { otimizarContexto } = require('../src/ia/contextOptimizer');
const { construirPrompt } = require('../src/ia/promptBuilder');
const { intentAnalyzer } = require('../src/ia/intentAnalyzer');
const { complexityAnalyzer } = require('../src/ia/complexityAnalyzer');
const { thinkingDecisionEngine } = require('../src/ia/thinkingDecisionEngine');
const { formatarMensagem } = require('../src/utils/messageFormatter');
const { isConversaNPC } = require('../src/npc/npcConversa');

const relatorio = {
    totalTestes: 0,
    aprovados: 0,
    reprovados: 0,
    falhas: [],
    correcoes: [],
    melhorias: [],
    gargalos: [],
    logs: []
};

function log(msg) {
    console.log(msg);
    relatorio.logs.push(msg);
}

function registrarResultado(nome, passou, detalhes) {
    relatorio.totalTestes++;
    if (passou) {
        relatorio.aprovados++;
        log('  ✓ ' + nome);
    } else {
        relatorio.reprovados++;
        relatorio.falhas.push({ nome, detalhes });
        log('  ✗ ' + nome + ': ' + (detalhes || ''));
    }
}

// =====================================
// 1. RECONHECIMENTO DE COMANDO
// =====================================
function testarReconhecimentoComando() {
    log('\n═══════════════════════════════════════════');
    log('  1. RECONHECIMENTO DE COMANDO');
    log('═══════════════════════════════════════════\n');

    const npcs = NPCManager.listarNPCs();
    log('Total de NPCs: ' + npcs.length + '\n');

    for (const npc of npcs) {
        const comando = '!' + npc.id;
        const msg = { body: comando + '\nOlá, como vai?' };

        const reconhecido = isConversaNPC(msg.body);
        registrarResultado('Comando ' + comando + ' reconhecido', reconhecido, 'isConversaNPC retornou false');

        // Verificar se NPC pode ser encontrado
        const npcEncontrado = NPCManager.carregarNPC(npc.id);
        registrarResultado('NPC ' + npc.nome + ' encontrado por ID', npcEncontrado !== null);

        // Verificar base de conhecimento
        const temBase = npc.personalidade && npc.historia && npc.formaFalar;
        registrarResultado('NPC ' + npc.nome + ' tem base de conhecimento', temBase, 'Faltam campos obrigatórios');

        // Verificar memória
        const temMemoria = npc.objetivos && npc.valores;
        registrarResultado('NPC ' + npc.nome + ' tem memória', temMemoria, 'Faltam objetivos/valores');
    }
}

// =====================================
// 2. RECONHECIMENTO DA MENSAGEM
// =====================================
function testarReconhecimentoMensagem() {
    log('\n═══════════════════════════════════════════');
    log('  2. RECONHECIMENTO DA MENSAGEM');
    log('═══════════════════════════════════════════\n');

    const mensagemLonga = `Therion...
Acho que estou começando a confiar em você.

Na verdade queria te perguntar uma coisa.

Você já se arrependeu de alguma decisão da sua vida?`;

    const msg = { body: '!therion\n' + mensagemLonga };

    // Verificar se a mensagem é reconhecida como conversa NPC
    const reconhecido = isConversaNPC(msg.body);
    registrarResultado('Mensagem longa reconhecida como conversa NPC', reconhecido);

    // Extrair mensagem do jogador
    const linhas = msg.body.split('\n');
    const mensagemJogador = linhas.slice(1).join('\n').trim();

    registrarResultado('Mensagem extraída integralmente', mensagemJogador === mensagemLonga, 'Mensagem foi truncada ou alterada');
    registrarResultado('Mensagem tem ' + mensagemJogador.length + ' caracteres', mensagemJogador.length > 0);
    registrarResultado('Mensagem preserva quebras de linha', mensagemJogador.includes('\n\n'));
    registrarResultado('Mensagem preserva pontuação', mensagemJogador.includes('...') && mensagemJogador.includes('?'));
}

// =====================================
// 3. TESTES DE DIFERENTES TIPOS DE CONVERSA
// =====================================
async function testarTiposConversa() {
    log('\n═══════════════════════════════════════════');
    log('  3. TESTES DE DIFERENTES TIPOS DE CONVERSA');
    log('═══════════════════════════════════════════\n');

    const npcs = NPCManager.listarNPCs();
    const npcTeste = npcs[0]; // Usar primeiro NPC para testes

    const tiposConversa = [
        { tipo: 'Cumprimento', mensagem: 'Olá!' },
        { tipo: 'Pergunta curta', mensagem: 'Quem é você?' },
        { tipo: 'Despedida', mensagem: 'Tchau, até logo!' },
        { tipo: 'Emocional - medo', mensagem: 'Estou com medo do que pode acontecer...' },
        { tipo: 'Emocional - tristeza', mensagem: 'Perdi alguém importante recentemente...' },
        { tipo: 'Emocional - felicidade', mensagem: 'Consegui algo incrível hoje!' },
        { tipo: 'Exploração - história', mensagem: 'Conte-me sobre seu passado.' },
        { tipo: 'Exploração - objetivos', mensagem: 'Quais são seus objetivos?' },
        { tipo: 'Exploração - mundo', mensagem: 'O que você sabe sobre este mundo?' },
        { tipo: 'Complexa - dilema moral', mensagem: 'Se você tivesse que escolher entre salvar uma pessoa ou salvar muitas, o que faria?' },
        { tipo: 'Complexa - filosofia', mensagem: 'O que significa ser forte para você?' },
        { tipo: 'Complexa - política', mensagem: 'O que você acha da Associação de Caçadores?' }
    ];

    for (const teste of tiposConversa) {
        log('\n--- ' + teste.tipo + ' ---');

        try {
            const contexto = {
                npc: npcTeste,
                jogador: null,
                historico: [],
                memorias: [],
                favorabilidade: { nivel: 0, titulo: 'Desconhecido' },
                estadoEmocional: { humor: 'Neutro' },
                missaoAtual: null,
                mundo: { local: null, horario: null, clima: null }
            };

            // Analisar intenção
            const analiseIntencao = intentAnalyzer.analisar(teste.mensagem);
            log('  Intenção: ' + analiseIntencao.categoria + ' (confiança: ' + analiseIntencao.confianca + '%)');

            // Analisar complexidade
            const analiseComplexidade = complexityAnalyzer.analisar(teste.mensagem, { historico: [] });
            log('  Complexidade: ' + analiseComplexidade.pontuacao + '/100 (' + analiseComplexidade.classificacao + ')');

            // Decidir thinking
            const decisao = thinkingDecisionEngine.decidir({
                mensagem: teste.mensagem,
                analiseIntencao: analiseIntencao,
                analiseComplexidade: analiseComplexidade,
                jogadorId: 'teste',
                npcId: npcTeste.id,
                historico: []
            });
            log('  Thinking: ' + decisao.thinking + ' (motivo: ' + decisao.motivo + ')');

            // Construir prompt
            const prompt = construirPrompt(contexto, teste.mensagem);
            log('  Prompt: ' + prompt.length + ' caracteres, ~' + Math.floor(prompt.length / 4) + ' tokens');

            registrarResultado('Teste ' + teste.tipo + ' - intenção identificada', analiseIntencao.categoria.length > 0);
            registrarResultado('Teste ' + teste.tipo + ' - complexidade calculada', analiseComplexidade.pontuacao >= 0);
            registrarResultado('Teste ' + teste.tipo + ' - thinking decidido', decisao.thinking !== undefined);
            registrarResultado('Teste ' + teste.tipo + ' - prompt construído', prompt.length > 0);

        } catch (erro) {
            registrarResultado('Teste ' + teste.tipo, false, erro.message);
        }
    }
}

// =====================================
// 4. THINKING DINÂMICO
// =====================================
function testarThinkingDinamico() {
    log('\n═══════════════════════════════════════════');
    log('  4. THINKING DINÂMICO');
    log('═══════════════════════════════════════════\n');

    const mensagensTeste = [
        { msg: 'Oi', esperado: false, tipo: 'Cumprimento' },
        { msg: 'Tchau', esperado: false, tipo: 'Despedida' },
        { msg: 'Quem é você?', esperado: true, tipo: 'Pergunta pessoal' },
        { msg: 'Conte sua história', esperado: true, tipo: 'História' },
        { msg: 'Você confia em mim?', esperado: true, tipo: 'Relacionamento' },
        { msg: 'O que aconteceu na guerra?', esperado: true, tipo: 'Passado' },
        { msg: 'Obrigado pela ajuda', esperado: false, tipo: 'Agradecimento' },
        { msg: 'Qual a melhor estratégia para derrotar o boss?', esperado: true, tipo: 'Estratégia' }
    ];

    for (const teste of mensagensTeste) {
        const analiseIntencao = intentAnalyzer.analisar(teste.msg);
        const analiseComplexidade = complexityAnalyzer.analisar(teste.msg, { historico: [] });
        const decisao = thinkingDecisionEngine.decidir({
            mensagem: teste.msg,
            analiseIntencao: analiseIntencao,
            analiseComplexidade: analiseComplexidade,
            jogadorId: 'teste',
            npcId: 'teste',
            historico: []
        });

        log('  ' + teste.tipo + ': thinking=' + decisao.thinking + ' (esperado: ' + teste.esperado + ')');
        log('    Intenção: ' + analiseIntencao.categoria + ' | Complexidade: ' + analiseComplexidade.pontuacao + ' | Motivo: ' + decisao.motivo);

        registrarResultado('Thinking ' + teste.tipo, decisao.thinking === teste.esperado, 'Esperado: ' + teste.esperado + ', obtido: ' + decisao.thinking);
    }
}

// =====================================
// 5. MEMÓRIA E CONTEXTO
// =====================================
async function testarMemoriaContexto() {
    log('\n═══════════════════════════════════════════');
    log('  5. MEMÓRIA E CONTEXTO');
    log('═══════════════════════════════════════════\n');

    const npcs = NPCManager.listarNPCs();

    for (const npc of npcs) {
        try {
            const contexto = await obterContexto(npc.id, 'teste_auditoria');

            registrarResultado('Contexto de ' + npc.nome + ' - NPC carregado', contexto.npc !== null);
            registrarResultado('Contexto de ' + npc.nome + ' - histórico presente', Array.isArray(contexto.historico));
            registrarResultado('Contexto de ' + npc.nome + ' - memórias presente', Array.isArray(contexto.memorias));
            registrarResultado('Contexto de ' + npc.nome + ' - favorabilidade presente', contexto.favorabilidade !== undefined);
            registrarResultado('Contexto de ' + npc.nome + ' - estado emocional presente', contexto.estadoEmocional !== undefined);
            registrarResultado('Contexto de ' + npc.nome + ' - mundo presente', contexto.mundo !== undefined);

        } catch (erro) {
            registrarResultado('Contexto de ' + npc.nome, false, erro.message);
        }
    }
}

// =====================================
// 6. PROMPT FINAL
// =====================================
function testarPromptFinal() {
    log('\n═══════════════════════════════════════════');
    log('  6. PROMPT FINAL');
    log('═══════════════════════════════════════════\n');

    const npcs = NPCManager.listarNPCs();
    const npcTeste = npcs[0];

    const contexto = {
        npc: npcTeste,
        jogador: null,
        historico: [],
        memorias: [],
        favorabilidade: { nivel: 0, titulo: 'Desconhecido' },
        estadoEmocional: { humor: 'Neutro' },
        missaoAtual: null,
        mundo: { local: null, horario: null, clima: null }
    };

    const inicio = Date.now();
    const prompt = construirPrompt(contexto, 'Olá, como vai?');
    const tempo = Date.now() - inicio;

    log('  Tamanho do prompt: ' + prompt.length + ' caracteres');
    log('  Tokens estimados: ' + Math.floor(prompt.length / 4));
    log('  Tempo de montagem: ' + tempo + 'ms');

    // Verificar se o prompt contém as seções esperadas
    const secoes = ['IDENTIDADE', 'APARÊNCIA', 'HISTÓRIA', 'PERSONALIDADE', 'FORMA DE FALAR', 'OBJETIVOS', 'JOGADOR', 'RELACIONAMENTO', 'HUMOR', 'MISSÃO', 'MUNDO', 'MEMÓRIAS', 'HISTÓRICO', 'DIREÇÃO DA CENA', 'DIREÇÃO DA RESPOSTA', 'MENSAGEM ATUAL'];

    for (const secao of secoes) {
        const presente = prompt.toUpperCase().includes(secao);
        registrarResultado('Seção ' + secao + ' no prompt', presente);
    }

    // Verificar formatação
    registrarResultado('Prompt menciona _ para narrativa', prompt.includes('_'));
    registrarResultado('Prompt menciona * para fala', prompt.includes('*'));
    registrarResultado('Prompt menciona português do Brasil', prompt.toLowerCase().includes('português do brasil'));
}

// =====================================
// 7. RESPOSTA E FORMATAÇÃO
// =====================================
function testarRespostaFormatacao() {
    log('\n═══════════════════════════════════════════');
    log('  7. RESPOSTA E FORMATAÇÃO');
    log('═══════════════════════════════════════════\n');

    const npcs = NPCManager.listarNPCs();

    for (const npc of npcs) {
        const respostaTeste = '_Ela sorri suavemente._\n\n*"Olá, como posso ajudar?"*';
        const formatada = formatarMensagem(npc, respostaTeste);

        registrarResultado('Formatação de ' + npc.nome + ' - resposta não vazia', formatada.length > 0);
        registrarResultado('Formatação de ' + npc.nome + ' - nome na moldura', formatada.includes(npc.nome));
        registrarResultado('Formatação de ' + npc.nome + ' - narrativa com _', formatada.includes('_Ela sorri'));
        registrarResultado('Formatação de ' + npc.nome + ' - fala com *', formatada.includes('*"Olá'));
    }
}

// =====================================
// 8. ROBUSTEZ
// =====================================
function testarRobustez() {
    log('\n═══════════════════════════════════════════');
    log('  8. ROBUSTEZ');
    log('═══════════════════════════════════════════\n');

    const mensagensRobustez = [
        { msg: 'Oi', desc: 'Mensagem muito curta' },
        { msg: 'A'.repeat(2000), desc: 'Mensagem muito longa (2000 chars)' },
        { msg: 'Primeiro parágrafo.\n\nSegundo parágrafo.\n\nTerceiro parágrafo.', desc: 'Múltiplos parágrafos' },
        { msg: 'Olá 😊 como vai? 🎉', desc: 'Com emojis' },
        { msg: 'isso é uma frase sem pontuação', desc: 'Pontuação incompleta' },
        { msg: 'Pergunta 1? Pergunta 2? Pergunta 3?', desc: 'Perguntas consecutivas' },
        { msg: 'Estávamos falando de combate... e agora? O que acha do clima?', desc: 'Mudança brusca de assunto' }
    ];

    for (const teste of mensagensRobustez) {
        try {
            const analiseIntencao = intentAnalyzer.analisar(teste.msg);
            const analiseComplexidade = complexityAnalyzer.analisar(teste.msg, { historico: [] });
            const decisao = thinkingDecisionEngine.decidir({
                mensagem: teste.msg,
                analiseIntencao: analiseIntencao,
                analiseComplexidade: analiseComplexidade,
                jogadorId: 'teste',
                npcId: 'teste',
                historico: []
            });

            registrarResultado('Robustez - ' + teste.desc, analiseIntencao.categoria.length > 0 && decisao.thinking !== undefined);
        } catch (erro) {
            registrarResultado('Robustez - ' + teste.desc, false, erro.message);
        }
    }
}

// =====================================
// EXECUTAR TODOS OS TESTES
// =====================================
async function executarTodos() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     BATERIA COMPLETA DE TESTES DO SISTEMA DE DIÁLOGO        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    testarReconhecimentoComando();
    testarReconhecimentoMensagem();
    await testarTiposConversa();
    testarThinkingDinamico();
    await testarMemoriaContexto();
    testarPromptFinal();
    testarRespostaFormatacao();
    testarRobustez();

    // Relatório final
    console.log('\n═══════════════════════════════════════════');
    console.log('  RELATÓRIO FINAL');
    console.log('═══════════════════════════════════════════\n');
    console.log('  Total de testes: ' + relatorio.totalTestes);
    console.log('  Aprovados: ' + relatorio.aprovados);
    console.log('  Reprovados: ' + relatorio.reprovados);

    if (relatorio.falhas.length > 0) {
        console.log('\n  FALHAS ENCONTRADAS:');
        for (const falha of relatorio.falhas) {
            console.log('    ✗ ' + falha.nome + ': ' + falha.detalhes);
        }
    }

    console.log('\n  FIM DA BATERIA DE TESTES');
}

executarTodos();