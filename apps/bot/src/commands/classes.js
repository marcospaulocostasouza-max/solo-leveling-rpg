const MessageService = require("../core/messageService");
const classes = require("../utils/classes");

const classesIniciais = [
    "Lutador",
    "Assassino",
    "Tanker",
    "Ranger",
    "Curador",
    "Mago Elemental",
    "Mago Invocador",
    "Mago de Barreira",
    "Mago de Maldição"
];

function bonusFormatado(bonus) {
    return Array.isArray(bonus) ? bonus.join(" • ") : bonus;
}

module.exports = async (msg) => {
    let mensagem = `
*═══ SISTEMA // CLASSES ═══*
_O despertar define o caminho de cada Caçador._

*Escolha uma das classes abaixo ao preencher sua ficha.* A classe define seu foco de combate, o bônus inicial de 50% e as técnicas que poderão ser aprendidas. Escolha uma opção coerente com o seu personagem.

*─── Classes de Combate ───*
`;

    classesIniciais.forEach((classe) => {
        const chaveClasse = classe === "Mago de Maldição" ? "Mago de Maldicao" : classe;
        const dados = classes[chaveClasse];
        if (!dados) return;

        mensagem += `
*「 ${classe.toUpperCase()} 」*
_${String(dados.descricao || "Uma classe única.").trim()}_
> *Bônus inicial:* ${bonusFormatado(dados.bonus)}
> *Foco:* ${dados.foco}
`;
    });

    mensagem += `
*─── Registro da Ficha ───*
_Ao criar sua ficha, informe somente uma classe da lista:_
> *Classe:* Nome da classe escolhida

_Exemplo:_
> *Classe:* Assassino

*Sistema RPG • Escolha sua trilha de combate*
`;

    await MessageService.send({ message: msg, text: mensagem });
};
