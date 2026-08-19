const MessageService = require("../core/messageService");

/**
 * COMANDO: !confirmar hab única
 * 
 * Processa o template de Habilidade Única pendente e cria a técnica
 * no banco de dados, adicionando-a ao jogador informado em "Pertencente".
 */

const db = require("../core/database");
const adminCore = require("../core/adminCore");
const { provider } = require("../../../../packages/database/config");

module.exports = async (msg) => {
    const numero = msg.author || msg.from;
    
    // Verificar se é admin
    const admin = await adminCore.isAdmin(numero);
    if (!admin) {
        return MessageService.send({ message: msg, text: "*═══ ACESSO NEGADO ═══*\nVocê não tem permissão para usar este comando." });
    }
    
    // Buscar a última habilidade única pendente criada por este admin
    const pendente = await new Promise((resolve) => {
        db.get(
            `SELECT * FROM habilidades_unicas_pendentes 
             WHERE status = 'pendente'
             ORDER BY id DESC LIMIT 1`,
            [],
            (err, row) => resolve(row)
        );
    });
    
    if (!pendente) {
        return MessageService.send({ message: msg, text: `
*═══ NENHUM TEMPLATE PENDENTE ═══*
Não há habilidades únicas pendentes para confirmar.

*Para criar uma nova:*
1. Use *!criar hab única* para ver o modelo
2. Preencha o modelo e envie no grupo
3. Use *!confirmar hab única* para processar
        ` });
    }
    
    const dados = JSON.parse(pendente.dados);
    dados.rank = String(dados.rank || "E").trim().toUpperCase();
    if (!["E", "D", "C", "B", "A", "S"].includes(dados.rank)) {
        return MessageService.send({ message: msg, text: `*✖ Rank de técnica inválido:* ${dados.rank}. Use E, D, C, B, A ou S.` });
    }
    await new Promise((resolve, reject) => db.run(
        provider === "postgres" ? "ALTER TABLE tecnicas ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT 'E'" : "ALTER TABLE tecnicas ADD COLUMN rank TEXT DEFAULT 'E'",
        [], err => {
            if (err && provider !== "postgres" && /duplicate column/i.test(err.message)) return resolve();
            return err ? reject(err) : resolve();
        }
    ));
    
    // Buscar o jogador pelo nome (Pertencente)
    const jogador = await new Promise((resolve) => {
        db.get("SELECT * FROM jogadores WHERE LOWER(TRIM(nome)) = LOWER(TRIM(?))", [dados.pertencente], (err, row) => resolve(err ? null : row || null));
    });
    
    if (!jogador) {
        return MessageService.send({ message: msg, text: `
*✖ Jogador "${dados.pertencente}" não encontrado.*
Verifique se o nome está correto ou se o jogador já possui ficha aprovada.
        ` });
    }
    
    // =====================================
    // CRIAR A TÉCNICA NO BANCO
    // =====================================
    const nomeTecnica = `[Personalizada] ${dados.nome}`;
    
    // Verificar se já existe técnica com este nome
    const tecnicaExistente = await new Promise((resolve) => {
        db.get("SELECT * FROM tecnicas WHERE LOWER(nome) = LOWER(?)", [nomeTecnica], (err, row) => {
            resolve(row);
        });
    });
    
    if (tecnicaExistente) {
        return MessageService.send({ message: msg, text: `*✖ Já existe uma técnica com o nome "${dados.nome}".*` });
    }
    
    // Inserir a técnica na tabela de técnicas
    const tecnicaId = await new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO tecnicas (nome, classe, categoria, tipo, descricao, custo_mana, cooldown, nivel_desbloqueio, rank, passiva)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [
                nomeTecnica,
                dados.classe || "Geral",
                dados.categoria || "Geral",
                dados.tipo || "Ativa",
                dados.descricao || "Habilidade Única",
                dados.custo_mana || 0,
                dados.cooldown || 0,
                dados.nivel_desbloqueio || 1,
                dados.rank || "E",
                String(dados.tipo).toLowerCase() === "passiva" ? 1 : 0
            ],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
    
    if (!tecnicaId) {
        return MessageService.send({ message: msg, text: "*✖ Erro ao criar a técnica no banco de dados.*" });
    }
    
    // =====================================
    // ADICIONAR A TÉCNICA AO JOGADOR
    // =====================================
    await new Promise((resolve, reject) => {
        db.run(
            `INSERT OR IGNORE INTO jogador_tecnicas (jogador_id, tecnica_id, nivel, equipada)
             VALUES (?, ?, 1, 1)`,
            [jogador.id, tecnicaId],
            (err) => err ? reject(err) : resolve()
        );
    });
    const vinculoCriado = await new Promise((resolve, reject) => db.get(
        "SELECT id FROM jogador_tecnicas WHERE jogador_id = ? AND tecnica_id = ?",
        [jogador.id, tecnicaId], (err, row) => err ? reject(err) : resolve(row)
    ));
    if (!vinculoCriado) throw new Error("A técnica foi criada, mas não foi vinculada ao jogador.");
    
    // =====================================
    // MARCAR COMO CONCLUÍDO
    // =====================================
    await new Promise((resolve) => {
        db.run(
            "UPDATE habilidades_unicas_pendentes SET status = 'concluido' WHERE id = ?",
            [pendente.id],
            (err) => resolve()
        );
    });
    
    // Registrar log
    if (adminCore.registrarLog) {
        adminCore.registrarLog(
            numero, admin.nome || "Admin",
            "criar_hab_unica", jogador.nome,
            `Habilidade Única: ${dados.nome}`, "", nomeTecnica
        );
    }
    
    await MessageService.send({ message: msg, text: `
*═══ TÉCNICA PERSONALIZADA INTEGRADA! ═══*
══════════════════════════

*Técnica:* ${dados.nome}
*Jogador:* ${jogador.nome}
*Tipo:* ${dados.tipo}
*Custo de Mana:* ${dados.custo_mana}
*Cooldown:* ${dados.cooldown} turnos

══════════════════════════
*A técnica foi adicionada à lista de técnicas do jogador!*
*Use !tecnicas para visualizar as técnicas do personagem.*
    ` });
};
