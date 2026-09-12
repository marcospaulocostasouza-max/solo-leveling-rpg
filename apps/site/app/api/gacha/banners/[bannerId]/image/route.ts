import { currentPlayerId } from '@/lib/session';
import database from '@/lib/rpg';
import sharp from 'sharp';

export const runtime = 'nodejs';
const cache = new Map<string, { expires: number; bytes: Uint8Array }>();
export async function GET(request: Request, context: { params: Promise<{ bannerId: string }> }) {
  if (!await currentPlayerId()) return new Response(null, { status: 401 });
  const id = Number((await context.params).bannerId);
  if (!Number.isSafeInteger(id) || id <= 0) return new Response(null, { status: 400 });
  const width = new URL(request.url).searchParams.get('width') === '1440' ? 1440 : 640;
  const key = `${id}:${width}`;
  const headers = { 'Content-Type': 'image/webp', 'Cache-Control': 'private, max-age=30', Vary: 'Cookie' };
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return new Response(new Uint8Array(hit.bytes), { headers });
  try {
    const row = await database.get('SELECT imagem FROM gacha_banners WHERE id=? AND ativo=1', [id]);
    if (!row?.imagem) return new Response(null, { status: 404 });
    const source = String(row.imagem);
    if (/^https?:\/\//i.test(source) || /^\/(?!\/)/.test(source)) {
      return new Response(null, { status: 302, headers: { Location: new URL(source, request.url).href, 'Cache-Control': 'private, no-store' } });
    }
    const match = source.match(/^data:image\/(?:png|jpeg|jpg|webp|gif);base64,([\s\S]+)$/i);
    if (!match) return new Response(null, { status: 404 });
    const bytes = new Uint8Array(await sharp(Buffer.from(match[1], 'base64'), { limitInputPixels: 40_000_000 })
      .rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 76 }).toBuffer());
    if (cache.size >= 24) cache.delete(cache.keys().next().value!);
    cache.set(key, { expires: Date.now() + 30_000, bytes });
    return new Response(bytes, { headers });
  } catch (error) {
    console.error('[GACHA IMAGE]', error instanceof Error ? error.message : 'Image processing failed');
    return new Response(null, { status: 404 });
  }
}
