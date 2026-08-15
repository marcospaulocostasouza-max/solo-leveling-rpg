const MessageService = require("../core/messageService");

/**
 * COMANDO: !compra
 * 
 * Sistema de registro de compras da loja.
 * ADM pode registrar/acertar compras realizadas na loja.
 * Gera uma ficha de compra com todas as informações da transação.
 * 
 * Uso:
 * !compra NomeDoJogador Item Preco - Registra uma compra
 * !compra listar @Nome - Lista compras de um jogador
 * !compra cancelar ID - Cancela uma compra
 * 
 * Exemplo:
 * !compra SungJinWoo Espada Sombria 50000
 */

const db = require("../core/database");
const { ensureMasteryHistoryTable } = require("../../../../packages/database");
const adminCore = require("../core/adminCore");
const JogadorCore = require("../core/jogadorCore");

module.exports = async (msg) => {
    try {
        const texto = msg.body.toLowerCase().trim();
        const numero = msg.author || msg.from;
        
        // Verificar se é admin
        const admin = await adminCore.isAdmin(numero);
        
        // !compra - Lista de comandos
        if (texto === '!compra') {
            if (!admin) {
                return MessageService.send({ message: msg, text: "═ *ACESSO NEGADO*\n\nComando restrito para administradores." });
            }
            
            return MessageService.send({ message: msg, text: `
*═══ SISTEMA DE COMPRAS ═══*
──────────────────────────

*REGISTRAR COMPRA:*
!compra NomeDoJogador Item Preco
Ex: !compra SungJinWoo EspadaSombria 50000

*LISTAR COMPRAS:*
!compra listar @NomeJogador

*CANCELAR COMPRA:*
!compra cancelar ID

*VER MINHAS COMPRAS:*
!minhas compras

──────────────────────────
_O sistema gera automaticamente a ficha de compra._` });
        }
        
        // !minhas compras - Jogador vê suas próprias compras
        if (texto === '!minhas compras') {
            const jogador = await JogadorCore.buscarPorNumero(numero);
            if (!jogador) {
                return MessageService.send({ message: msg, text: "═ Voce precisa ter uma ficha criada." });
            }
            
            const compras = await new Promise((resolve) => {
                db.all(
                    `SELECT * FROM compras WHERE jogador_id = ? ORDER BY data DESC LIMIT 10`,
                    [jogador.id],
                    (err, rows) => resolve(rows || [])
                );
            });
            await ensureMasteryHistoryTable();
            const gastosMaestria = await new Promise((resolve) => {
                db.all("SELECT descricao, valor, data FROM historico_maestria WHERE jogador_id = ? ORDER BY data DESC LIMIT 10", [jogador.id], (err, rows) => resolve(rows || []));
            });
            
            if (compras.length === 0 && gastosMaestria.length === 0) {
                return MessageService.send({ message: msg, text: `
*═══ MINHAS COMPRAS ═══*
──────────────────────────

*Nenhuma compra registrada.*

──────────────────────────` });
            }
            
            let mensagem = `*═══ MINHAS COMPRAS ═══*
──────────────────────────

`;
            compras.forEach((c, i) => {
                mensagem += `${i+1}. *${c.item}*
   Preco: ${c.preco} Yulls
   Data: ${c.data}
   Status: ${c.status || 'Concluida'}
   ID: #${c.id}

`;
            });
            if (gastosMaestria.length) {
                mensagem += `*GASTOS DE MAESTRIA*\n\n`;
                gastosMaestria.forEach((gasto, i) => {
                    mensagem += `${i + 1}. *${gasto.descricao}*\n   Gasto: ${gasto.valor} de Maestria\n   Data: ${gasto.data}\n\n`;
                });
            }
            mensagem += `──────────────────────────`;
            
            return MessageService.send({ message: msg, text: mensagem });
        }
        
        // Se não for admin, para por aqui
        if (!admin) return;
        
        // !compra listar @Nome
        if (texto.startsWith('!compra listar ')) {
            const nomeJogador = texto.replace('!compra listar ', '').trim().replace('@', '');
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            const compras = await new Promise((resolve) => {
                db.all(
                    `SELECT * FROM compras WHERE jogador_id = ? ORDER BY data DESC LIMIT 20`,
                    [jogador.id],
                    (err, rows) => resolve(rows || [])
                );
            });
            
            if (compras.length === 0) {
                return MessageService.send({ message: msg, text: `Nenhuma compra encontrada para ${jogador.nome}.` });
            }
            
            let mensagem = `*═══ COMPRAS DE ${jogador.nome.toUpperCase()} ═══*
──────────────────────────

`;
            compras.forEach((c, i) => {
                mensagem += `${i+1}. *${c.item}*
   Preco: ${c.preco} Yulls
   Data: ${c.data}
   Status: ${c.status || 'Concluida'}
   ID: #${c.id}

`;
            });
            mensagem += `──────────────────────────`;
            
            return MessageService.send({ message: msg, text: mensagem });
        }
        
        // !compra cancelar ID
        if (texto.startsWith('!compra cancelar ')) {
            const id = texto.replace('!compra cancelar ', '').trim();
            const compraId = parseInt(id);
            if (isNaN(compraId)) return MessageService.send({ message: msg, text: "ID invalido." });
            
            const compra = await new Promise((resolve) => {
                db.get("SELECT * FROM compras WHERE id = ?", [compraId], (err, row) => resolve(row));
            });
            
            if (!compra) return MessageService.send({ message: msg, text: "Compra nao encontrada." });
            
            db.run("UPDATE compras SET status = 'Cancelado' WHERE id = ?", [compraId], (err) => {
                if (err) return MessageService.send({ message: msg, text: "Erro ao cancelar compra." });
                
                adminCore.registrarLog(numero, adminInfo?.nome || "Admin", 'cancelar_compra', `Compra #${compraId}`, compra.item, 'Ativo', 'Cancelado');
                return MessageService.send({ message: msg, text: `═ Compra #${compraId} (${compra.item}) cancelada com sucesso.` });
            });
            return;
        }
        
        // !compra NomeDoJogador Item Preco - Registrar compra
        const restante = texto.replace('!compra ', '').trim();
        if (!restante) return;
        
        // Extrair: nome, item, preco
        // Formato: NomeDoJogador Item Preco
        const partes = restante.split(/\s+/);
        if (partes.length < 3) {
            return MessageService.send({ message: msg, text: "Formato: !compra NomeDoJogador Item Preco\nEx: !compra SungJinWoo EspadaSombria 50000" });
        }
        
        // Preço é sempre o último valor numérico
        let precoIndex = -1;
        let preco = 0;
        for (let i = partes.length - 1; i >= 0; i--) {
            const num = parseInt(partes[i]);
            if (!isNaN(num) && num > 0) {
                preco = num;
                precoIndex = i;
                break;
            }
        }
        
        if (precoIndex === -1) {
            return MessageService.send({ message: msg, text: "Preco invalido. Use: !compra NomeDoJogador Item Preco" });
        }
        
        // Nome do jogador é a primeira parte
        const nomeJogador = partes[0];
        // Item é tudo entre o nome e o preço
        const item = partes.slice(1, precoIndex).join(' ');
        
        if (!item) {
            return MessageService.send({ message: msg, text: "Nome do item invalido. Use: !compra NomeDoJogador Item Preco" });
        }
        
        // Buscar jogador
        let jogador = await adminCore.buscarJogador(nomeJogador);
        if (!jogador) {
            jogador = await adminCore.buscarJogadorLike(nomeJogador);
        }
        if (!jogador) return MessageService.send({ message: msg, text: `Jogador "${nomeJogador}" nao encontrado.` });
        
        const adminInfo = await adminCore.getAdminLevel(numero);
        
        // Registrar compra
        const data = new Date().toISOString().replace('T', ' ').substring(0, 19);
        
        db.run(
            `INSERT INTO compras (jogador_id, jogador_nome, item, preco, status, data, registrado_por) 
             VALUES (?, ?, ?, ?, 'Concluida', ?, ?)`,
            [jogador.id, jogador.nome, item, preco, data, adminInfo.nome || numero],
            function(err) {
                if (err) {
                    return MessageService.send({ message: msg, text: "Erro ao registrar compra: " + err.message });
                }
                
                const compraId = this.lastID;
                
                // Registrar log
                adminCore.registrarLog(numero, adminInfo.nome || "Admin", 'registrar_compra', jogador.nome, 
                    `${item} - ${preco} Yulls`, '', `Compra #${compraId}`);
                
                // Ficha de compra
                return MessageService.send({ message: msg, text: `
*═══ FICHA DE COMPRA ═══*
──────────────────────────

*COMPRA #${compraId}*

*Jogador:* ${jogador.nome}
*Item:* ${item}
*Valor:* ${preco.toLocaleString('pt-BR')} Yulls
*Data:* ${data}
*Status:* ✅ Concluida
*Registrado por:* ${adminInfo.nome || numero}

──────────────────────────
_Compra registrada com sucesso!_` });
            }
        );
        
    } catch (error) {
        console.error("Erro no comando compra:", error);
        return MessageService.send({ message: msg, text: "═ Erro ao processar comando de compra." });
    }
};
