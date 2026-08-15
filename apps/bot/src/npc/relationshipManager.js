/**
 * RELATIONSHIP MANAGER
 *
 * Gerencia o relacionamento entre cada NPC e cada jogador usando o
 * sistema consolidado de VÍNCULO / HOSTILIDADE (0% a 100%).
 *
 * ATUALIZAÇÃO (Sistema Vínculo/Hostilidade):
 * Os antigos campos separados (confianca, respeito, amizade, admiracao,
 * carinho, desconfianca, medo) foram substituídos por apenas dois
 * valores públicos, usados como base para TODAS as comparações do
 * sistema (missões, diálogos, combate, ataques secretos, romances etc):
 *
 *   - vinculo (0-100%): sentimentos positivos entre o NPC e o jogador.
 *   - hostilidade (0-100%): sentimentos negativos entre o NPC e o jogador.
 *
 * Um jogador PODE ter vínculo e hostilidade ao mesmo tempo com o mesmo
 * NPC (sentimentos conflitantes), mas os dois se "empurram" um pouco:
 *   - Quando o vínculo sobe, a hostilidade tende a descer um pouco.
 *   - Quando a hostilidade sobe, o vínculo tende a descer um pouco.
 * Isso é feito através de um "efeito de sangria" (bleed), configurável
 * em FATOR_SANGRIA.
 *
 * As colunas antigas são mantidas na tabela (não são apagadas) apenas
 * por compatibilidade com dados já gravados — nenhum código novo deve
 * usá-las. Se a tabela já existir de uma versão anterior, as colunas
 * novas são adicionadas automaticamente via ALTER TABLE.
 *
 * Este módulo NÃO usa IA. Quem decide QUANTO o vínculo/hostilidade
 * muda em uma cena é o relationshipEngine.js (que usa IA). Este módulo
 * apenas aplica, persiste e consulta os valores.
 */

const db = require("../core/database");
const { provider } = require("../../../../packages/database/config");

// Quanto da subida de um lado "corrói" o outro lado (0 a 1).
// Ex: 0.3 = 30% do ganho de vínculo é descontado da hostilidade.
const FATOR_SANGRIA = 0.3;

// A partir de qual porcentagem de vínculo o NPC deixa de tratar o
// jogador com indiferença e libera a "missão de aproximação".
const LIMIAR_VINCULO_INICIAL = 10;

// A partir de qual porcentagem de hostilidade o NPC passa a
// considerar o jogador uma ameaça/alvo (usado por outros sistemas,
// ex: combate e ataques secretos de NPC).
const LIMIAR_HOSTILIDADE_ALERTA = 10;

// =====================================
// CRIAÇÃO / MIGRAÇÃO DA TABELA
// =====================================

function colunaExiste(tabela, coluna) {
    return new Promise((resolve) => {
        const sql = provider === "postgres"
            ? "SELECT column_name AS name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ?"
            : `PRAGMA table_info(${tabela})`;
        const params = provider === "postgres" ? [tabela] : [];
        db.all(sql, params, (err, rows) => {
            if (err || !rows) return resolve(false);
            resolve(rows.some((r) => r.name === coluna));
        });
    });
}

async function garantirColuna(tabela, coluna, definicao) {
    const existe = await colunaExiste(tabela, coluna);
    if (!existe) {
        await new Promise((resolve) => {
            db.run(`ALTER TABLE ${tabela} ADD COLUMN "${coluna}" ${definicao}`, (err) => {
                if (err) {
                    console.error(`[RELATIONSHIP] Erro ao adicionar coluna ${coluna}:`, err.message);
                } else {
                    console.log(`[RELATIONSHIP] Coluna ${coluna} adicionada em ${tabela}.`);
                }
                resolve();
            });
        });
    }
}

function criarTabela() {
    const colunaId = provider === "postgres" ? "BIGSERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT";
    return new Promise((resolve) => db.run(
        `
        CREATE TABLE IF NOT EXISTS npc_relationships (
            id ${colunaId},
            "npcId" TEXT NOT NULL,
            "jogadorId" TEXT NOT NULL,
            vinculo INTEGER DEFAULT 0,
            hostilidade INTEGER DEFAULT 0,
            "missaoDesbloqueada" INTEGER DEFAULT 0,
            "avisoIndiferencaSuperado" INTEGER DEFAULT 0,
            confianca INTEGER DEFAULT 0,
            respeito INTEGER DEFAULT 0,
            amizade INTEGER DEFAULT 0,
            admiracao INTEGER DEFAULT 0,
            carinho INTEGER DEFAULT 0,
            desconfianca INTEGER DEFAULT 0,
            medo INTEGER DEFAULT 0,
            "ultimaAtualizacao" TEXT DEFAULT (datetime('now')),
            UNIQUE("npcId", "jogadorId")
        )
        `,
        async (err) => {
            if (err) {
                console.error("[RELATIONSHIP] Erro ao criar tabela:", err.message);
                resolve();
                return;
            }
            // Migração: garante as colunas novas em bancos já existentes
            // (criados antes desta versão, que só tinham os 7 campos antigos).
            await garantirColuna("npc_relationships", "vinculo", "INTEGER DEFAULT 0");
            await garantirColuna("npc_relationships", "hostilidade", "INTEGER DEFAULT 0");
            await garantirColuna("npc_relationships", "missaoDesbloqueada", "INTEGER DEFAULT 0");
            await garantirColuna("npc_relationships", "avisoIndiferencaSuperado", "INTEGER DEFAULT 0");
            resolve();
        }
    ));
}

