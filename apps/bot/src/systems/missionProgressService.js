"use strict";
const database = require("../../../../packages/database");
const { provider } = require("../../../../packages/database/config");

async function entregar(jogadorId, missaoId, relato) {
    const texto = String(relato || '').trim();
    if ((texto.match(/\S+/g) || []).length < 300) throw new Error('O relato da missão precisa ter pelo menos 300 palavras e demonstrar o objetivo cumprido.');
    const result = await database.run("UPDATE missoes SET status='em_avaliacao',relato_entrega=?,entregue_em=? WHERE id=? AND jogador_id=? AND status='ativa'", [texto, new Date().toISOString(), missaoId, jogadorId]);
    if (result.changes !== 1) throw new Error('A missão precisa estar ativa e ainda não ter sido entregue.');
    return { sucesso: true };
}

async function concluir(jogadorId, missaoId) {
    const resultado = await database.transaction(async q => {
        const player = await q.get(provider === 'postgres' ? 'SELECT id FROM jogadores WHERE id=? FOR UPDATE' : 'SELECT id FROM jogadores WHERE id=?', [jogadorId]);
        if (!player) throw new Error('Jogador não encontrado.');
        const missao = await q.get('SELECT * FROM missoes WHERE id=? AND jogador_id=?', [missaoId,jogadorId]);
        if (!missao) throw new Error('Missão não encontrada.');
        if (missao.status === 'completa') return { completa: true, duplicada: true, recompensa: null };
        if (missao.status !== 'em_avaliacao') throw new Error('A missão precisa ser entregue para avaliação antes da aprovação.');
        let item;
        if (missao.recompensa_item && missao.recompensa_item.toLowerCase() !== 'nenhum') {
            item = await q.get('SELECT id FROM itens WHERE LOWER(nome)=LOWER(?)', [missao.recompensa_item]);
            if (!item) throw new Error(`Recompensa ainda não cadastrada: ${missao.recompensa_item}. A ADM precisa cadastrar o item antes de concluir; nada foi pago.`);
        }
        const xp = Number(missao.recompensa_xp || 0), won = Number(missao.recompensa_won || 0);
        if (![xp,won].every(n => Number.isSafeInteger(n) && n >= 0)) throw new Error('Recompensa inválida.');
        await q.run("UPDATE missoes SET status='completa',progresso=objetivo WHERE id=?", [missaoId]);
        await q.run('UPDATE jogadores SET experiencia=experiencia+?,won=won+? WHERE id=?', [xp,won,jogadorId]);
        await q.run("INSERT INTO transacoes(jogador_id,valor,tipo,motivo,data) VALUES(?,?,'ganho',?,CURRENT_TIMESTAMP)", [jogadorId,won,`Missão: ${missao.nome}`]);
        if (item) {
            const inv = await q.get('SELECT id FROM inventario_jogador WHERE jogador_id=? AND item_id=?', [jogadorId,item.id]);
            if (inv) await q.run('UPDATE inventario_jogador SET quantidade=quantidade+1 WHERE id=?',[inv.id]);
            else await q.run('INSERT INTO inventario_jogador(jogador_id,item_id,quantidade,equipado) VALUES(?,?,1,0)',[jogadorId,item.id]);
        }
        const service = require('./crystalRewardService');
        const cristais = await service.conceder({ jogadorId, quantidade: Number(missao.recompensa_cristais || 0), origem: service.ORIGENS.MISSAO, referencia: `missao:${missaoId}`, query: q });
        return { completa: true, recompensa: { xp,won,item: missao.recompensa_item || null,cristais: cristais.quantidade }, missao };
    });
    if (!resultado.duplicada) {
        try { await require('./levelSystem').verificarProgressao(jogadorId); }
        catch (error) { console.error('[QUEST] Recompensa paga; recálculo de nível pendente:', error.message); }
    }
    return resultado;
}
module.exports = { entregar, concluir };
