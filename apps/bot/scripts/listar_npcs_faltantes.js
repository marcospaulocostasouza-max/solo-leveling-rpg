const fs = require('fs');
const path = require('path');

const DATASET_DIR = path.join(__dirname, '..', 'NPC_LORA', 'dataset');
const CENAS_PATH = path.join(__dirname, '..', 'NPC_LORA', 'memory', 'Cenas.md');

// Arquivos que devem ter conteúdo
const ARQUIVOS_VERIFICAR = [
  '17_dialog_examples.md',
  '18_scene_examples.md',
  '05_interpretation.md',
  '07_values.md'
];

// Lê todos os personagens do dataset
const pastas = fs.readdirSync(DATASET_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== '_TEMPLATE')
  .map(d => d.name)
  .sort();

// Lê o Cenas.md para saber quais personagens têm conteúdo lá
const conteudoCenas = fs.readFileSync(CENAS_PATH, 'utf8');
const linhasCenas = conteudoCenas.split('\n');
const personagemRegex = /^([A-Za-zÀ-ú]+(?:\s+[A-Za-zÀ-ú]+)*)\s+—\s+"(.+)"\s*$/;

const personagensNoCenas = new Set();
for (const linha of linhasCenas) {
  const pm = linha.trim().match(personagemRegex);
  if (pm) {
    personagensNoCenas.add(pm[1].trim());
  }
}

// Mapeamento para verificar
const MAPA_NOMES = {
  'Claude': 'claude',
  'Kaldena Ryu': 'kaldena_ryu',
  'Tanzy Woo': 'tanzy_woo',
  'Petrichor': 'petrichor',
  'Arcanette': 'arcanette',
  'Ori Choi': 'ori_choi',
  'Harvey Jeong': 'harvey_jeong',
  'Kazan': 'kazan',
  'Mugen Ku': 'mugen_ku',
  'Helgenish': 'helgenish',
  'Warden Davids': 'warden_davids',
  'Trish Yamaguchi': 'trish_yamaguchi',
  'Rufus Deng': 'rufus_deng',
  'Onette': 'ochette',
  'Ochette': 'ochette',
  'Temenos Mistral': 'temenos_mistral',
  'Throné Anguis': 'throne_anguis',
  'Throne Anguis': 'throne_anguis',
  'Gideon Ma': 'gideon_ma',
  'Vanessa Hysel': 'vanessa_hysel',
  'Lucia Yeom': 'lucia_yeom',
  'Yvon Baik': 'yvon_baik',
  'Gaston Rho': 'gaston_rho',
  'Miguel Bang': 'miguel_bang',
  'Redeye': 'redeye',
  'Darius Kwon': 'darius_kwon',
  'Simeon Ha': 'simeon_ha',
  'Werner Choi': 'werner_choi',
  'Mattias Cardoso': 'mattias_cardoso',
  'Tatloch': 'tatloch',
  'Alaune Yeong': 'alaune_yeong',
  'Sazantos Do': 'sazantos_do',
  'Isla Gwon': 'isla_gwon',
  'Rondo Baek': 'rondo_baek',
  'Eltrix Noh': 'eltrix_noh',
  'Solon Wi': 'solon_wi',
  'Richard Han': 'richard_han',
  'Bargello Yeon': 'bargello_yeon',
  'Heidne Ahn': 'heidne_ahn',
  'Esperre Jin': 'esperre_jin',
  'Reime Oh': 'reime_oh',
  'Goodwin Cha': 'goodwin_cha',
  'Delitia Song': 'delitia_song',
  'Xerc Baek': 'xerc_baek',
  'Saoirse Ryu': 'saoirse_ryu',
  'Pius Kang': 'pius_kang',
  'Carinda Moon': 'carinda_moon',
  'Ludo Wei': 'ludo_wei',
  'Viator Yoon': 'viator_yoon',
  'Alexia Song': 'alexia_song',
  'Macy Eun': 'macy_eun',
  'Celsus Park': 'celsus_park',
  'Stia Han': 'stia_han',
  'Phenn Doyoung': 'phenn_doyoung',
  'Laurana Bae': 'laurana_bae',
  'Trousseau': 'trousseau',
  'Partitio Yellowil': 'partitio_yellowil',
  'Castti Florenz': 'castti_florenz'
};

