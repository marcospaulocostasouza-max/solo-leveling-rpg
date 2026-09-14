const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('minerador: vaga extra, entrega atomica, limite semanal separado, concorrencia e rollback', async t => {
    const sqlite = new (require('sqlite3').Database)(':memory:');
    t.after(() => new Promise(resolve => sqlite.close(resolve)));
    let tail = Promise.resolve();
    const db = {
        run: (sql, args=[]) => new Promise((resolve,reject) => sqlite.run(sql,args,function(e){e?reject(e):resolve({changes:this.changes,lastID:this.lastID});})),
        get: (sql, args=[]) => new Promise((resolve,reject) => sqlite.get(sql,args,(e,row)=>e?reject(e):resolve(row))),
        all: (sql, args=[]) => new Promise((resolve,reject) => sqlite.all(sql,args,(e,rows)=>e?reject(e):resolve(rows))),
        ensureCrystalSchema: async () => {},
        ensurePlayerHistorySchema: async () => {},
        registrarHistoricoFichaComQuery: async (q,e) => q.run("INSERT INTO recibos VALUES(?,?,?)",[e.jogadorId,e.recurso,e.quantidade]),
        adicionarCristaisComQuery: async (query,id,amount,origin) => { await query.run('UPDATE jogadores SET cristais=cristais+? WHERE id=?',[amount,id]); await query.run('INSERT INTO historico_cristais VALUES(?,?,?)',[id,amount,origin]); },
        registrarHistoricoFicha: async () => {},
        transaction: work => {
            const task = tail.then(async () => { await db.run('BEGIN IMMEDIATE'); try {const result=await work(db);await db.run('COMMIT');return result;}catch(e){await db.run('ROLLBACK');throw e;} });
            tail=task.catch(()=>{});return task;
        },
    };
    const level = { verificarProgressao: async () => {}, adicionarXp: async (id,xp) => db.run('UPDATE jogadores SET experiencia=experiencia+? WHERE id=?',[xp,id]) };
    const economy = { adicionarWon: async (id,won) => db.run('UPDATE jogadores SET won=won+? WHERE id=?',[won,id]) };
    const players = { buscarPorNome: nome => db.get('SELECT * FROM jogadores WHERE nome=?',[nome]), buscarPorId: id => db.get('SELECT * FROM jogadores WHERE id=?',[id]) };
    let mining;
    function load(name) {
        const filename=path.resolve(__dirname,'../src/systems',name);
        const module={exports:{}};
        vm.runInNewContext(fs.readFileSync(filename,'utf8'),{module,console,Intl,Date,require:dep=>{
            if(dep.endsWith('/reward-receipt'))return require('../../../packages/database/reward-receipt');
            if(dep==='../utils/dungeonWeek')return require('../src/utils/dungeonWeek');
            if(dep==='../../../../packages/database')return db;
            if(dep==='../../../../packages/database/config')return {provider:'sqlite'};
            if(dep==='../core/database')return sqlite;
            if(dep==='../core/jogadorCore')return players;
            if(dep==='./dungeonMiningService')return mining;
            if(dep==='./levelSystem')return level;
            if(dep==='./economySystem')return economy;
            if(dep==='./ticketSystem')return {sortearTicket:async()=>null};
            if(dep==='./crystalRewardService')return {concederDungeonAutonarrada:async()=>({quantidade:0})};
            if(dep==='../utils/lojaItens')return {ITENS_LOJA:[]};
            if(dep==='./inventorySystem')return {};
            throw new Error(`Unexpected import ${dep}`);
        }},{filename});
        return module.exports;
    }
    mining=load('dungeonMiningService.js');
    const dungeon=load('dungeonInstanciadaSystem.js');
    for(const sql of [
        'CREATE TABLE jogadores(id INTEGER PRIMARY KEY,nome TEXT,rank TEXT,experiencia INTEGER DEFAULT 0,won INTEGER DEFAULT 0,cristais INTEGER DEFAULT 0)',
        'CREATE TABLE historico_cristais(jogador_id INTEGER,quantidade INTEGER,origem TEXT)',
        'CREATE TABLE itens(id INTEGER PRIMARY KEY,nome TEXT)',
        'CREATE TABLE inventario_jogador(id INTEGER PRIMARY KEY,jogador_id INTEGER,item_id INTEGER,quantidade INTEGER)',
        'CREATE TABLE recibos(jogador INTEGER,recurso TEXT,quantidade INTEGER)',
        'CREATE TABLE experiencia_historico(jogador_id INTEGER,quantidade INTEGER,motivo TEXT,data TEXT)',
        'CREATE TABLE transacoes(jogador_id INTEGER,valor INTEGER,tipo TEXT,motivo TEXT,data TEXT)',
        'CREATE TABLE fichas_dungeon(id INTEGER PRIMARY KEY,jogador_id INTEGER,dungeon_nome TEXT,dungeon_rank TEXT,participantes TEXT,usos_consumidos INTEGER,status TEXT)',
        'CREATE TABLE chaves_dungeon(id INTEGER PRIMARY KEY,jogador_id INTEGER,usos_restantes INTEGER,usos_total INTEGER,ativa INTEGER,rank TEXT)',
        'CREATE TABLE participacao_dungeon(jogador_id INTEGER,ficha_dungeon_id INTEGER,semana TEXT,data TEXT)',
        "INSERT INTO itens VALUES(1,'Picareta do Minerador')",
    ])await db.run(sql);
    for(let id=1;id<=20;id++)await db.run("INSERT INTO jogadores(id,nome,rank) VALUES(?,?,'E')",[id,`Jogador ${id}`]);
    await db.run('INSERT INTO inventario_jogador VALUES(1,6,1,10)');
    await mining.garantirSchema();
    dungeon.getChave=id=>db.get('SELECT * FROM chaves_dungeon WHERE jogador_id=? AND ativa=1',[id]);
    dungeon.removerChaveDoInventario=async()=>{};
    dungeon.atualizarLojaComDrops=async()=>{};
    dungeon.sortearCristais=async()=>({sucesso:true,nome:'Cristal Pequeno',quantidade:2,valorTotal:40000});
    const sheet=async(id,owner)=>{
        await db.run("INSERT INTO fichas_dungeon VALUES(?,?,'Mina','E','[]',0,'ativa')",[id,owner]);
        await db.run("INSERT INTO chaves_dungeon VALUES(?,?,5,5,1,'E')",[id,owner]);
        return players.buscarPorId(owner);
    };
    const owner=await sheet(1,1);
    const parsed=await dungeon.reconhecerFichaDungeon('*Nome:* Mina\n*Rank:* E\n*Participantes:*\n1. Jogador 1\n2. Jogador 2\n3. Jogador 3\n4. Jogador 4\n5. Jogador 5\n*Minerador (vaga extra opcional):*\nMinerador: Jogador 6',owner);
    assert.equal(parsed.participantes.length,5);assert.equal(parsed.minerador,'Jogador 6');
    assert.equal((await dungeon.validarParticipantesReconhecidos(owner,parsed)).valido,true);
    assert.equal((await dungeon.validarParticipantesReconhecidos(owner,{...parsed,minerador:'Jogador 1'})).valido,false);
    assert.equal((await dungeon.validarParticipantesReconhecidos(owner,{...parsed,minerador:'Desconhecido'})).valido,false);
    // Promoção do dono não invalida a chave/ficha Rank E já existente.
    await db.run("UPDATE jogadores SET rank='D' WHERE id=?",[owner.id]);
    owner.rank='D';
    const result=await dungeon.concluirDungeon(owner,parsed);
    assert.equal(result.sucesso,true,result.erro);assert.equal(result.participantes.length,5);assert.equal(result.usosRestantes,0);
    assert.equal((await db.get('SELECT dungeon_rank FROM fichas_dungeon WHERE id=1')).dungeon_rank,'E');
    assert.equal(result.mineracao.cristais,500);assert.equal((await db.get("SELECT cristais FROM jogadores WHERE id=6")).cristais,500);assert.equal(result.mineracao.xp,800);assert.equal(result.mineracao.usadas,1);
    assert.deepEqual(await db.get('SELECT experiencia,won FROM jogadores WHERE id=6'),{experiencia:800,won:40000});
    assert.equal(await dungeon.ehParticipanteDaFicha(1,6),false,'no extra prize for miner');
    await dungeon.aplicarPremiacaoGeral(1);
    assert.deepEqual(await db.get('SELECT experiencia,won FROM jogadores WHERE id=6'),{experiencia:800,won:40000},'no normal rewards for miner');
    assert.equal((await db.get('SELECT quantidade FROM inventario_jogador WHERE id=1')).quantidade,9);
    assert.ok((await dungeon.concluirDungeon(owner,parsed)).erro);
    const second=await sheet(2,7), third=await sheet(3,8);
    const concurrent=await Promise.all([dungeon.concluirDungeon(second,{participantes:[second.nome],minerador:'Jogador 6'}),dungeon.concluirDungeon(third,{participantes:[third.nome],minerador:'Jogador 6'})]);
    assert.equal(concurrent.filter(x=>x.sucesso).length,1,'only one remaining weekly slot');
    assert.match(concurrent.find(x=>x.erro).erro,/duas dungeons/);
    assert.equal((await db.get('SELECT COUNT(*) AS n FROM dungeon_mineracoes WHERE jogador_id=6')).n,2);
    const failedOwner=concurrent[0].erro?7:8;
    assert.equal((await db.get('SELECT usos_restantes FROM chaves_dungeon WHERE jogador_id=?',[failedOwner])).usos_restantes,5,'weekly rejection rolls back key');
    assert.equal((await db.get('SELECT COUNT(*) AS n FROM participacao_dungeon WHERE jogador_id=?',[failedOwner])).n,0);
    const normal=await sheet(4,6);
    assert.equal((await dungeon.concluirDungeon(normal,{participantes:[normal.nome]})).sucesso,true,'mining does not consume regular weekly participation');
    const noPick=await sheet(5,9);
    const noPickResult=await dungeon.concluirDungeon(noPick,{participantes:[noPick.nome],minerador:'Jogador 10'});
    assert.match(noPickResult.erro,/Picareta/);
    assert.equal((await db.get('SELECT status FROM fichas_dungeon WHERE id=5')).status,'ativa');
    // A new week allows mining again, even after a regular dungeon.
    await db.run("UPDATE dungeon_mineracoes SET semana='old-week'");
    const empty=await sheet(6,11);
    dungeon.sortearCristais=async()=>({sucesso:false,mensagem:'Nenhum cristal foi encontrado.'});
    const emptyResult=await dungeon.concluirDungeon(empty,{participantes:[empty.nome],minerador:'Jogador 6'});
    assert.equal(emptyResult.mineracao.sucesso,true);assert.equal(emptyResult.mineracao.encontrou,false);
    assert.equal(emptyResult.mineracao.usadas,1);assert.equal((await db.get("SELECT cristais FROM jogadores WHERE id=6")).cristais,1500);
    assert.deepEqual(await db.get('SELECT experiencia,won FROM jogadores WHERE id=6'),{experiencia:2400,won:80000});
    assert.equal(mining.semanaAtual(new Date('2026-09-14T02:59:59Z')),'2026-09-07');
    assert.equal(mining.semanaAtual(new Date('2026-09-14T03:00:00Z')),'2026-09-14');
    const failing=await sheet(7,12);
    await db.run('INSERT INTO inventario_jogador VALUES(2,13,1,1)');
    const originalRun=db.run;
    db.run=(sql,args)=>sql.startsWith('INSERT INTO dungeon_mineracoes')?Promise.reject(new Error('Falha simulada no registro final')):originalRun(sql,args);
    const failed=await dungeon.concluirDungeon(failing,{participantes:[failing.nome],minerador:'Jogador 13'});
    assert.match(failed.erro,/Falha simulada/);
    db.run=originalRun;
    assert.equal((await db.get('SELECT quantidade FROM inventario_jogador WHERE id=2')).quantidade,1);
    assert.equal((await db.get('SELECT experiencia FROM jogadores WHERE id=13')).experiencia,0);assert.equal((await db.get('SELECT cristais FROM jogadores WHERE id=13')).cristais,0);
    assert.equal((await db.get('SELECT status FROM fichas_dungeon WHERE id=7')).status,'ativa');
    const twice=await Promise.all([dungeon.concluirDungeon(failing,{participantes:[failing.nome],minerador:'Jogador 13'}),dungeon.concluirDungeon(failing,{participantes:[failing.nome],minerador:'Jogador 13'})]);
    assert.equal(twice.filter(x=>x.sucesso).length,1,'double completion delivers only once');
    assert.equal((await db.get('SELECT experiencia FROM jogadores WHERE id=13')).experiencia,800);assert.equal((await db.get('SELECT cristais FROM jogadores WHERE id=13')).cristais,500);assert.equal((await db.get('SELECT COUNT(*) AS n FROM historico_cristais WHERE jogador_id=13')).n,1);
    assert.equal((await db.get('SELECT COUNT(*) AS n FROM dungeon_mineracoes WHERE jogador_id=13')).n,1);
});
