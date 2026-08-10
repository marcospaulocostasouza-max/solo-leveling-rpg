const db = require("../core/database");

class ArenaSystem {
    static run(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) return reject(err);
                resolve(this);
            });
        });
    }

    static all(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    static get(sql, params = []) {
        return new Promise((resolve) => {
            db.get(sql, params, (err, row) => {
                if (err) return resolve(null);
                resolve(row);
            });
        });
    }

    static async getConfig(chave) {
        const row = await this.get("SELECT valor FROM configuracoes WHERE chave = ?", [chave]);
        return row ? row.valor : null;
    }

    static async setConfig(chave, valor) {
        await this.run("INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)", [chave, valor]);
        return true;
    }

    static async getCicloInicio() {
        let valor = await this.getConfig("mvp_ciclo_inicio");
        if (!valor) {
            valor = new Date().toISOString();
            await this.setConfig("mvp_ciclo_inicio", valor);
        }
        return valor;
    }

    static async resetCiclo() {
        const agora = new Date().toISOString();
        await this.setConfig("mvp_ciclo_inicio", agora);
        await this.run("UPDATE jogadores SET arena_vitorias = 0, arena_derrotas = 0, arena_batalhas = 0");
        return agora;
    }

    static async registrarResultado(jogadorId, inimigoNome, resultado, turnoFinal = 0, dataInicio = null, dataFim = null) {
        if (!jogadorId) {
            return { erro: "Jogador inválido." };
        }

        const resultadoNormalizado = resultado === "vitoria" ? "vitoria" : "derrota";
        const coluna = resultadoNormalizado === "vitoria" ? "arena_vitorias" : "arena_derrotas";

        await this.run(`UPDATE jogadores SET ${coluna} = ${coluna} + 1, arena_batalhas = arena_batalhas + 1 WHERE id = ?`, [jogadorId]);

        const inicio = dataInicio || new Date().toISOString();
        const fim = dataFim || new Date().toISOString();

        await this.run(
            `INSERT INTO arena_historico (jogador_id, inimigo_nome, tipo, resultado, turno_final, data_inicio, data_fim)
             VALUES (?, ?, 'arena', ?, ?, ?, ?)`,
            [jogadorId, inimigoNome || "Oponente desconhecido", resultadoNormalizado, turnoFinal, inicio, fim]
        );

        return {
            sucesso: true,
            jogadorId,
            inimigoNome: inimigoNome || "Oponente desconhecido",
            resultado: resultadoNormalizado,
            turnoFinal
        };
    }

    static async getMvpCandidates(limit = 5) {
        const sql = `
            SELECT j.*,
                CASE WHEN j.arena_batalhas = 0 THEN 0 ELSE CAST(j.arena_vitorias AS REAL) / j.arena_batalhas END AS taxa_sucesso,
                IFNULL((
                    SELECT COUNT(DISTINCT inimigo_nome)
                    FROM arena_historico
                    WHERE jogador_id = j.id AND resultado = 'vitoria'
                ), 0) AS oponentes_vencidos
            FROM jogadores j
            WHERE j.ficha_aprovada = 1 AND j.arena_batalhas > 0
            ORDER BY taxa_sucesso DESC,
                     j.arena_vitorias DESC,
                     j.arena_derrotas ASC,
                     oponentes_vencidos DESC,
                     j.arena_batalhas DESC
            LIMIT ?
        `;

        return await this.all(sql, [limit]);
    }

    static async getMvpAtual() {
        const candidatos = await this.getMvpCandidates(1);
        return candidatos && candidatos.length > 0 ? candidatos[0] : null;
    }
}

module.exports = ArenaSystem;
