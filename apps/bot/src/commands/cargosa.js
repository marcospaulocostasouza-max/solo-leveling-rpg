const MessageService = require("../core/messageService");

/**
 * COMANDO: !cargosa
 * Cargos da Associação de Caçadores.
 */
module.exports = async (msg) => {
    await MessageService.send({ message: msg, text: `
*CARGOS DA ASSOCIACAO*

1. Recruta Interno - 20.000/sem | 0 pts | Itens E-D
2. Recruta Campo - 25.000/sem | +20 pts | Itens E-D | Nv 20
3. Soldado Interno - 30.000/sem | +20 pts | Itens E-C | Nv 30
4. Soldado Campo - 40.000/sem | +20 pts | Itens E-C | 6 pts doc
5. Supervisor Interno - 60.000/sem | +20 pts | E-D-C-1B | 12 pts
6. Supervisor Campo - 65.000/sem | +20 pts | E-D-C-B | Recom.
7. Especial Interno - 100.000/sem | +20 pts | E-D-C-B | 20 pts
8. Especial Campo - 150.000/sem | +20 pts | E-D-C-B-1A | 35 pts
9. Alto Supervisor I - 200.000/sem | +20 pts | Todos | Recom.
10. Alto Supervisor II - 200.000/sem | +20 pts | Todos | Recom.

*OBS:* Pontos adquiridos completando missoes em nome da associacao.
    ` });
};