"use strict";

const database = require("../../../../packages/database");
const { provider } = require("../../../../packages/database/config");
const bannerService = require("./gachaBannerService");
const LevelSystem = require("./levelSystem");

const passivas = require("../database/data/passivas.json");
const titulos = require("../database/data/titulos.json");
const CUSTOS = Object.freeze({ 1: 100, 10: 1000 });
const RANKS = new Set(["E", "D", "C", "B", "A", "S"]);
const TIPOS_ITEM = new Set(["ITEM", "EQUIPAMENTO", "ARMA", "ACESSORIO", "MATERIAL", "CONSUMIVEL", "CAIXA", "ITEM_ESPECIAL_BANNER"]);
const TIPOS_SEM_ARMAZENAMENTO = new Set(["TOKEN", "FRAGMENTOS", "PROJETO"]);

function normalizarRank(valor) {
    const rank = String(valor || "").trim().toUpperCase();
    return RANKS.has(rank) ? rank : null;
}

function sortearRecompensa(pool, rng = Math.random) {
    const elegiveis = (pool || []).filter(item => Number(item.peso) > 0 && item.ativo !== 0);
    if (!elegiveis.length) throw new Error("O pool nao possui recompensas validas.");
    const total = elegiveis.reduce((soma, item) => soma + Number(item.peso), 0);
    const amostra = Number(rng());
    if (!Number.isFinite(amostra)) throw new Error("O gerador aleatorio retornou um valor invalido.");
    let alvo = Math.max(0, Math.min(amostra, 0.9999999999999999)) * total;
    for (const item of elegiveis) {
        alvo -= Number(item.peso);
        if (alvo < 0) return item;
    }
    return elegiveis[elegiveis.length - 1];
}

async function resolverRecompensa(recompensa) {
    const tipo = recompensa.reward_type;
    const referenciaId = Number(recompensa.referencia_id);
    if (TIPOS_SEM_ARMAZENAMENTO.has(tipo)) throw new Error(`${tipo} ainda nao possui armazenamento oficial para entrega.`);
    if (TIPOS_ITEM.has(tipo)) {
        const entidade = await database.get("SELECT * FROM itens WHERE id = ?", [referenciaId]);
        if (!entidade) throw new Error(`Item da recompensa #${recompensa.id} nao existe.`);
        return { ...recompensa, entidade, nome: entidade.nome, rankRecompensa: normalizarRank(entidade.tier) };
    }
    if (tipo === "TECNICA") {
        const entidade = await database.get("SELECT * FROM tecnicas WHERE id = ?", [referenciaId]);
        if (!entidade) throw new Error(`Tecnica da recompensa #${recompensa.id} nao existe.`);
        return { ...recompensa, entidade, nome: entidade.nome, rankRecompensa: normalizarRank(entidade.rank || entidade.tier) };
    }
    if (tipo === "PASSIVA") {
        const entidade = await database.get("SELECT i.nome,i.descricao,i.efeito AS condicao,i.tier FROM banner_rare_items bri JOIN itens i ON i.id=bri.item_id WHERE bri.item_id=? AND bri.tipo='PASSIVA'", [referenciaId]) || passivas.find(item => Number(item.id) === referenciaId);
        if (!entidade) throw new Error(`Passiva da recompensa #${recompensa.id} nao existe.`);
        return { ...recompensa, entidade, nome: entidade.nome, rankRecompensa: normalizarRank(entidade.rank || entidade.tier) };
    }
    if (tipo === "TITULO") {
        const entidade = await database.get("SELECT i.nome,i.descricao,i.efeito,i.tier FROM banner_rare_items bri JOIN itens i ON i.id=bri.item_id WHERE bri.item_id=? AND bri.tipo='TITULO'", [referenciaId]) || titulos.find(item => Number(item.id) === referenciaId);
        if (!entidade) throw new Error(`Titulo da recompensa #${recompensa.id} nao existe.`);
        return { ...recompensa, entidade, nome: entidade.nome, rankRecompensa: normalizarRank(entidade.rank || entidade.tier) };
    }
    if (tipo === "CONJUNTO_ITEM") {
        const entidade = await database.get("SELECT * FROM gacha_item_sets WHERE id = ?", [referenciaId]);
        const itens = await database.all("SELECT i.*, e.quantidade AS quantidade_conjunto FROM gacha_item_set_entries e JOIN itens i ON i.id = e.item_id WHERE e.conjunto_id = ?", [referenciaId]);
        if (!entidade || !itens.length) throw new Error(`Conjunto da recompensa #${recompensa.id} esta vazio ou nao existe.`);
        const ranks = new Set(itens.map(item => normalizarRank(item.tier)).filter(Boolean));
        return { ...recompensa, entidade, itens, nome: entidade.nome, rankRecompensa: ranks.size === 1 ? [...ranks][0] : null };
    }
    if (["MAESTRIA", "XP", "WON", "CRISTAIS"].includes(tipo)) return { ...recompensa, nome: tipo, rankRecompensa: null };
    throw new Error(`Tipo ${tipo} nao possui entrega implementada.`);
}

