/**
 * VERIFICAÇÃO COMPLETA DE TODOS OS NPCS
 * 
 * Verifica:
 * 1. Arquivos JSON em src/npc/data/ - campos obrigatórios e ausentes
 * 2. Arquivos de comando em src/commands/ - existência
 * 3. Pastas de dataset em NPC_LORA/dataset/ - existência e conteúdo
 * 4. Comparação de nomes entre JSON e outras fontes
 * 5. Consistência de ids
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DATA_DIR = path.join(RAIZ, 'src', 'npc', 'data');
const COMMANDS_DIR = path.join(RAIZ, 'src', 'commands');
const DATASET_DIR = path.join(RAIZ, 'NPC_LORA', 'dataset');
const RELATORIOS_DIR = path.join(RAIZ, 'RELATORIOS_ETAPA8');

// Campos obrigatórios que todo NPC deve ter (formato completo)
const CAMPOS_OBRIGATORIOS = [
  'id',
  'nome',
  'idade',
  'nacionalidade',
  'aparencia',
  'personalidade',
  'historia',
  'classe',
  'classe_avancada',
  'rank',
  'nivel',
  'atributos',
  'elemento',
  'habilidade_unica',
  'titulo',
  'equipamentos',
  'tecnicas',
  'formaFalar',
  'localizacao',
  'profissao',
  'objetivos',
  'valores'
];

// Campos que existem no formato completo mas podem faltar no resumido
const CAMPOS_EXTENDIDOS = [
  'raca',
  'organizacao',
  'ocupacao',
  'gostos',
  'desgostos',
  'traumas',
  'relacionamentos',
  'lacunas_narrativas',
  'regras_interpretacao'
];

// Campos recomendados (não obrigatórios mas importantes)
const CAMPOS_RECOMENDADOS = [
  'base_em',
  'papel',
  'altura_peso',
  'estilo_luta'
];

// Arquivos que devem existir no dataset de cada NPC (nomes reais)
const ARQUIVOS_DATASET = [
  '01_identity.md',
  '02_summary.md',
  '03_history.md',
  '04_personality.md',
  '05_interpretation.md',
  '06_speech.md',
  '07_values.md',
  '08_likes.md',
  '09_dislikes.md',
  '10_traumas.md',
  '11_relationships.md',
  '12_goals.md',
  '13_knowledge.md',
  '14_curiosities.md',
  '15_narrative_gaps.md',
  '16_absolute_rules.md',
  '17_dialog_examples.md',
  '18_scene_examples.md'
];

// Relatórios da Etapa 8 que existem
const relatoriosExistentes = fs.existsSync(RELATORIOS_DIR)
  ? fs.readdirSync(RELATORIOS_DIR).filter(f => f.endsWith('.md'))
  : [];

// IDs conhecidos com variações de nome
const ALIASES = {
  'haanit': ['H\'aanit', 'Haanit'],
  'ophilia': ['Ophilia Clement', 'Ophilia'],
  'ophilia_clement': ['Ophilia Clement', 'Ophilia'],
  'vide_o_corruptor': ['Vide, o Corruptor', 'Vide'],
  'entidade_mae': ['Entidade \'Mãe\'', 'Entidade Mãe', 'Entidade'],
  'throne_anguis': ['Throné Anguis', 'Throne Anguis'],
  'osvald_v_vanstein': ['Osvald V. Vanstein'],
  'vysache': ['Vysache', 'Visache']
};

console.log('='.repeat(70));
console.log('  AUDITORIA COMPLETA DOS NPCS - O QUE FALTA EM CADA UM');
console.log('='.repeat(70));

// ============================================================
// 1. LER TODOS OS ARQUIVOS JSON
// ============================================================
const arquivosJson = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
console.log(`\n📁 Arquivos JSON encontrados em src/npc/data/: ${arquivosJson.length}`);

const npcs = {};
const errosLeitura = [];
const duplicados = {};

for (const arquivo of arquivosJson) {
  try {
    const dados = JSON.parse(fs.readFileSync(path.join(DATA_DIR, arquivo), 'utf8'));
    
    // Verificar duplicidade de id
    if (npcs[dados.id]) {
      duplicados[dados.id] = (duplicados[dados.id] || [npcs[dados.id].arquivo]);
      duplicados[dados.id].push(arquivo);
    }
    
    npcs[dados.id] = { ...dados, arquivo };
  } catch (err) {
    errosLeitura.push(`❌ ERRO ao ler ${arquivo}: ${err.message}`);
  }
}

console.log(`📊 NPCs únicos carregados: ${Object.keys(npcs).length}`);

// ============================================================
// 2. VERIFICAR CAMPOS EM CADA JSON
// ============================================================
console.log('\n' + '='.repeat(70));
console.log('  VERIFICAÇÃO DE CAMPOS POR NPC');
console.log('='.repeat(70));

const resultadosCampos = [];

for (const [id, npc] of Object.entries(npcs)) {
  const faltandoObrigatorios = [];
  const faltandoExtendidos = [];
  const faltandoRecomendados = [];
  
  // Campos obrigatórios
  for (const campo of CAMPOS_OBRIGATORIOS) {
    if (npc[campo] === undefined || npc[campo] === null || npc[campo] === '') {
      faltandoObrigatorios.push(campo);
    }
  }
  
  // Campos extendidos
  for (const campo of CAMPOS_EXTENDIDOS) {
    if (npc[campo] === undefined || npc[campo] === null || npc[campo] === '') {
      faltandoExtendidos.push(campo);
    }
  }
  
  // Campos recomendados
  for (const campo of CAMPOS_RECOMENDADOS) {
    if (npc[campo] === undefined || npc[campo] === null || npc[campo] === '') {
      faltandoRecomendados.push(campo);
    }
  }
  
  // Verificar atributos
  const atributos = npc.atributos || {};
  const atributosFaltantes = [];
  for (const attr of ['forca', 'resistencia', 'velocidade', 'sentidos', 'inteligencia', 'poder_magico']) {
    if (atributos[attr] === undefined || atributos[attr] === null) {
      atributosFaltantes.push(attr);
    }
  }
  
  // Verificar equipamentos
  const equip = npc.equipamentos || {};
  const equipFaltantes = [];
  for (const campo of ['arma', 'itens']) {
    if (equip[campo] === undefined || equip[campo] === '') {
      equipFaltantes.push(campo);
    }
  }
  
  // Verificar tecnicas
  const tecnicas = npc.tecnicas;
  const tecnicasFaltantes = !Array.isArray(tecnicas) || tecnicas.length === 0;
  
  resultadosCampos.push({
    id,
    nome: npc.nome,
    faltandoObrigatorios,
    faltandoExtendidos,
    faltandoRecomendados,
    atributosFaltantes,
    equipFaltantes,
    tecnicasFaltantes,
    arquivo: npc.arquivo
  });
}

// ============================================================
// 3. VERIFICAR COMANDOS
// ============================================================
console.log('\n' + '='.repeat(70));
console.log('  VERIFICAÇÃO DE COMANDOS (src/commands/)');
console.log('='.repeat(70));

const comandosExistentes = new Set(fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.js')));
const semComando = [];
const comandoVysache = comandosExistentes.has('vysache.js');

for (const [id, npc] of Object.entries(npcs)) {
  const comandoEsperado = `npc_${id}.js`;
  if (!comandosExistentes.has(comandoEsperado)) {
    semComando.push({ id, nome: npc.nome, comando: comandoEsperado });
  }
}

// Verificar comandos que não têm JSON correspondente
const comandosSemJson = [];
for (const comando of comandosExistentes) {
  if (comando.startsWith('npc_') && comando.endsWith('.js')) {
    const id = comando.replace(/^npc_/, '').replace(/\.js$/, '');
    if (!npcs[id] && !id.includes('Missoes')) {
      comandosSemJson.push(comando);
    }
  }
}

// ============================================================
// 4. VERIFICAR DATASET
// ============================================================
console.log('\n' + '='.repeat(70));
console.log('  VERIFICAÇÃO DO DATASET (NPC_LORA/dataset/)');
console.log('='.repeat(70));

let pastasDataset = [];
if (fs.existsSync(DATASET_DIR)) {
  pastasDataset = fs.readdirSync(DATASET_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== '_TEMPLATE')
    .map(d => d.name);
}

const semDataset = [];
const datasetCompleto = [];
const datasetIncompleto = [];

for (const [id, npc] of Object.entries(npcs)) {
  const pastaEsperada = id;
  if (!pastasDataset.includes(pastaEsperada)) {
    semDataset.push({ id, nome: npc.nome, pasta: pastaEsperada });
  } else {
    // Verificar arquivos dentro da pasta
    const caminhoPasta = path.join(DATASET_DIR, pastaEsperada);
    const arquivosExistentes = fs.existsSync(caminhoPasta) ? fs.readdirSync(caminhoPasta) : [];
    const faltantes = ARQUIVOS_DATASET.filter(arq => !arquivosExistentes.includes(arq));
    const vazios = [];
    
    for (const arq of ARQUIVOS_DATASET) {
      const arqPath = path.join(caminhoPasta, arq);
      if (fs.existsSync(arqPath) && fs.statSync(arqPath).size === 0) {
        vazios.push(arq);
      }
    }
    
    if (faltantes.length > 0 || vazios.length > 0) {
      datasetIncompleto.push({ id, nome: npc.nome, faltantes, vazios });
    } else {
      datasetCompleto.push({ id, nome: npc.nome });
    }
  }
}

// Pastas no dataset sem JSON correspondente
const datasetSemJson = pastasDataset.filter(pasta => !npcs[pasta]);

// ============================================================
// 5. VERIFICAR RELATÓRIOS DA ETAPA 8
// ============================================================
console.log('\n' + '='.repeat(70));
console.log('  VERIFICAÇÃO DE RELATÓRIOS (RELATORIOS_ETAPA8/)');
console.log('='.repeat(70));

const semRelatorio = [];
for (const [id, npc] of Object.entries(npcs)) {
  const relatorioEsperado = `relatorio_${id}.md`;
  if (!relatoriosExistentes.includes(relatorioEsperado)) {
    semRelatorio.push({ id, nome: npc.nome, relatorio: relatorioEsperado });
  }
}

// Relatórios sem JSON
const relatoriosSemJson = [];
for (const relatorio of relatoriosExistentes) {
  const id = relatorio.replace(/^relatorio_/, '').replace(/\.md$/, '');
  if (!npcs[id]) {
    relatoriosSemJson.push(relatorio);
  }
}

// ============================================================
// 6. VERIFICAR CONSISTÊNCIA DE NOMES
// ============================================================
console.log('\n' + '='.repeat(70));
console.log('  VERIFICAÇÃO DE CONSISTÊNCIA DE NOMES');
console.log('='.repeat(70));

// Verificar se o campo "nome" no JSON é consistente com o id
const nomesInconsistentes = [];
for (const [id, npc] of Object.entries(npcs)) {
  if (npc.nome) {
    const nomeNormalizado = npc.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const idNormalizado = id.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    
    // Ignorar aliases conhecidos
    const aliases = ALIASES[id] || [];
    const aliasNormalizados = aliases.map(a => a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''));
    
    if (nomeNormalizado !== idNormalizado && !aliasNormalizados.includes(nomeNormalizado)) {
      nomesInconsistentes.push({
        id,
        nome: npc.nome,
        nomeNormalizado,
        idNormalizado
      });
    }
  }
}

// ============================================================
// 7. RELATÓRIO FINAL
// ============================================================
console.log('\n' + '='.repeat(70));
console.log('  📋 RELATÓRIO FINAL - O QUE FALTA EM CADA NPC');
console.log('='.repeat(70));

let totalProblemas = 0;
let totalCompletos = 0;

// Listar todos os NPCs com seus problemas
console.log('\n--- DETALHAMENTO POR NPC ---\n');

for (const resultado of resultadosCampos) {
  const problemas = [];
  
  // Campos obrigatórios faltando
  if (resultado.faltandoObrigatorios.length > 0) {
    problemas.push(`Campos obrigatórios faltando: ${resultado.faltandoObrigatorios.join(', ')}`);
  }
  
  // Campos extendidos faltando
  if (resultado.faltandoExtendidos.length > 0) {
    problemas.push(`Campos extendidos faltando (${resultado.faltandoExtendidos.length}): ${resultado.faltandoExtendidos.join(', ')}`);
  }
  
  // Campos recomendados faltando
  if (resultado.faltandoRecomendados.length > 0) {
    problemas.push(`Campos recomendados faltando: ${resultado.faltandoRecomendados.join(', ')}`);
  }
  
  // Atributos faltando
  if (resultado.atributosFaltantes.length > 0) {
    problemas.push(`Atributos faltando: ${resultado.atributosFaltantes.join(', ')}`);
  }
  
  // Equipamentos faltando
  if (resultado.equipFaltantes.length > 0) {
    problemas.push(`Equipamentos faltando: ${resultado.equipFaltantes.join(', ')}`);
  }
  
  // Técnicas faltando
  if (resultado.tecnicasFaltantes) {
    problemas.push('Técnicas vazias ou ausentes');
  }
  
  // Comando faltando
  const semCmd = semComando.find(s => s.id === resultado.id);
  if (semCmd) {
    problemas.push(`Comando não existe: ${semCmd.comando}`);
  }
  
  // Dataset faltando
  const semDs = semDataset.find(s => s.id === resultado.id);
  if (semDs) {
    problemas.push(`Pasta de dataset não existe: ${semDs.pasta}`);
  } else {
    const dsIncompleto = datasetIncompleto.find(d => d.id === resultado.id);
    if (dsIncompleto) {
      if (dsIncompleto.faltantes.length > 0) {
        problemas.push(`Dataset - arquivos faltando (${dsIncompleto.faltantes.length}): ${dsIncompleto.faltantes.join(', ')}`);
      }
      if (dsIncompleto.vazios.length > 0) {
        problemas.push(`Dataset - arquivos vazios (${dsIncompleto.vazios.length}): ${dsIncompleto.vazios.join(', ')}`);
      }
    }
  }
  
  // Relatório faltando
  const semRel = semRelatorio.find(s => s.id === resultado.id);
  if (semRel) {
    problemas.push(`Relatório Etapa 8 não existe: ${semRel.relatorio}`);
  }
  
  // Nome inconsistente
  const nomeInc = nomesInconsistentes.find(n => n.id === resultado.id);
  if (nomeInc) {
    problemas.push(`Nome "${resultado.nome}" não corresponde ao id "${resultado.id}"`);
  }
  
  if (problemas.length > 0) {
    totalProblemas++;
    console.log(`❌ ${resultado.nome} (${resultado.id}):`);
    problemas.forEach(p => console.log(`   - ${p}`));
    console.log('');
  } else {
    totalCompletos++;
    console.log(`✅ ${resultado.nome} (${resultado.id}) - COMPLETO`);
  }
}

// NPCs no dataset sem JSON
if (datasetSemJson.length > 0) {
  console.log('\n--- PASTAS NO DATASET SEM JSON CORRESPONDENTE ---');
  datasetSemJson.forEach(pasta => console.log(`  ⚠️ ${pasta}`));
}

// Comandos sem JSON
if (comandosSemJson.length > 0) {
  console.log('\n--- COMANDOS SEM JSON CORRESPONDENTE ---');
  comandosSemJson.forEach(cmd => console.log(`  ⚠️ ${cmd}`));
}

// Relatórios sem JSON
if (relatoriosSemJson.length > 0) {
  console.log('\n--- RELATÓRIOS SEM JSON CORRESPONDENTE ---');
  relatoriosSemJson.forEach(rel => console.log(`  ⚠️ ${rel}`));
}

// Duplicados
if (Object.keys(duplicados).length > 0) {
  console.log('\n--- IDS DUPLICADOS ---');
  for (const [id, arquivos] of Object.entries(duplicados)) {
    console.log(`  ⚠️ ${id} aparece em: ${arquivos.join(', ')}`);
  }
}

// Erros de leitura
if (errosLeitura.length > 0) {
  console.log('\n--- ERROS DE LEITURA ---');
  errosLeitura.forEach(p => console.log(`  ❌ ${p}`));
}

// ============================================================
// RESUMO
// ============================================================
console.log('\n' + '='.repeat(70));
console.log('  📊 RESUMO GERAL');
console.log('='.repeat(70));
console.log(`
  Total de JSONs:              ${arquivosJson.length}
  NPCs únicos:                 ${Object.keys(npcs).length}
  NPCs com problemas:          ${totalProblemas}
  NPCs completos:              ${totalCompletos}
  
  Sem comando (src/commands/): ${semComando.length}
  Sem dataset (NPC_LORA/):     ${semDataset.length}
  Dataset incompleto:          ${datasetIncompleto.length}
  Dataset completo:            ${datasetCompleto.length}
  Sem relatório (Etapa 8):     ${semRelatorio.length}
  Nomes inconsistentes:        ${nomesInconsistentes.length}
  IDs duplicados:              ${Object.keys(duplicados).length}
`);

// Vysache especial
console.log('─'.repeat(70));
console.log(`ℹ️  NOTA: Vysache usa src/database/npc_vysache.json e src/commands/vysache.js`);
if (!comandoVysache) {
  console.log(`  ❌ Comando vysache.js NÃO existe em src/commands/`);
} else {
  console.log(`  ✅ Comando vysache.js existe em src/commands/`);
}

// Verificar se npc_vysache.json existe em src/database/
const vysacheDb = path.join(RAIZ, 'src', 'database', 'npc_vysache.json');
console.log(`  ${fs.existsSync(vysacheDb) ? '✅' : '❌'} src/database/npc_vysache.json ${fs.existsSync(vysacheDb) ? 'existe' : 'NÃO existe'}`);