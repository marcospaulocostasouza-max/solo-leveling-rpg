const MessageService = require("../core/messageService");

/*
 * COMANDO: !comprar / !confirmar compra
 * 
 * Sistema de compra de itens da loja com confirmação.
 * Fluxo: !comprar <item> → confirmação → !confirmar compra → adiciona ao inventário
 */

const db = require("../core/database");
const { ITENS_LOJA } = require("../utils/lojaItens");

// Função para normalizar texto (remover acentos)
function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .trim();
}

module.exports = async (msg) => {
    const numero = msg.author || msg.from;
    const corpo = msg.body.toLowerCase().trim();
    
    // Verificar se é o comando de confirmação
    if (corpo === "!confirmar compra") {
        return confirmarCompra(msg, numero);
    }
    
    // =====================================
    // COMANDO: !comprar <nome do item>
    // =====================================
    const nomeItem = msg.body.slice(8).trim(); // Remove "!comprar"
    
    if (!nomeItem) {
        return MessageService.send({ message: msg, text: `
*═══ FORMATO INVALIDO ═══*

*Uso:*
*!comprar <nome do item>*

*Exemplo:*
*!comprar Adaga do Aspirante*

_Use !abrir loja para ver os itens disponíveis._
        ` });
    }
    
    // Verificar se o jogador tem ficha aprovada
    const jogador = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    
    if (!jogador) {
        return MessageService.send({ message: msg, text: "*✖ Voce precisa ter uma ficha aprovada primeiro.*\n_Use !ficha para criar seu personagem._" });
    }
    
    // Buscar item em TODAS as lojas (ITENS_LOJA)
    const itemEncontrado = buscarItemNaLoja(nomeItem);
    
    if (!itemEncontrado) {
        return MessageService.send({ message: msg, text: `
*✖ ITEM NAO ENCONTRADO NA LOJA*
Item: ${nomeItem}

_Verifique o nome digitado ou use !abrir loja para ver os itens disponíveis._
        ` });
    }
    
    // Verificar nivel do jogador vs requisito do item (se houver)
    // Verificar se já existe compra pendente
    const compraPendente = await new Promise((resolve) => {
        db.get(
            "SELECT * FROM compras_pendentes WHERE numero = ? AND status = 'aguardando'",
            [numero],
            (err, row) => resolve(row)
        );
    });
    
    if (compraPendente) {
        return MessageService.send({ message: msg, text: `
*⚠ COMPRA PENDENTE*

Você já possui uma compra aguardando confirmação:
> Item: *${compraPendente.item_nome}*
> Preço: *${compraPendente.item_preco.toLocaleString()} Won*

Para confirmar, digite:
*!confirmar compra*

_Cancele a compra atual antes de iniciar outra._
        ` });
    }
    
    // Exibir detalhes e pedir confirmação
    const saldoAtual = jogador.won || 0;
    const saldoPos = saldoAtual - itemEncontrado.item.preco;
    
    // Verificar se tem saldo suficiente
    if (saldoPos < 0) {
        return MessageService.send({ message: msg, text: `
*✖ SALDO INSUFICIENTE*

Item: *${itemEncontrado.item.nome}*
Preço: *${itemEncontrado.item.preco.toLocaleString()} Won*
Seu saldo atual: *${saldoAtual.toLocaleString()} Won*
Faltam: *${Math.abs(saldoPos).toLocaleString()} Won*

_Consiga mais Won para comprar este item._
        ` });
    }
    
    const msgConf = `*═══ CONFIRMAR COMPRA ═══*
──────────────────────────

> *Item:* ${itemEncontrado.item.nome}
> *Categoria:* ${itemEncontrado.categoria}
> *Rank:* ${itemEncontrado.rank}
> *Bônus:* ${itemEncontrado.item.bonus}

*─── Resumo ───*
> *Preço:* ${itemEncontrado.item.preco.toLocaleString()} Won
> *Saldo Atual:* ${saldoAtual.toLocaleString()} Won
> *Saldo Após Compra:* ${saldoPos.toLocaleString()} Won

──────────────────────────

> Digite *!confirmar compra* para confirmar.
> O item será adicionado ao seu inventário.
`;
    
    // Salvar compra pendente
    await new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO compras_pendentes (numero, jogador_id, item_nome, item_categoria, item_rank, item_preco, item_bonus, item_descricao, status, data_criacao)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aguardando', datetime('now'))`,
            [numero, jogador.id, itemEncontrado.item.nome, itemEncontrado.categoria, itemEncontrado.rank, itemEncontrado.item.preco, itemEncontrado.item.bonus, itemEncontrado.item.descricao],
            function(err) {
                if (err) reject(err);
                else resolve();
            }
        );
    });
    
    return MessageService.send({ message: msg, text: msgConf });
};

// =====================================
// FUNCOES AUXILIARES
// =====================================

// Buscar item em todas as lojas normalizando acentos
function buscarItemNaLoja(nomeItem) {
    const nomeNormalizado = normalizarTexto(nomeItem);
    
    for (const [rank, categorias] of Object.entries(ITENS_LOJA)) {
        for (const [categoria, itens] of Object.entries(categorias)) {
            for (const item of itens) {
                if (normalizarTexto(item.nome) === nomeNormalizado) {
                    return { item, categoria, rank };
                }
            }
        }
    }
    
    // Tentar busca parcial (começa com)
    for (const [rank, categorias] of Object.entries(ITENS_LOJA)) {
        for (const [categoria, itens] of Object.entries(categorias)) {
            for (const item of itens) {
                if (normalizarTexto(item.nome).includes(nomeNormalizado)) {
                    return { item, categoria, rank };
                }
            }
        }
    }
    
    return null;
}

