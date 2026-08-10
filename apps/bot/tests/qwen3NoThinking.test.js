/**
 * TESTE DE INTEGRAÇÃO - QWEN3 SEM THINKING
 *
 * Valida que o Qwen3 gera narrativa em português diretamente,
 * sem produzir raciocínio interno.
 *
 * Uso:
 *   node tests/qwen3NoThinking.test.js
 *
 * Requisitos:
 *   - Ollama rodando em http://localhost:11434
 *   - Modelo qwen3:4b-thinking-2507-q4_K_M carregado
 */

const { ollamaService } = require('../src/ia/ollamaService');
const { MODEL_CONFIG, OLLAMA_THINKING } = require('../src/ia/modelConfig');
const fs = require('fs');
const path = require('path');

// =====================================
// VALIDAÇÕES ESTÁTICAS (sem Ollama)
// =====================================

function validarConfiguracao() {
  const falhas = [];

  if (OLLAMA_THINKING !== false) {
    falhas.push(`OLLAMA_THINKING deve ser false, mas é ${OLLAMA_THINKING}`);
  }

  const cfg = MODEL_CONFIG;
  if (cfg.temperature !== 0.6) falhas.push(`temperature deve ser 0.6, mas é ${cfg.temperature}`);
  if (cfg.top_p !== 0.85) falhas.push(`top_p deve ser 0.85, mas é ${cfg.top_p}`);
  if (cfg.top_k !== 30) falhas.push(`top_k deve ser 30, mas é ${cfg.top_k}`);
  if (cfg.num_thread !== 8) falhas.push(`num_thread deve ser 8, mas é ${cfg.num_thread}`);
  if (cfg.num_ctx !== 16384) falhas.push(`num_ctx deve ser 16384, mas é ${cfg.num_ctx}`);
  if (!cfg.model.includes('qwen3:4b-thinking-2507-q4_K_M')) falhas.push(`modelo deve ser qwen3:4b-thinking-2507-q4_K_M, mas é ${cfg.model}`);

  return falhas;
}

function validarPrompts() {
  const falhas = [];
  const promptBuilderPath = path.join(__dirname, '..', 'src', 'ia', 'promptBuilderV2.js');
  const interpretadorPath = path.join(__dirname, '..', 'src', 'ia', 'interpretadorConversa.js');

  const promptBuilder = fs.readFileSync(promptBuilderPath, 'utf8');
  const interpretador = fs.readFileSync(interpretadorPath, 'utf8');

  const termosProibidos = [
    'FORMA DE PENSAR',
    'Como este personagem responderia naturalmente',
    'MODO DE PENSAMENTO',
    'INTERPRETAÇÃO PRIMEIRO',
    'Primeiro pense como este personagem responderia'
  ];

  for (const termo of termosProibidos) {
    if (promptBuilder.includes(termo) || interpretador.includes(termo)) {
      falhas.push(`Termo proibido encontrado: "${termo}"`);
    }
  }

  if (!promptBuilder.includes('REGRAS DE SAÍDA')) {
    falhas.push('Bloco Sistema deve conter REGRAS DE SAÍDA');
  }

  if (!promptBuilder.includes('Não controle pensamentos, falas, ações ou decisões do jogador')) {
    falhas.push('Bloco Sistema deve conter regra de não controlar o jogador');
  }

  return falhas;
}

// =====================================
// VALIDAÇÕES DE RESPOSTA
// =====================================

function avaliarResposta(resposta, entrada) {
  const falhas = [];

  if (!resposta) {
    falhas.push('Resposta vazia');
    return falhas;
  }

  const inicio = resposta.trim().toLowerCase().slice(0, 50);
  const termosProibidosInicio = ['okay', 'let me think', 'the user wants', 'i need to', 'first, i', 'wait', 'maybe', 'so,', 'well,'];
  for (const termo of termosProibidosInicio) {
    if (inicio.startsWith(termo)) {
      falhas.push(`Resposta começa com pensamento interno: "${termo}"`);
      break;
    }
  }

  const thinkingMarkers = ['|im_start|>think', '<thinking>', '</thinking>', '|im_end|>', 'done thinking', 'let me think', 'the user wants', 'i need to', 'okay, the user'];
  for (const marker of thinkingMarkers) {
    if (resposta.toLowerCase().includes(marker.toLowerCase())) {
      falhas.push(`Resposta contém marcador de thinking: "${marker}"`);
    }
  }

  const termosPortugues = ['o', 'a', 'que', 'de', 'não', 'nao', 'ele', 'ela', 'para', 'com', 'como', 'mais', 'mas', 'se', 'você', 'voce', 'ser', 'foi', 'era'];
  const palavras = resposta.toLowerCase().split(/\s+/);
  let encontrouPortugues = false;
  for (const termo of termosPortugues) {
    if (palavras.includes(termo)) { encontrouPortugues = true; break; }
  }
  if (!encontrouPortugues) falhas.push('Resposta não parece conter português brasileiro');

  if (/^ok(ay)?[,:\s]/i.test(resposta.trim())) {
    falhas.push('Resposta começa com "Okay" (pensamento em inglês)');
  }

  if (entrada && entrada.toLowerCase().includes('irelia')) {
    const determinouDecisao = /irelia\s+(decidiu|vai|vou|iria|sacou|sacu|ergueu)/i;
    if (determinouDecisao.test(resposta)) {
      falhas.push('Resposta determina decisão de Irelia (jogador controla Irelia)');
    }
  }

  return falhas;
}

