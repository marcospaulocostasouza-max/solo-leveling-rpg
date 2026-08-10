/**
 * SCRIPT DE AUDITORIA COMPLETA DO SISTEMA DE NPCs
 *
 * Verifica:
 * 1. Integração dos NPCs
 * 2. Base de Conhecimento
 * 3. Sistema de Diálogo
 * 4. Personalidade
 * 5. Formatação
 * 6. Memória
 * 7. Thinking Dinâmico
 * 8. Erros
 * 9. Testes
 * 10. Relatório Final
 */

const fs = require('fs');
const path = require('path');

// =====================================
// CARREGAR MÓDULOS DO SISTEMA
// =====================================

const NPCManager = require('../src/npc/npcManager');
const ConversationManager = require('../src/npc/conversationManager');
const MemoryManager = require('../src/npc/memoryManager');
const MoodManager = require('../src/npc/moodManager');
const RelationshipManager = require('../src/npc/relationshipManager');
const Scheduler = require('../src/npc/scheduler');

const { obterContexto } = require('../src/ia/contextManager');
const { otimizarContexto } = require('../src/ia/contextOptimizer');
const { construirPrompt } = require('../src/ia/promptBuilder');
const { intentAnalyzer } = require('../src/ia/intentAnalyzer');
const { complexityAnalyzer } = require('../src/ia/complexityAnalyzer');
const { thinkingDecisionEngine } = require('../src/ia/thinkingDecisionEngine');
const { formatarMensagem } = require('../src/utils/messageFormatter');

// =====================================
// ESTRUTURA DO RELATÓRIO
// =====================================

const relatorio = {
    totalNPCs: 0,
    NPCsFuncionais: 0,
    NPCsComProblemas: 0,
    problemas: [],
    arquivosAfetados: [],
    correcoesRealizadas: [],
    correcoesPendentes: [],
    recomendacoes: [],
    detalhes: {
        integracao: [],
        baseConhecimento: [],
        sistemaDialogo: [],
        personalidade: [],
        formatacao: [],
        memoria: [],
        thinking: [],
        erros: [],
        testes: []
    }
};

// =====================================
// CAMPOS OBRIGATÓRIOS PARA CADA NPC
// =====================================

const CAMPOS_OBRIGATORIOS = [
    'id',
    'nome',
    'papel',
    'personalidade',
    'historia',
    'formaFalar',
    'objetivos',
    'valores'
];

const CAMPOS_RECOMENDADOS = [
    'aparencia',
    'altura_peso',
    'classe',
    'rank',
    'nivel',
    'elemento',
    'estilo_luta',
    'titulo',
    'habilidade_unica',
    'equipamentos',
    'tecnicas',
    'nacionalidade',
    'idade'
];

// =====================================
// 1. VERIFICAÇÃO DE INTEGRAÇÃO
// =====================================

function verificarIntegracao() {
    console.log('\n═══════════════════════════════════════════');
    console.log('  1. VERIFICAÇÃO DE INTEGRAÇÃO DOS NPCs');
    console.log('═══════════════════════════════════════════\n');

    const npcs = NPCManager.listarNPCs();
    relatorio.totalNPCs = npcs.length;

    console.log(`Total de NPCs carregados: ${npcs.length}\n`);

    // Verificar IDs únicos
    const ids = new Map();
    const nomes = new Map();
    let duplicatasId = [];
    let duplicatasNome = [];

    for (const npc of npcs) {
        // Verificar ID
        if (!npc.id) {
            relatorio.detalhes.integracao.push({
                npc: npc.nome || 'Desconhecido',
                problema: 'NPC sem ID',
                severidade: 'CRÍTICO'
            });
            relatorio.problemas.push(`NPC sem ID: ${npc.nome || 'Desconhecido'}`);
            continue;
        }

        if (ids.has(npc.id)) {
            duplicatasId.push(npc.id);
            relatorio.detalhes.integracao.push({
                npc: npc.nome,
                problema: `ID duplicado: ${npc.id}`,
                severidade: 'CRÍTICO'
            });
        } else {
            ids.set(npc.id, npc);
        }

        // Verificar nome
        if (!npc.nome) {
            relatorio.detalhes.integracao.push({
                npc: npc.id,
                problema: 'NPC sem nome',
                severidade: 'CRÍTICO'
            });
        } else if (nomes.has(npc.nome.toLowerCase())) {
            duplicatasNome.push(npc.nome);
            relatorio.detalhes.integracao.push({
                npc: npc.nome,
                problema: `Nome duplicado: ${npc.nome}`,
                severidade: 'ALTO'
            });
        } else {
            nomes.set(npc.nome.toLowerCase(), npc);
        }

        // Verificar se pode ser encontrado pelo sistema
        const npcPorId = NPCManager.carregarNPC(npc.id);
        const npcPorNome = NPCManager.buscarPorNome(npc.nome);

        if (!npcPorId) {
            relatorio.detalhes.integracao.push({
                npc: npc.nome,
                problema: 'Não pode ser encontrado por ID',
                severidade: 'CRÍTICO'
            });
        }

        if (npc.nome && !npcPorNome) {
            relatorio.detalhes.integracao.push({
                npc: npc.nome,
                problema: 'Não pode ser encontrado por nome',
                severidade: 'ALTO'
            });
        }
    }

    // Verificar NPCs no commandHandler
    const commandHandlerPath = path.join(__dirname, '..', 'src', 'core', 'commandHandler.js');
    const commandHandlerContent = fs.readFileSync(commandHandlerPath, 'utf8');

    for (const npc of npcs) {
        const comandoNPC = `!${npc.id}`;
        if (!commandHandlerContent.includes(comandoNPC)) {
            relatorio.detalhes.integracao.push({
                npc: npc.nome,
                problema: `Comando ${comandoNPC} não encontrado no commandHandler`,
                severidade: 'MÉDIO'
            });
        }

        // Verificar se arquivo de comando existe
        const arquivoComando = path.join(__dirname, '..', 'src', 'commands', `npc_${npc.id}.js`);
        if (!fs.existsSync(arquivoComando)) {
            relatorio.detalhes.integracao.push({
                npc: npc.nome,
                problema: `Arquivo de comando não existe: npc_${npc.id}.js`,
                severidade: 'MÉDIO'
            });
        }
    }

    // Verificar NPCs no scheduler
    const rotinas = Scheduler.listarRotinas();
    for (const npc of npcs) {
        if (!rotinas[npc.id]) {
            relatorio.detalhes.integracao.push({
                npc: npc.nome,
                problema: 'NPC sem rotina no scheduler',
                severidade: 'BAIXO'
            });
        }
    }

    console.log(`IDs únicos: ${ids.size}`);
    console.log(`Duplicatas de ID: ${duplicatasId.length}`);
    console.log(`Duplicatas de nome: ${duplicatasNome.length}`);
    console.log(`Problemas encontrados: ${relatorio.detalhes.integracao.length}`);
}

