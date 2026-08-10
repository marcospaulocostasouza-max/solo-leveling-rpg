const db = require("../core/database");
const relationshipManager = require("./relationshipManager");

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

const tabelaPronta = executar(`CREATE TABLE IF NOT EXISTS npc_gifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    npcId TEXT NOT NULL,
    jogadorId TEXT NOT NULL,
    itemId INTEGER NOT NULL,
    itemNome TEXT NOT NULL,
    reacao TEXT NOT NULL,
    deltaVinculo INTEGER NOT NULL DEFAULT 0,
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
    const item = await buscar(`SELECT i.*, inv.quantidade FROM inventario_jogador inv
        JOIN itens i ON i.id = inv.item_id
        WHERE inv.jogador_id = ? AND lower(i.nome) = lower(?) AND inv.quantidade > 0`, [jogador.id, itemNome]);
    if (!item) return { erro: "Esse item não está disponível no seu inventário." };

    const usados = await buscar(`SELECT COUNT(*) AS total FROM npc_gifts
        WHERE npcId = ? AND jogadorId = ? AND strftime('%Y-%m', data) = strftime('%Y-%m', 'now')`, [npc.id, jogador.numero]);
    if ((usados?.total || 0) >= LIMITE_PRESENTES_MES) {
        return { erro: `${npc.nome} já recebeu ${LIMITE_PRESENTES_MES} presentes neste mês.` };
    }

    const reacao = avaliarPresente(npc, item);
    const delta = reacao === "gostou" ? DELTA_PRESENTE : reacao === "desgostou" ? -DELTA_PRESENTE : 0;
    const resultado = await relationshipManager.aplicarResultadoDeCena(npc.id, jogador.numero, delta, 0);
    if (!resultado) return { erro: "Não foi possível atualizar o vínculo." };

    const removido = await executar(`UPDATE inventario_jogador SET quantidade = quantidade - 1
        WHERE jogador_id = ? AND item_id = ? AND quantidade > 0`, [jogador.id, item.id]);
    if (removido.changes === 0) return { erro: "O item não pôde ser removido do inventário." };
    await executar("DELETE FROM inventario_jogador WHERE jogador_id = ? AND item_id = ? AND quantidade <= 0", [jogador.id, item.id]);
    await executar(`INSERT INTO npc_gifts (npcId, jogadorId, itemId, itemNome, reacao, deltaVinculo)
        VALUES (?, ?, ?, ?, ?, ?)`, [npc.id, jogador.numero, item.id, item.nome, reacao, delta]);
    return { sucesso: true, item, reacao, delta, resultado };
}

module.exports = { LIMITE_PRESENTES_MES, DELTA_PRESENTE, avaliarPresente, presentear };
