/**
 * UTILITÁRIO: Verificar Bloqueio de Classe Avançada
 * 
 * Verifica se o jogador está bloqueado no nível 40
 * e impede ganho de XP/recompensas até concluir a quest.
 */

const db = require("../core/database");

module.exports = async (numero) => {
    const jogador = await new Promise((resolve) => {
        db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], (err, row) => {
            resolve(row);
        });
    });
    
    if (!jogador) return { bloqueado: false };
    
    const nivel = jogador.nivel || 1;
    const classeAvancada = jogador.classe_avancada || "";
    
    // Se já tem classe avançada, não está bloqueado
    if (classeAvancada && classeAvancada !== "Nenhuma" && classeAvancada !== "BLOQUEADO") {
        return { bloqueado: false };
    }
    
    // Se está no nível 40+ e não tem classe avançada, está bloqueado
    if (nivel >= 40 && (!classeAvancada || classeAvancada === "BLOQUEADO")) {
        return { 
            bloqueado: true, 
            motivo: "Você alcançou o nível 40 e precisa escolher uma classe avançada para continuar evoluindo.",
            comando: "!iniciar quest classe avançada"
        };
    }
    
    return { bloqueado: false };
};

module.exports.verificarEAplicar = async (numero) => {
    const verificacao = await module.exports(numero);
    
    if (verificacao.bloqueado) {
        return {
            bloqueado: true,
            mensagem: `
*══════════════════════════*
*⚠ AVISO DO SISTEMA ⚠*
*══════════════════════════*

*Seu avanço está trancado!*

${verificacao.motivo}

*Você não receberá XP ou recompensas até concluir o avanço de classe.*

*Para liberar seu progresso:*
Use: *${verificacao.comando}*

_O sistema não permite ultrapassar o nível 40 até concluir este passo._
            `
        };
    }
    
    return { bloqueado: false };
};