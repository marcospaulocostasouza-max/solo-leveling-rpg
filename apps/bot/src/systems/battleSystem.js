/*
 * SISTEMA DE BATALHA
 * 
 * Gerencia combates entre jogadores e monstros/bosses.
 * Sistema de turnos com cálculo de dano baseado em atributos.
 */

const db = require("../core/database");
const LevelSystem = require("./levelSystem");
const ArenaSystem = require("./arenaSystem");
const relationshipManager = require("../npc/relationshipManager");

// Modificadores finais de dano para combate contra NPCs específicos.
// Ajuste estes valores sem tocar nas fórmulas-base de combate.
const BONUS_DANO_HOSTIL = 0.05;
const REDUCAO_DANO_VINCULO = 0.15;

// Cache de batalhas ativas
const batalhasAtivas = {};

class BattleSystem {

    static criarInimigoNPC(npc) {
        const atributos = npc.atributos || {};
        const forca = Number(atributos.forca) || 0;
        const resistencia = Number(atributos.resistencia) || 0;
        const poderMagico = Number(atributos.poder_magico) || 0;
        const nivel = Number(npc.nivel) || 1;

        // Os JSONs de NPC já possuem atributos, mas não usam o formato
        // vida/dano/defesa do BattleSystem. Esta adaptação não altera
        // nenhuma fórmula de uma batalha já existente contra monstros.
        return {
            npcId: npc.id,
            nome: npc.nome,
            nivel,
            rank: npc.rank || "E",
            vida: Number(npc.vida) || (100 + nivel * 10 + resistencia * 5),
            dano: Number(npc.dano) || Math.max(forca, poderMagico),
            defesa: Number(npc.defesa) || resistencia,
            resistencia
        };
    }

    static determinarModificadorRelacao(estadoRelacao) {
        if (!estadoRelacao) return { multiplicador: 1, hesitou: false, agressivo: false };
        if (estadoRelacao.hostilidade >= 40) {
            return { multiplicador: 1 + BONUS_DANO_HOSTIL, hesitou: false, agressivo: true };
        }
        if (
            estadoRelacao.vinculo >= 60 &&
            estadoRelacao.hostilidade < relationshipManager.LIMIAR_HOSTILIDADE_ALERTA
        ) {
            return { multiplicador: 1 - REDUCAO_DANO_VINCULO, hesitou: true, agressivo: false };
        }
        return { multiplicador: 1, hesitou: false, agressivo: false };
    }

    static async obterModificadorRelacaoNPC(jogador, batalha) {
        if (!batalha.npcId) return this.determinarModificadorRelacao(null);

        await relationshipManager.garantirTabela();
        const relacao = await relationshipManager.obterOuCriar(batalha.npcId, jogador.numero);
        return this.determinarModificadorRelacao(
            relationshipManager.classificarRelacao(relacao)
        );
    }
    
    /*
     * Inicia uma nova batalha
     */
    static iniciarBatalha(jogadorId, inimigo) {
        const batalha = {
            jogadorId,
            inimigo: { ...inimigo, vidaAtual: inimigo.vida },
            npcId: inimigo.npcId || null,
            turno: 1,
            status: "ativa",
            inicio: Date.now()
        };
        
        batalhasAtivas[jogadorId] = batalha;
        return batalha;
    }
    
    /*
     * Calcula dano baseado em atributos
     */
    static calcularDano(atacante, defensor, tipo = "fisico") {
        let danoBase = tipo === "fisico" ? atacante.forca : atacante.poderMagico;
        let defesa = defensor.resistencia;
        
        // Calcular dano
        const dano = Math.max(0, danoBase - (defesa * 0.5));
        const danoFinal = Math.floor(dano * (0.8 + Math.random() * 0.4)); // Variação de ±20%
        
        return {
            dano: danoFinal,
            critico: Math.random() < 0.1, // 10% chance de crítico
            tipo
        };
    }
    
    /*
     * Executa um turno de ataque
     */
    static async atacar(jogadorId, tecnicaNome = null) {
        const batalha = batalhasAtivas[jogadorId];
        if (!batalha || batalha.status !== "ativa") {
            return { erro: "Nenhuma batalha ativa encontrada." };
        }
        
        return new Promise((resolve) => {
            db.get(
                "SELECT * FROM jogadores WHERE id = ?",
                [jogadorId],
                async (err, jogador) => {
                    if (err || !jogador) {
                        resolve({ erro: "Jogador não encontrado." });
                        return;
                    }
                    
                    const ataque = this.calcularDano(
                        { forca: jogador.forca_total, poderMagico: jogador.poder_magico_total },
                        batalha.inimigo,
                        tecnicaNome ? "magico" : "fisico"
                    );
                    
                    batalha.inimigo.vidaAtual -= ataque.dano;
                    
                    // Verificar se inimigo morreu
                    if (batalha.inimigo.vidaAtual <= 0) {
                        batalha.status = "vitoria";
                        const dataInicio = batalha.inicio ? new Date(batalha.inicio).toISOString() : new Date().toISOString();
                        const turnoFinal = batalha.turno;
                        this.processarRecompensa(jogadorId, batalha.inimigo).then((progressao) => {
                            ArenaSystem.registrarResultado(jogadorId, batalha.inimigo.nome, "vitoria", turnoFinal, dataInicio)
                                .catch(err => console.log("Erro ao registrar histórico da arena:", err));
                            resolve({
                                resultado: "vitoria",
                                ataque,
                                inimigo: batalha.inimigo,
                                recompensa: batalha.inimigo,
                                progressao
                            });
                        });
                        delete batalhasAtivas[jogadorId];
                        return;
                    }
                    
                    // Turno do inimigo
                    const danoInimigo = Math.max(0, batalha.inimigo.dano - (jogador.resistencia_total * 0.3));
                    const danoFinal = Math.floor(danoInimigo * (0.8 + Math.random() * 0.4));
                    const modificadorRelacao = await this.obterModificadorRelacaoNPC(jogador, batalha);
                    const danoComRelacao = Math.floor(danoFinal * modificadorRelacao.multiplicador);
                    
                    batalha.turno++;
                    
                    resolve({
                        resultado: "continua",
                        ataque,
                        danoSofrido: danoComRelacao,
                        relacaoNPC: modificadorRelacao,
                        inimigo: batalha.inimigo,
                        turno: batalha.turno
                    });
                }
            );
        });
    }
    
    /*
     * Processa recompensas após vitória
     */
    static async processarRecompensa(jogadorId, inimigo) {
        return new Promise((resolve) => {
            db.run(
                "UPDATE jogadores SET won = won + ? WHERE id = ?",
                [inimigo.won || 50, jogadorId],
                (err) => {
                    if (err) console.log("Erro ao processar recompensa:", err);

                    LevelSystem.adicionarXp(jogadorId, inimigo.experiencia || 100, `Derrotou ${inimigo.nome}`)
                        .then((progressao) => {
                            resolve(progressao);
                        });
                }
            );
        });
    }
    
    /*
     * Foge da batalha
     */
    static fugir(jogadorId) {
        const batalha = batalhasAtivas[jogadorId];
        if (!batalha) {
            return { erro: "Nenhuma batalha ativa." };
        }
        
        batalha.status = "fugiu";
        delete batalhasAtivas[jogadorId];
        
        return { resultado: "fugiu", mensagem: "Você fugiu da batalha!" };
    }
    
    /*
     * Obtém status da batalha
     */
    static getStatus(jogadorId) {
        return batalhasAtivas[jogadorId] || null;
    }
}

module.exports = BattleSystem;
