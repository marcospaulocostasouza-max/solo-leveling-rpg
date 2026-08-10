/**
 * Sistemas narrativos/persistentes de classes avancadas.
 *
 * Esta camada NAO executa combate: nao causa dano, nao gasta mana, nao
 * aplica atributos e nao usa tecnicas. Ela apenas guarda estados que ja
 * existem nas descricoes das classes e cria registros para aprovacao do ADM.
 */
const db = require("../core/database");

const ELEMENTOS_SOBERANOS = ["fogo", "agua", "terra", "eletricidade", "planta", "gelo", "vento"];
const SENTIDOS_NAGUMO = { C: 20, B: 30, A: 50, S: 100 };

const normalizar = (valor = "") => String(valor)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

const executar = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (erro) {
        if (erro) reject(erro);
        else resolve({ id: this.lastID, alteracoes: this.changes });
    });
});
const obter = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (erro, linha) => erro ? reject(erro) : resolve(linha || null));
});
const listar = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (erro, linhas) => erro ? reject(erro) : resolve(linhas || []));
});

let tabelasProntas;
function garantirTabelas() {
    if (tabelasProntas) return tabelasProntas;
    tabelasProntas = (async () => {
        await executar(`CREATE TABLE IF NOT EXISTS hrymir_instrumentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT, jogador_id INTEGER NOT NULL,
            nome_humano TEXT NOT NULL, nome_recipiente TEXT NOT NULL,
            tipo_recipiente TEXT NOT NULL, origem TEXT NOT NULL DEFAULT 'ritual',
            estado TEXT NOT NULL DEFAULT 'selado', blessed INTEGER NOT NULL DEFAULT 0,
            forma_vessel TEXT, dados TEXT, criado_em TEXT DEFAULT (datetime('now')),
            atualizado_em TEXT DEFAULT (datetime('now')),
            UNIQUE(jogador_id, nome_humano), UNIQUE(jogador_id, nome_recipiente)
        )`);
        await executar(`CREATE TABLE IF NOT EXISTS hrymir_templos (
            id INTEGER PRIMARY KEY AUTOINCREMENT, jogador_id INTEGER NOT NULL UNIQUE,
            nome TEXT NOT NULL, localizacao TEXT, instrumentos_guardados INTEGER NOT NULL DEFAULT 0,
            testemunhas_registradas INTEGER NOT NULL DEFAULT 0, dados TEXT,
            criado_em TEXT DEFAULT (datetime('now')), atualizado_em TEXT DEFAULT (datetime('now'))
        )`);
        await executar(`CREATE TABLE IF NOT EXISTS freyr_majins (
            id INTEGER PRIMARY KEY AUTOINCREMENT, jogador_id INTEGER NOT NULL,
            nome_majin TEXT NOT NULL, metal_vessel TEXT NOT NULL, elemento TEXT,
            metodo TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'em_processo',
            cenas_confirmadas INTEGER NOT NULL DEFAULT 0, dados TEXT,
            criado_em TEXT DEFAULT (datetime('now')), atualizado_em TEXT DEFAULT (datetime('now')),
            UNIQUE(jogador_id, nome_majin), UNIQUE(jogador_id, metal_vessel)
        )`);
        await executar(`CREATE TABLE IF NOT EXISTS taoista_nagumo_registros (
            id INTEGER PRIMARY KEY AUTOINCREMENT, jogador_id INTEGER NOT NULL,
            rank_desejado TEXT NOT NULL, sentidos_base INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pendente_adm', encontro_monarca TEXT DEFAULT 'nao_sorteado',
            observacao TEXT, criado_em TEXT DEFAULT (datetime('now'))
        )`);
        await executar(`CREATE TABLE IF NOT EXISTS alquimista_pedras_boss (
            id INTEGER PRIMARY KEY AUTOINCREMENT, jogador_id INTEGER NOT NULL,
            rank_boss TEXT NOT NULL, origem TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'disponivel',
            aprovado_por TEXT, criado_em TEXT DEFAULT (datetime('now'))
        )`);
        await executar(`CREATE TABLE IF NOT EXISTS alquimista_pedras_filosofais (
            id INTEGER PRIMARY KEY AUTOINCREMENT, jogador_id INTEGER NOT NULL,
            rank_origem TEXT NOT NULL, quantidade_pedras INTEGER NOT NULL DEFAULT 5,
            status TEXT NOT NULL DEFAULT 'criada', dados TEXT,
            criada_em TEXT DEFAULT (datetime('now'))
        )`);
        await executar(`CREATE TABLE IF NOT EXISTS runas_globais (
            id INTEGER PRIMARY KEY AUTOINCREMENT, dono_id INTEGER NOT NULL, nome_boss TEXT NOT NULL,
            rank_boss TEXT NOT NULL, origem_narrada TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'disponivel',
            usada_por INTEGER, dados TEXT, criada_em TEXT DEFAULT (datetime('now')), usada_em TEXT
        )`);
        await executar(`CREATE TABLE IF NOT EXISTS arcanista_encantamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT, jogador_id INTEGER NOT NULL, item_id INTEGER NOT NULL,
            materiais TEXT, efeito_proposto TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pendente_adm',
            aprovado_por TEXT, criado_em TEXT DEFAULT (datetime('now')), atualizado_em TEXT DEFAULT (datetime('now'))
        )`);
        await executar(`CREATE TABLE IF NOT EXISTS arcanista_runas (
            id INTEGER PRIMARY KEY AUTOINCREMENT, criador_id INTEGER NOT NULL, tecnica_id INTEGER NOT NULL,
            nome TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'criada', dados TEXT,
            criada_em TEXT DEFAULT (datetime('now')), UNIQUE(criador_id, nome)
        )`);
        await executar(`CREATE TABLE IF NOT EXISTS oraculo_equipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT, oraculo_id INTEGER NOT NULL UNIQUE,
            nome TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ativa', criado_em TEXT DEFAULT (datetime('now'))
        )`);
        await executar(`CREATE TABLE IF NOT EXISTS oraculo_equipe_membros (
            equipe_id INTEGER NOT NULL, jogador_id INTEGER NOT NULL,
            PRIMARY KEY (equipe_id, jogador_id)
        )`);
        await executar(`CREATE TABLE IF NOT EXISTS taumaturgo_solicitacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT, jogador_id INTEGER NOT NULL, tipo TEXT NOT NULL,
            plano TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pendente_adm',
            aprovado_por TEXT, criado_em TEXT DEFAULT (datetime('now')), atualizado_em TEXT DEFAULT (datetime('now'))
        )`);
        await executar(`CREATE TABLE IF NOT EXISTS chef_cozinha_itens (
            id INTEGER PRIMARY KEY AUTOINCREMENT, jogador_id INTEGER NOT NULL, nome TEXT NOT NULL,
            quantidade INTEGER NOT NULL DEFAULT 1, origem TEXT, validade_em TEXT,
            UNIQUE(jogador_id, nome)
        )`);
        await executar(`CREATE TABLE IF NOT EXISTS chef_receitas (
            id INTEGER PRIMARY KEY AUTOINCREMENT, jogador_id INTEGER NOT NULL, nome TEXT NOT NULL,
            tipo TEXT NOT NULL, ingredientes TEXT, efeito_proposto TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pendente_adm', criado_em TEXT DEFAULT (datetime('now'))
        )`);
        await executar(`CREATE TABLE IF NOT EXISTS apotecario_pocoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT, jogador_id INTEGER NOT NULL, nome TEXT NOT NULL,
            ingredientes TEXT, efeito_proposto TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pendente_adm', criado_em TEXT DEFAULT (datetime('now'))
        )`);
        await executar(`CREATE TABLE IF NOT EXISTS soberanias_elementais (
            id INTEGER PRIMARY KEY AUTOINCREMENT, jogador_id INTEGER NOT NULL UNIQUE,
            classe TEXT NOT NULL, elemento TEXT NOT NULL UNIQUE, estado TEXT NOT NULL DEFAULT 'ativa',
            dados TEXT, criado_em TEXT DEFAULT (datetime('now'))
        )`);
    })();
    return tabelasProntas;
}

