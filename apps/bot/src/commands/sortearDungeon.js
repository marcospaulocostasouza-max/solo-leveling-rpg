const MessageService = require("../core/messageService");

/*
 * COMANDO: !sortear dungeon
 * 
 * Sistema de sorteio de dungeon semanal.
 * Jogadores podem sortear uma dungeon uma vez por semana.
 */

const db = require("../core/database");

// Probabilidades por raridade (1 a 5 estrelas)
const PROBABILIDADES_RARIDADE = {
    1: 40,  // 40% chance
    2: 30,  // 30% chance
    3: 20,  // 20% chance
    4: 8,   // 8% chance
    5: 2    // 2% chance
};

module.exports = async (msg) => {
    const numero = msg.author || msg.from;
    
    // Buscar jogador
    db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], async (err, jogador) => {
        if (err) {
            console.error("Erro ao buscar jogador:", err);
            return MessageService.send({ message: msg, text: "*═══ Erro ao processar comando. ═══*" });
        }
        
        if (!jogador) {
            return MessageService.send({ message: msg, text: "*═══ Voce precisa ter uma ficha aprovada. ═══*" });
        }
        
        const agora = new Date().toISOString();
        const ultimoSorteio = jogador.ultimo_sorteio_dungeon;
        
        // Verificar se ja passou 1 semana (7 dias)
        if (ultimoSorteio) {
            const dataUltimo = new Date(ultimoSorteio);
            const diffMs = agora - dataUltimo;
            const diffDias = diffMs / (1000 * 60 * 60 * 24);
            
            if (diffDias < 7) {
                const diasRestantes = Math.ceil(7 - diffDias);
                const dataProximo = new Date(dataUltimo.getTime() + 7 * 24 * 60 * 60 * 1000);
                
                return MessageService.send({ message: msg, text: `
*═══ AGUARDE PARA O PROXIMO SORTEIO! ═══*

*Ultimo sorteio:* ${formatarData(dataUltimo)}
*Proximo sorteio:* ${formatarData(dataProximo)}

*Tempo restante:* ${diasRestantes} dia(s)

Voce so pode sortear uma dungeon por semana.
                ` });
            }
        }
        
        // Sortear raridade
        const raridade = sortearRaridade();
        
        // Buscar dungeon da raridade sorteada
        db.all(
            "SELECT * FROM dungeons WHERE rank = ? ORDER BY RANDOM() LIMIT 1",
            [String(raridade)],
            async (err, dungeons) => {
                if (err) {
                    console.error("Erro ao buscar dungeon:", err);
                    return MessageService.send({ message: msg, text: "*═══ Erro ao sortear dungeon. ═══*" });
                }
                
                if (!dungeons || dungeons.length === 0) {
                    return MessageService.send({ message: msg, text: `
*═══ NENHUMA DUNGEON DISPONIVEL! ═══*

Nao ha dungeons de raridade ${raridade} estrelas cadastradas no sistema.
Tente novamente na proxima semana.
                    ` });
                }
                
                const dungeon = dungeons[0];
                
                // Salvar data do sorteio
                db.run(
                    "UPDATE jogadores SET ultimo_sorteio_dungeon = ? WHERE id = ?",
                    [agora, jogador.id],
                    async (err) => {
                        if (err) {
                            console.error("Erro ao salvar sorteio:", err);
                        }
                        
                        // Enviar dungeon para o jogador
                        await MessageService.send({ message: msg, text: `
*═══ DUNGEON SEMANAL SORTEADA! ═══*
────────────────────────══
*Raridade:* ${raridade} estrela(s)
*Nome:* ${dungeon.nome}
*Rank:* ${dungeon.rank}
*Andar:* ${dungeon.andar}

*Descricao:*
${dungeon.descricao || "Explore e enfrente os desafios!"}

*Boss:* ${dungeon.boss || "Aguardando discovery..."}

*Recompensas:*
XP: ${dungeon.recompensa_xp || 0}
Won: ${dungeon.recompensa_won || 0}

────────────────────────══
*Use !dungeon entrar ${dungeon.id} para comecar!*
*Proximo sorteio:* em 7 dias
                        ` });
                    }
                );
            }
        );
    });
};

// =====================================
// FUNCOES AUXILIARES
// =====================================

function sortearRaridade() {
    const rand = Math.random() * 100;
    let acumulado = 0;
    
    for (const [raridade, chance] of Object.entries(PROBABILIDADES_RARIDADE)) {
        acumulado += chance;
        if (rand <= acumulado) {
            return parseInt(raridade);
        }
    }
    
    return 1; // Fallback para raridade 1
}

function formatarData(data) {
    const d = new Date(data);
    return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}