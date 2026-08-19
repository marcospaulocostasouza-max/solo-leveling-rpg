const db = require("./database");
const { aplicarSistemaMaestria } = require("../tecnicas/sistemaMaestria");

const TECNICAS_INICIAIS = [
    "lutador", "assassino", "tanker", "ranger", "curador",
    "magoElemental", "magoInvocador", "magoBarreira", "magoMaldicao"
];

function run(sql, params = []) {
    return new Promise(resolve => db.run(sql, params, () => resolve()));
}

function coletarTecnicas(mod) {
    let tecnicas = [];
    if (!mod) return tecnicas;
    if (Array.isArray(mod)) return mod;
    if (mod.tecnicaInicial) tecnicas = tecnicas.concat(mod.tecnicaInicial);
    if (Array.isArray(mod.tecnicas)) tecnicas = tecnicas.concat(mod.tecnicas);
    if (mod.formas_jogo && !Array.isArray(mod.formas_jogo)) {
        Object.values(mod.formas_jogo).forEach(forma => {
            if (Array.isArray(forma.tecnicas)) tecnicas = tecnicas.concat(forma.tecnicas);
        });
    }
    return tecnicas.flat().filter(Boolean);
}

async function garantirColunasTecnicas() {
    for (const [nome, tipo] of [
        ["descricao_completa", "TEXT"],
        ["custo_qi", "INTEGER DEFAULT 0"],
        ["custo_qi_formatado", "TEXT"],
        ["custo_maestria", "INTEGER DEFAULT 0"],
        ["custo_maestria_formatado", "TEXT"],
        ["custo_mana_turno", "INTEGER DEFAULT 0"]
    ]) {
        await run(`ALTER TABLE tecnicas ADD COLUMN ${nome} ${tipo}`);
    }
}

function dadosTecnica(tecnica, classePadrao) {
    const custoMaestria = Number(tecnica.custo_maestria ?? tecnica.custo_qi ?? 0);
    return [
        tecnica.nome,
        tecnica.classe || classePadrao,
        tecnica.categoria || "Inicial",
        tecnica.tipo || "Fisica",
        tecnica.descricao || "",
        tecnica.descricao_completa || tecnica.descricao || "",
        tecnica.mana || tecnica.custo_mana || 0,
        tecnica.custo_qi || custoMaestria,
        tecnica.custo_qi_formatado || (custoMaestria ? `${custoMaestria} Qi` : ""),
        custoMaestria,
        tecnica.custo_maestria_formatado || (custoMaestria ? `${custoMaestria} de Maestria` : ""),
        tecnica.custo_mana_turno || 0,
        tecnica.cooldown || 0,
        tecnica.nivel_desbloqueio || 1,
        (tecnica.tipo === "Passiva" || tecnica.passiva) ? 1 : 0
    ];
}

