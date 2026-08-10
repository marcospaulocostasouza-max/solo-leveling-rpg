/**
 * TESTE — Verifica a extração de blocos do CENAS2.md sem copiar arquivos.
 */
const fs = require('fs');
const path = require('path');

const cenas2 = fs.readFileSync('NPC_LORA/memory/CENAS2.md', 'utf8');
const linhas = cenas2.split('\n');

const NPC_LIST = [
  { nome: 'Vide', pasta: 'vide_o_corruptor' },
  { nome: 'Olberic Eisenberg', pasta: 'olberic_eisenberg' },
  { nome: 'Trish Yamaguchi', pasta: 'trish_yamaguchi' },
  { nome: 'Tressa Colzione', pasta: 'tressa_colzione' },
  { nome: 'Therion', pasta: 'therion' },
  { nome: 'Primrose Azelhart', pasta: 'primrose_azelhart' },
  { nome: 'Osvald V. Vanstein', pasta: 'osvald_v_vanstein' },
  { nome: 'Lyblac', pasta: 'lyblac' }
];

function identificarNPC(linha) {
  const linhaLower = linha.toLowerCase();
  for (const npc of NPC_LIST) {
    const nomeLower = npc.nome.toLowerCase();
    const pastaLower = npc.pasta.toLowerCase();
    if (linhaLower.includes(nomeLower)) return npc;
    const pastaComUnderscore = pastaLower.replace(/_/g, '\\_');
    const pastaSemUnderscore = pastaLower.replace(/_/g, ' ');
    if (linhaLower.includes(pastaComUnderscore) || linhaLower.includes(pastaSemUnderscore)) return npc;
    const primeiroNome = npc.nome.split(' ')[0].toLowerCase();
    if (linhaLower.includes(primeiroNome)) return npc;
  }
  return null;
}

function ehCabecalhoDialogo(linha) {
  const t = linha.trim();
  return /^\d+\.\s*\(.+\)$/.test(t) || /^\(.+\)$/.test(t);
}

function ehCabecalhoCena(linha) {
  const t = linha.trim();
  if (/^\d+\.\s+[A-ZÀ-Ú]/.test(t)) return true;
  if (/^[A-Z][a-zÀ-Ú]+\s+[A-Za-zÀ-Ú]+\s+(caminhava|sentad[ao]|diante|ajoelhad[ao]|confrontad[ao]|no meio|com|ao ver|ao ouvir|ao constatar|ao receber|ao notar|ao senti|distribuindo|treinando|inspecionando|compartilhando|verificando|observando|movendo|ajustando|limpando|utilizando|curtand|percebendo)/i.test(t)) return true;
  return false;
}

function ehSeparadorSecao(linha) {
  const t = linha.trim();
  return t.includes('====') || t.includes('----') || t.includes('____');
}

function ehCabecalhoSecao(linha) {
  const t = linha.trim();
  return /DIÁLOGOS/.test(t) || /CENAS NARRATIVAS/.test(t);
}

// Encontrar seções
const secoesNPC = [];
for (let i = 0; i < linhas.length; i++) {
  const linha = linhas[i].trim();
  if (ehCabecalhoSecao(linha) || ehSeparadorSecao(linha)) continue;
  const ehIdentificacao = 
    linha.match(/^PERSONAGEM/i) || linha.match(/^Personagem/i) || linha.match(/^personagem/i) ||
    linha.match(/^\\?#\s*\d+\.\s*[A-Z]/) ||
    linha.match(/^[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+\s*—/) ||
    linha.match(/^[A-Z][a-z]+\s*—/);
  if (ehIdentificacao) {
    const npc = identificarNPC(linha);
    secoesNPC.push({ linha: i + 1, texto: linha, npc });
  }
}

console.log('Seções encontradas:', secoesNPC.length);

// Para cada seção, extrair blocos
for (let idx = 0; idx < secoesNPC.length; idx++) {
  const secao = secoesNPC[idx];
  const fimSecao = idx < secoesNPC.length - 1 ? secoesNPC[idx + 1].linha - 1 : linhas.length;
  
  if (!secao.npc) continue;
  
  const blocosDialogos = [];
  const blocosCenas = [];
  let secaoAtual = null;
  let blocoAtual = [];
  let emBloco = false;
  
  for (let i = secao.linha; i < fimSecao; i++) {
    const linha = linhas[i];
    const trimmed = linha.trim();
    
    if (ehCabecalhoSecao(trimmed)) {
      if (emBloco && blocoAtual.length > 0) {
        const bloco = blocoAtual.join('\n').trim();
        if (bloco.length > 0) {
          if (secaoAtual === 'dialogos') blocosDialogos.push(bloco);
          else if (secaoAtual === 'cenas') blocosCenas.push(bloco);
        }
        blocoAtual = [];
        emBloco = false;
      }
      if (trimmed.includes('DIÁLOGOS')) secaoAtual = 'dialogos';
      else if (trimmed.includes('CENAS NARRATIVAS')) secaoAtual = 'cenas';
      continue;
    }
    
    if (ehSeparadorSecao(trimmed)) continue;
    
    if (ehCabecalhoDialogo(trimmed) || ehCabecalhoCena(trimmed)) {
      if (emBloco && blocoAtual.length > 0) {
        const bloco = blocoAtual.join('\n').trim();
        if (bloco.length > 0) {
          if (secaoAtual === 'dialogos') blocosDialogos.push(bloco);
          else if (secaoAtual === 'cenas') blocosCenas.push(bloco);
        }
        blocoAtual = [];
      }
      emBloco = true;
      blocoAtual = [linha];
      continue;
    }
    
    if (emBloco) blocoAtual.push(linha);
  }
  
  if (emBloco && blocoAtual.length > 0) {
    const bloco = blocoAtual.join('\n').trim();
    if (bloco.length > 0) {
      if (secaoAtual === 'dialogos') blocosDialogos.push(bloco);
      else if (secaoAtual === 'cenas') blocosCenas.push(bloco);
    }
  }
  
  console.log(`\n${secao.npc.nome}:`);
  console.log(`  Diálogos: ${blocosDialogos.length}`);
  console.log(`  Cenas: ${blocosCenas.length}`);
  
  // Mostrar primeiros 2 blocos de cada
  if (blocosDialogos.length > 0) {
    console.log(`  Primeiro diálogo: ${blocosDialogos[0].substring(0, 100)}...`);
  }
  if (blocosCenas.length > 0) {
    console.log(`  Primeira cena: ${blocosCenas[0].substring(0, 100)}...`);
  }
}