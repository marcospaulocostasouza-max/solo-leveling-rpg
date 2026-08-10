/**
 * TESTE DO SISTEMA DE THINKING DINÂMICO
 * 
 * Executa testes nos novos módulos sem depender do Ollama.
 * 
 * Uso: node testS.js
 */

const { intentAnalyzer } = require("./src/ia/intentAnalyzer");
const { complexityAnalyzer } = require("./src/ia/complexityAnalyzer");
const { thinkingDecisionEngine } = require("./src/ia/thinkingDecisionEngine");
const { thinkingPerformanceLogger } = require("./src/ia/thinkingPerformanceLogger");

// =====================================
// TESTES DE INTENÇÃO
// =====================================
console.log('\n═══════════════════════════════════');
console.log('TESTES DO INTENT ANALYZER');
console.log('═══════════════════════════════════\n');

const testesIntencao = [
    { msg: 'Bom dia!', esperado: 'cumprimento' },
    { msg: 'Oi', esperado: 'cumprimento' },
    { msg: 'Tchau, até mais!', esperado: 'despedida' },
    { msg: 'Obrigado por tudo!', esperado: 'agradecimento' },
    { msg: 'kkkk que engraçado', esperado: 'brincadeiras' },
    { msg: 'Quero comprar uma espada', esperado: 'comercio' },
    { msg: 'Qual minha missão?', esperado: 'missao' },
    { msg: 'Quero forjar uma arma nova', esperado: 'crafting' },
    { msg: 'Você matou seu pai?', esperado: 'relacionamento' },
    { msg: 'Eu te amo', esperado: 'romance' },
    { msg: 'Conte sua história', esperado: 'passado' },
    { msg: 'Quem matou o antigo rei?', esperado: 'investigacao' },
    { msg: 'O que devo fazer nessa situação?', esperado: 'planejamento' },
    { msg: 'É certo matar para proteger?', esperado: 'etica' },
    { msg: 'Preciso escolher entre salvar um ou salvar todos', esperado: 'dilema' },
    { msg: 'Vamos enfrentar o dragão!', esperado: 'boss' }
];

let passouIntencao = 0;
let falhouIntencao = 0;

for (const teste of testesIntencao) {
    const resultado = intentAnalyzer.analisar(teste.msg);
    const acertou = resultado.categoria === teste.esperado;
    
    if (acertou) {
        passouIntencao++;
    } else {
        falhouIntencao++;
    }
    
    console.log(`${acertou ? '✅' : '❌'} "${teste.msg}"`);
    console.log(`   → Intent: ${resultado.categoria} (esperado: ${teste.esperado}) ${acertou ? '' : '⚠️'}`);
    console.log(`   → Confiança: ${resultado.confianca}% | Pontuação: ${resultado.pontuacao}`);
}

console.log(`\nResultado Intent Analyzer: ${passouIntencao} passou, ${falhouIntencao} falhou`);

// =====================================
// TESTES DE COMPLEXIDADE
// =====================================
console.log('\n═══════════════════════════════════');
console.log('TESTES DO COMPLEXITY ANALYZER');
console.log('═══════════════════════════════════\n');

const testesComplexidade = [
    { msg: 'Oi', esperadoBaixa: true, descricao: 'simples' },
    { msg: 'Bom dia', esperadoBaixa: true, descricao: 'simples' },
    { msg: 'Tudo bem?', esperadoBaixa: true, descricao: 'simples' },
    { msg: 'Obrigado', esperadoBaixa: true, descricao: 'simples' },
    { msg: 'Quero comprar uma poção', esperadoBaixa: true, descricao: 'média baixa' },
    { msg: 'Conte sua história desde o início', esperadoBaixa: false, descricao: 'complexa' },
    { msg: 'Quem matou o antigo rei e por quê?', esperadoBaixa: false, descricao: 'complexa' },
    { msg: 'É certo sacrificar uma vida para salvar muitas?', esperadoBaixa: false, descricao: 'muito complexa' }
];

let passouComplexidade = 0;
let falhouComplexidade = 0;

for (const teste of testesComplexidade) {
    const resultado = complexityAnalyzer.analisar(teste.msg);
    const ehBaixa = resultado.pontuacao < 40;
    const acertou = ehBaixa === teste.esperadoBaixa;
    
    if (acertou) {
        passouComplexidade++;
    } else {
        falhouComplexidade++;
    }
    
    console.log(`${acertou ? '✅' : '❌'} "${teste.msg}"`);
    console.log(`   → Complexidade: ${resultado.pontuacao}/100 (${resultado.classificacao}) ${acertou ? '' : `⚠️ esperado ${teste.descricao}`}`);
    console.log(`   → Fatores: Tamanho:${resultado.fatores.tamanho.pontos} | Raciocínio:${resultado.fatores.raciocinio.pontos} | Memória:${resultado.fatores.memoria.pontos}`);
}

console.log(`\nResultado Complexity Analyzer: ${passouComplexidade} passou, ${falhouComplexidade} falhou`);

