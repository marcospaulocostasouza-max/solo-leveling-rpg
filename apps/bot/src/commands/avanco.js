const MessageService = require("../core/messageService");
const db = require("../core/database");
const AdvancedClassSystem = require("../systems/advancedClassSystem");

/**
 * Mostra as evolucoes realmente disponiveis no sistema central de classes.
 * A escolha continua sendo feita pelo fluxo da quest de classe avancada.
 */
module.exports = async (msg) => {
    const numero = msg.author || msg.from;
    const jogador = await new Promise(resolve => {
        db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], (erro, linha) => {
            resolve(erro ? null : linha);
        });
    });

    if (!jogador) {
        return MessageService.send({ message: msg, text: "*✖ Voce precisa ter uma ficha aprovada para usar este comando.*\n> Use !ficha para criar sua ficha." });
    }

    const nivel = Number(jogador.nivel || 1);
    const classeAvancada = String(jogador.classe_avancada || "Nenhuma");
    if (classeAvancada !== "Nenhuma" && classeAvancada !== "BLOQUEADO") {
        return MessageService.send({ message: msg, text: `*═══ CLASSE AVANCADA ═══*\n\n> Classe atual: *${classeAvancada}*\n> Nivel da classe: ${jogador.classe_avancada_nivel || 1}\n\n_Voce ja concluiu sua evolucao de classe._` });
    }

    const classes = AdvancedClassSystem.getClassesDisponiveis(jogador);
    let texto = `*════════════════════════════════════*\n*EVOLUCAO DE CLASSE*\n*════════════════════════════════════*\n\n`;
    texto += `> Classe inicial: *${jogador.classe || "Nao definida"}*\n`;
    texto += `> Nivel: *${nivel}*\n`;

    if (nivel < 40) {
        texto += `\n> A quest e liberada no nivel 40. Faltam ${40 - nivel} niveis.\n`;
    }

    if (!classes.length) {
        texto += `\n*Nenhuma classe avancada esta disponivel com seus atributos atuais.*\n`;
    } else {
        texto += `\n*OPCOES COMPATIVEIS COM SEUS ATRIBUTOS*\n`;
        classes.forEach((classe, indice) => {
            texto += `\n${indice + 1}. *${classe.nome}*`;
            texto += `\n> ${classe.descricao || "Classe avancada"}`;
            const requisitos = Object.entries(classe.requisitos || {}).map(([nome, valor]) => `${nome}: ${valor}`).join(" | ");
            if (requisitos) texto += `\n> Requisitos: ${requisitos}`;
            texto += `\n`;
        });
    }

    texto += `\n*FLUXO DE EVOLUCAO*`;
    texto += `\n1. *!iniciar quest classe avancada*`;
    texto += `\n2. *!escolher classe avancada*`;
    texto += `\n3. *!quero <nome da classe>*`;
    texto += `\n\n_Classes narrativas bloqueadas precisam de aprovacao de um ADM._`;
    return MessageService.send({ message: msg, text: texto });
};