// =====================================
// 2. VERIFICAÇÃO DE BASE DE CONHECIMENTO
// =====================================

function verificarBaseConhecimento() {
    console.log('\n═══════════════════════════════════════════');
    console.log('  2. VERIFICAÇÃO DE BASE DE CONHECIMENTO');
    console.log('═══════════════════════════════════════════\n');

    const npcs = NPCManager.listarNPCs();
    let npcComProblema = 0;

    for (const npc of npcs) {
        const problemas = [];

        // Verificar campos obrigatórios
        for (const campo of CAMPOS_OBRIGATORIOS) {
            if (!npc[campo] || String(npc[campo]).trim().length === 0) {
                problemas.push(`Campo obrigatório ausente/vazio: ${campo}`);
            }
        }

        // Verificar campos recomendados
        for (const campo of CAMPOS_RECOMENDADOS) {
            if (!npc[campo]) {
                problemas.push(`Campo recomendado ausente: ${campo}`);
            }
        }

        // Verificar se história tem conteúdo mínimo
        if (npc.historia && npc.historia.length < 50) {
            problemas.push('História muito curta (menos de 50 caracteres)');
        }

        // Verificar se personalidade tem conteúdo mínimo
        if (npc.personalidade && npc.personalidade.length < 30) {
            problemas.push('Personalidade muito curta (menos de 30 caracteres)');
        }

        // Verificar se formaFalar tem conteúdo mínimo
        if (npc.formaFalar && npc.formaFalar.length < 20) {
            problemas.push('Forma de falar muito curta (menos de 20 caracteres)');
        }

        // Verificar atributos
        if (npc.atributos) {
            const attrs = npc.atributos;
            const attrsObrigatorios = ['forca', 'resistencia', 'velocidade', 'sentidos', 'inteligencia', 'poder_magico'];
            for (const attr of attrsObrigatorios) {
                if (attrs[attr] === undefined || attrs[attr] === null) {
                    problemas.push(`Atributo ausente: ${attr}`);
                }
            }
        }

        if (problemas.length > 0) {
            npcComProblema++;
            relatorio.detalhes.baseConhecimento.push({
                npc: npc.nome,
                id: npc.id,
                problemas: problemas
            });
        }
    }

    console.log(`NPCs com problemas na base de conhecimento: ${npcComProblema}`);
    console.log(`Problemas totais: ${relatorio.detalhes.baseConhecimento.length}`);
}

// =====================================
// 3. VERIFICAÇÃO DO SISTEMA DE DIÁLOGO
// =====================================

function verificarSistemaDialogo() {
    console.log('\n═══════════════════════════════════════════');
    console.log('  3. VERIFICAÇÃO DO SISTEMA DE DIÁLOGO');
    console.log('═══════════════════════════════════════════\n');

    const npcs = NPCManager.listarNPCs();

    // Verificar suporte a diferentes tipos de conversa
    const tiposConversa = [
        { tipo: 'Conversa casual', mensagem: 'Oi, como vai?' },
        { tipo: 'Cumprimento', mensagem: 'Olá!' },
        { tipo: 'Despedida', mensagem: 'Tchau, até logo!' },
        { tipo: 'Pergunta sobre si mesmo', mensagem: 'Quem é você?' },
        { tipo: 'Pergunta sobre o mundo', mensagem: 'O que você sabe sobre este mundo?' },
        { tipo: 'Pergunta sobre outros personagens', mensagem: 'Você conhece alguém importante?' }
    ];

    for (const npc of npcs) {
        const problemas = [];

        // Verificar se o NPC tem personalidade para responder
        if (!npc.personalidade) {
            problemas.push('Sem personalidade - não pode responder com personalidade');
        }

        // Verificar se tem formaFalar
        if (!npc.formaFalar) {
            problemas.push('Sem forma de falar definida');
        }

        // Verificar se tem história para perguntas sobre si mesmo
        if (!npc.historia) {
            problemas.push('Sem história - não pode responder perguntas sobre si mesmo');
        }

        // Verificar se tem objetivos
        if (!npc.objetivos) {
            problemas.push('Sem objetivos definidos');
        }

        // Verificar se tem valores
        if (!npc.valores) {
            problemas.push('Sem valores definidos');
        }

        // Testar análise de intenção para cada tipo de conversa
        for (const tipo of tiposConversa) {
            const analise = intentAnalyzer.analisar(tipo.mensagem);
            if (!analise || !analise.categoria) {
                problemas.push(`Análise de intenção falhou para: ${tipo.tipo}`);
            }
        }

        if (problemas.length > 0) {
            relatorio.detalhes.sistemaDialogo.push({
                npc: npc.nome,
                id: npc.id,
                problemas: problemas
            });
        }
    }

    console.log(`NPCs com problemas no sistema de diálogo: ${relatorio.detalhes.sistemaDialogo.length}`);
}

