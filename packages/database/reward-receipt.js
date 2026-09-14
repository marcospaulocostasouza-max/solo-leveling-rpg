'use strict';
// Use exclusivamente a query da transação que entregou a recompensa.
async function record(database, query, {playerId, origin, reference, rewards}) {
    if (!origin || !reference || !Array.isArray(rewards) || !rewards.length) throw new Error('Recibo de recompensa incompleto.');
    const entries = rewards.map(reward => {
        if (!reward.name || !Number.isSafeInteger(reward.quantity) || reward.quantity <= 0) throw new Error('Recompensa inválida no recibo.');
        return {jogadorId:playerId,tipo:'Recompensa',direcao:reward.direction || 'entrada',recurso:reward.name,quantidade:reward.quantity,descricao:`${origin}: ${reward.quantity}x ${reward.name}`,origem:origin,referencia:reference};
    });
    for (const entry of entries) await database.registrarHistoricoFichaComQuery(query, entry);
}
module.exports = {record};
