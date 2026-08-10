/**
 * SCRIPT 2 — IMPORTAR CENAS2.md
 * 
 * Responsável por ler NPC_LORA/memory/CENAS2.md e distribuir
 * os blocos de cenas e diálogos para os datasets de cada NPC.
 * 
 * Este arquivo contém SOMENTE os NPCs que anteriormente estavam com
 * 17_dialog_examples.md e 18_scene_examples.md vazios.
 * 
 * Uso: node scripts/importar_cenas2.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// CONFIGURAÇÕES
// ============================================================
const ARQUIVO_FONTE = path.join(__dirname, '..', 'NPC_LORA', 'memory', 'CENAS2.md');
const DIR_DATASET = path.join(__dirname, '..', 'NPC_LORA', 'dataset');
const ARQ_DIALOGOS = '17_dialog_examples.md';
const ARQ_CENAS = '18_scene_examples.md';
const ARQ_RELATORIO = path.join(__dirname, '..', 'RELATORIO_IMPORTACAO_CENAS2.txt');

// ============================================================
// LISTA DE NPCs DO CENAS2.md
// ============================================================
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

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

/**
 * Lê o conteúdo atual de um arquivo de destino
 */
function lerArquivoDestino(caminho) {
  if (fs.existsSync(caminho)) {
    return fs.readFileSync(caminho, 'utf8');
  }
  return '';
}

/**
 * Verifica se um bloco já existe no arquivo de destino
 */
function blocoJaExiste(conteudoExistente, bloco) {
  if (!conteudoExistente) return false;
  return conteudoExistente.includes(bloco);
}

/**
 * Anexa um bloco ao arquivo de destino
 */
function anexarBloco(caminho, bloco) {
  let conteudo = lerArquivoDestino(caminho);
  
  // Verificar se já existe
  if (blocoJaExiste(conteudo, bloco)) {
    return false; // já existe, não duplicar
  }
  
  // Anexar
  if (conteudo.length > 0 && !conteudo.endsWith('\n')) {
    conteudo += '\n';
  }
  conteudo += bloco + '\n';
  
  fs.writeFileSync(caminho, conteudo, 'utf8');
  return true; // copiado
}

/**
 * Identifica o NPC a partir de uma linha de identificação
 */
function identificarNPC(linha) {
  const linhaLower = linha.toLowerCase();
  
  for (const npc of NPC_LIST) {
    const nomeLower = npc.nome.toLowerCase();
    const pastaLower = npc.pasta.toLowerCase();
    
    // Verificar se a linha contém o nome do NPC
    if (linhaLower.includes(nomeLower)) {
      return npc;
    }
    
    // Verificar se a linha contém a pasta (com underscores ou sem)
    const pastaComUnderscore = pastaLower.replace(/_/g, '\\_');
    const pastaSemUnderscore = pastaLower.replace(/_/g, ' ');
    
    if (linhaLower.includes(pastaComUnderscore) || linhaLower.includes(pastaSemUnderscore)) {
      return npc;
    }
    
    // Verificar primeiro nome do NPC
    const primeiroNome = npc.nome.split(' ')[0].toLowerCase();
    if (linhaLower.includes(primeiroNome)) {
      return npc;
    }
  }
  
  return null;
}

/**
 * Verifica se uma linha é um cabeçalho de diálogo
 * Ex: "1. (Primeiro encontro)", "(Conversa casual)", etc.
 */
function ehCabecalhoDialogo(linha) {
  const trimmed = linha.trim();
  // Padrões: "1. (Título)", "(Título)", "1. (Título)" com números variados
  return /^\d+\.\s*\(.+\)$/.test(trimmed) || /^\(.+\)$/.test(trimmed);
}

/**
 * Verifica se uma linha é um cabeçalho de cena
 * Ex: "1. Tressa caminhava...", "2. Ajeitando..."
 * Ex (alternativo): "Trish Yamaguchi caminhava..." (sem numeração)
 */
function ehCabecalhoCena(linha) {
  const trimmed = linha.trim();
  // Padrão: número seguido de ponto e espaço, depois texto
  if (/^\d+\.\s+[A-ZÀ-Ú]/.test(trimmed)) return true;
  // Padrão alternativo: nome de NPC seguido de verbo no passado (cena narrativa)
  if (/^[A-Z][a-zÀ-Ú]+\s+[A-Za-zÀ-Ú]+\s+(caminhava|sentad[ao]|diante|ajoelhad[ao]|confrontad[ao]|no meio|com|ao ver|ao ouvir|ao constatar|ao receber|ao notar|ao senti|distribuindo|treinando|inspecionando|compartilhando|verificando|observando|movendo|ajustando|limpando|utilizando|curtand|percebendo)/i.test(trimmed)) return true;
  return false;
}

/**
 * Verifica se uma linha é um separador de seção
 */
