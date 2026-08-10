/**
 * SCRIPT 1 — IMPORTAR E-CENAS.md
 * 
 * Responsável por ler NPC_LORA/memory/E-CENAS.md e distribuir
 * os blocos de cenas e diálogos para os datasets de cada NPC.
 * 
 * Uso: node scripts/importar_ecenas.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// CONFIGURAÇÕES
// ============================================================
const ARQUIVO_FONTE = path.join(__dirname, '..', 'NPC_LORA', 'memory', 'E-CENAS.md');
const DIR_DATASET = path.join(__dirname, '..', 'NPC_LORA', 'dataset');
const ARQ_DIALOGOS = '17_dialog_examples.md';
const ARQ_CENAS = '18_scene_examples.md';
const ARQ_RELATORIO = path.join(__dirname, '..', 'RELATORIO_IMPORTACAO_ECENAS.txt');

// ============================================================
// LISTA DE NPCs — Nome completo, primeiro nome, sobrenome, pasta
// ============================================================
const NPC_LIST = [
  { nome: 'Gaston Rho', primeiro: 'Gaston', sobrenome: 'Rho', pasta: 'gaston_rho' },
  { nome: 'Yvon Baik', primeiro: 'Yvon', sobrenome: 'Baik', pasta: 'yvon_baik' },
  { nome: 'Lucia Yeom', primeiro: 'Lucia', sobrenome: 'Yeom', pasta: 'lucia_yeom' },
  { nome: 'Warden Davids', primeiro: 'Warden', sobrenome: 'Davids', pasta: 'warden_davids' },
  { nome: 'Helgenish', primeiro: 'Helgenish', sobrenome: '', pasta: 'helgenish' },
  { nome: "Entidade 'Mãe'", primeiro: 'Entidade', sobrenome: '', pasta: 'entidade_mae' },
  { nome: 'Petrichor', primeiro: 'Petrichor', sobrenome: '', pasta: 'petrichor' },
  { nome: 'Agnea Bristarni', primeiro: 'Agnea', sobrenome: 'Bristarni', pasta: 'agnea_bristarni' },
  { nome: 'Alaune Yeong', primeiro: 'Alaune', sobrenome: 'Yeong', pasta: 'alaune_yeong' },
  { nome: 'Alexia Song', primeiro: 'Alexia', sobrenome: 'Song', pasta: 'alexia_song' },
  { nome: 'Alfyn Greengrass', primeiro: 'Alfyn', sobrenome: 'Greengrass', pasta: 'alfyn_greengrass' },
  { nome: 'Arcanette', primeiro: 'Arcanette', sobrenome: '', pasta: 'arcanette' },
  { nome: 'Bargello Yeon', primeiro: 'Bargello', sobrenome: 'Yeon', pasta: 'bargello_yeon' },
  { nome: 'Carinda Moon', primeiro: 'Carinda', sobrenome: 'Moon', pasta: 'carinda_moon' },
  { nome: 'Castti Florenz', primeiro: 'Castti', sobrenome: 'Florenz', pasta: 'castti_florenz' },
  { nome: 'Celsus Park', primeiro: 'Celsus', sobrenome: 'Park', pasta: 'celsus_park' },
  { nome: 'Claude', primeiro: 'Claude', sobrenome: '', pasta: 'claude' },
  { nome: 'Cyrus Albright', primeiro: 'Cyrus', sobrenome: 'Albright', pasta: 'cyrus_albright' },
  { nome: 'Darius Kwon', primeiro: 'Darius', sobrenome: 'Kwon', pasta: 'darius_kwon' },
  { nome: 'Delitia Song', primeiro: 'Delitia', sobrenome: 'Song', pasta: 'delitia_song' },
  { nome: 'Elrica Edoras', primeiro: 'Elrica', sobrenome: 'Edoras', pasta: 'elrica_edoras' },
  { nome: 'Eltrix Noh', primeiro: 'Eltrix', sobrenome: 'Noh', pasta: 'eltrix_noh' },
  { nome: 'Esperre Jin', primeiro: 'Esperre', sobrenome: 'Jin', pasta: 'esperre_jin' },
  { nome: 'Galdera', primeiro: 'Galdera', sobrenome: '', pasta: 'galdera' },
  { nome: 'Gideon Ma', primeiro: 'Gideon', sobrenome: 'Ma', pasta: 'gideon_ma' },
  { nome: 'Goodwin Cha', primeiro: 'Goodwin', sobrenome: 'Cha', pasta: 'goodwin_cha' },
  { nome: 'Haanit', primeiro: 'Haanit', sobrenome: '', pasta: 'haanit' },
  { nome: 'Harvey Jeong', primeiro: 'Harvey', sobrenome: 'Jeong', pasta: 'harvey_jeong' },
  { nome: 'Heidne Ahn', primeiro: 'Heidne', sobrenome: 'Ahn', pasta: 'heidne_ahn' },
  { nome: 'Hikari Ku', primeiro: 'Hikari', sobrenome: 'Ku', pasta: 'hikari_ku' },
  { nome: 'Isla Gwon', primeiro: 'Isla', sobrenome: 'Gwon', pasta: 'isla_gwon' },
  { nome: 'Kaldena Ryu', primeiro: 'Kaldena', sobrenome: 'Ryu', pasta: 'kaldena_ryu' },
  { nome: 'Kazan', primeiro: 'Kazan', sobrenome: '', pasta: 'kazan' },
  { nome: 'Laurana Bae', primeiro: 'Laurana', sobrenome: 'Bae', pasta: 'laurana_bae' },
  { nome: 'Ludo Wei', primeiro: 'Ludo', sobrenome: 'Wei', pasta: 'ludo_wei' },
  { nome: 'Lyblac', primeiro: 'Lyblac', sobrenome: '', pasta: 'lyblac' },
  { nome: 'Macy Eun', primeiro: 'Macy', sobrenome: 'Eun', pasta: 'macy_eun' },
  { nome: 'Mattias Cardoso', primeiro: 'Mattias', sobrenome: 'Cardoso', pasta: 'mattias_cardoso' },
  { nome: 'Miguel Bang', primeiro: 'Miguel', sobrenome: 'Bang', pasta: 'miguel_bang' },
  { nome: 'Mugen Ku', primeiro: 'Mugen', sobrenome: 'Ku', pasta: 'mugen_ku' },
  { nome: 'Ochette', primeiro: 'Ochette', sobrenome: '', pasta: 'ochette' },
  { nome: 'Olberic Eisenberg', primeiro: 'Olberic', sobrenome: 'Eisenberg', pasta: 'olberic_eisenberg' },
  { nome: 'Ophilia Clement', primeiro: 'Ophilia', sobrenome: 'Clement', pasta: 'ophilia_clement' },
  { nome: 'Ori Choi', primeiro: 'Ori', sobrenome: 'Choi', pasta: 'ori_choi' },
  { nome: 'Osvald V. Vanstein', primeiro: 'Osvald', sobrenome: 'Vanstein', pasta: 'osvald_v_vanstein' },
  { nome: 'Partitio Yellowil', primeiro: 'Partitio', sobrenome: 'Yellowil', pasta: 'partitio_yellowil' },
  { nome: 'Phenn Doyoung', primeiro: 'Phenn', sobrenome: 'Doyoung', pasta: 'phenn_doyoung' },
  { nome: 'Pius Kang', primeiro: 'Pius', sobrenome: 'Kang', pasta: 'pius_kang' },
  { nome: 'Primrose Azelhart', primeiro: 'Primrose', sobrenome: 'Azelhart', pasta: 'primrose_azelhart' },
  { nome: 'Redeye', primeiro: 'Redeye', sobrenome: '', pasta: 'redeye' },
  { nome: 'Reime Oh', primeiro: 'Reime', sobrenome: 'Oh', pasta: 'reime_oh' },
  { nome: 'Richard Han', primeiro: 'Richard', sobrenome: 'Han', pasta: 'richard_han' },
  { nome: 'Rondo Baek', primeiro: 'Rondo', sobrenome: 'Baek', pasta: 'rondo_baek' },
  { nome: 'Rufus Deng', primeiro: 'Rufus', sobrenome: 'Deng', pasta: 'rufus_deng' },
  { nome: 'Saoirse Ryu', primeiro: 'Saoirse', sobrenome: 'Ryu', pasta: 'saoirse_ryu' },
  { nome: 'Sazantos Do', primeiro: 'Sazantos', sobrenome: 'Do', pasta: 'sazantos_do' },
  { nome: 'Simeon Ha', primeiro: 'Simeon', sobrenome: 'Ha', pasta: 'simeon_ha' },
  { nome: 'Solon Wi', primeiro: 'Solon', sobrenome: 'Wi', pasta: 'solon_wi' },
  { nome: 'Stia Han', primeiro: 'Stia', sobrenome: 'Han', pasta: 'stia_han' },
  { nome: 'Tanzy Woo', primeiro: 'Tanzy', sobrenome: 'Woo', pasta: 'tanzy_woo' },
  { nome: 'Tatloch', primeiro: 'Tatloch', sobrenome: '', pasta: 'tatloch' },
  { nome: 'Temenos Mistral', primeiro: 'Temenos', sobrenome: 'Mistral', pasta: 'temenos_mistral' },
  { nome: 'Therion', primeiro: 'Therion', sobrenome: '', pasta: 'therion' },
  { nome: 'Throne Anguis', primeiro: 'Throne', sobrenome: 'Anguis', pasta: 'throne_anguis' },
  { nome: 'Tressa Colzione', primeiro: 'Tressa', sobrenome: 'Colzione', pasta: 'tressa_colzione' },
  { nome: 'Trish Yamaguchi', primeiro: 'Trish', sobrenome: 'Yamaguchi', pasta: 'trish_yamaguchi' },
  { nome: 'Trousseau', primeiro: 'Trousseau', sobrenome: '', pasta: 'trousseau' },
  { nome: 'Vanessa Hysel', primeiro: 'Vanessa', sobrenome: 'Hysel', pasta: 'vanessa_hysel' },
  { nome: 'Viator Yoon', primeiro: 'Viator', sobrenome: 'Yoon', pasta: 'viator_yoon' },
  { nome: 'Vide', primeiro: 'Vide', sobrenome: '', pasta: 'vide_o_corruptor' },
  { nome: 'Werner Choi', primeiro: 'Werner', sobrenome: 'Choi', pasta: 'werner_choi' },
  { nome: 'Xerc Baek', primeiro: 'Xerc', sobrenome: 'Baek', pasta: 'xerc_baek' }
];

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

/**
 * Identifica qual NPC é o principal de um bloco de conteúdo.
 * Retorna o objeto NPC ou null se não identificado.
 */
