import { currentPlayerId } from '@/lib/session';
import database from '@/lib/rpg';

export const runtime = 'nodejs';
const cache = new Map<string, { expires: number; bytes: Uint8Array }>();
export async function GET(request: Request, context: { params: Promise<{ bannerId: string }> }) {
  if (!await currentPlayerId()) return new Response(null, { status: 401 });
  const id = Number((await context.params).bannerId);
  if (!Number.isSafeInteger(id) || id <= 0) return new Response(null, { status: 400 });
  const params = new URL(request.url).searchParams;
  const width = params.get('width') === '1440' ? 1440 : 640;
  const key = `${id}:${width}:${params.get('v') || ''}`;
  const headers = { 'Content-Type': 'image/webp', 'Cache-Control': 'private, max-age=30', Vary: 'Cookie' };
  const hit = cache.get(key);
  if (!params.has('original') && hit && hit.expires > Date.now()) return new Response(new Uint8Array(hit.bytes), { headers });
  try {
    const row = await database.get('SELECT imagem FROM gacha_banners WHERE id=? AND ativo=1', [id]);
    if (!row?.imagem) return new Response(null, { status: 404 });
    const source = String(row.imagem);
    if (/^https?:\/\//i.test(source) || /^\/(?!\/)/.test(source)) {
      return new Response(null, { status: 302, headers: { Location: new URL(source, request.url).href, 'Cache-Control': 'private, no-store' } });
    }
    const match = source.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif|avif));base64,([\s\S]+)$/i);
    if (!match) return new Response(null, { status: 404 });
    const original = Buffer.from(match[2], 'base64');
    const originalResponse = () => new Response(new Uint8Array(original), {
      headers: { ...headers, 'Content-Type': match[1].toLowerCase().replace('image/jpg','image/jpeg') }
    });
    if (params.has('original')) return originalResponse();
    let bytes: Uint8Array;
    try {
      const { default: sharp } = await import('sharp');
      bytes = new Uint8Array(await sharp(original, { limitInputPixels: 40_000_000 })
        .rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 76 }).toBuffer());
    } catch (error) {
      console.error('[GACHA IMAGE] Using original attachment:', error instanceof Error ? error.message : 'Resize failed');
      return originalResponse();
    }
    if (cache.size >= 24) cache.delete(cache.keys().next().value!);
    cache.set(key, { expires: Date.now() + 30_000, bytes });
    return new Response(new Uint8Array(bytes), { headers });
  } catch (error) {
    console.error('[GACHA IMAGE]', error instanceof Error ? error.message : 'Image processing failed');
    return new Response(null, { status: 404 });
  }
}
