const database = require('../../../../packages/database');
let schema;

function semanaAtual(date = new Date()) {
    const local = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
    const monday = new Date(`${local}T12:00:00Z`);
    monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
    return monday.toISOString().slice(0, 10);
}

async function garantirSchema() {
    if (!schema) schema = (async () => {
        await database.ensureCrystalSchema();
        await database.run(`CREATE TABLE IF NOT EXISTS dungeon_mineracoes (
            ficha_dungeon_id BIGINT PRIMARY KEY, jogador_id BIGINT NOT NULL,
            semana TEXT NOT NULL, xp INTEGER NOT NULL, resultado_json TEXT NOT NULL, data TEXT NOT NULL
        )`);
        await database.run('CREATE INDEX IF NOT EXISTS idx_dungeon_mineracoes_semana ON dungeon_mineracoes(jogador_id, semana)');
    })().catch(error => { schema = null; throw error; });
    return schema;
}

async function validar(query, jogadorId, semana = semanaAtual()) {
    const total = await query.get('SELECT COUNT(*) AS total FROM dungeon_mineracoes WHERE jogador_id=? AND semana=?', [jogadorId, semana]);
    if (Number(total?.total || 0) >= 2) throw new Error('Este jogador já concluiu duas dungeons como minerador nesta semana. Pode continuar participando nas vagas normais.');
    const picareta = await query.get(`SELECT inv.id, inv.quantidade FROM inventario_jogador inv
        JOIN itens i ON i.id=inv.item_id WHERE inv.jogador_id=? AND i.nome='Picareta do Minerador' AND inv.quantidade>0 ORDER BY inv.id LIMIT 1`, [jogadorId]);
    if (!picareta) throw new Error('O minerador precisa de uma Picareta do Minerador no inventário.');
    return { picareta, usadas: Number(total?.total || 0) };
}

// Called within the completion transaction, with the player's row locked.
// The primary key prevents another roll/payment for the same dungeon sheet.
async function entregar(query, ficha, jogador, xp, sortear) {
    const existing = await query.get('SELECT resultado_json FROM dungeon_mineracoes WHERE ficha_dungeon_id=?', [ficha.id]);
    if (existing) return JSON.parse(existing.resultado_json);
    const semana = semanaAtual();
    const { picareta, usadas } = await validar(query, jogador.id, semana);
    const sorteio = await sortear();
    const resultado = { ...sorteio, sucesso: true, encontrou: Boolean(sorteio.sucesso), minerador: jogador.nome, jogadorId: jogador.id, xp, cristais: 500, usadas: usadas + 1 };
    const consumo = await query.run('UPDATE inventario_jogador SET quantidade=quantidade-1 WHERE id=? AND quantidade>0', [picareta.id]);
    if (consumo.changes !== 1) throw new Error('A picareta não está mais disponível. Envie a ficha novamente.');
    await query.run('DELETE FROM inventario_jogador WHERE id=? AND quantidade=0', [picareta.id]);
    const now = new Date().toISOString();
    const motivo = `Mineração da Dungeon #${ficha.id}: ${ficha.dungeon_nome}`;
    await database.adicionarCristaisComQuery(query, jogador.id, resultado.cristais, motivo);
    await query.run('UPDATE jogadores SET experiencia=COALESCE(experiencia,0)+?, won=COALESCE(won,0)+? WHERE id=?', [xp, Number(sorteio.valorTotal || 0), jogador.id]);
    await query.run('INSERT INTO experiencia_historico (jogador_id,quantidade,motivo,data) VALUES (?,?,?,?)', [jogador.id, xp, motivo, now]);
    if (sorteio.valorTotal) await query.run("INSERT INTO transacoes (jogador_id,valor,tipo,motivo,data) VALUES (?,?,'ganho',?,?)", [jogador.id, sorteio.valorTotal, `${motivo}: ${sorteio.quantidade}x ${sorteio.nome}`, now]);
    await query.run('INSERT INTO dungeon_mineracoes (ficha_dungeon_id,jogador_id,semana,xp,resultado_json,data) VALUES (?,?,?,?,?,?)', [ficha.id, jogador.id, semana, xp, JSON.stringify(resultado), now]);
    return resultado;
}

module.exports = { garantirSchema, validar, entregar, semanaAtual };