// =====================================
// TESTES DA DECISÃO DE THINKING
// =====================================
console.log('\n═══════════════════════════════════');
console.log('TESTES DO THINKING DECISION ENGINE');
console.log('═══════════════════════════════════\n');

const testesThinking = [
    { 
        msg: 'Bom dia!', 
        esperado: false, 
        descricao: 'Cumprimento simples → rápido',
        historico: []
    },
    { 
        msg: 'Oi, tudo bem?', 
        esperado: false, 
        descricao: 'Conversa casual → rápido',
        historico: []
    },
    { 
        msg: 'Quem matou o antigo rei?', 
        esperado: true, 
        descricao: 'Investigação profunda → thinking',
        historico: []
    },
    { 
        msg: 'Você matou seu pai?', 
        esperado: true, 
        descricao: 'Pergunta emocional profunda → thinking',
        historico: []
    },
    { 
        msg: 'Quero comprar uma poção', 
        esperado: false, 
        descricao: 'Comércio simples → rápido',
        historico: []
    },
    { 
        msg: 'Mas por quê?', 
        esperado: true, 
        descricao: 'Continuidade do assunto → thinking',
        historico: [
            { papel: 'jogador', conteudo: 'Quem matou o antigo rei?' },
            { papel: 'npc', conteudo: 'Foi uma conspiração...' }
        ]
    }
];

// Resetar estado do motor para teste limpo
thinkingDecisionEngine.resetarTudo();

let passouThinking = 0;
let falhouThinking = 0;

for (const teste of testesThinking) {
    // Para o teste de continuidade, usar a mesma conversa que já teve thinking=true
    const jogadorId = teste.msg === 'Mas por quê?' ? 'teste-continuidade' : 'teste2';
    const npcId = teste.msg === 'Mas por quê?' ? 'npc-continuidade' : 'npc2';
    
    // Simular conversa anterior de thinking para o teste de continuidade
    if (teste.msg === 'Mas por quê?') {
        thinkingDecisionEngine.decidir({
            mensagem: 'Quem matou o antigo rei?',
            analiseIntencao: intentAnalyzer.analisar('Quem matou o antigo rei?'),
            analiseComplexidade: complexityAnalyzer.analisar('Quem matou o antigo rei?'),
            jogadorId: jogadorId,
            npcId: npcId,
            historico: []
        });
    } else {
        thinkingDecisionEngine.resetarConversa(jogadorId, npcId);
    }
    
    const resultado = thinkingDecisionEngine.decidir({
        mensagem: teste.msg,
        analiseIntencao: intentAnalyzer.analisar(teste.msg),
        analiseComplexidade: complexityAnalyzer.analisar(teste.msg),
        jogadorId: jogadorId,
        npcId: npcId,
        historico: teste.historico
    });
    
    const acertou = resultado.thinking === teste.esperado;
    
    if (acertou) {
        passouThinking++;
    } else {
        falhouThinking++;
    }
    
    console.log(`${acertou ? '✅' : '❌'} "${teste.msg}"`);
    console.log(`   → Thinking: ${resultado.thinking} (esperado: ${teste.esperado}) ${acertou ? '' : '⚠️'}`);
    console.log(`   → Motivo: ${resultado.motivo}`);
}

console.log(`\nResultado Thinking Decision: ${passouThinking} passou, ${falhouThinking} falhou`);

// =====================================
// TESTE DO LOGGER DE PERFORMANCE
// =====================================
console.log('\n═══════════════════════════════════');
console.log('TESTE DO THINKING PERFORMANCE LOGGER');
console.log('═══════════════════════════════════\n');

thinkingPerformanceLogger.registrar({
    jogadorId: 'teste',
    npcId: 'npc1',
    categoria: 'conversaCasual',
    complexidade: 25,
    classificacao: 'Simples',
    thinking: false,
    motivo: 'Mensagem simples',
    tempoDecisao: 1,
    tempoOllama: 500,
    tempoTotal: 600,
    pontuacao: 10
});

const estatisticas = thinkingPerformanceLogger.getEstatisticas();
console.log('📊 Estatísticas do Logger:');
console.log(JSON.stringify(estatisticas, null, 2));

// =====================================
// RESUMO FINAL
// =====================================
console.log('\n═══════════════════════════════════');
console.log('RESUMO FINAL DOS TESTES');
console.log('═══════════════════════════════════\n');
console.log(`Intent Analyzer: ${passouIntencao}/${testesIntencao.length} ✅ ${falhouIntencao > 0 ? `(${falhouIntencao} falhas)` : ''}`);
console.log(`Complexity Analyzer: ${passouComplexidade}/${testesComplexidade.length} ✅ ${falhouComplexidade > 0 ? `(${falhouComplexidade} falhas)` : ''}`);
console.log(`Thinking Decision: ${passouThinking}/${testesThinking.length} ✅ ${falhouThinking > 0 ? `(${falhouThinking} falhas)` : ''}`);

const totalPassou = passouIntencao + passouComplexidade + passouThinking;
const totalTestes = testesIntencao.length + testesComplexidade.length + testesThinking.length;
console.log(`\nTOTAL: ${totalPassou}/${totalTestes} passaram`);