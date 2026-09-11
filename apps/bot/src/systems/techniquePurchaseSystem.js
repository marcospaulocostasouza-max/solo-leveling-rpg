const database = require("../../../../packages/database");
const { provider } = require("../../../../packages/database/config");
const { obterCustoMaestria } = require("./maestriaSystem");
const { obterEstiloCanonico } = require("../utils/normalizarEstiloLuta");
const normalizar = v => String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/^proficiencia em\s+/,"").trim();
const normalizarClasse = v => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

// Mapa de compatibilidade legado: nomes antigos de proficiência que foram
// reformulados na nova arquitetura. Usado para preservar personagens antigos.
const COMPAT_LEGADO = {
    "arremesso": "facas",
    "arremessos": "facas"
};

function normalizarEstilo(v) {
    const canonico = obterEstiloCanonico(v);
    if (canonico) return normalizar(canonico);
    const base = normalizar(v);
    return COMPAT_LEGADO[base] || base;
}

function compativel(jogador, tecnica) {
    const categoria = normalizar(tecnica.categoria);
    if (categoria === "proficiencia" || categoria === "proficiência" || categoria.includes("estilo de luta")) {
        const exigido = normalizarEstilo(tecnica.classe);
        // Estilo vazio não pode comprar técnicas de proficiência
        if (!exigido) return false;
        // Suporta múltiplas proficiências separadas por vírgula, " e ", "/" etc.
        const estilosJogador = String(jogador.estilo_luta || "").split(/[,;\/]|\s+e\s+/)
            .map(item => normalizarEstilo(item)).filter(Boolean);
        if (!estilosJogador.length) return false;
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
    return database.transaction(async query => {
        // Releia os dados e serialize compras do mesmo jogador na conexão da
        // transação. BEGIN IMMEDIATE não é válido no PostgreSQL.
        jogador = await query.get(provider === 'postgres'
            ? 'SELECT * FROM jogadores WHERE id=? FOR UPDATE'
            : 'SELECT * FROM jogadores WHERE id=?', [jogador.id]);
        tecnica = await query.get('SELECT * FROM tecnicas WHERE id=?', [tecnica.id]);
        if (!jogador || !tecnica) throw new Error('Jogador ou técnica não encontrada');
        if (!compativel(jogador, tecnica)) {
            const categoria = normalizar(tecnica.categoria);
            const e = new Error(categoria === 'proficiencia' ? 'Proficiência incompatível' : categoria.includes('avancada') ? 'Classe avançada incompatível' : 'Classe incompatível');
            throw e;
        }
        if (Number(jogador.nivel||1) < Number(tecnica.nivel_desbloqueio||1)) throw new Error('Nível insuficiente');
        const existe = await query.get('SELECT 1 FROM jogador_tecnicas WHERE jogador_id=? AND tecnica_id=?',[jogador.id,tecnica.id]);
        if (existe) throw new Error('já possui');
        const cost = obterCustoMaestria(tecnica);
        if (!Number.isSafeInteger(cost) || cost < 0) throw new Error('Custo de Maestria inválido');
        const saldo = Number(jogador.maestria||0);
        if (saldo < cost) throw new Error('Maestria insuficiente');
        const debito = await query.run('UPDATE jogadores SET maestria = maestria - ? WHERE id=? AND maestria >= ?',[cost,jogador.id,cost]);
        if (debito.changes !== 1) throw new Error('Maestria insuficiente');
        const atual = await query.get('SELECT maestria FROM jogadores WHERE id=?',[jogador.id]);
        await query.run('INSERT INTO jogador_tecnicas (jogador_id, tecnica_id, nivel, equipada) VALUES (?,?,1,1)',[jogador.id,tecnica.id]);
        // A consulta também fica antes do commit: uma falha aqui não pode
        // informar compra recusada depois de já descontar a Maestria.
        const restantes = await query.all(`SELECT t.custo_maestria, t.custo_qi FROM tecnicas t LEFT JOIN jogador_tecnicas jt ON jt.tecnica_id=t.id AND jt.jogador_id=? WHERE LOWER(t.classe)=LOWER(?) AND jt.id IS NULL ORDER BY t.nivel_desbloqueio,t.custo_maestria,t.id`,[jogador.id,tecnica.classe]);
        const nextCost = restantes.length ? obterCustoMaestria(restantes[0]) : 0;
        return {cost,maestria:Number(atual.maestria),nextCost};
    });
}
module.exports={comprarTecnica,compativel,normalizar};
