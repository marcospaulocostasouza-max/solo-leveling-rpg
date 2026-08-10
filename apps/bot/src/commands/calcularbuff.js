const MessageService = require("../core/messageService");

/**
 * COMANDO: !calcularbuff
 * Guia de Cálculo de Buffs do sistema.
 */
module.exports = async (msg) => {
    await MessageService.send({ message: msg, text: `
*─ Calculando Buffs 💪🏽 ─*

Este guia explica como funcionam os atributos base, buffs, debuffs e reduções de dano no sistema. Os atributos base são divididos em base verdadeira (atributos limpos sem alteração) e base estável (resultado de itens fundidos ao corpo). Entender como calcular buffs é fundamental para o combate.

══════════════════════════

*GUIA DE CALCULO DE BUFFS*

*ATRIBUTOS BASE*
Base verdadeira: Atributos limpos sem alteracao (UP, Rank, Classe)
Base estavel: Resultado de itens fundidos ao corpo (Gnosis, buff classe)

*BUFF/AMENTO ORIGINAL*
Bonus fundidos aos bonus de classe, calculados ANTES dos itens.

*Exemplo:*
PM base: 100
Buff classe (Mago): +50%
Buff tecnica: +50%
Calculo: 100 + 100% = 200 PM

*Com itens:*
PM base: 100
Buffs: +100% = 200
Item: +5
Total: 205 PM

*BUFF/DANO FINAL*
Apos calcular dano, soma porcentagem ao final.
205 + 10% (passiva) = 226 de dano

*DEBUFF*
Maldicoes subtraem buffs existentes primeiro.
Se nao existirem, removem diretamente da base.
100 + 100% - 30% = 170 (se houver buff)
100 - 30% = 70 (se nao houver buff)

*REDUCAO DE DANO*
Reducoes nao se somam, se sobrepoem.
300 - 50% = 150 - 25% = 113
Ordem: Escudos > Armaduras > Habilidades corporais
    ` });
};