// =====================================
// TESTE PRINCIPAL
// =====================================

async function executarTeste() {
  console.log('==========================================');
  console.log(' 🧪 TESTE QWEN3 SEM THINKING');
  console.log('==========================================\n');

  let totalTestes = 0;
  let testesPassaram = 0;

  console.log('📋 VALIDAÇÕES ESTÁTICAS (sem Ollama)');
  console.log('------------------------------------');

  const configFalhas = validarConfiguracao();
  totalTestes++;
  if (configFalhas.length === 0) {
    console.log('✅ Configuração central (modelConfig) correta');
    testesPassaram++;
  } else {
    for (const f of configFalhas) console.log(`❌ ${f}`);
  }

  const promptFalhas = validarPrompts();
  totalTestes++;
  if (promptFalhas.length === 0) {
    console.log('✅ Prompts não contêm instruções de raciocínio');
    testesPassaram++;
  } else {
    for (const f of promptFalhas) console.log(`❌ ${f}`);
  }

  console.log('');

  console.log('🤖 VERIFICANDO OLLAMA');
  console.log('---------------------');
  const disponivel = await ollamaService.verificarDisponibilidade();
  if (!disponivel) {
    console.log('❌ Ollama não está rodando em http://localhost:11434');
    console.log('   Inicie o Ollama e tente novamente.');
    console.log(`\nResultado: ${testesPassaram}/${totalTestes} testes passaram (validados sem Ollama)`);
    process.exit(1);
  }
  console.log('✅ Ollama está rodando');
  console.log('');

  console.log('🎭 TESTE COM CENA CURTA (Ophilia e Irelia)');
  console.log('------------------------------------------');

  const entrada = 'Responda em português brasileiro com uma cena curta de RPG entre Ophilia e Irelia. Não controle Irelia. Escreva uma cena narrativa curta.';

  try {
    const resultado = await ollamaService.gerarResposta(entrada, {
      num_ctx: MODEL_CONFIG.num_ctx,
      num_predict: 400,
      thinking: false
    });

    const resposta = resultado.texto;
    console.log('\n📝 RESPOSTA GERADA:');
    console.log('-------------------');
    console.log(resposta || '(vazia)');
    console.log('-------------------');
    console.log('\n📊 MÉTRICAS:');
    console.log(`  TTFT: ${resultado.metricas.tempoTTFT} ms`);
    console.log(`  Tempo total: ${resultado.metricas.tempo} ms`);
    console.log(`  Tokens: ${resultado.metricas.tokens}`);
    console.log(`  Velocidade: ${resultado.metricas.velocidade} tok/s`);
    if (resultado.metricas.metricasAPI) {
      console.log(`  Prompt tokens (API): ${resultado.metricas.metricasAPI.promptEvalCount}`);
      console.log(`  Output tokens (API): ${resultado.metricas.metricasAPI.evalCount}`);
      console.log(`  Prompt eval (API): ${resultado.metricas.metricasAPI.promptEvalDurationMs} ms`);
      console.log(`  Eval duration (API): ${resultado.metricas.metricasAPI.evalDurationMs} ms`);
    }

    const falhas = avaliarResposta(resposta, entrada);
    totalTestes++;
    if (falhas.length === 0) {
      console.log('✅ Resposta é narrativa válida');
      testesPassaram++;
    } else {
      for (const f of falhas) console.log(`❌ ${f}`);
    }

    console.log('\n==========================================');
    console.log(`Resultado: ${testesPassaram}/${totalTestes} testes passaram`);
    console.log('==========================================');

    process.exit(falhas.length === 0 ? 0 : 1);

  } catch (erro) {
    console.log(`❌ Erro ao gerar resposta: ${erro.message}`);
    console.log(`\nResultado: ${testesPassaram}/${totalTestes} testes passaram`);
    process.exit(1);
  }
}

executarTeste().catch(erro => {
  console.error('Erro fatal no teste:', erro);
  process.exit(1);
});