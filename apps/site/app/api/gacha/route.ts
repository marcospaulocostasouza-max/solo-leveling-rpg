import { NextResponse } from 'next/server';
import { currentPlayerId } from '@/lib/session';
import { getGachaList, getGachaState, GachaReadError, pullGacha } from '@/lib/gacha-web';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request){
  try {
    const playerId = await currentPlayerId();
    if (!playerId) return NextResponse.json({ error: 'Entre novamente pelo link enviado no !site.' }, { status: 401 });
    const id = new URL(request.url).searchParams.get('bannerId');
    const data = id === null ? await getGachaList() : await getGachaState(Number(playerId), Number(id));
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch(error) {
    console.error('[SITE GACHA GET]', error);
    return NextResponse.json({ error: error instanceof GachaReadError ? error.message : 'Não foi possível carregar o Gacha.' }, { status: error instanceof GachaReadError ? error.status : 500 });
  }
}

export async function POST(request:Request){
  try{const playerId=await currentPlayerId();if(!playerId)return NextResponse.json({error:'unauthorized'},{status:401});const body=await request.json().catch(()=>({}));const bannerId=Number(body.bannerId);const count=Number(body.count);if(!Number.isSafeInteger(bannerId)||bannerId<=0||![1,10].includes(count))return NextResponse.json({error:'Solicitação de giro inválida.'},{status:400});return NextResponse.json(await pullGacha(playerId,bannerId,count));}
  catch(error){const message=error instanceof Error?error.message:'Não foi possível realizar o giro.';return NextResponse.json({error:message},{status:400});}
}
