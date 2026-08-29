import { NextResponse } from 'next/server';
import { currentPlayerId } from '@/lib/session';
import { createGuild, joinGuild, leaveGuild, listGuildState } from '@/lib/guilds';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(){
  try{const playerId=await currentPlayerId();if(!playerId)return NextResponse.json({error:'unauthorized'},{status:401});return NextResponse.json(await listGuildState(playerId));}
  catch(error){console.error('[SITE GUILDS GET]',error);return NextResponse.json({error:'Não foi possível carregar as Guildas.'},{status:500});}
}

export async function POST(request:Request){
  try{
    const playerId=await currentPlayerId();if(!playerId)return NextResponse.json({error:'unauthorized'},{status:401});
    const body=await request.json().catch(()=>({}));
    if(body.action==='create'){const guild=await createGuild(playerId,body.name);return NextResponse.json({ok:true,message:`Guilda ${guild.nome} criada com sucesso.`,guild});}
    if(body.action==='join'){const guild=await joinGuild(playerId,body.guildId);return NextResponse.json({ok:true,message:`Você entrou em ${guild.nome}.`,guild});}
    if(body.action==='leave'){const guild=await leaveGuild(playerId);return NextResponse.json({ok:true,message:`Você saiu de ${guild.nome}. O cooldown de 7 dias começou.`});}
    return NextResponse.json({error:'Ação de Guilda inválida.'},{status:400});
  }catch(error){const message=error instanceof Error?error.message:'Não foi possível concluir a operação.';const expected=!/database|syntax|relation|column/i.test(message);if(!expected)console.error('[SITE GUILDS POST]',error);return NextResponse.json({error:expected?message:'Não foi possível concluir a operação de Guilda.'},{status:400});}
}
