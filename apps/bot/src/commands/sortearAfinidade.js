const MessageService = require("../core/messageService");
const db = require("../core/database");
const templates = require("../utils/templatesMensagens");
const elementos = require("../elementos/listaElementos");
const AfinidadesAdicionais = require("../systems/afinidadesAdicionaisSystem");

const LIMITE_VARIANTE_ACIMA_DE_RARA = 1;
const get = (sql, params = []) => new Promise((resolve, reject) =>
    db.get(sql, params, (erro, row) => erro ? reject(erro) : resolve(row))
);
const all = (sql, params = []) => new Promise((resolve, reject) =>
    db.all(sql, params, (erro, rows) => erro ? reject(erro) : resolve(rows || []))
);
const run = (sql, params = []) => new Promise((resolve, reject) =>
    db.run(sql, params, erro => erro ? reject(erro) : resolve())
);
const normalizar = valor => String(valor || "").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function sortear(pool) {
    const ponderado = [];
    const pesos = { Comum: 70, Incomum: 20, Raro: 8, "Muito Raro": 2, "Lendário": 1 };
    for (const elemento of pool) {
        for (let i = 0; i < (pesos[elemento.raridade] || 0); i++) ponderado.push(elemento);
    }
    return ponderado[Math.floor(Math.random() * ponderado.length)];
}

function determinarSorteio(jogador, quantidadeAdicionais) {
    const possuiPrimaria = jogador.afinidade_elemental && jogador.afinidade_elemental !== "Nenhuma";
    if (!possuiPrimaria) return { permitido: true, slot: 1, nivelNecessario: 1 };
    if (normalizar(jogador.classe) !== "mago elemental") return { permitido: false, motivo: "classe" };
    const slot = Number(quantidadeAdicionais || 0) + 2;
    const nivelNecessario = slot === 2 ? 35 : slot === 3 ? 70 : null;
    if (!nivelNecessario) return { permitido: false, motivo: "limite" };
    if (Number(jogador.nivel || 1) < nivelNecessario) return { permitido: false, motivo: "nivel", slot, nivelNecessario };
    return { permitido: true, slot, nivelNecessario };
}

module.exports = async msg => {
    try {
        const numero = msg.author || msg.from;
        let jogador = await get(
            "SELECT id, classe, nivel, afinidade_elemental, afinidade_sorteada FROM jogadores WHERE numero = ?",
            [numero]
        );

        if (!jogador) {
            await run("INSERT OR IGNORE INTO jogadores (numero, afinidade_elemental, afinidade_sorteada) VALUES (?, 'Nenhuma', 0)", [numero]);
            jogador = await get(
                "SELECT id, classe, nivel, afinidade_elemental, afinidade_sorteada FROM jogadores WHERE numero = ?",
                [numero]
            );
        }

        const adicionais = await AfinidadesAdicionais.listar(jogador.id);
        const permissao = determinarSorteio(jogador, adicionais.length);
        let slot = permissao.slot || 1;

        if (!permissao.permitido) {
            if (permissao.motivo === "classe") {
                return MessageService.send({ message: msg, text: `*═══ AFINIDADE JÁ DESPERTADA ═══*\n${templates.divisor()}\n> *Elemento:* ${jogador.afinidade_elemental}\n\n_Somente Magos Elementais podem despertar afinidades adicionais._` });
            }
            if (permissao.motivo === "limite") {
                return MessageService.send({ message: msg, text: templates.aviso("Você já despertou as três afinidades permitidas para Mago Elemental.") });
            }
            if (permissao.motivo === "nivel") {
                return MessageService.send({ message: msg, text: templates.aviso(
                    `A ${slot === 2 ? "segunda" : "terceira"} afinidade é liberada no nível ${permissao.nivelNecessario}. Seu nível atual é ${jogador.nivel || 1}.`
                ) });
            }
        }

        const ocupacaoPrimaria = await all(
            `SELECT LOWER(afinidade_elemental) AS elemento, COUNT(*) AS total
             FROM jogadores
             WHERE afinidade_elemental IS NOT NULL AND afinidade_elemental <> 'Nenhuma' AND numero <> ?
             GROUP BY LOWER(afinidade_elemental)`,
            [numero]
        );
        const ocupacaoAdicional = await AfinidadesAdicionais.ocupacaoExceto(jogador.id);
        const ocupacao = new Map();
        for (const row of [...ocupacaoPrimaria, ...ocupacaoAdicional]) {
            ocupacao.set(row.elemento, (ocupacao.get(row.elemento) || 0) + Number(row.total));
        }

        const jaPossui = new Set([
            jogador.afinidade_elemental,
            ...adicionais.map(item => item.elemento)
        ].filter(Boolean).map(normalizar));
        const raridadesLimitadas = new Set(["Muito Raro", "Lendário"]);
        const disponiveis = elementos.filter(elemento =>
            elemento.sorteavel === true &&
            !jaPossui.has(normalizar(elemento.nome)) &&
            (!raridadesLimitadas.has(elemento.raridade) || (ocupacao.get(normalizar(elemento.nome)) || 0) < LIMITE_VARIANTE_ACIMA_DE_RARA)
        );
        const resultado = sortear(disponiveis);
        if (!resultado) return MessageService.send({ message: msg, text: templates.erro("Nenhum elemento disponível para sorteio.") });

        if (slot === 1) {
            await run("UPDATE jogadores SET afinidade_elemental = ?, afinidade_sorteada = 1 WHERE numero = ?", [resultado.nome, numero]);
        } else {
            const salvo = await AfinidadesAdicionais.adicionar(jogador.id, slot, resultado.nome);
            if (!salvo) throw new Error(`Falha ao salvar afinidade no slot ${slot}`);
        }

        const posicao = slot === 1 ? "Elemento Primário" : slot === 2 ? "Segundo Elemento" : "Terceiro Elemento";
        await MessageService.send({ message: msg, text: `*═══ DESPERTAR ELEMENTAL ═══*\n${templates.divisor()}\n_A energia mágica começou a reagir..._\n\n> *${resultado.nome}*\n> *Posição:* ${posicao}\n> *Categoria:* ${resultado.categoria}\n> *Raridade:* ${resultado.raridade}\n> *Bônus de Afinidade:* +${resultado.bonusAfinidade}% Poder Mágico\n${templates.divisor()}\n_Sua afinidade foi salva permanentemente!_\n_Use !consultar afinidade para ver detalhes._` });
        return resultado;
    } catch (erro) {
        console.error("[AFINIDADE] Erro no sorteio elemental:", erro.message);
        return MessageService.send({ message: msg, text: templates.erro("Erro ao realizar sorteio elemental.") });
    }
};

module.exports.determinarSorteio = determinarSorteio;
