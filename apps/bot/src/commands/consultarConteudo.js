const MessageService=require('../core/messageService');
const database=require('../../../../packages/database');
const {normalize,sheet}=require('../systems/contentCreationService');
module.exports=async msg=>{
 let response;
 try{
  const match=String(msg.body).match(/^!consultar\s+(item|t[eé]cnica|passiva|t[ií]tulo)\s+(.+)$/is);
  if(!match)throw new Error('Use !consultar item Nome do Item (ou tecnica, passiva, titulo).');
  const kind={item:'ITEM',tecnica:'TECNICA',passiva:'PASSIVA',titulo:'TITULO'}[normalize(match[1])],name=match[2].trim();
  const table=kind==='TECNICA'?'tecnicas':'itens';
  let rows=/^\d+$/.test(name)?await database.all(`SELECT * FROM ${table} WHERE id=?`,[Number(name)]):
   (await database.all(`SELECT * FROM ${table}`)).filter(row=>normalize(row.nome)===normalize(name));
  if(kind==='PASSIVA'||kind==='TITULO')rows=rows.filter(row=>normalize(row.categoria)===normalize(kind==='PASSIVA'?'Passiva':'Título'));
  if(!rows.length)throw new Error('Conteúdo não encontrado. Informe o nome completo ou o ID.');
  if(rows.length>1)throw new Error('Mais de um resultado. Consulte pelo ID:\n'+rows.map(row=>`${row.id}: ${row.nome} — ${row.tier||row.rank}`).join('\n'));
  const entity=rows[0];await require('../systems/contentCreationWizard').service.ensure();
  const record=await database.get("SELECT * FROM custom_content_receipts WHERE entity_id=? AND "+(kind==='TECNICA'?"kind='TECNICA'":"kind<>'TECNICA'"),[entity.id]);
  if(record){
   const data=JSON.parse(record.sheet_json);Object.assign(data,{nome:entity.nome,descricao:entity.descricao,rank:entity.rank||entity.tier});
   if(record.kind==='ITEM')for(const key of ['forca','resistencia','velocidade','sentidos','inteligencia','poder_magico'])data[key]=Number(entity[key+'_bonus']||0);
   if(record.kind==='TECNICA')for(const key of ['classe','categoria','tipo','custo_mana','cooldown','nivel_desbloqueio'])data[key]=entity[key];
   const player=await database.get('SELECT id,nome FROM jogadores WHERE id=?',[record.player_id]);
   response=sheet(record.kind,data,player);
  }else response=`*═══ FICHA DE ${kind==='TECNICA'?'TÉCNICA':'ITEM'} ═══*\n> *NOME:* ${entity.nome}\n> *RANK:* ${entity.rank||entity.tier||'Não informado'}\n> *CATEGORIA:* ${entity.categoria||'Não informada'}\n> *DESCRIÇÃO:* ${entity.descricao||'Não informada'}\n> *EFEITO:* ${entity.efeito||entity.descricao_completa||'Não informado'}`;
 }catch(error){response=error.message;}
 return MessageService.send({message:msg,text:response});
};
