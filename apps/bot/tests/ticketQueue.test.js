const {test}=require('node:test');const assert=require('node:assert/strict');
const {createService}=require('../src/systems/ticketQueueService');
const {select}=require('../src/systems/ticketSelector');
const sqlite3=require('sqlite3');
async function fixture(t){
 const sqlite=new sqlite3.Database(':memory:');t.after(()=>new Promise(r=>sqlite.close(r)));let tail=Promise.resolve();
 const db={run:(sql,args=[])=>new Promise((r,j)=>sqlite.run(sql,args,function(e){e?j(e):r({changes:this.changes,lastID:this.lastID});})),get:(sql,args=[])=>new Promise((r,j)=>sqlite.get(sql,args,(e,row)=>e?j(e):r(row))),all:(sql,args=[])=>new Promise((r,j)=>sqlite.all(sql,args,(e,rows)=>e?j(e):r(rows)))};
 db.transaction=work=>{const task=tail.then(async()=>{await db.run('BEGIN');try{const result=await work(db);await db.run('COMMIT');return result;}catch(e){await db.run('ROLLBACK');throw e;}});tail=task.catch(()=>{});return task;};
 for(const sql of ['CREATE TABLE jogadores(id INTEGER PRIMARY KEY,nome TEXT)','CREATE TABLE tickets_unicos(id INTEGER PRIMARY KEY,jogador_id INTEGER,tipo TEXT,nome TEXT,status TEXT,data_uso TEXT)','CREATE TABLE fila_avaliacao(id INTEGER PRIMARY KEY,jogador_id INTEGER,ticket_id INTEGER,tipo TEXT,posicao INTEGER,status TEXT,data_entrada TEXT,data_conclusao TEXT)'])await db.run(sql);
 for(let id=1;id<=4;id++){await db.run('INSERT INTO jogadores VALUES(?,?)',[id,`Player ${id}`]);await db.run("INSERT INTO tickets_unicos VALUES(?,?,'item_unico','Ticket de Item Único','disponivel',NULL)",[id,id]);}
 return {db,service:createService(db,'sqlite')};
}
test('fila numérica, confirmação concorrente única e conclusão atualiza posição',async t=>{
 const {db,service}=await fixture(t);
 const attempts=await Promise.all([service.use(1,1),service.use(1,1)]);assert.equal(attempts.filter(r=>r.sucesso).length,1);
 for(let id=2;id<=4;id++)assert.equal((await service.use(id,id)).posicao,id);
 await db.run('UPDATE fila_avaliacao SET posicao=31 WHERE jogador_id=4');
 assert.equal((await service.position(4)).posicao,4);
 await service.repair();assert.equal((await db.get('SELECT posicao FROM fila_avaliacao WHERE jogador_id=4')).posicao,4);
 await service.advance(1);assert.equal((await service.position(4)).posicao,3);
 assert.equal((await db.get('SELECT status FROM tickets_unicos WHERE id=1')).status,'concluido');
});
test('falha na entrada reverte consumo do ticket',async t=>{
 const {db,service}=await fixture(t);await db.run("CREATE TRIGGER falhar BEFORE INSERT ON fila_avaliacao BEGIN SELECT RAISE(ABORT,'falha'); END");
 await assert.rejects(service.use(1,1));assert.equal((await db.get('SELECT status FROM tickets_unicos WHERE id=1')).status,'disponivel');
});
test('seleção aceita nome completo, tipo acentuado e ID sem escolher outro destino',()=>{
 const tickets=[{id:'8',tipo:'tecnica_unica',nome:'Ticket de Técnica Única'}];
 for(const input of ['Ticket de Técnica Única','técnica','8','Ágata'])assert.equal(select(tickets,input,'Ágata').id,'8');
 assert.equal(select(tickets,'Outra pessoa','Ágata'),null);
 assert.throws(()=>select([...tickets,{id:9,tipo:'item_unico',nome:'Ticket de Item Único'}],'Ágata','Ágata'),/mais de um/);
});
