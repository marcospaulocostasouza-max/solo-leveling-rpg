const MessageService = require("../core/messageService");
const db = require("../core/database");
const AtributoSystem = require("../systems/atributoSystem");

const ATRIBUTOS_MAP = {
    forca: "forca_base",
    for: "forca_base",
    resistencia: "resistencia_base",
    res: "resistencia_base",
    velocidade: "velocidade_base",
    vel: "velocidade_base",
    agilidade: "velocidade_base",
    agi: "velocidade_base",
    sentidos: "sentidos_base",
    sen: "sentidos_base",
    inteligencia: "inteligencia_base",
    int: "inteligencia_base",
    "poder magico": "poder_magico_base",
    poder: "poder_magico_base",
    pm: "poder_magico_base"
};

const NOMES = {
    forca_base: "Forca",
    resistencia_base: "Resistencia",
    velocidade_base: "Velocidade",
    sentidos_base: "Sentidos",
    inteligencia_base: "Inteligencia",
    poder_magico_base: "Poder Magico"
};

function normalizarTexto(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .trim()
        .replace(/\s+/g, " ");
}

function obterColunaAtributo(partes, indice) {
    for (let tamanho = Math.min(2, partes.length - indice); tamanho >= 1; tamanho--) {
        const nome = normalizarTexto(partes.slice(indice, indice + tamanho).join(" "));
        if (ATRIBUTOS_MAP[nome]) return { coluna: ATRIBUTOS_MAP[nome], nome, proximoIndice: indice + tamanho };
    }
    return null;
}

function parseDistribuicao(argumentos) {
    const partes = normalizarTexto(argumentos).split(/\s+/).filter(Boolean);
    const alteracoes = {};
    const erros = [];
    let pontosRequisitados = 0;
    let i = 0;

    while (i < partes.length) {
        let quantidade;
        let atributo;

        if (/^\d+$/.test(partes[i])) {
            quantidade = Number(partes[i]);
            atributo = obterColunaAtributo(partes, i + 1);
            if (!atributo) {
                erros.push(`Atributo nao reconhecido apos ${quantidade}.`);
                break;
            }
        } else {
            atributo = obterColunaAtributo(partes, i);
            if (!atributo) {
                erros.push(`Atributo nao reconhecido: ${partes[i]}.`);
                break;
            }
            const proximaParte = partes[atributo.proximoIndice];
            if (!/^\d+$/.test(proximaParte || "")) {
                erros.push(`Quantidade ausente para ${atributo.nome}.`);
                break;
            }
            quantidade = Number(proximaParte);
            atributo.proximoIndice += 1;
        }

        if (!Number.isInteger(quantidade) || quantidade <= 0) {
            erros.push(`Quantidade invalida para ${atributo.nome}: ${quantidade}`);
        } else {
            alteracoes[atributo.coluna] = (alteracoes[atributo.coluna] || 0) + quantidade;
            pontosRequisitados += quantidade;
        }
        i = atributo.proximoIndice;
    }

    return { alteracoes, pontosRequisitados, erros };
}

const get = (sql, params = []) => new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row))
);
const run = (sql, params = []) => new Promise((resolve, reject) =>
    db.run(sql, params, function (err) { err ? reject(err) : resolve(this); })
);

module.exports = async msg => {
    const numeroJogador = msg.author || msg.from;
    const argumentos = String(msg.body || "").replace(/^!distribuir/i, "").trim();

    if (!argumentos) return exibirStatusDistribuicao(msg, numeroJogador);

    const jogador = await get("SELECT * FROM jogadores WHERE numero = ?", [numeroJogador]);
    if (!jogador) return MessageService.send({ message: msg, text: "*Voce precisa criar uma ficha primeiro.*\n_Use !ficha_" });
    if (!jogador.ficha_aprovada) return MessageService.send({ message: msg, text: "*Ficha ainda nao aprovada.*" });

    const pontosDisponiveis = Number(jogador.pontos_atributo || 0);
    if (pontosDisponiveis <= 0) {
        return MessageService.send({ message: msg, text: "*Voce nao tem pontos de atributo disponiveis para distribuir.*" });
    }

    const { alteracoes, pontosRequisitados, erros } = parseDistribuicao(argumentos);
    if (erros.length) return MessageService.send({ message: msg, text: `*Erros encontrados:*\n${erros.map(e => `> ${e}`).join("\n")}` });
    if (pontosRequisitados <= 0) return exibirStatusDistribuicao(msg, numeroJogador);
    if (pontosRequisitados > pontosDisponiveis) {
        return MessageService.send({ message: msg, text: `*Pontos insuficientes.*\n> Pedido: ${pontosRequisitados}\n> Disponivel: ${pontosDisponiveis}` });
    }

    let sql = "UPDATE jogadores SET pontos_atributo = ?";
    const params = [pontosDisponiveis - pontosRequisitados];
    for (const [coluna, valor] of Object.entries(alteracoes)) {
        sql += `, ${coluna} = ${coluna} + ?`;
        params.push(valor);
    }
    sql += " WHERE numero = ?";
    params.push(numeroJogador);
    await run(sql, params);
    await AtributoSystem.recalcularAtributos(jogador.id);

    const atualizado = await get("SELECT * FROM jogadores WHERE id = ?", [jogador.id]);
    const resumo = Object.entries(alteracoes)
        .map(([coluna, qtd]) => `> ${NOMES[coluna]}: +${qtd}`)
        .join("\n");

    await MessageService.send({ message: msg, text: `*ATRIBUTOS DISTRIBUIDOS COM SUCESSO!*\n\nPontos usados: ${pontosRequisitados}\nPontos restantes: ${pontosDisponiveis - pontosRequisitados}\n\n*Alteracoes:*\n${resumo}\n\n*Base atual:*\n> Forca: ${atualizado.forca_base || 0}\n> Resistencia: ${atualizado.resistencia_base || 0}\n> Velocidade: ${atualizado.velocidade_base || 0}\n> Sentidos: ${atualizado.sentidos_base || 0}\n> Inteligencia: ${atualizado.inteligencia_base || 0}\n> Poder Magico: ${atualizado.poder_magico_base || 0}` });
};

function exibirStatusDistribuicao(msg, numeroJogador) {
    get("SELECT * FROM jogadores WHERE numero = ?", [numeroJogador]).then(jogador => {
        if (!jogador) return MessageService.send({ message: msg, text: "*Voce precisa criar uma ficha primeiro.*\n_Use !ficha_" });
        return MessageService.send({ message: msg, text: `*DISTRIBUICAO DE ATRIBUTOS*\n\nJogador: ${jogador.nome || "Sem nome"}\nPontos disponiveis: ${jogador.pontos_atributo || 0}\n\n*Como usar:*\n> !distribuir 3 forca 2 resistencia 1 inteligencia\n> !distribuir 5 poder magico 2 velocidade\n> !distribuir pm 5 agi 2\n\n*Atributos validos:*\nForca, Resistencia, Velocidade/Agilidade, Sentidos, Inteligencia, Poder Magico/PM` });
    }).catch(err => {
        console.error("[DISTRIBUIR]", err.message);
        MessageService.send({ message: msg, text: "*Erro ao buscar dados do jogador.*" });
    });
}

module.exports.parseDistribuicao = parseDistribuicao;
