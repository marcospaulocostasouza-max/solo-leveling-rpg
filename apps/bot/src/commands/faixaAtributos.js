const db = require("../core/database");
const MessageService = require("../core/messageService");
const { atributosFinais, FAIXAS } = require("../systems/attributeRangeSystem");

module.exports = async (msg) => {
    const numero = msg.author || msg.from;
    const jogador = await new Promise((resolve, reject) => db.get(
        "SELECT nome, nivel, forca_total, resistencia_total, velocidade_total, sentidos_total, inteligencia_total, poder_magico_total FROM jogadores WHERE numero = ?",
        [numero],
        (erro, linha) => erro ? reject(erro) : resolve(linha)
    ));

    if (!jogador) {
        return MessageService.send({ message: msg, text: "[!] Não foi possível encontrar sua ficha." });
    }

    const linhas = atributosFinais(jogador)
        .map(({ nome, valor, faixa }) => `› ${nome}: *${valor}* — ${faixa.nome}`)
        .join("\n");
    const escala = FAIXAS.map((faixa) => `› ${faixa.minimo}${faixa.maximo === Infinity ? "+" : `–${faixa.maximo}`}: *${faixa.nome}*`).join("\n");

    return MessageService.send({ message: msg, text: `
════════════════════════════════════
*FAIXA DE ATRIBUTOS*
════════════════════════════════════

› Caçador: *${jogador.nome}*
› Nível: *${jogador.nivel || 1}*

${linhas}

*Escala de poder*
${escala}

_A faixa usa os atributos finais: base, equipamentos, rank, buffs e efeitos já calculados. Ela informa o poder atual; não altera dano, mana ou resultado de cenas._

*Diferença entre dois atributos*
› Fórmula: (maior − menor) ÷ maior × 100
› 0–30%: Pequena | 31–50%: Vantagem clara
› 51–70%: Grande | 71–90%: Esmagadora | 91%+: Absurda

_Use !fcombate Nome 1 | Nome 2 para comparar duas fichas._`.trim() });
};
