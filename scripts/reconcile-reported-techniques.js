"use strict";
require('dotenv').config({ quiet: true });
const database = require('../packages/database');
async function reconcile(query) {
    const corrections = [
        ['Ponto Fraco', 'Assassino', 13],
        ['Marca da Execução', 'Assassino', 9]
    ];
    for (const [name, classe, level] of corrections) await query.run('UPDATE tecnicas SET nivel_desbloqueio=? WHERE nome=? AND classe=?', [level, name, classe]);
    for (const [name, classe] of [['Ponto Fraco [Passivo]', 'Assassino'], ['Marca daExecução', 'Assassino'], ['Slow Motion', 'Mago de Maldição']]) await query.run("UPDATE tecnicas SET categoria='Legada' WHERE nome=? AND classe=?", [name, classe]);
}
if (require.main === module) database.transaction(reconcile).then(() => { console.log('Catálogo reconciliado; técnicas já aprendidas preservadas.'); process.exit(0); }).catch(error => { console.error(error.message); process.exit(1); });
module.exports = { reconcile };
