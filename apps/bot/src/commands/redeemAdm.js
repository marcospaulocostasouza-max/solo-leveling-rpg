const Admin=require('../core/adminCore'),MessageService=require('../core/messageService');
module.exports=async function(msg){
 const actor=msg.author||msg.from;let text;
 try{
  if(!await Admin.isAdmin(actor))throw new Error('Apenas ADM pode gerenciar códigos.');
  const body=String(msg.body||'').trim();const service=require('../../../../packages/database/redeem').getService();
  if(/^!criar c[oó]digo$/i.test(body))text=await require('../systems/redeemWizardService').start(actor,msg.from);
  else{
   const [,operation,arg]=body.match(/^!codigo\s+(listar|info|ativar|desativar)\s*(.*)$/i)||[];
   if(operation==='listar'){const page=Number(arg)||1;if(!Number.isSafeInteger(page)||page<1)throw new Error('Página inválida.');const rows=await service.list(page);text=`*Códigos — página ${page}*\n`+rows.map(r=>{const now=Date.now();const status=!Number(r.active)?'desativado':r.expires_at&&now>=Date.parse(r.expires_at)?'expirado':now<Date.parse(r.starts_at)?'futuro':'ativo';return `• ${r.code}: ${status}, usos ${r.current_uses}/${r.max_global_uses||'ilimitado'}`;}).join('\n');}
   else if(operation==='info'){const r=await service.info(arg);if(!r)throw new Error('Código inválido.');const rewards=[];for(const item of JSON.parse(r.rewards_json)){const resolved=await require('../systems/gachaEngine').resolverRecompensa(item);rewards.push(`${item.quantidade} × ${resolved.nome}`);}text=`*${r.code}*\n${r.description}\nAtivo: ${Number(r.active)?'Sim':'Não'}\nCriado em: ${r.created_at}\nInício: ${r.starts_at}\nExpira: ${r.expires_at||'Nunca'}\nUsos: ${r.current_uses}/${r.max_global_uses||'ilimitado'}\n${rewards.join('\n')}`;}
   else if(['ativar','desativar'].includes(operation)){await service.setActive(arg,operation==='ativar',actor);text=`Código ${arg.trim().toUpperCase()} ${operation==='ativar'?'ativado':'desativado'}.`;}
   else text='Use !criar codigo, !codigo listar [página], !codigo info CÓDIGO, !codigo ativar CÓDIGO ou !codigo desativar CÓDIGO.';
  }
 }catch(error){text=error.message;}
 return MessageService.send({message:msg,text});
};
