const MessageService = require("../core/messageService");

/**
 * COMANDO: !loja nucleos / !loja núcleos
 *
 * Exibe o catálogo da Loja de Núcleos de Monstros.
 * Os núcleos (Essence Stones) são classificados por rank,
 * cada um com valores e cores específicas.
 */

module.exports = async (msg) => {
    const mensagem = `
*─ Loja de Núcleos 🐦‍🔥 ─*

_Os núcleos de monstros, também conhecidos como Essence Stones, são pequenas pedras brilhantes encontradas dentro dos cadáveres de bestas mágicas. O valor de um núcleo é determinado por sua classificação e qualidade. Além de sua função comercial, os núcleos podem ser usados na forja para criar equipamentos com propriedades especiais._

_Além da compra e venda, os núcleos podem ser trocados com a Associação de Caçadores por benefícios exclusivos._

┈┈┈┈┈┈┈┈┈┈
*[Núcleos por Rank]*

*Rank E* - Branco ⌾ [5.000₩]
↳ Encontrado em monstros comuns de Rank E.

*Rank D* - Amarelo ⌾ [7.500₩]
↳ Encontrado em monstros de Rank D.

*Rank C* - Verde ⌾ [10.000₩]
↳ Encontrado em monstros de Rank C.

*Rank B* - Azul ⌾ [15.000₩]
↳ Encontrado em monstros de Rank B.

*Rank A* - Vermelho ⌾ [20.000₩]
↳ Encontrado em monstros de Rank A.

*Rank S* - Roxo ⌾ [30.000₩]
↳ Encontrado em monstros de Rank S.
┈┈┈┈┈┈┈┈┈┈
*[Mini Boss]*

> Rank E: 50.000₩
> Rank D: 100.000₩
> Rank C: 150.000₩
> Rank B: 200.000₩
> Rank A: 300.000₩
> Rank S: 500.000₩+

┈┈┈┈┈┈┈┈┈┈
*[Boss]*

> Rank E: 100.000₩
> Rank D: 250.000₩
> Rank C: 350.000₩
> Rank B: 500.000₩
> Rank A: 1.000.000₩
> Rank S: 1.500.000₩+

┈┈┈┈┈┈┈┈┈┈
*[Chance de Drop - Boss/Mini Boss]*

> Rank E/D: 50%
> Rank C: 40%
> Rank B: 30%
> Rank A/S: 20%

┈┈┈┈┈┈┈┈┈┈
*[Limite de Transporte]*
> 20 unidades por rank por dungeon

*[Venda para a Associação]*
> Mínimo de 15 núcleos para venda
> 45 núcleos = desconto na compra de masmorra

┈┈┈┈┈┈┈┈┈┈
_Os núcleos são obtidos ao derrotar monstros em dungeons._
_Use *!nucleos* para ver as informações completas do sistema._
    `;

    await MessageService.send({ message: msg, text: mensagem });
};