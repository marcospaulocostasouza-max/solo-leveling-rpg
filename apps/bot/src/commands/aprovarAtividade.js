const MessageService = require("../core/messageService");

/**
 * SISTEMA DE APROVAÇÃO DE ATIVIDADES
 * 
 * Comandos para ADM conceder recompensas automaticamente:
 * - !quest diária finalizada <Nome>
 * - !treino de maestria finalizado <Nome> [1/7/15/30 dias]
 * - !treino conjunto finalizado <Nome1>/<Nome2>
 * - !interação finalizada <Nome1>/<Nome2>
 * - !one post finalizado <Nome1>/<Nome2>
 * 
 * O sistema calcula automaticamente as recompensas baseado no rank do jogador.
 */

const db = require("../core/database");
const adminCore = require("../core/adminCore");
const verificarBloqueio = require("../utils/verificarBloqueio");
const JogadorCore = require("../core/jogadorCore");

// =====================================
// TABELA DE RECOMPENSAS POR RANK
// =====================================
const RECOMPENSAS = {
    quest_diaria: {
        nome: "Quest Diária",
        xp: { E: 100, D: 1000, C: 2500, B: 5000, A: 8000, S: 12000 },
        won: { E: 500, D: 1000, C: 2000, B: 3000, A: 5000, S: 8000 },
        pontos_atributo: 3,
        caixa_item: true
    },
    treino_maestria: {
        nome: "Treino de Maestria",
        xp: { E: 50, D: 200, C: 500, B: 1000, A: 2000, S: 3500 },
        maestria: { "1_dia": 5, "7_dias": 20, "15_dias": 50, "30_dias": 100 }
    },
    treino_conjunto: {
        nome: "Treino Conjunto",
        xp: { E: 300, D: 1200, C: 3000, B: 6500, A: 10000, S: 15000 },
        bonus_duo: 0.25 // +25% se for duo (2 pessoas)
    },
    interacao: {
        nome: "Interação",
        xp: { E: 400, D: 1500, C: 3500, B: 7000, A: 11000, S: 14000 }
    },
    one_post: {
        nome: "One Post",
        xp: { E: 500, D: 1800, C: 4500, B: 9000, A: 14000, S: 20000 },
        bonus_duo: 0.25 // +25% se for duo
    }
};

/**
 * Aplica recompensas a um jogador
 */
async function aplicarRecompensas(jogadorId, tipoAtividade, rank, quantidadeExtra = null) {
    const recompensa = RECOMPENSAS[tipoAtividade];
    if (!recompensa) return { sucesso: false, erro: "Tipo de atividade inválido" };
    
    const jogador = await new Promise((resolve) => {
        db.get("SELECT * FROM jogadores WHERE id = ?", [jogadorId], (err, row) => {
            resolve(row);
        });
    });
    
    if (!jogador) return { sucesso: false, erro: "Jogador não encontrado" };
    
    const rankJogador = (rank || jogador.rank || "E").toUpperCase();
    const recompensasAplicadas = [];
    
    // Aplicar XP
    if (recompensa.xp) {
        let xpGanho = recompensa.xp[rankJogador] || recompensa.xp["E"];
        
        // Aplicar bônus de duo se applicable
        if (quantidadeExtra && quantidadeExtra > 1 && recompensa.bonus_duo) {
            xpGanho = Math.floor(xpGanho * (1 + recompensa.bonus_duo));
        }
        
        await new Promise((resolve) => {
            db.run("UPDATE jogadores SET experiencia = experiencia + ? WHERE id = ?", [xpGanho, jogadorId], (err) => resolve());
        });
        await JogadorCore.verificarEAtualizarNivel(jogadorId);
        
        recompensasAplicadas.push({ tipo: "XP", valor: xpGanho });
    }
    
    // Aplicar Won (apenas Quest Diária)
    if (recompensa.won) {
        let wonGanho = recompensa.won[rankJogador] || recompensa.won["E"];
        
        await new Promise((resolve) => {
            db.run("UPDATE jogadores SET won = won + ? WHERE id = ?", [wonGanho, jogadorId], (err) => resolve());
        });
        
        recompensasAplicadas.push({ tipo: "Won", valor: wonGanho });
    }
    
    // Aplicar Pontos de Atributo (apenas Quest Diária)
    if (recompensa.pontos_atributo) {
        await new Promise((resolve) => {
            db.run("UPDATE jogadores SET pontos_atributo = pontos_atributo + ? WHERE id = ?", [recompensa.pontos_atributo, jogadorId], (err) => resolve());
        });
        
        recompensasAplicadas.push({ tipo: "Pontos de Atributo", valor: recompensa.pontos_atributo });
    }
    
    // Aplicar Caixa de Item (apenas Quest Diária)
    if (recompensa.caixa_item) {
        await new Promise((resolve, reject) => db.run(
            `INSERT OR IGNORE INTO itens (nome, categoria, tier, descricao, consumivel, preco)
             VALUES ('Caixa de Item', 'Item de Apoio', 'Comum', 'Caixa de recompensa de Quest Diária.', 1, 0)`,
            [], err => err ? reject(err) : resolve()
        ));
        const caixa = await new Promise((resolve, reject) => db.get("SELECT id FROM itens WHERE nome = 'Caixa de Item'", [], (err, row) => err ? reject(err) : resolve(row)));
        const existente = await new Promise((resolve, reject) => db.get(
            "SELECT id FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogadorId, caixa.id],
            (err, row) => err ? reject(err) : resolve(row || null)
        ));
        await new Promise((resolve, reject) => db.run(
            existente ? "UPDATE inventario_jogador SET quantidade = quantidade + 1 WHERE id = ?" : "INSERT INTO inventario_jogador (jogador_id, item_id, quantidade, equipado) VALUES (?, ?, 1, 0)",
            existente ? [existente.id] : [jogadorId, caixa.id], err => err ? reject(err) : resolve()
        ));
        
        recompensasAplicadas.push({ tipo: "Caixa de Item", valor: 1 });
    }
    
    // Aplicar Maestria (apenas Treino de Cultivo)
    if (recompensa.maestria && quantidadeExtra) {
        const maestriaGanha = recompensa.maestria[quantidadeExtra] || 5;
        
        await new Promise((resolve) => {
            db.run("UPDATE jogadores SET maestria = maestria + ? WHERE id = ?", [maestriaGanha, jogadorId], (err) => resolve());
        });
        
        recompensasAplicadas.push({ tipo: "Maestria", valor: maestriaGanha });
    }
    
    return { sucesso: true, recompensas: recompensasAplicadas };
}

