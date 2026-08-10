/*
 * SISTEMA DE VENDA DE ITENS
 * 
 * Gerencia a venda de itens dos jogadores de volta para a loja.
 * - Itens equipados/consumíveis: 50% do valor original
 * - Minérios: valor definido pelo sistema de mineração
 */

const db = require("../core/database");
const EconomySystem = require("./economySystem");
const InventorySystem = require("./inventorySystem");

// =====================================
// CONFIGURAÇÕES
// =====================================

// Porcentagem de retorno ao vender itens (50%)
const PORCENTAGEM_VENDA = 0.5;

// Valores de minérios do sistema de mineração
const VALORES_MINERIOS = {
    "Cristal Grande": 100000,
    "Cristal Médio": 60000,
    "Cristal Pequeno": 20000
};

// Nomes de minérios para identificar
const NOMES_MINERIOS = [
    "Cristal Grande",
    "Cristal Médio",
    "Cristal Pequeno"
];

class VendaSystem {

    // =====================================
    // SISTEMA DE VENDA
    // =====================================

    /**
     * Verifica se um item é um minério
     */
    static isMineroi(nomeItem) {
        return NOMES_MINERIOS.some(nome => nomeItem.includes(nome));
    }

    /**
     * Busca o preço de um item na loja
     */
    static async getPrecoItem(itemId) {
        return new Promise((resolve) => {
            db.get("SELECT preco FROM itens WHERE id = ?", [itemId], (err, row) => {
                resolve(row ? row.preco : 0);
            });
        });
    }

    /**
     * Calcula o valor de venda de um item
     * - Minérios: valor cheio do sistema de mineração
     * - Outros itens: 50% do preço original
     */
    static calcularValorVenda(item, quantidade = 1) {
        // Verificar se é um minério
        if (this.isMineroi(item.nome)) {
            // Buscar valor do minério
            for (const [nome, valor] of Object.entries(VALORES_MINERIOS)) {
                if (item.nome.includes(nome)) {
                    return valor * quantidade;
                }
            }
        }

        // Item normal - 50% do preço
        const precoOriginal = item.preco || 0;
        return Math.floor(precoOriginal * PORCENTAGEM_VENDA) * quantidade;
    }

    /**
     * Processa a venda de um item
     */
    static async venderItem(jogadorId, itemNome, quantidade = 1) {
        // Buscar item no inventário
        const itemInventario = await new Promise((resolve) => {
            db.get(
                `SELECT i.*, inv.quantidade, inv.equipado, inv.id as inventario_id
                 FROM inventario_jogador inv
                 JOIN itens i ON inv.item_id = i.id
                 WHERE inv.jogador_id = ? AND i.nome LIKE ?
                 LIMIT 1`,
                [jogadorId, `%${itemNome}%`],
                (err, row) => resolve(row || null)
            );
        });

        if (!itemInventario) {
            return { 
                sucesso: false, 
                erro: `Item "${itemNome}" não encontrado no inventário.` 
            };
        }

        // Verificar se tem quantidade suficiente
        if (itemInventario.quantidade < quantidade) {
            return { 
                sucesso: false, 
                erro: `Você tem apenas ${itemInventario.quantidade}x ${itemInventario.nome}.` 
            };
        }

        // Verificar se está equipado
        if (itemInventario.equipado) {
            return { 
                sucesso: false, 
                erro: `Não pode vender ${itemInventario.nome} enquanto estiver equipado. Desequipe primeiro.` 
            };
        }

        // Calcular valor de venda
        const valorVenda = this.calcularValorVenda(itemInventario, quantidade);

        // Remover item do inventário
        const remocao = await new Promise((resolve) => {
            if (itemInventario.quantidade <= quantidade) {
                // Remover completamente
                db.run(
                    "DELETE FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?",
                    [jogadorId, itemInventario.item_id],
                    (err) => resolve(!err)
                );
            } else {
                // Diminuir quantidade
                db.run(
                    "UPDATE inventario_jogador SET quantidade = quantidade - ? WHERE jogador_id = ? AND item_id = ?",
                    [quantidade, jogadorId, itemInventario.item_id],
                    (err) => resolve(!err)
                );
            }
        });

        if (!remocao) {
            return { 
                sucesso: false, 
                erro: "Erro ao remover item do inventário." 
            };
        }

        // Adicionar wons ao jogador
        await EconomySystem.adicionarWon(
            jogadorId, 
            valorVenda, 
            `Venda de ${quantidade}x ${itemInventario.nome}`
        );

        return {
            sucesso: true,
            item: itemInventario.nome,
            quantidade: quantidade,
            valorUnitario: Math.floor(valorVenda / quantidade),
            valorTotal: valorVenda,
            tipo: this.isMineroi(itemInventario.nome) ? "minério" : "item"
        };
    }