// Confirmar compra e adicionar ao inventário
async function confirmarCompra(msg, numero) {
    try {
        // Buscar compra pendente
        const compra = await new Promise((resolve, reject) => {
            db.get(
                "SELECT * FROM compras_pendentes WHERE numero = ? AND status = 'aguardando'",
                [numero],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
        
        if (!compra) {
            return MessageService.send({ message: msg, text: "*✖ Nenhuma compra pendente encontrada.*\n_Use !comprar <nome do item> para iniciar uma compra._" });
        }
        
        // Buscar jogador
        const jogador = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!jogador) {
            return MessageService.send({ message: msg, text: "*✖ Jogador não encontrado.*" });
        }
        
        // Verificar saldo
        if (jogador.won < compra.item_preco) {
            await new Promise((resolve) => {
                db.run("DELETE FROM compras_pendentes WHERE numero = ?", [numero], () => resolve());
            });
            return MessageService.send({ message: msg, text: `
*✖ SALDO INSUFICIENTE*

Item: ${compra.item_nome}
Preço: ${compra.item_preco.toLocaleString()} Won
Seu saldo: ${jogador.won.toLocaleString()} Won

_Compra cancelada automaticamente._
            ` });
        }
        
        // Descontar saldo
        await new Promise((resolve, reject) => {
            db.run(
                "UPDATE jogadores SET won = won - ? WHERE id = ?",
                [compra.item_preco, jogador.id],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        // Buscar ou criar item no banco de dados (tabela itens)
        const itemId = await buscarOuCriarItem(compra);
        
        // Adicionar ao inventário SEM equipar
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO inventario_jogador (jogador_id, item_id, quantidade, equipado, item_inicial)
                 VALUES (?, ?, 1, 0, 0)`,
                [jogador.id, itemId],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        // Registrar transação
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO transacoes (jogador_id, valor, tipo, motivo, data)
                 VALUES (?, ?, 'compra', ?, datetime('now'))`,
                [jogador.id, compra.item_preco, `Compra de ${compra.item_nome}`],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        // Registrar compra
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO compras (jogador_id, jogador_nome, item, preco, status, data)
                 VALUES (?, ?, ?, ?, 'Concluida', datetime('now'))`,
                [jogador.id, jogador.nome, compra.item_nome, compra.item_preco],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        // Remover compra pendente
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM compras_pendentes WHERE numero = ?", [numero], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Mensagem de conclusão
        return MessageService.send({ message: msg, text: `
*✓ COMPRA REALIZADA COM SUCESSO!*

*════ DETALHES DA COMPRA ════*
Item: *${compra.item_nome}*
Categoria: ${compra.item_categoria}
Rank: ${compra.item_rank}
Bônus: ${compra.item_bonus}
Valor pago: *${compra.item_preco.toLocaleString()} Won*
Saldo restante: *${(jogador.won - compra.item_preco).toLocaleString()} Won*

*════ INVENTÁRIO ════*
O item foi adicionado ao seu inventário.
**EQUIPADO:** Não

_Use !inventario para visualizar seus itens._
_Use !equipar <nome do item> para equipar._
        ` });
        
    } catch (error) {
        console.error("Erro ao confirmar compra:", error);
        return MessageService.send({ message: msg, text: "*✖ Erro ao confirmar compra. Tente novamente.*" });
    }
}

// Buscar item existente no banco ou criar novo
function buscarOuCriarItem(compra) {
    return new Promise((resolve, reject) => {
        db.get("SELECT id FROM itens WHERE nome = ?", [compra.item_nome], (err, itemExistente) => {
            if (err) return reject(err);
            
            if (itemExistente) {
                return resolve(itemExistente.id);
            }
            
            // O catálogo usa "Itens de Apoio" e "tipo: consumivel";
            // a tabela usa a flag consumivel. Persistir essa equivalência
            // impede que uma poção comprada fique invisível para !usar.
            const categoriaNormalizada = normalizarTexto(compra.item_categoria);
            const consumivel = categoriaNormalizada.includes("apoio") || categoriaNormalizada.includes("consumivel") ? 1 : 0;
            let efeito = compra.item_bonus || "";
            const cura = efeito.match(/(?:regenera|recupera|cura)\s*(\d+)\s*(?:hp|vida)/i);
            const mana = efeito.match(/(?:regenera|recupera|restaura)\s*(\d+)\s*(?:mp|mana)/i);
            if (cura) efeito = `vida:${cura[1]}`;
            else if (mana) efeito = `mana:${mana[1]}`;

            // Criar novo item no banco
            db.run(
                `INSERT INTO itens (nome, categoria, tier, descricao, consumivel, efeito, habilidade, item_unico)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
                [compra.item_nome, compra.item_categoria, compra.item_rank, compra.item_descricao, consumivel, efeito, compra.item_bonus],
                function(err) {
                    if (err) return reject(err);
                    resolve(this.lastID);
                }
            );
        });
    });
}