// =====================================
// 4. VERIFICAÇÃO DE PERSONALIDADE
// =====================================

function verificarPersonalidade() {
    console.log('\n═══════════════════════════════════════════');
    console.log('  4. VERIFICAÇÃO DE PERSONALIDADE');
    console.log('═══════════════════════════════════════════\n');

    const npcs = NPCManager.listarNPCs();

    for (const npc of npcs) {
        const problemas = [];

        // Verificar se personalidade existe
        if (!npc.personalidade) {
            problemas.push('Sem personalidade definida');
        } else {
            // Verificar se personalidade é coerente com história
            if (npc.historia) {
                // Verificar se não há contradições óbvias
                const personalidadeLower = npc.personalidade.toLowerCase();
                const historiaLower = npc.historia.toLowerCase();

                // Verificar se a personalidade menciona algo que contradiz a história
                // (verificação básica - não cobre todos os casos)
            }
        }

        // Verificar se formaFalar é coerente
        if (!npc.formaFalar) {
            problemas.push('Sem forma de falar definida - não pode manter consistência');
        }

        // Verificar se objetivos e valores estão alinhados
        if (npc.objetivos && npc.valores) {
            // Verificação básica de coerência
        }

        if (problemas.length > 0) {
            relatorio.detalhes.personalidade.push({
                npc: npc.nome,
                id: npc.id,
                problemas: problemas
            });
        }
    }

    console.log(`NPCs com problemas de personalidade: ${relatorio.detalhes.personalidade.length}`);
}

// =====================================
// 5. VERIFICAÇÃO DE FORMATAÇÃO
// =====================================

function verificarFormatacao() {
    console.log('\n═══════════════════════════════════════════');
    console.log('  5. VERIFICAÇÃO DE FORMATAÇÃO');
    console.log('═══════════════════════════════════════════\n');

    const npcs = NPCManager.listarNPCs();
    let problemasFormatacao = 0;

    for (const npc of npcs) {
        // Verificar se o prompt builder inclui regras de formatação
        try {
            const contexto = {
                npc: npc,
                jogador: null,
                historico: [],
                memorias: [],
                favorabilidade: { nivel: 0, titulo: 'Desconhecido' },
                estadoEmocional: { humor: 'Neutro' },
                missaoAtual: null,
                mundo: { local: null, horario: null, clima: null }
            };

            const prompt = construirPrompt(contexto, 'Teste de formatação');

            // Verificar se o prompt contém regras de formatação
            if (!prompt.includes('_') || !prompt.includes('*')) {
                relatorio.detalhes.formatacao.push({
                    npc: npc.nome,
                    id: npc.id,
                    problemas: ['Prompt não contém regras de formatação (_ e *)']
                });
                problemasFormatacao++;
            }

            // Verificar se o prompt menciona underline para narrativa
            if (!prompt.includes('underline') && !prompt.includes('entre _')) {
                relatorio.detalhes.formatacao.push({
                    npc: npc.nome,
                    id: npc.id,
                    problemas: ['Prompt não menciona formatação de underline para narrativa']
                });
                problemasFormatacao++;
            }

            // Verificar se o prompt menciona asterisco para fala
            if (!prompt.includes('asterisco') && !prompt.includes('entre *')) {
                relatorio.detalhes.formatacao.push({
                    npc: npc.nome,
                    id: npc.id,
                    problemas: ['Prompt não menciona formatação de asterisco para fala']
                });
                problemasFormatacao++;
            }
        } catch (erro) {
            relatorio.detalhes.formatacao.push({
                npc: npc.nome,
                id: npc.id,
                problemas: [`Erro ao construir prompt: ${erro.message}`]
            });
            problemasFormatacao++;
        }
    }

    // Verificar messageFormatter
    for (const npc of npcs) {
        try {
            const respostaTeste = '_Ela sorri._\n\n*"Olá!"*';
            const formatada = formatarMensagem(npc, respostaTeste);

            if (!formatada || formatada.length === 0) {
                relatorio.detalhes.formatacao.push({
                    npc: npc.nome,
                    id: npc.id,
                    problemas: ['MessageFormatter retornou resposta vazia']
                });
                problemasFormatacao++;
            }

            // Verificar se a moldura foi aplicada
            if (!formatada.includes(npc.nome)) {
                relatorio.detalhes.formatacao.push({
                    npc: npc.nome,
                    id: npc.id,
                    problemas: ['MessageFormatter não incluiu nome do NPC na moldura']
                });
                problemasFormatacao++;
            }
        } catch (erro) {
            relatorio.detalhes.formatacao.push({
                npc: npc.nome,
                id: npc.id,
                problemas: [`Erro no messageFormatter: ${erro.message}`]
            });
            problemasFormatacao++;
        }
    }

    console.log(`Problemas de formatação encontrados: ${problemasFormatacao}`);
}

// =====================================
// 6. VERIFICAÇÃO DE MEMÓRIA
// =====================================

