import { NextResponse } from 'next/server';
import { currentPlayerId } from '@/lib/session';
import { getGachaState, pullGacha } from '@/lib/gacha-web';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request){
  try{const playerId=await currentPlayerId();if(!playerId)return NextResponse.json({error:'unauthorized'},{status:401});const id=Number(new URL(request.url).searchParams.get('bannerId')||0)||undefined;return NextResponse.json(await getGachaState(playerId,id));}
  catch(error){console.error('[SITE GACHA GET]',error);return NextResponse.json({error:'Não foi possível carregar o Gacha.'},{status:500});}
}

export async function POST(request:Request){
  try{const playerId=await currentPlayerId();if(!playerId)return NextResponse.json({error:'unauthorized'},{status:401});const body=await request.json().catch(()=>({}));const bannerId=Number(body.bannerId);const count=Number(body.count);if(!Number.isSafeInteger(bannerId)||bannerId<=0||![1,10].includes(count))return NextResponse.json({error:'Solicitação de giro inválida.'},{status:400});return NextResponse.json(await pullGacha(playerId,bannerId,count));}
  catch(error){const message=error instanceof Error?error.message:'Não foi possível realizar o giro.';return NextResponse.json({error:message},{status:400});}
}
