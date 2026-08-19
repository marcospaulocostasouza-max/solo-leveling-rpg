/*
 * SISTEMA DE MISSÕES
 * 
 * Gerencia missões dos jogadores: criação, progresso e conclusão.
 */

const db = require("../core/database");
const LevelSystem = require("./levelSystem");
const fs = require("fs");
const path = require("path");
const { missoesDisponiveis } = require("../missions/missionAvailability");
const relationshipManager = require("../npc/relationshipManager");
const { provider } = require("../../../../packages/database/config");

const MISSOES_NPC_DIR = path.join(__dirname, "..", "missions", "data");

function executar(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function buscar(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => err ? reject(err) : resolve(row || null));
    });
}

function listar(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows || []));
    });
}

let metadadosProntos;

function garantirMetadadosMissoes() {
    if (metadadosProntos) return metadadosProntos;

    metadadosProntos = (async () => {
        const colunas = provider === "postgres"
            ? await listar("SELECT column_name AS name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ?", ["missoes"])
            : await listar("PRAGMA table_info(missoes)");
        const existentes = new Set(colunas.map((coluna) => coluna.name));
        const novasColunas = {
            npc_id: "TEXT",
            origem_missao_id: "TEXT",
            numero_missao: "INTEGER",
            categoria_missao: "TEXT",
            rank: "TEXT",
            objetivo_texto: "TEXT",
            vinculo_necessario: "INTEGER",
            nivel_recomendado: "TEXT",
            oferecida_em: "TEXT",
            recompensa_item: "TEXT"
        };

        for (const [nome, definicao] of Object.entries(novasColunas)) {
            if (!existentes.has(nome)) {
                await executar(`ALTER TABLE missoes ADD COLUMN ${nome} ${definicao}`);
            }
        }
        await executar("CREATE UNIQUE INDEX IF NOT EXISTS idx_missoes_origem_jogador ON missoes(jogador_id, origem_missao_id) WHERE origem_missao_id IS NOT NULL");
    })().catch((erro) => {
        metadadosProntos = null;
        throw erro;
    });

    return metadadosProntos;
}

function carregarMissoesNPC(npcId) {
    const arquivo = path.join(MISSOES_NPC_DIR, `${npcId}.json`);
    if (!fs.existsSync(arquivo)) return [];
    try {
        const dados = JSON.parse(fs.readFileSync(arquivo, "utf8"));
        return Array.isArray(dados.missoes) ? dados.missoes : [];
    } catch (erro) {
        console.error(`[QUEST] Erro ao ler missões de ${npcId}:`, erro.message);
        return [];
    }
}