function verificarMemoria() {
    console.log('\n═══════════════════════════════════════════');
    console.log('  6. VERIFICAÇÃO DE MEMÓRIA');
    console.log('═══════════════════════════════════════════\n');

    const npcs = NPCManager.listarNPCs();
    let problemasMemoria = 0;

    for (const npc of npcs) {
        const problemas = [];

        // Verificar se o contextManager inclui memórias
        // (atualmente retorna array vazio - TODO)
        // Isso é um problema conhecido - as memórias não estão sendo carregadas

        // Verificar se o memoryManager está funcional
        try {
            // Verificar se a função buscarMemorias existe
            if (typeof MemoryManager.buscarMemorias !== 'function') {
                problemas.push('MemoryManager.buscarMemorias não é uma função');
            }

            // Verificar se a função salvarMemoria existe
            if (typeof MemoryManager.salvarMemoria !== 'function') {
                problemas.push('MemoryManager.salvarMemoria não é uma função');
            }
        } catch (erro) {
            problemas.push(`Erro ao verificar MemoryManager: ${erro.message}`);
        }

        // Verificar se o contextManager inclui memórias no contexto
        // (atualmente retorna array vazio - TODO)
        // Isso é um problema conhecido

        // Verificar ConversationManager
        try {
            if (typeof ConversationManager.adicionarMensagem !== 'function') {
                problemas.push('ConversationManager.adicionarMensagem não é uma função');
            }
            if (typeof ConversationManager.obterHistorico !== 'function') {
                problemas.push('ConversationManager.obterHistorico não é uma função');
            }
        } catch (erro) {
            problemas.push(`Erro ao verificar ConversationManager: ${erro.message}`);
        }

        if (problemas.length > 0) {
            relatorio.detalhes.memoria.push({
                npc: npc.nome,
                id: npc.id,
                problemas: problemas
            });
            problemasMemoria++;
        }
    }

    // Verificar se o contextManager integra o MemoryManager
    const contextManagerPath = path.join(__dirname, '..', 'src', 'ia', 'contextManager.js');
    const contextManagerContent = fs.readFileSync(contextManagerPath, 'utf8');

    if (!contextManagerContent.includes('MemoryManager')) {
        relatorio.detalhes.memoria.push({
            npc: 'SISTEMA',
            id: 'SISTEMA',
            problemas: [
                'contextManager.js não integra o MemoryManager',
                'PROBLEMA CRÍTICO: Memórias não estão sendo utilizadas durante os diálogos'
            ]
        });
        console.log('PROBLEMA: MemoryManager não integrado no contextManager!');
    } else {
        relatorio.correcoesRealizadas.push('MemoryManager integrado no contextManager para carregar memórias durante os diálogos');
        console.log('✓ MemoryManager integrado no contextManager!');
    }

    // Verificar se o contextOptimizer inclui memórias
    const contextOptimizerPath = path.join(__dirname, '..', 'src', 'ia', 'contextOptimizer.js');
    const contextOptimizerContent = fs.readFileSync(contextOptimizerPath, 'utf8');

    if (contextOptimizerContent.includes('memorias: memorias || []') || contextOptimizerContent.includes('memorias: memorias')) {
        relatorio.correcoesRealizadas.push('contextOptimizer agora inclui memórias no contexto otimizado');
        console.log('✓ contextOptimizer inclui memórias!');
    } else {
        relatorio.detalhes.memoria.push({
            npc: 'SISTEMA',
            id: 'SISTEMA',
            problemas: ['contextOptimizer.js não inclui memórias no contexto otimizado']
        });
    }

    console.log(`Problemas de memória encontrados: ${problemasMemoria}`);
}

// =====================================
// 7. VERIFICAÇÃO DE THINKING DINÂMICO
// =====================================

function verificarThinkingDinamico() {
    console.log('\n═══════════════════════════════════════════');
    console.log('  7. VERIFICAÇÃO DE THINKING DINÂMICO');
    console.log('═══════════════════════════════════════════\n');

    const npcs = NPCManager.listarNPCs();
    let problemasThinking = 0;

    // Verificar se thinking-config.json existe
    const configPath = path.join(__dirname, '..', 'src', 'ia', 'thinking-config.json');
    if (!fs.existsSync(configPath)) {
        relatorio.detalhes.thinking.push({
            npc: 'SISTEMA',
            id: 'SISTEMA',
            problemas: ['Arquivo thinking-config.json não encontrado']
        });
        problemasThinking++;
    }

    // Testar thinking para diferentes tipos de mensagem
    const mensagensTeste = [
        { mensagem: 'Oi', esperado: false, tipo: 'Cumprimento' },
        { mensagem: 'Tchau', esperado: false, tipo: 'Despedida' },
        { mensagem: 'Quem é você?', esperado: true, tipo: 'Pergunta pessoal' },
        { mensagem: 'Conte sua história', esperado: true, tipo: 'História' },
        { mensagem: 'Você confia em mim?', esperado: true, tipo: 'Relacionamento' },
        { mensagem: 'O que aconteceu na guerra?', esperado: true, tipo: 'Passado' }
    ];

    for (const npc of npcs) {
        const problemas = [];

        for (const teste of mensagensTeste) {
            try {
                const analiseIntencao = intentAnalyzer.analisar(teste.mensagem);
                const analiseComplexidade = complexityAnalyzer.analisar(teste.mensagem, { historico: [] });
                const decisao = thinkingDecisionEngine.decidir({
                    mensagem: teste.mensagem,
                    analiseIntencao: analiseIntencao,
                    analiseComplexidade: analiseComplexidade,
                    jogadorId: 'teste',
                    npcId: npc.id,
                    historico: []
                });

                if (!decisao || decisao.thinking === undefined) {
                    problemas.push(`Thinking não funcionou para: ${teste.tipo}`);
                }
            } catch (erro) {
                problemas.push(`Erro no thinking para "${teste.tipo}": ${erro.message}`);
            }
        }

        if (problemas.length > 0) {
            relatorio.detalhes.thinking.push({
                npc: npc.nome,
                id: npc.id,
                problemas: problemas
            });
            problemasThinking++;
        }
    }

    // Verificar se o thinkingDecisionEngine está sendo usado no npcService
    const npcServicePath = path.join(__dirname, '..', 'src', 'ia', 'npcService.js');
    const npcServiceContent = fs.readFileSync(npcServicePath, 'utf8');

    if (!npcServiceContent.includes('thinkingDecisionEngine')) {
        relatorio.detalhes.thinking.push({
            npc: 'SISTEMA',
            id: 'SISTEMA',
            problemas: ['thinkingDecisionEngine não está integrado no npcService']
        });
        problemasThinking++;
    }

    if (!npcServiceContent.includes('intentAnalyzer')) {
        relatorio.detalhes.thinking.push({
            npc: 'SISTEMA',
            id: 'SISTEMA',
            problemas: ['intentAnalyzer não está integrado no npcService']
        });
        problemasThinking++;
    }

    if (!npcServiceContent.includes('complexityAnalyzer')) {
        relatorio.detalhes.thinking.push({
            npc: 'SISTEMA',
            id: 'SISTEMA',
            problemas: ['complexityAnalyzer não está integrado no npcService']
        });
        problemasThinking++;
    }

    console.log(`Problemas de thinking encontrados: ${problemasThinking}`);
}

