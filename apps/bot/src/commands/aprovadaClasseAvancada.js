const MessageService = require("../core/messageService");

const db = require("../core/database");
const AdvancedClassSystem = require("../systems/advancedClassSystem");

const grupoADM = "120363426252648069@g.us";

function extrairNomeEClasse(mensagem) {
    const prefixo = "!aprovada para classe avançada";
    const corpo = mensagem.slice(prefixo.length).trim();
    if (!corpo) return null;

    const todasClasses = AdvancedClassSystem.getTodosNomesDeClasses();
    const corpoMinusculo = corpo.toLowerCase();

    const nomeClasseEncontrada = todasClasses.find(classe => corpoMinusculo.endsWith(classe.toLowerCase()));
    if (!nomeClasseEncontrada) return null;

    const nomeJogador = corpo.slice(0, corpo.length - nomeClasseEncontrada.length).trim();
    if (!nomeJogador) return null;

    return { nomeJogador, nomeClasse: nomeClasseEncontrada };
}

function isAdmin(numero) {
    return new Promise((resolve) => {
        db.get("SELECT * FROM administradores WHERE numero = ?", [numero], (err, row) => {
            resolve(!!row);
        });
    });
}

module.exports = async (msg) => {
    const texto = msg.body.trim();
    const numero = msg.author || msg.from;

    const autorizado = await isAdmin(numero) || msg.from === grupoADM;
    if (!autorizado) {
        return MessageService.send({ message: msg, text: "*═══ Você não tem permissão para aprovar classes avançadas. ═══*" });
    }

    const dados = extrairNomeEClasse(texto.toLowerCase());
    if (!dados) {
        return MessageService.send({ message: msg, text: `*═══ Formato inválido. ═══*\nUse: !aprovada para classe avançada <nome do jogador> <nome da classe>` });
    }

    const resultado = await AdvancedClassSystem.registrarClasseAvancada(dados.nomeJogador, dados.nomeClasse, numero);
    if (!resultado.success) {
        return MessageService.send({ message: msg, text: `*═══ Não foi possível aprovar a classe avançada. ═══*\n${resultado.mensagem}` });
    }

    db.get("SELECT numero, nome FROM jogadores WHERE LOWER(nome) = ?", [dados.nomeJogador.toLowerCase()], async (err, jogador) => {
        if (jogador) {
            try {
                await MessageService.send({ chatId: jogador.numero, text: `*═══ CLASSE AVANÇADA APROVADA ═══*
────────────────────────══
Parabéns, ${jogador.nome}!
Sua classe avançada *${dados.nomeClasse}* foi aprovada pelo ADM.
Seus atributos adicionais foram aplicados e sua biblioteca de técnicas avançadas está disponível.
Use !tecnicas para visualizar suas novas técnicas.` });
            } catch (erro) {
                console.log("Erro ao avisar jogador da classe avançada:", erro);
            }
        }
    });

    return MessageService.send({ message: msg, text: `*═══ Classe avançada aprovada com sucesso! ═══*
> Jogador: ${dados.nomeJogador}
> Classe aprovada: ${dados.nomeClasse}` });
};
