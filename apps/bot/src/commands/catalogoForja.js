const MessageService = require("../core/messageService");

/**
 * COMANDO: !catalogo forja
 *
 * Exibe o catálogo de itens forjados (Ligas + Materiais x Nucleos).
 * 
 * Uso:
 * !catalogo forja - Lista os slots disponíveis
 * !catalogo forja <slot> - Lista itens do slot (pagina 1)
 * !catalogo forja <slot> <rank> - Lista itens do slot filtrados por rank
 * !catalogo forja <slot> <rank> <pagina> - Página específica
 * !catalogo forja buscar <nome> - Busca item por nome
 */

const ForjaSystem = require("../systems/forjaSystem");

const SLOTS_VALIDOS = ["Cabeça", "Corpo", "Pernas", "Pés", "Braços", "Acessório", "Arma 1", "Arma 2"];

// Mapeamento de nomes alternativos de slots
const MAPA_SLOTS = {
    "cabeca": "Cabeça",
    "cabeça": "Cabeça",
    "corpo": "Corpo",
    "pernas": "Pernas",
    "pes": "Pés",
    "pés": "Pés",
    "bracos": "Braços",
    "braços": "Braços",
    "acessorio": "Acessório",
    "acessório": "Acessório",
    "arma 1": "Arma 1",
    "arma1": "Arma 1",
    "arma 2": "Arma 2",
    "arma2": "Arma 2"
};

const RANKS_VALIDOS = ["E", "D", "C", "B", "A", "S"];

module.exports = async (msg) => {
    const texto = msg.body.trim();
    const args = texto.replace(/!catalogo forja/i, "").trim().split(/\s+/);

    // Sem argumentos - listar slots disponíveis
    if (args.length === 0 || (args.length === 1 && args[0] === "")) {
        let mensagem = `*═══ CATÁLOGO DE FORJA ═══*\n`;
        mensagem += `──────────────────────────\n\n`;
        mensagem += `*Slots disponíveis:*\n`;
        SLOTS_VALIDOS.forEach(slot => {
            mensagem += `> !catalogo forja ${slot}\n`;
        });
        mensagem += `\n*Filtros opcionais:*\n`;
        mensagem += `> !catalogo forja <slot> <rank> - Filtrar por rank (E, D, C, B, A, S)\n`;
        mensagem += `> !catalogo forja <slot> <rank> <página> - Página específica\n`;
        mensagem += `> !catalogo forja buscar <nome> - Buscar item por nome\n\n`;
        mensagem += `*Total de itens no catálogo:* 5.504\n`;
        mensagem += `*Ligas:* 3.968 | *Forjados com Núcleos:* 1.536\n`;
        mensagem += `──────────────────────────\n`;
        mensagem += `_Preço = (custo dos materiais) + 60% de taxa do ferreiro_\n`;
        mensagem += `_Rank do item = maior rank entre os materiais_`;
        return MessageService.send({ message: msg, text: mensagem });
    }

    // Comando de busca
    if (args[0].toLowerCase() === "buscar") {
        const nomeBusca = args.slice(1).join(" ").trim();
        if (!nomeBusca) {
            return MessageService.send({ message: msg, text: "*✖ Informe o nome do item para buscar.*\n_Exemplo: !catalogo forja buscar Elmo de Couro_" });
        }

        const item = ForjaSystem.buscarItemCatalogo(nomeBusca);
        if (!item) {
            return MessageService.send({ message: msg, text: `*✖ Item não encontrado:* "${nomeBusca}"\n_Verifique o nome ou use !catalogo forja para ver os slots disponíveis._` });
        }

        let mensagem = `*═══ ITEM ENCONTRADO ═══*\n`;
        mensagem += `──────────────────────────\n\n`;
        mensagem += ForjaSystem.formatarItemCatalogo(item);
        mensagem += `\n\n──────────────────────────\n`;
        mensagem += `> Slot: ${item.slot}\n`;
        mensagem += `> Tipo: ${item.tipo === "liga" ? "Liga (Material × Material)" : "Forjado (Material × Núcleo)"}`;
        if (item.tipo === "liga") {
            mensagem += `\n> Materiais: ${item.material1} + ${item.material2}`;
        } else {
            mensagem += `\n> Material: ${item.material}\n> Núcleo: ${item.nucleoCor} (Rank ${item.nucleoRank})`;
        }

        return MessageService.send({ message: msg, text: mensagem });
    }

    // Determinar slot
    const slotInput = args[0].toLowerCase();
    const slot = MAPA_SLOTS[slotInput] || SLOTS_VALIDOS.find(s => s.toLowerCase() === slotInput);

    if (!slot) {
        return MessageService.send({ message: msg, text: `*✖ Slot inválido:* "${args[0]}"\n\n*Slots disponíveis:*\n${SLOTS_VALIDOS.map(s => `> ${s}`).join("\n")}` });
    }

    // Determinar rank (segundo argumento)
    let rank = null;
    let pagina = 0;

    if (args.length >= 2) {
        const arg2 = args[1].toUpperCase();
        if (RANKS_VALIDOS.includes(arg2)) {
            rank = arg2;
            // Terceiro argumento = página
            if (args.length >= 3) {
                pagina = Math.max(0, parseInt(args[2]) - 1);
            }
        } else {
            // Se não é rank, pode ser página
            const num = parseInt(args[1]);
            if (!isNaN(num)) {
                pagina = Math.max(0, num - 1);
            }
        }
    }

    // Gerar mensagem do catálogo
    const mensagem = ForjaSystem.gerarMensagemCatalogo(slot, rank, pagina);
    await MessageService.send({ message: msg, text: mensagem });
};