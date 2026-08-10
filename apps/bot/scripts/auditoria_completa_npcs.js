const fs = require('fs');
const path = require('path');

const DATASET_DIR = path.join(__dirname, '..', 'NPC_LORA', 'dataset');
const RELATORIO_PATH = path.join(__dirname, '..', 'RELATORIO_AUDITORIA_COMPLETA.txt');

const ARQUIVOS_PADRAO = [
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

// Nomes esperados dos arquivos (sem prefixo numérico)
const NOMES_ESPERADOS = {
  '01_identity.md': 'identity',
  '02_summary.md': 'summary',
  '03_history.md': 'history',
  '04_personality.md': 'personality',
  '05_interpretation.md': 'interpretation',
  '06_speech.md': 'speech',
  '07_values.md': 'values',
  '08_likes.md': 'likes',
  '09_dislikes.md': 'dislikes',
  '10_traumas.md': 'traumas',
  '11_relationships.md': 'relationships',
  '12_goals.md': 'goals',
  '13_knowledge.md': 'knowledge',
  '14_curiosities.md': 'curiosities',
  '15_narrative_gaps.md': 'narrative_gaps',
  '16_absolute_rules.md': 'absolute_rules',
  '17_dialog_examples.md': 'dialog_examples',
  '18_scene_examples.md': 'scene_examples'
};

// Palavras-chave esperadas em cada arquivo (para verificar conteúdo compatível)
const PALAVRAS_CHAVE = {
  '01_identity.md': ['nome', 'name', 'identidade', 'identity', 'idade', 'age', 'raça', 'race', 'classe', 'class', 'título', 'title', 'aparência', 'appearance', 'descrição', 'description'],
  '02_summary.md': ['resumo', 'summary', 'visão', 'overview', 'sobre', 'about', 'personagem', 'character'],
  '03_history.md': ['história', 'history', 'passado', 'past', 'origem', 'origin', 'infância', 'childhood', 'eventos', 'events'],
  '04_personality.md': ['personalidade', 'personality', 'traços', 'traits', 'comportamento', 'behavior', 'temperamento', 'temperament'],
  '05_interpretation.md': ['interpretação', 'interpretation', 'como interpretar', 'how to', 'dublagem', 'voz', 'voice', 'tom', 'tone', 'atitude', 'attitude'],
  '06_speech.md': ['fala', 'speech', 'linguagem', 'language', 'vocabulário', 'vocabulary', 'expressões', 'expressions', 'gírias', 'slang', 'tom de voz', 'voice tone'],
  '07_values.md': ['valores', 'values', 'princípios', 'principles', 'moral', 'moral', 'ética', 'ethics', 'crenças', 'beliefs'],
  '08_likes.md': ['gostos', 'likes', 'gosta', 'like', 'preferências', 'preferences', 'interesses', 'interests', 'hobbies'],
  '09_dislikes.md': ['desgostos', 'dislikes', 'não gosta', 'dislike', 'odeia', 'hates', 'aversão', 'aversion'],
  '10_traumas.md': ['trauma', 'trauma', 'medo', 'fear', 'ferida', 'wound', 'perda', 'loss', 'cicatriz', 'scar'],
  '11_relationships.md': ['relacionamentos', 'relationships', 'amigos', 'friends', 'inimigos', 'enemies', 'família', 'family', 'aliados', 'allies', 'relação', 'relation'],
  '12_goals.md': ['objetivos', 'goals', 'metas', 'targets', 'desejos', 'desires', 'ambições', 'ambitions', 'sonhos', 'dreams'],
  '13_knowledge.md': ['conhecimento', 'knowledge', 'saber', 'know', 'habilidades', 'skills', 'perícias', 'expertise', 'informação', 'information'],
  '14_curiosities.md': ['curiosidades', 'curiosities', 'fatos', 'facts', 'detalhes', 'details', 'segredos', 'secrets', 'trivia'],
  '15_narrative_gaps.md': ['lacunas', 'gaps', 'narrativa', 'narrative', 'mistérios', 'mysteries', 'pendências', 'pending', 'aberto', 'open'],
  '16_absolute_rules.md': ['regras', 'rules', 'absolutas', 'absolute', 'nunca', 'never', 'sempre', 'always', 'proibido', 'forbidden', 'obrigatório', 'mandatory'],
  '17_dialog_examples.md': ['diálogo', 'dialog', 'exemplo', 'example', 'fala', 'speech', 'linha', 'line', 'citação', 'quote'],
  '18_scene_examples.md': ['cena', 'scene', 'exemplo', 'example', 'situação', 'situation', 'contexto', 'context', 'interação', 'interaction']
};

function lerArquivo(caminho) {
  try {
    return fs.readFileSync(caminho, 'utf8');
  } catch (e) {
    return null;
  }
}

/**
 * Detecta caracteres corrompidos de forma robusta.
 * 
 * Regras:
 * 1. Caractere de substituição U+FFFD () → sempre corrupção
 * 2. Mojibake de 2 bytes: Ã ou Â seguido de byte baixo (U+0080-U+00BF)
 *    ou caracteres especiais de Windows-1252 (aspas curvas, travessões, etc.)
 *    → indica UTF-8 interpretado como Latin-1/ANSI
 * 3. Mojibake de 3 bytes: â€ seguido de byte baixo ou caractere especial
 *    → indica UTF-8 interpretado como Latin-1/ANSI (aspas curvas, travessões, etc.)
 * 
 * Caracteres acentuados válidos do português (á à â ã ä é è ê ë í ì î ï ó ò ô õ ö
 * ú ù û ü ç e suas versões maiúsculas) NUNCA são considerados corrupção.
 */
function detectarCaracteresCorrompidos(conteudo) {
  if (!conteudo) return false;

  // 1. Caractere de substituição U+FFFD () - sempre indica corrupção
  if (conteudo.includes('\uFFFD')) {
    return true;
  }

  // 2. Mojibake de 2 bytes: Ã ou Â seguido de byte baixo (U+0080-U+00BF)
  //    ou caracteres especiais de Windows-1252 (aspas curvas, travessões, etc.)
  //    Isso cobre padrões como: Ã£ (ã), Ã§ (ç), Ã© (é), Ãª (ê), Ã¡ (á),
  //    Ãµ (õ), Ã´ (ô), Ã¢ (â), Ã“ (Ó), Ã” (Ô), etc.
  const mojibake2Bytes = /[ÃÂ][\u0080-\u00BF\u2018-\u201F\u2020-\u2026\u2030-\u2039\u20AC\u2122\u0160-\u017E]/;
  if (mojibake2Bytes.test(conteudo)) {
    return true;
  }

  // 3. Mojibake de 3 bytes: â€ seguido de byte baixo ou caractere especial
  //    Isso cobre padrões como: â€œ (aspas), â€“ (travessão), â€™ (apóstrofo), etc.
  const mojibake3Bytes = /â€[\u0080-\u00BF\u2018-\u201F\u2020-\u2026\u2030-\u2039\u20AC\u2122\u0160-\u017E]/;
  if (mojibake3Bytes.test(conteudo)) {
    return true;
  }

  return false;
}

function analisarConteudo(conteudo, nomeArquivo) {
  const resultado = {
    vazio: false,
    apenasTitulo: false,
    conteudoSuficiente: false,
    incompleto: false,
    duplicacoesExcessivas: false,
    conteudoIncompativel: false,
    contradicoes: false,
    problemasFormatacao: false,
    caracteresCorrompidos: false,
    blocosRepetidos: false,
    exemplosSuficientes: false,
    detalhes: []
  };

  if (!conteudo || conteudo.trim().length === 0) {
    resultado.vazio = true;
    resultado.detalhes.push('Arquivo vazio');
    return resultado;
  }

  // Verificar caracteres corrompidos usando a função robusta
  if (detectarCaracteresCorrompidos(conteudo)) {
    resultado.caracteresCorrompidos = true;
    resultado.detalhes.push('Possui caracteres corrompidos (encoding)');
  }

  // Verificar se é apenas título
  const linhas = conteudo.split('\n').filter(l => l.trim().length > 0);
  if (linhas.length <= 2) {
    const semTitulo = linhas.filter(l => !l.trim().startsWith('#')).join('').trim();
    if (semTitulo.length === 0) {
      resultado.apenasTitulo = true;
      resultado.detalhes.push('Possui apenas título');
      return resultado;
    }
  }

  // Verificar conteúdo suficiente (mínimo de caracteres)
  const textoLimpo = conteudo.replace(/#{1,6}\s/g, '').replace(/[*_`~]/g, '').trim();
  if (textoLimpo.length < 100) {
    resultado.incompleto = true;
    resultado.detalhes.push(`Conteúdo muito curto (${textoLimpo.length} caracteres)`);
  } else if (textoLimpo.length >= 100 && textoLimpo.length < 300) {
    resultado.incompleto = true;
    resultado.detalhes.push(`Conteúdo abaixo do ideal (${textoLimpo.length} caracteres)`);
  } else {
    resultado.conteudoSuficiente = true;
  }

  // Verificar duplicações excessivas (linhas repetidas)
  const linhasUnicas = new Set(linhas.map(l => l.trim().toLowerCase()));
  if (linhas.length > 0 && linhasUnicas.size < linhas.length * 0.5) {
    resultado.duplicacoesExcessivas = true;
    resultado.detalhes.push('Possui muitas linhas duplicadas');
  }

  // Verificar blocos repetidos (parágrafos idênticos)
  const paragrafos = conteudo.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragrafosVistos = new Set();
  let blocosRepetidos = 0;
  for (const p of paragrafos) {
    const chave = p.trim().toLowerCase();
    if (paragrafosVistos.has(chave)) {
      blocosRepetidos++;
    }
    paragrafosVistos.add(chave);
  }
  if (blocosRepetidos > 0) {
    resultado.blocosRepetidos = true;
    resultado.detalhes.push(`Possui ${blocosRepetidos} blocos repetidos`);
  }

  // Verificar palavras-chave do arquivo
  const palavrasChave = PALAVRAS_CHAVE[nomeArquivo] || [];
  const textoLower = conteudo.toLowerCase();
  const encontradas = palavrasChave.filter(p => textoLower.includes(p.toLowerCase()));
  if (encontradas.length === 0) {
    resultado.conteudoIncompativel = true;
    resultado.detalhes.push('Conteúdo não parece corresponder ao tipo de arquivo');
  }

  // Verificar problemas de formatação (títulos sem #, listas quebradas, etc.)
  if (/^[A-Z][a-z]+:$/m.test(conteudo) && !/^#/m.test(conteudo)) {
    resultado.problemasFormatacao = true;
    resultado.detalhes.push('Possui títulos sem marcação #');
  }

  // Verificar exemplos suficientes (para arquivos de exemplo)
  if (nomeArquivo === '17_dialog_examples.md' || nomeArquivo === '18_scene_examples.md') {
    // Detectar exemplos em formato de cabeçalho (##) ou numeração (1., 2., etc.)
    const numExemplosCabecalho = (conteudo.match(/^#{2,3}\s/mg) || []).length;
    const numExemplosNumerados = (conteudo.match(/^\d+\.\s/mg) || []).length;
    const numExemplos = Math.max(numExemplosCabecalho, numExemplosNumerados);
    if (numExemplos >= 3) {
      resultado.exemplosSuficientes = true;
    } else {
      resultado.incompleto = true;
      resultado.detalhes.push(`Possui apenas ${numExemplos} exemplos (mínimo recomendado: 3)`);
    }
  }

  return resultado;
}

function verificarDuplicacoesNPCs(nomesNPCs) {
  const duplicados = [];
  const vistos = new Map();
  for (const nome of nomesNPCs) {
    const normalizado = nome.toLowerCase().replace(/[_\s-]/g, '');
    if (vistos.has(normalizado)) {
      duplicados.push({ original: vistos.get(normalizado), duplicado: nome });
    } else {
      vistos.set(normalizado, nome);
    }
  }
  return duplicados;
}

function main() {
  const itens = fs.readdirSync(DATASET_DIR, { withFileTypes: true });
  const pastas = itens.filter(i => i.isDirectory()).map(i => i.name);
  const nomesNPCs = pastas.filter(n => n !== '_TEMPLATE');

  const relatorio = [];
  const resumo = {
    totalNPCs: nomesNPCs.length,
    completos100: 0,
    comVazios: 0,
    comIncompletos: 0,
    comInconsistencias: 0,
    comProblemasEstrutura: 0,
    npcsDetalhes: []
  };

  // Verificar duplicações
  const duplicados = verificarDuplicacoesNPCs(nomesNPCs);

  // Verificar arquivos fora do padrão
  const arquivosForaPadrao = [];
  const pastasSemJSON = [];
  const jsonsSemDataset = [];

  // Verificar JSONs na pasta src/npc/data
  const configsDir = path.join(__dirname, '..', 'src', 'npc', 'data');
  let configsExistem = false;
  try {
    configsExistem = fs.existsSync(configsDir);
  } catch (e) {}

  for (const nome of nomesNPCs) {
    const pastaNPC = path.join(DATASET_DIR, nome);
    const arquivos = fs.readdirSync(pastaNPC);
    
    // Verificar arquivos fora do padrão
    for (const arq of arquivos) {
      if (!ARQUIVOS_PADRAO.includes(arq) && !arq.startsWith('.')) {
        arquivosForaPadrao.push({ npc: nome, arquivo: arq });
      }
    }

    // Verificar se existe JSON correspondente
    const jsonPath = path.join(configsDir, `${nome}.json`);
    if (!fs.existsSync(jsonPath)) {
      pastasSemJSON.push(nome);
    }

    // Analisar cada arquivo padrão
    const arquivosExistentes = [];
    const arquivosAusentes = [];
    const arquivosVazios = [];
    const arquivosIncompletos = [];
    const problemas = [];
    let totalArquivosValidos = 0;

    for (const arqPadrao of ARQUIVOS_PADRAO) {
      const caminho = path.join(pastaNPC, arqPadrao);
      if (fs.existsSync(caminho)) {
        arquivosExistentes.push(arqPadrao);
        const conteudo = lerArquivo(caminho);
        const analise = analisarConteudo(conteudo, arqPadrao);
        
        if (analise.vazio) {
          arquivosVazios.push(arqPadrao);
          problemas.push(`${arqPadrao}: vazio`);
        } else if (analise.apenasTitulo) {
          arquivosIncompletos.push(arqPadrao);
          problemas.push(`${arqPadrao}: apenas título`);
        } else if (analise.incompleto) {
          arquivosIncompletos.push(arqPadrao);
          problemas.push(`${arqPadrao}: incompleto (${analise.detalhes.join('; ')})`);
        } else {
          totalArquivosValidos++;
        }

        if (analise.duplicacoesExcessivas) {
          problemas.push(`${arqPadrao}: duplicações excessivas`);
        }
        if (analise.conteudoIncompativel) {
          problemas.push(`${arqPadrao}: conteúdo incompatível com o tipo`);
        }
        if (analise.caracteresCorrompidos) {
          problemas.push(`${arqPadrao}: caracteres corrompidos`);
        }
        if (analise.blocosRepetidos) {
          problemas.push(`${arqPadrao}: blocos repetidos`);
        }
        if (analise.problemasFormatacao) {
          problemas.push(`${arqPadrao}: problemas de formatação`);
        }
      } else {
        arquivosAusentes.push(arqPadrao);
      }
    }

    // Calcular nível de completude
    const totalArquivos = ARQUIVOS_PADRAO.length;
    const nivelCompletude = Math.round((totalArquivosValidos / totalArquivos) * 100);

    // Atualizar resumo
    if (nivelCompletude === 100) {
      resumo.completos100++;
    }
    if (arquivosVazios.length > 0) {
      resumo.comVazios++;
    }
    if (arquivosIncompletos.length > 0) {
      resumo.comIncompletos++;
    }
    if (problemas.length > 0) {
      resumo.comInconsistencias++;
    }
    if (arquivosAusentes.length > 0 || arquivosForaPadrao.some(a => a.npc === nome)) {
      resumo.comProblemasEstrutura++;
    }

    resumo.npcsDetalhes.push({
      nome,
      arquivosExistentes,
      arquivosAusentes,
      arquivosVazios,
      arquivosIncompletos,
      problemas,
      nivelCompletude
    });
  }

  // Verificar JSONs sem dataset
  if (configsExistem) {
    const configs = fs.readdirSync(configsDir).filter(f => f.endsWith('.json'));
    for (const cfg of configs) {
      const nomeBase = cfg.replace('.json', '');
      if (!nomesNPCs.includes(nomeBase)) {
        jsonsSemDataset.push(nomeBase);
      }
    }
  }

  // Gerar relatório
  relatorio.push('='.repeat(80));
  relatorio.push('RELATÓRIO DE AUDITORIA COMPLETA DOS NPCs');
  relatorio.push('='.repeat(80));
  relatorio.push('');
  relatorio.push(`Data: ${new Date().toLocaleString('pt-BR')}`);
  relatorio.push(`Total de NPCs encontrados: ${nomesNPCs.length}`);
  relatorio.push('');
  relatorio.push('='.repeat(80));
  relatorio.push('DETALHAMENTO POR NPC');
  relatorio.push('='.repeat(80));
  relatorio.push('');

  for (const npc of resumo.npcsDetalhes) {
    relatorio.push('-' .repeat(80));
    relatorio.push(`Nome: ${npc.nome}`);
    relatorio.push(`Arquivos existentes (${npc.arquivosExistentes.length}/18):`);
    for (const arq of npc.arquivosExistentes) {
      relatorio.push(`  ✔ ${arq}`);
    }
    if (npc.arquivosAusentes.length > 0) {
      relatorio.push(`Arquivos ausentes (${npc.arquivosAusentes.length}):`);
      for (const arq of npc.arquivosAusentes) {
        relatorio.push(`  ✘ ${arq}`);
      }
    } else {
      relatorio.push('Arquivos ausentes: Nenhum');
    }
    if (npc.arquivosVazios.length > 0) {
      relatorio.push(`Arquivos vazios (${npc.arquivosVazios.length}):`);
      for (const arq of npc.arquivosVazios) {
        relatorio.push(`  ⚠ ${arq}`);
      }
    } else {
      relatorio.push('Arquivos vazios: Nenhum');
    }
    if (npc.arquivosIncompletos.length > 0) {
      relatorio.push(`Arquivos incompletos (${npc.arquivosIncompletos.length}):`);
      for (const arq of npc.arquivosIncompletos) {
        relatorio.push(`  ⚠ ${arq}`);
      }
    } else {
      relatorio.push('Arquivos incompletos: Nenhum');
    }
    if (npc.problemas.length > 0) {
      relatorio.push(`Problemas encontrados (${npc.problemas.length}):`);
      for (const prob of npc.problemas) {
        relatorio.push(`  ⚠ ${prob}`);
      }
    } else {
      relatorio.push('Problemas encontrados: Nenhum');
    }
    relatorio.push(`Nível de completude: ${npc.nivelCompletude}%`);
    relatorio.push('');
  }

  // Resumo geral
  relatorio.push('='.repeat(80));
  relatorio.push('RESUMO GERAL');
  relatorio.push('='.repeat(80));
  relatorio.push('');
  relatorio.push(`Total de NPCs: ${resumo.totalNPCs}`);
  relatorio.push(`NPCs 100% completos: ${resumo.completos100}`);
  relatorio.push(`NPCs com arquivos vazios: ${resumo.comVazios}`);
  relatorio.push(`NPCs com arquivos incompletos: ${resumo.comIncompletos}`);
  relatorio.push(`NPCs com inconsistências: ${resumo.comInconsistencias}`);
  relatorio.push(`NPCs com problemas de estrutura: ${resumo.comProblemasEstrutura}`);
  relatorio.push('');

  // Verificações adicionais
  relatorio.push('='.repeat(80));
  relatorio.push('VERIFICAÇÕES ADICIONAIS');
  relatorio.push('='.repeat(80));
  relatorio.push('');

  if (duplicados.length > 0) {
    relatorio.push('NPCs duplicados:');
    for (const d of duplicados) {
      relatorio.push(`  ⚠ ${d.original} ↔ ${d.duplicado}`);
    }
  } else {
    relatorio.push('NPCs duplicados: Nenhum');
  }
  relatorio.push('');

  if (pastasSemJSON.length > 0) {
    relatorio.push(`Pastas sem JSON correspondente (${pastasSemJSON.length}):`);
    for (const p of pastasSemJSON) {
      relatorio.push(`  ⚠ ${p}`);
    }
  } else {
    relatorio.push('Pastas sem JSON correspondente: Nenhuma');
  }
  relatorio.push('');

  if (jsonsSemDataset.length > 0) {
    relatorio.push(`JSONs sem dataset correspondente (${jsonsSemDataset.length}):`);
    for (const j of jsonsSemDataset) {
      relatorio.push(`  ⚠ ${j}`);
    }
  } else {
    relatorio.push('JSONs sem dataset correspondente: Nenhum');
  }
  relatorio.push('');

  if (arquivosForaPadrao.length > 0) {
    relatorio.push(`Arquivos fora do padrão (${arquivosForaPadrao.length}):`);
    for (const a of arquivosForaPadrao) {
      relatorio.push(`  ⚠ ${a.npc}/${a.arquivo}`);
    }
  } else {
    relatorio.push('Arquivos fora do padrão: Nenhum');
  }
  relatorio.push('');

  // Lista de pendências
  relatorio.push('='.repeat(80));
  relatorio.push('LISTA DE PENDÊNCIAS PARA TREINAMENTO');
  relatorio.push('='.repeat(80));
  relatorio.push('');

  const pendencias = [];
  for (const npc of resumo.npcsDetalhes) {
    if (npc.arquivosAusentes.length > 0) {
      pendencias.push(`${npc.nome}: criar ${npc.arquivosAusentes.length} arquivo(s) ausente(s): ${npc.arquivosAusentes.join(', ')}`);
    }
    if (npc.arquivosVazios.length > 0) {
      pendencias.push(`${npc.nome}: preencher ${npc.arquivosVazios.length} arquivo(s) vazio(s): ${npc.arquivosVazios.join(', ')}`);
    }
    if (npc.arquivosIncompletos.length > 0) {
      pendencias.push(`${npc.nome}: completar ${npc.arquivosIncompletos.length} arquivo(s) incompleto(s): ${npc.arquivosIncompletos.join(', ')}`);
    }
  }

  if (pendencias.length > 0) {
    for (const p of pendencias) {
      relatorio.push(`  ☐ ${p}`);
    }
  } else {
    relatorio.push('  ✔ Nenhuma pendência encontrada. Dataset pronto para treinamento!');
  }
  relatorio.push('');

  relatorio.push('='.repeat(80));
  relatorio.push('FIM DO RELATÓRIO');
  relatorio.push('='.repeat(80));

  const conteudoRelatorio = relatorio.join('\n');
  fs.writeFileSync(RELATORIO_PATH, conteudoRelatorio, 'utf8');
  console.log(`Relatório gerado em: ${RELATORIO_PATH}`);
  console.log(`Total de NPCs: ${resumo.totalNPCs}`);
  console.log(`NPCs 100% completos: ${resumo.completos100}`);
  console.log(`NPCs com arquivos vazios: ${resumo.comVazios}`);
  console.log(`NPCs com arquivos incompletos: ${resumo.comIncompletos}`);
  console.log(`NPCs com inconsistências: ${resumo.comInconsistencias}`);
  console.log(`NPCs com problemas de estrutura: ${resumo.comProblemasEstrutura}`);
}

main();