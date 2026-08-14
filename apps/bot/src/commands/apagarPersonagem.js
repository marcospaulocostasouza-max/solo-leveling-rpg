const MessageService = require("../core/messageService");

/**
 * COMANDO: !apagar personagem
 * 
 * Sistema de exclusão completa de personagem.
 * Reseta tudo: atributos, inventário, técnicas, afinidades, etc.
 * Requer confirmação dupla para evitar acidentes.
 */

const db = require("../core/database");
const fichasTemp = require("../utils/fichasTemp");

module.exports = async (msg) => {
    const numero = msg.author || msg.from;
    const corpo = msg.body.toLowerCase().trim();
    
    // Verificar se é o comando de confirmação
    if (corpo === "!tenho certeza") {
        return executarExclusao(msg, numero);
    }
    
    // Primeiro estágio: pedir confirmação
    const jogador = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    const fichaPendente = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM fichas_pendentes WHERE numero = ?", [numero], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    
    if (!jogador && !fichaPendente) {
        return MessageService.send({ message: msg, text: "*✖ Você não possui um personagem criado.*\n_Use !ficha para criar um novo personagem._" });
    }

    let dadosPendentes = {};
    try { dadosPendentes = JSON.parse(fichaPendente?.dados || "{}"); } catch {}
    const nomePersonagem = jogador?.nome || dadosPendentes.nome || "Ficha pendente";
    
    // Verificar se já está em processo de exclusão
    const processoExistente = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM processos_exclusao WHERE numero = ? AND status = 'aguardando'", [numero], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    
    if (processoExistente) {
        return MessageService.send({ message: msg, text: `*⚠ PROCESSO DE EXCLUSÃO PENDENTE ⚠*
──────────────────────────

Você já tem um processo de exclusão aguardando confirmação.

Para confirmar e apagar seu personagem permanentemente, digite:
*!tenho certeza*

_O processo expira em 5 minutos._` });
    }
    
    // Criar processo de exclusão
    const dataExpiracao = new Date();
    dataExpiracao.setMinutes(dataExpiracao.getMinutes() + 5);
    
    await new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO processos_exclusao (numero, jogador_nome, status, data_criacao, data_expiracao) VALUES (?, ?, 'aguardando', datetime('now'), ?)",
            [numero, nomePersonagem, dataExpiracao.toISOString()],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
    
    // Agendar limpeza automática do processo
    setTimeout(async () => {
        try {
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM processos_exclusao WHERE numero = ? AND status = 'aguardando'", [numero], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (err) {
            console.log("Erro ao limpar processo de exclusão:", err);
        }
    }, 5 * 60 * 1000); // 5 minutos
    
    // Mensagem de confirmação
    await MessageService.send({ message: msg, text: `*⚠ ATENÇÃO - EXCLUSÃO DE PERSONAGEM ⚠*
──────────────────────────

Você está prestes a apagar permanentemente ${jogador ? "seu personagem" : "sua ficha ainda não aprovada"}:
> *Nome:* ${nomePersonagem}
> *Classe:* ${jogador?.classe || dadosPendentes.classe || "Não definida"}
${jogador ? `> *Nível:* ${jogador.nivel || 1}` : "> *Status:* Aguardando aprovação"}

*─── O Que Será Apagado ───*
> ✓ Todos os atributos e pontos
> ✓ Inventário completo
> ✓ Técnicas e habilidades
> ✓ Afinidade elemental
> ✓ Títulos e passivas
> ✓ Histórico de atividades
> ✓ Progresso de nível e XP
> ✓ Won e Maestria

*─── ESTA AÇÃO NÃO PODE SER DESFEITA ───*

Para confirmar a exclusão, digite:
*!tenho certeza*

_Cancelar automaticamente em 5 minutos._` });
};

async function executarExclusao(msg, numero) {
    try {
        // Verificar se existe processo de exclusão
        const processo = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM processos_exclusao WHERE numero = ? AND status = 'aguardando'", [numero], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!processo) {
            return MessageService.send({ message: msg, text: "*✖ Nenhum processo de exclusão encontrado.*\n_Use !apagar personagem para iniciar o processo._" });
        }
        
        // Buscar dados do jogador para log
        const jogador = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        const nomeJogador = jogador ? jogador.nome : processo.jogador_nome || "Ficha pendente";
        
        // Marcar processo como confirmado
        await new Promise((resolve, reject) => {
            db.run("UPDATE processos_exclusao SET status = 'confirmado' WHERE numero = ?", [numero], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // =====================================
        // EXCLUIR TODOS OS DADOS DO JOGADOR
        // =====================================
        
        // Buscar ID do jogador
        const jogadorId = jogador ? jogador.id : null;
        
        if (jogadorId) {
            // Excluir em ordem (respeitando foreign keys)
            
            // 1. Histórico de técnicas
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM historico_tecnicas WHERE jogador_id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 2. Técnicas do jogador
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM jogador_tecnicas WHERE jogador_id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 3. Inventário
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM inventario_jogador WHERE jogador_id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 4. Atividades
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM atividades_registro WHERE jogador_id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 5. Contador de atividades
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM atividades_contador WHERE jogador_id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 6. Missões
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM missoes WHERE jogador_id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 7. Batalhas
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM batalhas WHERE jogador_id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 8. Arena histórico
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM arena_historico WHERE jogador_id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 9. Dungeons
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM jogador_dungeons WHERE jogador_id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 10. Membros de guilda
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM guilda_membros WHERE jogador_id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 11. Associação
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM associacao_membros WHERE jogador_id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 12. Submundo atividades
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM submundo_atividades WHERE jogador_id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 13. Conquistas
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM jogador_conquistas WHERE jogador_id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 14. Experiência histórico
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM experiencia_historico WHERE jogador_id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 15. Transações
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM transacoes WHERE jogador_id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 16. Compras
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM compras WHERE jogador_id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 17. Aprovação fichas
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM aprovacao_fichas WHERE jogador_id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 18. Habilidades únicas pendentes
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM habilidades_unicas_pendentes WHERE criado_por = ?", [numero], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 19. Itens únicos pendentes
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM itens_unicos_pendentes WHERE criado_por = ?", [numero], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // 20. Finalmente, excluir o jogador
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM jogadores WHERE id = ?", [jogadorId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        // A ficha reconhecida existe antes da criação do jogador. Ela também
        // deve ser removida quando a exclusão é confirmada.
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM fichas_pendentes WHERE numero = ?", [numero], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        delete fichasTemp[numero];
        
        // Limpar processo de exclusão
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM processos_exclusao WHERE numero = ?", [numero], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Log da exclusão
        console.log(`[EXCLUSÃO] Personagem de ${nomeJogador} (${numero}) foi excluído permanentemente`);
        
        // Mensagem de confirmação
        await MessageService.send({ message: msg, text: `
*✓ PERSONAGEM EXCLUÍDO COM SUCESSO*

Seu personagem *${nomeJogador}* foi completamente apagado do sistema.

*═══ TUDO FOI RESETADO ═══*
✓ Atributos e pontos
✓ Inventário e equipamentos
✓ Técnicas e habilidades
✓ Afinidade elemental
✓ Títulos e passivas
✓ Histórico e progresso

Você pode criar um novo personagem a qualquer momento usando:
*!ficha*

_Boa sorte na sua nova jornada!_
        ` });
        
    } catch (error) {
        console.error("Erro ao excluir personagem:", error);
        await MessageService.send({ message: msg, text: "*✖ Erro ao excluir personagem. Tente novamente ou contate um administrador.*" });
    }
}
