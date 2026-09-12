/*
 * SISTEMA DE MISSÕES
 * 
 * Gerencia missões dos jogadores: criação, progresso e conclusão.
 */

const db = require("../core/database");
const database = require("../../../../packages/database");
const { canonicalId } = require("../npc/npcIdentity");
const LevelSystem = require("./levelSystem");
const fs = require("fs");
const path = require("path");
const { missoesDisponiveis } = require("../missions/missionAvailability");
const relationshipManager = require("../npc/relationshipManager");
const { provider } = require("../../../../packages/database/config");
const CrystalRewardService = require("./crystalRewardService");

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
            recompensa_item: "TEXT",
            recompensa_vinculo: "INTEGER NOT NULL DEFAULT 0",
            aprovada_por: "TEXT",
            aprovada_em: "TEXT",
            cena_aprovada: "TEXT",
            recompensa_cristais: "INTEGER NOT NULL DEFAULT 0",
            relato_entrega: "TEXT",
            entregue_em: "TEXT",
            reacao_npc_pendente_em: "TEXT",
            reacao_npc_entregue_em: "TEXT"
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
    const arquivo = path.join(MISSOES_NPC_DIR, `${canonicalId(npcId)}.json`);
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
                if (existente) {
                    // Atualize o catálogo sem resetar aceites, ofertas ou progresso.
                    // Recompensas já concluídas são histórico, não são reescritas.
                    await executar(`UPDATE missoes SET nome=?,descricao=?,rank=?,objetivo_texto=?,
                        recompensa_xp=?,recompensa_won=?,recompensa_item=?,nivel_recomendado=?,recompensa_vinculo=?
                        WHERE id=? AND status='disponivel' AND oferecida_em IS NULL`, [missao.nome, missao.descricao, missao.rank,
                        missao.objetivo, missao.recompensas?.xp || 0, missao.recompensas?.won || 0,
                        missao.recompensas?.item || null, missao.nivelRecomendado, Number(missao.recompensas?.vinculo || 0), existente.id]);
                    continue;
                }

                await executar(
                    `INSERT INTO missoes (
                        jogador_id, nome, descricao, tipo, progresso, objetivo,
                        recompensa_xp, recompensa_won, recompensa_cristais, status, data, npc_id,
                        origem_missao_id, numero_missao, categoria_missao, rank,
                        objetivo_texto, vinculo_necessario, nivel_recomendado, recompensa_item, recompensa_vinculo
                    ) VALUES (?, ?, ?, ?, 0, 1, ?, ?, ?, 'disponivel', datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT DO NOTHING`,
                    [
                        jogadorId, missao.nome, missao.descricao, missao.classificacao,
                        missao.recompensas?.xp || 0, missao.recompensas?.won || 0, missao.recompensas?.cristais || 0,
                        relacionamento.npcId, missao.id, missao.numero, missao.categoria,
                        missao.rank || null, missao.objetivo || null,
                        missao.vinculoNecessario, missao.nivelRecomendado, missao.recompensas?.item || null, Number(missao.recompensas?.vinculo || 0)
                    ]
                );
                adicionadas.push(missao.id);
            }
        }

        return adicionadas;
    }
    
    static async criarMissao(jogadorId, nome, descricao, tipo, objetivo, recompensaXp, recompensaWon, recompensaCristais = 0) {
        return new Promise((resolve) => {
            db.run(
                "INSERT INTO missoes (jogador_id, nome, descricao, tipo, progresso, objetivo, recompensa_xp, recompensa_won, recompensa_cristais, status, data) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, 'ativa', datetime('now'))",
                [jogadorId, nome, descricao, tipo, objetivo, recompensaXp, recompensaWon, recompensaCristais],
                (err) => resolve(!err)
            );
        });
    }
    
    static async atualizarProgresso(jogadorId, missaoId, progresso = 1) {
        // Missões de NPC passam por relato e aprovação humana. Esta API continua
        // atendendo missões legadas, que não possuem uma origem de catálogo.
        const missao = await buscar("SELECT * FROM missoes WHERE id=? AND jogador_id=?", [missaoId, jogadorId]);
        if (!missao) return null;
        if (missao.origem_missao_id || missao.npc_id) throw new Error("Esta missão de NPC exige aprovação da ADM após a cena. O relato do jogador é opcional.");
        if (missao.status === "completa") return { completa: true, duplicada: true, recompensa: null };
        const novoProgresso = Number(missao.progresso || 0) + Math.max(0, Number(progresso) || 0);
        if (novoProgresso < Number(missao.objetivo || 1)) {
            await executar("UPDATE missoes SET progresso=? WHERE id=? AND jogador_id=?", [novoProgresso, missaoId, jogadorId]);
            return { completa: false, progresso: novoProgresso, objetivo: missao.objetivo };
        }
        await executar("UPDATE missoes SET progresso=objetivo,status='completa' WHERE id=? AND jogador_id=? AND status <> 'completa'", [missaoId, jogadorId]);
        await LevelSystem.adicionarXp(jogadorId, Number(missao.recompensa_xp || 0), `Missão completa: ${missao.nome}`);
        await executar("UPDATE jogadores SET won=won+? WHERE id=?", [Number(missao.recompensa_won || 0), jogadorId]);
        let item = null;
        if (missao.recompensa_item && String(missao.recompensa_item).toLowerCase() !== "nenhum") {
            item = await buscar("SELECT id FROM itens WHERE LOWER(nome)=LOWER(?)", [missao.recompensa_item]);
            if (item) {
                const inv = await buscar("SELECT id FROM inventario_jogador WHERE jogador_id=? AND item_id=?", [jogadorId, item.id]);
                if (inv) await executar("UPDATE inventario_jogador SET quantidade=quantidade+1 WHERE id=?", [inv.id]);
                else await executar("INSERT INTO inventario_jogador(jogador_id,item_id,quantidade,equipado) VALUES(?,?,1,0)", [jogadorId, item.id]);
            }
        }
        const cristais = await CrystalRewardService.concederMissao(jogadorId, missao.id, Number(missao.recompensa_cristais || 0), JSON.stringify({ nome: missao.nome }));
        return { completa: true, recompensa: { xp: Number(missao.recompensa_xp || 0), won: Number(missao.recompensa_won || 0), item: item ? missao.recompensa_item : null, cristais: cristais.quantidade } };
    }

    static async listarMissoes(jogadorId, { incluirNaoOferecidas = false } = {}) {
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
                if (missao.status !== "disponivel" || !missao.origem_missao_id) return true;
                const vinculoSuficiente = (vinculos.get(missao.npc_id) || 0) >= (Number(missao.vinculo_necessario) || 0);
                // Vínculo só habilita a oferta. O jogador só vê e aceita após
                // o NPC oferecer a missão em uma cena.
                return vinculoSuficiente && (incluirNaoOferecidas || Boolean(missao.oferecida_em));
            });
        } catch (erro) {
            console.error("[QUEST] Erro ao listar/sincronizar missões de vínculo:", erro.message);
            throw erro;
        }
    }

    static async buscarMissaoPorNome(jogadorId, nome) {
        const normalizar = valor => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[*_`“”"]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
        const alvo = normalizar(nome);
        const matches = (await this.listarMissoes(jogadorId)).filter(m => normalizar(m.nome) === alvo || String(m.id) === alvo || normalizar(m.origem_missao_id) === alvo);
        if (matches.length > 1) throw new Error('Ha mais de uma missao com esse titulo. Use o ID indicado no catalogo.');
        return matches[0] || null;
    }

    static async aceitarMissao(jogadorId, nome) {
        const nomeInformado = String(nome || '').trim();
        let missao;
        if (nomeInformado) {
            missao = await this.buscarMissaoPorNome(jogadorId, nomeInformado);
        } else {
            const disponiveis = (await this.listarMissoes(jogadorId))
                .filter(item => item.status === 'disponivel');
            // Uma oferta feita pelo NPC tem prioridade. Assim, "!aceitar" aceita
            // exatamente o que acabou de ser oferecido, sem adivinhações.
            const oferecidas = disponiveis.filter(item => item.oferecida_em);
            const candidatas = oferecidas.length ? oferecidas : disponiveis;
            if (candidatas.length === 1) missao = candidatas[0];
            else if (candidatas.length > 1) {
                return { erro: `Há mais de uma missão disponível. Use *!aceitar missão <nome>*: ${candidatas.map(item => item.nome).join(', ')}.` };
            }
        }
        if (!missao) return { erro: "Missão não encontrada entre as suas missões disponíveis." };
        if (missao.status === "completa") return { erro: "Essa missão já foi concluída." };
        if (missao.status === "ativa") return { sucesso: true, jaAtiva: true, missao };
        if (missao.status !== "disponivel") return { erro: "Essa missão não está disponível para aceite." };
        if (missao.origem_missao_id && !missao.oferecida_em) {
            return { erro: "Converse primeiro com o NPC responsavel para que ele ofereca esta missao." };
        }
        if (missao.tipo === 'arco' && Number(missao.numero_missao) > 1) {
            const anterior = await buscar("SELECT status FROM missoes WHERE jogador_id=? AND npc_id=? AND numero_missao=?", [jogadorId, missao.npc_id, Number(missao.numero_missao)-1]);
            if (anterior?.status !== 'completa') return { erro: "Conclua o capítulo anterior antes de iniciar este arco." };
        }
        const result = await executar("UPDATE missoes SET status = 'ativa', oferecida_em = COALESCE(oferecida_em, ?) WHERE id = ? AND jogador_id=? AND status='disponivel'", [new Date().toISOString(), missao.id, jogadorId]);
        if (result.changes !== 1) return { erro: "A missão mudou de estado. Consulte suas missões novamente." };
        return { sucesso: true, missao: { ...missao, status: "ativa" } };
    }

    static async obterOfertaDeMissaoNPC(jogadorId, npcId) {
        // O NPC precisa enxergar as missões desbloqueadas para poder ofertá-las;
        // as consultas públicas continuam ocultando as que ainda não foram oferecidas.
        const missoes = await this.listarMissoes(jogadorId, { incluirNaoOferecidas: true });
        const missao = missoes.filter(m => canonicalId(m.npc_id) === canonicalId(npcId) && m.status === 'disponivel' && !m.oferecida_em)
            .sort((a,b) => Number(a.numero_missao)-Number(b.numero_missao))
            .find(m => m.tipo !== 'arco' || Number(m.numero_missao) === 1 || missoes.some(p => canonicalId(p.npc_id) === canonicalId(m.npc_id) && Number(p.numero_missao) === Number(m.numero_missao)-1 && p.status === 'completa'));
        if (!missao) return null;
        return missao;
    }

    static async confirmarOfertaDeMissaoNPC(jogadorId, npcId, missaoId) {
        await garantirMetadadosMissoes();
        const result = await executar(
            `UPDATE missoes SET oferecida_em=datetime('now')
             WHERE id=? AND jogador_id=? AND LOWER(npc_id)=LOWER(?)
               AND status='disponivel' AND oferecida_em IS NULL`,
            [missaoId, jogadorId, npcId]
        );
        return result.changes === 1;
    }

    static async listarReacoesPendentesNPC(jogadorId, npcId) {
        await garantirMetadadosMissoes();
        return listar(
            `SELECT * FROM missoes
             WHERE jogador_id=? AND LOWER(npc_id)=LOWER(?) AND status='completa'
               AND reacao_npc_pendente_em IS NOT NULL AND reacao_npc_entregue_em IS NULL
             ORDER BY reacao_npc_pendente_em ASC, id ASC`,
            [jogadorId, npcId]
        );
    }

    static async confirmarEntregaReacoesNPC(jogadorId, npcId, ids) {
        const validos = [...new Set((ids || []).map(Number).filter(Number.isSafeInteger))];
        if (!validos.length) return 0;
        await garantirMetadadosMissoes();
        const marcadores = validos.map(() => "?").join(",");
        const result = await executar(
            `UPDATE missoes SET reacao_npc_entregue_em=datetime('now')
             WHERE jogador_id=? AND LOWER(npc_id)=LOWER(?) AND status='completa'
               AND reacao_npc_pendente_em IS NOT NULL AND reacao_npc_entregue_em IS NULL
               AND id IN (${marcadores})`,
            [jogadorId, npcId, ...validos]
        );
        return result.changes || 0;
    }
}

QuestSystem.carregarMissoesNPC = carregarMissoesNPC;
QuestSystem.garantirMetadadosMissoes = garantirMetadadosMissoes;
module.exports = QuestSystem;
