const MessageService = require("../core/messageService");

const db = require("../core/database");

module.exports = async (msg) => {
    try {
        const numero = msg.author || msg.from;
        
        // Buscar jogador
        const jogador = await new Promise((resolve, reject) => {
            db.get("SELECT id FROM jogadores WHERE numero = ?", [numero], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!jogador) {
            return MessageService.send({ message: msg, text: `
*═ JOGADOR NÃO ENCONTRADO*
──────────────────────────
Você ainda não possui uma ficha criada.

_Use *!ficha* para criar seu personagem._
            ` });
        }
        
        // Buscar itens do inventário
        const itens = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    i.nome,
                    i.categoria,
                    i.tier,
                    ij.quantidade,
                    ij.equipado
                FROM inventario_jogador ij
                JOIN itens i ON ij.item_id = i.id
                WHERE ij.jogador_id = ?
                ORDER BY i.categoria, i.tier
            `, [jogador.id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        // Buscar contadores
        const equipados = itens.filter(i => i.equipado === 1).length;
        const consumiveis = itens.filter(i => i.categoria === 'Consumível').length;
        const equipamentos = itens.filter(i => ['Arma', 'Armadura', 'Escudo', 'Acessório'].includes(i.categoria)).length;
        
        let mensagem = `*═══ INVENTÁRIO ═══*\n\n`;
        mensagem += `*─── Resumo ───*\n`;
        mensagem += `> Total de itens: ${itens.length}\n`;
        mensagem += `> Equipamentos: ${equipamentos}\n`;
        mensagem += `> Equipados: ${equipados}\n`;
        mensagem += `> Consumíveis: ${consumiveis}\n\n`;
        
        if (itens.length === 0) {
            mensagem += `*─── Inventário Vazio ───*\n`;
            mensagem += `> Você ainda não possui itens.\n`;
            mensagem += `> Use *!abrir loja* para comprar itens.\n\n`;
        } else {
            // Separar por categoria
            const categorias = {};
            itens.forEach(item => {
                if (!categorias[item.categoria]) {
                    categorias[item.categoria] = [];
                }
                categorias[item.categoria].push(item);
            });
            
            Object.entries(categorias).forEach(([categoria, itensCategoria]) => {
                mensagem += `*─── ${categoria} ───*\n`;
                itensCategoria.forEach(item => {
                    const equipado = item.equipado === 1 ? ' ✓' : '';
                    mensagem += `> *${item.nome}* (${item.tier || 'Comum'}) x${item.quantidade}${equipado}\n`;
                });
                mensagem += `\n`;
            });
        }
        
        mensagem += `──────────────────────────\n`;
        mensagem += `_Comandos: !equipar <item> | !usar <item>_\n`;
        mensagem += `_Use !abrir loja para comprar mais itens._`;
        
        await MessageService.send({ message: msg, text: mensagem });
        
    } catch (error) {
        console.error("Erro ao exibir inventário:", error);
        return MessageService.send({ message: msg, text: `
*═ ERRO AO CARREGAR INVENTÁRIO*
──────────────────────────
_Ocorreu um erro ao buscar seus itens._
_Tente novamente ou use !abrir loja para comprar itens._
        ` });
    }
};