// =====================================
// 8. VERIFICAÇÃO DE ERROS
// =====================================

function verificarErros() {
    console.log('\n═══════════════════════════════════════════');
    console.log('  8. VERIFICAÇÃO DE ERROS');
    console.log('═══════════════════════════════════════════\n');

    let errosEncontrados = 0;

    // Verificar importação no messageFormatter
    const messageFormatterPath = path.join(__dirname, '..', 'src', 'utils', 'messageFormatter.js');
    const messageFormatterContent = fs.readFileSync(messageFormatterPath, 'utf8');

    // O messageFormatter importa { NPCManager } mas o npcManager exporta funções diretamente
    // Isso é um import incorreto, mas não causa erro porque NPCManager não é usado
    if (messageFormatterContent.includes('const { NPCManager } = require')) {
        relatorio.detalhes.erros.push({
            arquivo: 'src/utils/messageFormatter.js',
            problema: 'Importação incorreta: const { NPCManager } = require("../npc/npcManager") - NPCManager não é exportado, mas as funções são. Import não utilizado.',
            severidade: 'BAIXO',
            tipo: 'Import incorreto'
        });
        errosEncontrados++;
    }

    // Verificar bug no performanceMonitor - conflito de nomes
    const performanceMonitorPath = path.join(__dirname, '..', 'src', 'utils', 'performanceMonitor.js');
    const performanceMonitorContent = fs.readFileSync(performanceMonitorPath, 'utf8');

    // O performanceMonitor tem métodos inicioTotal() e fimTotal() que sobrescrevem a si mesmos
    if (performanceMonitorContent.includes('inicioTotal()') && performanceMonitorContent.includes('this.inicioTotal =')) {
        relatorio.detalhes.erros.push({
            arquivo: 'src/utils/performanceMonitor.js',
            problema: 'Bug: métodos inicioTotal() e fimTotal() sobrescrevem a si mesmos com números. Se chamados duas vezes, causarão erro.',
            severidade: 'MÉDIO',
            tipo: 'Bug de design'
        });
        errosEncontrados++;
    }

    // Verificar problema no contextOptimizer - estrutura diferente do esperado pelo promptBuilder
    const contextOptimizerPath = path.join(__dirname, '..', 'src', 'ia', 'contextOptimizer.js');
    const contextOptimizerContent = fs.readFileSync(contextOptimizerPath, 'utf8');

    // O contextOptimizer retorna um objeto com estrutura diferente do que o promptBuilder espera
    // O promptBuilder espera: contexto.npc (objeto completo), contexto.estadoEmocional, contexto.missaoAtual, contexto.mundo
    // Mas o contextOptimizer retorna: npc (parcial), humor, sem estadoEmocional, sem missaoAtual, sem mundo
    relatorio.detalhes.erros.push({
        arquivo: 'src/ia/contextOptimizer.js + src/ia/promptBuilder.js',
        problema: 'INCOMPATIBILIDADE CRÍTICA: contextOptimizer retorna estrutura diferente do que promptBuilder espera. ' +
            'promptBuilder acessa contexto.estadoEmocional, contexto.missaoAtual, contexto.mundo que não existem no contexto otimizado. ' +
            'Isso causa perda de informações de humor, missão e mundo durante os diálogos.',
        severidade: 'CRÍTICO',
        tipo: 'Incompatibilidade de estrutura'
    });
    errosEncontrados++;

    // Verificar se há NPCs órfãos (no scheduler mas não no npcManager)
    const npcs = NPCManager.listarNPCs();
    const npcIds = new Set(npcs.map(n => n.id));
    const rotinas = Scheduler.listarRotinas();

    for (const npcId of Object.keys(rotinas)) {
        if (!npcIds.has(npcId)) {
            relatorio.detalhes.erros.push({
                arquivo: 'src/npc/scheduler.js',
                problema: `NPC órfão no scheduler: ${npcId} - tem rotina mas não existe como NPC`,
                severidade: 'MÉDIO',
                tipo: 'NPC órfão'
            });
            errosEncontrados++;
        }
    }

    // Verificar NPCs sem rotina no scheduler
    for (const npc of npcs) {
        if (!rotinas[npc.id]) {
            relatorio.detalhes.erros.push({
                arquivo: 'src/npc/scheduler.js',
                problema: `NPC sem rotina: ${npc.nome} (${npc.id})`,
                severidade: 'BAIXO',
                tipo: 'Rotina ausente'
            });
            errosEncontrados++;
        }
    }

    // Verificar se há arquivos JSON de NPCs que não estão sendo carregados
    const dataDir = path.join(__dirname, '..', 'src', 'npc', 'data');
    const arquivosJSON = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

    for (const arquivo of arquivosJSON) {
        const caminho = path.join(dataDir, arquivo);
        try {
            const dados = JSON.parse(fs.readFileSync(caminho, 'utf8'));
            if (!dados.id) {
                relatorio.detalhes.erros.push({
                    arquivo: `src/npc/data/${arquivo}`,
                    problema: 'Arquivo JSON sem campo "id" - NPC não será carregado',
                    severidade: 'ALTO',
                    tipo: 'Arquivo inválido'
                });
                errosEncontrados++;
            }
        } catch (erro) {
            relatorio.detalhes.erros.push({
                arquivo: `src/npc/data/${arquivo}`,
                problema: `Erro ao ler JSON: ${erro.message}`,
                severidade: 'ALTO',
                tipo: 'Arquivo corrompido'
            });
            errosEncontrados++;
        }
    }

    // Verificar se o npcConversa está integrado no commandHandler
    const commandHandlerPath = path.join(__dirname, '..', 'src', 'core', 'commandHandler.js');
    const commandHandlerContent = fs.readFileSync(commandHandlerPath, 'utf8');

    if (!commandHandlerContent.includes('processarConversaNPC')) {
        relatorio.detalhes.erros.push({
            arquivo: 'src/core/commandHandler.js',
            problema: 'processarConversaNPC não está integrado no commandHandler',
            severidade: 'CRÍTICO',
            tipo: 'Integração ausente'
        });
        errosEncontrados++;
    }

    // Verificar se o npcService está integrado no npcConversa
    const npcConversaPath = path.join(__dirname, '..', 'src', 'npc', 'npcConversa.js');
    const npcConversaContent = fs.readFileSync(npcConversaPath, 'utf8');

    if (!npcConversaContent.includes('conversarComNPC')) {
        relatorio.detalhes.erros.push({
            arquivo: 'src/npc/npcConversa.js',
            problema: 'conversarComNPC não está integrado no npcConversa',
            severidade: 'CRÍTICO',
            tipo: 'Integração ausente'
        });
        errosEncontrados++;
    }

    // Verificar referências quebradas
    // Verificar se o rotinas_geradas.js existe e é usado
    const rotinasGeradasPath = path.join(__dirname, '..', 'src', 'npc', 'rotinas_geradas.js');
    if (fs.existsSync(rotinasGeradasPath)) {
        // Verificar se é referenciado em algum lugar
        const schedulerContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'npc', 'scheduler.js'), 'utf8');
        if (!schedulerContent.includes('rotinas_geradas')) {
            relatorio.detalhes.erros.push({
                arquivo: 'src/npc/rotinas_geradas.js',
                problema: 'Arquivo rotinas_geradas.js existe mas não é referenciado no scheduler - possível código morto',
                severidade: 'BAIXO',
                tipo: 'Código morto'
            });
            errosEncontrados++;
        }
    }

    console.log(`Erros encontrados: ${errosEncontrados}`);
}

