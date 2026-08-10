/**
 * SCRIPT DE TESTE — Verifica a lógica dos importadores sem executar importação.
 * 
 * Uso: node scripts/testar_importadores.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// TESTE 1: Verificar identificação de NPCs no E-CENAS.md
// ============================================================
console.log('=== TESTE 1: Identificação de NPCs no E-CENAS.md ===');

const ecenas = fs.readFileSync('NPC_LORA/memory/E-CENAS.md', 'utf8');
const linhas = ecenas.split('\n');

// Extrair blocos
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

console.log('Total de blocos:', blocos.length);

// Lista de NPCs para teste
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

// Função de identificação (mesma lógica do importar_ecenas.js)
function identificarNPC(conteudo) {
  for (const npc of NPC_LIST) {
    if (npc.nome && conteudo.includes(npc.nome)) {
      return npc;
    }
  }
  for (const npc of NPC_LIST) {
    if (npc.primeiro && npc.sobrenome) {
      if (conteudo.includes(npc.primeiro) && conteudo.includes(npc.sobrenome)) {
        return npc;
      }
    }
  }
  for (const npc of NPC_LIST) {
    if (npc.primeiro && !npc.sobrenome) {
      if (conteudo.includes(npc.primeiro)) {
        return npc;
      }
    }
  }
  return null;
}

// Testar identificação
let identificados = 0;
let naoIdentificados = 0;
let multiNpc = 0;
let invalidos = 0;

for (const bloco of blocos) {
  const conteudo = bloco.conteudo;
  const trimmed = conteudo.trim();
  
  if (trimmed === '---' || trimmed.includes('### CENA') || trimmed.includes('# ROTA DE SANGUE') || trimmed.length < 10) {
    invalidos++;
    continue;
  }
  
  const npc = identificarNPC(conteudo);
  if (npc) {
    identificados++;
  } else {
    naoIdentificados++;
  }
}

console.log('Blocos válidos identificados:', identificados);
console.log('Blocos não identificados:', naoIdentificados);
console.log('Blocos inválidos (separadores, headers):', invalidos);

// ============================================================
// TESTE 2: Verificar identificação de NPCs no CENAS2.md
// ============================================================
console.log('\n=== TESTE 2: Identificação de NPCs no CENAS2.md ===');

const cenas2 = fs.readFileSync('NPC_LORA/memory/CENAS2.md', 'utf8');
const linhas2 = cenas2.split('\n');

const NPC_LIST2 = [
  { nome: 'Vide', pasta: 'vide_o_corruptor' },
  { nome: 'Olberic Eisenberg', pasta: 'olberic_eisenberg' },
  { nome: 'Trish Yamaguchi', pasta: 'trish_yamaguchi' },
  { nome: 'Tressa Colzione', pasta: 'tressa_colzione' },
  { nome: 'Therion', pasta: 'therion' },
  { nome: 'Primrose Azelhart', pasta: 'primrose_azelhart' },
  { nome: 'Osvald V. Vanstein', pasta: 'osvald_v_vanstein' },
  { nome: 'Lyblac', pasta: 'lyblac' }
];

function identificarNPC2(linha) {
  const linhaLower = linha.toLowerCase();
  for (const npc of NPC_LIST2) {
    const nomeLower = npc.nome.toLowerCase();
    const pastaLower = npc.pasta.toLowerCase();
    
    if (linhaLower.includes(nomeLower)) {
      return npc;
    }
    
    const pastaComUnderscore = pastaLower.replace(/_/g, '\\_');
    const pastaSemUnderscore = pastaLower.replace(/_/g, ' ');
    
    if (linhaLower.includes(pastaComUnderscore) || linhaLower.includes(pastaSemUnderscore)) {
      return npc;
    }
    
    const primeiroNome = npc.nome.split(' ')[0].toLowerCase();
    if (linhaLower.includes(primeiroNome)) {
      return npc;
    }
  }
  return null;
}

function ehCabecalhoSecao(linha) {
  const trimmed = linha.trim();
  return trimmed.includes('DIÁLOGOS') || trimmed.includes('CENAS NARRATIVAS');
}

function ehSeparadorSecao(linha) {
  const trimmed = linha.trim();
  return trimmed.includes('====') || trimmed.includes('----') || trimmed.includes('____');
}

// Encontrar seções de NPC
const secoesNPC = [];
for (let i = 0; i < linhas2.length; i++) {
  const linha = linhas2[i].trim();
  
  if (ehCabecalhoSecao(linha)) continue;
  if (ehSeparadorSecao(linha)) continue;
  
  const ehIdentificacao = 
    linha.match(/^PERSONAGEM/i) || 
    linha.match(/^Personagem/i) || 
    linha.match(/^personagem/i) ||
    linha.match(/^\\?#\s*\d+\.\s*[A-Z]/) ||
    linha.match(/^[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+\s*—/) ||
    linha.match(/^[A-Z][a-z]+\s*—/);
  
  if (ehIdentificacao) {
    const npc = identificarNPC2(linha);
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

// Verificar se todas as pastas existem
console.log('\n--- Verificando pastas ---');
for (const sec of secoesNPC) {
  if (sec.npc) {
    const pasta = path.join('NPC_LORA', 'dataset', sec.npc.pasta);
    const existe = fs.existsSync(pasta);
    console.log(`  ${sec.npc.nome}: pasta ${existe ? 'EXISTE' : 'NÃO EXISTE'}`);
  }
}

console.log('\n=== TESTE CONCLUÍDO ===');