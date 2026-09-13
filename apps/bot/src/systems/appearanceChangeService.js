const database = require('../../../../packages/database');
const { provider } = require('../../../../packages/database/config');
let ready;
async function ensure() {
    if (!ready) ready = database.run(`CREATE TABLE IF NOT EXISTS appearance_changes (
        jogador_id BIGINT PRIMARY KEY REFERENCES jogadores(id) ON DELETE CASCADE,
        quantidade INTEGER NOT NULL DEFAULT 0 CHECK(quantidade BETWEEN 0 AND 2))`)
        .catch(error => { ready = null; throw error; });
    await ready;
    await database.ensurePlayerHistorySchema();
}
async function change(playerId, input) {
    const appearance = String(input || '').replace(/\s+/g, ' ').trim();
    if (!appearance || appearance.length > 1000) return { erro: 'Informe o nome da aparência (até 1000 caracteres).' };
    await ensure();
    return database.transaction(async query => {
        const player = await query.get('SELECT id,aparencia,ficha_aprovada FROM jogadores WHERE id=?' + (provider==='postgres' ? ' FOR UPDATE' : ''), [playerId]);
        if (!player || Number(player.ficha_aprovada)!==1) return { erro: 'Você precisa de uma ficha aprovada para trocar a aparência.' };
        if (String(player.aparencia || '').replace(/\s+/g,' ').trim().toLowerCase()===appearance.toLowerCase()) return { erro: 'Essa já é sua aparência. Nenhuma troca foi descontada.' };
        await query.run('INSERT INTO appearance_changes(jogador_id,quantidade) VALUES(?,0) ON CONFLICT(jogador_id) DO NOTHING', [playerId]);
        const count = await query.get('SELECT quantidade FROM appearance_changes WHERE jogador_id=?',[playerId]);
        if (Number(count.quantidade)>=2) return { erro: 'Você já utilizou as duas trocas de aparência da sua ficha.' };
        const updated = await query.run('UPDATE appearance_changes SET quantidade=quantidade+1 WHERE jogador_id=? AND quantidade<2',[playerId]);
        if (!updated.changes) throw new Error('Não foi possível registrar a troca.');
        await query.run('UPDATE jogadores SET aparencia=? WHERE id=?',[appearance,playerId]);
        await database.registrarHistoricoFichaComQuery(query,{jogadorId:playerId,tipo:'Ficha',direcao:'informativo',recurso:'Aparência',descricao:`Aparência alterada de ${player.aparencia || 'não informada'} para ${appearance}.`,origem:'TROCA_APARENCIA'});
        return {sucesso:true,mensagem:`Aparência alterada para *${appearance}*. Trocas utilizadas: ${Number(count.quantidade)+1}/2.`};
    });
}
module.exports = { change };
