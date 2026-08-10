/**
 * Script para criar a estrutura de diretórios e arquivos vazios
 * para todos os NPCs restantes (excluindo ophilia_clement que já existe).
 */

const fs = require('fs');
const path = require('path');

const datasetPath = path.join(__dirname, '..', 'dataset');

const npcs = [
  'cyrus_albright', 'tressa_colzione', 'olberic_eisenberg', 'primrose_azelhart',
  'alfyn_greengrass', 'therion', 'haanit', 'hikari_ku',
  'agnea_bristarni', 'castti_florenz', 'osvald_v_vanstein', 'partitio_yellowil',
  'ochette', 'temenos_mistral', 'throne_anguis', 'lyblac',
  'galdera', 'vide_o_corruptor', 'trousseau', 'stia_han',
  'phenn_doyoung', 'laurana_bae', 'celsus_park', 'macy_eun',
  'alexia_song', 'viator_yoon', 'ludo_wei', 'carinda_moon',
  'pius_kang', 'saoirse_ryu', 'xerc_baek', 'delitia_song',
  'esperre_jin', 'goodwin_cha', 'reime_oh', 'heidne_ahn',
  'bargello_yeon', 'alaune_yeong', 'richard_han', 'solon_wi',
  'eltrix_noh', 'rondo_baek', 'isla_gwon', 'sazantos_do',
  'elrica_edoras', 'tatloch', 'mattias_cardoso', 'werner_choi',
  'simeon_ha', 'darius_kwon', 'redeye', 'miguel_bang',
  'gaston_rho', 'yvon_baik', 'lucia_yeom', 'vanessa_hysel',
  'gideon_ma', 'rufus_deng', 'trish_yamaguchi', 'warden_davids',
  'helgenish', 'entidade_mae', 'mugen_ku', 'kazan',
  'tanzy_woo', 'ori_choi', 'harvey_jeong', 'arcanette',
  'kaldena_ryu', 'claude', 'petrichor'
];

const files = [
  '01_identity.md', '02_summary.md', '03_history.md', '04_personality.md',
  '05_interpretation.md', '06_speech.md', '07_values.md', '08_likes.md',
  '09_dislikes.md', '10_traumas.md', '11_relationships.md', '12_goals.md',
  '13_knowledge.md', '14_curiosities.md', '15_narrative_gaps.md',
  '16_absolute_rules.md', '17_dialog_examples.md', '18_scene_examples.md'
];

let createdDirs = 0;
let createdFiles = 0;

for (const npc of npcs) {
  const dir = path.join(datasetPath, npc);

  // Criar diretório se não existir
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    createdDirs++;
  }

  // Criar arquivos vazios se não existirem
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '', 'utf8');
      createdFiles++;
    }
  }
}

console.log(`Personagens criados: ${createdDirs}`);
console.log(`Arquivos criados: ${createdFiles}`);
console.log(`Total de NPCs: ${npcs.length}`);
console.log(`Total de arquivos por NPC: ${files.length}`);