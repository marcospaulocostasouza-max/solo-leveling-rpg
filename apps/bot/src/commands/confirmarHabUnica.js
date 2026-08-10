const MessageService = require("../core/messageService");

/**
 * COMANDO: !confirmar hab única
 * 
 * Processa o template de Habilidade Única pendente e cria a técnica
 * no banco de dados, adicionando-a ao jogador informado em "Pertencente".
 */

const db = require("../core/database");
const adminCore = require("../core/adminCore");

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
             WHERE status = 'pendente' AND criado_por = ?
             ORDER BY id DESC LIMIT 1`,
            [numero],
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
    
    // Buscar o jogador pelo nome (Pertencente)
    const jogador = await new Promise((resolve) => {
        db.get("SELECT * FROM jogadores WHERE LOWER(nome) = LOWER(?)", [dados.pertencente], (err, row) => {
            if (!row) {
                db.get("SELECT * FROM jogadores WHERE LOWER(nome) LIKE LOWER(?)", [`%${dados.pertencente}%`], (err, row2) => {
                    resolve(row2);
                });
            } else {
                resolve(row);
            }
        });
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
    const nomeTecnica = `[Única] ${dados.nome}`;
    
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
            `INSERT INTO tecnicas (nome, classe, categoria, tipo, descricao, custo_mana, cooldown, nivel_desbloqueio, passiva)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            [
                nomeTecnica,
                dados.classe || "Geral",
                dados.categoria || "Geral",
                dados.tipo || "Ativa",
                dados.descricao || "Habilidade Única",
                dados.custo_mana || 0,
                dados.cooldown || 0,
                dados.tipo === "Passiva" ? 1 : 0
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
    await new Promise((resolve) => {
        db.run(
            `INSERT OR IGNORE INTO jogador_tecnicas (jogador_id, tecnica_id, nivel, equipada)
             VALUES (?, ?, 1, 1)`,
            [jogador.id, tecnicaId],
            (err) => resolve()
        );
    });
    
    // =====================================
    // ATUALIZAR STATUS DA HABILIDADE ÚNICA DO JOGADOR
    // =====================================
    const habUnicaAtual = jogador.habilidade_unica || "Nenhuma";
    if (habUnicaAtual === "Nenhuma" || habUnicaAtual === "") {
        db.run("UPDATE jogadores SET habilidade_unica = ? WHERE id = ?", [dados.nome, jogador.id]);
    }
    
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
*═══ HABILIDADE ÚNICA CRIADA! ═══*
══════════════════════════

*Habilidade:* ${dados.nome}
*Jogador:* ${jogador.nome}
*Tipo:* ${dados.tipo}
*Custo de Mana:* ${dados.custo_mana}
*Cooldown:* ${dados.cooldown} turnos

══════════════════════════
*A técnica foi adicionada à lista de técnicas do jogador!*
*Use !tecnicas para visualizar as técnicas do personagem.*
    ` });
};