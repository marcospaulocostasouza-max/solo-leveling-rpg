const MessageService = require("../core/messageService");

/**
 * COMANDO: !confirmar item único
 * 
 * Processa o template de Item Único pendente e cria o item
 * no banco de dados, adicionando-o ao inventário do jogador informado.
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
    
    // Buscar o último item único pendente criado por este admin
    const pendente = await new Promise((resolve) => {
        db.get(
            `SELECT * FROM itens_unicos_pendentes 
             WHERE status = 'pendente'
             ORDER BY id DESC LIMIT 1`,
            [],
            (err, row) => resolve(row)
        );
    });
    
    if (!pendente) {
        return MessageService.send({ message: msg, text: `
*═══ NENHUM TEMPLATE PENDENTE ═══*
Não há itens únicos pendentes para confirmar.

*Para criar um novo:*
1. Use *!criar item único* para ver o modelo
2. Preencha o modelo e envie no grupo
3. Use *!confirmar item único* para processar
        ` });
    }
    
    const dados = JSON.parse(pendente.dados);
    const slotsValidos = ["Cabeça", "Corpo", "Acessórios", "Item de Apoio", "Pernas", "Pés", "Arma 1", "Arma 2"];
    const normalizar = valor => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
    const slotCanonico = slotsValidos.find(slot => normalizar(slot) === normalizar(dados.slot));
    if (!slotCanonico) return MessageService.send({ message: msg, text: `*✖ Slot inválido:* ${dados.slot || "não informado"}. Use: ${slotsValidos.join(", ")}.` });
    dados.slot = slotCanonico;
    const tiersValidos = ["Comum", "Incomum", "Raro", "Épico", "Lendário", "Único"];
    const tierCanonico = tiersValidos.find(tier => normalizar(tier) === normalizar(dados.tier));
    if (!tierCanonico) return MessageService.send({ message: msg, text: `*✖ Rank/Tier inválido:* ${dados.tier}.` });
    dados.tier = tierCanonico;
    
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
    // CRIAR O ITEM NO BANCO
    // =====================================
    const nomeItem = `[Personalizado] ${dados.nome}`;
    
    // Verificar se já existe item com este nome
    const itemExistente = await new Promise((resolve) => {
        db.get("SELECT * FROM itens WHERE LOWER(nome) = LOWER(?)", [nomeItem], (err, row) => {
            resolve(row);
        });
    });
    
    if (itemExistente) {
        return MessageService.send({ message: msg, text: `*✖ Já existe um item com o nome "${dados.nome}".*` });
    }
    
    // Determinar categoria
    const categoria = dados.categoria || "Equipamento";
    const isArma = categoria.toLowerCase() === "arma" ? 1 : 0;
    const isArmadura = categoria.toLowerCase() === "armadura" ? 1 : 0;
    const isEscudo = categoria.toLowerCase() === "escudo" ? 1 : 0;
    const isAcessorio = categoria.toLowerCase() === "acessório" || categoria.toLowerCase() === "acessorio" ? 1 : 0;
    const isConsumivel = categoria.toLowerCase() === "consumível" || categoria.toLowerCase() === "consumivel" ? 1 : 0;
    
    // Inserir o item na tabela de itens
    const itemId = await new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO itens (nome, categoria, tier, descricao, 
             arma, armadura, escudo, acessorio, consumivel,
             forca_bonus, resistencia_bonus, velocidade_bonus, sentidos_bonus, 
             inteligencia_bonus, poder_magico_bonus, efeito, item_unico)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1) RETURNING id`,
            [
                nomeItem,
                dados.slot || dados.categoria || "Equipamento",
                dados.tier || "Único",
                dados.descricao || "Item Único",
                isArma, isArmadura, isEscudo, isAcessorio, isConsumivel,
                dados.forca_bonus || 0,
                dados.resistencia_bonus || 0,
                dados.velocidade_bonus || 0,
                dados.sentidos_bonus || 0,
                dados.inteligencia_bonus || 0,
                dados.poder_magico_bonus || 0,
                dados.efeito || ""
            ],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
    
    if (!itemId) {
        return MessageService.send({ message: msg, text: "*✖ Erro ao criar o item no banco de dados.*" });
    }
    
    // =====================================
    // ADICIONAR O ITEM AO INVENTÁRIO DO JOGADOR
    // =====================================
    await new Promise((resolve) => {
        db.run(
            `INSERT INTO inventario_jogador (jogador_id, item_id, quantidade, equipado)
             VALUES (?, ?, 1, 0)`,
            [jogador.id, itemId],
            (err) => resolve()
        );
    });
    
    // =====================================
    // MARCAR COMO CONCLUÍDO
    // =====================================
    await new Promise((resolve) => {
        db.run(
            "UPDATE itens_unicos_pendentes SET status = 'concluido' WHERE id = ?",
            [pendente.id],
            (err) => resolve()
        );
    });
    
    // Registrar log
    if (adminCore.registrarLog) {
        adminCore.registrarLog(
            numero, admin.nome || "Admin",
            "criar_item_unico", jogador.nome,
            `Item Único: ${dados.nome}`, "", nomeItem
        );
    }
    
    await MessageService.send({ message: msg, text: `
*═══ ITEM ÚNICO CRIADO! ═══*
══════════════════════════

*Item:* ${dados.nome}
*Categoria:* ${dados.categoria || "Equipamento"}
*Tier:* ${dados.tier || "Único"}
*Jogador:* ${jogador.nome}

*Bônus:*
> Força: +${dados.forca_bonus || 0}
> Resistência: +${dados.resistencia_bonus || 0}
> Velocidade: +${dados.velocidade_bonus || 0}
> Sentidos: +${dados.sentidos_bonus || 0}
> Inteligência: +${dados.inteligencia_bonus || 0}
> Poder Mágico: +${dados.poder_magico_bonus || 0}

${dados.efeito ? `*Efeito:* ${dados.efeito}\n` : ""}
══════════════════════════
*O item foi adicionado ao inventário do jogador!*
*Use !inventario para visualizar os itens do personagem.*
    ` });
};