function identificarNPC(conteudo) {
  // Verificar nome completo primeiro
  for (const npc of NPC_LIST) {
    if (npc.nome && conteudo.includes(npc.nome)) {
      return npc;
    }
  }
  
  // Verificar primeiro nome + sobrenome separadamente
  for (const npc of NPC_LIST) {
    if (npc.primeiro && npc.sobrenome) {
      if (conteudo.includes(npc.primeiro) && conteudo.includes(npc.sobrenome)) {
        return npc;
      }
    }
  }
  
  // Verificar apenas primeiro nome (para NPCs sem sobrenome)
  for (const npc of NPC_LIST) {
    if (npc.primeiro && !npc.sobrenome) {
      if (conteudo.includes(npc.primeiro)) {
        return npc;
      }
    }
  }
  
  return null;
}

/**
 * Verifica se um bloco é um diálogo (contém travessão —)
 */
function ehDialogo(conteudo) {
  return conteudo.includes('—');
}

/**
 * Verifica se um bloco é um separador ou header mal formatado
 */
function ehBlocoInvalido(conteudo) {
  const trimmed = conteudo.trim();
  if (trimmed === '---') return true;
  if (trimmed.includes('### CENA')) return true;
  if (trimmed.includes('# ROTA DE SANGUE')) return true;
  if (trimmed.length < 10) return true;
  return false;
}

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

