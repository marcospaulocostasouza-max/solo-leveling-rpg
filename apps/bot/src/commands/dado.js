const MessageService = require("../core/messageService");

/**
 * COMANDO: !dado
 * Sistema de dados D6 universal.
 */
const DiceSystem = require("../systems/diceSystem");

module.exports = async (msg) => {
    const args = msg.body.split(" ");
    const subcmd = args[1] ? args[1].toLowerCase() : "rolar";

    if (subcmd === "rolar") {
        const resultado = DiceSystem.rolarD6();
        const interpretacao = DiceSystem.interpretarResultado(resultado);
        await MessageService.send({ message: msg, text: `*DADO D6*\nResultado: ${resultado}\nInterpretacao: ${interpretacao}` });
    } else if (subcmd === "teste" && args[2]) {
        const dificuldade = parseInt(args[2]) || 3;
        const teste = DiceSystem.testeDeHabilidade(dificuldade);
        await MessageService.send({ message: msg, text: `*TESTE DE HABILIDADE*\nDificuldade: ${dificuldade}\nResultado: ${teste.resultado}\n${teste.interpretacao}\nResultado: ${teste.sucesso ? "SUCESSO" : "FALHA"}` });
    } else {
        await MessageService.send({ message: msg, text: "*COMANDOS DE DADO*\n!dado rolar - Rola 1 D6\n!dado teste [dificuldade] - Teste de habilidade" });
    }
};