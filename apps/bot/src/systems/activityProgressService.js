const db = require("../core/database");
const { provider } = require("../../../../packages/database/config");

let schemaPromise = null;

function run(sql, params = []) {
    return new Promise((resolve, reject) => db.run(sql, params, erro => erro ? reject(erro) : resolve()));
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => db.all(sql, params, (erro, linhas) => erro ? reject(erro) : resolve(linhas || [])));
}

async function ensureSchema() {
    if (schemaPromise) return schemaPromise;
    const sql = provider === "postgres"
        ? `CREATE TABLE IF NOT EXISTS atividades_registro (
            id BIGSERIAL PRIMARY KEY, jogador_id BIGINT, jogador_nome TEXT, tipo TEXT,
            descricao TEXT, recompensa_qi BIGINT DEFAULT 0, recompensa_xp BIGINT DEFAULT 0,
            recompensa_won BIGINT DEFAULT 0, aprovado_por TEXT, data TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`
        : `CREATE TABLE IF NOT EXISTS atividades_registro (
            id INTEGER PRIMARY KEY AUTOINCREMENT, jogador_id INTEGER, jogador_nome TEXT, tipo TEXT,
            descricao TEXT, recompensa_qi INTEGER DEFAULT 0, recompensa_xp INTEGER DEFAULT 0,
            recompensa_won INTEGER DEFAULT 0, aprovado_por TEXT, data TEXT
        )`;
    schemaPromise = run(sql).catch(erro => { schemaPromise = null; throw erro; });
    return schemaPromise;
}

function inicioDoDia(data = new Date()) {
    const inicio = new Date(data);
    inicio.setHours(0, 0, 0, 0);
    return inicio;
}

function inicioDaSemana(data = new Date()) {
    const inicio = inicioDoDia(data);
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    return inicio;
}

function dataValida(valor) {
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
}

async function registros(jogadorId, tipo) {
    await ensureSchema();
    return all("SELECT descricao, data FROM atividades_registro WHERE jogador_id = ? AND tipo = ? ORDER BY data DESC", [jogadorId, tipo]);
}

async function limiteNoPeriodo(jogadorId, tipo, inicio, limite) {
    const usados = (await registros(jogadorId, tipo)).filter(registro => {
        const data = dataValida(registro.data);
        return data && data >= inicio;
    });
    return { permitido: usados.length < limite, usados: usados.length, limite, registros: usados };
}

function mensagemLimite(nome, atividade, usados, limite, disponivelEm) {
    const quando = disponivelEm ? ` Próxima disponibilidade: ${disponivelEm.toLocaleString("pt-BR")}.` : "";
    return `*ATIVIDADE EM COOLDOWN*\n\n*${nome}* já possui ${usados}/${limite} ${atividade} no período permitido.${quando}`;
}

async function validarQuestDiaria(jogador) {
    const hoje = await limiteNoPeriodo(jogador.id, "quest_diaria", inicioDoDia(), 1);
    if (!hoje.permitido) {
        const amanha = inicioDoDia(); amanha.setDate(amanha.getDate() + 1);
        return { permitido: false, mensagem: mensagemLimite(jogador.nome, "Quest Diária", hoje.usados, 1, amanha) };
    }
    const semana = await limiteNoPeriodo(jogador.id, "quest_diaria", inicioDaSemana(), 4);
    if (!semana.permitido) {
        const proximaSemana = inicioDaSemana(); proximaSemana.setDate(proximaSemana.getDate() + 7);
        return { permitido: false, mensagem: mensagemLimite(jogador.nome, "Quest Diária", semana.usados, 4, proximaSemana) };
    }
    return { permitido: true };
}

async function validarLimiteSemanal(jogador, tipo, atividade) {
    const resultado = await limiteNoPeriodo(jogador.id, tipo, inicioDaSemana(), 2);
    if (resultado.permitido) return { permitido: true };
    const proximaSemana = inicioDaSemana(); proximaSemana.setDate(proximaSemana.getDate() + 7);
    return { permitido: false, mensagem: mensagemLimite(jogador.nome, atividade, resultado.usados, 2, proximaSemana) };
}

async function validarOnePost(jogador) {
    const inicio = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const resultado = await limiteNoPeriodo(jogador.id, "one_post", inicio, 1);
    if (resultado.permitido) return { permitido: true };
    const ultima = dataValida(resultado.registros[0]?.data);
    const disponivel = ultima ? new Date(ultima.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
    return { permitido: false, mensagem: mensagemLimite(jogador.nome, "One Post", resultado.usados, 1, disponivel) };
}

async function validarTreinoMaestria(jogador, dias) {
    const ultimo = (await registros(jogador.id, "treino_maestria"))[0];
    if (!ultimo) return { permitido: true };
    const data = dataValida(ultimo.data);
    const match = String(ultimo.descricao || "").match(/Dura(?:ç|c)ão:\s*(1|7|15|30)\s*dias?/i);
    const diasDoUltimoTreino = Number(match?.[1] || dias);
    const disponivel = data ? new Date(data.getTime() + diasDoUltimoTreino * 24 * 60 * 60 * 1000) : null;
    if (!disponivel || new Date() >= disponivel) return { permitido: true };
    return { permitido: false, mensagem: `*TREINO DE MAESTRIA EM COOLDOWN*\n\n*${jogador.nome}* concluiu um treino de ${diasDoUltimoTreino} dia(s). Este treino pode ser aprovado novamente em ${disponivel.toLocaleString("pt-BR")}.` };
}

function resumoRecompensas(recompensas = []) {
    return recompensas.map(recompensa => `+${recompensa.valor} ${recompensa.tipo}`).join("; ");
}

async function registrarAtividade({ jogador, tipo, nomeAtividade, recompensas, adminNumero, duracaoDias = null }) {
    await ensureSchema();
    const porTipo = chave => recompensas.filter(item => item.tipo === chave).reduce((total, item) => total + (Number(item.valor) || 0), 0);
    const duracao = duracaoDias ? ` Duração: ${duracaoDias} dia${duracaoDias === 1 ? "" : "s"}.` : "";
    const descricao = `${nomeAtividade}.${duracao} Recompensas: ${resumoRecompensas(recompensas)}.`;
    await run(
        "INSERT INTO atividades_registro (jogador_id, jogador_nome, tipo, descricao, recompensa_qi, recompensa_xp, recompensa_won, aprovado_por, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [jogador.id, jogador.nome, tipo, descricao, porTipo("Maestria"), porTipo("XP"), porTipo("Won"), adminNumero, new Date().toISOString()]
    );
}

module.exports = {
    ensureSchema,
    validarQuestDiaria,
    validarLimiteSemanal,
    validarOnePost,
    validarTreinoMaestria,
    registrarAtividade
};
