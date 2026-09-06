"use strict";

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { provider } = require("../packages/database/config");
const { getPool, close } = require("../packages/database/postgres");
const AtributoSystem = require("../apps/bot/src/systems/atributoSystem");

const MIGRATION = "20260906_remove_legacy_initial_class_buffs";
const ATRIBUTOS = ["forca", "resistencia", "velocidade", "sentidos", "inteligencia", "poder_magico"];

// Valores que a versão antiga gravava em *_buff na aprovação da ficha.
const BONUS_FIXO_LEGADO = {
    "Lutador": { forca: 5, resistencia: 3, velocidade: 2, sentidos: 1, inteligencia: 0, poder_magico: 0 },
    "Assassino": { forca: 2, resistencia: 1, velocidade: 5, sentidos: 3, inteligencia: 1, poder_magico: 0 },
    "Tanker": { forca: 3, resistencia: 5, velocidade: 0, sentidos: 1, inteligencia: 1, poder_magico: 2 },
    "Ranger": { forca: 2, resistencia: 1, velocidade: 4, sentidos: 4, inteligencia: 2, poder_magico: 0 },
    "Ranger Físico": { forca: 5, resistencia: 1, velocidade: 4, sentidos: 4, inteligencia: 0, poder_magico: 0 },
    "Ranger Mágico": { forca: 0, resistencia: 1, velocidade: 4, sentidos: 4, inteligencia: 2, poder_magico: 5 },
    "Curador": { forca: 0, resistencia: 1, velocidade: 2, sentidos: 2, inteligencia: 4, poder_magico: 5 },
    "Mago Elemental": { forca: 0, resistencia: 1, velocidade: 1, sentidos: 2, inteligencia: 4, poder_magico: 6 },
    "Mago Invocador": { forca: 0, resistencia: 1, velocidade: 2, sentidos: 3, inteligencia: 5, poder_magico: 4 },
    "Mago de Barreira": { forca: 1, resistencia: 4, velocidade: 1, sentidos: 2, inteligencia: 4, poder_magico: 4 },
    "Mago Barreira": { forca: 1, resistencia: 4, velocidade: 1, sentidos: 2, inteligencia: 4, poder_magico: 4 },
    "Mago de Maldicao": { forca: 0, resistencia: 2, velocidade: 2, sentidos: 3, inteligencia: 5, poder_magico: 4 },
    "Mago de Maldição": { forca: 0, resistencia: 2, velocidade: 2, sentidos: 3, inteligencia: 5, poder_magico: 4 }
};

function temBonusLegado(jogador, bonus) {
    return ATRIBUTOS.every(atributo => Number(jogador[`${atributo}_buff`] || 0) >= Number(bonus[atributo] || 0));
}

async function main() {
    if (provider !== "postgres") throw new Error("Esta migração deve rodar no PostgreSQL configurado pelo bot.");

    const client = await getPool().connect();
    let resultado;
    try {
        await client.query("BEGIN");
        await client.query(`CREATE TABLE IF NOT EXISTS system_migrations (
            nome TEXT PRIMARY KEY,
            aplicado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            detalhes JSONB NOT NULL DEFAULT '{}'::jsonb
        )`);
        const jaAplicada = await client.query("SELECT nome FROM system_migrations WHERE nome = $1", [MIGRATION]);
        if (jaAplicada.rowCount) {
            await client.query("COMMIT");
            resultado = { jaAplicada: true, jogadores: [] };
        } else {

        const consulta = await client.query(`SELECT id, nome, classe, classe_avancada,
            forca_buff, resistencia_buff, velocidade_buff, sentidos_buff, inteligencia_buff, poder_magico_buff
            FROM jogadores FOR UPDATE`);
        const jogadores = consulta.rows.filter(jogador => {
            const bonus = BONUS_FIXO_LEGADO[jogador.classe];
            const semClasseAvancada = !jogador.classe_avancada || jogador.classe_avancada === "Nenhuma" || jogador.classe_avancada === "BLOQUEADO";
            return semClasseAvancada && bonus && temBonusLegado(jogador, bonus);
        });

        for (const jogador of jogadores) {
            const bonus = BONUS_FIXO_LEGADO[jogador.classe];
            const novos = ATRIBUTOS.map(atributo => Number(jogador[`${atributo}_buff`] || 0) - Number(bonus[atributo] || 0));
            await client.query(`UPDATE jogadores SET
                forca_buff = $1, resistencia_buff = $2, velocidade_buff = $3,
                sentidos_buff = $4, inteligencia_buff = $5, poder_magico_buff = $6
                WHERE id = $7`, [...novos, jogador.id]);
        }

        await client.query("INSERT INTO system_migrations (nome, detalhes) VALUES ($1, $2::jsonb)", [
            MIGRATION,
            JSON.stringify({ jogadores_afetados: jogadores.map(j => ({ id: j.id, nome: j.nome, classe: j.classe })) })
        ]);
        await client.query("COMMIT");
        resultado = { jaAplicada: false, jogadores };
        }
    } catch (erro) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw erro;
    } finally {
        client.release();
    }

    if (resultado.jaAplicada) {
        console.log("[MIGRATION] Já aplicada anteriormente; nenhuma alteração realizada.");
        return;
    }

    const falhas = [];
    for (const jogador of resultado.jogadores) {
        const recalculado = await AtributoSystem.recalcularAtributos(jogador.id);
        if (!recalculado) falhas.push(jogador.nome);
    }
    if (falhas.length) throw new Error(`Bônus removidos, mas falhou o recálculo de: ${falhas.join(", ")}`);
    console.log(`[MIGRATION] ${resultado.jogadores.length} jogador(es) corrigido(s) e recalculado(s).`);
}

main().catch(erro => {
    console.error(`[MIGRATION] ${erro.message}`);
    process.exitCode = 1;
}).finally(close);
