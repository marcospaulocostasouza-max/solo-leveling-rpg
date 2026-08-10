/**
 * AUDITORIA FINAL COMPLETA - NPC_LORA (v3)
 * Verifica todos os datasets, JSONs, scripts e consistência do projeto
 * Corrigido: filtros de codificação, busca de JSONs em src/npc/data,
 * exclusão de arquivos de sistema, correção de imports
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', 'NPC_LORA');
const SRC_ROOT = path.join(__dirname, '..', 'src');
const DATASET_DIR = path.join(ROOT, 'dataset');
const SCRIPTS_DIR = path.join(ROOT, 'scripts');
const MEMORY_DIR = path.join(ROOT, 'memory');
const DOCS_DIR = path.join(ROOT, 'docs');
const CONFIGS_DIR = path.join(ROOT, 'configs');
const OUTPUT_DIR = path.join(ROOT, 'output');
const NPC_DATA_DIR = path.join(SRC_ROOT, 'npc', 'data');

const ARQUIVOS_PADRAO = [
  '01_identity.md', '02_summary.md', '03_history.md', '04_personality.md',
  '05_interpretation.md', '06_speech.md', '07_values.md', '08_likes.md',
  '09_dislikes.md', '10_traumas.md', '11_relationships.md', '12_goals.md',
  '13_knowledge.md', '14_curiosities.md', '15_narrative_gaps.md',
  '16_absolute_rules.md', '17_dialog_examples.md', '18_scene_examples.md'
];

// Arquivos que não devem ser considerados como JSON de dados do projeto
const ARQUIVOS_JSON_IGNORADOS = [
  'tsconfig.json', 'package.json', 'package-lock.json', 'tsconfig.tsbuildinfo'
];

const resultados = {
  total_npcs: 0,
  total_datasets: 0,
  total_jsons: 0,
  total_scripts: 0,
  total_arquivos_analisados: 0,
  total_erros: 0,
  total_corrigidos: 0,
  erros_nao_corrigidos: [],
  npcs_completos: [],
  npcs_incompletos: [],
  arquivos_vazios: [],
  arquivos_inexistentes: [],
  problemas_estrutura: [],
  problemas_codificacao: [],
  problemas_importacao: [],
  problemas_consistencia: [],
  duplicacoes: [],
  blocos_duplicados: [],
  informacoes_contraditorias: [],
  problemas_nomenclatura: [],
  pastas_orfas: [],
  datasets_orfos: [],
  jsons_sem_dataset: [],
  datasets_sem_json: [],
  ids_inconsistentes: [],
  nomes_inconsistentes: [],
  caminhos_invalidos: [],
  links_quebrados: [],
  dialogos_duplicados: [],
  cenas_duplicadas: [],
  cenas_npc_errado: [],
  dialogos_outro_personagem: [],
  blocos_repetidos: [],
  blocos_corrompidos: [],
  blocos_incompletos: [],
  problemas_formatacao: []
};

// ============================================================
// 1. VERIFICAR DATASETS
// ============================================================
function verificarDatasets() {
  console.log('=== VERIFICANDO DATASETS ===');
  
  if (!fs.existsSync(DATASET_DIR)) {
    resultados.problemas_estrutura.push('Pasta dataset não existe');
    return;
  }
  
  const pastas = fs.readdirSync(DATASET_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  
  const pastasNPC = pastas.filter(p => p !== '_TEMPLATE');
  resultados.total_npcs = pastasNPC.length;
  resultados.total_datasets = pastasNPC.length;
  
  for (const pasta of pastasNPC) {
    const pastaPath = path.join(DATASET_DIR, pasta);
    const arquivos = fs.readdirSync(pastaPath);
    const arquivosMD = arquivos.filter(f => f.endsWith('.md'));
    
    const arquivosFaltantes = ARQUIVOS_PADRAO.filter(f => !arquivos.includes(f));
    const arquivosExtras = arquivosMD.filter(f => !ARQUIVOS_PADRAO.includes(f));
    
    if (arquivosFaltantes.length > 0) {
      for (const f of arquivosFaltantes) {
        resultados.arquivos_inexistentes.push(`${pasta}/${f}`);
        resultados.total_erros++;
      }
      if (!resultados.npcs_incompletos.includes(pasta)) {
        resultados.npcs_incompletos.push(pasta);
      }
    }
    
    if (arquivosExtras.length > 0) {
      for (const f of arquivosExtras) {
        resultados.problemas_estrutura.push(`Arquivo extra em ${pasta}: ${f}`);
        resultados.total_erros++;
      }
    }
    
    let temConteudo = false;
    let todosTemConteudo = true;
    for (const arquivo of arquivosMD) {
      const arquivoPath = path.join(pastaPath, arquivo);
      const conteudo = fs.readFileSync(arquivoPath, 'utf8');
      resultados.total_arquivos_analisados++;
      
      if (!conteudo.trim()) {
        resultados.arquivos_vazios.push(`${pasta}/${arquivo}`);
        resultados.total_erros++;
        todosTemConteudo = false;
        continue;
      }
      
      const linhas = conteudo.trim().split('\n');
      if (linhas.length <= 2 && linhas[0].startsWith('#')) {
        resultados.problemas_estrutura.push(`Arquivo apenas com título: ${pasta}/${arquivo}`);
        resultados.total_erros++;
        todosTemConteudo = false;
        continue;
      }
      
      verificarCodificacao(conteudo, `${pasta}/${arquivo}`);
      
      if (conteudo.trim().length > 10) {
        temConteudo = true;
      }
    }
    
    if (temConteudo && arquivosFaltantes.length === 0 && todosTemConteudo) {
      if (!resultados.npcs_completos.includes(pasta)) {
        resultados.npcs_completos.push(pasta);
      }
    }
    
    verificarDuplicacoesBlocos(pastaPath, pasta);
  }
  
  for (const pasta of pastasNPC) {
    const pastaPath = path.join(DATASET_DIR, pasta);
    const arquivos = fs.readdirSync(pastaPath);
    const arquivosMD = arquivos.filter(f => f.endsWith('.md'));
    if (arquivosMD.length === 0) {
      resultados.pastas_orfas.push(pasta);
      resultados.total_erros++;
    }
  }
}

// ============================================================
// 2. VERIFICAR CODIFICAÇÃO (corrigido)
// ============================================================
function verificarCodificacao(conteudo, arquivo) {
  // Padrões de corrupção REAL de codificação
  // Exclui Ã e Â pois são caracteres válidos em português
  const padroesCorrupcao = [
    /Ã£/g, /Ã¡/g, /Ã¢/g, /Ã¤/g,
    /Ã©/g, /Ã¨/g, /Ãª/g, /Ã«/g,
    /Ã­/g, /Ã¬/g, /Ã®/g, /Ã¯/g,
    /Ã³/g, /Ã²/g, /Ã´/g, /Ã¶/g,
    /Ãº/g, /Ã¹/g, /Ã»/g, /Ã¼/g,
    /Ã§/g,
    /Ãƒ/g, /Ã‰/g, /ÃŠ/g, /Ã‹/g,
    /Ã“/g, /Ã”/g, /Ã•/g, /Ã–/g,
    /Ãš/g, /Ã›/g, /Ãœ/g, /Ã‡/g,
    /â€™/g, /â€œ/g, /â€/g, /â€“/g, /â€”/g, /â€¦/g,
    /\uFFFD/g
  ];
  
  for (const padrao of padroesCorrupcao) {
    const matches = conteudo.match(padrao);
    if (matches && matches.length > 0) {
      resultados.problemas_codificacao.push(`${arquivo}: corrupção de codificação (${matches.length} ocorrências de ${padrao.source})`);
      resultados.total_erros++;
      return;
    }
  }
}

// ============================================================
// 3. VERIFICAR DUPLICAÇÕES DE BLOCOS
// ============================================================
function verificarDuplicacoesBlocos(pastaPath, npc) {
  const arquivos = fs.readdirSync(pastaPath).filter(f => f.endsWith('.md'));
  const todosConteudos = [];
  
  for (const arquivo of arquivos) {
    const conteudo = fs.readFileSync(path.join(pastaPath, arquivo), 'utf8');
    todosConteudos.push({ arquivo, conteudo });
  }
  
  for (let i = 0; i < todosConteudos.length; i++) {
    for (let j = i + 1; j < todosConteudos.length; j++) {
      const a = todosConteudos[i];
      const b = todosConteudos[j];
      
      const blocosA = a.conteudo.split('\n\n').filter(b => b.trim().length > 100);
      const blocosB = b.conteudo.split('\n\n').filter(b => b.trim().length > 100);
      
      for (const blocoA of blocosA) {
        for (const blocoB of blocosB) {
          if (blocoA.trim() === blocoB.trim()) {
            resultados.blocos_duplicados.push(`${npc}: bloco duplicado entre ${a.arquivo} e ${b.arquivo}`);
            resultados.total_erros++;
          }
        }
      }
    }
  }
}

// ============================================================
// 4. VERIFICAR SCRIPTS
// ============================================================
function verificarScripts() {
  console.log('=== VERIFICANDO SCRIPTS ===');
  
  const projetosScripts = [
    { dir: SCRIPTS_DIR, prefixo: 'NPC_LORA/scripts' },
    { dir: path.join(__dirname, '..', 'scripts'), prefixo: 'scripts' }
  ];
  
  let totalScripts = 0;
  
  for (const { dir, prefixo } of projetosScripts) {
    if (!fs.existsSync(dir)) continue;
    const scripts = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    totalScripts += scripts.length;
    
    for (const script of scripts) {
      const scriptPath = path.join(dir, script);
      const conteudo = fs.readFileSync(scriptPath, 'utf8');
      resultados.total_arquivos_analisados++;
      
      const imports = conteudo.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) || [];
      for (const imp of imports) {
        const modulo = imp.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/)[1];
        
        // Ignorar imports de módulos com template strings
        if (modulo.includes('${')) continue;
        
        if (!modulo.startsWith('.') && !modulo.startsWith('node:')) {
          // Módulo npm, verificar se existe no package.json ou node_modules
          const pkgPath = path.join(__dirname, '..', 'package.json');
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
            if (!deps[modulo]) {
              try {
                require.resolve(modulo, { paths: [path.join(__dirname, '..')] });
              } catch (e) {
                resultados.problemas_importacao.push(`${script}: módulo não encontrado: ${modulo}`);
                resultados.total_erros++;
              }
            }
          } catch (e) {
            // package.json inválido, tentar require.resolve
            try {
              require.resolve(modulo, { paths: [path.join(__dirname, '..')] });
            } catch (e2) {
              resultados.problemas_importacao.push(`${script}: módulo não encontrado: ${modulo}`);
              resultados.total_erros++;
            }
          }
        } else if (modulo.startsWith('.')) {
          // Import relativo
          const resolvedPath = path.resolve(path.dirname(scriptPath), modulo);
          const candidates = [resolvedPath, resolvedPath + '.js', resolvedPath + '.json', resolvedPath + '.mjs'];
          const existe = candidates.some(c => fs.existsSync(c));
          if (!existe && !resolvedPath.includes('.') && fs.existsSync(resolvedPath + '.jsx')) {
            // OK
          } else if (!existe) {
            resultados.problemas_importacao.push(`${script}: import relativo não encontrado: ${modulo}`);
            resultados.total_erros++;
          }
        }
      }
    }
  }
  
  resultados.total_scripts = totalScripts;
}

// ============================================================
// 5. VERIFICAR JSONs
// ============================================================
function verificarJSONs() {
  console.log('=== VERIFICANDO JSONs ===');
  
  const jsonFiles = [];
  
  function buscarJSONs(dir) {
    if (!fs.existsSync(dir)) return;
    const itens = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of itens) {
      if (item.name === 'node_modules') continue;
      const itemPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        buscarJSONs(itemPath);
      } else if (item.name.endsWith('.json') && !item.name.endsWith('.tsbuildinfo')) {
        if (!ARQUIVOS_JSON_IGNORADOS.includes(item.name)) {
          jsonFiles.push(itemPath);
        }
      }
    }
  }
  
  // Obter pastas do dataset
  const pastasDataset = fs.readdirSync(DATASET_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== '_TEMPLATE')
    .map(d => d.name);
  
  buscarJSONs(ROOT);
  buscarJSONs(SRC_ROOT);
  
  const unicos = [...new Set(jsonFiles)];
  resultados.total_jsons = unicos.length;
  
  const jsonNPCs = [];
  for (const jsonPath of unicos) {
    resultados.total_arquivos_analisados++;
    try {
      const conteudo = fs.readFileSync(jsonPath, 'utf8');
      const json = JSON.parse(conteudo);
      
      if (json.id || json.nome || json.name || json.folder) {
        const id = json.id || json.nome || json.name || json.folder;
        const nomeNormalizado = String(id).toLowerCase().replace(/\s+/g, '_');
        
        const datasetPath = path.join(DATASET_DIR, nomeNormalizado);
        if (!fs.existsSync(datasetPath)) {
          // Verificar se é um JSON de NPC legítimo
          if (json.classe || json.rank || json.elemento) {
            // Verificar se corresponde a algum NPC do dataset por nome real
            const corresponde = pastasDataset.some(p => 
              String(json.nome || json.id || '').toLowerCase().includes(p.replace(/_/g, ' '))
            );
            if (!corresponde) {
              resultados.jsons_sem_dataset.push(`${path.basename(jsonPath)} (id: ${id})`);
              resultados.total_erros++;
            }
          }
        } else {
          jsonNPCs.push({ path: jsonPath, id: nomeNormalizado });
        }
      }
    } catch (e) {
      resultados.problemas_estrutura.push(`JSON inválido: ${path.basename(jsonPath)} - ${e.message}`);
      resultados.total_erros++;
    }
  }
  
  const jsonDeNPCs = new Set(jsonNPCs.map(j => j.id));
  
  for (const pasta of pastasDataset) {
    if (!jsonDeNPCs.has(pasta)) {
      resultados.datasets_sem_json.push(pasta);
      resultados.total_erros++;
    }
  }
}

// ============================================================
// 6. VERIFICAR DIÁLOGOS E CENAS
// ============================================================
function verificarDialogosCenas() {
  console.log('=== VERIFICANDO DIÁLOGOS E CENAS ===');
  
  const pastas = fs.readdirSync(DATASET_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== '_TEMPLATE')
    .map(d => d.name);
  
  for (const pasta of pastas) {
    const dialogPath = path.join(DATASET_DIR, pasta, '17_dialog_examples.md');
    const cenasPath = path.join(DATASET_DIR, pasta, '18_scene_examples.md');
    
    for (const [arquivoPath, tipo] of [
      [dialogPath, '17_dialog_examples.md'],
      [cenasPath, '18_scene_examples.md']
    ]) {
      if (fs.existsSync(arquivoPath)) {
        const conteudo = fs.readFileSync(arquivoPath, 'utf8');
        const linhas = conteudo.split('\n');
        for (const linha of linhas) {
          if (linha.includes('*') && linha.includes(':')) {
            const match = linha.match(/\*\s*([A-Za-zÀ-ú\s]+):/);
            if (match) {
              const nome = match[1].trim();
              const nomeNorm = nome.toLowerCase().replace(/\s+/g, '_');
              if (nomeNorm !== pasta && !nomeNorm.includes(pasta)) {
                const personagensConhecidos = [
                  'sung jinwoo', 'cha hae-in', 'go gunhee', 'woo jinchul',
                  'baek yoonho', 'choi jong-in', 'lee joonhee', 'yoo jinho',
                  'sung il-hwan', 'kang taeshik', 'hwang dongsuk', 'min byung-gu',
                  'lim taegyu', 'park heejin', 'kim chul', 'han song-yi'
                ];
                if (personagensConhecidos.includes(nomeNorm)) {
                  const alvo = tipo.startsWith('17') ? 'dialogos_outro_personagem' : 'cenas_npc_errado';
                  resultados[alvo].push(`${pasta}: ${nome} em ${tipo}`);
                  resultados.total_erros++;
                }
              }
            }
          }
        }
      }
    }
  }
}

// ============================================================
// 7. VERIFICAR MEMORY, DOCS, CONFIGS, OUTPUT
// ============================================================
function verificarArquivosAuxiliares() {
  console.log('=== VERIFICANDO ARQUIVOS AUXILIARES ===');
  
  for (const [dir, prefixo] of [
    [MEMORY_DIR, 'memory'],
    [DOCS_DIR, 'docs'],
    [CONFIGS_DIR, 'configs']
  ]) {
    if (!fs.existsSync(dir)) {
      resultados.problemas_estrutura.push(`Pasta ${path.basename(dir)} não existe`);
      continue;
    }
    const arquivos = fs.readdirSync(dir);
    for (const arquivo of arquivos) {
      const arquivoPath = path.join(dir, arquivo);
      if (fs.statSync(arquivoPath).isFile()) {
        const conteudo = fs.readFileSync(arquivoPath, 'utf8');
        resultados.total_arquivos_analisados++;
        if (!conteudo.trim()) {
          resultados.arquivos_vazios.push(`${prefixo}/${arquivo}`);
          resultados.total_erros++;
        }
        verificarCodificacao(conteudo, `${prefixo}/${arquivo}`);
      }
    }
  }
  
  if (fs.existsSync(OUTPUT_DIR)) {
    const arquivos = fs.readdirSync(OUTPUT_DIR);
    for (const arquivo of arquivos) {
      const arquivoPath = path.join(OUTPUT_DIR, arquivo);
      if (fs.statSync(arquivoPath).isFile()) {
        const conteudo = fs.readFileSync(arquivoPath, 'utf8');
        resultados.total_arquivos_analisados++;
        if (!conteudo.trim()) {
          resultados.arquivos_vazios.push(`output/${arquivo}`);
          resultados.total_erros++;
        }
      }
    }
  } else {
    resultados.problemas_estrutura.push('Pasta output não existe');
  }
}

// ============================================================
// 8. VERIFICAR NOMENCLATURA
// ============================================================
function verificarNomenclatura() {
  console.log('=== VERIFICANDO NOMENCLATURA ===');
  
  const pastas = fs.readdirSync(DATASET_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== '_TEMPLATE')
    .map(d => d.name);
  
  for (const pasta of pastas) {
    if (!/^[a-z0-9_]+$/.test(pasta)) {
      resultados.problemas_nomenclatura.push(`Pasta com nome inválido: ${pasta}`);
      resultados.total_erros++;
    }
    
    const pastaPath = path.join(DATASET_DIR, pasta);
    const arquivos = fs.readdirSync(pastaPath);
    for (const arquivo of arquivos) {
      if (!/^\d{2}_[a-z_]+\.md$/.test(arquivo)) {
        resultados.problemas_nomenclatura.push(`Arquivo com nome inválido: ${pasta}/${arquivo}`);
        resultados.total_erros++;
      }
    }
  }
}

// ============================================================
// 9. VERIFICAR LINKS QUEBRADOS
// ============================================================
function verificarLinksQuebrados() {
  console.log('=== VERIFICANDO LINKS QUEBRADOS ===');
  
  const pastas = fs.readdirSync(DATASET_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== '_TEMPLATE')
    .map(d => d.name);
  
  for (const pasta of pastas) {
    const pastaPath = path.join(DATASET_DIR, pasta);
    const arquivos = fs.readdirSync(pastaPath).filter(f => f.endsWith('.md'));
    
    for (const arquivo of arquivos) {
      const conteudo = fs.readFileSync(path.join(pastaPath, arquivo), 'utf8');
      
      const links = conteudo.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
      for (const link of links) {
        const url = link.match(/\(([^)]+)\)/)[1];
        if (url.startsWith('http')) continue;
        if (url.startsWith('#')) continue;
        
        const targetPath = path.resolve(path.dirname(path.join(pastaPath, arquivo)), url);
        if (!fs.existsSync(targetPath)) {
          resultados.links_quebrados.push(`${pasta}/${arquivo}: link quebrado para ${url}`);
          resultados.total_erros++;
        }
      }
    }
  }
}

// ============================================================
// 10. VERIFICAR ARQUIVOS DUPLICADOS
// ============================================================
function verificarArquivosDuplicados() {
  console.log('=== VERIFICANDO ARQUIVOS DUPLICADOS ===');
  
  const pastas = fs.readdirSync(DATASET_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== '_TEMPLATE')
    .map(d => d.name);
  
  const hashMap = {};
  
  for (const pasta of pastas) {
    const pastaPath = path.join(DATASET_DIR, pasta);
    const arquivos = fs.readdirSync(pastaPath).filter(f => f.endsWith('.md'));
    
    for (const arquivo of arquivos) {
      const conteudo = fs.readFileSync(path.join(pastaPath, arquivo), 'utf8');
      // Ignorar arquivos vazios (já contados)
      if (!conteudo.trim()) continue;
      const hash = crypto.createHash('md5').update(conteudo).digest('hex');
      
      if (hashMap[hash]) {
        resultados.duplicacoes.push(`${pasta}/${arquivo} é duplicado de ${hashMap[hash]}`);
        resultados.total_erros++;
      } else {
        hashMap[hash] = `${pasta}/${arquivo}`;
      }
    }
  }
}

// ============================================================
// EXECUTAR TODAS AS VERIFICAÇÕES
// ============================================================
console.log('========================================');
console.log('AUDITORIA FINAL COMPLETA - NPC_LORA (v3)');
console.log('========================================\n');

verificarDatasets();
verificarScripts();
verificarJSONs();
verificarDialogosCenas();
verificarArquivosAuxiliares();
verificarNomenclatura();
verificarLinksQuebrados();
verificarArquivosDuplicados();

// ============================================================
// GERAR RELATÓRIO
// ============================================================
console.log('\n========================================');
console.log('GERANDO RELATÓRIO FINAL');
console.log('========================================\n');

const relatorio = [];
relatorio.push('========================================');
relatorio.push('RELATÓRIO FINAL DE AUDITORIA - NPC_LORA');
relatorio.push('========================================');
relatorio.push('');
relatorio.push(`Data: ${new Date().toISOString()}`);
relatorio.push('');
relatorio.push('--- RESUMO GERAL ---');
relatorio.push(`Total de NPCs: ${resultados.total_npcs}`);
relatorio.push(`Total de datasets: ${resultados.total_datasets}`);
relatorio.push(`Total de JSONs: ${resultados.total_jsons}`);
relatorio.push(`Total de scripts: ${resultados.total_scripts}`);
relatorio.push(`Total de arquivos analisados: ${resultados.total_arquivos_analisados}`);
relatorio.push(`Total de erros encontrados: ${resultados.total_erros}`);
relatorio.push(`Total de erros corrigidos: ${resultados.total_corrigidos}`);
relatorio.push('');
relatorio.push('--- NPCs COMPLETOS ---');
relatorio.push(resultados.npcs_completos.length > 0 ? resultados.npcs_completos.join(', ') : 'Nenhum');
relatorio.push('');
relatorio.push('--- NPCs INCOMPLETOS ---');
relatorio.push(resultados.npcs_incompletos.length > 0 ? resultados.npcs_incompletos.join(', ') : 'Nenhum');
relatorio.push('');
relatorio.push('--- ARQUIVOS VAZIOS ---');
relatorio.push(resultados.arquivos_vazios.length > 0 ? resultados.arquivos_vazios.join('\n') : 'Nenhum');
relatorio.push('');
relatorio.push('--- ARQUIVOS INEXISTENTES ---');
relatorio.push(resultados.arquivos_inexistentes.length > 0 ? resultados.arquivos_inexistentes.join('\n') : 'Nenhum');
relatorio.push('');
relatorio.push('--- PROBLEMAS DE ESTRUTURA ---');
relatorio.push(resultados.problemas_estrutura.length > 0 ? resultados.problemas_estrutura.join('\n') : 'Nenhum');
relatorio.push('');
relatorio.push('--- PROBLEMAS DE CODIFICAÇÃO ---');
relatorio.push(resultados.problemas_codificacao.length > 0 ? resultados.problemas_codificacao.join('\n') : 'Nenhum');
relatorio.push('');
relatorio.push('--- PROBLEMAS DE IMPORTAÇÃO ---');
relatorio.push(resultados.problemas_importacao.length > 0 ? resultados.problemas_importacao.join('\n') : 'Nenhum');
relatorio.push('');
relatorio.push('--- PROBLEMAS DE CONSISTÊNCIA ---');
relatorio.push(resultados.problemas_consistencia.length > 0 ? resultados.problemas_consistencia.join('\n') : 'Nenhum');
relatorio.push('');
relatorio.push('--- DUPLICAÇÕES ---');
relatorio.push(resultados.duplicacoes.length > 0 ? resultados.duplicacoes.join('\n') : 'Nenhum');
relatorio.push('');
relatorio.push('--- BLOCOS DUPLICADOS ---');
relatorio.push(resultados.blocos_duplicados.length > 0 ? resultados.blocos_duplicados.join('\n') : 'Nenhum');
relatorio.push('');
relatorio.push('--- DIÁLOGOS DE OUTRO PERSONAGEM ---');
relatorio.push(resultados.dialogos_outro_personagem.length > 0 ? resultados.dialogos_outro_personagem.join('\n') : 'Nenhum');
relatorio.push('');
relatorio.push('--- CENAS DE NPC ERRADO ---');
relatorio.push(resultados.cenas_npc_errado.length > 0 ? resultados.cenas_npc_errado.join('\n') : 'Nenhum');
relatorio.push('');
relatorio.push('--- PROBLEMAS DE NOMENCLATURA ---');
relatorio.push(resultados.problemas_nomenclatura.length > 0 ? resultados.problemas_nomenclatura.join('\n') : 'Nenhum');
relatorio.push('');
relatorio.push('--- PASTAS ÓRFÃS ---');
relatorio.push(resultados.pastas_orfas.length > 0 ? resultados.pastas_orfas.join('\n') : 'Nenhum');
relatorio.push('');
relatorio.push('--- DATASETS SEM JSON ---');
relatorio.push(resultados.datasets_sem_json.length > 0 ? resultados.datasets_sem_json.join('\n') : 'Nenhum');
relatorio.push('');
relatorio.push('--- JSONs SEM DATASET ---');
relatorio.push(resultados.jsons_sem_dataset.length > 0 ? resultados.jsons_sem_dataset.join('\n') : 'Nenhum');
relatorio.push('');
relatorio.push('--- LINKS QUEBRADOS ---');
relatorio.push(resultados.links_quebrados.length > 0 ? resultados.links_quebrados.join('\n') : 'Nenhum');
relatorio.push('');
relatorio.push('--- ERROS NÃO CORRIGIDOS ---');
relatorio.push(resultados.erros_nao_corrigidos.length > 0 ? resultados.erros_nao_corrigidos.join('\n') : 'Nenhum');
relatorio.push('');
relatorio.push('--- NOTA GERAL ---');
const pronto = resultados.total_erros === 0;
relatorio.push(`Projeto pronto para treinamento: ${pronto ? 'SIM' : 'NÃO'}`);
if (!pronto) {
  relatorio.push('');
  relatorio.push('O que impede o treinamento:');
  if (resultados.arquivos_inexistentes.length > 0) relatorio.push(`- ${resultados.arquivos_inexistentes.length} arquivos inexistentes`);
  if (resultados.arquivos_vazios.length > 0) relatorio.push(`- ${resultados.arquivos_vazios.length} arquivos vazios`);
  if (resultados.problemas_estrutura.length > 0) relatorio.push(`- ${resultados.problemas_estrutura.length} problemas de estrutura`);
  if (resultados.problemas_codificacao.length > 0) relatorio.push(`- ${resultados.problemas_codificacao.length} problemas de codificação`);
  if (resultados.problemas_importacao.length > 0) relatorio.push(`- ${resultados.problemas_importacao.length} problemas de importação`);
  if (resultados.duplicacoes.length > 0) relatorio.push(`- ${resultados.duplicacoes.length} duplicações`);
  if (resultados.blocos_duplicados.length > 0) relatorio.push(`- ${resultados.blocos_duplicados.length} blocos duplicados`);
  if (resultados.dialogos_outro_personagem.length > 0) relatorio.push(`- ${resultados.dialogos_outro_personagem.length} diálogos de outro personagem`);
  if (resultados.cenas_npc_errado.length > 0) relatorio.push(`- ${resultados.cenas_npc_errado.length} cenas de NPC errado`);
  if (resultados.problemas_nomenclatura.length > 0) relatorio.push(`- ${resultados.problemas_nomenclatura.length} problemas de nomenclatura`);
  if (resultados.pastas_orfas.length > 0) relatorio.push(`- ${resultados.pastas_orfas.length} pastas órfãs`);
  if (resultados.datasets_sem_json.length > 0) relatorio.push(`- ${resultados.datasets_sem_json.length} datasets sem JSON`);
  if (resultados.jsons_sem_dataset.length > 0) relatorio.push(`- ${resultados.jsons_sem_dataset.length} JSONs sem dataset`);
  if (resultados.links_quebrados.length > 0) relatorio.push(`- ${resultados.links_quebrados.length} links quebrados`);
}

const relatorioPath = path.join(__dirname, '..', 'RELATORIO_FINAL_AUDITORIA.txt');
fs.writeFileSync(relatorioPath, relatorio.join('\n'), 'utf8');
console.log(`Relatório gerado em: ${relatorioPath}`);
console.log(`Total de erros: ${resultados.total_erros}`);
console.log(`Projeto pronto para treinamento: ${pronto ? 'SIM' : 'NÃO'}`);