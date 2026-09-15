const CLASS_BONUSES: Record<string, string> = {
  lutador: 'forca',
  assassino: 'velocidade',
  tanker: 'resistencia',
  ranger: 'sentidos',
  'ranger fisico': 'forca',
  'ranger magico': 'poder_magico',
  curador: 'inteligencia',
  'mago elemental': 'poder_magico',
  'mago invocador': 'poder_magico',
  'mago de barreira': 'poder_magico',
  'mago barreira': 'poder_magico',
  'mago de maldicao': 'poder_magico',
  'mago maldicao': 'poder_magico',
};

function normalize(value: unknown) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

export function classAttributeBonus(player: any, attribute: string) {
  if (CLASS_BONUSES[normalize(player?.classe)] !== attribute) return 0;
  return Math.floor(Number(player?.[`${attribute}_base`] || 0) * 0.5);
}
