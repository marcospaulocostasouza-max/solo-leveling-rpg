type RewardLabelInput = { nome?: string; tipo?: string; reward_type?: string; quantidade?: number | string | null };
const units: Record<string, string> = {
  XP: 'XP', MAESTRIA: 'de maestria', WON: 'won', CRISTAIS: 'cristais',
  TOKEN: 'tokens', FRAGMENTOS: 'fragmentos',
};

export function gachaRewardLabel(reward: RewardLabelInput): string {
  const type = String(reward.tipo || reward.reward_type || reward.nome || '').trim().toUpperCase();
  const quantity = Number(reward.quantidade);
  const name = reward.nome || type || 'Recompensa';
  if (reward.quantidade == null || !Number.isFinite(quantity)) return `${name} (quantidade não informada)`;
  const formatted = quantity.toLocaleString('pt-BR');
  return units[type] ? `+${formatted} ${units[type]}` : `${name} ×${formatted}`;
}
