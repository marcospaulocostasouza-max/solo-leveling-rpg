const MessageService = require("../core/messageService");
const db = require("../core/database");
const adminCore = require("../core/adminCore");
const AtributoSystem = require("../systems/atributoSystem");
const playerDatabase = require("../../../../packages/database");
const { obterClasseCanonica } = require("../utils/normalizarClasse");
const { obterEstiloCanonico } = require("../utils/normalizarEstiloLuta");
const { normalizarNomeJogador } = require("../utils/normalizarDadosFicha");

const executar = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, erro => erro ? reject(erro) : resolve()));
const listarJogadores = () => new Promise((resolve, reject) => db.all("SELECT id, nome, classe, estilo_luta, habilidade_unica FROM jogadores", [], (erro, linhas) => erro ? reject(erro) : resolve(linhas || [])));

function lerPedido(texto) {
    const match = String(texto || "").trim().match(/^!atualizar\s+(habilidade\s+u(?:n|n)ica|habilidade\s+única|estilo(?:\s+de)?\s+luta|classe)\s+(.+)\s+para\s+(.+)$/i);
    if (!match) return null;
    const tipo = match[1].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ");
    return {
        tipo: tipo.startsWith("habilidade") ? "habilidade_unica" : tipo.startsWith("estilo") ? "estilo_luta" : "classe",
        valor: match[2].replace(/\s+/g, " ").trim(),
        nome: match[3].replace(/^(?:o\s+)?(?:jogador\s+|player\s+)/i, "").replace(/\s+/g, " ").trim()
    };
}

function uso() {
    return [
        "*═══ ATUALIZAR FICHA ═══*",
        "Use um destes formatos:",
        "*!atualizar habilidade única <nova habilidade> para <personagem>*",
        "*!atualizar estilo de luta <estilo> para <personagem>*",
        "*!atualizar classe <classe> para <personagem>*"
    ].join("\n");
}

module.exports = async msg => {
    const adminNumero = msg.author || msg.from;
    if (!await adminCore.isAdmin(adminNumero)) return MessageService.send({ message: msg, text: "*ACESSO NEGADO*\nSomente a ADM pode atualizar fichas." });

    const pedido = lerPedido(msg.body);
    if (!pedido) return MessageService.send({ message: msg, text: uso() });

    const jogadores = await listarJogadores();
    const jogador = jogadores.find(item => normalizarNomeJogador(item.nome).toLowerCase() === normalizarNomeJogador(pedido.nome).toLowerCase());
    if (!jogador) return MessageService.send({ message: msg, text: `*JOGADOR NÃO ENCONTRADO*\nNão encontrei uma ficha para *${pedido.nome}*.` });

    let campo;
    let novoValor;
    let titulo;
    if (pedido.tipo === "habilidade_unica") {
        novoValor = pedido.valor;
        if (novoValor.length < 3 || novoValor.length > 250) return MessageService.send({ message: msg, text: "*HABILIDADE INVÁLIDA*\nInforme uma habilidade entre 3 e 250 caracteres." });
        campo = "habilidade_unica";
        titulo = "Habilidade Única";
    } else if (pedido.tipo === "estilo_luta") {
        novoValor = obterEstiloCanonico(pedido.valor);
        if (!novoValor) return MessageService.send({ message: msg, text: `*ESTILO INVÁLIDO*\n*${pedido.valor}* não é um Estilo de Luta reconhecido. Consulte *!estilos de luta*.` });
        campo = "estilo_luta";
        titulo = "Estilo de Luta";
    } else {
        novoValor = obterClasseCanonica(pedido.valor);
        if (!novoValor) return MessageService.send({ message: msg, text: `*CLASSE INVÁLIDA*\n*${pedido.valor}* não é uma classe reconhecida. Consulte *!classes*.` });
        campo = "classe";
        titulo = "Classe";
    }

    const antigo = jogador[campo] || "Nenhuma";
    await executar(`UPDATE jogadores SET ${campo} = ? WHERE id = ?`, [novoValor, jogador.id]);
    if (campo === "classe") await AtributoSystem.recalcularAtributos(jogador.id);

    const admin = await adminCore.getAdminLevel(adminNumero);
    adminCore.registrarLog(adminNumero, admin.nome, `atualizar_${campo}`, jogador.nome, titulo, antigo, novoValor);
    await playerDatabase.registrarHistoricoFicha({
        jogadorId: jogador.id, tipo: "Atualização de ficha", direcao: "informativo", recurso: titulo,
        descricao: `${titulo} atualizado pela ADM: ${antigo} → ${novoValor}.`, origem: `ADM: ${admin.nome}`,
        referencia: `atualizar_${campo}`
    });
    return MessageService.send({ message: msg, text: `*═══ FICHA ATUALIZADA ═══*\n\n*Jogador:* ${jogador.nome}\n*${titulo}:* ${antigo} → *${novoValor}*\n\n_A alteração foi registrada no histórico da ficha._` });
};

module.exports.lerPedido = lerPedido;
