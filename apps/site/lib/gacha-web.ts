import 'server-only';
import database from './rpg';
import type { BannerDetail, BannerList, BannerPreview, BannerReward } from './gacha-types';

type BannerRow = {
  id: number | string; nome: string; descricao: string; ativo: number;
  permanente: number; inicio_em: string | null; fim_em: string | null;
  atualizado_em: string | null; tem_imagem?: number; imagem?: string | null;
};
const TTL = 30_000;
type CacheEntry<T> = { expires: number; promise: Promise<T> };
const metadataCache = new Map<string, CacheEntry<BannerRow[]>>();
const detailCache = new Map<number, CacheEntry<{ banner: BannerRow; pool: BannerReward[] }>>();

async function cached<K, T>(cache: Map<K, CacheEntry<T>>, key: K, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.promise;
  if (cache.size >= 32) cache.delete(cache.keys().next().value as K);
  const entry: CacheEntry<T> = { expires: Date.now() + TTL, promise: Promise.resolve().then(loader) };
  cache.set(key, entry);
  try { return await entry.promise; }
  catch (error) { if (cache.get(key) === entry) cache.delete(key); throw error; }
}

export class GachaReadError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

function preview(row: BannerRow): BannerPreview | null {
  if (Number(row.ativo) !== 1) return null;
  const now = Date.now();
  const permanent = Number(row.permanente) === 1;
  const start = row.inicio_em ? new Date(row.inicio_em).getTime() : NaN;
  const end = row.fim_em ? new Date(row.fim_em).getTime() : NaN;
  if (!permanent && (!Number.isFinite(start) || !Number.isFinite(end) || end <= now)) return null;
  return {
    id: Number(row.id), nome: row.nome, descricao: row.descricao,
    imagem: Number(row.tem_imagem) || row.imagem ? `/api/gacha/banners/${row.id}/image?v=${encodeURIComponent(String(row.atualizado_em || '1'))}` : null,
    status: permanent ? 'permanent' : start > now ? 'upcoming' : end - now <= 86_400_000 ? 'ending' : 'active',
    inicioEm: row.inicio_em, fimEm: row.fim_em, permanente: permanent,
  };
}

export async function getGachaList(): Promise<BannerList> {
  // No pool, history, player data, reward validation, or embedded image payload.
  const rows: BannerRow[] = await cached(metadataCache, 'banners', () => database.all(`SELECT id,nome,
    SUBSTR(descricao,1,180) AS descricao,ativo,permanente,inicio_em,fim_em,atualizado_em,
    CASE WHEN imagem IS NOT NULL AND imagem<>'' THEN 1 ELSE 0 END AS tem_imagem
    FROM gacha_banners WHERE ativo=1 ORDER BY id`));
  return { banners: rows.map(preview).filter((row): row is BannerPreview => row !== null) };
}

export async function getGachaState(playerId: number, bannerId: number): Promise<BannerDetail> {
  if (!Number.isSafeInteger(bannerId) || bannerId <= 0) throw new GachaReadError('Banner inválido.');
  const info = await cached(detailCache, bannerId, async () => {
    // Load the existing service only when the player opens this specific banner.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const banners = require('../../bot/src/systems/gachaBannerService');
    const validation = await banners.validarBanner(bannerId);
    if (!validation.banner) throw new GachaReadError('Banner não encontrado.', 404);
    if (!validation.valido) throw new GachaReadError('Este banner está em manutenção. Escolha outro.', 409);
    const raw = validation.pool.filter((item: { ativo: number }) => Number(item.ativo) === 1);
    const total = raw.reduce((sum: number, item: { peso: number }) => sum + Number(item.peso), 0);
    const pool: BannerReward[] = await Promise.all(raw.map(async (item: BannerReward & { referencia_id: string | null }) => {
      const resolved = await banners.validarReferencia(item.reward_type, item.referencia_id);
      return { id: Number(item.id), nome: resolved?.entidade?.nome || item.reward_type,
        reward_type: item.reward_type, quantidade: Number(item.quantidade), peso: Number(item.peso),
        chance: total ? Number(item.peso) / total * 100 : 0, estrelas: Number(item.estrelas || 3),
        raridade: item.raridade, destaque_ordem: item.destaque_ordem == null ? null : Number(item.destaque_ordem),
        grande_premio: Number(item.grande_premio), garantido_conjunto: Number(item.garantido_conjunto) };
    }));
    return { banner: validation.banner as BannerRow, pool };
  });
  const selected = preview(info.banner);
  if (!selected || selected.status === 'upcoming') throw new GachaReadError('Este banner não está disponível agora.', 410);
  // Player-specific information is never shared in the public process cache.
  const [wallet, pity, history] = await Promise.all([
    database.get('SELECT cristais,fragmentos_invocacao,rank FROM jogadores WHERE id=?', [playerId]),
    database.consultarPityGacha(playerId, bannerId),
    database.getHistoricoBanner(playerId, bannerId, { limite: 20 }),
  ]);
  if (!wallet) throw new GachaReadError('Personagem não encontrado.', 404);
  return { selected, pool: info.pool, guaranteeSet: info.pool.some(item => item.garantido_conjunto === 1),
    wallet: { cristais: Number(wallet.cristais), fragmentos_invocacao: Number(wallet.fragmentos_invocacao), rank: wallet.rank },
    pity: Number(pity), history };
}

export async function pullGacha(playerId: number, bannerId: number, count: number) {
  // The real engine remains the only authority for RNG, eligibility and payment.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const engine = require('../../bot/src/systems/gachaEngine');
  return engine.realizarGiros(playerId, bannerId, count);
}
