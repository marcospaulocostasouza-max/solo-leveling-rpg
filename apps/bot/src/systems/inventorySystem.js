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

class InventorySystem {

    static isConsumivel(item) {
        const categoria = (item.categoria || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const tipo = (item.tipo || item.legacyCategory || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        return Number(item.consumivel) === 1 || categoria.includes("consumivel") || tipo.includes("consumivel");
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
        const cat = (item.categoria || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (cat.includes("arma 1") || cat.includes("arma1")) return "Arma 1";
        if (cat.includes("arma 2") || cat.includes("arma2")) return "Arma 2";
        if (cat.includes("cabe")) return "Cabeça";
        if (cat.includes("corpo")) return "Corpo";
        if (cat.includes("perna")) return "Pernas";
        if (cat.includes("pes") || cat.includes("calcad") || cat.includes("sapato") || cat.includes("bota")) return "Pés";
        if (cat.includes("acess")) return "Acessórios";
        if (cat.includes("apoio") || cat.includes("consum")) return "Item de Apoio";
        if (item.arma) {
            const desc = (item.descricao || "").toLowerCase();
            if (desc.includes("2-fp") || desc.includes("2 fp") || desc.includes("duas maos")) return "Arma 2";
            return "Arma 1";
        }
        if (item.escudo) return "Arma 1";
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
        if (textoBonus && (bonus.forca === 0 && bonus.resistencia === 0 && bonus.velocidade === 0 && bonus.sentidos === 0 && bonus.inteligencia === 0 && bonus.poderMagico === 0)) {
            const mapAtributo = { "forca": "forca", "força": "forca", "resistencia": "resistencia", "resistência": "resistencia", "velocidade": "velocidade", "agilidade": "velocidade", "sentidos": "sentidos", "inteligencia": "inteligencia", "inteligência": "inteligencia", "poder magico": "poderMagico", "poder mágico": "poderMagico", "poder": "poderMagico" };
            const regex = /([a-záéíóúãõç\s]+):\s*\+?(\d+)/gi;
            let match;
            while ((match = regex.exec(textoBonus)) !== null) {
                const nomeAtr = match[1].trim().toLowerCase();
                const valor = parseInt(match[2]);
                const chave = mapAtributo[nomeAtr];
                if (chave && valor > 0) bonus[chave] += valor;
            }
        }
        return bonus;
    }

    static async adicionarItem(jogadorId, itemId, quantidade = 1) {
        return new Promise((resolve) => {
            db.get("SELECT * FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogadorId, itemId], (err, existe) => {
                if (existe) {
                    db.run("UPDATE inventario_jogador SET quantidade = quantidade + ? WHERE jogador_id = ? AND item_id = ?", [quantidade, jogadorId, itemId], (err) => resolve(!err));
                } else {
                    db.run("INSERT INTO inventario_jogador (jogador_id, item_id, quantidade, equipado) VALUES (?, ?, ?, 0)", [jogadorId, itemId, quantidade], (err) => resolve(!err));
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

    static async equiparItem(jogadorId, itemId) {
        return new Promise((resolve) => {
            db.get(`SELECT i.*, inv.equipado FROM inventario_jogador inv JOIN itens i ON inv.item_id = i.id WHERE inv.jogador_id = ? AND inv.item_id = ?`, [jogadorId, itemId], async (err, item) => {
                if (!item) { resolve({ erro: "Item não encontrado no inventário." }); return; }
                if (this.isConsumivel(item)) { resolve({ erro: "Itens consumíveis não podem ser equipados. Use !usar <item>." }); return; }
                const novoEstado = item.equipado ? 0 : 1;
                const slotItem = this.getSlotDoItem(item);
                if (novoEstado === 0) {
                    db.run("UPDATE inventario_jogador SET equipado = 0 WHERE jogador_id = ? AND item_id = ?", [jogadorId, itemId], (err) => {
                        if (err) { resolve({ erro: "Erro ao desequipar item." }); return; }
                        require("./atributoSystem").recalcularAtributos(jogadorId).then(() => resolve({ sucesso: true, acao: "desequipado", item: item.nome, slot: slotItem }));
                    });
                    return;
                }
                const equipados = await new Promise((resolveEq) => {
                    db.all(`SELECT i.*, inv.equipado FROM inventario_jogador inv JOIN itens i ON inv.item_id = i.id WHERE inv.jogador_id = ? AND inv.equipado = 1`, [jogadorId], (err, rows) => resolveEq(rows || []));
                });
                const contagemSlots = {};
                equipados.forEach(eq => { const slot = this.getSlotDoItem(eq); contagemSlots[slot] = (contagemSlots[slot] || 0) + 1; });
                if (slotItem === "Arma 2") {
                    if ((contagemSlots["Arma 2"] || 0) >= SLOT_CAPACIDADE["Arma 2"]) { resolve({ erro: "Slot de Arma 2 (2FP) já está ocupado. Desequipe primeiro." }); return; }
                    for (const eq of equipados) {
                        if (this.getSlotDoItem(eq) === "Arma 1") {
                            await new Promise((resolveDes) => { db.run("UPDATE inventario_jogador SET equipado = 0 WHERE jogador_id = ? AND item_id = ?", [jogadorId, eq.id], () => resolveDes()); });
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
                db.run("UPDATE inventario_jogador SET equipado = 1 WHERE jogador_id = ? AND item_id = ?", [jogadorId, itemId], (err) => {
                    if (err) { resolve({ erro: "Erro ao equipar item." }); return; }
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
        return new Promise((resolve) => {
            db.all(`SELECT i.*, inv.quantidade, inv.equipado, inv.item_inicial FROM inventario_jogador inv JOIN itens i ON inv.item_id = i.id WHERE inv.jogador_id = ? ORDER BY inv.equipado DESC, i.categoria`, [jogadorId], (err, itens) => { resolve(itens || []); });
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
