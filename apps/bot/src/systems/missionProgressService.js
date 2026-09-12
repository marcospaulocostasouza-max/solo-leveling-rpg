"use strict";
const database = require("../../../../packages/database");
const { provider } = require("../../../../packages/database/config");

async function entregar(jogadorId, missaoId, relato) {
    const texto = String(relato || '').trim();
    await require('./questSystem').garantirMetadadosMissoes();
    const result = await database.run("UPDATE missoes SET status='em_avaliacao',relato_entrega=?,entregue_em=? WHERE id=? AND jogador_id=? AND status='ativa'", [texto, new Date().toISOString(), missaoId, jogadorId]);
    if (result.changes !== 1) throw new Error('A missão precisa estar ativa e ainda não ter sido entregue.');
    return { sucesso: true };
}

async function concluir(jogadorId, missaoId, { aprovadoPor, cena = "" } = {}) {
    if (!aprovadoPor || !await require('../core/adminCore').isAdmin(aprovadoPor)) throw new Error('Somente a ADM pode aprovar miss\u00f5es.');
    await require('./questSystem').garantirMetadadosMissoes();
    await require('../npc/relationshipManager').garantirTabela();
    const resultado = await database.transaction(async q => {
        const player = await q.get(provider === 'postgres' ? 'SELECT id,numero FROM jogadores WHERE id=? FOR UPDATE' : 'SELECT id,numero FROM jogadores WHERE id=?', [jogadorId]);
        if (!player) throw new Error('Jogador não encontrado.');
        const missao = await q.get('SELECT * FROM missoes WHERE id=? AND jogador_id=?', [missaoId,jogadorId]);
        if (!missao) throw new Error('Missão não encontrada.');
        if (missao.status === 'completa') return { completa: true, duplicada: true, recompensa: null };
        if (!['ativa','em_avaliacao'].includes(missao.status)) throw new Error('A miss\u00e3o precisa ter sido aceita pelo jogador antes da aprova\u00e7\u00e3o.');
        let item;
        if (missao.recompensa_item && missao.recompensa_item.toLowerCase() !== 'nenhum') {
            item = await q.get('SELECT id FROM itens WHERE LOWER(nome)=LOWER(?)', [missao.recompensa_item]);
            if (!item) throw new Error(`Recompensa ainda não cadastrada: ${missao.recompensa_item}. A ADM precisa cadastrar o item antes de concluir; nada foi pago.`);
        }
        const xp = Number(missao.recompensa_xp || 0), won = Number(missao.recompensa_won || 0);
        if (![xp,won].every(n => Number.isSafeInteger(n) && n >= 0)) throw new Error('Recompensa inválida.');
        const now = new Date().toISOString();
        await q.run(`UPDATE missoes SET status='completa', progresso=objetivo,
            aprovada_por=?, aprovada_em=?, cena_aprovada=?,
            reacao_npc_pendente_em=?, reacao_npc_entregue_em=NULL WHERE id=? AND jogador_id=?`,
            [aprovadoPor, now, String(cena || missao.relato_entrega || ''), missao.npc_id ? now : null, missaoId, jogadorId]);
        await q.run('INSERT INTO experiencia_historico(jogador_id,quantidade,motivo,data) VALUES(?,?,?,?)', [jogadorId,xp,`Miss\u00e3o: ${missao.nome}`,now]);
        const vinculo = Number(missao.recompensa_vinculo || 0);
        if (!Number.isSafeInteger(vinculo) || vinculo < 0 || vinculo > 100) throw new Error('Recompensa de v\u00ednculo inv\u00e1lida.');
        if (missao.npc_id && vinculo) {
            await q.run('INSERT INTO npc_relationships("npcId","jogadorId",vinculo,hostilidade) VALUES(?,?,0,0) ON CONFLICT DO NOTHING', [missao.npc_id,player.numero]);
            const rel = await q.get('SELECT * FROM npc_relationships WHERE "npcId"=? AND "jogadorId"=?' + (provider==='postgres'?' FOR UPDATE':''), [missao.npc_id,player.numero]);
            await q.run('UPDATE npc_relationships SET vinculo=?,hostilidade=?,"ultimaAtualizacao"=? WHERE "npcId"=? AND "jogadorId"=?', [Math.min(100,Number(rel.vinculo || 0)+vinculo),Math.max(0,Number(rel.hostilidade || 0)-Math.round(vinculo*0.3)),now,missao.npc_id,player.numero]);
        }
        await q.run('UPDATE jogadores SET experiencia=experiencia+?,won=won+? WHERE id=?', [xp,won,jogadorId]);
        await q.run("INSERT INTO transacoes(jogador_id,valor,tipo,motivo,data) VALUES(?,?,'ganho',?,CURRENT_TIMESTAMP)", [jogadorId,won,`Missão: ${missao.nome}`]);
        if (item) {
            const inv = await q.get('SELECT id FROM inventario_jogador WHERE jogador_id=? AND item_id=?', [jogadorId,item.id]);
            if (inv) await q.run('UPDATE inventario_jogador SET quantidade=quantidade+1 WHERE id=?',[inv.id]);
            else await q.run('INSERT INTO inventario_jogador(jogador_id,item_id,quantidade,equipado) VALUES(?,?,1,0)',[jogadorId,item.id]);
        }
        const service = require('./crystalRewardService');
        const cristais = await service.conceder({ jogadorId, quantidade: Number(missao.recompensa_cristais || 0), origem: service.ORIGENS.MISSAO, referencia: `missao:${missaoId}`, query: q });
        return { completa: true, recompensa: { xp,won,vinculo,item: missao.recompensa_item || null,cristais: cristais.quantidade }, missao };
    });
    if (!resultado.duplicada) {
        try { await require('./levelSystem').verificarProgressao(jogadorId); }
        catch (error) { console.error('[QUEST] Recompensa paga; recálculo de nível pendente:', error.message); }
    }
    return resultado;
}
module.exports = { entregar, concluir };
