/**
 * ADMIN CORE
 * 
 * Núcleo do sistema administrativo.
 * Fornece verificações de permissão, logs, e funções auxiliares.
 */

const db = require("./database");
const AtributoSystem = require("../systems/atributoSystem");

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
    return AtributoSystem.recalcularAtributos(jogadorId);
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
