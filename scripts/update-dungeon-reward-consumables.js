require('dotenv').config({quiet:true});
const database = require('../packages/database');
const rewards = require('../apps/bot/src/systems/dungeonRewardUseService');
async function main() {
    const items = (await database.all('SELECT id,nome FROM itens')).filter(item=>rewards.kind(item));
    await database.transaction(async query => {
        for (const item of items) await query.run('UPDATE itens SET consumivel=1,descricao=? WHERE id=?',[
            rewards.kind(item)==='key' ? 'Use !usar com o nome da chave ou !abrir chave. Somente uma dungeon instanciada ativa; troca exige confirmação.' : 'Use !usar com o nome do item para sortear um material da loja do mesmo rank.',item.id]);
    });
    console.log(`${items.length} itens de chave/material configurados como consumíveis; quantidades existentes preservadas.`);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(async()=>{
    if(require('../packages/database/config').provider==='postgres')await require('../packages/database/postgres').getPool().end();
});
