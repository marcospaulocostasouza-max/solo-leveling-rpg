const db = require("../core/database");
const MessageService = require("../core/messageService");
const { atributosFinais, diferencaPercentual, classificarDiferenca } = require("../systems/attributeRangeSystem");

function buscarJogador(nome) {
    return new Promise((resolve, reject) => db.get(
        `SELECT nome, nivel, classe, classe_avancada, forca_total, resistencia_total, velocidade_total,
                sentidos_total, inteligencia_total, poder_magico_total
         FROM jogadores WHERE lower(nome) = lower(?)`,
        [nome.trim()],
        (erro, linha) => erro ? reject(erro) : resolve(linha)
    ));
}

module.exports = async (msg) => {
    try {
        const entrada = msg.body.replace(/^!fcombate|^!fight/i, "").trim();
        const nomes = entrada.split("|").map((nome) => nome.trim()).filter(Boolean);
        if (nomes.length !== 2) {
            return MessageService.send({ message: msg, text: "[!] Uso: !fcombate Nome do primeiro jogador | Nome do segundo jogador" });
        }

        const [primeiro, segundo] = await Promise.all(nomes.map(buscarJogador));
        if (!primeiro || !segundo) {
            return MessageService.send({ message: msg, text: "[!] Uma das fichas não foi encontrada. Use o nome exato dos dois jogadores." });
        }

        const atributosA = atributosFinais(primeiro);
        const atributosB = atributosFinais(segundo);
        const linhas = atributosA.map((atributo, indice) => {
            const outro = atributosB[indice];
            const diferenca = diferencaPercentual(atributo.valor, outro.valor);
            const maior = atributo.valor === outro.valor ? "Equilíbrio" : atributo.valor > outro.valor ? primeiro.nome : segundo.nome;
            return `› ${atributo.nome}: *${primeiro.nome} ${atributo.valor}* | *${segundo.nome} ${outro.valor}*\n  Diferença: ${diferenca.toFixed(1)}% — ${classificarDiferenca(diferenca)}${maior === "Equilíbrio" ? "" : ` (${maior})`}`;
        }).join("\n\n");

        return MessageService.send({ message: msg, text: `
════════════════════════════════════
*FICHA COMPARATIVA DE COMBATE*
════════════════════════════════════

*${primeiro.nome}* — Nível ${primeiro.nivel || 1}
› Classe: ${primeiro.classe || "Não definida"}${primeiro.classe_avancada && primeiro.classe_avancada !== "Nenhuma" ? ` | ${primeiro.classe_avancada}` : ""}

*${segundo.nome}* — Nível ${segundo.nivel || 1}
› Classe: ${segundo.classe || "Não definida"}${segundo.classe_avancada && segundo.classe_avancada !== "Nenhuma" ? ` | ${segundo.classe_avancada}` : ""}

${linhas}

_Esta ficha apenas apresenta atributos finais e diferenças percentuais. A cena e seu resultado continuam narrativos e sob decisão da mesa._`.trim() });
    } catch (erro) {
        console.error("Erro na ficha comparativa:", erro);
        return MessageService.send({ message: msg, text: "[!] Não foi possível gerar a ficha comparativa agora." });
    }
};