async function adicionarItem(query, jogadorId, itemId, quantidade) {
    const existente = await query.get("SELECT id FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogadorId, itemId]);
    if (existente) await query.run("UPDATE inventario_jogador SET quantidade = quantidade + ? WHERE id = ?", [quantidade, existente.id]);
    else await query.run("INSERT INTO inventario_jogador (jogador_id, item_id, quantidade, equipado) VALUES (?, ?, ?, 0)", [jogadorId, itemId, quantidade]);
}

async function adicionarXp(query, jogador, quantidade) {
    let nivel = Number(jogador.nivel) || 1;
    let xp = Number(jogador.experiencia) || 0;
    xp += quantidade;
    while (nivel < 100 && xp >= LevelSystem.getXpNecessario(nivel)) {
        xp -= LevelSystem.getXpNecessario(nivel);
        nivel++;
    }
    const ganhos = nivel - Number(jogador.nivel || 1);
    if (!ganhos) return query.run("UPDATE jogadores SET experiencia = ? WHERE id = ?", [xp, jogador.id]);
    const ordemRanks = ["E", "D", "C", "B", "A", "S"];
    let novoRank = normalizarRank(jogador.rank) || "E";
    let pontosRank = 0;
    let wonRank = 0;
    for (let i = ordemRanks.indexOf(novoRank) + 1; i < ordemRanks.length; i++) {
        const candidato = ordemRanks[i];
        if (nivel < LevelSystem.getRequisitosRank(candidato).nivel) break;
        novoRank = candidato;
        const bonus = LevelSystem.getBonusRank(candidato) || { pontos: 0, won: 0 };
        pontosRank += Number(bonus.pontos || 0);
        wonRank += Number(bonus.won || 0);
    }
    await query.run(`UPDATE jogadores SET nivel = ?, experiencia = ?, pontos_atributo = COALESCE(pontos_atributo, 0) + ?,
        forca_base = COALESCE(forca_base, 0) + ?, resistencia_base = COALESCE(resistencia_base, 0) + ?,
        velocidade_base = COALESCE(velocidade_base, 0) + ?, sentidos_base = COALESCE(sentidos_base, 0) + ?,
        inteligencia_base = COALESCE(inteligencia_base, 0) + ?, poder_magico_base = COALESCE(poder_magico_base, 0) + ?,
        rank = ?, won = COALESCE(won, 0) + ? WHERE id = ?`,
    [nivel, xp, ganhos * 3 + pontosRank, ganhos, ganhos, ganhos, ganhos, ganhos, ganhos, novoRank, wonRank, jogador.id]);
    await database.recalculateAttributes(jogador.id, query);
    await query.run("UPDATE jogadores SET mana_atual = mana_maxima, vida_atual = vida_maxima WHERE id = ?", [jogador.id]);
    jogador.nivel = nivel;
    jogador.experiencia = xp;
    jogador.rank = novoRank;
}

function normalizarTexto(valor) {
    return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

async function jaPossuiRecompensaUnica(query, jogador, recompensa) {
    if (Number(recompensa.unica) !== 1) return false;
    const referencia = String(recompensa.referencia_id);
    if (await query.get("SELECT 1 FROM gacha_unique_ownership WHERE jogador_id = ? AND reward_type = ? AND referencia_id = ?", [jogador.id, recompensa.reward_type, referencia])) return true;
    if (TIPOS_ITEM.has(recompensa.reward_type)) return Boolean(await query.get("SELECT 1 FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogador.id, Number(referencia)]));
    if (recompensa.reward_type === "TECNICA") return Boolean(await query.get("SELECT 1 FROM jogador_tecnicas WHERE jogador_id = ? AND tecnica_id = ?", [jogador.id, Number(referencia)]));
    if (recompensa.reward_type === "TITULO") return normalizarTexto(jogador.titulo) === normalizarTexto(recompensa.entidade.nome);
    if (recompensa.reward_type === "PASSIVA") {
        let atuais = [];
        try { atuais = JSON.parse(jogador.passivas_ativas || "[]"); } catch (_) { atuais = []; }
        return atuais.some(item => normalizarTexto(item.nome) === normalizarTexto(recompensa.entidade.nome));
    }
    return false;
}

async function registrarPropriedadeUnica(query, jogadorId, recompensa) {
    if (Number(recompensa.unica) !== 1) return;
    await query.run("INSERT INTO gacha_unique_ownership (jogador_id, reward_type, referencia_id) VALUES (?, ?, ?) ON CONFLICT(jogador_id, reward_type, referencia_id) DO NOTHING", [jogadorId, recompensa.reward_type, String(recompensa.referencia_id)]);
}

async function entregar(query, jogador, recompensa) {
    const quantidade = Number(recompensa.quantidade);
    const tipo = recompensa.reward_type;
    const duplicata = await jaPossuiRecompensaUnica(query, jogador, recompensa);
    if (duplicata) {
        const fragmentos = Number(recompensa.duplicate_fragment_value);
        if (!Number.isSafeInteger(fragmentos) || fragmentos <= 0) throw new Error(`Recompensa unica #${recompensa.id} sem conversao valida.`);
        await database.adicionarFragmentosInvocacaoComQuery(query, jogador.id, fragmentos, `GACHA_DUPLICATA:${recompensa.id}`);
        return { duplicata: true, recompensaEntregue: "FRAGMENTOS_INVOCACAO", fragmentosInvocacaoRecebidos: fragmentos };
    }
    if (TIPOS_ITEM.has(tipo)) await adicionarItem(query, jogador.id, Number(recompensa.referencia_id), quantidade);
    else if (tipo === "CONJUNTO_ITEM") {
        for (const item of recompensa.itens) await adicionarItem(query, jogador.id, Number(item.id), Number(item.quantidade_conjunto) * quantidade);
    }
    else if (tipo === "WON" || tipo === "MAESTRIA") {
        const coluna = tipo === "WON" ? "won" : "maestria";
        await query.run(`UPDATE jogadores SET ${coluna} = COALESCE(${coluna}, 0) + ? WHERE id = ?`, [quantidade, jogador.id]);
    }
    else if (tipo === "CRISTAIS") await database.adicionarCristaisComQuery(query, jogador.id, quantidade, "GACHA_RECOMPENSA");
    else if (tipo === "XP") await adicionarXp(query, jogador, quantidade);
    else if (tipo === "TECNICA") {
        const possui = await query.get("SELECT id FROM jogador_tecnicas WHERE jogador_id = ? AND tecnica_id = ?", [jogador.id, Number(recompensa.referencia_id)]);
        if (!possui) await query.run("INSERT INTO jogador_tecnicas (jogador_id, tecnica_id, nivel, experiencia) VALUES (?, ?, 1, 0)", [jogador.id, Number(recompensa.referencia_id)]);
    }
    else if (tipo === "TITULO") { await query.run("UPDATE jogadores SET titulo = ? WHERE id = ?", [recompensa.entidade.nome, jogador.id]); jogador.titulo = recompensa.entidade.nome; }
    else if (tipo === "PASSIVA") {
        let atuais = [];
        try { atuais = JSON.parse(jogador.passivas_ativas || "[]"); } catch (_) { atuais = []; }
        const existentes = atuais.filter(item => item.nome === recompensa.entidade.nome).length;
        if (existentes + quantidade > 10) throw new Error(`Limite de 10 acumulacoes da passiva ${recompensa.entidade.nome}.`);
        for (let i = 0; i < quantidade; i++) atuais.push({
            nome: recompensa.entidade.nome, descricao: recompensa.entidade.descricao,
            categoria: recompensa.entidade.categoria, condicao: recompensa.entidade.condicao,
            data_ativacao: new Date().toISOString()
        });
        jogador.passivas_ativas = JSON.stringify(atuais);
        await query.run("UPDATE jogadores SET passivas_ativas = ? WHERE id = ?", [jogador.passivas_ativas, jogador.id]);
    }
    else throw new Error(`Tipo ${tipo} nao pode ser entregue.`);
    await registrarPropriedadeUnica(query, jogador.id, recompensa);
    return { duplicata: false, recompensaEntregue: tipo, fragmentosInvocacaoRecebidos: 0 };
}

function aplicarPity(sorteadasBase, pityInicial, grandePremio) {
    let pity = pityInicial;
    return sorteadasBase.map(itemBase => {
        const pityAntes = pity;
        const pityForcado = pity === 99;
        const item = pityForcado ? grandePremio : itemBase;
        pity = Number(item.grande_premio) === 1 ? 0 : pity + 1;
        return { ...item, pityAntes, pityDepois: pity, pityForcado, garantidoRank: false };
    });
}

function prepararSorteios(pool, quantidade, rank, pityInicial, rng) {
    const grandePremio = pool.find(item => Number(item.grande_premio) === 1);
    if (!grandePremio) throw new Error("O Banner nao possui Grande Premio.");
    const base = Array.from({ length: quantidade }, () => sortearRecompensa(pool, rng));
    let resultados = aplicarPity(base, pityInicial, grandePremio);
    if (quantidade === 10 && !resultados.some(item => item.rankRecompensa === rank)) {
        const poolRank = pool.filter(item => item.rankRecompensa === rank);
        if (!poolRank.length) throw new Error(`Nao existe recompensa elegivel exatamente para o Rank ${rank}.`);
        let aplicado = false;
        for (let indice = base.length - 1; indice >= 0; indice--) {
            if (resultados[indice].pityForcado) continue;
            base[indice] = sortearRecompensa(poolRank, rng);
            resultados = aplicarPity(base, pityInicial, grandePremio);
            if (resultados.some(item => item.rankRecompensa === rank)) { aplicado = true; break; }
        }
        if (!aplicado) throw new Error("Nao foi possivel conciliar a garantia de Rank com o Pity.");
    }
    if (quantidade === 10) {
        const garantido = resultados.find(item => item.rankRecompensa === rank);
        if (garantido) garantido.garantidoRank = true;
    }
    return resultados;
}

async function realizarGiros(playerId, bannerId, quantidade, opcoes = {}) {
    const giros = Number(quantidade);
    if (![1, 10].includes(giros)) throw new Error("A quantidade deve ser exatamente 1 ou 10.");
    await database.ensureGachaEngineSchema();
    const validacao = await bannerService.validarBanner(bannerId);
    if (!validacao.valido) throw new Error(`Banner invalido: ${validacao.erros.join(" ")}`);
    if (!bannerService.estaNoPeriodo(validacao.banner, opcoes.agora || new Date())) throw new Error("Banner indisponivel no momento.");
    const pool = await Promise.all(validacao.pool.map(resolverRecompensa));
    const jogadorAntes = await database.get("SELECT * FROM jogadores WHERE id = ?", [Number(playerId)]);
    if (!jogadorAntes) throw new Error("Jogador nao encontrado.");
    const rank = normalizarRank(jogadorAntes.rank);
    if (!rank) throw new Error("O jogador nao possui um Rank valido entre E e S.");
    const rng = opcoes.rng || Math.random;
    if (giros === 10 && !pool.some(item => item.rankRecompensa === rank)) throw new Error(`Nao existe recompensa elegivel exatamente para o Rank ${rank}.`);
    const custo = CUSTOS[giros];
    return database.transaction(async query => {
        const jogador = await query.get(provider === "postgres" ? "SELECT * FROM jogadores WHERE id = ? FOR UPDATE" : "SELECT * FROM jogadores WHERE id = ?", [Number(playerId)]);
        if (!jogador) throw new Error("Jogador nao encontrado.");
        const bannerAtual = await query.get("SELECT * FROM gacha_banners WHERE id = ?", [Number(bannerId)]);
        if (!bannerAtual || !bannerService.estaNoPeriodo(bannerAtual, opcoes.agora || new Date())) throw new Error("Banner indisponivel no momento.");
        if (normalizarRank(jogador.rank) !== rank) throw new Error("O Rank do jogador mudou durante a operacao; tente novamente.");
        const pityInicial = await database.consultarPityGacha(jogador.id, Number(bannerId), query);
        const sorteadas = prepararSorteios(pool, giros, rank, pityInicial, rng);
        const saldoAnterior = Number(jogador.cristais || 0);
        const debito = await database.removerCristaisComQuery(query, jogador.id, custo, `GACHA:${bannerId}`);
        const entregas = [];
        for (const recompensa of sorteadas) entregas.push(await entregar(query, jogador, recompensa));
        const pityFinal = sorteadas[sorteadas.length - 1].pityDepois;
        await query.run("INSERT INTO gacha_pity (jogador_id, banner_id, contador, atualizado_em) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(jogador_id, banner_id) DO UPDATE SET contador = excluded.contador, atualizado_em = CURRENT_TIMESTAMP", [jogador.id, Number(bannerId), pityFinal]);
        const saldoAtual = Number((await query.get("SELECT cristais FROM jogadores WHERE id = ?", [jogador.id])).cristais);
        const sqlOperacao = "INSERT INTO gacha_operacoes (jogador_id, banner_id, quantidade_giros, custo_cristais, saldo_anterior, saldo_atual, banner_nome, jogador_nome) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        const operacao = await query.run(provider === "postgres" ? `${sqlOperacao} RETURNING id` : sqlOperacao, [jogador.id, Number(bannerId), giros, custo, saldoAnterior, saldoAtual, validacao.banner.nome, jogador.nome]);
        const operacaoId = Number(operacao.lastID);
        const resultados = [];
        for (let i = 0; i < sorteadas.length; i++) {
            const item = sorteadas[i];
            const entrega = entregas[i];
            await query.run("INSERT INTO gacha_resultados (operacao_id, posicao, reward_id, reward_type, referencia_id, quantidade, nome, raridade, destaque_ordem, grande_premio, garantido_rank, rank_recompensa, pity_antes, pity_depois, pity_forcado, duplicata, recompensa_entregue, fragmentos_invocacao_recebidos, custo_associado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [operacaoId, i + 1, item.id, item.reward_type, item.referencia_id, item.quantidade, item.nome, item.raridade, item.destaque_ordem, Number(item.grande_premio), item.garantidoRank ? 1 : 0, item.rankRecompensa, item.pityAntes, item.pityDepois, item.pityForcado ? 1 : 0, entrega.duplicata ? 1 : 0, entrega.recompensaEntregue, entrega.fragmentosInvocacaoRecebidos, 100]);
            resultados.push({ tipo: item.reward_type, nome: item.nome, quantidade: Number(item.quantidade), raridade: item.raridade || null, destaque: item.destaque_ordem == null ? null : Number(item.destaque_ordem), grandePremio: Number(item.grande_premio) === 1, garantidoRank: item.garantidoRank, rank: item.rankRecompensa, pityAntes: item.pityAntes, pityDepois: item.pityDepois, pityForcado: item.pityForcado, duplicata: entrega.duplicata, recompensaOriginal: { tipo: item.reward_type, nome: item.nome, referenciaId: item.referencia_id, quantidade: Number(item.quantidade) }, recompensaEntregue: entrega.recompensaEntregue, fragmentosInvocacaoRecebidos: entrega.fragmentosInvocacaoRecebidos });
        }
        return { sucesso: true, operacaoId, banner: { id: Number(validacao.banner.id), nome: validacao.banner.nome }, quantidade: giros, custo, saldoAnterior, saldoAtual, pityAntes: pityInicial, pityDepois: pityFinal, resultados, debito };
    });
}

module.exports = { CUSTOS, normalizarRank, sortearRecompensa, resolverRecompensa, aplicarPity, prepararSorteios, realizarGiros };
