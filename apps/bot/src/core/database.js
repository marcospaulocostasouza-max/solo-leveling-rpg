const { provider } = require("../../../../packages/database/config");
if (provider === "postgres") {
    const { callbackDatabase } = require("../../../../packages/database/postgres-compat");
    const postgresDatabase = callbackDatabase();
    postgresDatabase.iniciarBanco = callback => {
        console.log("Banco utilizado: PostgreSQL");
        if (callback) callback();
    };
    module.exports = postgresDatabase;
    return;
}
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const caminhoBanco = path.join(__dirname, "..", "database", "rpg.db");
const db = new sqlite3.Database(caminhoBanco);

// =====================================
// CRIAÇÃO DE TODAS AS TABELAS
// =====================================

function criarTabelas() {

    // TABELA PRINCIPAL DOS JOGADORES
    db.run(`
        CREATE TABLE IF NOT EXISTS jogadores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero TEXT UNIQUE,
            nome TEXT,
            idade INTEGER,
            sexo TEXT,
            raca TEXT DEFAULT "Humano",
            nacionalidade TEXT,
            altura TEXT,
            peso TEXT,
            personalidade TEXT,
            aparencia TEXT,
            historia TEXT,
            localizacao TEXT DEFAULT "Coréia do Sul",
            nivel INTEGER DEFAULT 1,
            experiencia INTEGER DEFAULT 0,
            won INTEGER DEFAULT 10000,
            maestria INTEGER DEFAULT 0,
            rank TEXT DEFAULT "E",
            titulo TEXT DEFAULT "Nenhum",
            classe TEXT DEFAULT "Não definida",
            nivel_classe INTEGER DEFAULT 1,
            especializacao TEXT DEFAULT "Nenhuma",
            habilidade_unica TEXT DEFAULT "Nenhuma",
            estilo_luta TEXT DEFAULT "Nenhum",
            arma_inicial TEXT DEFAULT "Nenhuma",
            afinidade_elemental TEXT DEFAULT "Nenhuma",
            forca_base INTEGER DEFAULT 0,
            resistencia_base INTEGER DEFAULT 0,
            velocidade_base INTEGER DEFAULT 0,
            sentidos_base INTEGER DEFAULT 0,
            inteligencia_base INTEGER DEFAULT 0,
            poder_magico_base INTEGER DEFAULT 0,
            classe_avancada TEXT DEFAULT "Nenhuma",
            classe_avancada_nivel INTEGER DEFAULT 0,
            forca_buff INTEGER DEFAULT 0,
            resistencia_buff INTEGER DEFAULT 0,
            velocidade_buff INTEGER DEFAULT 0,
            sentidos_buff INTEGER DEFAULT 0,
            inteligencia_buff INTEGER DEFAULT 0,
            poder_magico_buff INTEGER DEFAULT 0,
            forca_total INTEGER DEFAULT 0,
            resistencia_total INTEGER DEFAULT 0,
            velocidade_total INTEGER DEFAULT 0,
            sentidos_total INTEGER DEFAULT 0,
            inteligencia_total INTEGER DEFAULT 0,
            poder_magico_total INTEGER DEFAULT 0,
            mana_atual INTEGER DEFAULT 100,
            mana_maxima INTEGER DEFAULT 100,
            vida_atual INTEGER DEFAULT 100,
            vida_maxima INTEGER DEFAULT 100,
            ficha_enviada INTEGER DEFAULT 0,
            ficha_confirmada INTEGER DEFAULT 0,
            ficha_aprovada INTEGER DEFAULT 0,
            criado INTEGER DEFAULT 0
        );
    `);

    // TABELA DAS FICHAS
    db.run(`
        CREATE TABLE IF NOT EXISTS fichas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador TEXT UNIQUE,
            nome TEXT,
            idade INTEGER,
            sexo TEXT,
            nacionalidade TEXT,
            altura TEXT,
            peso TEXT,
            classe TEXT,
            estilo_luta TEXT,
            arma TEXT,
            elemento TEXT,
            forca INTEGER DEFAULT 0,
            resistencia INTEGER DEFAULT 0,
            velocidade INTEGER DEFAULT 0,
            sentidos INTEGER DEFAULT 0,
            inteligencia INTEGER DEFAULT 0,
            poder_magico INTEGER DEFAULT 0
        );
    `);

    // TABELA DE TÉCNICAS
    db.run(`
        CREATE TABLE IF NOT EXISTS tecnicas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE,
            classe TEXT,
            categoria TEXT,
            tipo TEXT,
            descricao TEXT,
            custo_mana INTEGER DEFAULT 0,
            cooldown INTEGER DEFAULT 0,
            nivel_desbloqueio INTEGER DEFAULT 1,
            passiva INTEGER DEFAULT 0
        );
    `);

    // TÉCNICAS DOS JOGADORES
    db.run(`
        CREATE TABLE IF NOT EXISTS jogador_tecnicas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            tecnica_id INTEGER,
            nivel INTEGER DEFAULT 1,
            experiencia INTEGER DEFAULT 0,
            equipada INTEGER DEFAULT 1,
            usos INTEGER DEFAULT 0,
            cooldown_atual INTEGER DEFAULT 0,
            mana_gasta INTEGER DEFAULT 0,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id),
            FOREIGN KEY(tecnica_id) REFERENCES tecnicas(id),
            UNIQUE(jogador_id, tecnica_id)
        );
    `);

    // HISTÓRICO DE USO DE TÉCNICAS
    db.run(`
        CREATE TABLE IF NOT EXISTS historico_tecnicas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            tecnica_id INTEGER,
            data TEXT,
            gasto_mana INTEGER,
            resultado TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id),
            FOREIGN KEY(tecnica_id) REFERENCES tecnicas(id)
        );
    `);

    // ESTILOS DE LUTA
    db.run(`
        CREATE TABLE IF NOT EXISTS estilos_luta (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE,
            arma TEXT,
            descricao TEXT,
            tecnica_nome TEXT,
            descricao_tecnica TEXT,
            custo_mana INTEGER DEFAULT 0,
            requisitos TEXT
        );
    `);

    // ELEMENTOS
    db.run(`
        CREATE TABLE IF NOT EXISTS elementos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE,
            categoria TEXT,
            origem TEXT,
            raridade TEXT,
            sorteavel INTEGER DEFAULT 1,
            bonus_afinidade INTEGER DEFAULT 20,
            vantagens TEXT,
            bonus_vantagem INTEGER DEFAULT 30
        );
    `);

    // ITENS DO RPG
    db.run(`
        CREATE TABLE IF NOT EXISTS itens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE,
            categoria TEXT,
            tier TEXT,
            preco INTEGER DEFAULT 0,
            descricao TEXT,
            arma INTEGER DEFAULT 0,
            armadura INTEGER DEFAULT 0,
            escudo INTEGER DEFAULT 0,
            acessorio INTEGER DEFAULT 0,
            consumivel INTEGER DEFAULT 0,
            classe_requerida TEXT DEFAULT "Nenhuma",
            estilo_requerido TEXT DEFAULT "Nenhum",
            forca_bonus INTEGER DEFAULT 0,
            resistencia_bonus INTEGER DEFAULT 0,
            velocidade_bonus INTEGER DEFAULT 0,
            sentidos_bonus INTEGER DEFAULT 0,
            inteligencia_bonus INTEGER DEFAULT 0,
            poder_magico_bonus INTEGER DEFAULT 0,
            efeito TEXT,
            habilidade TEXT,
            item_unico INTEGER DEFAULT 0
        );
    `);

    // ITENS INICIAIS
    db.run(`
        CREATE TABLE IF NOT EXISTS itens_iniciais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE,
            categoria TEXT,
            descricao TEXT,
            arma INTEGER DEFAULT 0,
            escudo INTEGER DEFAULT 0,
            equipamento INTEGER DEFAULT 1,
            atributo_bonus INTEGER DEFAULT 0
        );
    `);

    // INVENTÁRIO DOS JOGADORES
    db.run(`
        CREATE TABLE IF NOT EXISTS inventario_jogador (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            item_id INTEGER,
            quantidade INTEGER DEFAULT 1,
            equipado INTEGER DEFAULT 0,
            item_inicial INTEGER DEFAULT 0,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id),
            FOREIGN KEY(item_id) REFERENCES itens(id)
        );
    `);

    // FICHAS PENDENTES
    db.run(`
        CREATE TABLE IF NOT EXISTS fichas_pendentes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero TEXT UNIQUE,
            dados TEXT,
            status TEXT DEFAULT "aguardando",
            data_envio TEXT
        );
    `);

    // SISTEMA DE APROVAÇÃO
    db.run(`
        CREATE TABLE IF NOT EXISTS aprovacao_fichas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            numero TEXT,
            avaliador TEXT,
            habilidade_unica TEXT,
            motivo TEXT,
            status TEXT DEFAULT "pendente",
            data TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);

    // ADMINISTRADORES
    db.run(`
        CREATE TABLE IF NOT EXISTS administradores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero TEXT UNIQUE,
            nome TEXT,
            nivel INTEGER DEFAULT 1,
            permissao TEXT DEFAULT "avaliador"
        );
    `);

    // GRUPOS
    db.run(`
        CREATE TABLE IF NOT EXISTS grupos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            id_grupo TEXT UNIQUE,
            tipo TEXT
        );
    `);

    // GUILDAS
    db.run(`
        CREATE TABLE IF NOT EXISTS guildas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE,
            lider TEXT,
            nivel INTEGER DEFAULT 1,
            valor INTEGER DEFAULT 100000,
            territorio INTEGER DEFAULT 0,
            membros INTEGER DEFAULT 1,
            passivas TEXT DEFAULT "Nenhuma",
            criada INTEGER DEFAULT 1
        );
    `);

    // MEMBROS DAS GUILDAS
    db.run(`
        CREATE TABLE IF NOT EXISTS guilda_membros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guilda_id INTEGER,
            jogador_id INTEGER,
            cargo TEXT DEFAULT "Membro",
            data_entrada TEXT,
            FOREIGN KEY(guilda_id) REFERENCES guildas(id),
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);

    // GUERRAS DE GUILDAS
    db.run(`
        CREATE TABLE IF NOT EXISTS guerras_guildas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guilda_atacante INTEGER,
            guilda_defensora INTEGER,
            modo TEXT,
            status TEXT DEFAULT "pendente",
            vencedor INTEGER,
            recompensa INTEGER DEFAULT 0,
            data TEXT,
            FOREIGN KEY(guilda_atacante) REFERENCES guildas(id),
            FOREIGN KEY(guilda_defensora) REFERENCES guildas(id)
        );
    `);

    // DUNGEONS
    db.run(`
        CREATE TABLE IF NOT EXISTS dungeons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE,
            rank TEXT,
            andar INTEGER DEFAULT 1,
            descricao TEXT,
            boss TEXT,
            recompensa_xp INTEGER DEFAULT 0,
            recompensa_won INTEGER DEFAULT 0
        );
    `);

    // JOGADOR DUNGEONS
    db.run(`
        CREATE TABLE IF NOT EXISTS jogador_dungeons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            dungeon_id INTEGER,
            status TEXT DEFAULT "ativa",
            progresso INTEGER DEFAULT 0,
            recompensa_recebida INTEGER DEFAULT 0,
            data TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id),
            FOREIGN KEY(dungeon_id) REFERENCES dungeons(id)
        );
    `);

    // MONSTROS
    db.run(`
        CREATE TABLE IF NOT EXISTS monstros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE,
            rank TEXT,
            nivel INTEGER DEFAULT 1,
            vida INTEGER DEFAULT 100,
            dano INTEGER DEFAULT 10,
            defesa INTEGER DEFAULT 5,
            experiencia INTEGER DEFAULT 100,
            won INTEGER DEFAULT 0,
            habilidade TEXT
        );
    `);

    // BOSSES
    db.run(`
        CREATE TABLE IF NOT EXISTS bosses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE,
            rank TEXT,
            nivel INTEGER,
            vida INTEGER,
            dano INTEGER,
            defesa INTEGER,
            habilidade_unica TEXT,
            recompensa TEXT
        );
    `);

    // EXPERIÊNCIA E HISTÓRICO
    db.run(`
        CREATE TABLE IF NOT EXISTS experiencia_historico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            quantidade INTEGER,
            motivo TEXT,
            data TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);

    // ECONOMIA
    db.run(`
        CREATE TABLE IF NOT EXISTS transacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            valor INTEGER,
            tipo TEXT,
            motivo TEXT,
            data TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);

    // EVENTOS
    db.run(`
        CREATE TABLE IF NOT EXISTS eventos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            descricao TEXT,
            recompensa TEXT,
            ativo INTEGER DEFAULT 1
        );
    `);

    // CONFIGURAÇÕES
    db.run(`
        CREATE TABLE IF NOT EXISTS configuracoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chave TEXT UNIQUE,
            valor TEXT
        );
    `);

    // BATALHAS
    db.run(`
        CREATE TABLE IF NOT EXISTS batalhas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            inimigo_id INTEGER,
            tipo TEXT DEFAULT "monstro",
            status TEXT DEFAULT "ativa",
            turno INTEGER DEFAULT 1,
            dados TEXT,
            data TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);

    // ARENA HISTÓRICO
    db.run(`
        CREATE TABLE IF NOT EXISTS arena_historico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            inimigo_id INTEGER,
            inimigo_nome TEXT,
            tipo TEXT DEFAULT "arena",
            resultado TEXT DEFAULT "ativa",
            turno_final INTEGER DEFAULT 0,
            data_inicio TEXT,
            data_fim TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);

    // LOGS ADMINISTRATIVOS
    db.run(`
        CREATE TABLE IF NOT EXISTS admin_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_numero TEXT,
            admin_nome TEXT,
            acao TEXT,
            alvo TEXT,
            detalhes TEXT,
            valor_antigo TEXT,
            valor_novo TEXT,
            data TEXT
        );
    `);

    // CONQUISTAS
    db.run(`
        CREATE TABLE IF NOT EXISTS conquistas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE,
            descricao TEXT,
            categoria TEXT,
            recompensa TEXT
        );
    `);

    // CONQUISTAS DOS JOGADORES
    db.run(`
        CREATE TABLE IF NOT EXISTS jogador_conquistas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            conquista_id INTEGER,
            data TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id),
            FOREIGN KEY(conquista_id) REFERENCES conquistas(id),
            UNIQUE(jogador_id, conquista_id)
        );
    `);

    // REGISTRO DE ATIVIDADES (Treinos, Missões, Dungeons aprovados)
    db.run(`
        CREATE TABLE IF NOT EXISTS atividades_registro (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            jogador_nome TEXT,
            tipo TEXT,
            descricao TEXT,
            recompensa_qi INTEGER DEFAULT 0,
            recompensa_xp INTEGER DEFAULT 0,
            recompensa_won INTEGER DEFAULT 0,
            aprovado_por TEXT,
            data TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);

    // CONTADOR DE ATIVIDADES POR TIPO
    db.run(`
        CREATE TABLE IF NOT EXISTS atividades_contador (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            tipo TEXT,
            quantidade INTEGER DEFAULT 0,
            UNIQUE(jogador_id, tipo),
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);

    // MISSÕES
    db.run(`
        CREATE TABLE IF NOT EXISTS missoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            nome TEXT,
            descricao TEXT,
            tipo TEXT,
            progresso INTEGER DEFAULT 0,
            objetivo INTEGER DEFAULT 1,
            recompensa_xp INTEGER DEFAULT 0,
            recompensa_won INTEGER DEFAULT 0,
            status TEXT DEFAULT "ativa",
            data TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);

    // COMPRAS DA LOJA
    db.run(`
        CREATE TABLE IF NOT EXISTS compras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            jogador_nome TEXT,
            item TEXT,
            preco INTEGER DEFAULT 0,
            status TEXT DEFAULT "Concluida",
            data TEXT,
            registrado_por TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);

    // =====================================
    // NOVAS TABELAS
    // =====================================

    // PROFISSÕES DO SUBMUNDO
    db.run(`
        CREATE TABLE IF NOT EXISTS submundo_profissoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE,
            descricao TEXT,
            custo INTEGER DEFAULT 0,
            duracao_horas INTEGER DEFAULT 1,
            recompensa INTEGER DEFAULT 0,
            requisito_rank TEXT DEFAULT "E",
            tipo TEXT DEFAULT "comum"
        );
    `);

    // ATIVIDADES EM ANDAMENTO NO SUBMUNDO
    db.run(`
        CREATE TABLE IF NOT EXISTS submundo_atividades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER UNIQUE,
            profissao_id INTEGER,
            inicio TEXT,
            termino_previsto TEXT,
            status TEXT DEFAULT "em_andamento",
            recompensa_pendente INTEGER DEFAULT 0,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id),
            FOREIGN KEY(profissao_id) REFERENCES submundo_profissoes(id)
        );
    `);

    // MEMBROS DA ASSOCIAÇÃO DE CAÇADORES
    db.run(`
        CREATE TABLE IF NOT EXISTS associacao_membros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER UNIQUE,
            cargo TEXT DEFAULT "Recruta",
            data_entrada TEXT,
            salario_semanal INTEGER DEFAULT 0,
            ativo INTEGER DEFAULT 1,
            data_ultimo_salario TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);

    // HABILIDADES ÚNICAS PENDENTES (para criação pelo ADM)
    db.run(`
        CREATE TABLE IF NOT EXISTS habilidades_unicas_pendentes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dados TEXT,
            status TEXT DEFAULT "pendente",
            data_envio TEXT,
            criado_por TEXT
        );
    `);

    // ITENS ÚNICOS PENDENTES (para criação pelo ADM)
    db.run(`
        CREATE TABLE IF NOT EXISTS itens_unicos_pendentes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dados TEXT,
            status TEXT DEFAULT "pendente",
            data_envio TEXT,
            criado_por TEXT
        );
    `);
    
    // PROCESSOS DE EXCLUSÃO DE PERSONAGEM
    db.run(`
        CREATE TABLE IF NOT EXISTS processos_exclusao (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero TEXT UNIQUE,
            jogador_nome TEXT,
            status TEXT DEFAULT "aguardando",
            data_criacao TEXT,
            data_expiracao TEXT
        );
    `);
    
    // COMPRAS PENDENTES (aguardando confirmação)
    db.run(`
        CREATE TABLE IF NOT EXISTS compras_pendentes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero TEXT,
            jogador_id INTEGER,
            item_nome TEXT,
            item_categoria TEXT,
            item_rank TEXT,
            item_preco INTEGER DEFAULT 0,
            item_bonus TEXT,
            item_descricao TEXT,
            status TEXT DEFAULT "aguardando",
            data_criacao TEXT
        );
    `);

    // VENDAS PENDENTES (aguardando confirmação)
    db.run(`
        CREATE TABLE IF NOT EXISTS vendas_pendentes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER NOT NULL,
            item_nome TEXT NOT NULL,
            quantidade INTEGER NOT NULL,
            valor_total INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            data TEXT NOT NULL,
            FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
        );
    `);

    // =====================================
    // SISTEMA DE DUNGEONS INSTANCIADAS
    // =====================================

    // CHAVES DE DUNGEON INSTANCIADA (item especial com usos)
    db.run(`
        CREATE TABLE IF NOT EXISTS chaves_dungeon (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER UNIQUE,
            rank TEXT DEFAULT "E",
            usos_total INTEGER DEFAULT 5,
            usos_restantes INTEGER DEFAULT 5,
            data_obtencao TEXT,
            ativa INTEGER DEFAULT 1,
            dungeon_id INTEGER DEFAULT 0,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);

    // REGISTRO DE SORTEIOS SEMANAIS (!Desejar)
    db.run(`
        CREATE TABLE IF NOT EXISTS sorteios_dungeon (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            sucesso INTEGER DEFAULT 0,
            rank TEXT,
            data TEXT,
            semana TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);

    // FICHAS DE DUNGEON INSTANCIADA
    db.run(`
        CREATE TABLE IF NOT EXISTS fichas_dungeon (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            dono_nome TEXT,
            dungeon_nome TEXT,
            dungeon_rank TEXT,
            descricao TEXT,
            tema TEXT,
            participantes TEXT DEFAULT "[]",
            usos_consumidos INTEGER DEFAULT 0,
            status TEXT DEFAULT "ativa",
            data_criacao TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);

    // PRÊMIOS ESCOLHIDOS POR PARTICIPANTE (evita repetir no mesmo uso/geral)
    db.run(`
        CREATE TABLE IF NOT EXISTS premios_dungeon (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ficha_dungeon_id INTEGER,
            jogador_id INTEGER,
            premio_tipo TEXT,
            premio_valor TEXT,
            data TEXT,
            FOREIGN KEY(ficha_dungeon_id) REFERENCES fichas_dungeon(id),
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);

    // REGISTRO DE PARTICIPAÇÃO SEMANAL (impede dungeon repetida na semana)
    db.run(`
        CREATE TABLE IF NOT EXISTS participacao_dungeon (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            ficha_dungeon_id INTEGER,
            semana TEXT,
            data TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id),
            FOREIGN KEY(ficha_dungeon_id) REFERENCES fichas_dungeon(id)
        );
    `);

    // =====================================
    // SISTEMA DE TICKETS DE ITEM/TÉCNICA ÚNICA
    // =====================================

    // TICKETS DE ITEM/TÉCNICA ÚNICA (ganhos ao completar 5 usos da dungeon)
    db.run(`
        CREATE TABLE IF NOT EXISTS tickets_unicos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            tipo TEXT DEFAULT "item_unico",
            nome TEXT,
            status TEXT DEFAULT "disponivel",
            data_obtencao TEXT,
            data_uso TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);

    // FILA DE AVALIAÇÃO DE ITENS/TÉCNICAS ÚNICAS
    db.run(`
        CREATE TABLE IF NOT EXISTS fila_avaliacao (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            ticket_id INTEGER,
            tipo TEXT DEFAULT "item_unico",
            posicao INTEGER DEFAULT 1,
            status TEXT DEFAULT "aguardando",
            data_entrada TEXT,
            data_conclusao TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id),
            FOREIGN KEY(ticket_id) REFERENCES tickets_unicos(id)
        );
    `);

    // =====================================
    // SISTEMA DE AFINIDADE COM NPC (VYSACHE)
    // =====================================

    // AFINIDADE DOS JOGADORES COM NPCS
    db.run(`
        CREATE TABLE IF NOT EXISTS npc_afinidade (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            npc_nome TEXT,
            afinidade INTEGER DEFAULT 0,
            itens_forjados INTEGER DEFAULT 0,
            forja_nacional_disponivel INTEGER DEFAULT 0,
            data_ultima_forja TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id),
            UNIQUE(jogador_id, npc_nome)
        );
    `);

    // =====================================
    // SISTEMA DE FORJA DO VYSACHE
    // =====================================

    // SESSÕES DE FORJA (controle do fluxo de conversa)
    db.run(`
        CREATE TABLE IF NOT EXISTS forja_sessoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            npc_nome TEXT,
            etapa TEXT DEFAULT "aguardando_materiais",
            materiais TEXT,
            combinacao_resultado TEXT,
            custo INTEGER DEFAULT 0,
            item_resultado_id INTEGER,
            data_criacao TEXT,
            data_atualizacao TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);

    // HISTÓRICO DE FORJA
    db.run(`
        CREATE TABLE IF NOT EXISTS forja_historico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogador_id INTEGER,
            npc_nome TEXT,
            materiais_usados TEXT,
            item_nome TEXT,
            item_categoria TEXT,
            item_rank TEXT,
            custo INTEGER DEFAULT 0,
            tipo_forja TEXT DEFAULT "normal",
            data TEXT,
            FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
        );
    `);
}

// =====================================
// INICIALIZAR BANCO
// =====================================
function adicionarColunaSeNaoExistir(tabela, coluna, definicao) {
    db.all(`PRAGMA table_info(${tabela})`, (err, rows) => {
        if (err || !rows) return;
        const colunas = rows.map(row => row.name);
        if (!colunas.includes(coluna)) {
            db.run(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
        }
    });
}

function ajustarEsquema() {
    adicionarColunaSeNaoExistir("jogadores", "classe_avancada", "TEXT DEFAULT \"Nenhuma\"");
    adicionarColunaSeNaoExistir("jogadores", "classe_avancada_nivel", "INTEGER DEFAULT 0");
    adicionarColunaSeNaoExistir("jogadores", "arena_vitorias", "INTEGER DEFAULT 0");
    adicionarColunaSeNaoExistir("jogadores", "arena_derrotas", "INTEGER DEFAULT 0");
    adicionarColunaSeNaoExistir("jogadores", "arena_batalhas", "INTEGER DEFAULT 0");
    adicionarColunaSeNaoExistir("jogadores", "pontos_atributo", "INTEGER DEFAULT 0");
    adicionarColunaSeNaoExistir("jogadores", "ultimo_sorteio_dungeon", "TEXT DEFAULT \"\"");
    adicionarColunaSeNaoExistir("jogadores", "afinidade_sorteada", "INTEGER DEFAULT 0");
    // Colunas faltantes na tabela fichas_pendentes
    adicionarColunaSeNaoExistir("fichas_pendentes", "aprovado_por", "TEXT DEFAULT \"\"");
    adicionarColunaSeNaoExistir("fichas_pendentes", "motivo", "TEXT DEFAULT \"\"");
    // Colunas faltantes na tabela jogadores
    adicionarColunaSeNaoExistir("jogadores", "passivas", "TEXT DEFAULT \"\"");
    adicionarColunaSeNaoExistir("jogadores", "passivas_ativas", "TEXT DEFAULT \"[]\"");
    adicionarColunaSeNaoExistir("jogadores", "bosses_derrotados", "TEXT DEFAULT \"\"");
    // Compatibilidade histórica: o saldo antigo ficava em `qi`. A migração
    // abaixo copia esse valor uma única vez para a fonte de verdade atual.
    adicionarColunaSeNaoExistir("jogadores", "qi", "INTEGER DEFAULT 0");
    migrarQiParaMaestria();
    // Coluna de ocupado para sistema do submundo
    adicionarColunaSeNaoExistir("jogadores", "ocupado", "INTEGER DEFAULT 0");
    adicionarColunaSeNaoExistir("jogadores", "ocupado_ate", "TEXT DEFAULT \"\"");
    adicionarColunaSeNaoExistir("jogadores", "ocupado_motivo", "TEXT DEFAULT \"\"");
    // Coluna de preço para os itens (sistema de venda)
    adicionarColunaSeNaoExistir("itens", "preco", "INTEGER DEFAULT 0");
    // Sorteio de Dungeon semanal (cooldown)
    adicionarColunaSeNaoExistir("jogadores", "ultimo_sorteio_desejar", "TEXT DEFAULT \"\"");
    adicionarColunaSeNaoExistir("jogadores", "ultimo_resultado_desejar", "TEXT DEFAULT \"\"");
}

function migrarQiParaMaestria() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS schema_migrations (
            nome TEXT PRIMARY KEY,
            aplicada_em TEXT DEFAULT CURRENT_TIMESTAMP
        )`);

        db.get("SELECT nome FROM schema_migrations WHERE nome = ?", ["qi_para_maestria_v1"], (err, migracao) => {
            if (err || migracao) return;

            db.all("PRAGMA table_info(jogadores)", (erroColunas, colunas) => {
                if (erroColunas || !colunas) return;
                const nomes = colunas.map(coluna => coluna.name);
                const concluir = () => db.run(
                    "INSERT OR IGNORE INTO schema_migrations (nome) VALUES (?)",
                    ["qi_para_maestria_v1"]
                );

                if (nomes.includes("maestria") && nomes.includes("qi")) {
                    db.run("UPDATE jogadores SET maestria = COALESCE(qi, 0)", concluir);
                    return;
                }

                if (nomes.includes("maestria")) return concluir();

                db.run("ALTER TABLE jogadores ADD COLUMN maestria INTEGER DEFAULT 0", (erro) => {
                    if (erro) return;
                    db.run("UPDATE jogadores SET maestria = COALESCE(qi, 0)", concluir);
                });
            });
        });
    });
}

function iniciarBanco(callback) {
    db.serialize(() => {
        criarTabelas();
        ajustarEsquema();
        console.log("==================================");
        console.log(" DATABASE RPG ONLINE ");
        console.log(" Todas as tabelas carregadas ");
        console.log("==================================");
        console.log("Banco utilizado:", caminhoBanco);

        if (callback) {
            callback();
        }
    });
}

module.exports = db;
module.exports.iniciarBanco = iniciarBanco;
