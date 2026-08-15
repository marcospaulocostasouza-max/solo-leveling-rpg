const MessageService = require("../core/messageService");
const fs = require("fs");
const path = require("path");

const ARQUIVOS_DE_MENU = ["arquiteto.js", "cacador.js", "ascensao.js", "associacoes.js", "biblioteca.js", "historia.js", "acervo.js", "npc.js", "skills.js", "lojaVirtual.js", "drops.js", "portais.js", "peatz.js", "admin.js"];
const normalizar = texto => String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function textoDosMenus() {
    return normalizar(ARQUIVOS_DE_MENU.map(nome => {
        const arquivo = path.join(__dirname, nome);
        return fs.existsSync(arquivo) ? fs.readFileSync(arquivo, "utf8") : "";
    }).join("\n"));
}

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
    1: [
        { nome: "!biblioteca", descricao: "Abre o menu de regras, atributos, poderes, estilos e Portais." }
    ],
    2: [
        { nome: "!ascensão", descricao: "Abre o menu de crescimento, progressão, rank e Classe Avançada." },
        { nome: "!amizade", descricao: "Mostra vínculo e hostilidade com NPCs que já tiveram cena com você." },
        { nome: "!classe especial", descricao: "Consulta recursos narrativos de classes avançadas especiais." }
    ],
    3: [
        { nome: "!peatz", descricao: "Abre o menu comercial de técnicas, loja virtual e drops." },
        { nome: "!loja virtual", descricao: "Abre o menu de compras, itens, saldo e histórico comercial." },
        { nome: "!drops", descricao: "Abre o menu de Núcleos, Materiais, lojas de recursos e Caixas." },
        { nome: "!skills", descricao: "Abre o menu de Maestria e Técnicas de combate." },
        { nome: "!história", descricao: "Abre o menu de missões, acontecimentos, Monarcas, Governantes e Sucessores." },
        { nome: "!portais", descricao: "Abre o menu de Dungeons, incursões, escolhas e mineração." },
        { nome: "!missao / !consultar missoes", descricao: "Consulta missões disponíveis, ativas e concluídas." }
    ],
    4: [
        { nome: "!acervo", descricao: "Abre o menu de NPCs, relações, missões e sistemas narrativos relacionados." },
        { nome: "!associações", descricao: "Abre o menu de guildas, organizações, conflitos e Submundo." },
        { nome: "!npc", descricao: "Explica o sistema de NPCs, memória, relacionamento e como iniciar ou encerrar uma cena." },
        { nome: "!olá bilac", descricao: "Abre a oficina de Bilac para forjas Rank E a B." },
        { nome: "!olá vysache", descricao: "Abre a forja superior de Vysache para itens Rank A, S e Nacional." },
        { nome: "!<npc_id> + mensagem", descricao: "Inicia ou continua uma cena exclusiva com um NPC. Exemplo: !ophilia_clement seguido da sua fala." },
        { nome: "!fim de interação [NPC]", descricao: "Fecha sua cena ativa (o nome é opcional), avalia vínculo/hostilidade e libera o NPC após 5 horas." },
        { nome: "!presentear <NPC> <item>", descricao: "Oferece um item do inventário a um NPC." },
        { nome: "!listar npcs", descricao: "Lista os 75 NPCs, separados por categoria, com o comando de cada um." },
        { nome: "!missoes npc <id>", descricao: "Lista as missões já disponíveis de um NPC específico." },
        { nome: "!admin encerrar cenas npc", descricao: "ADM: encerra todas as cenas e libera NPCs e jogadores sem cooldown." }
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
    const menus = textoDosMenus();
    const comandos = todos.filter(comando => {
        if (!comando.ativo || COMANDOS_OCULTOS.has(comando.nome)) return false;
        if (!categorias.includes(comando.categoria)) return false;
        const jaListado = String(comando.nome).split("/").some(variante => {
            const base = normalizar(variante).split(/[\[<(]/)[0].trim();
            return base.length > 1 && menus.includes(base);
        });
        if (jaListado) return false;
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
    mensagem += "\n_Esta página mostra somente comandos que ainda não aparecem nos menus temáticos ou no painel ADM._\n";
    mensagem += "\n*────────────────────────────────────*\n";
    mensagem += "› Navegação: *!ver comandos 1*, *2*, *3*, *4* ou *5*.";
    return MessageService.send({ message: msg, text: mensagem });
};
