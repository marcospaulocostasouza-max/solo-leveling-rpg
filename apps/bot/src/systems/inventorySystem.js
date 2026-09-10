/*
 * SISTEMA DE INVENTÁRIO
 * 
 * Gerencia itens dos jogadores: adicionar, remover, equipar, usar.
 * 
 * SISTEMA DE SLOTS:
 * - Cabeça: 1 slot
 * - Corpo: 1 slot
 * - Acessórios: 4 slots
 * - Itens de Apoio: 1 slot
 * - Pernas: 2 slots
 * - Pés: 1 slot
 * - Arma 1 (1FP): 2 slots (BLOQUEADO quando Arma 2 equipada)
 * - Arma 2 (2FP): 1 slot (BLOQUEIA Arma 1 quando equipada)
 */

const db = require("../core/database");
const LevelSystem = require("./levelSystem");

// Capacidade máxima de cada slot
const SLOT_CAPACIDADE = {
    "Cabeça": 1,
    "Corpo": 1,
    "Acessórios": 4,
    "Item de Apoio": 1,
    "Pernas": 2,
    "Pés": 1,
    "Arma 1": 2,
    "Arma 2": 1
};

const SLOT_POR_CHAVE = {
    cabeca: "Cabeça", corpo: "Corpo", acessorios: "Acessórios",
    itemdeapoio: "Item de Apoio", pernas: "Pernas", pes: "Pés",
    arma1: "Arma 1", arma1fp: "Arma 1", arma1f: "Arma 1",
    arma2: "Arma 2", arma2fp: "Arma 2", arma2f: "Arma 2"
};

