const MessageService = require("../core/messageService");

/**
 * COMANDO: !mineracao
 * 
 * Exibe o sistema de mineração para obtenção de cristais em dungeons.
 */

module.exports = async (msg) => {
    const mensagem = `
*─ Mineração ⛏️ ─*

Este sistema corresponde aos jogadores que irão desempenhar a função de minerador dentro de dungeons. Os mineradores ganham apenas 20% de XP envolvido na conclusão da Dungeon, mas podem obter cristais valiosos.

══════════════════════════

*SISTEMA DE MINERAÇÃO*

*COMO FUNCIONA?*
O minerador é um participante especial que NÃO conta no limite de 5 participantes da dungeon. Ele coleta cristais e materiais que seriam perdidos após o uso da dungeon.

*COMO PARTICIPAR COMO MINERADOR?*
1. Compre uma *Picareta* na loja (categoria "Itens de Apoio" - 20.000 Wons)
2. Adicione-se como minerador na ficha de dungeon
3. Após a conclusão, o sistema realizará o sorteio automático dos cristais

*PREMIAÇÃO DO MINERADOR*
Cristais Grandes: 100.000 Wons (10% chance)
Cristais Médios: 60.000 Wons (20% chance)
Cristais Pequenos: 20.000 Wons (30% chance)
Nada: 40% chance

*SISTEMA DE SORTEIO*
Após a conclusão da dungeon, o sistema realiza automaticamente:
1. Define o tipo de cristal (baseado nas porcentagens)
2. Sorteia a quantidade (1-5 cristais):
   - 1 Cristal: 50% chance
   - 2 Cristais: 25% chance
   - 3 Cristais: 15% chance
   - 4 Cristais: 5% chance
   - 5 Cristais: 5% chance

*REGRAS*
- O minerador NÃO escolhe prêmios (apenas coleta cristais)
- A picareta quebra após o uso (consumível)
- Não há restrição de rank para mineradores
- O minerador não conta no limite de 5 participantes
    `;
    
    await MessageService.send({ message: msg, text: mensagem });
};
