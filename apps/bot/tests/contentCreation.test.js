const {test}=require('node:test');const assert=require('node:assert/strict');const sqlite3=require('sqlite3');
const {createService,fields}=require('../src/systems/contentCreationService');
async function fixture(t){
 const sqlite=new sqlite3.Database(':memory:');t.after(()=>new Promise(resolve=>sqlite.close(resolve)));let tail=Promise.resolve();
 const database={run:(sql,args=[])=>new Promise((resolve,reject)=>sqlite.run(sql,args,function(error){error?reject(error):resolve({changes:this.changes,lastID:this.lastID});})),get:(sql,args=[])=>new Promise((resolve,reject)=>sqlite.get(sql,args,(error,row)=>error?reject(error):resolve(row))),all:(sql,args=[])=>new Promise((resolve,reject)=>sqlite.all(sql,args,(error,rows)=>error?reject(error):resolve(rows)))};
 database.transaction=work=>{const task=tail.then(async()=>{await database.run('BEGIN');try{const result=await work(database);await database.run('COMMIT');return result;}catch(error){await database.run('ROLLBACK');throw error;}});tail=task.catch(()=>{});return task;};
 database.ensureEquipmentSetSchema=async()=>{};database.ensurePlayerHistorySchema=async()=>{};
 database.registrarHistoricoFichaComQuery=(q,e)=>q.run('INSERT INTO history VALUES(?,?,?)',[e.jogadorId,e.recurso,e.referencia]);
 for(const sql of ['CREATE TABLE jogadores(id INTEGER PRIMARY KEY,nome TEXT,titulo TEXT,passivas_ativas TEXT)','CREATE TABLE itens(id INTEGER PRIMARY KEY,nome TEXT,categoria TEXT,slot TEXT,tier TEXT,descricao TEXT,efeito TEXT,item_unico INTEGER,arma INTEGER,armadura INTEGER,escudo INTEGER,acessorio INTEGER,consumivel INTEGER,forca_bonus INTEGER,resistencia_bonus INTEGER,velocidade_bonus INTEGER,sentidos_bonus INTEGER,inteligencia_bonus INTEGER,poder_magico_bonus INTEGER,preco INTEGER,valor INTEGER)','CREATE TABLE tecnicas(id INTEGER PRIMARY KEY,nome TEXT,classe TEXT,categoria TEXT,tipo TEXT,descricao TEXT,descricao_completa TEXT,custo_mana TEXT,cooldown INTEGER,nivel_desbloqueio INTEGER,passiva INTEGER,rank TEXT)','CREATE TABLE banner_rare_items(item_id INTEGER,tipo TEXT,criado_por TEXT)','CREATE TABLE inventory(player INTEGER,item INTEGER)','CREATE TABLE skills(player INTEGER,technique INTEGER)','CREATE TABLE history(player INTEGER,name TEXT,reference TEXT)',"INSERT INTO jogadores VALUES(1,'Ágata Teste',NULL,'[]')"])await database.run(sql);
 const engine={resolverRecompensa:async(r,q)=>({...r,entidade:await q.get(`SELECT * FROM ${r.reward_type==='TECNICA'?'tecnicas':'itens'} WHERE id=?`,[r.referencia_id])}),entregar:async(q,p,r)=>{
  if(r.reward_type==='ITEM')await q.run('INSERT INTO inventory VALUES(?,?)',[p.id,r.referencia_id]);
  if(r.reward_type==='TECNICA')await q.run('INSERT INTO skills VALUES(?,?)',[p.id,r.referencia_id]);
  if(r.reward_type==='TITULO')await q.run('UPDATE jogadores SET titulo=? WHERE id=?',[r.entidade.nome,p.id]);
  if(r.reward_type==='PASSIVA')await q.run('UPDATE jogadores SET passivas_ativas=? WHERE id=?',[JSON.stringify([r.entidade.nome]),p.id]);
 }};
 return {database,engine,service:createService(database,'sqlite',()=>engine)};
}
const answers={nome:'Presente único',descricao:'Descrição completa de teste.',rank:'D',categoria:'Acessório',slot:'Acessórios',forca:'10',resistencia:'0',velocidade:'0',sentidos:'0',inteligencia:'0',poder_magico:'0',efeito:'Efeito narrativo.',condicao:'Durante a cena.',preco:'0',tipo:'Ativa',classe:'Geral',custo_mana:'50',cooldown:'2',nivel_desbloqueio:'1'};
async function prepare(service,kind){await service.start('adm','chat',kind);for(const [key] of fields[kind])await service.consume('adm','chat',kind==='TECNICA'&&key==='categoria'?'Suporte':answers[key]);}
test('quatro tipos: somente confirmação cria e entrega para o destino identificado',async t=>{
 const {service,database}=await fixture(t);
 for(const kind of ['ITEM','TECNICA','TITULO','PASSIVA']){
  await prepare(service,kind);await assert.rejects(service.consume('adm','chat','Inexistente'),/não encontrado/);
  const preview=await service.consume('adm','chat','Agata Teste');assert.match(preview,/PERTENCENTE/);
  const before=await database.get('SELECT COUNT(*) AS n FROM custom_content_receipts');
  const result=await service.consume('adm','chat','sim');assert.match(result,/entrega concluídos/);
  assert.equal((await database.get('SELECT COUNT(*) AS n FROM custom_content_receipts')).n,before.n+1);
  assert.equal(await service.consume('adm','chat','sim'),null);
  // Cada criação usa nome distinto dentro da tabela oficial.
  if(kind==='ITEM')await database.run("UPDATE itens SET nome='Presente item' WHERE id=1");
  if(kind==='TITULO')await database.run("UPDATE itens SET nome='Presente titulo' WHERE id=2");
 }
 assert.equal((await database.get('SELECT COUNT(*) AS n FROM inventory')).n,1);
 assert.equal((await database.get('SELECT COUNT(*) AS n FROM skills')).n,1);
 assert.equal((await database.get('SELECT COUNT(*) AS n FROM history')).n,4);
});
test('falha depois da entrega reverte entidade inventário e preserva confirmação',async t=>{
 const {service,database}=await fixture(t);await prepare(service,'ITEM');await service.consume('adm','chat','1');
 await database.run("CREATE TRIGGER falhar BEFORE INSERT ON history BEGIN SELECT RAISE(ABORT,'falha historico'); END");
 await assert.rejects(service.consume('adm','chat','sim'),/falha historico/);
 assert.equal((await database.get('SELECT COUNT(*) AS n FROM itens')).n,0);assert.equal((await database.get('SELECT COUNT(*) AS n FROM inventory')).n,0);
 assert.ok(await service.get('adm','chat'));
});
test('homônimos exigem ID, outra conversa não confirma e não cancela cadastro alheio',async t=>{
 const {service,database}=await fixture(t);await prepare(service,'TECNICA');await database.run("INSERT INTO jogadores(id,nome) VALUES(2,'Ágata Teste')");
 await assert.rejects(service.consume('adm','chat','Ágata Teste'),/ambíguo/);
 await service.consume('adm','chat','2');assert.equal(await service.consume('adm','outrochat','sim'),null);
 const results=await Promise.all([service.consume('adm','chat','sim'),service.consume('adm','chat','sim')]);assert.equal(results.filter(Boolean).length,1);
 assert.equal((await database.get('SELECT player FROM skills')).player,2);
});
