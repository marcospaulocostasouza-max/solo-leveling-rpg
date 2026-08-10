const MessageService = require("../core/messageService");

/**
 * COMANDO: !hp
 * Mecânica de HP para NPCs e Bosses.
 */
module.exports = async (msg) => {
    await MessageService.send({ message: msg, text: `
*─ Mecânica de HP 🎴 ─*

Para uma luta mais interessante e mais fiel à obra de Solo Leveling, os NPCs enfrentados terão uma certa quantia de HP pré-definida pelo narrador. Esse sistema serve para que durante eventos tenhamos feitos maiores durante a batalha contra o tão temido chefão. Aplica-se apenas a Mobs de Dungeons e NPCs narrados pela administração.

══════════════════════════

*MECANICA DE HP (NPCs e Bosses)*

*COMO REDUZIR HP*
- Nocautear: reduzir minimo 85% do HP
- Matar: reduzir a 0
- Dano = ataque - resistencia do alvo

*Exemplo:*
Ataque: 1.000 de dano
Resistencia do NPC: 700
Dano total: 300

*REGRAS*
- Coloque no fim da cena o total do seu calculo de dano
- Nem todo ataque acerta - narrador decide
- Boss sempre sera superior ao player
- NPCs podem ter tecnicas para reduzir dano

*AO FIM DE CADA TURNO*
Narrador contabiliza o total de dano que os players causaram.
    ` });
};