async function inserirTecnica(tecnica, classePadrao) {
    await run(
        `INSERT OR IGNORE INTO tecnicas
        (nome, classe, categoria, tipo, descricao, descricao_completa, custo_mana,
         custo_qi, custo_qi_formatado, custo_maestria, custo_maestria_formatado,
         custo_mana_turno, cooldown, nivel_desbloqueio, passiva)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        dadosTecnica(tecnica, classePadrao)
    );
    await run(
        `UPDATE tecnicas SET
            classe = ?, categoria = ?, tipo = ?, descricao = ?, descricao_completa = ?,
            custo_mana = ?, custo_qi = ?, custo_qi_formatado = ?, custo_maestria = ?,
            custo_maestria_formatado = ?, custo_mana_turno = ?, cooldown = ?,
            nivel_desbloqueio = ?, passiva = ?
         WHERE nome = ?`,
        [
            ...dadosTecnica(tecnica, classePadrao).slice(1),
            tecnica.nome
        ]
    );
}

async function registrarTodasTecnicas() {
    console.log("[REGISTRO] Registrando sistemas no banco de dados...");
    await garantirColunasTecnicas();

    for (const classe of TECNICAS_INICIAIS) {
        try {
            const mod = require(`../tecnicas/iniciais/${classe}`);
            for (const tecnica of coletarTecnicas(mod)) {
                await inserirTecnica(tecnica, mod.nome || tecnica.classe || classe);
            }
        } catch (erro) {
            console.log(`[REGISTRO] Tecnicas iniciais ignoradas para ${classe}: ${erro.message}`);
        }
    }

    try {
        const tecnicasAvancadas = require("../tecnicas/avancadas/techniques");
        for (const [classeAvancada, tecnicas] of Object.entries(tecnicasAvancadas)) {
            if (!Array.isArray(tecnicas)) continue;
            for (const tecnica of tecnicas) await inserirTecnica({ ...tecnica, categoria: tecnica.categoria || "Avancada" }, classeAvancada);
        }
    } catch (erro) {
        console.log("[REGISTRO] Erro ao registrar tecnicas avancadas:", erro.message);
    }

    // Migra cadastros legados de armas para a categoria de Proficiência.
    // Isso evita que técnicas antigas continuem aparecendo como classes.
    const migracoesLegadas = {
        "Katana": "Katanas", "Foice": "Foices", "Kusarigama": "Correntes com Foice",
        "Pistola": "Pistolas", "Escopeta": "Escopetas", "Fuzil": "Fuzis",
        // A antiga "Proficiência em Arremessos" foi substituída por "Facas"
        "Arremesso": "Facas", "Arremessos": "Facas",
        // "Armas de Fogo" genérico foi separado em categorias específicas
        "Armas de Fogo": "Pistolas", "Arma de Fogo": "Pistolas"
    };
    for (const [classeAntiga, estiloNovo] of Object.entries(migracoesLegadas)) {
        await run(`UPDATE tecnicas SET classe = ?, categoria = 'Proficiencia' WHERE LOWER(classe) = LOWER(?)`, [estiloNovo, classeAntiga]);
    }

    // =====================================
    // REGISTRO DE TÉCNICAS DE ESTILOS DE LUTA
    // Cada estilo de luta possui seu arquivo em ../tecnicas/estilos/
    // As técnicas são registradas com categoria "Proficiencia"
    // e classe = nome do estilo (ex: "Adagas", "Espadas", "Kanabo")
    // Técnicas com nome vazio (moldes ainda não preenchidos) são ignoradas.
    // =====================================
    try {
        const { getTecnicasEstilo, listarEstilos } = require("../tecnicas/estilos");
        const estilosListados = listarEstilos();
        let totalTecnicas = 0;
        for (const estiloInfo of estilosListados) {
            const mod = getTecnicasEstilo(estiloInfo.chave);
            if (!mod) continue;
            for (const tecnica of coletarTecnicas(mod)) {
                if (!tecnica.nome || !String(tecnica.nome).trim()) continue;
                await inserirTecnica(
                    { ...tecnica, categoria: "Proficiencia", classe: mod.nome || estiloInfo.nome },
                    mod.nome || estiloInfo.nome
                );
                totalTecnicas++;
            }
        }
        console.log(`[REGISTRO] Tecnicas de estilos de luta registradas (${estilosListados.length} estilos, ${totalTecnicas} tecnicas).`);
    } catch (erro) {
        console.log("[REGISTRO] Erro ao registrar tecnicas de estilos de luta:", erro.message);
    }

    try {
        const estilos = require("../estilos/listaEstilos");
        if (Array.isArray(estilos)) {
            for (const estilo of estilos) {
                await run(
                    `INSERT OR IGNORE INTO estilos_luta
                    (nome, arma, descricao, tecnica_nome, descricao_tecnica, custo_mana, requisitos)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [estilo.nome, estilo.arma || "Nenhuma", estilo.descricao || "", estilo.tecnica || "", estilo.descricao_tecnica || "", estilo.custo_mana || 0, JSON.stringify(estilo.requisitos || [])]
                );
            }
        }
    } catch (erro) {
        console.log("[REGISTRO] Erro ao registrar estilos:", erro.message);
    }

    try {
        const elementos = require("../elementos/listaElementos");
        if (Array.isArray(elementos)) {
            for (const elemento of elementos) {
                await run(
                    `INSERT OR IGNORE INTO elementos
                    (nome, categoria, origem, raridade, sorteavel, bonus_afinidade, vantagens, bonus_vantagem)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [elemento.nome, elemento.categoria || "Elemental", elemento.origem || "Desconhecida", elemento.raridade || "Comum", elemento.sorteavel !== undefined ? elemento.sorteavel : 1, elemento.bonusAfinidade || 20, JSON.stringify(elemento.vantagens || []), elemento.bonusVantagem || 30]
                );
            }
        }
    } catch (erro) {
        console.log("[REGISTRO] Erro ao registrar elementos:", erro.message);
    }

    console.log("[REGISTRO] Sistemas registrados com sucesso.");
}

module.exports = { registrarTodasTecnicas, coletarTecnicas };
