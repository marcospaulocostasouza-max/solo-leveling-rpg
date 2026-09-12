"use strict";
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const database = require('../packages/database');
const { provider } = require('../packages/database/config');
const { classificarMissoes } = require('../apps/bot/src/missions/missionAvailability');

async function reconcile(apply = false) {
    const folder = path.resolve(__dirname, '../apps/bot/src/missions/data');
    const missions = fs.readdirSync(folder).filter(f => f.endsWith('.json')).flatMap(f =>
        classificarMissoes(JSON.parse(fs.readFileSync(path.join(folder, f), 'utf8')).missoes || []));
    const items = new Map();
    const ranks = ['E', 'D', 'C', 'B', 'A', 'S'];
    for (const mission of missions) {
        const name = String(mission.recompensas?.item || '').trim();
        if (!name || name.toLowerCase() === 'nenhum') continue;
        const key = name.toLowerCase();
        const hit = items.get(key);
        // Shared rewards use the lowest mission rank that grants them.
        const rank = ranks.includes(mission.rank) ? mission.rank : 'E';
        if (!hit) items.set(key, { name, rank, sources: [mission.id] });
        else { hit.sources.push(mission.id); if (ranks.indexOf(rank) < ranks.indexOf(hit.rank)) hit.rank = rank; }
    }
    const existing = new Set((await database.all('SELECT nome FROM itens')).map(i => String(i.nome).trim().toLowerCase()));
    const missing = [...items.values()].filter(i => !existing.has(i.name.toLowerCase()));
    if (!apply) return { missing: missing.length, items: missing };
    await database.transaction(async q => {
        if (provider === 'postgres') await q.run("SELECT pg_advisory_xact_lock(73291042)");
        for (const item of missing) {
            if (await q.get('SELECT id FROM itens WHERE LOWER(TRIM(nome))=LOWER(TRIM(?))', [item.name])) continue;
            const description = `${item.name}. Recompensa de missão Rank ${item.rank}. Origem: ${item.sources.join(', ')}. Objeto de apoio narrativo; propriedades especiais devem estar previstas na ficha da missão.`;
            await q.run('INSERT INTO itens(nome,categoria,tier,descricao,valor,preco) VALUES(?,?,?,?,0,0)', [item.name, 'Item de Apoio', item.rank, description]);
        }
    });
    // Prepare compatible columns and affinity for existing offers, never changing completed payouts.
    const quest = require('../apps/bot/src/systems/questSystem');
    await quest.garantirMetadadosMissoes();
    await database.transaction(async q => {
        for (const mission of missions) await q.run("UPDATE missoes SET recompensa_vinculo=? WHERE origem_missao_id=? AND status <> 'completa' AND recompensa_vinculo=0", [mission.recompensas.vinculo, mission.id]);
    });
    return { created: missing.length, catalogMissions: missions.length };
}

module.exports = { reconcile };
if (require.main === module) reconcile(process.argv.includes('--apply')).then(result => {
    console.log(JSON.stringify(result, null, 2)); process.exit(0);
}).catch(error => { console.error(error.message); process.exit(1); });
