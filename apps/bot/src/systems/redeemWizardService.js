'use strict';
const db=require('../../../../packages/database');
const Redeem=require('../../../../packages/database/redeem').getService;
const Admin=require('../core/adminCore');
const MessageService=require('../core/messageService');
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const scalar=['CRISTAIS','WON','XP','MAESTRIA'];
const catalog=['ITEM','CAIXA','TITULO','PASSIVA','TECNICA','CHAVE','MATERIAL','NUCLEO'];
const label={CRISTAIS:'Cristais',WON:'Won',XP:'XP',MAESTRIA:'Maestria',ITEM:'itens',CAIXA:'caixas',TITULO:'títulos',PASSIVA:'passivas',TECNICA:'técnicas',CHAVE:'chaves de dungeon',MATERIAL:'materiais',NUCLEO:'núcleos de monstro'};
function parseDate(text,end=false){
 const match=String(text).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}))?$/);
 if(!match)throw new Error('Use DD/MM/AAAA ou DD/MM/AAAA HH:mm (horário de Brasília).');
 const [,day,month,year,hour,minute]=match;
 const date=new Date(`${year}-${month}-${day}T${hour||(end?'23':'00')}:${minute||(end?'59':'00')}:${end&&!hour?'59':'00'}-03:00`);
 const local=new Date(date.getTime()-3*3600000);
 if(!Number.isFinite(date.getTime())||local.getUTCDate()!==Number(day)||local.getUTCMonth()+1!==Number(month)||Number(hour||0)>23||Number(minute||0)>59)throw new Error('Data inválida.');
 return date.toISOString();
}
function question(s){
 if(s.step==='code')return 'Qual será o *código*? Use de 3 a 64 letras, números, hífen ou underline.';
 if(s.step==='description')return 'Qual é a *descrição* do código?';
 if(s.step==='start')return 'Quando começa? Responda *agora* ou DD/MM/AAAA HH:mm.';
 if(s.step==='expiry')return 'O código terá *tempo indeterminado* ou *tempo limite*?\nResponda uma dessas opções. Também pode informar diretamente a data limite em DD/MM/AAAA HH:mm.';
 if(s.step==='expiryDate')return 'Qual é a *data limite* de uso? Envie DD/MM/AAAA HH:mm (Brasília). Sem horário, valerá até o fim desse dia.';
 if(s.step==='limit')return 'Qual é o limite global de resgates? Responda *ilimitado* ou um número. Cada jogador resgata uma única vez.';
 if(s.step==='scalar')return `Quantos *${label[scalar[s.index]]}* entrega? Responda *0* se não houver.`;
 if(s.step==='catalog')return `Terá *${label[catalog[s.index]]}*? Responda *sim* ou *não*.`;
 if(s.step==='name')return `Qual o *nome exato* de ${label[catalog[s.index]]}? Precisa existir no catálogo.`;
 if(s.step==='choice')return 'Mais de um resultado. Responda com o *ID*:\n'+s.candidates.map(c=>`• ${c.id}: ${c.nome} — ${c.tier||c.rank||'sem rank'}`).join('\n');
 if(s.step==='amount')return `*${s.selected.nome}* — ${s.selected.tier||s.selected.rank||'sem rank'}. Qual a quantidade?${['TITULO','TECNICA'].includes(catalog[s.index])?' Use 1.':''}`;
 if(s.step==='add')return `Adicionar *${s.amount} × ${s.selected.nome}*? Responda *sim* ou *não*.${catalog[s.index]==='TITULO'?'\nO título substituirá o título atual da ficha.':''}`;
 return preview(s)+'\n\n*Deseja criar e ativar este código?* Responda *sim* ou *não*. Use *!cancelar codigo* para cancelar.';
}
function preview(s){return `*CÓDIGO: ${s.code}*\n${s.description}\nInício: ${s.starts_at}\nExpira: ${s.expires_at||'Nunca'}\nLimite global: ${s.max_global_uses||'Ilimitado'}\nUma vez por jogador.\n\n*Recompensas:*\n${s.rewards.map(r=>`• ${r.quantidade} × ${r.nome||r.reward_type}`).join('\n')}`;}
async function save(actor,chat,s){await db.run('INSERT INTO redeem_creation_sessions(actor,chat,state_json) VALUES(?,?,?) ON CONFLICT(actor) DO UPDATE SET chat=excluded.chat,state_json=excluded.state_json,updated_at=CURRENT_TIMESTAMP',[actor,chat,JSON.stringify(s)]);}
async function start(actor,chat){if(!await Admin.isAdmin(actor))throw new Error('Apenas ADM pode criar códigos.');if(await require('./creationWizardService').get(actor))throw new Error('Finalize a criação de banner/dungeon ou use !cancelar criação antes.');await Redeem().ensure();const existing=await db.get('SELECT actor FROM redeem_creation_sessions WHERE actor=?',[actor]);if(existing)throw new Error('Você já tem uma criação aberta. Termine ou use !cancelar codigo.');const s={step:'code',rewards:[],index:0};await save(actor,chat,s);return question(s);}
async function find(type,name){
 const rows=type==='TECNICA'?await db.all("SELECT * FROM tecnicas WHERE COALESCE(categoria,'') <> 'Legada'"):
  ['TITULO','PASSIVA'].includes(type)?await db.all('SELECT i.* FROM banner_rare_items b JOIN itens i ON i.id=b.item_id WHERE b.tipo=?',[type]):await db.all('SELECT id,nome,tier,categoria FROM itens');
 const categories={CAIXA:/caixa/,CHAVE:/chave.*dungeon/,MATERIAL:/material|minerio|madeira|metal/,NUCLEO:/nucleo/};
 return rows.filter(r=>normalize(r.nome)===normalize(name)&&(!categories[type]||categories[type].test(normalize(`${r.nome} ${r.categoria||''}`)))).slice(0,20);
}
async function answer(s,text){
 const value=normalize(text);const yes=['sim','s'].includes(value),no=['nao','n'].includes(value);
 if(s.step==='code'){if(!/^[A-Z0-9_-]{3,64}$/.test(String(text).trim().toUpperCase()))throw new Error('Código inválido.');s.code=String(text).trim().toUpperCase();if(await Redeem().info(s.code))throw new Error('Esse código já existe.');s.step='description';}
 else if(s.step==='description'){if(!text.trim()||text.length>1000)throw new Error('Descrição deve ter de 1 a 1000 caracteres.');s.description=text.trim();s.step='start';}
 else if(s.step==='start'){s.starts_at=value==='agora'?new Date().toISOString():parseDate(text);s.step='expiry';}
 else if(s.step==='expiry'){
  if(['tempo limite','limite','por tempo limite','determinado'].includes(value))s.step='expiryDate';
  else{
   s.expires_at=['nunca','tempo indeterminado','indeterminado','por tempo indeterminado','para sempre','pra sempre'].includes(value)?null:parseDate(text,true);
   if(s.expires_at&&s.expires_at<=s.starts_at)throw new Error('A expiração deve ser posterior ao início.');
   s.step='limit';
  }
 }
 else if(s.step==='expiryDate'){s.expires_at=parseDate(text,true);if(s.expires_at<=s.starts_at)throw new Error('A expiração deve ser posterior ao início.');s.step='limit';}
 else if(s.step==='limit'){const n=value==='ilimitado'?null:Number(text);if(n!==null&&(!Number.isSafeInteger(n)||n<=0))throw new Error('Limite inválido.');s.max_global_uses=n;s.step='scalar';s.index=0;}
 else if(s.step==='scalar'){const n=Number(text);if(!Number.isSafeInteger(n)||n<0||n>1000000000)throw new Error('Quantidade inválida.');if(n)s.rewards.push({reward_type:scalar[s.index],quantidade:n,nome:label[scalar[s.index]]});if(++s.index===scalar.length){s.step='catalog';s.index=0;}}
 else if(s.step==='catalog'){if(!yes&&!no)throw new Error('Responda sim ou não.');if(yes)s.step='name';else if(++s.index===catalog.length){if(!s.rewards.length){s.index=0;throw new Error('Adicione ao menos uma recompensa.');}s.step='confirm';}}
 else if(s.step==='name'){const rows=await find(catalog[s.index],text);if(!rows.length)throw new Error('Nome não encontrado no catálogo. Confira o nome ou crie o item antes.');s.candidates=rows;if(rows.length===1){s.selected=rows[0];s.step='amount';}else s.step='choice';}
 else if(s.step==='choice'){const row=s.candidates.find(r=>Number(r.id)===Number(text));if(!row)throw new Error('Escolha um ID da lista.');s.selected=row;s.step='amount';}
 else if(s.step==='amount'){const n=Number(text);if(!Number.isSafeInteger(n)||n<=0||n>1000||(['TITULO','TECNICA'].includes(catalog[s.index])&&n!==1))throw new Error('Quantidade inválida (máximo 1000; título/técnica: 1).');s.amount=n;s.step='add';}
 else if(s.step==='add'){if(!yes&&!no)throw new Error('Responda sim ou não.');if(yes){if(s.rewards.length>=30)throw new Error('Máximo de 30 recompensas.');const type=catalog[s.index];s.rewards.push({reward_type:['CHAVE','NUCLEO'].includes(type)?'ITEM':type,referencia_id:String(s.selected.id),quantidade:s.amount,nome:s.selected.nome});}s.step='catalog';delete s.selected;delete s.candidates;}
 else if(s.step==='confirm'){if(!yes&&!no)throw new Error('Responda sim ou não.');return yes?'create':'cancel';}
 return 'continue';
}
async function consumeMessage(msg){
 const actor=msg.author||msg.from,body=String(msg.body||'').trim();
 await Redeem().ensure();const row=await db.get('SELECT * FROM redeem_creation_sessions WHERE actor=? AND chat=?',[actor,msg.from]);if(!row)return false;
 if(body.startsWith('!')&&!/^!cancelar codigo$/i.test(body)){
  if(/^!criar (?:banner|codigo|código|dungeon)/i.test(body)){await MessageService.send({message:msg,text:'Finalize a criação do código ou use !cancelar codigo antes de iniciar outra criação.'});return true;}
  return false;
 }
 let response;
 if(!await Admin.isAdmin(actor)){await db.run('DELETE FROM redeem_creation_sessions WHERE actor=?',[actor]);response='Sua permissão de ADM não está ativa. Criação encerrada.';}
 else if(/^!cancelar codigo$/i.test(body)){await db.run('DELETE FROM redeem_creation_sessions WHERE actor=?',[actor]);response='Criação de código cancelada.';}
 else{
  const s=JSON.parse(row.state_json);const original=JSON.stringify(s);
  try{const result=await answer(s,body);if(result==='create'){await Redeem().create(actor,{...s,rewards:s.rewards});await db.run('DELETE FROM redeem_creation_sessions WHERE actor=?',[actor]);response=`Código *${s.code}* criado e ativo. Resgate pelo site em */resgatar-codigo*.`;}else if(result==='cancel'){await db.run('DELETE FROM redeem_creation_sessions WHERE actor=?',[actor]);response='Criação cancelada.';}else{await save(actor,msg.from,s);response=question(s);}}
  catch(error){const old=JSON.parse(original);response=`${error.message}\n\n${question(old)}`;}
 }
 await MessageService.send({message:msg,text:response});return true;
}
module.exports={start,consumeMessage,answer,parseDate,question,preview,find};
