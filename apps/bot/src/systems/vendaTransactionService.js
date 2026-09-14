const database = require('../../../../packages/database');
const { provider } = require('../../../../packages/database/config');
async function sell(jogadorId, nome, quantidade, calculate, pendingId = null) {
    quantidade = Number(quantidade);
    if (!Number.isSafeInteger(quantidade) || quantidade <= 0) return { sucesso: false, erro: 'Quantidade inválida.' };
    try { return await database.transaction(async query => {
        const player = await query.get(`SELECT id,won FROM jogadores WHERE id=?${provider === 'postgres' ? ' FOR UPDATE' : ''}`, [jogadorId]);
        if (!player) throw new Error('Jogador não encontrado.');
        let pending;
        if (pendingId != null) {
            pending = await query.get('SELECT * FROM vendas_pendentes WHERE id=? AND jogador_id=?', [pendingId, jogadorId]);
            if (!pending || pending.item_nome !== nome || Number(pending.quantidade) !== quantidade) throw new Error('Venda já confirmada, cancelada ou substituída.');
            let timestamp = String(pending.data);
            if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(timestamp)) timestamp = timestamp.replace(' ', 'T') + 'Z';
            if (!Number.isFinite(Date.parse(timestamp)) || Date.now() - Date.parse(timestamp) > 300000) throw new Error('Venda expirada. Inicie uma nova venda.');
        }
        const items = await query.all(`SELECT i.*,inv.id AS inventario_id,inv.quantidade,inv.equipado FROM inventario_jogador inv JOIN itens i ON i.id=inv.item_id WHERE inv.jogador_id=? AND LOWER(i.nome) LIKE LOWER(?)`, [jogadorId, `%${nome}%`]);
        const exact = items.filter(item => item.nome.toLowerCase() === String(nome).toLowerCase());
        const candidates = exact.length ? exact : items;
        if (candidates.length !== 1) throw new Error(candidates.length ? 'Informe o nome completo do item; há mais de uma correspondência.' : 'Item não encontrado no inventário.');
        const item = candidates[0];
        if (Number(item.equipado) === 1) throw new Error('Desequipe o item antes de vender.');
        const value = calculate(item, quantidade);
        if (pending && value !== Number(pending.valor_total)) throw new Error('O preço mudou. Inicie uma nova venda para conferir o valor atualizado.');
        if (!Number.isSafeInteger(value) || value <= 0 || !Number.isSafeInteger(Number(player.won || 0) + value)) throw new Error('Item sem valor comercial válido. Ele permanece no inventário.');
        const removed = await query.run('UPDATE inventario_jogador SET quantidade=quantidade-? WHERE id=? AND quantidade>=? AND COALESCE(equipado,0)=0', [quantidade,item.inventario_id,quantidade]);
        if (removed.changes !== 1) throw new Error('Quantidade insuficiente ou item indisponível.');
        await query.run('DELETE FROM inventario_jogador WHERE id=? AND quantidade=0',[item.inventario_id]);
        await query.run('UPDATE jogadores SET won=COALESCE(won,0)+? WHERE id=?',[value,jogadorId]);
        await query.run("INSERT INTO transacoes(jogador_id,valor,tipo,motivo,data) VALUES(?,?,'ganho',?,?)",[jogadorId,value,`Venda de ${quantidade}x ${item.nome}`,new Date().toISOString()]);
        if (pending) await query.run('DELETE FROM vendas_pendentes WHERE id=?', [pendingId]);
        return { sucesso: true, item:item.nome, quantidade, valorUnitario: value / quantidade, valorTotal:value, saldoNovo: Number(player.won || 0) + value, tipo: /Cristal (Grande|Médio|Pequeno)/.test(item.nome) ? 'minério' : 'item' };
    }); } catch (error) { return { sucesso: false, erro: error.message }; }
}
module.exports = { sell };