console.log('==============================================');
console.log('LISTA DE NPCS FALTANTES - CENAS E DIÁLOGOS');
console.log('==============================================');
console.log('');

let totalFaltando = 0;
const resultados = [];

for (const pasta of pastas) {
  const pastaPath = path.join(DATASET_DIR, pasta);
  const status = { pasta, arquivosVazios: [], temNoCenas: false };
  
  for (const arq of ARQUIVOS_VERIFICAR) {
    const arqPath = path.join(pastaPath, arq);
    if (fs.existsSync(arqPath)) {
      const tamanho = fs.statSync(arqPath).size;
      if (tamanho === 0) {
        status.arquivosVazios.push(arq);
      }
    } else {
      status.arquivosVazios.push(`${arq} (NÃO EXISTE)`);
    }
  }
  
  // Verificar se o personagem está no Cenas.md
  for (const [nome, pastaMapeada] of Object.entries(MAPA_NOMES)) {
    if (pastaMapeada === pasta && personagensNoCenas.has(nome)) {
      status.temNoCenas = true;
      break;
    }
  }
  
  // Se tem arquivos vazios, está faltando
  if (status.arquivosVazios.length > 0) {
    totalFaltando++;
    resultados.push(status);
    console.log(`❌ ${pasta}:`);
    status.arquivosVazios.forEach(a => console.log(`   - ${a} está VAZIO`));
    if (!status.temNoCenas) {
      console.log(`   - ⚠️ Personagem NÃO encontrado no Cenas.md`);
    }
    console.log('');
  }
}

console.log('==============================================');
console.log(`TOTAL DE NPCS COM ARQUIVOS FALTANTES: ${totalFaltando}`);
console.log('');

// Agrupar por tipo de falta
console.log('=== RESUMO POR TIPO DE ARQUIVO FALTANTE ===');
const faltandoDialogos = resultados.filter(r => r.arquivosVazios.some(a => a.includes('17_dialog')));
const faltandoCenas = resultados.filter(r => r.arquivosVazios.some(a => a.includes('18_scene')));
const faltandoInterpretacao = resultados.filter(r => r.arquivosVazios.some(a => a.includes('05_interpretation')));
const faltandoValores = resultados.filter(r => r.arquivosVazios.some(a => a.includes('07_values')));

console.log(`\nFaltando DIÁLOGOS (17_dialog_examples.md): ${faltandoDialogos.length}`);
faltandoDialogos.forEach(r => console.log(`  - ${r.pasta}`));

console.log(`\nFaltando CENAS (18_scene_examples.md): ${faltandoCenas.length}`);
faltandoCenas.forEach(r => console.log(`  - ${r.pasta}`));

console.log(`\nFaltando INTERPRETAÇÃO (05_interpretation.md): ${faltandoInterpretacao.length}`);
faltandoInterpretacao.forEach(r => console.log(`  - ${r.pasta}`));

console.log(`\nFaltando VALORES (07_values.md): ${faltandoValores.length}`);
faltandoValores.forEach(r => console.log(`  - ${r.pasta}`));

// Personagens que estão no Cenas.md mas NÃO têm pasta correspondente
console.log('\n==============================================');
console.log('=== PERSONAGENS NO Cenas.md SEM PASTA ===');
const pastasSet = new Set(pastas);
const nomesMapeados = new Set(Object.values(MAPA_NOMES));
for (const nome of personagensNoCenas) {
  const pasta = MAPA_NOMES[nome];
  if (!pasta || !pastasSet.has(pasta)) {
    console.log(`❌ ${nome} -> sem pasta (ou pasta não encontrada)`);
  }
}