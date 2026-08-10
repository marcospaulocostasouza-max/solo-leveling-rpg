const MessageService = require("../core/messageService");

const CATEGORIAS_POR_PAGINA = {
    1: ["Sistema Inicial", "Ficha", "Informação"],
    2: ["Jogador", "Atributos", "RPG"],
    3: ["RPG", "Dungeon", "Minigames", "Economia", "Poder"],
    4: ["Mundo", "Guilda"],
    5: ["Administrativo", "IA", "Ferramentas"]
};

const TITULOS = {
    1: "INÍCIO, FICHA E CONSULTAS",
    2: "JOGADOR E PROGRESSÃO",
    3: "RPG, COMBATE E RECURSOS",
    4: "MUNDO, GUILDA E NPCs",
    5: "ADMINISTRAÇÃO E FERRAMENTAS"
};

const EXTRAS = {
    2: [
        { nome: "!amizade", descricao: "Mostra vínculo e hostilidade com NPCs que já tiveram cena com você." },
        { nome: "!classe especial", descricao: "Consulta recursos narrativos de classes avançadas especiais." }
    ],
    3: [
        { nome: "!missao / !consultar missoes", descricao: "Consulta missões disponíveis, ativas e concluídas." }
    ],
    4: [
        { nome: "!<npc_id> + mensagem", descricao: "Inicia ou continua uma cena exclusiva com um NPC. Exemplo: !ophilia_clement seguido da sua fala." },
        { nome: "!fim de interação <NPC>", descricao: "Fecha a cena, avalia vínculo/hostilidade e libera o NPC após 5 horas." },
        { nome: "!presentear <NPC> <item>", descricao: "Oferece um item do inventário a um NPC." },
        { nome: "!npcs / !missoes npc", descricao: "Lista NPCs e informações de missões relacionadas." }
    ],
    5: [
        { nome: "!ver comandos <1-5>", descricao: "Navega entre estas cinco páginas de comandos." }
    ]
};

const COMANDOS_OCULTOS = new Set([
    "!sortear dungeon", "!habilidades", "!loja armas", "!treinar",
    "!maestria", "!regeneracao", "!catalogo forja"
]);

function paginaSolicitada(body) {
    const match = String(body || "").match(/(?:!ver\s*comandos|!vercomandos)\s*(\d+)?/i);
    const pagina = Number(match?.[1] || 1);
    return CATEGORIAS_POR_PAGINA[pagina] ? pagina : 1;
}

module.exports = async (msg) => {
    const { registrarTodosComandos } = require("../core/registroComandos");
    const pagina = paginaSolicitada(msg.body);
    const categorias = CATEGORIAS_POR_PAGINA[pagina];
    const todos = registrarTodosComandos();
    const comandos = todos.filter(comando => {
        if (!comando.ativo || COMANDOS_OCULTOS.has(comando.nome)) return false;
        if (!categorias.includes(comando.categoria)) return false;
        if (comando.categoria !== "RPG") return true;
        const indiceRpg = todos.filter(item => item.categoria === "RPG").indexOf(comando);
        return pagina === 2 ? indiceRpg < 18 : pagina === 3 ? indiceRpg >= 18 : false;
    });
    let mensagem = `*════════════════════════════════════*\n*VER COMANDOS ${pagina}/5 — ${TITULOS[pagina]}*\n*════════════════════════════════════*\n`;

    for (const categoria of categorias) {
        const itens = comandos.filter(comando => comando.categoria === categoria);
        if (!itens.length) continue;
        mensagem += `\n*${categoria.toUpperCase()}*\n`;
        for (const comando of itens) {
            const batalhaNarrativa = String(comando.nome).startsWith("!batalha");
            const nome = batalhaNarrativa ? "!batalha" : comando.nome;
            const descricao = batalhaNarrativa ? "Explica o fluxo narrativo de confronto e aponta para a ficha comparativa." : comando.descricao;
            mensagem += `› *${nome}*\n  _${descricao}_\n`;
        }
    }
    if (EXTRAS[pagina]) {
        mensagem += "\n*COMANDOS RELACIONADOS*\n";
        for (const comando of EXTRAS[pagina]) mensagem += `› *${comando.nome}*\n  _${comando.descricao}_\n`;
    }
    mensagem += "\n*────────────────────────────────────*\n";
    mensagem += "› Navegação: *!ver comandos 1*, *2*, *3*, *4* ou *5*.";
    return MessageService.send({ message: msg, text: mensagem });
};
