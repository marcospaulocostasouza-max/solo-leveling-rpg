const MessageService = require("../core/messageService");

/**
 * COMANDO: !guerra
 * 
 * Sistema de Guerra entre Guildas.
 * Guildas podem declarar guerra a cada 15 dias.
 * A guerra é decidida por modos de combate aleatórios.
 */

const db = require("../core/database");

module.exports = async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    const args = texto.split(" ");
    const numero = msg.author || msg.from;
    
    // !guerra - Mostrar informações gerais
    if (args.length === 1 || (args[1] && args[1] === "info")) {
        // Buscar guerras ativas no sistema
        const guerrasAtivas = await new Promise((resolve) => {
            db.all(
                `SELECT gg.*, g1.nome as atacante_nome, g2.nome as defensora_nome
                 FROM guerras_guildas gg
                 LEFT JOIN guildas g1 ON gg.guilda_atacante = g1.id
                 LEFT JOIN guildas g2 ON gg.guilda_defensora = g2.id
                 WHERE gg.status = 'pendente' OR gg.status = 'ativa'
                 ORDER BY gg.data DESC
                 LIMIT 5`,
                [],
                (err, rows) => resolve(rows || [])
            );
        });
        
        let guerrasInfo = "";
        if (guerrasAtivas.length > 0) {
            guerrasInfo = "\n*GUERRAS ATIVAS:*\n";
            guerrasAtivas.forEach(g => {
                guerrasInfo += `> ${g.atacante_nome || "?"} vs ${g.defensora_nome || "?"} (${g.status})\n`;
            });
        }
        
        await MessageService.send({ message: msg, text: `
*═══ GUERRA DE GUILDAS ═══*

A cada 15 dias, líderes podem declarar guerra contra outra guilda.

*MODOS DE COMBATE (SORTEADOS)*
1. *Finalizar Boss* - Qual equipe derrota o boss primeiro
2. *Roubo de Bandeira* - Capture a bandeira inimiga
3. *5v5* - Batalha em equipe
4. *1v1* - Duelo de campeões
5. *Último Vivo* - Battle royale
6. *Destruição de Cristal* - Proteja seu cristal
7. *Vilões vs Heróis* - Times desiguais
8. *Salve o Refém* - Resgate ou execução

*PASSIVAS DE GUERRA*
- Guilda vencedora ganha passiva única e permanente
- Máximo de 5 passivas acumuladas
- Passivas podem ser perdidas se a guilda for derrotada

*PREMIAÇÕES*
- Vencedor: 1.000.000 Won + 10.000 XP
- Perdedor: 500.000 Won + 10.000 XP

*COMO DECLARAR GUERRA*
1. O líder da guilda deve usar o comando no grupo apropriado
2. A guilda defensora é notificada automaticamente
3. Após 24h, o modo de combate é sorteado
4. A guerra ocorre no grupo designado${guerrasInfo}

══════════════════════════
_Consulte a administração para declarar guerra._
        ` });
        return;
    }
    
    // !guerra declarar <guilda> - Declarar guerra (admin/líder)
    if (args[1] === "declarar" && args[2]) {
        const nomeGuilda = args.slice(2).join(" ");
        
        // Verificar se é admin
        const admin = await new Promise((resolve) => {
            db.get("SELECT * FROM administradores WHERE numero = ?", [numero], (err, row) => {
                resolve(row);
            });
        });
        
        if (!admin) {
            return MessageService.send({ message: msg, text: "*═══ Apenas administradores podem declarar guerra no sistema. ═══*" });
        }
        
        // Buscar guildas
        const guildaAtacante = await new Promise((resolve) => {
            db.get("SELECT * FROM guildas WHERE lider = ?", [numero], (err, row) => {
                resolve(row);
            });
        });
        
        const guildaDefensora = await new Promise((resolve) => {
            db.get("SELECT * FROM guildas WHERE LOWER(nome) = LOWER(?)", [nomeGuilda], (err, row) => {
                resolve(row);
            });
        });
        
        if (!guildaDefensora) {
            return MessageService.send({ message: msg, text: `*✖ Guilda "${nomeGuilda}" não encontrada.*` });
        }
        
        // Registrar guerra
        db.run(
            `INSERT INTO guerras_guildas (guilda_atacante, guilda_defensora, modo, status, data)
             VALUES (?, ?, 'pendente', 'pendente', datetime('now'))`,
            [guildaAtacante?.id || 0, guildaDefensora.id],
            function(err) {
                if (err) {
                    return MessageService.send({ message: msg, text: "*✖ Erro ao declarar guerra.*" });
                }
                
                MessageService.send({ message: msg, text: `
*═══ GUERRA DECLARADA! ═══*

*${guildaAtacante?.nome || "Desconhecida"}* declarou guerra contra *${guildaDefensora.nome}*!

A batalha será agendada em breve.
Ambas as guildas serão notificadas.
                ` });
            }
        );
        return;
    }
    
    // !guerra status - Ver status de guerra da guilda do jogador
    if (args[1] === "status") {
        const jogador = await new Promise((resolve) => {
            db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], (err, row) => {
                resolve(row);
            });
        });
        
        if (!jogador) {
            return MessageService.send({ message: msg, text: "*═══ Você não possui ficha. ═══*" });
        }
        
        // Buscar guilda do jogador
        const membro = await new Promise((resolve) => {
            db.get(
                `SELECT g.*, gm.cargo FROM guilda_membros gm
                 JOIN guildas g ON gm.guilda_id = g.id
                 WHERE gm.jogador_id = ?`,
                [jogador.id],
                (err, row) => resolve(row)
            );
        });
        
        if (!membro) {
            return MessageService.send({ message: msg, text: "*═══ Você não pertence a nenhuma guilda. ═══*" });
        }
        
        // Buscar guerras da guilda
        const guerras = await new Promise((resolve) => {
            db.all(
                `SELECT * FROM guerras_guildas
                 WHERE guilda_atacante = ? OR guilda_defensora = ?
                 ORDER BY data DESC LIMIT 5`,
                [membro.id, membro.id],
                (err, rows) => resolve(rows || [])
            );
        });
        
        let guerraInfo = "*Nenhuma guerra registrada.*";
        if (guerras.length > 0) {
            guerraInfo = guerras.map(g => {
                const lado = g.guilda_atacante === membro.id ? "Atacante" : "Defensora";
                return `> ${g.status} | ${lado} | ${g.data || "N/A"}`;
            }).join("\n");
        }
        
        await MessageService.send({ message: msg, text: `
*═══ STATUS DE GUERRA ═══*
*Guilda:* ${membro.nome}

*Registro de Guerras:*
${guerraInfo}

══════════════════════════
_Use !guerra info para ver detalhes do sistema._
        ` });
        return;
    }
};