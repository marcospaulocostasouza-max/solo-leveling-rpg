import {NextResponse} from 'next/server';
import {currentPlayerId} from '@/lib/session';
const {getService}=require('../../../../../packages/database/redeem');
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 try{
  const id=await currentPlayerId();
  if(!id)return NextResponse.json({success:false,error:'UNAUTHORIZED',message:'Entre novamente pelo link enviado no !site.'},{status:401});
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({success:false,error:'FORBIDDEN',message:'Solicitação inválida.'},{status:403});
  const body=await request.json().catch(()=>null);
  if(!body||typeof body.code!=='string'||body.code.length>128||Object.keys(body).some(k=>k!=='code'))return NextResponse.json({success:false,error:'INVALID_REQUEST',message:'Envie apenas o código.'},{status:400});
  return NextResponse.json(await getService().claim(Number(id),body.code),{headers:{'Cache-Control':'private, no-store'}});
 }catch(error){
  const e=error as Error&{code?:string};
  const known=['INVALID_CODE','EXPIRED','NOT_STARTED','ALREADY_CLAIMED','LIMIT_REACHED','PLAYER_NOT_FOUND'];
  if(!known.includes(e.code||''))console.error('[REDEEM] Falha de resgate:',e.code||'INTERNAL_ERROR', e.stack || e.message);
  return NextResponse.json({success:false,error:known.includes(e.code||'')?e.code:'INTERNAL_ERROR',message:known.includes(e.code||'')?e.message:'Não foi possível entregar as recompensas. Nenhum resgate foi concluído; tente novamente.'},{status:known.includes(e.code||'')?400:500});
 }
}
