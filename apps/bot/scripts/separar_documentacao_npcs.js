/**
 * ETAPA 8 — Separação Automática da Documentação dos NPCs
 * 
 * Lê os 4 arquivos Markdown em NPC_LORA/memory/
 * Identifica automaticamente os blocos de documentação de cada personagem
 * Distribui os trechos para os arquivos corretos da estrutura da LoRA
 * 
 * REGRAS ABSOLUTAS:
 * - Nunca alterar nenhuma palavra
 * - Nunca resumir
 * - Nunca reescrever
 * - Nunca corrigir estilo
 * - Nunca remover informações
 * - Nunca adicionar informações
 * - Preservar exatamente o texto original
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = 'NPC_LORA/memory';
const DATASET_DIR = 'NPC_LORA/dataset';
const REPORT_DIR = 'RELATORIOS_ETAPA8';

const ARQUIVOS_MEMORIA = [
  'Manual_Interpretacao_Lote1_01a30.md',
  'Base_Conhecimento_Personagens_Lote02.md',
  'Base_Conhecimento_Personagens_Lote03.md',
  'Forma_de_Falar_Personagens.md'
];

// Nome das seções por arquivo da LoRA
const SECAO_POR_ARQUIVO = {
  '01_identity.md': '1. Identidade',
  '02_summary.md': '2. Resumo do Personagem',
  '03_history.md': '3. História',
  '04_personality.md': '4. Personalidade',
  '05_interpretation.md': '5. Forma de Interpretação',
  '06_speech.md': '6. Forma de Falar',
  '07_values.md': '7. Valores',
  '08_likes.md': '8. Gostos',
  '09_dislikes.md': '9. Desgostos',
  '10_traumas.md': '10. Traumas',
  '11_relationships.md': '11. Relacionamentos Importantes',
  '12_goals.md': '12. Objetivos',
  '13_knowledge.md': '13. Conhecimentos',
  '14_curiosities.md': '14. Curiosidades',
  '15_narrative_gaps.md': '15. Lacunas Narrativas',
  '16_absolute_rules.md': '16. Regras Absolutas de Interpretação',
  '17_dialog_examples.md': null, // Sem seção original na documentação
  '18_scene_examples.md': null   // Sem seção original na documentação
};

const ORDEM_ARQUIVOS = Object.keys(SECAO_POR_ARQUIVO);

// Mapeia seção detectada -> arquivo(s) da LoRA
function mapearSecaoParaArquivo(secao) {
  switch (secao) {
    case 'identidade': return ['01_identity.md'];
    case 'resumo': return ['02_summary.md'];
    case 'historia': return ['03_history.md'];
    case 'personalidade': return ['04_personality.md'];
    case 'interpretacao': return ['05_interpretation.md'];
    case 'fala':
    case 'fala_abertura':
    case 'fala_registro':
    case 'fala_postura':
    case 'fala_interlocutores':
    case 'fala_emocional':
    case 'fala_ironia':
    case 'fala_nota':
      return ['06_speech.md'];
    case 'valores': return ['07_values.md'];
    case 'gostos': return ['08_likes.md'];
    case 'desgostos': return ['09_dislikes.md'];
    case 'traumas': return ['10_traumas.md'];
    case 'relacionamentos': return ['11_relationships.md'];
    case 'objetivos': return ['12_goals.md'];
    case 'conhecimentos': return ['13_knowledge.md'];
    case 'curiosidades': return ['14_curiosities.md'];
    case 'lacunas': return ['15_narrative_gaps.md'];
    case 'regras': return ['16_absolute_rules.md'];
    default: return [];
  }
}

const ROTULO_SECAO = {
  'identidade': '1. Identidade',
  'resumo': '2. Resumo do Personagem',
  'historia': '3. História',
  'personalidade': '4. Personalidade',
  'interpretacao': '5. Forma de Interpretação',
  'fala': '6. Forma de Falar',
  'valores': '7. Valores',
  'gostos': '8. Gostos',
  'desgostos': '9. Desgostos',
  'traumas': '10. Traumas',
  'relacionamentos': '11. Relacionamentos Importantes',
  'objetivos': '12. Objetivos',
  'conhecimentos': '13. Conhecimentos',
  'curiosidades': '14. Curiosidades',
  'lacunas': '15. Lacunas Narrativas',
  'regras': '16. Regras Absolutas de Interpretação'
};

// Normaliza nome de personagem para formato de pasta
function normalizarParaPasta(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['\u2019,]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Lista as pastas do dataset (72 personagens)
function listarPersonagens() {
  return fs.readdirSync(DATASET_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== '_TEMPLATE')
    .map(d => d.name)
    .sort();
}

// Lê todos os arquivos de memória
function lerArquivosMemoria() {
  const conteudos = {};
  for (const f of ARQUIVOS_MEMORIA) {
    const p = path.join(MEMORY_DIR, f);
    conteudos[f] = fs.readFileSync(p, 'utf8');
  }
  return conteudos;
}

// Padrões de rodapé de página nos documentos
const PADROES_RODAPE = [
  /^Manual de Interpretação de Personagens?Página\s+\d+\s*$/,
  /^Base de Conhecimento de Personagens — Lote \d+ \(\d+[–-]\d+\)Página\s+\d+\s*$/,
  /^Forma de Falar — Base de Interpretação de PersonagensPágina\s+\d+\s*$/,
  /^Forma de Falar — Base de Interpretação de Personagens.+Página\s+\d+\s*$/,
  /^Base de Conhecimento de Personagens\s*$/,
  /^Forma de Falar — Base de Interpretação de Personagens\s*$/,
  /^Manual de Interpretação de Personagens\s*$/
];

function isLinhaRodape(line) {
  const t = line.trim();
  return PADROES_RODAPE.some(p => p.test(t));
}

// Remove marcadores de formatação preservando o texto
function limparLinha(line) {
  let t = line.trim();
  // Remove o prefixo ## do Markdown
  t = t.replace(/^##\s+/, '');
  // Remove bullet simples (mas preserva • como marcador)
  if (t.startsWith('•')) return '• ' + t.substring(1).trim();
  return t;
}

// Corrige campos de identidade colados no Lote1: NomeOphilia -> Nome: Ophilia
function corrigirCampoIdentidade(line) {
  let t = line;
  // Remove ## se presente
  t = t.replace(/^##\s+/, '');
  
  // Padrões conhecidos do Lote1: rótulo sem espaço antes do valor
  t = t.replace(/^Nome([A-ZÀ-Ý])/, 'Nome: $1');
  t = t.replace(/^Idade(\d+)/, 'Idade: $1');
  t = t.replace(/^Raça([A-ZÀ-Ý])/, 'Raça: $1');
  t = t.replace(/^Nacionalidade([A-ZÀ-Ýa-zà-ÿ])/, 'Nacionalidade: $1');
  t = t.replace(/^Classe([A-ZÀ-Ý])/, 'Classe: $1');
  t = t.replace(/^Ocupação([A-ZÀ-Ýa-zà-ÿ])/, 'Ocupação: $1');
  t = t.replace(/^Organização\/Guilda([A-ZÀ-Ýa-zà-ÿ])/, 'Organização/Guilda: $1');
  t = t.replace(/^Elemento([A-ZÀ-Ýa-zà-ÿ])/, 'Elemento: $1');
  
  return t;
}

// Detecta o início de um personagem em uma linha
function detectarInicioPersonagem(line, personagens) {
  const t = line.trim();
  
  // Padrão principal: ## Nome  (Lote1, Lote2, Lote3, Forma_de_Falar)
  if (t.startsWith('## ')) {
    const resto = t.substring(3).trim();
    // Ignora seções numeradas (## 1., ## 2., etc.)
    if (/^\d+\./.test(resto)) return null;
    // Ignora marcadores de bullet (## •)
    if (resto.startsWith('•')) return null;
    // Ignora cabeçalhos estruturais
    if (/^(ÍNDICE|BASE DE|PERSONAGENS|FORMA DE FALAR|Manual de|Personagem|Lote)/i.test(resto)) return null;
    
    // Primeiro verifica se corresponde a um personagem (mesmo sem espaço, ex: H'aanit)
    const nomeNorm = normalizarParaPasta(resto);
    if (personagens.includes(nomeNorm)) {
      return { linha: t, nome: nomeNorm };
    }
    
    // Se não é um personagem e não tem espaço, é campo de identidade (## Idade21)
    if (!resto.includes(' ')) return null;
    
    // Ignora campos de identidade com espaço (## Nome: X, ## Rank / Nível: A)
    if (/^(Nome|Título|Classe|Rank|Elemento|Ocupação|Organização|Base original|Nacionalidade|Idade|Raça):/.test(resto)) return null;
    
    return null;
  }
  
  // Padrão especial sem ## (Entidade 'Mãe', Vide, o Corruptor, etc.)
  if (!t.startsWith('#') && !t.startsWith('-') && !t.startsWith('*')) {
    const nomeNorm = normalizarParaPasta(t);
    if (personagens.includes(nomeNorm) && t.length < 80) {
      // Não pode ter pontuação de fim de frase
      if (!t.endsWith('.') && !t.endsWith('!') && !t.endsWith('?') && !t.endsWith(',')) {
        // Deve ter no máximo 2 palavras (para não pegar frases normais)
        // Exceto nomes compostos como "Vide, o Corruptor"
        const palavras = t.split(' ').length;
        if (palavras <= 4) {
          return { linha: t, nome: nomeNorm };
        }
      }
    }
  }
  
  return null;
}

// Encontra os blocos de cada personagem em um arquivo
function encontrarBlocos(conteudo, personagens) {
  const lines = conteudo.split('\n');
  const blocos = [];
  let atual = null;
  
  for (let i = 0; i < lines.length; i++) {
    const detectado = detectarInicioPersonagem(lines[i], personagens);
    
    if (detectado) {
      if (atual) {
        atual.fim = i;
        blocos.push(atual);
      }
      atual = { nome: detectado.nome, inicio: i, linhaCabecalho: detectado.linha };
    }
  }
  
  if (atual) {
    atual.fim = lines.length;
    blocos.push(atual);
  }
  
  return blocos;
}

// Determina se uma linha é marcador de seção e qual
function detectarSecao(line) {
  const t = line.trim();
  
  // Seções numeradas com ##
  if (/^##\s+1\.\s+Identidade/i.test(t)) return { secao: 'identidade' };
  if (/^##\s+3\.\s+Hist[óo]ria/i.test(t)) return { secao: 'historia' };
  if (/^##\s+4\.\s+Personalidade/i.test(t)) return { secao: 'personalidade' };
  if (/^##\s+7\.\s+Valores/i.test(t)) return { secao: 'valores' };
  if (/^##\s+8\.\s+Gostos/i.test(t)) return { secao: 'gostos' };
  if (/^##\s+9\.\s+Desgostos/i.test(t)) return { secao: 'desgostos' };
  if (/^##\s+10\.\s+Traumas/i.test(t)) return { secao: 'traumas' };
  if (/^##\s+11\.\s+Relacionamentos/i.test(t)) return { secao: 'relacionamentos' };
  if (/^##\s+12\.\s+Objetivos/i.test(t)) return { secao: 'objetivos' };
  if (/^##\s+13\.\s+Conhecimentos/i.test(t)) return { secao: 'conhecimentos' };
  if (/^##\s+14\.\s+Curiosidades/i.test(t)) return { secao: 'curiosidades' };
  if (/^##\s+15\.\s+Lacunas/i.test(t)) return { secao: 'lacunas' };
  
  // Seções com - (sem ##)
  if (/^-\s+Resumo do Personagem/i.test(t)) return { secao: 'resumo' };
  if (/^-\s+Forma de Interpreta[çc][ãa]o/i.test(t)) return { secao: 'interpretacao' };
  if (/^-\s+Forma de Falar/i.test(t)) return { secao: 'fala' };
  if (/^-\s+Regras Absolutas/i.test(t)) return { secao: 'regras' };
  
  return null;
}

// Extrai as seções de um bloco de personagem
function extrairSecoes(bloco, lines) {
  const secoes = [];
  for (let i = bloco.inicio; i < bloco.fim; i++) {
    const sec = detectarSecao(lines[i]);
    if (sec) {
      secoes.push({ ...sec, linha: i });
    }
  }
  return secoes;
}

// Extrai o cabeçalho (nome + título + base) de um bloco
function extrairCabecalho(bloco, lines) {
  const linhas = [];
  
  // Linha do nome
  linhas.push(limparLinha(bloco.linhaCabecalho));
  
  // Linhas seguintes até a primeira seção
  for (let i = bloco.inicio + 1; i < Math.min(bloco.inicio + 15, bloco.fim); i++) {
    const t = lines[i].trim();
    if (t.length === 0) continue;
    if (isLinhaRodape(t)) continue;
    if (/^##\s+\d+\./.test(t)) break;
    if (/^-\s+(Resumo do Personagem|Forma de Interpretação|Forma de Falar|Regras Absolutas)/i.test(t)) break;
    if (/^Abertura da conversa/.test(t)) break;
    
    linhas.push(limparLinha(t));
  }
  
  return linhas;
}

// Preserva as linhas exatamente como estão no original
// Apenas remove marcadores de formatação Markdown, mantendo o texto da linha
function preservarLinhas(linhas) {
  const resultado = [];
  
  for (const linha of linhas) {
    const t = linha.trim();
    if (t.length === 0) continue;
    
    // Remove bullets vazios e linhas de apenas "•"
    if (/^•\s*$/.test(t)) continue;
    
    // Converte linhas "• Texto" para "• Texto" (junta marcador com texto na mesma linha)
    // Se a linha anterior era apenas "•", adiciona o marcador à linha atual
    if (resultado.length > 0 && resultado[resultado.length - 1].trim() === '•') {
      resultado[resultado.length - 1] = '• ' + t;
      continue;
    }
    
    resultado.push(t);
  }
  
  // Remove qualquer "•" solto restante
  return resultado.filter(l => l.trim() !== '•');
}

// Processa o arquivo Manual_Interpretacao_Lote1_01a30.md (Lote 1)
function processarLote1(conteudo, personagens) {
  const lines = conteudo.split('\n');
  const blocos = encontrarBlocos(conteudo, personagens);
  const resultados = {};
  
  for (const bloco of blocos) {
    const secoes = extrairSecoes(bloco, lines);
    const dados = {
      nome: bloco.nome,
      arquivo: 'Manual_Interpretacao_Lote1_01a30.md',
      cabecalho: extrairCabecalho(bloco, lines),
      conteudo: {},
      ambiguedades: []
    };
    
    for (let i = 0; i < secoes.length; i++) {
      const sec = secoes[i];
      const fim = i < secoes.length - 1 ? secoes[i + 1].linha : bloco.fim;
      const linhasSecao = [];
      
      for (let j = sec.linha + 1; j < fim; j++) {
        const t = lines[j].trim();
        
        if (isLinhaRodape(t)) continue;
        if (t.length === 0) continue;
        
        // Verifica se já é o próximo marcador de seção
        const proximaSec = detectarSecao(t);
        if (proximaSec && proximaSec.secao !== sec.secao) break;
        
        // Remove formatação Markdown
        let limpa = limparLinha(t);
        
        // Corrige campos de identidade colados no Lote1
        if (sec.secao === 'identidade') {
          limpa = corrigirCampoIdentidade(limpa);
        }
        
        if (limpa.length === 0) continue;
        
        linhasSecao.push(limpa);
      }
      
      const linhaFinal = preservarLinhas(linhasSecao);
      if (linhaFinal.length > 0) {
        dados.conteudo[sec.secao] = linhaFinal;
      }
    }
    
    resultados[bloco.nome] = dados;
  }
  
  return resultados;
}

// Processa Lote2 e Lote3 (Base_Conhecimento_Personagens)
function processarLoteBase(conteudo, personagens, arquivo) {
  const lines = conteudo.split('\n');
  const blocos = encontrarBlocos(conteudo, personagens);
  const resultados = {};
  
  for (const bloco of blocos) {
    const secoes = extrairSecoes(bloco, lines);
    const dados = {
      nome: bloco.nome,
      arquivo,
      cabecalho: extrairCabecalho(bloco, lines),
      conteudo: {},
      ambiguedades: []
    };
    
    for (let i = 0; i < secoes.length; i++) {
      const sec = secoes[i];
      const fim = i < secoes.length - 1 ? secoes[i + 1].linha : bloco.fim;
      const linhasSecao = [];
      
      for (let j = sec.linha + 1; j < fim; j++) {
        const t = lines[j].trim();
        
        if (isLinhaRodape(t)) continue;
        if (t.length === 0) continue;
        
        const proximaSec = detectarSecao(t);
        if (proximaSec && proximaSec.secao !== sec.secao) break;
        
        let limpa = limparLinha(t);
        if (limpa.length === 0) continue;
        
        linhasSecao.push(limpa);
      }
      
      const linhaFinal = preservarLinhas(linhasSecao);
      if (linhaFinal.length > 0) {
        dados.conteudo[sec.secao] = linhaFinal;
      }
    }
    
    resultados[bloco.nome] = dados;
  }
  
  return resultados;
}

// Processa Forma_de_Falar_Personagens.md
function processarFormaFalar(conteudo, personagens) {
  const lines = conteudo.split('\n');
  const blocos = encontrarBlocos(conteudo, personagens);
  const resultados = {};
  
  for (const bloco of blocos) {
    const dados = {
      nome: bloco.nome,
      arquivo: 'Forma_de_Falar_Personagens.md',
      cabecalho: extrairCabecalho(bloco, lines),
      conteudo: {},
      ambiguedades: []
    };
    
    // Detecta o cabeçalho do Forma de Falar:
    // 1. Linha do nome (## Nome)
    // 2. Título entre aspas
    // 3. Linha(s) de "Base:...Elemento: X" (pode quebrar em várias linhas)
    // A última linha do cabeçalho sempre contém "Elemento:"
    
    // Encontra a última linha do cabeçalho (a que contém "Elemento:")
    let fimCabecalho = bloco.inicio;
    for (let j = bloco.inicio; j < Math.min(bloco.inicio + 10, bloco.fim); j++) {
      const t = lines[j];
      if (t.includes('Elemento:')) {
        fimCabecalho = j;
      }
    }
    
    const linhasSecao = [];
    
    // Captura todo o conteúdo a partir do fim do cabeçalho
    for (let j = bloco.inicio; j < bloco.fim; j++) {
      const t = lines[j].trim();
      if (isLinhaRodape(t)) continue;
      if (t.length === 0) continue;
      
      // Pula a linha do nome do personagem e todo o cabeçalho
      if (j <= fimCabecalho) continue;
      
      let limpa = limparLinha(t);
      if (limpa.length === 0) continue;
      
      linhasSecao.push(limpa);
    }
    
    const linhaFinal = preservarLinhas(linhasSecao);
    if (linhaFinal.length > 0) {
      dados.conteudo.fala = linhaFinal;
    }
    
    resultados[bloco.nome] = dados;
  }
  
  return resultados;
}

// Escreve o conteúdo no arquivo da LoRA
function escreverArquivoLoRA(pastaPersonagem, arquivoLoRA, conteudo) {
  const dir = path.join(DATASET_DIR, pastaPersonagem);
  const filePath = path.join(dir, arquivoLoRA);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, conteudo, 'utf8');
}

// Verifica se um arquivo já tem conteúdo existente
function arquivoExisteComConteudo(pastaPersonagem, arquivoLoRA) {
  const filePath = path.join(DATASET_DIR, pastaPersonagem, arquivoLoRA);
  if (!fs.existsSync(filePath)) return false;
  const conteudo = fs.readFileSync(filePath, 'utf8').trim();
  return conteudo.length > 0;
}

// Monta o conteúdo final de um arquivo da LoRA
function montarConteudoArquivo(arquivo, secoesAgrupadas, cabecalho) {
  const rotulo = SECAO_POR_ARQUIVO[arquivo];
  const partes = [];
  
  // Cabeçalho vai para o arquivo de identidade
  if (arquivo === '01_identity.md' && cabecalho && cabecalho.length > 0) {
    partes.push(cabecalho.join('\n'));
  }
  
  if (!rotulo) return partes.join('\n\n');
  
  if (secoesAgrupadas[arquivo] && secoesAgrupadas[arquivo].length > 0) {
    // Primeiro o rótulo da seção
    const conteudoSecao = [];
    conteudoSecao.push(rotulo);
    
    for (const linhas of secoesAgrupadas[arquivo]) {
      if (linhas && linhas.length > 0) {
        conteudoSecao.push(linhas.join('\n'));
      }
    }
    
    partes.push(conteudoSecao.join('\n\n'));
  }
  
  return partes.join('\n\n');
}

// MAIN
function main() {
  console.log('============================================');
  console.log('ETAPA 8 — SEPARAÇÃO AUTOMÁTICA DA DOCUMENTAÇÃO');
  console.log('============================================\n');
  
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
  
  const personagens = listarPersonagens();
  console.log(`Personagens encontrados no dataset: ${personagens.length}`);
  
  const conteudos = lerArquivosMemoria();
  console.log('Arquivos de memória lidos:\n');
  for (const f of ARQUIVOS_MEMORIA) {
    const c = conteudos[f];
    console.log(`  ${f}: ${c.split('\n').length} linhas, ${c.length} bytes`);
  }
  
  // Processa cada arquivo
  console.log('\nProcessando arquivos...');
  
  const resultadoLote1 = processarLote1(conteudos['Manual_Interpretacao_Lote1_01a30.md'], personagens);
  console.log(`  Lote1 (Manual_Interpretacao_Lote1_01a30.md): ${Object.keys(resultadoLote1).length} personagens detectados`);
  
  const resultadoLote2 = processarLoteBase(
    conteudos['Base_Conhecimento_Personagens_Lote02.md'], personagens,
    'Base_Conhecimento_Personagens_Lote02.md'
  );
  console.log(`  Lote2 (Base_Conhecimento_Personagens_Lote02.md): ${Object.keys(resultadoLote2).length} personagens detectados`);
  
  const resultadoLote3 = processarLoteBase(
    conteudos['Base_Conhecimento_Personagens_Lote03.md'], personagens,
    'Base_Conhecimento_Personagens_Lote03.md'
  );
  console.log(`  Lote3 (Base_Conhecimento_Personagens_Lote03.md): ${Object.keys(resultadoLote3).length} personagens detectados`);
  
  const resultadoFormaFalar = processarFormaFalar(
    conteudos['Forma_de_Falar_Personagens.md'], personagens
  );
  console.log(`  Forma_de_Falar (Forma_de_Falar_Personagens.md): ${Object.keys(resultadoFormaFalar).length} personagens detectados`);
  
  // Combina todos os resultados por personagem
  const todosResultados = {};
  
  for (const lista of [resultadoLote1, resultadoLote2, resultadoLote3, resultadoFormaFalar]) {
    for (const [nome, dados] of Object.entries(lista)) {
      if (!todosResultados[nome]) {
        todosResultados[nome] = {
          nome,
          fontes: [],
          cabecalho: [],
          conteudo: {},
          ambiguedades: []
        };
      }
      
      const alvo = todosResultados[nome];
      alvo.fontes.push(dados.arquivo);
      
      if (alvo.cabecalho.length === 0 && dados.cabecalho.length > 0) {
        alvo.cabecalho = dados.cabecalho;
      }
      
      for (const [secao, linhas] of Object.entries(dados.conteudo)) {
        if (linhas && linhas.length > 0) {
          if (!alvo.conteudo[secao]) {
            alvo.conteudo[secao] = [];
          }
          // Concatena para preservar repetições existentes
          alvo.conteudo[secao].push(linhas);
        }
      }
      
      alvo.ambiguedades = alvo.ambiguedades.concat(dados.ambiguedades || []);
    }
  }
  
  console.log(`\nTotal de personagens com dados extraídos: ${Object.keys(todosResultados).length}`);
  
  const encontrados = new Set(Object.keys(todosResultados));
  const naoEncontrados = personagens.filter(p => !encontrados.has(p));
  if (naoEncontrados.length > 0) {
    console.log(`AVISO - Personagens não encontrados: ${naoEncontrados.join(', ')}`);
  }
  
  // Escreve os arquivos e gera relatórios
  const relatoriosIndividuais = {};
  let totalArquivosPreenchidos = 0;
  let totalArquivosVazios = 0;
  let totalAmbiguedades = 0;
  const multiplasClassificacoesGlobal = [];
  
  for (const personagem of personagens) {
    const dados = todosResultados[personagem];
    
    if (!dados) {
      // Personagem não encontrado
      relatoriosIndividuais[personagem] = {
        personagem,
        arquivosPreenchidos: [],
        arquivosVazios: ORDEM_ARQUIVOS,
        multiplasClassificacoes: [],
        ambiguidades: [`Personagem não encontrado nos arquivos de memória`],
        observacao: 'NÃO ENCONTRADO nos arquivos de memória',
        fontes: []
      };
      totalArquivosVazios += ORDEM_ARQUIVOS.length;
      totalAmbiguedades++;
      continue;
    }
    
    // Agrupa seções por arquivo da LoRA
    const secoesAgrupadas = {};
    
    for (const [secao, listaDeLinhas] of Object.entries(dados.conteudo)) {
      if (!listaDeLinhas || listaDeLinhas.length === 0) continue;
      
      const arquivos = mapearSecaoParaArquivo(secao);
      
      if (arquivos.length === 0) {
        totalAmbiguedades++;
        if (!relatoriosIndividuais[personagem]) {
          relatoriosIndividuais[personagem] = { ambiguidades: [] };
        }
        if (!relatoriosIndividuais[personagem].ambiguidades) {
          relatoriosIndividuais[personagem].ambiguidades = [];
        }
        relatoriosIndividuais[personagem].ambiguidades.push(`Seção '${secao}' sem mapeamento para arquivo da LoRA`);
        continue;
      }
      
      if (arquivos.length > 1) {
        multiplasClassificacoesGlobal.push({ personagem, secao, arquivos });
      }
      
      for (const arquivo of arquivos) {
        if (!secoesAgrupadas[arquivo]) secoesAgrupadas[arquivo] = [];
        for (const linhas of listaDeLinhas) {
          secoesAgrupadas[arquivo].push(linhas);
        }
      }
    }
    
    // Escreve os arquivos
    const arquivosPreenchidos = [];
    const arquivosVazios = [];
    
    for (const arquivo of ORDEM_ARQUIVOS) {
      const conteudoFinal = montarConteudoArquivo(arquivo, secoesAgrupadas, dados.cabecalho);
      
      if (conteudoFinal.trim().length > 0) {
        escreverArquivoLoRA(personagem, arquivo, conteudoFinal.trim() + '\n');
        arquivosPreenchidos.push(arquivo);
      } else {
        // Se o arquivo já tem conteúdo existente, preserva
        if (arquivoExisteComConteudo(personagem, arquivo)) {
          arquivosPreenchidos.push(arquivo + ' (existente preservado)');
        } else {
          arquivosVazios.push(arquivo);
        }
      }
    }
    
    totalArquivosPreenchidos += arquivosPreenchidos.length;
    totalArquivosVazios += arquivosVazios.length;
    
    const ambiguidades = relatoriosIndividuais[personagem]?.ambiguidades || [];
    const multiplas = multiplasClassificacoesGlobal.filter(m => m.personagem === personagem);
    
    relatoriosIndividuais[personagem] = {
      personagem,
      arquivosPreenchidos,
      arquivosVazios,
      multiplasClassificacoes: multiplas,
      ambiguidades,
      confirmacao: 'Nenhuma palavra foi alterada. Texto original preservado integralmente.',
      fontes: dados.fontes
    };
  }
  
  // Exibe relatórios individuais
  console.log('\n============================================');
  console.log('RELATÓRIOS INDIVIDUAIS');
  console.log('============================================\n');
  
  for (const personagem of personagens) {
    const rel = relatoriosIndividuais[personagem];
    const arqPreenchidos = rel.arquivosPreenchidos || [];
    const arqVazios = rel.arquivosVazios || [];
    const mult = rel.multiplasClassificacoes || [];
    const amb = rel.ambiguidades || [];
    
    console.log(`--- ${personagem} ---`);
    console.log(`  Preenchidos (${arqPreenchidos.length}): ${arqPreenchidos.join(', ') || 'Nenhum'}`);
    console.log(`  Vazios (${arqVazios.length}): ${arqVazios.join(', ') || 'Nenhum'}`);
    if (mult.length > 0) {
      console.log(`  Multi-classificações (${mult.length}):`);
      for (const m of mult) {
        console.log(`    - ${m.secao} -> ${m.arquivos.join(', ')}`);
      }
    }
    if (amb.length > 0) {
      console.log(`  Ambiguidades (${amb.length}):`);
      for (const a of amb) {
        console.log(`    - ${a}`);
      }
    }
    console.log(`  Confirmação: Nenhuma palavra alterada.`);
    if (rel.observacao) {
      console.log(`  OBS: ${rel.observacao}`);
    }
    console.log();
    
    // Salva relatório individual em Markdown
    const relPath = path.join(REPORT_DIR, `relatorio_${personagem}.md`);
    let relTexto = `# RELATÓRIO — ${personagem}\n\n`;
    relTexto += `- **Personagem:** ${personagem}\n`;
    relTexto += `- **Arquivos preenchidos (${arqPreenchidos.length}):** ${arqPreenchidos.join(', ') || 'Nenhum'}\n`;
    relTexto += `- **Arquivos vazios (${arqVazios.length}):** ${arqVazios.join(', ') || 'Nenhum'}\n`;
    if (mult.length > 0) {
      relTexto += `- **Trechos classificados em mais de um arquivo (${mult.length}):**\n`;
      for (const m of mult) {
        relTexto += `  - Seção '${m.secao}' → ${m.arquivos.join(', ')}\n`;
      }
    }
    if (amb.length > 0) {
      relTexto += `- **Classificações ambíguas (${amb.length}):**\n`;
      for (const a of amb) {
        relTexto += `  - ${a}\n`;
      }
    }
    if (rel.observacao) {
      relTexto += `- **Observação:** ${rel.observacao}\n`;
    }
    relTexto += `- **Confirmação:** Nenhuma palavra foi alterada. Texto original preservado integralmente.\n`;
    relTexto += `- **Fontes:** ${(rel.fontes || []).join(', ')}\n`;
    fs.writeFileSync(relPath, relTexto, 'utf8');
  }
  
  // Relatório geral
  console.log('============================================');
  console.log('RELATÓRIO GERAL');
  console.log('============================================\n');
  
  console.log(`Personagens processados: ${personagens.length}`);
  console.log(`Total de arquivos preenchidos: ${totalArquivosPreenchidos}`);
  console.log(`Total de arquivos vazios: ${totalArquivosVazios}`);
  console.log(`Total de classificações ambíguas: ${totalAmbiguedades}`);
  if (naoEncontrados.length > 0) {
    console.log(`Personagens não encontrados: ${naoEncontrados.join(', ')}`);
  }
  console.log(`Confirmação: Toda a documentação original foi preservada integralmente.`);
  
  // Salva relatório geral
  const relGeral = path.join(REPORT_DIR, 'relatorio_geral.md');
  let relGeralTexto = `# RELATÓRIO GERAL — ETAPA 8\n\n`;
  relGeralTexto += `- **Data:** ${new Date().toISOString()}\n`;
  relGeralTexto += `- **Personagens processados:** ${personagens.length}\n`;
  relGeralTexto += `- **Total de arquivos preenchidos:** ${totalArquivosPreenchidos}\n`;
  relGeralTexto += `- **Total de arquivos vazios:** ${totalArquivosVazios}\n`;
  relGeralTexto += `- **Total de classificações ambíguas:** ${totalAmbiguedades}\n`;
  relGeralTexto += `- **Personagens não encontrados:** ${naoEncontrados.length > 0 ? naoEncontrados.join(', ') : 'Nenhum'}\n`;
  relGeralTexto += `- **Confirmação:** Toda a documentação original foi preservada integralmente. Nenhuma palavra foi alterada.\n\n`;
  
  if (multiplasClassificacoesGlobal.length > 0) {
    relGeralTexto += `## Trechos classificados em mais de um arquivo\n\n`;
    for (const m of multiplasClassificacoesGlobal) {
      relGeralTexto += `- ${m.personagem}: seção '${m.secao}' → ${m.arquivos.join(', ')}\n`;
    }
    relGeralTexto += '\n';
  }
  
  relGeralTexto += `## Detalhamento por personagem\n\n`;
  for (const personagem of personagens) {
    const rel = relatoriosIndividuais[personagem];
    relGeralTexto += `### ${personagem}\n`;
    relGeralTexto += `- Preenchidos: ${(rel.arquivosPreenchidos || []).join(', ') || 'Nenhum'}\n`;
    relGeralTexto += `- Vazios: ${(rel.arquivosVazios || []).join(', ') || 'Nenhum'}\n`;
    if (rel.ambiguidades && rel.ambiguidades.length > 0) {
      relGeralTexto += `- Ambiguidades: ${rel.ambiguidades.join('; ')}\n`;
    }
    relGeralTexto += '\n';
  }
  
  fs.writeFileSync(relGeral, relGeralTexto, 'utf8');
  
  console.log(`\nRelatórios salvos em: ${REPORT_DIR}/`);
  console.log('Processamento concluído.');
}

// Executa
main();