// ============================================================
// FUNÇÃO PRINCIPAL
// ============================================================

function main() {
  console.log('=== IMPORTADOR E-CENAS.md ===');
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
  
  // Extrair blocos de código
  const blocos = [];
  let inCode = false;
  let blocoAtual = [];
  let blocoInicio = 0;
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (linha === '```') {
      if (inCode) {
        blocos.push({
          inicio: blocoInicio,
          fim: i + 1,
          conteudo: blocoAtual.join('\n')
        });
        blocoAtual = [];
        inCode = false;
      } else {
        blocoInicio = i + 1;
        inCode = true;
      }
    } else if (inCode) {
      blocoAtual.push(linhas[i]);
    }
  }
  
  console.log('Total de blocos extraídos:', blocos.length);
  
  // Estatísticas
  const stats = {
    totalNPCs: NPC_LIST.length,
    totalBlocos: blocos.length,
    blocosCopiados: 0,
    blocosIgnorados: 0,
    npcsSemPasta: [],
    npcsNaoIdentificados: [],
    npcsImportados: []
  };
  
  // Processar cada bloco
  for (const bloco of blocos) {
    const conteudoBloco = bloco.conteudo;
    
    // Pular blocos inválidos
    if (ehBlocoInvalido(conteudoBloco)) {
      stats.blocosIgnorados++;
      continue;
    }
    
    // Identificar NPC
    const npc = identificarNPC(conteudoBloco);
    
    if (!npc) {
      stats.blocosIgnorados++;
      stats.npcsNaoIdentificados.push(`Bloco linhas ${bloco.inicio}-${bloco.fim}`);
      continue;
    }
    
    // Verificar se a pasta do NPC existe
    const pastaNPC = path.join(DIR_DATASET, npc.pasta);
    if (!fs.existsSync(pastaNPC)) {
      stats.blocosIgnorados++;
      if (!stats.npcsSemPasta.includes(npc.nome)) {
        stats.npcsSemPasta.push(npc.nome);
      }
      continue;
    }
    
    // Determinar se é diálogo ou cena
    const ehDialog = ehDialogo(conteudoBloco);
    const arquivoDestino = ehDialog ? ARQ_DIALOGOS : ARQ_CENAS;
    const caminhoDestino = path.join(pastaNPC, arquivoDestino);
    
    // Anexar bloco
    const copiado = anexarBloco(caminhoDestino, conteudoBloco);
    
    if (copiado) {
      stats.blocosCopiados++;
      if (!stats.npcsImportados.includes(npc.nome)) {
        stats.npcsImportados.push(npc.nome);
      }
    } else {
      stats.blocosIgnorados++;
    }
  }
  
  // Gerar relatório
  const relatorio = [
    '==============================================',
    'RELATÓRIO DE IMPORTAÇÃO — E-CENAS.md',
    '==============================================',
    '',
    `Total de NPCs encontrados: ${stats.totalNPCs}`,
    `Total de blocos encontrados: ${stats.totalBlocos}`,
    `Total de blocos copiados: ${stats.blocosCopiados}`,
    `Total de blocos ignorados: ${stats.blocosIgnorados}`,
    '',
    'NPCs sem pasta correspondente:',
    stats.npcsSemPasta.length > 0 ? stats.npcsSemPasta.join(', ') : 'Nenhum',
    '',
    'NPCs não identificados:',
    stats.npcsNaoIdentificados.length > 0 ? stats.npcsNaoIdentificados.join(', ') : 'Nenhum',
    '',
    'NPCs importados:',
    stats.npcsImportados.length > 0 ? stats.npcsImportados.join(', ') : 'Nenhum',
    '',
    '=============================================='
  ].join('\n');
  
  fs.writeFileSync(ARQ_RELATORIO, relatorio, 'utf8');
  
  console.log('\n=== RESUMO ===');
  console.log('Total de NPCs encontrados:', stats.totalNPCs);
  console.log('Total de blocos encontrados:', stats.totalBlocos);
  console.log('Total de blocos copiados:', stats.blocosCopiados);
  console.log('Total de blocos ignorados:', stats.blocosIgnorados);
  console.log('NPCs sem pasta:', stats.npcsSemPasta.length);
  console.log('NPCs não identificados:', stats.npcsNaoIdentificados.length);
  console.log('NPCs importados:', stats.npcsImportados.length);
  console.log('\nRelatório gerado em:', ARQ_RELATORIO);
}

// Executar
main();