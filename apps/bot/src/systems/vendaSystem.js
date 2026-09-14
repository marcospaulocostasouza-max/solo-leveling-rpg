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
            db.get("SELECT preco,valor FROM itens WHERE id = ?", [itemId], (err, row) => {
                resolve(row ? (Number(row.preco) > 0 ? Number(row.preco) : Number(row.valor) || 0) : 0);
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
        const precoOriginal = Number(item.preco) > 0 ? Number(item.preco) : Math.max(0, Number(item.valor) || 0);
        return Math.floor(precoOriginal * PORCENTAGEM_VENDA) * quantidade;
    }

    /**
     * Processa a venda de um item
     */
    static async venderItem(jogadorId, itemNome, quantidade = 1, pendingId = null) {
        return require('./vendaTransactionService').sell(jogadorId, itemNome, quantidade, (item, total) => this.calcularValorVenda(item, total), pendingId);
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
            if (Number(item.equipado) === 1) return false;
            
            // Itens da loja tem preço
            if (this.calcularValorVenda(item) > 0) return true;
            
            // Minérios são vendáveis
            if (this.isMineroi(item.nome)) return true;
            
            return false;
        });
    }

    /**
     * Obtém informações de venda de um item
     */
    static async getInfoVenda(jogadorId, itemNome) {
        const rows = await new Promise((resolve, reject) => {
            db.all(
                `SELECT i.*, inv.quantidade, inv.equipado
                 FROM inventario_jogador inv
                 JOIN itens i ON inv.item_id = i.id
                 WHERE inv.jogador_id = ? AND LOWER(i.nome) LIKE LOWER(?)`,
                [jogadorId, `%${itemNome}%`],
                (err, rows) => err ? reject(err) : resolve(rows || [])
            );
        });
        const exact = rows.filter(item => item.nome.toLowerCase() === String(itemNome).toLowerCase());
        const matches = exact.length ? exact : rows;
        if (matches.length > 1) throw new Error('Informe o nome completo do item; há mais de uma correspondência.');
        const itemInventario = matches[0];

        if (!itemInventario) {
            return null;
        }
        if (Number(itemInventario.equipado) === 1) throw new Error('Desequipe o item antes de vender.');

        const valorVenda = this.calcularValorVenda(itemInventario, 1);
        if (!Number.isSafeInteger(valorVenda) || valorVenda <= 0) throw new Error('Item sem valor comercial válido.');
        const tipo = this.isMineroi(itemInventario.nome) ? "minério" : "item";

        return {
            item: itemInventario.nome,
            quantidade: Number(itemInventario.quantidade),
            valorUnitario: valorVenda,
            valorTotal: valorVenda * itemInventario.quantidade,
            tipo: tipo,
            precoOriginal: Number(itemInventario.preco) > 0 ? Number(itemInventario.preco) : Number(itemInventario.valor) || 0
        };
    }
}

module.exports = VendaSystem;
