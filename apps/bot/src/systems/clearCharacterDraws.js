const database = require('../../../../packages/database');
const {provider} = require('../../../../packages/database/config');
async function exists(query, table) {
    if (provider==='postgres') return Boolean((await query.get('SELECT to_regclass(?) AS name',[table]))?.name);
    return Boolean(await query.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?",[table]));
}
module.exports = async function clearCharacterDraws(number, playerId) {
    await database.transaction(async query => {
        // O primeiro sorteio pode existir antes da ficha ou do jogador.
        if (await exists(query,'afinidades_pre_ficha')) await query.run('DELETE FROM afinidades_pre_ficha WHERE numero=?',[number]);
        if (!playerId) return;
        for (const table of ['sorteios_dungeon','dungeon_key_pending']) {
            if (await exists(query,table)) await query.run(`DELETE FROM ${table} WHERE jogador_id=?`,[playerId]);
        }
        await query.run('UPDATE jogadores SET ultimo_sorteio_desejar=NULL,ultimo_resultado_desejar=NULL WHERE id=?',[playerId]);
    });
};
