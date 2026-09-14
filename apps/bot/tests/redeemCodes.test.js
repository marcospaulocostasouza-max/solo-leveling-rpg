const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const {createService}=require('../../../packages/database/redeem');
const postgres=process.env.REDEEM_TEST_POSTGRES==='1';
let pool;
if(postgres){require('dotenv').config({path:require('path').resolve(__dirname,'../../../.env'),quiet:true});pool=require('../../../packages/database/postgres').getPool();require('node:test').after(()=>pool.end());}
async function fixture(t){
 const sqlite=postgres?null:new(require('sqlite3').Database)(':memory:');if(sqlite)t.after(()=>new Promise(resolve=>sqlite.close(resolve)));
 const db={run:(sql,args=[])=>new Promise((resolve,reject)=>sqlite.run(sql,args,function(e){e?reject(e):resolve({changes:this.changes,lastID:this.lastID});})),get:(sql,args=[])=>new Promise((resolve,reject)=>sqlite.get(sql,args,(e,r)=>e?reject(e):resolve(r))),all:(sql,args=[])=>new Promise((resolve,reject)=>sqlite.all(sql,args,(e,r)=>e?reject(e):resolve(r))),ensureGachaEngineSchema:async()=>{},ensurePlayerHistorySchema:async()=>{},recalculateAttributes:async()=>{}};
 let tail=Promise.resolve();db.transaction=fn=>{const work=async()=>{await db.run('BEGIN IMMEDIATE');try{const r=await fn(db);await db.run('COMMIT');return r;}catch(e){await db.run('ROLLBACK');throw e;}};const r=tail.then(work);tail=r.catch(()=>{});return r;};
 if(postgres){
  const schema='redeem_test_'+require('crypto').randomBytes(8).toString('hex');
  if(!/^redeem_test_[a-f0-9]{16}$/.test(schema))throw new Error('Schema inválido');
  const admin=await pool.connect();await admin.query(`CREATE SCHEMA ${schema}`);await admin.query(`SET search_path TO ${schema}`);
  t.after(async()=>{try{await admin.query('SET search_path TO public');await admin.query(`DROP SCHEMA ${schema} CASCADE`);}finally{admin.release();}});
  const translate=require('../../../packages/database/postgres-compat').translate;
  const adapter=client=>({run:async(sql,args=[])=>{const r=await client.query(translate(sql.replaceAll('id INTEGER PRIMARY KEY','id BIGSERIAL PRIMARY KEY')),args);return {changes:r.rowCount,lastID:r.rows[0]?.id};},get:async(sql,args=[])=>{const r=await client.query(translate(sql),args);const row=r.rows[0];if(row&&'n'in row)row.n=Number(row.n);return row;},all:async(sql,args=[])=>{const r=await client.query(translate(sql),args);return r.rows;}});
  Object.assign(db,adapter(admin));
  db.transaction=async fn=>{const c=await pool.connect();try{await c.query(`SET search_path TO ${schema}`);await c.query('BEGIN');const r=await fn(adapter(c));await c.query('COMMIT');return r;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}};
 }
 await db.run('CREATE TABLE jogadores(id INTEGER PRIMARY KEY,nome TEXT,won INTEGER DEFAULT 0,maestria INTEGER DEFAULT 0,experiencia INTEGER DEFAULT 0,nivel INTEGER DEFAULT 1,rank TEXT DEFAULT \'E\',titulo TEXT,passivas_ativas TEXT)');
 await db.run('CREATE TABLE administradores(numero TEXT PRIMARY KEY)');await db.run("INSERT INTO administradores VALUES('ADM')");
 await db.run('CREATE TABLE itens(id INTEGER PRIMARY KEY,nome TEXT,categoria TEXT,tier TEXT,slot TEXT,arma INTEGER,armadura INTEGER,escudo INTEGER,acessorio INTEGER,consumivel INTEGER)');
 await db.run('CREATE TABLE inventario_jogador(id INTEGER PRIMARY KEY,jogador_id INTEGER,item_id INTEGER,quantidade INTEGER,equipado INTEGER)');
 await db.run('CREATE TABLE banner_rare_items(item_id INTEGER,tipo TEXT)');
 await db.run('CREATE TABLE historico(id INTEGER PRIMARY KEY,player INTEGER,nome TEXT,amount INTEGER)');
 await db.run('INSERT INTO jogadores(id,nome) VALUES(1,\'Takeru\'),(2,\'Roque\')');
 await db.run("INSERT INTO itens VALUES(10,'Caixa Rank B','Consumível','B',NULL,0,0,0,0,1)");
 db.adicionarCristaisComQuery=async(q,id,n)=>q.run('INSERT INTO historico(player,nome,amount) VALUES(?,\'CRISTAIS\',?)',[id,n]);
 db.registrarHistoricoFichaComQuery=async(q,e)=>q.run('INSERT INTO historico(player,nome,amount) VALUES(?,?,?)',[e.jogadorId,e.recurso,e.quantidade]);
 const sandbox={module:{exports:{}},require:name=>name.includes('packages/database/config')?{provider:'sqlite'}:name.includes('packages/database')?db:name==='./levelSystem'?{getXpNecessario:()=>500}:name.includes('data/')?[]:{}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/systems/gachaEngine'),'utf8'),sandbox);
 return {db,service:createService(db,postgres?'postgres':'sqlite',sandbox.module.exports)};
}
const reward=[{reward_type:'WON',quantidade:100000},{reward_type:'CRISTAIS',quantidade:500},{reward_type:'CAIXA',referencia_id:'10',quantidade:1}];
test('serviço recusa criação e desativação sem ADM',async t=>{
 const {service}=await fixture(t);await assert.rejects(service.create('PLAYER',{code:'SOLO',rewards:reward}),{code:'FORBIDDEN'});
 await service.create('ADM',{code:'SOLO',rewards:reward});await assert.rejects(service.setActive('SOLO',false,'PLAYER'),{code:'FORBIDDEN'});
});
test('vários prêmios reais, normalização, dois jogadores e resgate único concorrente',async t=>{
 const {db,service}=await fixture(t);await service.create('ADM',{code:' Solo2026 ',rewards:reward});
 const results=await Promise.allSettled([service.claim(1,'solo2026'),service.claim(1,' SOLO2026 ')]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.code,'ALREADY_CLAIMED');
 assert.equal((await db.get('SELECT won FROM jogadores WHERE id=1')).won,100000);
 assert.equal((await db.get('SELECT quantidade FROM inventario_jogador WHERE jogador_id=1')).quantidade,1);
 assert.equal((await service.claim(2,'Solo2026')).rewards.length,3);
 assert.equal(Number((await service.info('solo2026')).current_uses),2);
});
test('inexistente, futuro, expirado e desativado',async t=>{
 const {service}=await fixture(t);await assert.rejects(service.claim(1,'X'),{code:'INVALID_CODE'});
 await service.create('ADM',{code:'FUTURO',rewards:reward,starts_at:new Date(Date.now()+86400000).toISOString()});await assert.rejects(service.claim(1,'FUTURO'),{code:'NOT_STARTED'});
 await service.create('ADM',{code:'EXPIROU',rewards:reward,starts_at:'2020-01-01',expires_at:'2021-01-01'});await assert.rejects(service.claim(1,'EXPIROU'),{code:'EXPIRED'});
 await service.create('ADM',{code:'INATIVO',rewards:reward});await service.setActive('INATIVO',false,'ADM');await assert.rejects(service.claim(1,'INATIVO'),{code:'INVALID_CODE'});
});
test('limite global impede entrega ao segundo jogador',async t=>{
 const {db,service}=await fixture(t);await service.create('ADM',{code:'LIMITADO',rewards:reward,max_global_uses:1});
 const results=await Promise.allSettled([service.claim(1,'LIMITADO'),service.claim(2,'LIMITADO')]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.code,'LIMIT_REACHED');
 assert.equal((await db.get('SELECT COUNT(*) AS n FROM redeem_code_claims')).n,1);
});
test('falha de histórico desfaz saldo, itens, claim e contador',async t=>{
 const {db,service}=await fixture(t);await service.create('ADM',{code:'ROLLBACK',rewards:reward});
 const register=db.registrarHistoricoFichaComQuery;
 db.registrarHistoricoFichaComQuery=async(q,e)=>{if(e.recurso==='Caixa Rank B')throw new Error('falha teste');return register(q,e);};
 await assert.rejects(service.claim(1,'ROLLBACK'),/falha teste/);
 assert.equal((await db.get('SELECT won FROM jogadores WHERE id=1')).won,0);assert.equal((await db.get('SELECT COUNT(*) AS n FROM inventario_jogador')).n,0);
 assert.equal((await db.get('SELECT COUNT(*) AS n FROM redeem_code_claims')).n,0);assert.equal(Number((await service.info('ROLLBACK')).current_uses),0);
});
test('recompensa inexistente, quantidade inválida e XP cumulativo',async t=>{
 const {db,service}=await fixture(t);
 await assert.rejects(service.create('ADM',{code:'BADITEM',rewards:[{reward_type:'ITEM',referencia_id:'999',quantidade:1}]}),/nao existe/);
 await assert.rejects(service.create('ADM',{code:'BADAMOUNT',rewards:[{reward_type:'WON',quantidade:-1}]}),/Quantidade/);
 await service.create('ADM',{code:'XPTEST',rewards:[{reward_type:'XP',quantidade:100},{reward_type:'XP',quantidade:200},{reward_type:'MAESTRIA',quantidade:25}]});
 await service.claim(1,'XPTEST');const player=await db.get('SELECT * FROM jogadores WHERE id=1');assert.equal(player.experiencia,300);assert.equal(player.maestria,25);
});
test('título, passiva e técnica usam as estruturas reais da ficha',async t=>{
 const {db,service}=await fixture(t);
 await db.run('ALTER TABLE itens ADD COLUMN descricao TEXT');await db.run('ALTER TABLE itens ADD COLUMN efeito TEXT');
 await db.run("INSERT INTO itens(id,nome,tier,descricao,efeito) VALUES(11,'Guardião','B','Título do evento',''),(12,'Aura Lunar','B','Passiva do evento','Durante a noite')");
 await db.run("INSERT INTO banner_rare_items VALUES(11,'TITULO'),(12,'PASSIVA')");
 await db.run('CREATE TABLE tecnicas(id INTEGER PRIMARY KEY,nome TEXT,rank TEXT)');await db.run("INSERT INTO tecnicas VALUES(20,'Técnica do evento','B')");
 await db.run('CREATE TABLE jogador_tecnicas(id INTEGER PRIMARY KEY,jogador_id INTEGER,tecnica_id INTEGER,nivel INTEGER,experiencia INTEGER)');
 await service.create('ADM',{code:'ESPECIAIS',rewards:[{reward_type:'TITULO',referencia_id:'11',quantidade:1},{reward_type:'PASSIVA',referencia_id:'12',quantidade:2},{reward_type:'TECNICA',referencia_id:'20',quantidade:1}]});
 await service.claim(1,'ESPECIAIS');const player=await db.get('SELECT * FROM jogadores WHERE id=1');assert.equal(player.titulo,'Guardião');assert.equal(JSON.parse(player.passivas_ativas).length,2);assert.equal((await db.get('SELECT tecnica_id FROM jogador_tecnicas WHERE jogador_id=1')).tecnica_id,20);
});