/**
 * Busca jogador por nome
 */
async function buscarJogadorPorNome(nome) {
    return await new Promise((resolve) => {
        db.get("SELECT * FROM jogadores WHERE LOWER(TRIM(nome)) = LOWER(TRIM(?))", [nome], (err, row) => {
            resolve(row);
        });
    });
}

/**
 * Processa lista de jogadores separados por /
 */
function parseJogadores(texto) {
    return texto.split("/").map(nome => nome.trim()).filter(nome => nome.length > 0);
}

// =====================================
// COMANDOS DE APROVAÇÃO
// =====================================
module.exports = async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    const numero = msg.author || msg.from;
    
    // Verificar se é admin
    const admin = await adminCore.isAdmin(numero);
    if (!admin) {
        return MessageService.send({ message: msg, text: "*═══ ACESSO NEGADO ═══*\nVocê não tem permissão para usar este comando." });
    }
    
    // =====================================
    // !QUEST DIÁRIA FINALIZADA
    // =====================================
    if (texto.startsWith("!quest diária finalizada") || texto.startsWith("!quest diaria finalizada")) {
        const nomeJogador = texto.replace("!quest diária finalizada", "").replace("!quest diaria finalizada", "").trim();
        
        if (!nomeJogador) {
            return MessageService.send({ message: msg, text: "*═══ USO INCORRETO ═══*\nUse: !quest diária finalizada <Nome do Player>" });
        }
        
        const jogador = await buscarJogadorPorNome(nomeJogador);
        if (!jogador) {
            return MessageService.send({ message: msg, text: `*✖ Jogador "${nomeJogador}" não encontrado.*` });
        }
        
        // Verificar bloqueio de classe avançada
        const bloqueio = await verificarBloqueio.verificarEAplicar(jogador.numero);
        if (bloqueio.bloqueado) {
            return MessageService.send({ message: msg, text: bloqueio.mensagem });
        }
        
        // Aplicar recompensas
        const resultado = await aplicarRecompensas(jogador.id, "quest_diaria", jogador.rank);
        
        if (resultado.sucesso) {
            let mensagem = `*══════════════════════════*\n`;
            mensagem += `*✅ RECOMPENSA ENTREGUE ✅*\n`;
            mensagem += `*══════════════════════════*\n\n`;
            mensagem += `*Jogador:* ${jogador.nome}\n`;
            mensagem += `*Atividade:* Quest Diária\n\n`;
            mensagem += `*Recompensas recebidas:*\n`;
            
            resultado.recompensas.forEach(rec => {
                mensagem += `> ${rec.tipo}: +${rec.valor}\n`;
            });
            
            mensagem += `\n_Rank: ${jogador.rank || "E"} | Recompensas calculadas automaticamente._`;
            
            await MessageService.send({ message: msg, text: mensagem });
        } else {
            await MessageService.send({ message: msg, text: `*✖ Erro ao aplicar recompensas: ${resultado.erro}*` });
        }
        
        return;
    }
    
    // =====================================
    // !TREINO DE MAESTRIA FINALIZADO
    // =====================================
    if (texto.startsWith("!treino de maestria finalizado")) {
        const restante = texto.replace("!treino de maestria finalizado", "").trim();
        const duracaoMatch = restante.match(/\s+(1|7|15|30)\s*dias?$/i);
        const dias = duracaoMatch ? Number(duracaoMatch[1]) : 7;
        const nomeJogador = duracaoMatch ? restante.slice(0, duracaoMatch.index).trim() : restante;
        
        if (!nomeJogador) {
            return MessageService.send({ message: msg, text: "*═══ USO INCORRETO ═══*\nUse: !treino de maestria finalizado <Nome do Player> [1/7/15/30 dias]" });
        }
        
        const jogador = await buscarJogadorPorNome(nomeJogador);
        if (!jogador) {
            return MessageService.send({ message: msg, text: `*✖ Jogador "${nomeJogador}" não encontrado.*` });
        }
        
        // Verificar bloqueio de classe avançada
        const bloqueio = await verificarBloqueio.verificarEAplicar(jogador.numero);
        if (bloqueio.bloqueado) {
            return MessageService.send({ message: msg, text: bloqueio.mensagem });
        }
        
        const resultado = await aplicarRecompensas(jogador.id, "treino_maestria", jogador.rank, `${dias}_dias`);
        
        if (resultado.sucesso) {
            let mensagem = `*══════════════════════════*\n`;
            mensagem += `*✅ RECOMPENSA ENTREGUE ✅*\n`;
            mensagem += `*══════════════════════════*\n\n`;
            mensagem += `*Jogador:* ${jogador.nome}\n`;
            mensagem += `*Atividade:* Treino de Maestria (${dias} dia${dias === 1 ? "" : "s"})\n\n`;
            mensagem += `*Recompensas recebidas:*\n`;
            
            resultado.recompensas.forEach(rec => {
                mensagem += `> ${rec.tipo}: +${rec.valor}\n`;
            });
            
            mensagem += `\n_Rank: ${jogador.rank || "E"} | Recompensas calculadas automaticamente._`;
            
            await MessageService.send({ message: msg, text: mensagem });
        } else {
            await MessageService.send({ message: msg, text: `*✖ Erro ao aplicar recompensas: ${resultado.erro}*` });
        }
        
        return;
    }
    
    // =====================================
    // !TREINO CONJUNTO FINALIZADO
    // =====================================
    if (texto.startsWith("!treino conjunto finalizado")) {
        const nomesTexto = texto.replace("!treino conjunto finalizado", "").trim();
        const nomes = parseJogadores(nomesTexto);
        
        if (nomes.length < 1) {
            return MessageService.send({ message: msg, text: "*═══ USO INCORRETO ═══*\nUse: !treino conjunto finalizado <Nome1>/<Nome2>" });
        }
        
        const resultados = [];
        
        for (const nome of nomes) {
            const jogador = await buscarJogadorPorNome(nome);
            if (!jogador) {
                resultados.push(`*✖ ${nome}: Não encontrado*`);
                continue;
            }
            
            // Verificar bloqueio de classe avançada
            const bloqueio = await verificarBloqueio.verificarEAplicar(jogador.numero);
            if (bloqueio.bloqueado) {
                resultados.push(`*⚠ ${jogador.nome}: Bloqueado (classe avançada pendente)*`);
                continue;
            }
            
            // Aplicar recompensas
            const resultado = await aplicarRecompensas(jogador.id, "treino_conjunto", jogador.rank, nomes.length);
            
            if (resultado.sucesso) {
                let msg = `*✅ ${jogador.nome}:* `;
                resultado.recompensas.forEach(rec => {
                    msg += `+${rec.valor} ${rec.tipo} `;
                });
                resultados.push(msg.trim());
            } else {
                resultados.push(`*✖ ${jogador.nome}: Erro*`);
            }
        }
        
        let mensagem = `*══════════════════════════*\n`;
        mensagem += `*✅ TREINO CONJUNTO FINALIZADO ✅*\n`;
        mensagem += `*══════════════════════════*\n\n`;
        mensagem += `*Participantes (${nomes.length}):*\n`;
        resultados.forEach(r => mensagem += `${r}\n`);
        mensagem += `\n_Rank: Individual | Recompensas calculadas automaticamente._`;
        
        await MessageService.send({ message: msg, text: mensagem });
        return;
    }
    
    // =====================================
    // !INTERAÇÃO FINALIZADA
    // =====================================
    if (texto.startsWith("!interação finalizada") || texto.startsWith("!interacao finalizada")) {
        const nomesTexto = texto.replace("!interação finalizada", "").replace("!interacao finalizada", "").trim();
        const nomes = parseJogadores(nomesTexto);
        
        if (nomes.length < 1) {
            return MessageService.send({ message: msg, text: "*═══ USO INCORRETO ═══*\nUse: !interação finalizada <Nome1>/<Nome2>" });
        }
        
        const resultados = [];
        
        for (const nome of nomes) {
            const jogador = await buscarJogadorPorNome(nome);
            if (!jogador) {
                resultados.push(`*✖ ${nome}: Não encontrado*`);
                continue;
            }
            
            // Verificar bloqueio de classe avançada
            const bloqueio = await verificarBloqueio.verificarEAplicar(jogador.numero);
            if (bloqueio.bloqueado) {
                resultados.push(`*⚠ ${jogador.nome}: Bloqueado (classe avançada pendente)*`);
                continue;
            }
            
            // Aplicar recompensas
            const resultado = await aplicarRecompensas(jogador.id, "interacao", jogador.rank);
            
            if (resultado.sucesso) {
                let msg = `*✅ ${jogador.nome}:* `;
                resultado.recompensas.forEach(rec => {
                    msg += `+${rec.valor} ${rec.tipo} `;
                });
                resultados.push(msg.trim());
            } else {
                resultados.push(`*✖ ${jogador.nome}: Erro*`);
            }
        }
        
        let mensagem = `*══════════════════════════*\n`;
        mensagem += `*✅ INTERAÇÃO FINALIZADA ✅*\n`;
        mensagem += `*══════════════════════════*\n\n`;
        mensagem += `*Participantes (${nomes.length}):*\n`;
        resultados.forEach(r => mensagem += `${r}\n`);
        mensagem += `\n_Rank: Individual | Recompensas calculadas automaticamente._`;
        
        await MessageService.send({ message: msg, text: mensagem });
        return;
    }
    
    // =====================================
    // !ONE POST FINALIZADO
    // =====================================
    if (texto.startsWith("!one post finalizado")) {
        const nomesTexto = texto.replace("!one post finalizado", "").trim();
        const nomes = parseJogadores(nomesTexto);
        
        if (nomes.length < 1) {
            return MessageService.send({ message: msg, text: "*═══ USO INCORRETO ═══*\nUse: !one post finalizado <Nome1>/<Nome2>" });
        }
        
        const resultados = [];
        
        for (const nome of nomes) {
            const jogador = await buscarJogadorPorNome(nome);
            if (!jogador) {
                resultados.push(`*✖ ${nome}: Não encontrado*`);
                continue;
            }
            
            // Verificar bloqueio de classe avançada
            const bloqueio = await verificarBloqueio.verificarEAplicar(jogador.numero);
            if (bloqueio.bloqueado) {
                resultados.push(`*⚠ ${jogador.nome}: Bloqueado (classe avançada pendente)*`);
                continue;
            }
            
            // Aplicar recompensas
            const resultado = await aplicarRecompensas(jogador.id, "one_post", jogador.rank, nomes.length);
            
            if (resultado.sucesso) {
                let msg = `*✅ ${jogador.nome}:* `;
                resultado.recompensas.forEach(rec => {
                    msg += `+${rec.valor} ${rec.tipo} `;
                });
                resultados.push(msg.trim());
            } else {
                resultados.push(`*✖ ${jogador.nome}: Erro*`);
            }
        }
        
        let mensagem = `*══════════════════════════*\n`;
        mensagem += `*✅ ONE POST FINALIZADO ✅*\n`;
        mensagem += `*══════════════════════════*\n\n`;
        mensagem += `*Participantes (${nomes.length}):*\n`;
        resultados.forEach(r => mensagem += `${r}\n`);
        mensagem += `\n_Rank: Individual | Recompensas calculadas automaticamente._`;
        
        await MessageService.send({ message: msg, text: mensagem });
        return;
    }
    
    // Se não reconheceu o comando
    return MessageService.send({ message: msg, text: `
*═══ SISTEMA DE APROVAÇÃO DE ATIVIDADES ═══*

*Comandos disponíveis:*
!quest diária finalizada <Nome> - Aprovar quest diária
!treino de maestria finalizado <Nome> [1/7/15/30 dias] - Entrega XP e Maestria pela duração
!treino conjunto finalizado <Nome1>/<Nome2> - Aprovar treino conjunto
!interação finalizada <Nome1>/<Nome2> - Aprovar interação
!one post finalizado <Nome1>/<Nome2> - Aprovar one post

_Use os comandos para conceder recompensas automaticamente._
    ` });
};
