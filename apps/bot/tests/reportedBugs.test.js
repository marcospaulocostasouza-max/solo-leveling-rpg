const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { classKey, isPassive, techniqueName } = require('../src/utils/techniqueIdentity');
const { validate } = require('../src/ai/narrativeResponseGuard');
const { verificarGrupo, GROUP_CONFIG } = require('../src/core/groupConfig');
function load(relative, imports) {
    const module = { exports: {} }, file = path.resolve(__dirname, relative);
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), { module, console, Intl, Date, require(name) { if (name in imports) return imports[name]; throw new Error(name); } });
    return module.exports;
}
test('aliases de classe, flags PostgreSQL e nomes duplicados de assassino', () => {
    assert.equal(classKey('Mago de Maldição'), classKey('Mago Maldição'));
    for (const value of ['0', 0, false, 'false', null]) assert.equal(isPassive(value), false);
    for (const value of ['1', 1, true, 'true']) assert.equal(isPassive(value), true);
    assert.equal(techniqueName({ classe: 'Assassino', nome: 'Marca daExecução' }), 'Marca da Execução');
    assert.equal(techniqueName({ classe: 'Assassino', nome: 'Ponto Fraco [Passivo]' }), 'Ponto Fraco');
    assert.equal(techniqueName({ classe: 'Foices', nome: 'Ponto Fraco [Passivo]' }), 'Ponto Fraco [Passivo]');
});
test('preço de venda considera valor, mantém preço vigente e preserva valores dos minérios', () => {
    const sale = load('../src/systems/vendaSystem.js', { '../core/database': {}, './economySystem': {}, './inventorySystem': {} });
    assert.equal(sale.calcularValorVenda({ nome: 'Espada', preco: '0', valor: 2000 }, 2), 2000);
    assert.equal(sale.calcularValorVenda({ nome: 'Espada', preco: 4000, valor: 2000 }), 2000);
    assert.equal(sale.calcularValorVenda({ nome: 'Cristal Pequeno', preco: 0, valor: 0 }), 20000);
});
test('resposta narrativa detecta nome inventado e cópia longa, permite referência curta e nome canônico', () => {
    const context = { npc: { name: 'Alexia Song' }, message: 'O jogador caminhou lentamente até a janela da sala e observou as montanhas ao longe antes de guardar sua espada na bainha.' };
    assert.ok(validate('*Meu nome é Helena.*', context).length);
    assert.equal(validate('*Meu nome é Alexia.*\n_Ela sorri._', context).length, 0);
    assert.ok(validate(context.message, context).length);
    assert.equal(validate('*Você guardou a espada?*', context).length, 0);
});
test('comandos funcionam em qualquer grupo e no privado', () => {
    for (const grupo of [...Object.values(GROUP_CONFIG), 'outro@g.us', 'player@c.us']) {
        for (const comando of ['!comprar espada', '!concluir dungeon', '!escolho número 4 dungeon 1', '!arquiteto', '!desativar banner Teste', '!minhas técnicas']) {
            assert.equal(verificarGrupo(comando, grupo), true);
        }
    }
});

test('prêmios antigos e números estáveis são consultados no banco, sem incluir minerador', async t => {
    const sqlite = new (require('sqlite3').Database)(':memory:');
    t.after(() => new Promise(resolve => sqlite.close(resolve)));
    const db = { run: (sql,args=[]) => new Promise((resolve,reject) => sqlite.run(sql,args,error=>error?reject(error):resolve())), get: (sql,args=[]) => new Promise((resolve,reject) => sqlite.get(sql,args,(error,row)=>error?reject(error):resolve(row))) };
    for (const sql of [
        'CREATE TABLE fichas_dungeon(id INTEGER PRIMARY KEY,jogador_id INTEGER,dungeon_nome TEXT,dungeon_rank TEXT,status TEXT)',
        'CREATE TABLE participacao_dungeon(ficha_dungeon_id INTEGER,jogador_id INTEGER)',
        'CREATE TABLE premios_dungeon(ficha_dungeon_id INTEGER,jogador_id INTEGER,premio_tipo TEXT)',
        "INSERT INTO fichas_dungeon VALUES(1,1,'Antiga','E','premios_pendentes'),(2,1,'Nova','E','ativa'),(3,1,'Outra','E','premios_pendentes')",
        'INSERT INTO participacao_dungeon VALUES(1,1),(1,2),(3,1)',
        "INSERT INTO premios_dungeon VALUES(1,2,'xp_extra')"
    ]) await db.run(sql);
    const dungeon = load('../src/systems/dungeonInstanciadaSystem.js', new Proxy({ '../core/database': sqlite, '../../../../packages/database': db, '../../../../packages/database/config': { provider: 'sqlite' } }, { has: () => true, get: (target,key) => target[key] || {} }));
    const pending = await dungeon.getFichasPendentesParaPremio(1);
    assert.deepEqual(Array.from(pending, row => row.id), [1,3]);
    assert.equal((await dungeon.getFichasPendentesParaPremio(2)).length, 0);
    assert.equal((await dungeon.getFichasPendentesParaPremio(6)).length, 0);
    const options = await dungeon.getOpcoesPremios(1,1);
    assert.equal(options.find(option => option.tipo==='won_extra').numero, 2);
    assert.equal(options.find(option => option.tipo==='item_misterioso_1').numero, 4);
});

