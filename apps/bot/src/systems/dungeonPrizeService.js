const database = require('../../../../packages/database');
const { provider } = require('../../../../packages/database/config');

async function choose(system, fichaId, playerId, number) {
    await database.ensurePlayerHistorySchema();
    const result = await database.transaction(async query => {
        const lock = provider === 'postgres' ? ' FOR UPDATE' : '';
        const ficha = await query.get('SELECT * FROM fichas_dungeon WHERE id = ?' + lock, [fichaId]);
        if (!ficha || ficha.status !== 'premios_pendentes') return { erro: 'Esta dungeon não tem prêmios disponíveis para escolha.' };
        if (!await query.get('SELECT 1 FROM participacao_dungeon WHERE ficha_dungeon_id = ? AND jogador_id = ?', [fichaId, playerId])) return { erro: 'Apenas participantes registrados podem escolher prêmio.' };
        if (await query.get('SELECT 1 FROM premios_dungeon WHERE ficha_dungeon_id = ? AND jogador_id = ?', [fichaId, playerId])) return { erro: 'Você já recebeu seu prêmio extra desta dungeon.' };
        const premios = system.PREMIACOES_RANK[ficha.dungeon_rank] || system.PREMIACOES_RANK.E;
        const options = [
            { numero: 1, tipo: 'xp_extra', nome: 'XP', valor: premios.xp },
            { numero: 2, tipo: 'won_extra', nome: 'Wons', valor: premios.won },
            { numero: 3, tipo: premios.atributos > 0 ? 'atributos' : 'maestria', nome: premios.atributos > 0 ? 'pontos de atributo' : 'Maestria', valor: premios.atributos || premios.maestria },
            { numero: 4, tipo: 'item_misterioso_1', nome: 'Item Misterioso 1', valor: 1 },
            { numero: 5, tipo: 'item_misterioso_2', nome: 'Item Misterioso 2', valor: 1 }
        ];
        const opcao = options.find(option => option.numero === number);
        if (!opcao) return { erro: 'Escolha uma opção de 1 a 5.' };
        if (await query.get('SELECT 1 FROM premios_dungeon WHERE ficha_dungeon_id = ? AND premio_tipo = ?', [fichaId, opcao.tipo])) return { erro: `A opção ${number} já foi escolhida. Escolha outra opção da lista.` };
        if (!await query.get('SELECT id FROM jogadores WHERE id = ?' + lock, [playerId])) return { erro: 'Jogador não encontrado.' };
        let item, itemId, value = String(opcao.valor), premioNome = `${opcao.valor} ${opcao.nome}`;
        if (opcao.tipo.startsWith('item_')) {
            const loader = require('./dungeonDatabaseLoader');
            const dungeonId = Number(ficha.dungeon_id) || Number(loader.carregarDungeons().find(d => d.nome === ficha.dungeon_nome && d.rank === ficha.dungeon_rank)?.id);
            item = dungeonId ? loader.sortearItemMisterioso(dungeonId) : null;
            if (!item) return { erro: 'Não foi possível sortear o item desta dungeon. A opção continua disponível.' };
            const existing = await query.get('SELECT id FROM itens WHERE nome = ? ORDER BY id LIMIT 1', [item.nome]);
            if (existing) itemId = existing.id;
            else {
                const a = item.atributos || {};
                const inserted = await query.run(`INSERT INTO itens (nome, categoria, tier, descricao, arma, armadura, consumivel,
                    forca_bonus, resistencia_bonus, velocidade_bonus, sentidos_bonus, inteligencia_bonus, poder_magico_bonus, efeito)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)${provider === 'postgres' ? ' RETURNING id' : ''}`, [
                    item.nome, item.categoria, item.rank, item.descricao || '',
                    ['Arma 1', 'Arma 2'].includes(item.categoria) ? 1 : 0, item.categoria === 'Armadura' ? 1 : 0, item.categoria === 'Consumível' ? 1 : 0,
                    a['Força'] || 0, a['Resistência'] || 0, a['Agilidade'] || 0, a.Sentidos || 0, a['Inteligência'] || 0, a['Poder Mágico'] || 0, a.efeito || ''
                ]);
                itemId = inserted.lastID;
            }
            if (!itemId) throw new Error('Não foi possível preparar o item sorteado.');
            value = item.nome;
            premioNome = `${item.nome} [Rank ${item.rank}]`;
        }
        // Reserva e entrega são confirmadas juntas, também entre processos.
        await query.run('INSERT INTO premios_dungeon (ficha_dungeon_id, jogador_id, premio_tipo, premio_valor, data) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)', [fichaId, playerId, opcao.tipo, value]);
        const motivo = `Prêmio extra da Dungeon #${fichaId}`;
        if (itemId) {
            const inventory = await query.get('SELECT id FROM inventario_jogador WHERE jogador_id = ? AND item_id = ? ORDER BY id LIMIT 1', [playerId, itemId]);
            if (inventory) await query.run('UPDATE inventario_jogador SET quantidade = COALESCE(quantidade, 0) + 1 WHERE id = ?', [inventory.id]);
            else await query.run('INSERT INTO inventario_jogador (jogador_id, item_id, quantidade, equipado, item_inicial) VALUES (?, ?, 1, 0, 0)', [playerId, itemId]);
        } else {
            const field = { xp_extra: 'experiencia', won_extra: 'won', atributos: 'pontos_atributo', maestria: 'maestria' }[opcao.tipo];
            await query.run(`UPDATE jogadores SET ${field} = COALESCE(${field}, 0) + ? WHERE id = ?`, [opcao.valor, playerId]);
            if (opcao.tipo === 'xp_extra') await query.run('INSERT INTO experiencia_historico (jogador_id, quantidade, motivo, data) VALUES (?, ?, ?, CURRENT_TIMESTAMP)', [playerId, opcao.valor, motivo]);
            if (opcao.tipo === 'won_extra') await query.run("INSERT INTO transacoes (jogador_id, valor, tipo, motivo, data) VALUES (?, ?, 'ganho', ?, CURRENT_TIMESTAMP)", [playerId, opcao.valor, motivo]);
        }
        await database.registrarHistoricoFichaComQuery(query, {
            jogadorId: playerId, tipo: 'Dungeon', direcao: 'entrada', recurso: item ? item.nome : opcao.nome,
            quantidade: opcao.valor, descricao: `${premioNome}, opção ${number} da Dungeon #${fichaId}.`,
            origem: 'DUNGEON_PREMIO_ESCOLHIDO', referencia: `ficha_dungeon:${fichaId}`
        });
        return { sucesso: true, opcao, premioNome, itemId, mensagem: `*${premioNome}* já foi adicionado à sua ficha.` };
    });
    if (result.sucesso && result.opcao.tipo === 'xp_extra') {
        await require('./levelSystem').verificarProgressao(playerId).catch(error => console.error('[DUNGEON] XP salvo; falha na progressão:', error.message));
    }
    return result;
}

module.exports = { choose };
