import { NextResponse } from "next/server";
import { currentPlayerId } from "@/lib/session";
import database from "@/lib/rpg";
import path from "node:path";

export const runtime="nodejs";
// CommonJS is the established module format of Cardinal.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const presentation=require("../../../../../../cardinal/presentation");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {CardinalAssistant}=require("../../../../../../cardinal/core/assistant");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {ContextManager}=require("../../../../../../cardinal/memory");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {WorldDirector}=require("../../../../../../cardinal/world");
const sessions=new presentation.SessionStore();
const memory=new ContextManager({root:path.resolve(process.cwd(),"../..")});
const world=new WorldDirector({root:path.resolve(process.cwd(),"../.."),database});

async function actor(){const id=await currentPlayerId();if(!id||!(await database.isAdmin(id)))return null;const row=await database.get("SELECT numero FROM jogadores WHERE id = ?",[id]);return row?.numero||String(id);}
async function modelStatus(){try{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),800);const response=await fetch("http://127.0.0.1:8088/health",{signal:controller.signal,cache:"no-store"});clearTimeout(timer);return response.ok?"ONLINE":"DEGRADED";}catch{return"OFFLINE";}}
export async function GET(request:Request){const who=await actor();if(!who)return NextResponse.json({error:"Acesso negado."},{status:403});const url=new URL(request.url),query=url.searchParams.get("q")||"",qwen=await modelStatus(),[memoryHealth,conversations,memories,worldState]=await Promise.all([memory.store.health(),memory.store.conversations(who),memory.store.search(who,query,{limit:50}),world.overview()]);const dto=presentation.templates.operationsStatus({services:{cardinal:"ONLINE",qwen,knowledge:"ONLINE",memory:memoryHealth.status,world:"ONLINE",database:"ONLINE",bot:"DEGRADED",site:"ONLINE"},checked_at:new Date().toISOString()});return NextResponse.json({session:sessions.get(who),view:presentation.renderers.web.render(dto),memory:{conversations,memories},world:worldState});}
export async function POST(request:Request){const who=await actor();if(!who)return NextResponse.json({view:presentation.renderers.web.render(presentation.templates.denied())},{status:403});try{const body=await request.json();if(body.action==="new_conversation"){const conversation_id=await memory.store.createConversation(who,body.title);const session=await memory.store.createSession(who,{conversation_id});return NextResponse.json({conversation_id,session_id:session.session_id});}if(body.action==="archive") {await memory.store.archiveConversation(who,String(body.conversation_id));return NextResponse.json({ok:true});}if(body.action==="forget") {await memory.store.forget(who,String(body.memory_id));return NextResponse.json({ok:true});}if(body.action==="pin") {const item=await memory.store.pin(who,String(body.memory_id),body.pinned!==false);return NextResponse.json({item});}if(body.action!=="chat"||typeof body.message!=="string"||!body.message.trim())return NextResponse.json({error:"Solicitação inválida."},{status:400});const uiSession=sessions.add(who,{role:"user",text:body.message.trim()}),active=await memory.session(who,{session_id:body.session_id,conversation_id:body.conversation_id,channel_id:"web"}),assistant=new CardinalAssistant({memory}),result=await assistant.ask(body.message.trim(),{actor:who,session_id:active.session_id,conversation_id:active.conversation_id,channel_id:"web"}),answer=result?.text||String(result);sessions.add(who,{role:"assistant",text:answer});const dto=presentation.templates.knowledgeResult({question:body.message.trim(),answer,debug:false});return NextResponse.json({session_id:uiSession.session_id,memory_session_id:active.session_id,conversation_id:active.conversation_id,view:presentation.renderers.web.render(dto)});}catch(error){const code=(error as {code?:string}).code==="CARDINAL_MODEL_OFFLINE"?"CARDINAL_MODEL_OFFLINE":"CARDINAL_REQUEST_FAILED";return NextResponse.json({view:presentation.renderers.web.render(presentation.templates.error({summary:code==="CARDINAL_MODEL_OFFLINE"?"O núcleo de IA está offline.":"Não foi possível concluir a solicitação.",meta:{code}}))},{status:503});}}
