const MessageService = require("../core/messageService");

const classes = require("../utils/classes");

module.exports = async (msg) => {
    const db = require("../core/database");
    
    // Verificar se o jogador tem ficha aprovada
    const numeroJogador = msg.author || msg.from;
    
let mensagem = `
*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*
*📚 Sistema de Classes 📚*
*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*

O sistema de Classes define o estilo de combate, habilidades iniciais e crescimento do seu personagem. Cada classe possui características únicas, bônus específicos e um caminho de evolução distinto. Escolha com cuidado, Caçador, pois sua classe determinará suas capacidades em batalha.

══════════════════════════

*COMO FUNCIONA*
1. Escolha uma classe ao criar sua ficha
2. Após aprovação, use *!avanco* para ver evoluções
3. Use *!<nome da classe>* para ver técnicas (ex: !assassino)

`;

    // Listar todas as classes iniciais
    const classesIniciais = [
        "Lutador", "Assassino", "Tanker", "Ranger", "Curador",
        "Mago de Água", "Mago de Fogo", "Mago de Gelo", "Mago de Terra", "Mago de Vento",
        "Mago de Raio", "Mago Invocador", "Mago de Barreira", "Mago de Maldição"
    ];

    mensagem += `*━━━ CLASSES INICIAIS ━━━*\n\n`;
    
    classesIniciais.forEach(classe => {
        const dados = classes[classe];
        if (dados) {
            mensagem += `*◆ ${classe}*\n`;
            mensagem += `${dados.descricao || 'Uma classe única.'}\n`;
            if (dados.bonus) mensagem += `> *Bônus:* ${dados.bonus}\n`;
            if (dados.foco) mensagem += `> *Foco:* ${dados.foco}\n`;
            mensagem += `\n`;
        }
    });

    mensagem += `
*━━━ COMO FUNCIONA ━━━*

1. Escolha uma classe ao criar sua ficha
2. Após aprovação, use *!avanco* para ver evoluções
3. Use *!<nome da classe>* para ver técnicas (ex: !assassino)

*Exemplos:*
> !lutador - Ver técnicas do Lutador
> !assassino - Ver técnicas do Assassino
> !mago de fogo - Ver técnicas do Mago de Fogo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

_Após escolher sua classe, coloque na ficha:_
> Classe: Nome da classe escolhida

_Exemplo:_
> Classe: Lutador

_Sistema aguardando sua escolha..._
`;

    await MessageService.send({ message: msg, text: mensagem });
};