const db = require("../core/database");
const { obterCustoMaestria } = require("./maestriaSystem");
const { obterEstiloCanonico } = require("../utils/normalizarEstiloLuta");
const get = (sql, params=[]) => new Promise((resolve,reject)=>db.get(sql,params,(e,r)=>e?reject(e):resolve(r)));
const all = (sql, params=[]) => new Promise((resolve,reject)=>db.all(sql,params,(e,r)=>e?reject(e):resolve(r||[])));
const run = (sql, params=[]) => new Promise((resolve,reject)=>db.run(sql,params,function(e){e?reject(e):resolve(this)}));
const normalizar = v => String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/^proficiencia em\s+/,"").trim();
const normalizarClasse = v => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

// Mapa de compatibilidade legado: nomes antigos de proficiência que foram
// reformulados na nova arquitetura. Usado para preservar personagens antigos.
const COMPAT_LEGADO = {
    "arremesso": "facas",
    "arremessos": "facas",
    "armas de fogo": "pistolas",
    "arma de fogo": "pistolas"
};

function normalizarEstilo(v) {
    const canonico = obterEstiloCanonico(v);
    if (canonico) return normalizar(canonico);
    const base = normalizar(v);
    return COMPAT_LEGADO[base] || base;
}

function compativel(jogador, tecnica) {
    const categoria = normalizar(tecnica.categoria);
    if (categoria === "proficiencia" || categoria === "proficiência") {
        const estilo = normalizarEstilo(jogador.estilo_luta);
        const exigido = normalizarEstilo(tecnica.classe);
        // Estilo vazio não pode comprar técnicas de proficiência
        if (!estilo || !exigido) return false;
        // Suporta múltiplas proficiências separadas por vírgula, " e ", "/" etc.
        const estilosJogador = String(estilo).split(/[,;\/]|\s+e\s+/).map(s => s.trim()).filter(Boolean);
        for (const e of estilosJogador) {
            if (!e) continue;
            // Correspondência exata após canonicalização
            if (e === exigido) return true;
            // Fallback singular/plural ("adaga" ↔ "adagas")
            if (e.replace(/s$/, "") === exigido.replace(/s$/, "") && e.length > 2) return true;
        }
        return false;
    }
    if (categoria.includes("avancada")) {
        const classeJogador = normalizarClasse(jogador.classe_avancada);
        const classeExigida = normalizarClasse(tecnica.classe);
        return Boolean(classeJogador) && classeJogador === classeExigida;
    }
    const classe = normalizar(jogador.classe);
    const exigida = normalizar(tecnica.classe);
    return classe === exigida || classe.includes(exigida) || exigida.includes(classe);
}
async function comprarTecnica(jogador, tecnica) {
    if (!compativel(jogador, tecnica)) {
        const categoria = normalizar(tecnica.categoria);
        const e = new Error(categoria === 'proficiencia' ? 'Proficiência incompatível' : categoria.includes('avancada') ? 'Classe avançada incompatível' : 'Classe incompatível');
        throw e;
    }
    if (Number(jogador.nivel||1) < Number(tecnica.nivel_desbloqueio||1)) throw new Error('Nível insuficiente');
    const existe = await get('SELECT 1 FROM jogador_tecnicas WHERE jogador_id=? AND tecnica_id=?',[jogador.id,tecnica.id]);
    if (existe) throw new Error('já possui');
    const cost = obterCustoMaestria(tecnica);
    const saldo = Number(jogador.maestria||0);
    if (saldo < cost) throw new Error('Maestria insuficiente');
    await run('BEGIN IMMEDIATE');
    try {
        await run('UPDATE jogadores SET maestria = maestria - ? WHERE id=? AND maestria >= ?',[cost,jogador.id,cost]);
        const atual = await get('SELECT maestria FROM jogadores WHERE id=?',[jogador.id]);
        if (!atual || Number(atual.maestria) > saldo-cost) throw new Error('Maestria insuficiente');
        await run('INSERT INTO jogador_tecnicas (jogador_id, tecnica_id, nivel, equipada) VALUES (?,?,1,1)',[jogador.id,tecnica.id]);
        await run('COMMIT');
        const restantes = await all(`SELECT t.custo_maestria, t.custo_qi FROM tecnicas t LEFT JOIN jogador_tecnicas jt ON jt.tecnica_id=t.id AND jt.jogador_id=? WHERE LOWER(t.classe)=LOWER(?) AND jt.id IS NULL ORDER BY t.nivel_desbloqueio,t.custo_maestria,t.id`,[jogador.id,tecnica.classe]);
        const nextCost = restantes.length ? obterCustoMaestria(restantes[0]) : 0;
        return {cost,maestria:Number(atual.maestria),nextCost};
    } catch(e) { try{await run('ROLLBACK')}catch(_){} throw e; }
}
module.exports={comprarTecnica,compativel,normalizar};
