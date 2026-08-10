const MessageService = require("../core/messageService");

const mensagens = [
`════════════════════════════════════
*ATRIBUTOS FÍSICOS*
════════════════════════════════════

› *Força*: poder físico, impacto e capacidade de carga.
› *Resistência*: vida, defesa física e tolerância a danos.
› *Velocidade*: deslocamento, reflexos e capacidade de reagir.
› *Sentidos*: percepção, mira e leitura de ameaças.

_Use !jogador para consultar seus valores finais._`,
`════════════════════════════════════
*ATRIBUTOS MÁGICOS*
════════════════════════════════════

› *Inteligência*: controle, aprendizado e eficiência de mana.
› *Poder mágico*: potência de feitiços, técnicas elementais e curas.
› *Mana*: recurso gasto por técnicas; o total depende da ficha e dos efeitos ativos.

_Atributos mágicos não substituem os físicos: cada técnica informa a forma como usa seus valores._`,
`════════════════════════════════════
*ATRIBUTOS ADICIONAIS*
════════════════════════════════════

› Os atributos finais incluem base, classe, rank, equipamentos, buffs e efeitos válidos.
› Títulos, passivas e técnicas podem alterar a leitura de uma cena quando sua descrição indicar isso.
› Distribua pontos disponíveis com !distribuir.
› Consulte a escala atual em !faixa de atributos.

_Nenhum valor é alterado por este comando._`
];

module.exports = async (msg) => {
    for (const texto of mensagens) {
        await MessageService.send({ message: msg, text: texto });
    }
};
