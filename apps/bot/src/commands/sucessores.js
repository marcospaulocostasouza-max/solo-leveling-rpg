const MessageService = require("../core/messageService");

/**
 * COMANDO: !sucessores
 * 
 * Sistema de Sucessores de Monarcas.
 */

module.exports = async (msg) => {
    const mensagem = `
*─ Sistema de Sucessores ♣️ ─*

No mundo onde Monarcas existem, a sucessão não é uma questão de poder bruto, linhagem de sangue ou prestígio conquistado. A transição de um título tão imponente quanto o de Monarca acontece por meio de um vínculo raro e profundo: a compatibilidade entre duas almas. O Monarca escolhe seu Sucessor e oferece três caminhos distintos para trilhar.

══════════════════════════

*SISTEMA DE SUCESSORES*

Quando um Monarca escolhe um sucessor, ha 3 caminhos:

*[1. TROCA]*
O sucessor muda para uma classe avancada relacionada ao Monarca.
- Skill Unica Mensal da Classe do Monarca (1.2x)
- 3x Atributos
- Maestria na Arma do Monarca
- Acesso a tecnicas da Arma do Monarca

*[2. BENCAO]*
Mantem a classe atual, recebe passiva unica.
- Skill Unica Mensal do Monarca
- 3x Atributos
- Maestria na Arma do Monarca
- 1.5x nas tecnicas da arma

*[3. DESPERTAR]*
Recomeca do nivel 1, com regalias.
- Skill Unica Mensal Mesclada
- Atributos base originais mantidos
- Ao chegar no nivel anterior, dobra atributos recebidos ate nivel 100
- 2x nas tecnicas da arma
- Obrigatorio seguir para Classe Avancada do Monarca
- Ao nv 100: 3 Skills Unicas do Monarca

*SE TORNANDO O MONARCA*
Ao nivel 100, todos os sucessores sao convocados para a Dungeon do Arquiteto.
    `;
    
    await MessageService.send({ message: msg, text: mensagem });
};