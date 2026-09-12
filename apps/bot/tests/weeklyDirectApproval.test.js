const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

test('ADM aprova diretamente e nao entrega premios duas vezes', async t => {
    const sqlite = new (require('sqlite3').Database)(':memory:');
    const db = {
        ensureCrystalSchema: async () => {},
        run: (sql, params = []) => new Promise((resolve, reject) => sqlite.run(sql, params, function (e) { e ? reject(e) : resolve({ changes: this.changes, lastID: this.lastID }); })),
        get: (sql, params = []) => new Promise((resolve, reject) => sqlite.get(sql, params, (e, r) => e ? reject(e) : resolve(r))),
        transaction: async work => { await db.run('BEGIN'); try { const r = await work(db); await db.run('COMMIT'); return r; } catch(e) { await db.run('ROLLBACK'); throw e; } }
    };
    t.after(() => new Promise(resolve => sqlite.close(resolve)));
    for (const sql of [
        'CREATE TABLE jogadores(id INTEGER PRIMARY KEY,experiencia INTEGER,won INTEGER)',
        'CREATE TABLE experiencia_historico(jogador_id INTEGER,quantidade INTEGER,motivo TEXT,data TEXT)',
        'CREATE TABLE transacoes(jogador_id INTEGER,valor INTEGER,tipo TEXT,motivo TEXT,data TEXT)',
        'INSERT INTO jogadores VALUES(1,0,0)'
    ]) await db.run(sql);
    let crystals = 0;
    const filename = path.resolve(__dirname, '../src/systems/weeklyDungeonSystem.js');
    const realRequire = createRequire(filename);
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(filename, 'utf8'), { module, console, require: name => {
        if (name === '../../../../packages/database') return db;
        if (name === '../../../../packages/database/config') return { provider: 'sqlite' };
        if (name === './crystalRewardService') return { porRank: () => 10, ORIGENS: { DUNGEON_SEMANAL: 'weekly' }, conceder: async () => { crystals++; return { quantidade: 10 }; } };
        if (name === './levelSystem') return { verificarProgressao: async () => {} };
        return realRequire(name);
    } }, { filename });
    const weekly = module.exports;
    await weekly.ensure();
    await db.run("INSERT INTO dungeons_semanais(dados,status,data_expiracao) VALUES(?,'liberada',?)", [JSON.stringify({ nome: 'Semanal', xp: 100, won: 200 }), new Date(Date.now()+86400000).toISOString()]);
    const result = await weekly.aprovarConclusao(1, 'adm');
    assert.equal(result.xp, 100);
    assert.deepEqual(await db.get('SELECT experiencia,won FROM jogadores WHERE id=1'), { experiencia: 100, won: 200 });
    assert.equal((await db.get('SELECT aprovada_por FROM conclusoes_dungeon_semanal')).aprovada_por, 'adm');
    await assert.rejects(weekly.aprovarConclusao(1, 'adm'), /ja recebeu/);
    assert.equal(crystals, 1);
    await db.run("UPDATE dungeons_semanais SET status='encerrada'");
    await assert.rejects(weekly.aprovarConclusao(1, 'adm'), /ativa/);
});
