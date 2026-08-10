/**
 * ADMIN CORE
 * 
 * Núcleo do sistema administrativo.
 * Fornece verificações de permissão, logs, e funções auxiliares.
 */

const db = require("./database");

// =====================================
// VERIFICAÇÃO DE ADMIN
// =====================================
function isAdmin(numero) {
    return new Promise((resolve) => {
        db.get(
            "SELECT * FROM administradores WHERE numero = ?",
            [numero],
            (err, admin) => {
                if (err || !admin) return resolve(false);
                resolve(true);
            }
        );
    });
}

function getAdminLevel(numero) {
    return new Promise((resolve) => {
        db.get(
            "SELECT nivel, nome FROM administradores WHERE numero = ?",
            [numero],
            (err, admin) => {
                if (err || !admin) return resolve({ nivel: 0, nome: "Nao encontrado" });
                resolve({ nivel: admin.nivel, nome: admin.nome });
            }
        );
    });
}

// =====================================
// SISTEMA DE LOGS ADMINISTRATIVOS
// =====================================
function registrarLog(adminNumero, adminNome, acao, alvo, detalhes, valorAntigo, valorNovo) {
    const data = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.run(
        `INSERT INTO admin_logs (admin_numero, admin_nome, acao, alvo, detalhes, valor_antigo, valor_novo, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [adminNumero, adminNome, acao, alvo, detalhes, 
         String(valorAntigo || ''), String(valorNovo || ''), data],
        (err) => {
            if (err) console.log("Erro ao registrar log admin:", err.message);
        }
    );
}

function getUltimosLogs(limite = 20) {
    return new Promise((resolve) => {
        db.all(
            "SELECT * FROM admin_logs ORDER BY data DESC LIMIT ?",
            [limite],
            (err, rows) => {
                if (err) return resolve([]);
                resolve(rows || []);
            }
        );
    });
}

function getLogsDoJogador(nomeJogador, limite = 10) {
    return new Promise((resolve) => {
        db.all(
            "SELECT * FROM admin_logs WHERE alvo = ? ORDER BY data DESC LIMIT ?",
            [nomeJogador, limite],
            (err, rows) => {
                if (err) return resolve([]);
                resolve(rows || []);
            }
        );
    });
}

// =====================================
// FUNÇÕES AUXILIARES
// =====================================

// Buscar jogador por nome
function buscarJogador(nome) {
    return new Promise((resolve) => {
        db.get(
            "SELECT * FROM jogadores WHERE LOWER(nome) = LOWER(?)",
            [nome],
            (err, jogador) => {
                if (err) return resolve(null);
                resolve(jogador || null);
            }
        );
    });
}

// Buscar jogador por like
function buscarJogadorLike(nome) {
    return new Promise((resolve) => {
        db.get(
            "SELECT * FROM jogadores WHERE LOWER(nome) LIKE LOWER(?)",
            [`%${nome}%`],
            (err, jogador) => {
                if (err) return resolve(null);
                resolve(jogador || null);
            }
        );
    });
}

// Recalcular totais do jogador
async function recalcularTotais(jogadorId) {
    return new Promise((resolve) => {
        db.get("SELECT * FROM jogadores WHERE id = ?", [jogadorId], (err, jogador) => {
            if (err || !jogador) return resolve(false);

            const forca_total = Number(jogador.forca_base || 0) + Number(jogador.forca_buff || 0);
            const resistencia_total = Number(jogador.resistencia_base || 0) + Number(jogador.resistencia_buff || 0);
            const velocidade_total = Number(jogador.velocidade_base || 0) + Number(jogador.velocidade_buff || 0);
            const sentidos_total = Number(jogador.sentidos_base || 0) + Number(jogador.sentidos_buff || 0);
            const inteligencia_total = Number(jogador.inteligencia_base || 0) + Number(jogador.inteligencia_buff || 0);
            const poder_magico_total = Number(jogador.poder_magico_base || 0) + Number(jogador.poder_magico_buff || 0);

            db.run(
                `UPDATE jogadores SET 
                 forca_total = ?, resistencia_total = ?, velocidade_total = ?,
                 sentidos_total = ?, inteligencia_total = ?, poder_magico_total = ?,
                 mana_maxima = ?, vida_maxima = ?
                 WHERE id = ?`,
                [
                    forca_total, resistencia_total, velocidade_total,
                    sentidos_total, inteligencia_total, poder_magico_total,
                    Math.max(100, poder_magico_total * 2),
                    Math.max(100, resistencia_total * 3),
                    jogadorId
                ],
                (error) => {
                    resolve(!error);
                }
            );
        });
    });
}

// Mensagem de acesso negado
function msgAcessoNegado() {
    return `═ *ACESSO NEGADO*
    
Voce nao possui permissao de administrador para usar este comando.
Se voce e um ADM, registre-se com !registrar adm`;
}

// Extrair valor e nome do jogador de um comando
function extrairValorENome(texto, prefixo) {
    // Remove o prefixo do comando
    let restante = texto.replace(prefixo, '').trim();
    
    // Extrair o valor numérico
    const match = restante.match(/^([+-]?\d+)/);
    if (!match) return { valor: null, nome: restante };
    
    const valor = parseInt(match[1]);
    const nome = restante.replace(match[1], '').trim();
    
    return { valor, nome };
}

module.exports = {
    isAdmin,
    getAdminLevel,
    registrarLog,
    getUltimosLogs,
    getLogsDoJogador,
    buscarJogador,
    buscarJogadorLike,
    recalcularTotais,
    msgAcessoNegado,
    extrairValorENome
};