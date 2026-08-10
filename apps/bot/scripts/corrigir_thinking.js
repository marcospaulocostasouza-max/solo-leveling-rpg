/**
 * SCRIPT DE CORREÇÃO DO THINKING DECISION ENGINE
 *
 * Corrige os pesos de intenção para que perguntas pessoais e estratégicas
 * ativem o Thinking corretamente.
 */

const fs = require('fs');
const path = require('path');

const arquivoPath = path.join(__dirname, '..', 'src', 'ia', 'thinkingDecisionEngine.js');
let conteudo = fs.readFileSync(arquivoPath, 'utf8');

let correcoes = 0;

// =====================================
// CORREÇÃO 1: Peso da intenção 'personalidade'
// =====================================
// "Quem é você?" deve ativar thinking
// Peso atual: 15 (muito baixo)
// Peso novo: 35 (suficiente para ativar thinking com complexidade média)

const regex1 = /'personalidade':\s*15,/;
if (regex1.test(conteudo)) {
    conteudo = conteudo.replace(regex1, "'personalidade': 35,");
    console.log('✓ Correção 1: Peso da intenção "personalidade" alterado de 15 para 35');
    correcoes++;
} else {
    console.log('✗ Correção 1 não encontrada');
}

// =====================================
// CORREÇÃO 2: Peso da intenção 'combate'
// =====================================
// "Qual a melhor estratégia para derrotar o boss?" deve ativar thinking
// Peso atual: 15 (muito baixo)
// Peso novo: 25 (suficiente para ativar thinking com complexidade média)

const regex2 = /'combate':\s*15,/;
if (regex2.test(conteudo)) {
    conteudo = conteudo.replace(regex2, "'combate': 25,");
    console.log('✓ Correção 2: Peso da intenção "combate" alterado de 15 para 25');
    correcoes++;
} else {
    console.log('✗ Correção 2 não encontrada');
}

// =====================================
// CORREÇÃO 3: Adicionar 'boss' como categoria sempre thinking
// =====================================
// Mensagens sobre boss devem SEMPRE ativar thinking

const regex3 = /'escolhaPermanente',\s*\n\s*'investigacao',/;
if (regex3.test(conteudo)) {
    conteudo = conteudo.replace(regex3, "'escolhaPermanente',\n        'boss',\n        'investigacao',");
    console.log('✓ Correção 3: "boss" adicionado às categorias sempre thinking');
    correcoes++;
} else {
    console.log('✗ Correção 3 não encontrada');
}

// Salvar arquivo
fs.writeFileSync(arquivoPath, conteudo, 'utf8');
console.log(`\n✓ Arquivo thinkingDecisionEngine.js processado! ${correcoes} correção(ões) aplicada(s).`);