const tabelaPronta = criarTabela();

async function garantirTabela() {
    await tabelaPronta;
}

// =====================================
// HELPERS
// =====================================

function clamp(valor) {
    const v = parseInt(valor);
    if (isNaN(v)) return 0;
    return Math.max(0, Math.min(100, v));
}

// =====================================
// FUNÇÕES DE GERENCIAMENTO
// =====================================

/**
 * Obtém o relacionamento entre um NPC e um jogador.
 * Se não existir, retorna null.
 */
function obterRelacionamento(npcId, jogadorId) {
    return new Promise((resolve) => {
        db.get(
            `SELECT * FROM npc_relationships WHERE "npcId" = ? AND "jogadorId" = ?`,
            [npcId, jogadorId],
            (err, row) => {
                if (err) {
                    console.error("[RELATIONSHIP] Erro ao obter relacionamento:", err.message);
                    resolve(null);
                } else {
                    resolve(row || null);
                }
            }
        );
    });
}

/**
 * Cria um novo relacionamento (vínculo e hostilidade começam em 0%).
 */
function criarRelacionamento(npcId, jogadorId) {
    return new Promise((resolve) => {
        if (!npcId || !jogadorId) {
            resolve(null);
            return;
        }

        db.run(
            `INSERT OR IGNORE INTO npc_relationships ("npcId", "jogadorId", vinculo, hostilidade, "ultimaAtualizacao")
             VALUES (?, ?, 0, 0, datetime('now'))`,
            [npcId, jogadorId],
            async (err) => {
                if (err) {
                    console.error("[RELATIONSHIP] Erro ao criar relacionamento:", err.message);
                    resolve(null);
                } else {
                    resolve(await obterRelacionamento(npcId, jogadorId));
                }
            }
        );
    });
}

/**
 * Garante que o relacionamento existe, criando se necessário.
 */
async function obterOuCriar(npcId, jogadorId) {
    let rel = await obterRelacionamento(npcId, jogadorId);
    if (!rel) {
        rel = await criarRelacionamento(npcId, jogadorId);
    }
    return rel;
}

/**
 * Aplica o resultado de UMA cena/interação ao relacionamento.
 *
 * Esta é a função central do sistema Vínculo/Hostilidade. Ela recebe
 * quanto o vínculo e/ou a hostilidade devem mudar (em pontos
 * percentuais, positivos ou negativos) e aplica a "sangria" mútua
 * entre os dois valores antes de salvar.
 *
 * @param {string} npcId
 * @param {string} jogadorId
 * @param {number} deltaVinculo - variação de vínculo (ex: 4, -2)
 * @param {number} deltaHostilidade - variação de hostilidade (ex: 3, -1)
 * @returns {Promise<{
 *   relacionamento: Object,
 *   vinculoAntes: number, vinculoDepois: number, vinculoGanho: number,
 *   hostilidadeAntes: number, hostilidadeDepois: number, hostilidadeGanho: number,
 *   cruzouLimiarInicial: boolean
 * }|null>}
 */
