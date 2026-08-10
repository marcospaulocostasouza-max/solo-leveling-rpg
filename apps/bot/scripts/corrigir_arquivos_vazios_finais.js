/**
 * CORREÇÃO DE ARQUIVOS VAZIOS FINAIS
 * Preenche 17_dialog_examples.md e 18_scene_examples.md vazios
 * para: elrica_edoras, galdera, haanit
 * Usando conteúdo dos arquivos de memória.
 */
const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', 'NPC_LORA', 'memory');
const DATASET_DIR = path.join(__dirname, '..', 'NPC_LORA', 'dataset');

// ============================================================
// H'ANIT — extrair do CENAS.md
// ============================================================
function extrairHaanitCenas() {
  const cenasPath = path.join(MEMORY_DIR, 'Cenas.md');
  const conteudo = fs.readFileSync(cenasPath, 'utf8');
  const linhas = conteudo.split('\n');
  
  // Encontrar seção de H'aanit
  let inicio = -1;
  let fim = -1;
  
  for (let i = 0; i < linhas.length; i++) {
    if (linhas[i].includes('H\'AANIT') || linhas[i].includes('H\'aanit')) {
      if (inicio === -1) {
        inicio = i;
      }
    } else if (inicio !== -1 && /^\\?#\s+\d+\.\s+[A-Z]/.test(linhas[i])) {
      fim = i;
      break;
    }
  }
  
  if (inicio === -1) {
    console.log('H\'aanit: seção não encontrada no Cenas.md');
    return null;
  }
  
  if (fim === -1) fim = linhas.length;
  
  const secao = linhas.slice(inicio, fim).join('\n');
  return secao;
}

// ============================================================
// H'ANIT — extrair do E-CENAS.md
// ============================================================
function extrairHaanitECenas() {
  const cenasPath = path.join(MEMORY_DIR, 'E-CENAS.md');
  const conteudo = fs.readFileSync(cenasPath, 'utf8');
  const linhas = conteudo.split('\n');
  
  const blocos = [];
  let inCode = false;
  let blocoAtual = [];
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (linha === '```') {
      if (inCode) {
        const bloco = blocoAtual.join('\n');
        if (bloco.includes('H\'aanit') || bloco.includes('H\'aanit')) {
          blocos.push(bloco);
        }
        blocoAtual = [];
        inCode = false;
      } else {
        inCode = true;
      }
    } else if (inCode) {
      blocoAtual.push(linhas[i]);
    }
  }
  
  return blocos;
}

// ============================================================
// GALDERA — extrair de Manual_Interpretacao_Lote1
// ============================================================
function extrairGaldera() {
  const manualPath = path.join(MEMORY_DIR, 'Manual_Interpretacao_Lote1_01a30.md');
  const conteudo = fs.readFileSync(manualPath, 'utf8');
  const linhas = conteudo.split('\n');
  
  let inicio = -1;
  let fim = -1;
  
  for (let i = 0; i < linhas.length; i++) {
    if (linhas[i].includes('## Galdera')) {
      inicio = i;
    } else if (inicio !== -1 && linhas[i].includes('## ') && i > inicio + 5) {
      fim = i;
      break;
    }
  }
  
  if (inicio === -1) {
    console.log('Galdera: seção não encontrada no Manual');
    return null;
  }
  
  if (fim === -1) fim = linhas.length;
  
  const secao = linhas.slice(inicio, fim).join('\n');
  return secao;
}

// ============================================================
// ELRICA — extrair do E-CENAS.md
// ============================================================
function extrairElricaECenas() {
  const cenasPath = path.join(MEMORY_DIR, 'E-CENAS.md');
  const conteudo = fs.readFileSync(cenasPath, 'utf8');
  const linhas = conteudo.split('\n');
  
  const blocos = [];
  let inCode = false;
  let blocoAtual = [];
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (linha === '```') {
      if (inCode) {
        const bloco = blocoAtual.join('\n');
        if (bloco.includes('Elrica')) {
          blocos.push(bloco);
        }
        blocoAtual = [];
        inCode = false;
      } else {
        inCode = true;
      }
    } else if (inCode) {
      blocoAtual.push(linhas[i]);
    }
  }
  
  return blocos;
}

