const MessageService = require("../core/messageService");

/**
 * COMANDO: !nucleos
 * 
 * Sistema de Núcleos de Monstros.
 */

module.exports = async (msg) => {
    const mensagem = `
_Somente núcleos do seu rank ou abaixo podem ser comprados. Use !comprar Núcleo Branco (ou a cor correspondente)._

*─ Núcleos de Monstros 🐦‍🔥 ─*

Os núcleos de monstros, também conhecidos como Essence Stones, são pequenas pedras brilhantes encontradas dentro dos cadáveres de bestas mágicas. O valor de um núcleo é determinado por sua classificação e qualidade. Além de sua função comercial, os núcleos podem ser usados na forja para criar equipamentos com propriedades especiais.

══════════════════════════

*SISTEMA DE NUCLEOS DE MONSTROS*

*VALORES POR RANK*
Rank E: 100.000 Wons
Rank D: 250.000 Wons
Rank C: 350.000 Wons
Rank B: 500.000 Wons
Rank A: 1.000.000 Wons
Rank S: 1.500.000 Wons

*LIMITE DE TRANSPORTE*
20 unidades por rank por dungeon

*MINI BOSS*
Rank E: 50.000 | D: 100.000 | C: 150.000
Rank B: 200.000 | A: 300.000 | S: 500.000+

*BOSS*
Rank E: 100.000 | D: 250.000 | C: 350.000
Rank B: 500.000 | A: 1.000.000 | S: 1.500.000+

*CHANCE DE DROP (BOSS/MINI BOSS)*
Rank E/D: 50% | C: 40% | B: 30% | A/S: 20%

*CORES DOS NUCLEOS*
Branco (E) | Amarelo (D) | Verde (C)
Azul (B) | Vermelho (A) | Roxo (S)

*VENDA PARA ASSOCIACAO*
Minimo 15 nucleos para venda
45 nucleos = desconto na compra de masmorra
    `;
    
    await MessageService.send({ message: msg, text: mensagem });
};
