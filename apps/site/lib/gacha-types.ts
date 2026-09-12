export type BannerPreview = {
  id: number;
  nome: string;
  descricao: string;
  imagem: string | null;
  status: 'active' | 'ending' | 'permanent' | 'upcoming';
  inicioEm: string | null;
  fimEm: string | null;
  permanente: boolean;
};

export type GachaReward = {
  tipo?: string;
  nome: string;
  quantidade: number;
  raridade?: string | null;
  estrelas?: number;
  rank?: string | null;
  destaque?: number | null;
  grandePremio?: boolean;
  garantidoConjunto?: boolean;
  duplicata?: boolean;
  fragmentosInvocacaoRecebidos?: number;
};

export type GachaPullResult = {
  sucesso: boolean;
  operacaoId: number;
  banner: { id: number; nome: string };
  quantidade: number;
  custo: number;
  saldoAtual: number;
  pityAntes: number;
  pityDepois: number;
  resultados: GachaReward[];
};

export type BannerReward = {
  id: number;
  nome: string;
  reward_type: string;
  quantidade: number;
  peso: number;
  chance: number;
  estrelas: number;
  raridade: string | null;
  destaque_ordem: number | null;
  grande_premio: number;
  garantido_conjunto: number;
};

export type GachaHistoryEntry = {
  id: number;
  reward_type?: string;
  nome: string;
  quantidade: number;
  estrelas: number;
  duplicata: number;
  fragmentos_invocacao_recebidos: number;
};

export type BannerDetail = {
  selected: BannerPreview;
  pool: BannerReward[];
  guaranteeSet: boolean;
  pity: number;
  history: GachaHistoryEntry[];
  wallet: { cristais: number; fragmentos_invocacao: number; rank: string };
};

export type BannerList = { banners: BannerPreview[] };
