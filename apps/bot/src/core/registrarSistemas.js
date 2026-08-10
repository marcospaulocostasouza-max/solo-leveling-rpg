/**
 * REGISTRADOR DE SISTEMAS
 * 
 * Registra todas as técnicas, estilos e elementos no banco de dados
 * para garantir que estejam disponíveis para consulta.
 */

const db = require("./database");

function registrarTodasTecnicas() {
    console.log("═ Registrando sistemas no banco de dados...");
    
    // Registrar técnicas iniciais
    try {
        const classes = [
            "lutador", "assassino", "tanker", "ranger", "curador",
            "magoElemental", "magoInvocador", "magoBarreira", "magoMaldicao"
        ];
        
        classes.forEach(classe => {
            try {
                const mod = require(`../tecnicas/iniciais/${classe}`);
                let tecnicasArray = [];
                
                if (Array.isArray(mod)) {
                    tecnicasArray = mod;
                } else if (mod && mod.nome) {
                    // Caso tenha tecnicaInicial como objeto único
                    if (mod.tecnicaInicial && !Array.isArray(mod.tecnicaInicial)) {
                        tecnicasArray.push(mod.tecnicaInicial);
                    }
                    // Caso tenha tecnicaInicial como array
                    if (mod.tecnicaInicial && Array.isArray(mod.tecnicaInicial)) {
                        tecnicasArray = tecnicasArray.concat(mod.tecnicaInicial);
                    }
                    // Técnicas adicionais
                    if (mod.tecnicas && Array.isArray(mod.tecnicas)) {
                        tecnicasArray = tecnicasArray.concat(mod.tecnicas);
                    }
                }
                
                tecnicasArray.forEach(tecnica => {
                    if (tecnica && tecnica.nome) {
                        db.run(
                            `INSERT OR IGNORE INTO tecnicas 
                            (nome, classe, categoria, tipo, descricao, custo_mana, cooldown, nivel_desbloqueio, passiva) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                tecnica.nome,
                                mod.nome || tecnica.classe || classe,
                                tecnica.categoria || "Inicial",
                                tecnica.tipo || "Física",
                                tecnica.descricao || "",
                                tecnica.mana || tecnica.custo_mana || 0,
                                tecnica.cooldown || 0,
                                tecnica.nivel_desbloqueio || 1,
                                (tecnica.tipo === "Passiva" || tecnica.passiva) ? 1 : 0
                            ]
                        );
                    }
                });
            } catch (erro) {
                // Técnicas podem não existir ainda, ignorar
            }
        });
        
        // Registrar técnicas avançadas
        try {
            const tecnicasAvancadas = require("../tecnicas/avancadas/techniques");
            for (const [classeAvancada, tecnicas] of Object.entries(tecnicasAvancadas)) {
                if (Array.isArray(tecnicas)) {
                    tecnicas.forEach(tecnica => {
                        db.run(
                            `INSERT OR IGNORE INTO tecnicas 
                            (nome, classe, categoria, tipo, descricao, custo_mana, cooldown, nivel_desbloqueio, passiva) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                tecnica.nome,
                                classeAvancada,
                                tecnica.categoria || "Avancada",
                                tecnica.tipo || "Física",
                                tecnica.descricao || "",
                                tecnica.custo_mana || 0,
                                tecnica.cooldown || 0,
                                tecnica.nivel_desbloqueio || 40,
                                0
                            ]
                        );
                    });
                }
            }
            console.log("═ Técnicas avançadas registradas com sucesso!");
        } catch (erro) {
            console.log("═ Erro ao registrar técnicas avançadas:", erro.message);
        }
        
        console.log("═ Técnicas registradas com sucesso!");
    } catch (erro) {
        console.log("═ Erro ao registrar técnicas:", erro.message);
    }
    
    // Registrar estilos de luta
    try {
        const estilos = require("../estilos/listaEstilos");
        if (Array.isArray(estilos)) {
            estilos.forEach(estilo => {
                db.run(
                    `INSERT OR IGNORE INTO estilos_luta 
                    (nome, arma, descricao, tecnica_nome, descricao_tecnica, custo_mana, requisitos) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        estilo.nome,
                        estilo.arma || "Nenhuma",
                        estilo.descricao || "",
                        estilo.tecnica || "",
                        estilo.descricao_tecnica || "",
                        estilo.custo_mana || 0,
                        JSON.stringify(estilo.requisitos || [])
                    ]
                );
            });
            console.log("═ Estilos de luta registrados com sucesso!");
        }
    } catch (erro) {
        console.log("═ Erro ao registrar estilos:", erro.message);
    }
    
    // Registrar elementos
    try {
        const elementos = require("../elementos/listaElementos");
        if (Array.isArray(elementos)) {
            elementos.forEach(elemento => {
                db.run(
                    `INSERT OR IGNORE INTO elementos 
                    (nome, categoria, origem, raridade, sorteavel, bonus_afinidade, vantagens, bonus_vantagem) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        elemento.nome,
                        elemento.categoria || "Elemental",
                        elemento.origem || "Desconhecida",
                        elemento.raridade || "Comum",
                        elemento.sorteavel !== undefined ? elemento.sorteavel : 1,
                        elemento.bonusAfinidade || 20,
                        JSON.stringify(elemento.vantagens || []),
                        elemento.bonusVantagem || 30
                    ]
                );
            });
            console.log("═ Elementos registrados com sucesso!");
        }
    } catch (erro) {
        console.log("═ Erro ao registrar elementos:", erro.message);
    }
}

module.exports = { registrarTodasTecnicas };