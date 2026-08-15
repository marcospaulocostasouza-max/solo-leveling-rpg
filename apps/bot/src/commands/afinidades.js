const MessageService = require("../core/messageService");
const templates = require("../utils/templatesMensagens");
const elementos = require("../elementos/listaElementos");

module.exports = async (msg) => {
    const grupos = elementos.reduce((resultado, elemento) => {
        const categoria = elemento.categoria || "Outras";
        if (!resultado[categoria]) resultado[categoria] = [];
        resultado[categoria].push(elemento);
        return resultado;
    }, {});

    let texto = `${templates.titulo("TODAS AS AFINIDADES ELEMENTAIS")}`;
    texto += `\n${templates.divisor()}`;
    texto += `\n\nEstas sao todas as afinidades reconhecidas pelo Sistema.`;

    for (const [categoria, afinidades] of Object.entries(grupos)) {
        texto += `\n\n*${categoria.toUpperCase()}*`;
        for (const afinidade of afinidades) {
            texto += `\n\n*${afinidade.nome}*`;
            texto += `\n> Raridade: ${afinidade.raridade || "Nao informada"}`;
            texto += `\n> Origem: ${afinidade.origem || "Propria"}`;
            texto += `\n> Bonus de Afinidade: +${afinidade.bonusAfinidade || 0}% Poder Magico`;
            texto += `\n> Disponibilidade: ${afinidade.sorteavel ? "Pode ser sorteada" : "Exclusiva; nao aparece no sorteio comum"}`;
            if (Array.isArray(afinidade.vantagens) && afinidade.vantagens.length) {
                texto += `\n> Vantagens contra: ${afinidade.vantagens.join(", ")}`;
                texto += `\n> Bonus de vantagem: +${afinidade.bonusVantagem || 0}%`;
            }
        }
    }

    texto += `\n\n${templates.divisor()}`;
    texto += `\n> *!sortear afinidade* - Descobrir sua afinidade`;
    texto += `\n> *!consultar afinidade* - Consultar a afinidade que voce possui`;
    return MessageService.send({ message: msg, text: texto });
};