function normalizarTexto(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function slotCanonico(valor) {
    const chave = normalizarTexto(valor).replace(/[^a-z0-9]/g, "");
    return SLOT_POR_CHAVE[chave] || null;
}

function descricaoNormalizada(item) {
    return normalizarTexto(item.descricao || item.habilidade || item.efeito);
}

class InventorySystem {

    static isConsumivel(item) {
        const categoria = normalizarTexto(item.categoria || item.slot);
        const tipo = normalizarTexto(item.tipo || item.legacyCategory);
        return Number(item.consumivel) === 1 || categoria.includes("consumivel") || tipo.includes("consumivel");
    }

    static isChaveDungeon(item) {
        return normalizarTexto(item.categoria || item.tipo).includes("chave de dungeon");
    }

    static isEquipavel(item) {
        if (this.isConsumivel(item) || this.isChaveDungeon(item)) return false;
        const categoria = normalizarTexto(item.categoria || item.slot || item.tipo);
        return Number(item.arma) === 1 || Number(item.armadura) === 1 || Number(item.escudo) === 1 || Number(item.acessorio) === 1
            || /(arma|armadura|escudo|acessor|cabeca|capacete|elmo|coroa|corpo|perna|bota|calcado)/.test(categoria);
    }

    static normalizarEfeitoConsumivel(efeito) {
        const texto = String(efeito || "").trim();
        if (!texto || texto.includes(":")) return texto;
        const cura = texto.match(/(?:regenera|recupera|cura)\s*(\d+)\s*(?:hp|vida)/i);
        if (cura) return `vida:${cura[1]}`;
        const mana = texto.match(/(?:regenera|recupera|restaura)\s*(\d+)\s*(?:mp|mana)/i);
        if (mana) return `mana:${mana[1]}`;
        const xp = texto.match(/(?:ganha|recebe)\s*(\d+)\s*xp/i);
        if (xp) return `xp:${xp[1]}`;
        return texto;
    }

    static getSlotDoItem(item) {
        // Itens novos podem declarar o slot oficial diretamente. Itens
        // legados continuam usando as regras de compatibilidade abaixo.
        const slotInformado = slotCanonico(item.slot);
        if (slotInformado) return slotInformado;
        const cat = normalizarTexto(item.slot || item.categoria || item.tipo || item.legacyCategory);
        const desc = descricaoNormalizada(item);

        if (cat.includes("arma 2") || cat.includes("arma2")) return "Arma 2";
        if (cat.includes("arma 1") || cat.includes("arma1")) return "Arma 1";
        if (cat.includes("cabe") || cat.includes("capacete") || cat.includes("elmo") || cat.includes("tiara") || cat.includes("coroa") || cat.includes("diadema") || cat.includes("mascara") || cat.includes("capuz") || cat.includes("veu")) return "Cabeça";
        if (cat.includes("corpo") || cat.includes("armadur") || cat.includes("peitoral") || cat.includes("coura") || cat.includes("casaco") || cat.includes("robe") || cat.includes("tunic") || cat.includes("manto") || cat.includes("sobretudo") || cat.includes("vestiment")) return "Corpo";
        if (cat.includes("perna") || cat.includes("greva") || cat.includes("calca") || cat.includes("saia") || cat.includes("legging")) return "Pernas";
        if (cat.includes("pes") || cat.includes("calcad") || cat.includes("sapato") || cat.includes("bota")) return "Pés";
        if (cat.includes("acessor")) return "Acessórios";
        if (cat.includes("apoio") || cat.includes("consum")) return "Item de Apoio";
        if (item.arma) {
            if (desc.includes("2-fp") || desc.includes("2 fp") || desc.includes("duas maos") || desc.includes("duas mãos")) return "Arma 2";
            return "Arma 1";
        }
        if (item.escudo || cat.includes("escud")) return "Arma 1";
        if (item.armadura) return "Corpo";
        if (item.acessorio) return "Acessórios";
        if (item.consumivel) return "Item de Apoio";
        return "Acessórios";
    }

    static parseBonus(item) {
        const bonus = { forca: 0, resistencia: 0, velocidade: 0, sentidos: 0, inteligencia: 0, poderMagico: 0 };
        bonus.forca += Number(item.forca_bonus || 0);
        bonus.resistencia += Number(item.resistencia_bonus || 0);
        bonus.velocidade += Number(item.velocidade_bonus || 0);
        bonus.sentidos += Number(item.sentidos_bonus || 0);
        bonus.inteligencia += Number(item.inteligencia_bonus || 0);
        bonus.poderMagico += Number(item.poder_magico_bonus || 0);
        const textoBonus = item.efeito || item.habilidade || "";
        if (textoBonus) {
            const mapAtributo = { forca: "forca", resistencia: "resistencia", velocidade: "velocidade", agilidade: "velocidade", sentidos: "sentidos", inteligencia: "inteligencia", "poder magico": "poderMagico", poder: "poderMagico" };
            const regex = /([\p{L}\s]+):\s*\+?(\d+)/giu;
            let match;
            while ((match = regex.exec(textoBonus)) !== null) {
                const nomeAtr = normalizarTexto(match[1]).replace(/\s+/g, " ");
                const valor = parseInt(match[2]);
                const chave = mapAtributo[nomeAtr];
                const campoBonus = chave === "poderMagico" ? "poder_magico_bonus" : `${chave}_bonus`;
                // O texto complementa colunas ausentes sem dobrar bônus que
                // já foram persistidos nos campos estruturados.
                if (chave && valor > 0 && Number(item[campoBonus] || 0) === 0) bonus[chave] += valor;
            }
        }
        return bonus;
    }

    static async adicionarItem(jogadorId, itemId, quantidade = 1) {
        const total = Number(quantidade);
        if (!Number.isSafeInteger(total) || total <= 0) return false;
        const item = await new Promise(resolve => db.get("SELECT * FROM itens WHERE id = ?", [itemId], (err, row) => resolve(row || null)));
        if (!item) return false;
        // Cada equipamento recebe uma linha por cópia. Consumíveis, chaves e
        // materiais seguem empilhados, pois não precisam de identidade própria
        // para os slots de equipamento.
        if (this.isEquipavel(item)) {
            for (let indice = 0; indice < total; indice += 1) {
                const inserido = await new Promise(resolve => db.run(
                    "INSERT INTO inventario_jogador (jogador_id, item_id, quantidade, equipado) VALUES (?, ?, 1, 0)",
                    [jogadorId, itemId], err => resolve(!err)
                ));
                if (!inserido) return false;
            }
            return true;
        }
        return new Promise((resolve) => {
            db.get("SELECT * FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogadorId, itemId], (err, existe) => {
                if (existe) {
                    db.run("UPDATE inventario_jogador SET quantidade = quantidade + ? WHERE jogador_id = ? AND item_id = ?", [total, jogadorId, itemId], (err) => resolve(!err));
                } else {
                    db.run("INSERT INTO inventario_jogador (jogador_id, item_id, quantidade, equipado) VALUES (?, ?, ?, 0)", [jogadorId, itemId, total], (err) => resolve(!err));
                }
            });
        });
    }

    static async removerItem(jogadorId, itemId, quantidade = 1) {
        return new Promise((resolve) => {
            db.get("SELECT * FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogadorId, itemId], (err, inv) => {
                if (!inv) { resolve(false); return; }
                if (inv.quantidade <= quantidade) {
                    db.run("DELETE FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogadorId, itemId], (err) => resolve(!err));
                } else {
                    db.run("UPDATE inventario_jogador SET quantidade = quantidade - ? WHERE jogador_id = ? AND item_id = ?", [quantidade, jogadorId, itemId], (err) => resolve(!err));
                }
            });
        });
    }

    // Equipamentos não empilham: cada linha de inventário é uma cópia concreta
    // identificada pelo próprio inv.id. Linhas legadas agrupadas são separadas
    // antes de listar/equipar, preservando uma eventual cópia já equipada.
    static async prepararInstanciasEquipaveis(jogadorId) {
        const itens = await new Promise(resolve => db.all(
            `SELECT inv.id AS inventario_id, inv.item_id, inv.quantidade, inv.equipado, i.*
             FROM inventario_jogador inv JOIN itens i ON i.id = inv.item_id
             WHERE inv.jogador_id = ? AND inv.quantidade > 1`,
            [jogadorId], (err, rows) => resolve(rows || [])
        ));
        for (const item of itens) {
            if (!this.isEquipavel(item)) continue;
            const quantidade = Number(item.quantidade || 0);
            if (quantidade < 2) continue;
            await new Promise((resolve, reject) => db.run(
                "UPDATE inventario_jogador SET quantidade = 1 WHERE id = ? AND jogador_id = ?",
                [item.inventario_id, jogadorId], err => err ? reject(err) : resolve()
            ));
            for (let indice = 1; indice < quantidade; indice += 1) {
                await new Promise((resolve, reject) => db.run(
                    "INSERT INTO inventario_jogador (jogador_id, item_id, quantidade, equipado, item_inicial) VALUES (?, ?, 1, 0, 0)",
                    [jogadorId, item.item_id], err => err ? reject(err) : resolve()
                ));
            }
        }
    }

    static async equiparItem(jogadorId, itemId, inventarioId = null) {
        return new Promise((resolve) => {
            const filtro = inventarioId ? "inv.id = ?" : "inv.item_id = ?";
            const alvo = inventarioId || itemId;
            db.get(`SELECT i.*, inv.id AS inventario_id, inv.equipado FROM inventario_jogador inv JOIN itens i ON inv.item_id = i.id WHERE inv.jogador_id = ? AND ${filtro}`, [jogadorId, alvo], async (err, item) => {
                if (!item) { resolve({ erro: "Item não encontrado no inventário." }); return; }
                if (this.isChaveDungeon(item)) { resolve({ erro: "Chaves de Dungeon não são equipáveis. Use !abrir dungeon para abri-la." }); return; }
                if (this.isConsumivel(item)) { resolve({ erro: "Itens consumíveis não podem ser equipados. Use !usar <item>." }); return; }
                // SQLite retorna 0/1 numéricos, mas PostgreSQL pode retornar
                // "0"/"1" como texto. "0" é truthy em JavaScript e fazia
                // !equipar cair no ramo de desequipar sem alterar o registro.
                const novoEstado = Number(item.equipado) === 1 ? 0 : 1;
                const slotItem = this.getSlotDoItem(item);
                if (novoEstado === 0) {
                    db.run("UPDATE inventario_jogador SET equipado = 0 WHERE id = ? AND jogador_id = ?", [item.inventario_id, jogadorId], (err) => {
                        if (err) { resolve({ erro: "Erro ao desequipar item." }); return; }
                        require("./atributoSystem").recalcularAtributos(jogadorId).then(() => resolve({ sucesso: true, acao: "desequipado", item: item.nome, slot: slotItem }));
                    });
                    return;
                }
                const equipados = await new Promise((resolveEq) => {
                    db.all(`SELECT i.*, inv.id AS inventario_id, inv.equipado FROM inventario_jogador inv JOIN itens i ON inv.item_id = i.id WHERE inv.jogador_id = ? AND inv.equipado = 1`, [jogadorId], (err, rows) => resolveEq(rows || []));
                });
                const contagemSlots = {};
                equipados.forEach(eq => { const slot = this.getSlotDoItem(eq); contagemSlots[slot] = (contagemSlots[slot] || 0) + 1; });
                if (slotItem === "Arma 2") {
                    if ((contagemSlots["Arma 2"] || 0) >= SLOT_CAPACIDADE["Arma 2"]) { resolve({ erro: "Slot de Arma 2 (2FP) já está ocupado. Desequipe primeiro." }); return; }
                    for (const eq of equipados) {
                        if (this.getSlotDoItem(eq) === "Arma 1") {
                            await new Promise((resolveDes) => { db.run("UPDATE inventario_jogador SET equipado = 0 WHERE id = ? AND jogador_id = ?", [eq.inventario_id, jogadorId], () => resolveDes()); });
                        }
                    }
                }
                if (slotItem === "Arma 1") {
                    if ((contagemSlots["Arma 2"] || 0) > 0) { resolve({ erro: "Você tem uma Arma 2FP equipada! Desequipe-a primeiro para usar armas 1FP." }); return; }
                    if ((contagemSlots["Arma 1"] || 0) >= SLOT_CAPACIDADE["Arma 1"]) { resolve({ erro: `Slots de Arma 1 (1FP) estão cheios (${SLOT_CAPACIDADE["Arma 1"]}/2). Desequipe um item primeiro.` }); return; }
                }
                if (slotItem !== "Arma 2" && slotItem !== "Arma 1") {
                    const capacidade = SLOT_CAPACIDADE[slotItem] || 1;
                    if ((contagemSlots[slotItem] || 0) >= capacidade) { resolve({ erro: `Slot de ${slotItem} está cheio (${capacidade} máximo). Desequipe um item primeiro.` }); return; }
                }
                db.run("UPDATE inventario_jogador SET equipado = 1 WHERE id = ? AND jogador_id = ?", [item.inventario_id, jogadorId], function (err) {
                    if (err || this.changes !== 1) { resolve({ erro: "Não foi possível registrar o equipamento no inventário." }); return; }
                    require("./atributoSystem").recalcularAtributos(jogadorId).then(() => resolve({ sucesso: true, acao: "equipado", item: item.nome, slot: slotItem }));
                });
            });
        });
    }

    static async usarItem(jogadorId, itemId) {
        return new Promise((resolve) => {
            db.get(`SELECT i.*, inv.* FROM inventario_jogador inv JOIN itens i ON inv.item_id = i.id WHERE inv.jogador_id = ? AND inv.item_id = ?`, [jogadorId, itemId], async (err, item) => {
                if (!item) { resolve({ erro: "Item não encontrado." }); return; }
                if (!this.isConsumivel(item)) { resolve({ erro: "Este item não é consumível." }); return; }
                const efeitos = []; const xpEfeitos = [];
                const efeitoNormalizado = this.normalizarEfeitoConsumivel(item.efeito || item.habilidade);
                if (efeitoNormalizado) {
                    const efeitoSeparado = efeitoNormalizado.split(",");
                    efeitoSeparado.forEach(efeito => {
                        const [tipo, valor] = efeito.trim().split(":");
                        const efeitoFormatado = { tipo: tipo.toLowerCase(), valor: parseInt(valor) };
                        if (efeitoFormatado.tipo === "xp") xpEfeitos.push(efeitoFormatado.valor);
                        else efeitos.push(efeitoFormatado);
                    });
                }
                if (efeitos.length === 0 && xpEfeitos.length === 0) {
                    resolve({ erro: "Este consumível não possui efeito automático. Use-o em uma cena narrada com a mesa." });
                    return;
                }
                let sqlUpdate = "UPDATE jogadores SET "; const updates = []; const params = [];
                efeitos.forEach(efeito => {
                    switch (efeito.tipo) {
                        case "mana": updates.push("mana_atual = MIN(mana_atual + ?, mana_maxima)"); break;
                        case "vida": updates.push("vida_atual = MIN(vida_atual + ?, vida_maxima)"); break;
                    }
                    params.push(efeito.valor);
                });
                if (updates.length > 0) { sqlUpdate += updates.join(", "); sqlUpdate += " WHERE id = ?"; params.push(jogadorId); db.run(sqlUpdate, params); }
                if (xpEfeitos.length > 0) { for (const xpValor of xpEfeitos) { await LevelSystem.adicionarXp(jogadorId, xpValor, `Item consumível usado`); } }
                await this.removerItem(jogadorId, itemId);
                resolve({ sucesso: true, efeitos: [...efeitos, ...xpEfeitos.map(valor => ({ tipo: "xp", valor }))], item: item.nome });
            });
        });
    }

    static async listarInventario(jogadorId) {
        await this.prepararInstanciasEquipaveis(jogadorId);
        return new Promise((resolve) => {
            db.all(`SELECT i.*, inv.id AS inventario_id, inv.quantidade, inv.equipado, inv.item_inicial FROM inventario_jogador inv JOIN itens i ON inv.item_id = i.id WHERE inv.jogador_id = ? ORDER BY inv.equipado DESC, i.categoria, inv.id`, [jogadorId], (err, itens) => { resolve(itens || []); });
        });
    }

    static async calcularBonusEquipados(jogadorId) {
        return new Promise((resolve) => {
            db.all(`SELECT i.* FROM inventario_jogador inv JOIN itens i ON inv.item_id = i.id WHERE inv.jogador_id = ? AND inv.equipado = 1`, [jogadorId], (err, itens) => {
                const bonus = { forca: 0, resistencia: 0, velocidade: 0, sentidos: 0, inteligencia: 0, poderMagico: 0 };
                (itens || []).forEach(item => {
                    const bonusItem = this.parseBonus(item);
                    bonus.forca += bonusItem.forca; bonus.resistencia += bonusItem.resistencia; bonus.velocidade += bonusItem.velocidade;
                    bonus.sentidos += bonusItem.sentidos; bonus.inteligencia += bonusItem.inteligencia; bonus.poderMagico += bonusItem.poderMagico;
                });
                resolve(bonus);
            });
        });
    }

    static async getSlotsEquipados(jogadorId) {
        return new Promise((resolve) => {
            db.all(`SELECT i.* FROM inventario_jogador inv JOIN itens i ON inv.item_id = i.id WHERE inv.jogador_id = ? AND inv.equipado = 1`, [jogadorId], (err, itens) => { resolve(itens || []); });
        });
    }
}

module.exports = InventorySystem;
module.exports.SLOT_CAPACIDADE = SLOT_CAPACIDADE;