async function exigirClasse(jogadorId, classes) {
    const jogador = await obter("SELECT id, nome, classe_avancada, nivel, sentidos_base FROM jogadores WHERE id = ?", [jogadorId]);
    if (!jogador) throw new Error("Jogador não encontrado.");
    if (!classes.map(normalizar).includes(normalizar(jogador.classe_avancada))) {
        throw new Error(`Esta operação exige a classe avançada: ${classes.join(" ou ")}.`);
    }
    return jogador;
}

function validarElemento(elemento) {
    const valor = normalizar(elemento);
    if (!ELEMENTOS_SOBERANOS.includes(valor)) throw new Error("Elemento inválido. Use: fogo, água, terra, eletricidade, planta, gelo ou vento.");
    return valor;
}

const AdvancedClassFeatureSystem = {
    garantirTabelas,
    ELEMENTOS_SOBERANOS: [...ELEMENTOS_SOBERANOS],

    // HRYMIR -------------------------------------------------------------
    async concederInstrumentosIniciais(jogadorId, instrumentos) {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Hrymir"]);
        if (!Array.isArray(instrumentos) || instrumentos.length !== 2) throw new Error("Hrymir recebe exatamente dois Instrumentos Divinos iniciais.");
        const existentes = await obter("SELECT COUNT(*) AS total FROM hrymir_instrumentos WHERE jogador_id = ?", [jogadorId]);
        if (existentes.total > 0) throw new Error("Os Instrumentos Divinos iniciais já foram registrados.");
        for (const instrumento of instrumentos) await this.registrarInstrumento(jogadorId, instrumento, "inicial");
    },

    async registrarInstrumento(jogadorId, instrumento, origem = "ritual") {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Hrymir"]);
        const tipo = normalizar(instrumento.tipo);
        if (!["arma", "armadura", "acessorio", "criatura"].includes(tipo)) throw new Error("O recipiente deve ser arma, armadura, acessório ou criatura.");
        if (!instrumento.nomeHumano || !instrumento.nomeRecipiente) throw new Error("Informe o nome humano e o nome do recipiente do espírito.");
        if (origem !== "inicial") {
            const ultimo = await obter("SELECT criado_em FROM hrymir_instrumentos WHERE jogador_id = ? ORDER BY id DESC LIMIT 1", [jogadorId]);
            if (ultimo && Date.now() - Date.parse(`${ultimo.criado_em}Z`) < 15 * 24 * 60 * 60 * 1000) throw new Error("Um novo espírito só pode ser convertido após 15 dias.");
        }
        await executar(`INSERT INTO hrymir_instrumentos (jogador_id, nome_humano, nome_recipiente, tipo_recipiente, origem, dados)
            VALUES (?, ?, ?, ?, ?, ?)`, [jogadorId, instrumento.nomeHumano.trim(), instrumento.nomeRecipiente.trim(), tipo, origem, JSON.stringify(instrumento.dados || {})]);
    },

    async definirFormaVessel(jogadorId, instrumentoId, forma) {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Hrymir"]);
        const instrumento = await obter("SELECT * FROM hrymir_instrumentos WHERE id = ? AND jogador_id = ?", [instrumentoId, jogadorId]);
        if (!instrumento) throw new Error("Instrumento Divino não encontrado.");
        await executar("UPDATE hrymir_instrumentos SET estado = 'forma_vessel', forma_vessel = ?, atualizado_em = datetime('now') WHERE id = ?", [forma, instrumentoId]);
    },

    async registrarTemplo(jogadorId, dados) {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Hrymir"]);
        if (!dados.nome) throw new Error("Informe o nome do templo.");
        await executar(`INSERT INTO hrymir_templos (jogador_id, nome, localizacao, instrumentos_guardados, testemunhas_registradas, dados)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(jogador_id) DO UPDATE SET nome = excluded.nome, localizacao = excluded.localizacao,
            instrumentos_guardados = excluded.instrumentos_guardados, testemunhas_registradas = excluded.testemunhas_registradas,
            dados = excluded.dados, atualizado_em = datetime('now')`, [jogadorId, dados.nome, dados.localizacao || null, Number(dados.instrumentosGuardados || 0), Number(dados.testemunhas || 0), JSON.stringify(dados)]);
    },

    // FREYR --------------------------------------------------------------
    async iniciarSelamentoMajin(jogadorId, dados) {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Freyr"]);
        const metodo = normalizar(dados.metodo);
        if (!["dado", "cenas"].includes(metodo)) throw new Error("O método deve ser 'dado' ou 'cenas'.");
        if (!dados.nomeMajin || !dados.metalVessel) throw new Error("Informe o Majin e o Metal Vessel.");
        await executar(`INSERT INTO freyr_majins (jogador_id, nome_majin, metal_vessel, elemento, metodo, dados)
            VALUES (?, ?, ?, ?, ?, ?)`, [jogadorId, dados.nomeMajin, dados.metalVessel, dados.elemento ? validarElemento(dados.elemento) : null, metodo, JSON.stringify(dados)]);
    },

    async registrarCenaMajin(jogadorId, mahinId, dataCena) {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Freyr"]);
        const mahin = await obter("SELECT * FROM freyr_majins WHERE id = ? AND jogador_id = ?", [mahinId, jogadorId]);
        if (!mahin || mahin.metodo !== "cenas") throw new Error("Selamento por cenas não encontrado.");
        await executar("UPDATE freyr_majins SET cenas_confirmadas = MIN(cenas_confirmadas + 1, 7), atualizado_em = datetime('now') WHERE id = ?", [mahinId]);
        return { cenasConfirmadas: Math.min(mahin.cenas_confirmadas + 1, 7), dataCena };
    },

    async concluirSelamentoMajin(jogadorId, mahinId, aprovadoPor, resultadoDado = null) {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Freyr"]);
        const mahin = await obter("SELECT * FROM freyr_majins WHERE id = ? AND jogador_id = ?", [mahinId, jogadorId]);
        if (!mahin) throw new Error("Majin não encontrado.");
        if (mahin.metodo === "cenas" && mahin.cenas_confirmadas < 7) throw new Error("O método das cenas exige sete cenas confirmadas.");
        if (mahin.metodo === "dado" && resultadoDado !== true) throw new Error("O método do dado deve ser confirmado pelo ADM.");
        await executar("UPDATE freyr_majins SET status = 'selado', dados = ?, atualizado_em = datetime('now') WHERE id = ?", [JSON.stringify({ ...JSON.parse(mahin.dados || "{}"), aprovadoPor }), mahinId]);
    },

    // TAOISTA / ALQUIMISTA / MAGO RUNICO -------------------------------
    async solicitarNagumo(jogadorId, rankDesejado, observacao = null) {
        await garantirTabelas();
        const jogador = await exigirClasse(jogadorId, ["Taoísta", "Taoista"]);
        const rank = String(rankDesejado || "").toUpperCase();
        if (!SENTIDOS_NAGUMO[rank]) throw new Error("Rank de Nagumo inválido. Use C, B, A ou S.");
        if (Number(jogador.sentidos_base || 0) < SENTIDOS_NAGUMO[rank]) throw new Error(`Nagumo Rank-${rank} exige ${SENTIDOS_NAGUMO[rank]} de Sentidos base.`);
        const ultimo = await obter("SELECT criado_em FROM taoista_nagumo_registros WHERE jogador_id = ? ORDER BY id DESC LIMIT 1", [jogadorId]);
        if (ultimo && Date.now() - Date.parse(`${ultimo.criado_em}Z`) < 7 * 24 * 60 * 60 * 1000) throw new Error("Nagumo só pode ser solicitado uma vez por semana.");
        const resultado = await executar("INSERT INTO taoista_nagumo_registros (jogador_id, rank_desejado, sentidos_base, observacao) VALUES (?, ?, ?, ?)", [jogadorId, rank, jogador.sentidos_base, observacao]);
        return { id: resultado.id, status: "pendente_adm", chanceEncontroMonarca: "1/20 — sorteio exclusivo da ADM" };
    },

    async registrarPedraBoss(jogadorId, rankBoss, origem, aprovadoPor) {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Alquimista"]);
        if (!aprovadoPor) throw new Error("Pedras de Boss exigem registro por ADM.");
        return executar("INSERT INTO alquimista_pedras_boss (jogador_id, rank_boss, origem, aprovado_por) VALUES (?, ?, ?, ?)", [jogadorId, String(rankBoss).toUpperCase(), origem, aprovadoPor]);
    },

    async criarPedraFilosofal(jogadorId, rankBoss, dados = {}) {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Alquimista"]);
        const pedras = await listar("SELECT id FROM alquimista_pedras_boss WHERE jogador_id = ? AND rank_boss = ? AND status = 'disponivel' ORDER BY id LIMIT 5", [jogadorId, String(rankBoss).toUpperCase()]);
        if (pedras.length !== 5) throw new Error("São necessárias cinco pedras de mana de Boss do mesmo Rank.");
        for (const pedra of pedras) await executar("UPDATE alquimista_pedras_boss SET status = 'consumida' WHERE id = ?", [pedra.id]);
        return executar("INSERT INTO alquimista_pedras_filosofais (jogador_id, rank_origem, dados) VALUES (?, ?, ?)", [jogadorId, String(rankBoss).toUpperCase(), JSON.stringify(dados)]);
    },

    async registrarRunaGlobal(jogadorId, dados) {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Mago Rúnico", "Mago Runico"]);
        if (!dados.nomeBoss || !dados.origemNarrada || !dados.aprovadoPor) throw new Error("Runa Global exige Boss narrado e aprovação da ADM.");
        return executar("INSERT INTO runas_globais (dono_id, nome_boss, rank_boss, origem_narrada, dados) VALUES (?, ?, ?, ?, ?)", [jogadorId, dados.nomeBoss, String(dados.rankBoss || "?").toUpperCase(), dados.origemNarrada, JSON.stringify({ aprovadoPor: dados.aprovadoPor, atributosBoss: dados.atributosBoss || {} })]);
    },

    async consumirRunaGlobal(jogadorId, runaId, receptorId = jogadorId) {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Mago Rúnico", "Mago Runico"]);
        const runa = await obter("SELECT * FROM runas_globais WHERE id = ? AND dono_id = ? AND status = 'disponivel'", [runaId, jogadorId]);
        if (!runa) throw new Error("Runa Global disponível não encontrada.");
        await executar("UPDATE runas_globais SET status = 'consumida_pendente_cena', usada_por = ?, usada_em = datetime('now') WHERE id = ?", [receptorId, runaId]);
        return { duracaoTurnos: 3, observacao: "Os atributos não são aplicados automaticamente; a cena/ADM define a resolução." };
    },

    // ARCANISTA ---------------------------------------------------------
    async solicitarEncantamento(jogadorId, itemId, efeitoProposto, materiais = []) {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Arcanista"]);
        const item = await obter("SELECT i.id FROM inventario_jogador inv JOIN itens i ON i.id = inv.item_id WHERE inv.jogador_id = ? AND i.id = ?", [jogadorId, itemId]);
        if (!item) throw new Error("O item precisa estar no inventário do Arcanista.");
        return executar("INSERT INTO arcanista_encantamentos (jogador_id, item_id, materiais, efeito_proposto) VALUES (?, ?, ?, ?)", [jogadorId, itemId, JSON.stringify(materiais), efeitoProposto]);
    },

    async criarRunaMagica(jogadorId, tecnicaNome, nomeRuna, dados = {}) {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Arcanista"]);
        const tecnica = await obter(`SELECT t.id FROM jogador_tecnicas jt JOIN tecnicas t ON t.id = jt.tecnica_id
            WHERE jt.jogador_id = ? AND LOWER(t.nome) = LOWER(?)`, [jogadorId, tecnicaNome]);
        if (!tecnica) throw new Error("A Runa Mágica só pode armazenar uma técnica aprendida pelo Arcanista.");
        return executar("INSERT INTO arcanista_runas (criador_id, tecnica_id, nome, dados) VALUES (?, ?, ?, ?)", [jogadorId, tecnica.id, nomeRuna, JSON.stringify(dados)]);
    },

    // ORACULO / TAUMATURGO ---------------------------------------------
    async criarEquipeOraculo(jogadorId, nome, membros = []) {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Oráculo", "Oraculo"]);
        const existente = await obter("SELECT id FROM oraculo_equipes WHERE oraculo_id = ?", [jogadorId]);
        const equipeId = existente ? existente.id : (await executar("INSERT INTO oraculo_equipes (oraculo_id, nome) VALUES (?, ?)", [jogadorId, nome])).id;
        await executar("DELETE FROM oraculo_equipe_membros WHERE equipe_id = ?", [equipeId]);
        for (const membroId of [...new Set([jogadorId, ...membros].map(Number))]) await executar("INSERT OR IGNORE INTO oraculo_equipe_membros (equipe_id, jogador_id) VALUES (?, ?)", [equipeId, membroId]);
        return equipeId;
    },

    async consultarEquilibrioOraculo(jogadorId) {
        await garantirTabelas();
        const oraculo = await exigirClasse(jogadorId, ["Oráculo", "Oraculo"]);
        const equipe = await obter("SELECT id FROM oraculo_equipes WHERE oraculo_id = ?", [jogadorId]);
        if (!equipe) return [];
        const membros = await listar(`SELECT j.id, j.nome, j.nivel FROM oraculo_equipe_membros em
            JOIN jogadores j ON j.id = em.jogador_id WHERE em.equipe_id = ?`, [equipe.id]);
        return membros.map(membro => ({ ...membro, nivelProjetado: membro.id === jogadorId ? membro.nivel : (membro.nivel < oraculo.nivel ? Math.max(1, oraculo.nivel - 5) : oraculo.nivel + 5), requerProximidade: "15m" }));
    },

    async solicitarAcaoTaumaturgo(jogadorId, tipo, plano) {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Taumaturgo"]);
        const tipos = ["aumento_diminuicao", "maldicao_reversa", "queima_de_mana", "redistribuicao", "igualar_atributos"];
        if (!tipos.includes(tipo)) throw new Error("Tipo de ação taumaturga inválido.");
        return executar("INSERT INTO taumaturgo_solicitacoes (jogador_id, tipo, plano) VALUES (?, ?, ?)", [jogadorId, tipo, JSON.stringify(plano || {})]);
    },

    // CHEFE / APOTECARIO -----------------------------------------------
    async guardarIngredienteChef(jogadorId, nome, quantidade = 1, origem = null, validadeEm = null) {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Chefe"]);
        if (!nome || Number(quantidade) <= 0) throw new Error("Ingrediente e quantidade válida são obrigatórios.");
        await executar(`INSERT INTO chef_cozinha_itens (jogador_id, nome, quantidade, origem, validade_em) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(jogador_id, nome) DO UPDATE SET quantidade = quantidade + excluded.quantidade, origem = excluded.origem, validade_em = excluded.validade_em`, [jogadorId, nome, Number(quantidade), origem, validadeEm]);
    },

    async solicitarReceitaChef(jogadorId, dados) {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Chefe"]);
        const tipos = ["petisco", "recolher"];
        if (!tipos.includes(normalizar(dados.tipo))) throw new Error("A receita deve ser um petisco ou alimento de Recolher.");
        return executar("INSERT INTO chef_receitas (jogador_id, nome, tipo, ingredientes, efeito_proposto) VALUES (?, ?, ?, ?, ?)", [jogadorId, dados.nome, normalizar(dados.tipo), JSON.stringify(dados.ingredientes || []), dados.efeitoProposto]);
    },

    async solicitarPocaoApotecario(jogadorId, dados) {
        await garantirTabelas();
        await exigirClasse(jogadorId, ["Apotecário", "Apotecario"]);
        if (!dados.nome || !dados.efeitoProposto) throw new Error("Informe nome e efeito proposto da poção.");
        return executar("INSERT INTO apotecario_pocoes (jogador_id, nome, ingredientes, efeito_proposto) VALUES (?, ?, ?, ?)", [jogadorId, dados.nome, JSON.stringify(dados.ingredientes || []), dados.efeitoProposto]);
    },

    // WARDEN / ARCHON ---------------------------------------------------
    async reivindicarSoberaniaElemental(jogadorId, elemento, dados = {}) {
        await garantirTabelas();
        const jogador = await exigirClasse(jogadorId, ["Warden", "Archon"]);
        const elementoValido = validarElemento(elemento);
        const atual = await obter("SELECT * FROM soberanias_elementais WHERE elemento = ? AND estado = 'ativa'", [elementoValido]);
        if (atual && atual.jogador_id !== jogadorId) throw new Error(`O elemento ${elementoValido} já possui um portador jogador.`);
        const doJogador = await obter("SELECT * FROM soberanias_elementais WHERE jogador_id = ?", [jogadorId]);
        if (doJogador && doJogador.elemento !== elementoValido) throw new Error("Cada Warden ou Archon pode possuir apenas uma soberania elemental.");
        if (!doJogador) await executar("INSERT INTO soberanias_elementais (jogador_id, classe, elemento, dados) VALUES (?, ?, ?, ?)", [jogadorId, jogador.classe_avancada, elementoValido, JSON.stringify(dados)]);
        return { classe: jogador.classe_avancada, elemento: elementoValido, efeitos: "Registrados para uso futuro; nenhum bônus, dano ou gasto de mana é aplicado agora." };
    },

    async listarSoberaniasElementais() {
        await garantirTabelas();
        const ocupadas = await listar(`SELECT se.elemento, se.classe, j.nome AS jogador FROM soberanias_elementais se
            JOIN jogadores j ON j.id = se.jogador_id WHERE se.estado = 'ativa' ORDER BY se.elemento`);
        return ELEMENTOS_SOBERANOS.map(elemento => ({ elemento, portador: ocupadas.find(item => item.elemento === elemento) || null }));
    },

    async obterResumo(jogadorId) {
        await garantirTabelas();
        const jogador = await obter("SELECT id, nome, classe_avancada, nivel FROM jogadores WHERE id = ?", [jogadorId]);
        if (!jogador) throw new Error("Jogador não encontrado.");
        const classe = normalizar(jogador.classe_avancada);
        const resumo = { jogador, classe, registros: {} };

        if (classe === "hrymir") {
            resumo.registros.instrumentos = await listar("SELECT id, nome_humano, nome_recipiente, tipo_recipiente, estado, blessed FROM hrymir_instrumentos WHERE jogador_id = ?", [jogadorId]);
            resumo.registros.templo = await obter("SELECT nome, localizacao, instrumentos_guardados, testemunhas_registradas FROM hrymir_templos WHERE jogador_id = ?", [jogadorId]);
        } else if (classe === "freyr") {
            resumo.registros.majins = await listar("SELECT id, nome_majin, metal_vessel, elemento, metodo, status, cenas_confirmadas FROM freyr_majins WHERE jogador_id = ?", [jogadorId]);
        } else if (classe === "taoista") {
            resumo.registros.nagumo = await listar("SELECT rank_desejado, status, encontro_monarca, criado_em FROM taoista_nagumo_registros WHERE jogador_id = ? ORDER BY id DESC LIMIT 5", [jogadorId]);
        } else if (classe === "alquimista") {
            resumo.registros.pedrasBoss = await listar("SELECT rank_boss, status, COUNT(*) AS quantidade FROM alquimista_pedras_boss WHERE jogador_id = ? GROUP BY rank_boss, status", [jogadorId]);
            resumo.registros.pedrasFilosofais = await listar("SELECT id, rank_origem, status, criada_em FROM alquimista_pedras_filosofais WHERE jogador_id = ?", [jogadorId]);
        } else if (classe === "mago runico") {
            resumo.registros.runasGlobais = await listar("SELECT id, nome_boss, rank_boss, status, criada_em FROM runas_globais WHERE dono_id = ?", [jogadorId]);
        } else if (classe === "arcanista") {
            resumo.registros.encantamentos = await listar("SELECT id, item_id, efeito_proposto, status FROM arcanista_encantamentos WHERE jogador_id = ?", [jogadorId]);
            resumo.registros.runas = await listar("SELECT id, nome, status FROM arcanista_runas WHERE criador_id = ?", [jogadorId]);
        } else if (classe === "oraculo") {
            resumo.registros.equipe = await this.consultarEquilibrioOraculo(jogadorId);
        } else if (classe === "taumaturgo") {
            resumo.registros.solicitacoes = await listar("SELECT id, tipo, status, criado_em FROM taumaturgo_solicitacoes WHERE jogador_id = ? ORDER BY id DESC LIMIT 10", [jogadorId]);
        } else if (classe === "chefe") {
            resumo.registros.ingredientes = await listar("SELECT nome, quantidade, validade_em FROM chef_cozinha_itens WHERE jogador_id = ?", [jogadorId]);
            resumo.registros.receitas = await listar("SELECT id, nome, tipo, status FROM chef_receitas WHERE jogador_id = ?", [jogadorId]);
        } else if (classe === "apotecario") {
            resumo.registros.pocoes = await listar("SELECT id, nome, status FROM apotecario_pocoes WHERE jogador_id = ?", [jogadorId]);
        } else if (classe === "warden" || classe === "archon") {
            resumo.registros.soberania = await obter("SELECT elemento, estado FROM soberanias_elementais WHERE jogador_id = ?", [jogadorId]);
            resumo.registros.elementos = await this.listarSoberaniasElementais();
        }
        return resumo;
    }
};

module.exports = AdvancedClassFeatureSystem;
