const MessageService = require("../core/messageService");

/**
 * COMANDO: !portais
 * Sistema de Portais/Gate para viagem entre países.
 */
module.exports = async (msg) => {
    await MessageService.send({ message: msg, text: `
*─ Sistema de Portais ⛩️ ─*

Devido à proliferação de portais que se manifestam pelo mundo, foi estabelecido um sistema de portais chamado "Gate" em cada capital de país. Estes portais, distintos daqueles que conduzem diretamente às Dungeons, proporcionam a capacidade de viajar para qualquer país previamente designado.

══════════════════════════

*SISTEMA DE PORTAIS (GATE)*

*REGRAS*
- Requer permissao previa da Associacao de Cacadores
- Cada portal e designado para conectar a capital de um pais especifico
- Atravessar sem permissao resulta em caca e prisao
- Portais sao monitorados para evitar abusos
- Sistema visa facilitar viagens internacionais para cacadores
    ` });
};