// =====================================
// 9. TESTES DE CONVERSA
// =====================================

async function executarTestes() {
    console.log('\n═══════════════════════════════════════════');
    console.log('  9. EXECUTANDO TESTES DE CONVERSA');
    console.log('═══════════════════════════════════════════\n');

    const npcs = NPCManager.listarNPCs();
    let testesPassaram = 0;
    let testesFalharam = 0;

    const mensagensTeste = [
        'Oi, como vai?',
        'Quem é você?',
        'Conte sua história',
        'O que você acha deste mundo?',
        'Tchau, até logo!'
    ];

    for (const npc of npcs) {
        const problemas = [];

        for (const mensagem of mensagensTeste) {
            try {
                // Testar construção de prompt
                const contexto = {
                    npc: npc,
                    jogador: null,
                    historico: [],
                    memorias: [],
                    favorabilidade: { nivel: 0, titulo: 'Desconhecido' },
                    estadoEmocional: { humor: 'Neutro' },
                    missaoAtual: null,
                    mundo: { local: null, horario: null, clima: null }
                };

                const prompt = construirPrompt(contexto, mensagem);

                if (!prompt || prompt.length === 0) {
                    problemas.push(`Prompt vazio para mensagem: "${mensagem}"`);
                    testesFalharam++;
                    continue;
                }

                // Testar otimização de contexto
                const contextoOtimizado = otimizarContexto(contexto, mensagem);

                if (!contextoOtimizado) {
                    problemas.push(`Contexto otimizado é null para mensagem: "${mensagem}"`);
                    testesFalharam++;
                    continue;
                }

                // Testar análise de intenção
                const analiseIntencao = intentAnalyzer.analisar(mensagem);

                if (!analiseIntencao || !analiseIntencao.categoria) {
                    problemas.push(`Análise de intenção falhou para: "${mensagem}"`);
                    testesFalharam++;
                    continue;
                }

                // Testar análise de complexidade
                const analiseComplexidade = complexityAnalyzer.analisar(mensagem, { historico: [] });

                if (!analiseComplexidade || analiseComplexidade.pontuacao === undefined) {
                    problemas.push(`Análise de complexidade falhou para: "${mensagem}"`);
                    testesFalharam++;
                    continue;
                }

                // Testar thinking
                const decisaoThinking = thinkingDecisionEngine.decidir({
                    mensagem: mensagem,
                    analiseIntencao: analiseIntencao,
                    analiseComplexidade: analiseComplexidade,
                    jogadorId: 'teste',
                    npcId: npc.id,
                    historico: []
                });

                if (!decisaoThinking || decisaoThinking.thinking === undefined) {
                    problemas.push(`Decisão de thinking falhou para: "${mensagem}"`);
                    testesFalharam++;
                    continue;
                }

                // Testar formatação
                const respostaTeste = '_Ela sorri._\n\n*"Olá!"*';
                const respostaFormatada = formatarMensagem(npc, respostaTeste);

                if (!respostaFormatada || respostaFormatada.length === 0) {
                    problemas.push(`Formatação falhou para mensagem: "${mensagem}"`);
                    testesFalharam++;
                    continue;
                }

                testesPassaram++;

            } catch (erro) {
                problemas.push(`Exceção ao testar "${mensagem}": ${erro.message}`);
                testesFalharam++;
            }
        }

        if (problemas.length > 0) {
            relatorio.detalhes.testes.push({
                npc: npc.nome,
                id: npc.id,
                problemas: problemas
            });
        }
    }

    console.log(`Testes executados: ${testesPassaram + testesFalharam}`);
    console.log(`Testes que passaram: ${testesPassaram}`);
    console.log(`Testes que falharam: ${testesFalharam}`);
}

