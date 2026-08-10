const MessageService = require("../core/messageService");

/*
 * COMANDO: !equipados
 * 
 * Exibe todos os slots de equipamentos do jogador.
 * Mostra quais estão ocupados/livres, capacidades e itens equipados.
 */

const db = require("../core/database");
const InventorySystem = require("../systems/inventorySystem");

// Capacidades dos slots (nome interno = nome do InventorySystem)
const SLOTS = [
    { nome: "Cabeça", exibir: "Slot de Cabeça", capacidade: 1 },
    { nome: "Corpo", exibir: "Slot de Corpo", capacidade: 1 },
    { nome: "Acessórios", exibir: "Slot de Acessórios", capacidade: 4 },
    { nome: "Item de Apoio", exibir: "Itens de Apoio", capacidade: 1 },
    { nome: "Pernas", exibir: "Slot de Pernas", capacidade: 2 },
    { nome: "Pés", exibir: "Slot de Pés", capacidade: 1 },
    { nome: "Arma 1", exibir: "Arma 1 (1FP)", capacidade: 2, bloqueadoPor: "Arma 2" },
    { nome: "Arma 2", exibir: "Arma 2 (2FP)", capacidade: 1, bloqueia: "Arma 1" }
];

module.exports = async (msg) => {
    const numero = msg.author || msg.from;

    // Buscar jogador
    const jogador = await new Promise((resolve) => {
        db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], (err, row) => {
            resolve(row);
        });
    });

    if (!jogador) {
        return MessageService.send({ message: msg, text: "*✖ Você precisa ter uma ficha aprovada primeiro.*" });
    }

    // Buscar itens equipados
    const equipados = await InventorySystem.getSlotsEquipados(jogador.id);

    // Organizar itens por slot
    const slotsPreenchidos = {};
    equipados.forEach(item => {
        const slot = InventorySystem.getSlotDoItem(item);
        if (!slotsPreenchidos[slot]) slotsPreenchidos[slot] = [];
        slotsPreenchidos[slot].push(item);
    });

    // Verificar se Arma 2 está equipada (bloqueia Arma 1)
    const arma2Equipada = (slotsPreenchidos["Arma 2"] || []).length > 0;

    // Montar mensagem
    let mensagem = `*═══ SLOTS DE EQUIPAMENTO ═══*\n`;
    mensagem += `──────────────────────────\n\n`;
    mensagem += `> *Jogador:* ${jogador.nome}\n\n`;

    SLOTS.forEach(slotInfo => {
        const itensSlot = slotsPreenchidos[slotInfo.nome] || [];
        const ocupados = itensSlot.length;
        const capacidade = slotInfo.capacidade;

        // Verificar se o slot está bloqueado
        let bloqueado = false;
        if (slotInfo.nome === "Arma 1" && arma2Equipada) {
            bloqueado = true;
        }

        mensagem += `*${slotInfo.exibir}* (${ocupados}/${capacidade})\n`;

        if (bloqueado) {
            mensagem += `> 🔒 BLOQUEADO (Arma 2FP equipada)\n\n`;
        } else if (itensSlot.length > 0) {
            itensSlot.forEach((item, idx) => {
                const bonus = InventorySystem.parseBonus(item);
                let bonusTexto = [];
                if (bonus.forca > 0) bonusTexto.push(`Força: +${bonus.forca}`);
                if (bonus.resistencia > 0) bonusTexto.push(`Resistência: +${bonus.resistencia}`);
                if (bonus.velocidade > 0) bonusTexto.push(`Velocidade: +${bonus.velocidade}`);
                if (bonus.sentidos > 0) bonusTexto.push(`Sentidos: +${bonus.sentidos}`);
                if (bonus.inteligencia > 0) bonusTexto.push(`Inteligência: +${bonus.inteligencia}`);
                if (bonus.poderMagico > 0) bonusTexto.push(`Poder Mágico: +${bonus.poderMagico}`);
                
                mensagem += `> ${idx + 1}. *${item.nome}*\n`;
                mensagem += `   Bônus: ${bonusTexto.length > 0 ? bonusTexto.join(", ") : "Nenhum"}\n`;
            });
            // Mostrar slots vazios restantes
            const vazios = capacidade - ocupados;
            if (vazios > 0) {
                mensagem += `> ⬜ ${vazios} slot(s) vazio(s)\n`;
            }
            mensagem += `\n`;
        } else {
            mensagem += `> ⬜ Vazio (${capacidade} slot(s))\n\n`;
        }
    });

    // Bônus total de equipamentos
    const bonusEquip = await InventorySystem.calcularBonusEquipados(jogador.id);

    mensagem += `*─── Bônus Total de Equipamentos ───*\n`;
    mensagem += `> *Força:* +${bonusEquip.forca || 0}\n`;
    mensagem += `> *Resistência:* +${bonusEquip.resistencia || 0}\n`;
    mensagem += `> *Velocidade:* +${bonusEquip.velocidade || 0}\n`;
    mensagem += `> *Sentidos:* +${bonusEquip.sentidos || 0}\n`;
    mensagem += `> *Inteligência:* +${bonusEquip.inteligencia || 0}\n`;
    mensagem += `> *Poder Mágico:* +${bonusEquip.poderMagico || 0}\n\n`;
    mensagem += `──────────────────────────\n`;
    mensagem += `_Use !equipar <nome do item> para equipar._\n`;
    mensagem += `_Use !equipar <nome do item> novamente para desequipar._`;

    await MessageService.send({ message: msg, text: mensagem });
};
