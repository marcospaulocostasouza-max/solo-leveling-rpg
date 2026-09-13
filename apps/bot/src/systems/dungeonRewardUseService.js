const database = require('../../../../packages/database');
const { provider } = require('../../../../packages/database/config');
const fs = require('fs'), path = require('path');
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function kind(item) {
    const name = normalize(item.nome);
    if (/^chave de dungeon(?: rank)?\s+[edcbas]$/.test(name)) return 'key';
    if (/^materia(?:l|is) de dungeon(?: rank)?\s+[edcbas]$/.test(name)) return 'material';
    return null;
}
function rank(item) { return String(item.nome).match(/\b([EDCBAS])\s*$/i)?.[1].toUpperCase(); }
let ready;
async function ensure() {
    if (!ready) ready = database.run(`CREATE TABLE IF NOT EXISTS dungeon_key_pending (
        jogador_id BIGINT PRIMARY KEY, current_key_id BIGINT NOT NULL, current_dungeon_id BIGINT NOT NULL,
        current_obtained TEXT NOT NULL, rank TEXT NOT NULL, item_id BIGINT, created TEXT NOT NULL)`)
        .catch(error => { ready = null; throw error; });
    await ready;
    await require('./dungeonInstanciadaSystem').garantirSchemaChaveDungeon();
    await database.ensurePlayerHistorySchema();
}
const lock = provider === 'postgres' ? ' FOR UPDATE' : '';
async function addInventory(query, playerId, itemId) {
    const row = await query.get('SELECT id FROM inventario_jogador WHERE jogador_id=? AND item_id=? ORDER BY id LIMIT 1', [playerId,itemId]);
    if (row) await query.run('UPDATE inventario_jogador SET quantidade=COALESCE(quantidade,0)+1 WHERE id=?',[row.id]);
    else await query.run('INSERT INTO inventario_jogador(jogador_id,item_id,quantidade,equipado,item_inicial) VALUES(?,?,1,0,0)',[playerId,itemId]);
}
async function consume(query, playerId, itemId) {
    const row = await query.get('SELECT id FROM inventario_jogador WHERE jogador_id=? AND item_id=? AND quantidade>0 ORDER BY id LIMIT 1',[playerId,itemId]);
    if (!row) throw new Error('A chave ou material não está mais no seu inventário.');
    const changed = await query.run('UPDATE inventario_jogador SET quantidade=quantidade-1 WHERE id=? AND quantidade>0',[row.id]);
    if (!changed.changes) throw new Error('Não foi possível consumir o item.');
    await query.run('DELETE FROM inventario_jogador WHERE id=? AND quantidade=0',[row.id]);
}
async function activate(query, playerId, newRank, itemId) {
    if (!require('./dungeonDatabaseLoader').sortearDungeon(newRank)) throw new Error(`Não há dungeon disponível de Rank ${newRank}.`);
    if (itemId) await consume(query,playerId,itemId);
    await query.run("UPDATE fichas_dungeon SET status='sacrificada' WHERE jogador_id=? AND status='ativa'",[playerId]);
    await query.run(`INSERT INTO chaves_dungeon(jogador_id,rank,usos_total,usos_restantes,data_obtencao,ativa,dungeon_id)
        VALUES(?,?,5,5,?,1,0) ON CONFLICT(jogador_id) DO UPDATE SET rank=excluded.rank,usos_total=5,usos_restantes=5,
        data_obtencao=excluded.data_obtencao,ativa=1,dungeon_id=0`,[playerId,newRank,new Date().toISOString()]);
    await query.run('DELETE FROM dungeon_key_pending WHERE jogador_id=?',[playerId]);
    await database.registrarHistoricoFichaComQuery(query,{jogadorId:playerId,tipo:'Dungeon',recurso:`Chave de Dungeon Rank ${newRank}`,quantidade:1,descricao:'Chave ativada; somente uma dungeon instanciada pode ser mantida.',origem:'DUNGEON_CHAVE_ATIVADA'});
    return { sucesso:true,rank:newRank,mensagem:`Chave Rank ${newRank} ativada (5 usos). Use !abrir dungeon para revelar a dungeon.` };
}
async function offer(query, playerId, newRank, itemId = null) {
    const current = await query.get('SELECT * FROM chaves_dungeon WHERE jogador_id=? AND ativa=1',[playerId]);
    if (!current) return activate(query,playerId,newRank,itemId);
    await query.run(`INSERT INTO dungeon_key_pending(jogador_id,current_key_id,current_dungeon_id,current_obtained,rank,item_id,created)
        VALUES(?,?,?,?,?,?,?) ON CONFLICT(jogador_id) DO UPDATE SET current_key_id=excluded.current_key_id,
        current_dungeon_id=excluded.current_dungeon_id,current_obtained=excluded.current_obtained,rank=excluded.rank,item_id=excluded.item_id,created=excluded.created`,
        [playerId,current.id,Number(current.dungeon_id)||0,String(current.data_obtencao||''),newRank,itemId,new Date().toISOString()]);
    return { sucesso:true,pendente:true,rank:newRank,mensagem:`Você já possui uma chave/dungeon Rank ${current.rank}. Deseja sacrificar a atual para ficar com a nova Rank ${newRank}?\n!trocar dungeon — sacrificar a atual e ativar a nova.\n!manter dungeon — manter a atual.${itemId ? '\nA nova chave só será consumida se você confirmar a troca.' : '\nSe mantiver a atual, a nova chave do Desejar será descartada.'}` };
}
async function confirm(playerId, replace) {
    await ensure();
    return database.transaction(async query => {
        if (!await query.get('SELECT id FROM jogadores WHERE id=?'+lock,[playerId])) throw new Error('Jogador não encontrado.');
        const pending = await query.get('SELECT * FROM dungeon_key_pending WHERE jogador_id=?',[playerId]);
        if (!pending) return {erro:'Você não tem uma troca de dungeon aguardando confirmação.'};
        if (!replace) { await query.run('DELETE FROM dungeon_key_pending WHERE jogador_id=?',[playerId]); return {mensagem:'Dungeon atual mantida. Nenhum item do inventário foi consumido.'}; }
        const current = await query.get('SELECT * FROM chaves_dungeon WHERE jogador_id=? AND ativa=1',[playerId]);
        if (!current || Number(current.id)!==Number(pending.current_key_id) || (Number(current.dungeon_id)||0)!==Number(pending.current_dungeon_id) || String(current.data_obtencao||'')!==pending.current_obtained) return {erro:'Sua dungeon mudou desde a pergunta. Solicite a abertura da chave novamente.'};
        const inProgress = await query.get("SELECT id FROM fichas_dungeon WHERE jogador_id=? AND status='concluindo'",[playerId]);
        if (inProgress) return {erro:'Aguarde a conclusão em andamento antes de trocar sua dungeon.'};
        return activate(query,playerId,pending.rank,pending.item_id);
    });
}
function materials(wantedRank) {
    const source = fs.readFileSync(path.resolve(__dirname,'../commands/lojaMateriais.js'),'utf8');
    let tier; const result = [];
    for (const line of source.split('\n')) {
        if (/Garrafas de/.test(line)) break;
        const heading = line.match(/\*Tier ([1-5])/); if (heading) tier = Number(heading[1]);
        const entry = line.match(/^\* \*([^*]+)\*(.*)/); if (!entry || !tier) continue;
        const itemRank = entry[2].match(/\[([EDCBAS]{1,2})\]/)?.[1] || ({2:'C',3:'B',4:'A',5:'S'})[tier];
        if (itemRank===wantedRank) result.push(entry[1]);
    }
    return [...new Set(result)];
}
async function use(playerId, itemId) {
    await ensure();
    return database.transaction(async query => {
        if (!await query.get('SELECT id FROM jogadores WHERE id=?'+lock,[playerId])) throw new Error('Jogador não encontrado.');
        const item = await query.get('SELECT * FROM itens WHERE id=?',[itemId]);
        if (!item || !kind(item)) return {erro:'Item não reconhecido como chave ou prêmio de material.'};
        if (!await query.get('SELECT id FROM inventario_jogador WHERE jogador_id=? AND item_id=? AND quantidade>0',[playerId,itemId])) return {erro:'Você não possui este item no inventário.'};
        if (kind(item)==='key') return offer(query,playerId,rank(item),itemId);
        const pool = materials(rank(item));
        if (!pool.length) throw new Error('Não há materiais deste rank na loja. O item não foi consumido.');
        const name = pool[Math.floor(Math.random()*pool.length)];
        await query.run("INSERT INTO itens(nome,categoria,tier,descricao,consumivel) VALUES(?,'Material',?,?,0) ON CONFLICT(nome) DO NOTHING",[name,rank(item),`Material da loja de materiais, Rank ${rank(item)}.`]);
        const reward = await query.get('SELECT id FROM itens WHERE nome=?',[name]);
        await consume(query,playerId,itemId);
        await addInventory(query,playerId,reward.id);
        await database.registrarHistoricoFichaComQuery(query,{jogadorId:playerId,tipo:'Item',recurso:name,quantidade:1,descricao:`${item.nome} consumido: recebeu ${name}.`,origem:'DUNGEON_MATERIAL_ABERTO'});
        return {sucesso:true,mensagem:`Você recebeu *1 ${name} [Rank ${rank(item)}]*. Adicionado à sua ficha.`};
    });
}
async function wish(system, player) {
    await ensure();
    return database.transaction(async query => {
        const fresh = await query.get('SELECT * FROM jogadores WHERE id=?'+lock,[player.id]);
        if (!fresh) throw new Error('Jogador não encontrado.');
        if (!system.podeSortear) throw new Error('Sistema indisponível.');
        const cooldown = await system.podeSortear(fresh);
        if (!cooldown.pode) return {erro:'Você já realizou seu sorteio semanal.'};
        const success = Math.random()<0.2, now = new Date().toISOString(), newRank = fresh.rank || 'E';
        await query.run('INSERT INTO sorteios_dungeon(jogador_id,sucesso,rank,data,semana) VALUES(?,?,?,?,?)',[player.id,success?1:0,success?newRank:null,now,system.getSemanaAtual()]);
        const result = success ? await offer(query,player.id,newRank) : {sucesso:false};
        await query.run('UPDATE jogadores SET ultimo_sorteio_desejar=?,ultimo_resultado_desejar=? WHERE id=?',[now,JSON.stringify(result),player.id]);
        return result;
    });
}
module.exports = { kind, materials, use, confirm, wish, ensure };
