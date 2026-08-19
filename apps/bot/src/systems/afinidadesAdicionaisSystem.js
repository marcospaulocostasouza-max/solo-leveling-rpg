const db = require("../core/database");

const run = (sql, params = []) => new Promise((resolve, reject) =>
    db.run(sql, params, function (erro) { erro ? reject(erro) : resolve(this); })
);
const all = (sql, params = []) => new Promise((resolve, reject) =>
    db.all(sql, params, (erro, rows) => erro ? reject(erro) : resolve(rows || []))
);

async function garantirTabela() {
    await run(`CREATE TABLE IF NOT EXISTS jogador_afinidades_adicionais (
        jogador_id BIGINT NOT NULL,
        slot INTEGER NOT NULL,
        elemento TEXT NOT NULL,
        data_obtencao TEXT NOT NULL,
        PRIMARY KEY (jogador_id, slot),
        UNIQUE (jogador_id, elemento)
    )`);
}

async function listar(jogadorId) {
    await garantirTabela();
    return all(
        "SELECT slot, elemento, data_obtencao FROM jogador_afinidades_adicionais WHERE jogador_id = ? ORDER BY slot",
        [jogadorId]
    );
}

async function adicionar(jogadorId, slot, elemento) {
    await garantirTabela();
    await run(
        `INSERT INTO jogador_afinidades_adicionais (jogador_id, slot, elemento, data_obtencao)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (jogador_id, slot) DO NOTHING`,
        [jogadorId, slot, elemento, new Date().toISOString()]
    );
    const registros = await listar(jogadorId);
    return registros.find(item => Number(item.slot) === Number(slot) && item.elemento === elemento) || null;
}

async function ocupacaoExceto(jogadorId) {
    await garantirTabela();
    return all(
        `SELECT LOWER(elemento) AS elemento, COUNT(*) AS total
         FROM jogador_afinidades_adicionais
         WHERE jogador_id <> ?
         GROUP BY LOWER(elemento)`,
        [jogadorId]
    );
}

module.exports = { garantirTabela, listar, adicionar, ocupacaoExceto };