// ============================================================
// Processar
// ============================================================
console.log('=== CORREÇÃO DE ARQUIVOS VAZIOS FINAIS ===');

// 1. H'AANIT
console.log('\n--- H\'aanit ---');
const haanitCenas = extrairHaanitCenas();
const haanitECenas = extrairHaanitECenas();

console.log(`Cenas.md: ${haanitCenas ? haanitCenas.length + ' chars' : 'nada'}`);
console.log(`E-CENAS.md: ${haanitECenas.length} blocos`);

if (haanitCenas) {
  // Separar diálogos e cenas
  const partes = haanitCenas.split(/\n(?=\d+\.\s+\d+\.\s+\(|\n\d+\.\s+[A-ZÀ-Ú])/);
  
  // Escrever diálogos
  const dialogPath = path.join(DATASET_DIR, 'haanit', '17_dialog_examples.md');
  const cenasPath = path.join(DATASET_DIR, 'haanit', '18_scene_examples.md');
  
  // Diálogos do Cenas.md (primeira parte com travessões)
  const dialogosCenas = [];
  const cenasNarrativas = [];
  
  const secaoPartes = haanitCenas.split(/\n(?=\\?#\s+\d+\s+—)/);
  
  // Verificar a estrutura do Cenas.md
  // Seção 1 = DIÁLOGOS, Seção 2 = CENAS NARRATIVAS
  let secaoAtual = '';
  for (const parte of secaoPartes) {
    if (parte.includes('DIÁLOGOS')) secaoAtual = 'dialogos';
    else if (parte.includes('CENAS NARRATIVAS')) secaoAtual = 'cenas';
    else if (parte.includes('TOMADA DE DECISÃO')) secaoAtual = 'decisao';
    else if (parte.includes('MONÓLOGOS')) secaoAtual = 'monologos';
    else if (parte.includes('COMBATE')) secaoAtual = 'combate';
    
    if (secaoAtual === 'dialogos' || secaoAtual === 'monologos') {
      dialogosCenas.push(parte);
    } else if (secaoAtual === 'cenas' || secaoAtual === 'combate') {
      cenasNarrativas.push(parte);
    }
  }
  
  // Escrever arquivos
  if (dialogosCenas.length > 0) {
    fs.writeFileSync(dialogPath, dialogosCenas.join('\n\n---\n\n'), 'utf8');
    console.log(`17_dialog_examples.md: ${dialogosCenas.length} seções escritas`);
  } else {
    console.log('17_dialog_examples.md: nenhum diálogo encontrado no Cenas.md');
  }
  
  if (cenasNarrativas.length > 0) {
    fs.writeFileSync(cenasPath, cenasNarrativas.join('\n\n---\n\n'), 'utf8');
    console.log(`18_scene_examples.md: ${cenasNarrativas.length} seções escritas`);
  } else {
    console.log('18_scene_examples.md: nenhuma cena encontrada no Cenas.md');
  }
}

// Adicionar blocos do E-CENAS.md
if (haanitECenas.length > 0) {
  const dialogPath = path.join(DATASET_DIR, 'haanit', '17_dialog_examples.md');
  const cenasPath = path.join(DATASET_DIR, 'haanit', '18_scene_examples.md');
  
  let dialogos = fs.existsSync(dialogPath) ? fs.readFileSync(dialogPath, 'utf8') : '';
  let cenas = fs.existsSync(cenasPath) ? fs.readFileSync(cenasPath, 'utf8') : '';
  
  for (const bloco of haanitECenas) {
    const ehDialog = bloco.includes('—');
    if (ehDialog) {
      if (!dialogos.includes(bloco)) {
        if (dialogos) dialogos += '\n\n---\n\n';
        dialogos += bloco;
      }
    } else {
      if (!cenas.includes(bloco)) {
        if (cenas) cenas += '\n\n---\n\n';
        cenas += bloco;
      }
    }
  }
  
  fs.writeFileSync(dialogPath, dialogos, 'utf8');
  fs.writeFileSync(cenasPath, cenas, 'utf8');
  
  console.log(`E-CENAS.md: ${haanitECenas.length} blocos adicionados`);
  console.log(`17_dialog_examples.md total: ${dialogos.length} chars`);
  console.log(`18_scene_examples.md total: ${cenas.length} chars`);
} else {
  console.log('E-CENAS.md: nenhum bloco de H\'aanit encontrado');
}

// 2. ELRICA
console.log('\n--- Elrica Edoras ---');
const elricaECenas = extrairElricaECenas();
console.log(`E-CENAS.md: ${elricaECenas.length} blocos`);

if (elricaECenas.length > 0) {
  const dialogPath = path.join(DATASET_DIR, 'elrica_edoras', '17_dialog_examples.md');
  const cenasPath = path.join(DATASET_DIR, 'elrica_edoras', '18_scene_examples.md');
  
  let dialogos = fs.existsSync(dialogPath) ? fs.readFileSync(dialogPath, 'utf8') : '';
  let cenas = fs.existsSync(cenasPath) ? fs.readFileSync(cenasPath, 'utf8') : '';
  
  for (const bloco of elricaECenas) {
    const ehDialog = bloco.includes('—');
    if (ehDialog) {
      if (!dialogos.includes(bloco)) {
        if (dialogos) dialogos += '\n\n---\n\n';
        dialogos += bloco;
      }
    } else {
      if (!cenas.includes(bloco)) {
        if (cenas) cenas += '\n\n---\n\n';
        cenas += bloco;
      }
    }
  }
  
  fs.writeFileSync(dialogPath, dialogos, 'utf8');
  fs.writeFileSync(cenasPath, cenas, 'utf8');
  
  console.log(`17_dialog_examples.md total: ${dialogos.length} chars`);
  console.log(`18_scene_examples.md total: ${cenas.length} chars`);
}

// 3. GALDERA
console.log('\n--- Galdera ---');
const galderaData = extrairGaldera();
console.log(`Manual: ${galderaData ? galderaData.length + ' chars' : 'nada'}`);

// Procurar em outros arquivos de memória
const outrosArquivos = ['Base_Conhecimento_Personagens_Lote02.md', 'Base_Conhecimento_Personagens_Lote03.md'];
const galderaBlocos = [];

for (const arquivo of outrosArquivos) {
  const caminho = path.join(MEMORY_DIR, arquivo);
  if (!fs.existsSync(caminho)) continue;
  const conteudo = fs.readFileSync(caminho, 'utf8');
  if (conteudo.includes('Galdera')) {
    console.log(`${arquivo}: contém referências a Galdera`);
  }
}

// Verificar CENAS2.md
const cenas2 = fs.readFileSync(path.join(MEMORY_DIR, 'CENAS2.md'), 'utf8');
if (cenas2.includes('Galdera')) {
  console.log('CENAS2.md: contém referências a Galdera');
} else {
  console.log('CENAS2.md: não contém Galdera');
}

// Criar arquivos com conteúdo mínimo baseado no manual de interpretação
if (galderaData) {
  const dialogPath = path.join(DATASET_DIR, 'galdera', '17_dialog_examples.md');
  const cenasPath = path.join(DATASET_DIR, 'galdera', '18_scene_examples.md');
  
  // Verificar se os arquivos estão vazios
  const dialogAtual = fs.existsSync(dialogPath) ? fs.readFileSync(dialogPath, 'utf8') : '';
  const cenasAtual = fs.existsSync(cenasPath) ? fs.readFileSync(cenasPath, 'utf8') : '';
  
  if (!dialogAtual.trim()) {
    console.log('17_dialog_examples.md vazio — não há conteúdo de diálogo de Galdera nos arquivos de memória.');
  }
  
  if (!cenasAtual.trim()) {
    console.log('18_scene_examples.md vazio — não há conteúdo de cena de Galdera nos arquivos de memória.');
  }
}

console.log('\n=== CORREÇÃO CONCLUÍDA ===');