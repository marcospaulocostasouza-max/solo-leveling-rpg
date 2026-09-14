'use strict';
function createService(database,provider){
 const validQueue=`SELECT f.*, j.nome AS jogador_nome FROM fila_avaliacao f
 JOIN tickets_unicos t ON t.id=f.ticket_id AND t.jogador_id=f.jogador_id
 JOIN jogadores j ON j.id=f.jogador_id
 WHERE f.status='aguardando' AND t.status='em_producao'
 ORDER BY f.data_entrada ASC, f.id ASC`;
 async function lock(q){if(provider==='postgres')await q.get('SELECT pg_advisory_xact_lock(74190321)');}
 async function queue(q=database){return (await q.all(validQueue)).map((row,i)=>({...row,posicao:i+1}));}
 async function renumber(q){const rows=await queue(q);for(const row of rows)await q.run('UPDATE fila_avaliacao SET posicao=? WHERE id=?',[row.posicao,row.id]);return rows;}
 async function use(playerId,ticketId){return database.transaction(async q=>{
  await lock(q);
  const ticket=await q.get('SELECT * FROM tickets_unicos WHERE id=? AND jogador_id=?'+(provider==='postgres'?' FOR UPDATE':''),[ticketId,playerId]);
  if(!ticket)return {erro:'Ticket não encontrado para este jogador.'};
  if(ticket.status!=='disponivel')return {erro:'Este ticket já foi utilizado. Consulte !meus tickets.'};
  const rows=await queue(q);
  if(rows.some(row=>Number(row.jogador_id)===Number(playerId)))return {erro:'Você já possui uma solicitação na fila de avaliação.'};
  const now=new Date().toISOString();
  const update=await q.run("UPDATE tickets_unicos SET status='em_producao',data_uso=? WHERE id=? AND status='disponivel'",[now,ticketId]);
  if(update.changes!==1)throw new Error('O ticket já foi utilizado em outra solicitação.');
  const sql="INSERT INTO fila_avaliacao(jogador_id,ticket_id,tipo,posicao,status,data_entrada) VALUES(?,?,?,?,'aguardando',?)";
  const args=[playerId,ticketId,ticket.tipo,rows.length+1,now];
  const id=provider==='postgres'?(await q.get(sql+' RETURNING id',args)).id:(await q.run(sql,args)).lastID;
  await renumber(q);
  return {sucesso:true,filaId:Number(id),posicao:rows.length+1,tipo:ticket.tipo,nome:ticket.nome};
 });}
 async function advance(id){return database.transaction(async q=>{
  await lock(q);const row=(await queue(q)).find(r=>Number(r.id)===Number(id));
  if(!row)return {erro:'Solicitação pendente não encontrada.'};
  await q.run("UPDATE fila_avaliacao SET status='concluido',data_conclusao=? WHERE id=? AND status='aguardando'",[new Date().toISOString(),id]);
  await q.run("UPDATE tickets_unicos SET status='concluido' WHERE id=? AND jogador_id=?",[row.ticket_id,row.jogador_id]);
  await renumber(q);return {sucesso:true};
 });}
 return {use,advance,queue,position:async id=>(await queue()).find(r=>Number(r.jogador_id)===Number(id))||null,
  repair:()=>database.transaction(async q=>{await lock(q);return renumber(q);})};
}
module.exports={createService};
