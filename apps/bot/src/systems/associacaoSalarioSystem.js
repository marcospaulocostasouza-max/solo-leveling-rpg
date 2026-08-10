/**
 * SISTEMA DE SALÁRIOS DA ASSOCIAÇÃO
 * 
 * Gerencia pagamentos semanais automáticos para membros da Associação.
 * Verifica a cada hora se algum membro precisa ser pago.
 * O pagamento é baseado no cargo e rank do jogador.
 */

const db = require("../core/database");
const JogadorCore = require("../core/jogadorCore");

// =====================================
// TABELA DE CARGOS E SALÁRIOS
// =====================================
const CARGOS_ASSOCIACAO = {
    "Recruta Interno": { salario: 20000, pontos: 0, requisito_nivel: 1 },
    "Recruta Campo": { salario: 25000, pontos: 20, requisito_nivel: 10 },
    "Soldado Interno": { salario: 30000, pontos: 20, requisito_nivel: 20 },
    "Soldado Campo": { salario: 40000, pontos: 20, requisito_nivel: 30 },
    "Supervisor Interno": { salario: 60000, pontos: 20, requisito_nivel: 40 },
    "Supervisor Campo": { salario: 65000, pontos: 20, requisito_nivel: 50 },
    "Especial Interno": { salario: 100000, pontos: 20, requisito_nivel: 60 },
    "Especial Campo": { salario: 150000, pontos: 20, requisito_nivel: 70 },
    "Alto Supervisor I": { salario: 200000, pontos: 20, requisito_nivel: 80 },
    "Alto Supervisor II": { salario: 200000, pontos: 20, requisito_nivel: 90 }
};

// Cargos em ordem crescente
const CARGOS_ORDEM = Object.keys(CARGOS_ASSOCIACAO);

class AssociacaoSalarioSystem {
    
    /**
     * Inicializa o sistema de verificação de salários
     * Verifica a cada 1 hora se algum membro precisa ser pago
     */
    static iniciar() {
        console.log("[SALARIO] Sistema de salários da Associação iniciado!");
        
        // Verificar imediatamente ao iniciar
        this.verificarSalarios();
        
        // Depois verificar a cada 1 hora
        setInterval(() => {
            this.verificarSalarios();
        }, 60 * 60 * 1000); // 1 hora
    }
    
    /**
     * Verifica todos os membros ativos da Associação
     * e paga aqueles que não receberam nos últimos 7 dias
     */
    static async verificarSalarios() {
        try {
            console.log("[SALARIO] Verificando salários da Associação...");
            
            const membros = await new Promise((resolve) => {
                db.all(
                    `SELECT am.*, j.nome, j.nivel, j.rank, j.won, j.numero
                     FROM associacao_membros am
                     JOIN jogadores j ON am.jogador_id = j.id
                     WHERE am.ativo = 1`,
                    [],
                    (err, rows) => resolve(rows || [])
                );
            });
            
            if (membros.length === 0) {
                console.log("[SALARIO] Nenhum membro ativo encontrado.");
                return;
            }
            
            const agora = new Date();
            const seteDias = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms
            let pagamentosRealizados = 0;
            
            for (const membro of membros) {
                // Verificar se já passou 7 dias desde o último pagamento
                const ultimoPagamento = membro.data_ultimo_salario 
                    ? new Date(membro.data_ultimo_salario) 
                    : null;
                
                // Se nunca recebeu ou já passou 7 dias
                const devePagar = !ultimoPagamento || (agora.getTime() - ultimoPagamento.getTime() >= seteDias);
                
                if (devePagar) {
                    await this.pagarSalario(membro);
                    pagamentosRealizados++;
                }
            }
            
            if (pagamentosRealizados > 0) {
                console.log(`[SALARIO] ${pagamentosRealizados} membro(s) receberam salário!`);
            }
            
        } catch (err) {
            console.error("[SALARIO] Erro ao verificar salários:", err);
        }
    }
    
    /**
     * Paga o salário para um membro específico
     */
    static async pagarSalario(membro) {
        try {
            // Verificar se o cargo do membro ainda é válido baseado no nível
            let cargoAtual = membro.cargo || "Recruta Interno";
            let salario = membro.salario_semanal || 20000;
            
            // Verificar se o jogador merece promoção baseada no nível
            for (let i = CARGOS_ORDEM.length - 1; i >= 0; i--) {
                const cargo = CARGOS_ORDEM[i];
                const info = CARGOS_ASSOCIACAO[cargo];
                if (membro.nivel >= info.requisito_nivel) {
                    if (cargo !== cargoAtual) {
                        // Promoção automática
                        cargoAtual = cargo;
                        salario = info.salario;
                        console.log(`[SALARIO] ${membro.nome} foi promovido para ${cargoAtual}!`);
                    }
                    break;
                }
            }
            
            // Pagar salário
            await JogadorCore.adicionarValor(membro.jogador_id, "won", salario);
            
            // Atualizar data do último pagamento e cargo
            const dataAtual = new Date().toISOString();
            await new Promise((resolve) => {
                db.run(
                    `UPDATE associacao_membros SET 
                     data_ultimo_salario = ?,
                     salario_semanal = ?,
                     cargo = ?
                     WHERE jogador_id = ?`,
                    [dataAtual, salario, cargoAtual, membro.jogador_id],
                    (err) => resolve()
                );
            });
            
            // Registrar transação
            db.run(
                `INSERT INTO transacoes (jogador_id, valor, tipo, motivo, data) 
                 VALUES (?, ?, 'salario', 'Salário semanal da Associação', datetime('now'))`,
                [membro.jogador_id, salario]
            );
            
            console.log(`[SALARIO] ${membro.nome} recebeu ${salario} Won (${cargoAtual})`);
            
        } catch (err) {
            console.error(`[SALARIO] Erro ao pagar ${membro.nome}:`, err);
        }
    }
}

module.exports = AssociacaoSalarioSystem;