function ehSeparadorSecao(linha) {
  const trimmed = linha.trim();
  return trimmed.includes('====') || trimmed.includes('----') || trimmed.includes('____');
}

/**
 * Verifica se uma linha é um cabeçalho de seção (DIÁLOGOS ou CENAS)
 * Ex: "# 1 — DIÁLOGOS", "1. — DIÁLOGOS", "# 2 — CENAS NARRATIVAS", "1. — CENAS NARRATIVAS"
 */
function ehCabecalhoSecao(linha) {
  const trimmed = linha.trim();
  return /DIÁLOGOS/.test(trimmed) || /CENAS NARRATIVAS/.test(trimmed);
}

// ============================================================
// FUNÇÃO PRINCIPAL
// ============================================================

function main() {
  console.log('=== IMPORTADOR CENAS2.md ===');
  console.log('Lendo arquivo:', ARQUIVO_FONTE);
  
  // Verificar se o arquivo fonte existe
  if (!fs.existsSync(ARQUIVO_FONTE)) {
    console.error('ERRO: Arquivo fonte não encontrado:', ARQUIVO_FONTE);
    process.exit(1);
  }
  
  // Ler o arquivo completo
  const conteudo = fs.readFileSync(ARQUIVO_FONTE, 'utf8');
  const linhas = conteudo.split('\n');
  console.log('Total de linhas:', linhas.length);
  
  // Estatísticas
  const stats = {
    npcsEncontrados: [],
    npcsImportados: [],
    npcsIgnorados: [],
    npcsNaoIdentificados: []
  };
  
  // ============================================================
  // PASSO 1: Identificar as seções de cada NPC
  // ============================================================
  console.log('\n--- Identificando seções de NPCs ---');
  
  // Encontrar todas as linhas de identificação de NPC
  const secoesNPC = [];
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    
    // Pular cabeçalhos de seção (DIÁLOGOS, CENAS NARRATIVAS)
    if (ehCabecalhoSecao(linha)) continue;
    
    // Pular separadores de seção
    if (ehSeparadorSecao(linha)) continue;
    
    // Padrões de identificação de NPC
    const ehIdentificacao = 
      linha.match(/^PERSONAGEM/i) || 
      linha.match(/^Personagem/i) || 
      linha.match(/^personagem/i) ||
      linha.match(/^\\?#\s*\d+\.\s*[A-Z]/) ||
      linha.match(/^[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+\s*—/) ||
      linha.match(/^[A-Z][a-z]+\s*—/);
    
    if (ehIdentificacao) {
      const npc = identificarNPC(linha);
      secoesNPC.push({
        linha: i + 1,
        texto: linha,
        npc: npc
      });
    }
  }
  
  console.log('Seções de NPC encontradas:', secoesNPC.length);
  for (const sec of secoesNPC) {
    console.log(`  Linha ${sec.linha}: ${sec.texto.substring(0, 80)} -> ${sec.npc ? sec.npc.nome : 'NÃO IDENTIFICADO'}`);
  }
  
  // ============================================================
  // PASSO 2: Extrair blocos de diálogos e cenas para cada NPC
  // ============================================================
  console.log('\n--- Extraindo blocos por NPC ---');
  
  // Para cada seção de NPC, extrair os blocos
  for (let idx = 0; idx < secoesNPC.length; idx++) {
    const secao = secoesNPC[idx];
    const fimSecao = idx < secoesNPC.length - 1 ? secoesNPC[idx + 1].linha - 1 : linhas.length;
    
    if (!secao.npc) {
      stats.npcsNaoIdentificados.push(`Linha ${secao.linha}: ${secao.texto.substring(0, 60)}`);
      continue;
    }
    
    // Verificar se a pasta do NPC existe
    const pastaNPC = path.join(DIR_DATASET, secao.npc.pasta);
    if (!fs.existsSync(pastaNPC)) {
      stats.npcsIgnorados.push(secao.npc.nome);
      continue;
    }
    
    // Extrair blocos da seção
    const blocosDialogos = [];
    const blocosCenas = [];
    
    let secaoAtual = null; // 'dialogos' ou 'cenas'
    let blocoAtual = [];
    let emBloco = false;
    
    for (let i = secao.linha; i < fimSecao; i++) {
      const linha = linhas[i];
      const trimmed = linha.trim();
      
      // Verificar se é um cabeçalho de seção
      if (ehCabecalhoSecao(trimmed)) {
        // Finalizar bloco atual
        if (emBloco && blocoAtual.length > 0) {
          const bloco = blocoAtual.join('\n').trim();
          if (bloco.length > 0) {
            if (secaoAtual === 'dialogos') {
              blocosDialogos.push(bloco);
            } else if (secaoAtual === 'cenas') {
              blocosCenas.push(bloco);
            }
          }
          blocoAtual = [];
          emBloco = false;
        }
        
        if (trimmed.includes('DIÁLOGOS')) {
          secaoAtual = 'dialogos';
        } else if (trimmed.includes('CENAS NARRATIVAS')) {
          secaoAtual = 'cenas';
        }
        continue;
      }
      
      // Verificar se é um separador de seção
      if (ehSeparadorSecao(trimmed)) {
        continue;
      }
      
      // Verificar se é um cabeçalho de diálogo ou cena
      if (ehCabecalhoDialogo(trimmed) || ehCabecalhoCena(trimmed)) {
        // Finalizar bloco anterior
        if (emBloco && blocoAtual.length > 0) {
          const bloco = blocoAtual.join('\n').trim();
          if (bloco.length > 0) {
            if (secaoAtual === 'dialogos') {
              blocosDialogos.push(bloco);
            } else if (secaoAtual === 'cenas') {
              blocosCenas.push(bloco);
            }
          }
          blocoAtual = [];
        }
        
        // Iniciar novo bloco
        emBloco = true;
        blocoAtual = [linha];
        continue;
      }
      
      // Adicionar linha ao bloco atual
      if (emBloco) {
        blocoAtual.push(linha);
      }
    }
    
    // Finalizar último bloco
    if (emBloco && blocoAtual.length > 0) {
      const bloco = blocoAtual.join('\n').trim();
      if (bloco.length > 0) {
        if (secaoAtual === 'dialogos') {
          blocosDialogos.push(bloco);
        } else if (secaoAtual === 'cenas') {
          blocosCenas.push(bloco);
        }
      }
    }
    
    console.log(`  ${secao.npc.nome}: ${blocosDialogos.length} diálogos, ${blocosCenas.length} cenas`);
    
    // ============================================================
    // PASSO 3: Copiar blocos para os arquivos de destino
    // ============================================================
    
    // Copiar diálogos para 17_dialog_examples.md
    const caminhoDialogos = path.join(pastaNPC, ARQ_DIALOGOS);
    let copiadosDialogos = 0;
    let ignoradosDialogos = 0;
    
    for (const bloco of blocosDialogos) {
      const copiado = anexarBloco(caminhoDialogos, bloco);
      if (copiado) {
        copiadosDialogos++;
      } else {
        ignoradosDialogos++;
      }
    }
    
    // Copiar cenas para 18_scene_examples.md
    const caminhoCenas = path.join(pastaNPC, ARQ_CENAS);
    let copiadosCenas = 0;
    let ignoradosCenas = 0;
    
    for (const bloco of blocosCenas) {
      const copiado = anexarBloco(caminhoCenas, bloco);
      if (copiado) {
        copiadosCenas++;
      } else {
        ignoradosCenas++;
      }
    }
    
    const totalCopiados = copiadosDialogos + copiadosCenas;
    const totalIgnorados = ignoradosDialogos + ignoradosCenas;
    
    if (totalCopiados > 0) {
      stats.npcsImportados.push(secao.npc.nome);
    } else {
      stats.npcsIgnorados.push(secao.npc.nome);
    }
    
    stats.npcsEncontrados.push(secao.npc.nome);
    
    console.log(`    Copiados: ${totalCopiados} (${copiadosDialogos} diálogos + ${copiadosCenas} cenas), Ignorados: ${totalIgnorados}`);
  }
  
  // ============================================================
  // PASSO 4: Gerar relatório
  // ============================================================
  const relatorio = [
    '==============================================',
    'RELATÓRIO DE IMPORTAÇÃO — CENAS2.md',
    '==============================================',
    '',
    `NPCs encontrados: ${stats.npcsEncontrados.length}`,
    stats.npcsEncontrados.length > 0 ? stats.npcsEncontrados.join(', ') : 'Nenhum',
    '',
    `NPCs importados: ${stats.npcsImportados.length}`,
    stats.npcsImportados.length > 0 ? stats.npcsImportados.join(', ') : 'Nenhum',
    '',
    `NPCs ignorados: ${stats.npcsIgnorados.length}`,
    stats.npcsIgnorados.length > 0 ? stats.npcsIgnorados.join(', ') : 'Nenhum',
    '',
    `NPCs não identificados: ${stats.npcsNaoIdentificados.length}`,
    stats.npcsNaoIdentificados.length > 0 ? stats.npcsNaoIdentificados.join(', ') : 'Nenhum',
    '',
    '=============================================='
  ].join('\n');
  
  fs.writeFileSync(ARQ_RELATORIO, relatorio, 'utf8');
  
  console.log('\n=== RESUMO ===');
  console.log('NPCs encontrados:', stats.npcsEncontrados.length);
  console.log('NPCs importados:', stats.npcsImportados.length);
  console.log('NPCs ignorados:', stats.npcsIgnorados.length);
  console.log('NPCs não identificados:', stats.npcsNaoIdentificados.length);
  console.log('\nRelatório gerado em:', ARQ_RELATORIO);
}

// Executar
main();