    /**
     * Formata mensagem de confirmação de venda
     */
    static formatarMensagemVenda(resultado, saldoAtual) {
        if (!resultado.sucesso) {
            return `*═══ VENDA DE ITEM ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*❌ Erro na venda*

${resultado.erro}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        }

        const tipoTexto = resultado.tipo === "minério" ? "Minério" : "Item";
        
        return `*═══ CONFIRMAÇÃO DE VENDA ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*${tipoTexto}:* ${resultado.quantidade}x ${resultado.item}

*Valor unitário:* ${resultado.valorUnitario.toLocaleString()} Wons
*Valor total:* ${resultado.valorTotal.toLocaleString()} Wons

*Saldo atual:* ${saldoAtual.toLocaleString()} Wons

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Use *!confirmar venda* para confirmar a venda._
_Use *!cancelar venda* para cancelar._`;
    }

    /**
     * Formata mensagem de sucesso da venda
     */
    static formatarMensagemSucesso(resultado, saldoNovo) {
        const tipoTexto = resultado.tipo === "minério" ? "Minério" : "Item";
        
        return `*═══ VENDA CONCLUÍDA ✅ ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*${tipoTexto} vendido:* ${resultado.quantidade}x ${resultado.item}

*Valor recebido:* ${resultado.valorTotal.toLocaleString()} Wons

*Novo saldo:* ${saldoNovo.toLocaleString()} Wons

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    }

    /**
     * Lista itens vendáveis do inventário
     */
    static async listarItensVendaveis(jogadorId) {
        const itens = await InventorySystem.listarInventario(jogadorId);
        
        return itens.filter(item => {
            // Não pode vender itens equipados
            if (item.equipado) return false;
            
            // Itens da loja tem preço
            if (item.preco && item.preco > 0) return true;
            
            // Minérios são vendáveis
            if (this.isMineroi(item.nome)) return true;
            
            return false;
        });
    }

    /**
     * Obtém informações de venda de um item
     */
    static async getInfoVenda(jogadorId, itemNome) {
        const itemInventario = await new Promise((resolve) => {
            db.get(
                `SELECT i.*, inv.quantidade
                 FROM inventario_jogador inv
                 JOIN itens i ON inv.item_id = i.id
                 WHERE inv.jogador_id = ? AND i.nome LIKE ?
                 LIMIT 1`,
                [jogadorId, `%${itemNome}%`],
                (err, row) => resolve(row || null)
            );
        });

        if (!itemInventario) {
            return null;
        }

        const valorVenda = this.calcularValorVenda(itemInventario, 1);
        const tipo = this.isMineroi(itemInventario.nome) ? "minério" : "item";

        return {
            item: itemInventario.nome,
            quantidade: itemInventario.quantidade,
            valorUnitario: valorVenda,
            valorTotal: valorVenda * itemInventario.quantidade,
            tipo: tipo,
            precoOriginal: itemInventario.preco || 0
        };
    }
}

module.exports = VendaSystem;