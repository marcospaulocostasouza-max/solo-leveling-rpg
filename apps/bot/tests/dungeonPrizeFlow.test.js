const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const postgres = process.env.DUNGEON_TEST_POSTGRES === '1';
let pool;
if (postgres) {
    require('dotenv').config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });
    pool = require('../../../packages/database/postgres').getPool();
    after(() => pool.end());
}
function load(file, imports) {
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, file), 'utf8'), { module, console, require(name) {
        if (name in imports) return imports[name];
        throw new Error(`Unexpected import: ${name}`);
    } });
    return module.exports;
}
async function setup(t) {
    const sqlite = postgres ? null : new (require('sqlite3').Database)(':memory:');
    const client = postgres ? await pool.connect() : null;
    t.after(async () => {
        if (client) { try { await client.query('DISCARD TEMP'); } finally { client.release(); } }
        else await new Promise(resolve => sqlite.close(resolve));
    });
    const translate = postgres ? require('../../../packages/database/postgres-compat').translate : null;
    let tail = Promise.resolve();
    const db = {
        run(sql, args = []) {
            if (client) return client.query(translate(sql),args).then(result=>({changes:result.rowCount,lastID:result.rows[0]?.id}));
            return new Promise((resolve, reject) => sqlite.run(sql, args, function(error) { error ? reject(error) : resolve({ changes: this.changes, lastID: this.lastID }); }));
        },
        get(sql, args = []) {
            if (client) return client.query(translate(sql),args).then(result=>result.rows[0]);
            return new Promise((resolve, reject) => sqlite.get(sql, args, (error, row) => error ? reject(error) : resolve(row)));
        },
        transaction(work) {
            const task = tail.then(async () => {
                await db.run(client ? 'BEGIN' : 'BEGIN IMMEDIATE');
                try { const result = await work(db); await db.run('COMMIT'); return result; }
                catch (error) { await db.run('ROLLBACK'); throw error; }
            });
            tail = task.catch(() => {}); return task;
        },
        async ensurePlayerHistorySchema() {},
        async registrarHistoricoFichaComQuery(query, event) { await query.run('INSERT INTO historico_ficha(jogador_id,recurso,quantidade) VALUES(?,?,?)', [event.jogadorId,event.recurso,event.quantidade]); }
    };
    for (const sql of [
        'CREATE TABLE jogadores(id INTEGER PRIMARY KEY,experiencia INTEGER DEFAULT 0,won INTEGER DEFAULT 0,pontos_atributo INTEGER DEFAULT 0,maestria INTEGER DEFAULT 0)',
        'CREATE TABLE fichas_dungeon(id INTEGER PRIMARY KEY,dungeon_id INTEGER,dungeon_nome TEXT,dungeon_rank TEXT,status TEXT)',
        'CREATE TABLE participacao_dungeon(ficha_dungeon_id INTEGER,jogador_id INTEGER)',
        'CREATE TABLE premios_dungeon(ficha_dungeon_id INTEGER,jogador_id INTEGER,premio_tipo TEXT,premio_valor TEXT,data TEXT,UNIQUE(ficha_dungeon_id,jogador_id),UNIQUE(ficha_dungeon_id,premio_tipo))',
        'CREATE TABLE experiencia_historico(jogador_id INTEGER,quantidade INTEGER,motivo TEXT,data TEXT)',
        'CREATE TABLE transacoes(jogador_id INTEGER,valor INTEGER,tipo TEXT,motivo TEXT,data TEXT)',
        'CREATE TABLE historico_ficha(jogador_id INTEGER,recurso TEXT,quantidade INTEGER)',
        'CREATE TABLE itens(id INTEGER PRIMARY KEY,nome TEXT,categoria TEXT,tier TEXT,descricao TEXT,arma INTEGER,armadura INTEGER,consumivel INTEGER,forca_bonus INTEGER,resistencia_bonus INTEGER,velocidade_bonus INTEGER,sentidos_bonus INTEGER,inteligencia_bonus INTEGER,poder_magico_bonus INTEGER,efeito TEXT)',
        'CREATE TABLE inventario_jogador(id INTEGER PRIMARY KEY,jogador_id INTEGER,item_id INTEGER,quantidade INTEGER,equipado INTEGER,item_inicial INTEGER)',
        'INSERT INTO jogadores(id) VALUES(1),(2),(3),(4),(5),(6)',
        "INSERT INTO fichas_dungeon VALUES(1,9,'Mina','E','premios_pendentes'),(2,NULL,'Antiga','D','premios_pendentes')",
        'INSERT INTO participacao_dungeon VALUES(1,1),(1,2),(1,3),(1,4),(1,5),(2,1),(2,2),(2,3),(2,4),(2,5)'
    ]) {
        const statement = client ? sql.replace(/^CREATE TABLE /,'CREATE TEMP TABLE ').replace(/CREATE TEMP TABLE (itens|inventario_jogador)\(id INTEGER PRIMARY KEY/,'CREATE TEMP TABLE $1(id SERIAL PRIMARY KEY') : sql;
        await db.run(statement);
    }
    const service = load('../src/systems/dungeonPrizeService.js', {
        '../../../../packages/database': db, '../../../../packages/database/config': { provider: postgres ? 'postgres' : 'sqlite' },
        './levelSystem': { async verificarProgressao() {} },
        './dungeonDatabaseLoader': {
            carregarDungeons: () => [{ id: 10, nome: 'Antiga', rank: 'D' }],
            sortearItemMisterioso: id => ({ nome: `Espada ${id}`, rank: 'D', categoria: 'Arma 1', descricao: 'Teste', atributos: { 'Força': 7 } })
        }
    });
    const system = { PREMIACOES_RANK: { E: { xp:4000,won:20000,atributos:20,maestria:0 }, D: { xp:8000,won:30000,atributos:0,maestria:50 } } };
    return { db, choose: (f,p,n) => service.choose(system,f,p,n) };
}
test('primeiro leva: escolhas simultâneas da mesma opção entregam uma vez; perdedor pode escolher outra', async t => {
    const { db, choose } = await setup(t);
    const results = await Promise.all([choose(1,1,1), choose(1,2,1)]);
    assert.equal(results.filter(r => r.sucesso).length,1);
    assert.match(results[1].erro,/já foi escolhida/);
    assert.equal(Number((await db.get('SELECT SUM(experiencia) AS total FROM jogadores')).total),4000);
    assert.equal(Number((await db.get('SELECT COUNT(*) AS n FROM premios_dungeon')).n),1);
    assert.equal((await choose(1,2,2)).sucesso,true);
    assert.equal((await db.get('SELECT won FROM jogadores WHERE id=2')).won,20000);
    assert.match((await choose(1,1,3)).erro,/já recebeu/);
    assert.match((await choose(1,6,3)).erro,/participantes/);
});
test('opções diferentes simultâneas, atributos, maestria, item novo e ficha antiga', async t => {
    const { db, choose } = await setup(t);
    const results = await Promise.all([choose(1,1,3),choose(1,2,4),choose(1,3,5)]);
    assert.ok(results.every(r => r.sucesso));
    assert.equal((await db.get('SELECT pontos_atributo FROM jogadores WHERE id=1')).pontos_atributo,20);
    assert.match(results[1].mensagem,/Espada 9.*Rank D.*ficha/);
    assert.equal(Number((await db.get('SELECT COUNT(*) AS n FROM itens')).n),1);
    const inventory = await db.get('SELECT i.nome,i.forca_bonus,j.quantidade FROM inventario_jogador j JOIN itens i ON i.id=j.item_id WHERE j.jogador_id=2');
    assert.equal(inventory.nome,'Espada 9'); assert.equal(inventory.forca_bonus,7); assert.equal(inventory.quantidade,1);
    assert.equal((await choose(2,1,3)).sucesso,true);
    assert.equal((await db.get('SELECT maestria FROM jogadores WHERE id=1')).maestria,50);
    assert.match((await choose(2,2,4)).mensagem,/Espada 10/);
});
test('falha ao entregar ou registrar histórico desfaz a reserva e todo o pagamento', async t => {
    const { db, choose } = await setup(t);
    const original = db.run;
    db.run = function(sql,args) { return sql.startsWith('INSERT INTO historico_ficha') ? Promise.reject(new Error('Falha de histórico')) : original.call(this,sql,args); };
    await assert.rejects(choose(1,1,2),/Falha/);
    await assert.rejects(choose(1,2,4),/Falha/);
    assert.equal(Number((await db.get('SELECT SUM(won) AS total FROM jogadores')).total),0);
    for (const table of ['premios_dungeon','itens','inventario_jogador','transacoes']) assert.equal(Number((await db.get(`SELECT COUNT(*) AS n FROM ${table}`)).n),0);
    db.run = original;
    assert.equal((await choose(1,1,2)).sucesso,true);
});
test('comando responde uma vez, com item real, e recusa opção ocupada sem repetir lista', async () => {
    const messages = [], calls = [];
    const command = load('../src/commands/escolherPremio.js', {
        '../core/messageService': { send: async ({text}) => messages.push(text) },
        '../core/jogadorCore': { buscarPorNumero: async () => ({id:2}) },
        '../systems/dungeonInstanciadaSystem': { escolherPremio: async (...args) => { calls.push(args); return args[2] === 4 ? {mensagem:'*Espada de Ferro [Rank D]* já foi adicionado à sua ficha.'} : {erro:'A opção 1 já foi escolhida. Escolha outra opção da lista.'}; } }
    });
    await command({author:'player',body:'!Escolho a opção número 4 dungeon 12'});
    assert.deepEqual(Array.from(calls[0]),[12,2,4]);
    assert.equal(messages.length,1); assert.match(messages[0],/Espada de Ferro/);
    await command({author:'player',body:'!Escolho número 1 dungeon 12'});
    assert.equal(messages.length,2); assert.ok(messages.every(m=>m.length<100));
});
test('concluir dungeon com cinco participantes envia uma única lista compartilhada', async () => {
    const messages = []; let lists = 0;
    const participantes = [1,2,3,4,5].map(id=>({id,nome:`Player ${id}`}));
    const command = load('../src/commands/concluirDungeon.js', {
        '../core/messageService': { send: async ({text}) => messages.push(text) },
        '../core/jogadorCore': { buscarPorNumero: async () => ({id:1}) },
        '../utils/fichasDungeonTemp': { player: {participantes} },
        '../systems/dungeonInstanciadaSystem': {
            getChave: async()=>({usos_total:5}),
            concluirDungeon: async()=>({participantes,ficha:{id:12,dungeon_nome:'Mina',dungeon_rank:'E'},premios:{xp:4000,won:20000,atributos:20},usosRestantes:4}),
            aplicarPremiacaoGeral: async()=>({cristais:[]}),
            formatarPremiacoes: async()=>{lists++;return 'LISTA ÚNICA: opções 1 a 5';}
        }
    });
    await command({author:'player',body:'!concluir dungeon'});
    assert.equal(lists,1); assert.equal(messages.filter(m=>m.includes('LISTA ÚNICA')).length,1);
});