class QuestSystem {
    static async sincronizarMissoesPorVinculo(jogadorId) {
        await garantirMetadadosMissoes();
        await relationshipManager.garantirTabela();
        const jogador = await buscar("SELECT id, numero FROM jogadores WHERE id = ?", [jogadorId]);
        if (!jogador || !jogador.numero) return [];

        const relacionamentos = await listar(
            'SELECT "npcId", vinculo FROM npc_relationships WHERE "jogadorId" = ?',
            [jogador.numero]
        );
        const adicionadas = [];

        for (const relacionamento of relacionamentos) {
            const disponiveis = missoesDisponiveis(
                carregarMissoesNPC(relacionamento.npcId),
                relacionamento.vinculo
            );

            for (const missao of disponiveis) {
                const existente = await buscar(
                    "SELECT id FROM missoes WHERE jogador_id = ? AND origem_missao_id = ?",
                    [jogadorId, missao.id]
                );
                if (existente) continue;

                await executar(
                    `INSERT INTO missoes (
                        jogador_id, nome, descricao, tipo, progresso, objetivo,
                        recompensa_xp, recompensa_won, status, data, npc_id,
                        origem_missao_id, numero_missao, categoria_missao, rank,
                        objetivo_texto, vinculo_necessario, nivel_recomendado
                    ) VALUES (?, ?, ?, ?, 0, 1, ?, ?, 'disponivel', datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        jogadorId, missao.nome, missao.descricao, missao.classificacao,
                        missao.recompensas?.xp || 0, missao.recompensas?.won || 0,
                        relacionamento.npcId, missao.id, missao.numero, missao.categoria,
                        missao.rank || null, missao.objetivo || null,
                        missao.vinculoNecessario, missao.nivelRecomendado
                    ]
                );
                adicionadas.push(missao.id);
            }
        }

        return adicionadas;
    }
    
    static async criarMissao(jogadorId, nome, descricao, tipo, objetivo, recompensaXp, recompensaWon) {
        return new Promise((resolve) => {
            db.run(
                "INSERT INTO missoes (jogador_id, nome, descricao, tipo, progresso, objetivo, recompensa_xp, recompensa_won, status, data) VALUES (?, ?, ?, ?, 0, ?, ?, ?, 'ativa', datetime('now'))",
                [jogadorId, nome, descricao, tipo, objetivo, recompensaXp, recompensaWon],
                (err) => resolve(!err)
            );
        });
    }
    
    static async atualizarProgresso(jogadorId, missaoId, progresso = 1) {
        return new Promise((resolve) => {
            db.get("SELECT * FROM missoes WHERE id = ? AND jogador_id = ?", [missaoId, jogadorId], (err, missao) => {
                if (!missao) return resolve(null);
                
                const novoProgresso = missao.progresso + progresso;
                
                if (novoProgresso >= missao.objetivo) {
                    db.run("UPDATE missoes SET progresso = ?, status = 'completa' WHERE id = ?", [missao.objetivo, missaoId], async () => {
                        await LevelSystem.adicionarXp(jogadorId, missao.recompensa_xp, `Missão completa: ${missao.nome}`);
                        db.run("UPDATE jogadores SET won = won + ? WHERE id = ?", [missao.recompensa_won, jogadorId]);
                        if (missao.recompensa_item && String(missao.recompensa_item).toLowerCase() !== "nenhum") {
                            const item = await buscar("SELECT id FROM itens WHERE LOWER(nome)=LOWER(?)", [missao.recompensa_item]);
                            if (item) {
                                const inv = await buscar("SELECT id FROM inventario_jogador WHERE jogador_id=? AND item_id=?", [jogadorId, item.id]);
                                if (inv) await executar("UPDATE inventario_jogador SET quantidade=quantidade+1 WHERE id=?", [inv.id]);
                                else await executar("INSERT INTO inventario_jogador(jogador_id,item_id,quantidade,equipado) VALUES(?,?,1,0)", [jogadorId,item.id]);
                            }
                        }
                        resolve({ completa: true, recompensa: { xp: missao.recompensa_xp, won: missao.recompensa_won, item: missao.recompensa_item || null } });
                    });
                } else {
                    db.run("UPDATE missoes SET progresso = ? WHERE id = ?", [novoProgresso, missaoId]);
                    resolve({ completa: false, progresso: novoProgresso, objetivo: missao.objetivo });
                }
            });
        });
    }
    
    static async listarMissoes(jogadorId) {
        try {
            await this.sincronizarMissoesPorVinculo(jogadorId);
            const [jogador, missoes] = await Promise.all([
                buscar("SELECT numero FROM jogadores WHERE id = ?", [jogadorId]),
                listar("SELECT * FROM missoes WHERE jogador_id = ? ORDER BY status ASC, data DESC", [jogadorId])
            ]);
            if (!jogador || !jogador.numero) return missoes;

            const relacionamentos = await listar(
                'SELECT "npcId", vinculo FROM npc_relationships WHERE "jogadorId" = ?',
                [jogador.numero]
            );
            const vinculos = new Map(relacionamentos.map((rel) => [rel.npcId, Number(rel.vinculo) || 0]));

            return missoes.filter((missao) => {
                if (!["ativa", "disponivel"].includes(missao.status) || !missao.origem_missao_id) return true;
                return (vinculos.get(missao.npc_id) || 0) >= (Number(missao.vinculo_necessario) || 0);
            });
        } catch (erro) {
            console.error("[QUEST] Erro ao listar/sincronizar missões de vínculo:", erro.message);
            return listar("SELECT * FROM missoes WHERE jogador_id = ? ORDER BY status ASC, data DESC", [jogadorId]).catch(() => []);
        }
    }

    static async buscarMissaoPorNome(jogadorId, nome) {
        await this.sincronizarMissoesPorVinculo(jogadorId);
        return buscar(`SELECT * FROM missoes WHERE jogador_id = ? AND lower(nome) = lower(?)`, [jogadorId, nome]);
    }

    static async aceitarMissao(jogadorId, nome) {
        const missao = await this.buscarMissaoPorNome(jogadorId, nome);
        if (!missao) return { erro: "Missão não encontrada entre as suas missões disponíveis." };
        if (missao.status === "completa") return { erro: "Essa missão já foi concluída." };
        if (missao.status === "ativa") return { erro: "Essa missão já está ativa." };
        await executar("UPDATE missoes SET status = 'ativa', oferecida_em = COALESCE(oferecida_em, datetime('now')) WHERE id = ?", [missao.id]);
        return { sucesso: true, missao: { ...missao, status: "ativa" } };
    }

    static async obterOfertaDeMissaoNPC(jogadorId, npcId) {
        await this.sincronizarMissoesPorVinculo(jogadorId);
        const missao = await buscar(`SELECT * FROM missoes WHERE jogador_id = ? AND npc_id = ?
            AND status = 'disponivel' AND oferecida_em IS NULL ORDER BY numero_missao ASC LIMIT 1`, [jogadorId, npcId]);
        if (!missao) return null;
        await executar("UPDATE missoes SET oferecida_em = datetime('now') WHERE id = ?", [missao.id]);
        return missao;
    }
}

module.exports = QuestSystem;