test('venda debita o item correto, credita Won e desfaz tudo se o registro falhar', async t => {
    const sqlite = new (require('sqlite3').Database)(':memory:'); let tail = Promise.resolve();
    t.after(() => new Promise(resolve => sqlite.close(resolve)));
    const db = {
        run(sql,args=[]) { return new Promise((resolve,reject) => sqlite.run(sql,args,function(error) { error?reject(error):resolve({changes:this.changes}); })); },
        get(sql,args=[]) { return new Promise((resolve,reject) => sqlite.get(sql,args,(error,row)=>error?reject(error):resolve(row))); },
        all(sql,args=[]) { return new Promise((resolve,reject) => sqlite.all(sql,args,(error,rows)=>error?reject(error):resolve(rows))); },
        transaction(work) { const task=tail.then(async()=>{await this.run('BEGIN');try{const result=await work(this);await this.run('COMMIT');return result;}catch(error){await this.run('ROLLBACK');throw error;}});tail=task.catch(()=>{});return task; }
    };
    for (const sql of ['CREATE TABLE jogadores(id INTEGER PRIMARY KEY,won INTEGER)', 'CREATE TABLE itens(id INTEGER PRIMARY KEY,nome TEXT,preco INTEGER,valor INTEGER)', 'CREATE TABLE inventario_jogador(id INTEGER PRIMARY KEY,item_id INTEGER,jogador_id INTEGER,quantidade INTEGER,equipado INTEGER)', 'CREATE TABLE transacoes(jogador_id INTEGER,valor INTEGER,tipo TEXT,motivo TEXT,data TEXT)', 'INSERT INTO jogadores VALUES(1,0)', "INSERT INTO itens VALUES(7,'Espada',0,2000),(8,'Lembrança',0,0)", 'INSERT INTO inventario_jogador VALUES(1,7,1,3,0),(2,8,1,1,0)']) await db.run(sql);
    const service = load('../src/systems/vendaTransactionService.js', { '../../../../packages/database':db, '../../../../packages/database/config':{provider:'sqlite'} });
    const calculate = (item, count) => Math.floor((item.preco || item.valor) * 0.5) * count;
    const results = await Promise.all([service.sell(1,'Espada',2,calculate),service.sell(1,'Espada',2,calculate)]);
    assert.equal(results.filter(result=>result.sucesso).length,1);
    assert.equal((await db.get('SELECT quantidade FROM inventario_jogador WHERE id=1')).quantidade,1);
    assert.equal((await db.get('SELECT won FROM jogadores WHERE id=1')).won,2000);
    assert.equal((await service.sell(1,'Lembrança',1,calculate)).sucesso,false);
    assert.equal((await db.get('SELECT quantidade FROM inventario_jogador WHERE id=2')).quantidade,1);
    const original=db.run;
    db.run=function(sql,args){return sql.startsWith('INSERT INTO transacoes')?Promise.reject(new Error('Ledger failure')):original.call(this,sql,args);};
    assert.equal((await service.sell(1,'Espada',1,calculate)).sucesso,false);
    assert.equal((await db.get('SELECT quantidade FROM inventario_jogador WHERE id=1')).quantidade,1);
    assert.equal((await db.get('SELECT won FROM jogadores WHERE id=1')).won,2000);
});