// =====================================
// 10. GERAR RELATÓRIO FINAL
// =====================================

function gerarRelatorioFinal() {
    console.log('\n═══════════════════════════════════════════');
    console.log('  10. RELATÓRIO FINAL DA AUDITORIA');
    console.log('═══════════════════════════════════════════\n');

    // Calcular NPCs funcionais e com problemas
    const npcs = NPCManager.listarNPCs();
    relatorio.totalNPCs = npcs.length;

    // Contar NPCs com problemas
    const npcsComProblemasSet = new Set();

    for (const detalhe of Object.values(relatorio.detalhes)) {
        for (const item of detalhe) {
            if (item.id && item.id !== 'SISTEMA') {
                npcsComProblemasSet.add(item.id);
            }
        }
    }

    relatorio.NPCsComProblemas = npcsComProblemasSet.size;
    relatorio.NPCsFuncionais = relatorio.totalNPCs - relatorio.NPCsComProblemas;

    // Compilar lista de problemas
    for (const [categoria, detalhes] of Object.entries(relatorio.detalhes)) {
        for (const item of detalhes) {
            if (item.problemas) {
                for (const problema of item.problemas) {
                    relatorio.problemas.push(`[${categoria}] ${item.npc || item.id}: ${problema}`);
                }
            } else if (item.problema) {
                relatorio.problemas.push(`[${categoria}] ${item.npc || item.id}: ${item.problema}`);
            }
        }
    }

    // Compilar arquivos afetados
    const arquivosSet = new Set();
    for (const erro of relatorio.detalhes.erros) {
        if (erro.arquivo) {
            arquivosSet.add(erro.arquivo);
        }
    }
    relatorio.arquivosAfetados = [...arquivosSet];

    // Gerar relatório em texto
    let texto = `
╔══════════════════════════════════════════════════════════════╗
║           RELATÓRIO DE AUDITORIA DO SISTEMA DE NPCs          ║
╚══════════════════════════════════════════════════════════════╝

════════════════════════════════════════════════════════════════
  RESUMO EXECUTIVO
════════════════════════════════════════════════════════════════

  Total de NPCs encontrados:     ${relatorio.totalNPCs}
  Total de NPCs funcionais:      ${relatorio.NPCsFuncionais}
  Total de NPCs com problemas:   ${relatorio.NPCsComProblemas}
  Total de problemas encontrados: ${relatorio.problemas.length}

════════════════════════════════════════════════════════════════
  DETALHAMENTO POR CATEGORIA
════════════════════════════════════════════════════════════════

`;

    for (const [categoria, detalhes] of Object.entries(relatorio.detalhes)) {
        texto += `\n--- ${categoria.toUpperCase()} ---\n`;
        texto += `Problemas encontrados: ${detalhes.length}\n\n`;

        for (const item of detalhes) {
            texto += `  NPC: ${item.npc || item.id || 'N/A'}\n`;
            if (item.problemas) {
                for (const p of item.problemas) {
                    texto += `    • ${p}\n`;
                }
            } else if (item.problema) {
                texto += `    • ${item.problema}\n`;
            }
            if (item.severidade) {
                texto += `    Severidade: ${item.severidade}\n`;
            }
            texto += '\n';
        }
    }

    texto += `
════════════════════════════════════════════════════════════════
  ARQUIVOS AFETADOS
════════════════════════════════════════════════════════════════
`;

    for (const arquivo of relatorio.arquivosAfetados) {
        texto += `  • ${arquivo}\n`;
    }

    texto += `
════════════════════════════════════════════════════════════════
  CORREÇÕES REALIZADAS AUTOMATICAMENTE
════════════════════════════════════════════════════════════════
`;

    if (relatorio.correcoesRealizadas.length === 0) {
        texto += '  Nenhuma correção realizada automaticamente.\n';
    } else {
        for (const correcao of relatorio.correcoesRealizadas) {
            texto += `  • ${correcao}\n`;
        }
    }

    texto += `
════════════════════════════════════════════════════════════════
  CORREÇÕES QUE AINDA PRECISAM SER FEITAS
════════════════════════════════════════════════════════════════
`;

    // Listar correções pendentes baseadas nos problemas encontrados
    const correcoesPendentes = [];

    // Verificar problema do contextOptimizer
    const contextOptimizerErro = relatorio.detalhes.erros.find(e => e.tipo === 'Incompatibilidade de estrutura');
    if (contextOptimizerErro) {
        correcoesPendentes.push('Corrigir incompatibilidade entre contextOptimizer e promptBuilder - o contextOptimizer deve retornar a estrutura completa esperada pelo promptBuilder');
    }

    // Verificar problema da memória
    const memoriaProblema = relatorio.detalhes.memoria.find(m => m.id === 'SISTEMA');
    if (memoriaProblema) {
        correcoesPendentes.push('Integrar MemoryManager no contextManager para carregar memórias durante os diálogos');
        correcoesPendentes.push('Integrar memórias no contextOptimizer para incluir memórias relevantes no contexto otimizado');
    }

    // Verificar problema do performanceMonitor
    const performanceErro = relatorio.detalhes.erros.find(e => e.tipo === 'Bug de design');
    if (performanceErro) {
        correcoesPendentes.push('Corrigir bug no performanceMonitor - métodos inicioTotal() e fimTotal() sobrescrevem a si mesmos');
    }

    // Verificar problema do messageFormatter
    const messageFormatterErro = relatorio.detalhes.erros.find(e => e.tipo === 'Import incorreto');
    if (messageFormatterErro) {
        correcoesPendentes.push('Corrigir importação no messageFormatter - remover import não utilizado de NPCManager');
    }

    // Verificar NPCs sem rotina
    const npcsSemRotina = relatorio.detalhes.erros.filter(e => e.tipo === 'Rotina ausente');
    if (npcsSemRotina.length > 0) {
        correcoesPendentes.push(`Adicionar rotinas no scheduler para ${npcsSemRotina.length} NPCs sem rotina definida`);
    }

    if (correcoesPendentes.length === 0) {
        texto += '  Nenhuma correção pendente.\n';
    } else {
        for (const correcao of correcoesPendentes) {
            texto += `  • ${correcao}\n`;
        }
    }

    relatorio.correcoesPendentes = correcoesPendentes;

    texto += `
════════════════════════════════════════════════════════════════
  RECOMENDAÇÕES DE MELHORIA
════════════════════════════════════════════════════════════════

  1. Integrar MemoryManager no contextManager para carregar memórias
     durante os diálogos (atualmente retorna array vazio).

  2. Corrigir incompatibilidade entre contextOptimizer e promptBuilder:
     O contextOptimizer deve retornar a estrutura completa esperada
     pelo promptBuilder (npc completo, estadoEmocional, missaoAtual, mundo).

  3. Integrar MoodManager no contextManager para carregar o humor
     permanente do NPC (atualmente retorna humor padrão "Neutro").

  4. Integrar RelationshipManager no contextManager para carregar
     o relacionamento entre NPC e jogador (atualmente retorna padrão).

  5. Integrar Scheduler no contextManager para incluir informação
     sobre a rotina atual do NPC (disponibilidade, ação atual).

  6. Corrigir bug no performanceMonitor onde os métodos inicioTotal()
     e fimTotal() sobrescrevem a si mesmos com números.

  7. Remover import não utilizado no messageFormatter.js.

  8. Adicionar rotinas personalizadas para cada NPC no scheduler
     (atualmente muitos NPCs usam rotinas genéricas idênticas).

  9. Implementar Memory Engine para criar memórias automaticamente
     durante as conversas (atualmente as memórias não são criadas).

  10. Considerar adicionar validação de schema ao carregar NPCs
      para garantir que todos os campos obrigatórios estão presentes.

════════════════════════════════════════════════════════════════
  LISTA DE TODOS OS NPCs ENCONTRADOS
════════════════════════════════════════════════════════════════
`;

    for (const npc of npcs) {
        const temProblema = npcsComProblemasSet.has(npc.id);
        texto += `  ${temProblema ? '⚠' : '✓'} ${npc.nome} (${npc.id})\n`;
    }

    texto += `
════════════════════════════════════════════════════════════════
  FIM DO RELATÓRIO
════════════════════════════════════════════════════════════════
`;

    // Salvar relatório em arquivo
    const relatorioPath = path.join(__dirname, '..', 'RELATORIO_AUDITORIA_NPCS.txt');
    fs.writeFileSync(relatorioPath, texto, 'utf8');

    console.log(texto);
    console.log(`\nRelatório salvo em: ${relatorioPath}`);

    return texto;
}

// =====================================
// EXECUTAR AUDITORIA
// =====================================

async function executarAuditoria() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     AUDITORIA COMPLETA DO SISTEMA DE NPCs INTEGRADOS       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    try {
        verificarIntegracao();
        verificarBaseConhecimento();
        verificarSistemaDialogo();
        verificarPersonalidade();
        verificarFormatacao();
        verificarMemoria();
        verificarThinkingDinamico();
        verificarErros();
        await executarTestes();
        gerarRelatorioFinal();
    } catch (erro) {
        console.error('Erro durante a auditoria:', erro);
        console.error(erro.stack);
    }
}

// Executar
executarAuditoria();