async function aplicarResultadoDeCena(npcId, jogadorId, deltaVinculo = 0, deltaHostilidade = 0) {
    const relAtual = await obterOuCriar(npcId, jogadorId);
    if (!relAtual) return null;

    const vinculoAntes = clamp(relAtual.vinculo);
    const hostilidadeAntes = clamp(relAtual.hostilidade);

    let vinculoNovo = vinculoAntes + (parseInt(deltaVinculo) || 0);
    let hostilidadeNova = hostilidadeAntes + (parseInt(deltaHostilidade) || 0);

    // Efeito de sangria: o lado que subiu corrói uma fração do lado oposto.
    const subidaVinculo = Math.max(0, vinculoNovo - vinculoAntes);
    const subidaHostilidade = Math.max(0, hostilidadeNova - hostilidadeAntes);

    if (subidaVinculo > 0) {
        hostilidadeNova -= Math.round(subidaVinculo * FATOR_SANGRIA);
    }
    if (subidaHostilidade > 0) {
        vinculoNovo -= Math.round(subidaHostilidade * FATOR_SANGRIA);
    }

    vinculoNovo = clamp(vinculoNovo);
    hostilidadeNova = clamp(hostilidadeNova);

    const cruzouLimiarInicial = vinculoAntes < LIMIAR_VINCULO_INICIAL && vinculoNovo >= LIMIAR_VINCULO_INICIAL;

    const relacionamento = await new Promise((resolve) => {
        db.run(
            `UPDATE npc_relationships
             SET vinculo = ?, hostilidade = ?, "ultimaAtualizacao" = datetime('now')
             WHERE "npcId" = ? AND "jogadorId" = ?`,
            [vinculoNovo, hostilidadeNova, npcId, jogadorId],
            async (err) => {
                if (err) {
                    console.error("[RELATIONSHIP] Erro ao aplicar resultado de cena:", err.message);
                    resolve(relAtual);
                } else {
                    resolve(await obterRelacionamento(npcId, jogadorId));
                }
            }
        );
    });

    return {
        relacionamento,
        vinculoAntes,
        vinculoDepois: vinculoNovo,
        vinculoGanho: vinculoNovo - vinculoAntes,
        hostilidadeAntes,
        hostilidadeDepois: hostilidadeNova,
        hostilidadeGanho: hostilidadeNova - hostilidadeAntes,
        cruzouLimiarInicial
    };
}

/**
 * Marca que a "missão de aproximação" (liberada aos 10% de vínculo)
 * já foi oferecida/desbloqueada para este NPC+jogador, para não
 * repetir o aviso a cada interação.
 */
function marcarMissaoDesbloqueada(npcId, jogadorId) {
    return new Promise((resolve) => {
        db.run(
            `UPDATE npc_relationships SET "missaoDesbloqueada" = 1 WHERE "npcId" = ? AND "jogadorId" = ?`,
            [npcId, jogadorId],
            (err) => resolve(!err)
        );
    });
}

/**
 * Reseta vínculo e hostilidade para 0%.
 */
function resetar(npcId, jogadorId) {
    return new Promise((resolve) => {
        db.run(
            `UPDATE npc_relationships
             SET vinculo = 0, hostilidade = 0, "missaoDesbloqueada" = 0, "avisoIndiferencaSuperado" = 0,
                 "ultimaAtualizacao" = datetime('now')
             WHERE "npcId" = ? AND "jogadorId" = ?`,
            [npcId, jogadorId],
            async (err) => {
                if (err) {
                    console.error("[RELATIONSHIP] Erro ao resetar relacionamento:", err.message);
                    resolve(null);
                } else {
                    resolve(await obterRelacionamento(npcId, jogadorId));
                }
            }
        );
    });
}

/**
 * Lista todos os relacionamentos de um NPC (ordenado por vínculo).
 */
function listar(npcId) {
    return new Promise((resolve) => {
        db.all(
            `SELECT * FROM npc_relationships WHERE "npcId" = ? ORDER BY vinculo DESC`,
            [npcId],
            (err, rows) => {
                if (err) {
                    console.error("[RELATIONSHIP] Erro ao listar relacionamentos:", err.message);
                    resolve([]);
                } else {
                    resolve(rows || []);
                }
            }
        );
    });
}

/**
 * Ajuda outros sistemas (combate, ataques secretos, diálogos, etc) a
 * interpretar rapidamente o estado emocional do NPC em relação ao
 * jogador, sem cada sistema precisar reimplementar os limiares.
 */
function classificarRelacao(relacionamento) {
    const vinculo = relacionamento ? clamp(relacionamento.vinculo) : 0;
    const hostilidade = relacionamento ? clamp(relacionamento.hostilidade) : 0;

    return {
        vinculo,
        hostilidade,
        indiferente: vinculo < LIMIAR_VINCULO_INICIAL && hostilidade < LIMIAR_HOSTILIDADE_ALERTA,
        proximo: vinculo >= LIMIAR_VINCULO_INICIAL,
        hostil: hostilidade >= LIMIAR_HOSTILIDADE_ALERTA,
        // Sentimento dominante (para textos/diálogos e decisões de IA)
        dominante: vinculo === hostilidade ? "neutro" : vinculo > hostilidade ? "vinculo" : "hostilidade"
    };
}

module.exports = {
    LIMIAR_VINCULO_INICIAL,
    LIMIAR_HOSTILIDADE_ALERTA,
    obterRelacionamento,
    criarRelacionamento,
    obterOuCriar,
    aplicarResultadoDeCena,
    marcarMissaoDesbloqueada,
    resetar,
    listar,
    classificarRelacao
    , garantirTabela
};
