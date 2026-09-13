const {test,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const postgres=process.env.DUNGEON_TEST_POSTGRES==='1'; let pool;
if(postgres){require('dotenv').config({path:path.resolve(__dirname,'../../../.env'),quiet:true});pool=require('../../../packages/database/postgres').getPool();after(()=>pool.end());}
async function fixture(t) {
    const sqlite=postgres?null:new(require('sqlite3').Database)(':memory:');
    const client=postgres?await pool.connect():null;
    if(client)await client.query('SET search_path TO pg_temp');
    t.after(async()=>{if(client){try{await client.query('DISCARD TEMP');}finally{client.release();}}else await new Promise(resolve=>sqlite.close(resolve));}); let tail=Promise.resolve();
    const translate=postgres?require('../../../packages/database/postgres-compat').translate:null;
    const db={
        run(sql,args=[]) {
            if(client){sql=sql.replace(/^CREATE TABLE /,'CREATE TEMP TABLE ').replace(/CREATE TEMP TABLE (itens|inventario_jogador|chaves_dungeon)\(id INTEGER PRIMARY KEY/,'CREATE TEMP TABLE $1(id SERIAL PRIMARY KEY');return client.query(translate(sql),args).then(r=>({changes:r.rowCount,lastID:r.rows[0]?.id}));}
            return new Promise((resolve,reject)=>sqlite.run(sql,args,function(e){e?reject(e):resolve({changes:this.changes,lastID:this.lastID});}));
        },
        get(sql,args=[]) {
            if(client)return client.query(translate(sql),args).then(r=>{const row=r.rows[0];if(row&&'n'in row)row.n=Number(row.n);return row;});
            return new Promise((resolve,reject)=>sqlite.get(sql,args,(e,row)=>e?reject(e):resolve(row)));
        },
        transaction(work) {const task=tail.then(async()=>{await db.run('BEGIN');try{const r=await work(db);await db.run('COMMIT');return r;}catch(e){await db.run('ROLLBACK');throw e;}});tail=task.catch(()=>{});return task;},
        async ensurePlayerHistorySchema(){},
        async registrarHistoricoFichaComQuery(query,e){await query.run('INSERT INTO history(player,name) VALUES(?,?)',[e.jogadorId,e.recurso]);}
    };
    for(const sql of [
        'CREATE TABLE jogadores(id INTEGER PRIMARY KEY,rank TEXT,ultimo_sorteio_desejar TEXT,ultimo_resultado_desejar TEXT)',
        'CREATE TABLE chaves_dungeon(id INTEGER PRIMARY KEY,jogador_id INTEGER UNIQUE,rank TEXT,usos_total INTEGER,usos_restantes INTEGER,data_obtencao TEXT,ativa INTEGER,dungeon_id INTEGER)',
        'CREATE TABLE fichas_dungeon(id INTEGER PRIMARY KEY,jogador_id INTEGER,status TEXT)',
        'CREATE TABLE sorteios_dungeon(jogador_id INTEGER,sucesso INTEGER,rank TEXT,data TEXT,semana TEXT)',
        'CREATE TABLE itens(id INTEGER PRIMARY KEY,nome TEXT UNIQUE,categoria TEXT,tier TEXT,descricao TEXT,consumivel INTEGER)',
        'CREATE TABLE inventario_jogador(id INTEGER PRIMARY KEY,jogador_id INTEGER,item_id INTEGER,quantidade INTEGER,equipado INTEGER,item_inicial INTEGER)',
        'CREATE TABLE history(player INTEGER,name TEXT)',
        "INSERT INTO jogadores(id,rank) VALUES(1,'E'),(2,'D')",
        "INSERT INTO itens VALUES(10,'Chave de Dungeon Rank E','Chave','E','',1),(11,'Material de Dungeon Rank E','Material','E','',0),(12,'Material de Dungeon Rank D','Material','D','',0)",
        'INSERT INTO inventario_jogador VALUES(1,1,10,2,0,0),(2,1,11,2,0,0),(3,2,12,1,0,0)'
    ])await db.run(sql);
    if(client)for(const table of ['itens','inventario_jogador'])await client.query('SELECT setval(pg_get_serial_sequence($1,$2),100,false)',[`pg_temp.${table}`,'id']);
    const module={exports:{}},file=path.resolve(__dirname,'../src/systems/dungeonRewardUseService.js');
    const system={garantirSchemaChaveDungeon:async()=>{},getSemanaAtual:()=> '2026-W37',podeSortear:async p=>({pode:!p.ultimo_sorteio_desejar})};
    vm.runInNewContext(fs.readFileSync(file,'utf8'),{module,console,Date,Math:Object.assign(Object.create(Math),{random:()=>0}),__dirname:path.dirname(file),require(name){
        if(name==='../../../../packages/database')return db;
        if(name==='../../../../packages/database/config')return {provider:postgres?'postgres':'sqlite'};
        if(name==='./dungeonInstanciadaSystem')return system;
        if(name==='./dungeonDatabaseLoader')return {sortearDungeon:r=>({id:1,rank:r})};
        if(name==='fs')return fs;if(name==='path')return path;throw new Error(name);
    }});
    return {db,service:module.exports,system};
}
test('chave do banner ativa uma dungeon; segunda chave exige confirmação, cancelar não consome',async t=>{
    const {db,service}=await fixture(t);
    assert.equal((await service.use(1,10)).pendente,undefined);
    assert.equal((await db.get('SELECT quantidade FROM inventario_jogador WHERE id=1')).quantidade,1);
    await db.run('UPDATE chaves_dungeon SET dungeon_id=7 WHERE jogador_id=1');
    await db.run("INSERT INTO fichas_dungeon VALUES(1,1,'ativa'),(2,1,'premios_pendentes')");
    assert.equal((await service.use(1,10)).pendente,true);
    assert.equal((await db.get('SELECT dungeon_id FROM chaves_dungeon')).dungeon_id,7);
    await service.confirm(1,false);
    assert.equal((await db.get('SELECT quantidade FROM inventario_jogador WHERE id=1')).quantidade,1);
    await service.use(1,10);await service.confirm(1,true);
    assert.equal((await db.get('SELECT COUNT(*) n FROM chaves_dungeon WHERE ativa=1')).n,1);
    assert.equal((await db.get('SELECT status FROM fichas_dungeon WHERE id=1')).status,'sacrificada');
    assert.equal((await db.get('SELECT status FROM fichas_dungeon WHERE id=2')).status,'premios_pendentes');
    assert.equal(await db.get('SELECT * FROM inventario_jogador WHERE id=1'),undefined);
    assert.match((await service.confirm(1,true)).erro,/não tem/);
});
test('Desejar com dungeon atual oferece nova chave; concorrência não repete sorteio semanal',async t=>{
    const {db,service,system}=await fixture(t);await service.use(1,10);
    const results=await Promise.all([service.wish(system,{id:1}),service.wish(system,{id:1})]);
    assert.equal(results.filter(r=>r.pendente).length,1);assert.equal(results.filter(r=>r.erro).length,1);
    assert.equal((await db.get('SELECT COUNT(*) n FROM sorteios_dungeon')).n,1);
    await service.confirm(1,true);assert.equal((await db.get('SELECT COUNT(*) n FROM chaves_dungeon WHERE ativa=1')).n,1);
});
test('material genérico antigo sorteia somente material da loja do mesmo rank e entra no inventário',async t=>{
    const {db,service}=await fixture(t);
    assert.deepEqual(Array.from(service.materials('E')),['Couro','Latão']);
    assert.deepEqual(Array.from(service.materials('D')),['Ferro','Cobre']);
    assert.match((await service.use(1,11)).mensagem,/Couro.*Rank E/);
    assert.match((await service.use(2,12)).mensagem,/Ferro.*Rank D/);
    const item=await db.get("SELECT i.nome,inv.quantidade FROM inventario_jogador inv JOIN itens i ON i.id=inv.item_id WHERE inv.jogador_id=1 AND i.nome='Couro'");
    assert.equal(item.quantidade,1);assert.equal((await db.get('SELECT quantidade FROM inventario_jogador WHERE id=2')).quantidade,1);
});
test('falha de entrega desfaz consumo, sorteio e troca; confirmação obsoleta não sacrifica dungeon',async t=>{
    const {db,service}=await fixture(t),original=db.registrarHistoricoFichaComQuery;
    db.registrarHistoricoFichaComQuery=async()=>{throw new Error('Falha');};
    await assert.rejects(service.use(1,10),/Falha/);await assert.rejects(service.use(1,11),/Falha/);
    assert.equal((await db.get('SELECT quantidade FROM inventario_jogador WHERE id=1')).quantidade,2);
    assert.equal((await db.get('SELECT COUNT(*) n FROM chaves_dungeon')).n,0);
    db.registrarHistoricoFichaComQuery=original;await service.use(1,10);await service.use(1,10);
    await db.run('UPDATE chaves_dungeon SET dungeon_id=99 WHERE jogador_id=1');
    assert.match((await service.confirm(1,true)).erro,/mudou/);
    assert.equal((await db.get('SELECT dungeon_id FROM chaves_dungeon')).dungeon_id,99);
});
