/**
 * Controla exclusividade de cenas com NPCs.
 * Um NPC só pode ter uma cena ativa e um jogador só pode estar em uma cena.
 * Após o encerramento, apenas o NPC entra em descanso narrativo de cinco horas.
 */
const db = require("../core/database");

const COOLDOWN_NPC_HORAS = 5;
const executar = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, function (erro) {
    if (erro) reject(erro); else resolve({ id: this.lastID, changes: this.changes });
}));
const obter = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (erro, linha) => erro ? reject(erro) : resolve(linha || null)));

let pronto;
function garantirTabelas() {
    if (pronto) return pronto;
    pronto = Promise.all([
        executar(`CREATE TABLE IF NOT EXISTS npc_cenas_ativas (
            npcId TEXT PRIMARY KEY, jogadorId TEXT NOT NULL UNIQUE,
            iniciadaEm TEXT DEFAULT (datetime('now'))
        )`),
        executar(`CREATE TABLE IF NOT EXISTS npc_cooldowns_cena (
            npcId TEXT PRIMARY KEY, jogadorId TEXT NOT NULL,
            finalizadaEm TEXT DEFAULT (datetime('now')), desbloqueiaEm TEXT NOT NULL
        )`)
    ]).then(() => undefined);
    return pronto;
}

function horasRestantes(data) {
    const ms = Date.parse(`${data}Z`) - Date.now();
    return Math.max(1, Math.ceil(ms / (60 * 60 * 1000)));
}

async function iniciarCena(npcId, jogadorId) {
    await garantirTabelas();
    await executar("DELETE FROM npc_cooldowns_cena WHERE desbloqueiaEm <= datetime('now')");

    const cenaJogador = await obter("SELECT npcId FROM npc_cenas_ativas WHERE jogadorId = ?", [jogadorId]);
    if (cenaJogador && cenaJogador.npcId !== npcId) return { permitido: false, motivo: "jogador_em_cena", npcId: cenaJogador.npcId };

    const cenaNpc = await obter("SELECT jogadorId FROM npc_cenas_ativas WHERE npcId = ?", [npcId]);
    if (cenaNpc && cenaNpc.jogadorId !== jogadorId) return { permitido: false, motivo: "npc_em_cena" };
    if (cenaNpc) return { permitido: true, continua: true };

    const cooldown = await obter("SELECT desbloqueiaEm FROM npc_cooldowns_cena WHERE npcId = ?", [npcId]);
    if (cooldown) return { permitido: false, motivo: "npc_em_descanso", horasRestantes: horasRestantes(cooldown.desbloqueiaEm) };

    try {
        await executar("INSERT INTO npc_cenas_ativas (npcId, jogadorId) VALUES (?, ?)", [npcId, jogadorId]);
        return { permitido: true, iniciou: true };
    } catch (erro) {
        // A chave única também protege duas tentativas simultâneas.
        const ocupada = await obter("SELECT jogadorId FROM npc_cenas_ativas WHERE npcId = ?", [npcId]);
        if (ocupada && ocupada.jogadorId !== jogadorId) return { permitido: false, motivo: "npc_em_cena" };
        throw erro;
    }
}

async function podeEncerrarCena(npcId, jogadorId) {
    await garantirTabelas();
    const cena = await obter("SELECT jogadorId FROM npc_cenas_ativas WHERE npcId = ?", [npcId]);
    if (cena && cena.jogadorId !== jogadorId) return { permitido: false, motivo: "npc_em_cena" };
    return { permitido: true, legado: !cena };
}

async function encerrarCena(npcId, jogadorId) {
    const permissao = await podeEncerrarCena(npcId, jogadorId);
    if (!permissao.permitido) return permissao;
    await executar("DELETE FROM npc_cenas_ativas WHERE npcId = ? AND jogadorId = ?", [npcId, jogadorId]);
    await executar(`INSERT INTO npc_cooldowns_cena (npcId, jogadorId, finalizadaEm, desbloqueiaEm)
        VALUES (?, ?, datetime('now'), datetime('now', '+${COOLDOWN_NPC_HORAS} hours'))
        ON CONFLICT(npcId) DO UPDATE SET jogadorId = excluded.jogadorId, finalizadaEm = excluded.finalizadaEm, desbloqueiaEm = excluded.desbloqueiaEm`, [npcId, jogadorId]);
    return { permitido: true, cooldownHoras: COOLDOWN_NPC_HORAS };
}

module.exports = { COOLDOWN_NPC_HORAS, garantirTabelas, iniciarCena, podeEncerrarCena, encerrarCena };
