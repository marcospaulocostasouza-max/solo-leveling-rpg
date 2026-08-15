const db = require("../core/database");
const relationshipManager = require("./relationshipManager");
const sharedDatabase = require("../../../../packages/database");
const { provider } = require("../../../../packages/database/config");

const LIMITE_PRESENTES_MES = 2;
const DELTA_PRESENTE = 5;

const normalizar = (texto) => String(texto || "").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase();

function executar(sql, params = []) {
    return new Promise((resolve, reject) => db.run(sql, params, function (err) {
        err ? reject(err) : resolve(this);
    }));
}
function buscar(sql, params = []) {
    return new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row || null)));
}

const colunaId = provider === "postgres" ? "BIGSERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT";
const tabelaPronta = executar(`CREATE TABLE IF NOT EXISTS npc_gifts (
    id ${colunaId},
    "npcId" TEXT NOT NULL,
    "jogadorId" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "itemNome" TEXT NOT NULL,
    reacao TEXT NOT NULL,
    "deltaVinculo" INTEGER NOT NULL DEFAULT 0,
    data TEXT DEFAULT (datetime('now'))
)`);

function palavrasDoNPC(npc) {
    return normalizar([
        npc.classe, npc.classe_avancada, npc.estilo_luta, npc.elemento,
        npc.profissao, npc.objetivos, npc.valores, npc.personalidade, npc.historia
    ].join(" "));
}

function avaliarPresente(npc, item) {
    const perfil = palavrasDoNPC(npc);
    const presente = normalizar([item.nome, item.categoria, item.descricao, item.efeito, item.habilidade].join(" "));
    const gostaMagia = /mago|magia|elemental|clerig|alquim|feitic/.test(perfil) && /cajado|cetro|grimorio|pergaminho|amuleto|cristal|talism/.test(presente);
    const gostaCombate = /espada|adaga|arco|besta|lanca|machado|martelo|foice|katana|manopla|pistola|rifle|cajado|cetro/.test(perfil) &&
        /espada|adaga|arco|besta|lanca|machado|martelo|foice|katana|manopla|pistola|rifle|cajado|cetro/.test(presente);
    const gostaPesquisa = /estud|pesquis|bibliotec|erudit|conhec/.test(perfil) && /pergaminho|grimorio|cristal|amuleto|dossie|mapa/.test(presente);
    const rejeitaCrueldade = /justic|proteg|bondos|cura|inocent/.test(perfil) && /veneno|corrup|maldito|tortura/.test(presente);
    const rejeitaSagrado = /sombra|corrupt|assassin|cruel/.test(perfil) && /bencao|sagrado|cura|templo/.test(presente);

    if (rejeitaCrueldade || rejeitaSagrado) return "desgostou";
    if (gostaMagia || gostaCombate || gostaPesquisa) return "gostou";
    return "indiferente";
}

async function presentear({ npc, jogador, itemNome }) {
    await tabelaPronta;
    await relationshipManager.garantirTabela();
    try {
        return await sharedDatabase.transaction(async query => {
            const item = await query.get(`SELECT i.*, inv.quantidade FROM inventario_jogador inv
                JOIN itens i ON i.id = inv.item_id
                WHERE inv.jogador_id = ? AND lower(i.nome) = lower(?) AND inv.quantidade > 0`, [jogador.id, itemNome]);
            if (!item) throw new Error("Esse item não está disponível no seu inventário.");

            const inicioMes = new Date();
            inicioMes.setUTCDate(1); inicioMes.setUTCHours(0, 0, 0, 0);
            const usados = await query.get(`SELECT COUNT(*) AS total FROM npc_gifts
                WHERE "npcId" = ? AND "jogadorId" = ? AND data >= ?`, [npc.id, jogador.numero, inicioMes.toISOString()]);
            if (Number(usados?.total || 0) >= LIMITE_PRESENTES_MES) throw new Error(`${npc.nome} já recebeu ${LIMITE_PRESENTES_MES} presentes neste mês.`);

            const reacao = avaliarPresente(npc, item);
            const delta = reacao === "gostou" ? DELTA_PRESENTE : reacao === "desgostou" ? -DELTA_PRESENTE : 0;
            let rel = await query.get('SELECT * FROM npc_relationships WHERE "npcId" = ? AND "jogadorId" = ?', [npc.id, jogador.numero]);
            if (!rel) {
                await query.run('INSERT INTO npc_relationships ("npcId", "jogadorId", vinculo, hostilidade, "ultimaAtualizacao") VALUES (?, ?, 0, 0, datetime(\'now\'))', [npc.id, jogador.numero]);
                rel = { vinculo: 0, hostilidade: 0 };
            }
            const vinculoAntes = Number(rel.vinculo || 0);
            const vinculoDepois = Math.max(0, Math.min(100, vinculoAntes + delta));
            await query.run('UPDATE npc_relationships SET vinculo = ?, "ultimaAtualizacao" = datetime(\'now\') WHERE "npcId" = ? AND "jogadorId" = ?', [vinculoDepois, npc.id, jogador.numero]);

            const removido = await query.run(`UPDATE inventario_jogador SET quantidade = quantidade - 1
                WHERE jogador_id = ? AND item_id = ? AND quantidade > 0`, [jogador.id, item.id]);
            if (removido.changes !== 1) throw new Error("O item não pôde ser removido do inventário.");
            await query.run("DELETE FROM inventario_jogador WHERE jogador_id = ? AND item_id = ? AND quantidade <= 0", [jogador.id, item.id]);
            await query.run(`INSERT INTO npc_gifts ("npcId", "jogadorId", "itemId", "itemNome", reacao, "deltaVinculo")
                VALUES (?, ?, ?, ?, ?, ?)`, [npc.id, jogador.numero, item.id, item.nome, reacao, delta]);
            return { sucesso: true, item, reacao, delta, resultado: { vinculoAntes, vinculoDepois, vinculoGanho: vinculoDepois - vinculoAntes } };
        });
    } catch (erro) {
        return { erro: erro.message || "Não foi possível processar o presente." };
    }
}

module.exports = { LIMITE_PRESENTES_MES, DELTA_PRESENTE, avaliarPresente, presentear };
