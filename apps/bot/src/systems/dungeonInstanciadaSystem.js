/*
 * SISTEMA DE DUNGEONS INSTANCIADAS
 * 
 * Gerencia:
 * - Sorteio semanal de chave de dungeon (!Desejar)
 * - Chaves de dungeon com 5 usos
 * - Fichas de dungeon com participantes
 * - Conclusão de dungeon e premiações
 * - Escolha de prêmios pelos participantes
 */

const db = require("../core/database");
const JogadorCore = require("../core/jogadorCore");
const LevelSystem = require("./levelSystem");
const EconomySystem = require("./economySystem");
const TicketSystem = require("./ticketSystem");
const InventorySystem = require("./inventorySystem");
const { ITENS_LOJA } = require("../utils/lojaItens");

// =====================================
// CONFIGURAÇÕES
// =====================================

// Chance de conseguir chave (1 em 5 = 20%)
const CHANCE_CHAVE = 0.2;

// Ranks possíveis para a chave (baseado no rank do jogador)
const RANKS = ["E", "D", "C", "B", "A", "S"];

// Nomes de dungeons por rank
const DUNGEON_NOMES = {
    "E": ["Caverna dos Ecos", "Ruínas Esquecidas", "Túnel Sombrio", "Floresta dos Sussurros", "Mina Abandonada"],
    "D": ["Catacumbas de Pedra", "Bosque Sombrio", "Templo Submerso", "Cripta dos Antigos", "Vale da Névoa"],
    "C": ["Fortaleza em Ruínas", "Abismo Rastejante", "Torre do Lamento", "Pântano Amaldiçoado", "Cidadela Sombria"],
    "B": ["Labirinto do Caos", "Montanha do Trovão", "Cidade Perdida", "Necrópole Viva", "Portal do Vazio"],
    "A": ["Santuário Proibido", "Reino das Sombras", "Abismo Sem Fim", "Trono do Devorador", "Coração do Abismo"],
    "S": ["Torre do Fim", "Jardim do Apocalipse", "Trono do Caos", "Vazio Absoluto", "Portão do Juízo Final"]
};

// Temas por rank
const DUNGEON_TEMAS = {
    "E": ["Caverna", "Ruínas", "Floresta", "Mina"],
    "D": ["Cripta", "Templo", "Pântano", "Vale"],
    "C": ["Fortaleza", "Torre", "Abismo", "Cidadela"],
    "B": ["Labirinto", "Montanha", "Necrópole", "Portal"],
    "A": ["Santuário", "Reino", "Abismo", "Trono"],
    "S": ["Torre", "Jardim", "Vazio", "Portão"]
};

// Descrições por rank
const DUNGEON_DESCRICOES = {
    "E": "Uma dungeon de baixa complexidade, repleta de monstros fracos e armadilhas simples. Ideal para caçadores iniciantes.",
    "D": "Uma dungeon de complexidade moderada, com monstros mais agressivos e armadilhas perigosas. Requer caçadores experientes.",
    "C": "Uma dungeon avançada, com monstros poderosos e desafios complexos. Apenas caçadores de elite devem entrar.",
    "B": "Uma dungeon extremamente perigosa, com monstros de alto calibre e armadilhas mortais. Requer um grupo bem preparado.",
    "A": "Uma dungeon de nível nacional, com ameaças catastróficas. Apenas os caçadores mais fortes sobrevivem.",
    "S": "Uma dungeon de nível global, com ameaças apocalípticas. O destino do mundo pode estar em jogo."
};

// =====================================
// PREMIAÇÕES POR RANK
// =====================================
const PREMIACOES_RANK = {
    "E": {
        xp: 4000,
        won: 20000,
        atributos: 20,
        maestria: 0,
        itensMisteriosos: 2
    },
    "D": {
        xp: 8000,
        won: 50000,
        atributos: 0,
        maestria: 40,
        itensMisteriosos: 2
    },
    "C": {
        xp: 16000,
        won: 100000,
        atributos: 0,
        maestria: 60,
        itensMisteriosos: 2
    },
    "B": {
        xp: 26000,
        won: 190000,
        atributos: 0,
        maestria: 80,
        itensMisteriosos: 2
    },
    "A": {
        xp: 60000,
        won: 500000,
        atributos: 0,
        maestria: 100,
        itensMisteriosos: 2
    },
    "S": {
        xp: 200000,
        won: 1000000,
        atributos: 0,
        maestria: 200,
        itensMisteriosos: 2
    }
};

// =====================================
// FALAS DO ARQUITETO
// =====================================
const FALAS_SUCESSO = [
    `*⟨ ARQUITETO ⟩*

*O fluxo de mana respondeu à sua presença.*

> Uma Chave de Dungeon de Rank {RANK} foi materializada.`,

    `*⟨ ARQUITETO ⟩*

*A probabilidade foi convertida em realidade.*

> Você obteve uma Chave de Dungeon de Rank {RANK}.`,

    `*⟨ ARQUITETO ⟩*

*A convergência foi concluída.*

> Uma Chave de Dungeon de Rank {RANK} foi adicionada ao seu inventário.`,

    `*⟨ ARQUITETO ⟩*

*O sistema identificou uma anomalia compatível.*

> Chave de Dungeon de Rank {RANK} adquirida.`,

    `*⟨ ARQUITETO ⟩*

*A instabilidade dimensional atingiu um ponto crítico.*

> Uma Chave de Dungeon de Rank {RANK} emergiu da distorção.`,

    `*⟨ ARQUITETO ⟩*

*Resultado confirmado.*

> Chave de Dungeon de Rank {RANK} registrada.`,

    `*⟨ ARQUITETO ⟩*

*As leis que regem este mundo concederam uma nova oportunidade.*

> Você recebeu uma Chave de Dungeon de Rank {RANK}.`,

    `*⟨ ARQUITETO ⟩*

*O equilíbrio foi reajustado.*

> Chave de Dungeon de Rank {RANK} obtida com sucesso.`
];

const FALAS_FALHA = [
    `*⟨ ARQUITETO ⟩*

*A análise foi concluída.*

> Nenhuma Chave de Dungeon foi localizada.`,

    `*⟨ ARQUITETO ⟩*

*O fluxo dimensional permaneceu estável.*

> Nenhuma Dungeon respondeu ao seu chamado.`,

    `*⟨ ARQUITETO ⟩*

*As probabilidades não favoreceram esta tentativa.*

> Nenhuma Chave foi gerada.`,

    `*⟨ ARQUITETO ⟩*

*A convergência falhou.*

> Não foi possível localizar uma Dungeon compatível.`,

    `*⟨ ARQUITETO ⟩*

*O sistema concluiu a operação.*

> Nenhuma Chave de Dungeon foi obtida.`,

    `*⟨ ARQUITETO ⟩*

*O vazio permaneceu inalterado.*

> Nenhuma assinatura dimensional foi detectada.`,

    `*⟨ ARQUITETO ⟩*

*O destino permaneceu silencioso.*

> Nenhuma Chave respondeu à sua presença.`,

    `*⟨ ARQUITETO ⟩*

*A busca foi encerrada.*

> Resultado: nenhuma Chave de Dungeon encontrada.`
];

class DungeonInstanciadaSystem {

    // =====================================
    // SORTEIO SEMANAL (!Desejar)
    // =====================================

    /**
     * Verifica se o jogador pode sortear (cooldown semanal)
     * Reset toda segunda-feira às 00:01
     */
    static async podeSortear(jogador) {
        const ultimoSorteio = jogador.ultimo_sorteio_desejar;
        if (!ultimoSorteio) return { pode: true };

        const dataUltimo = new Date(ultimoSorteio);
        const agora = new Date();

        // Calcular a próxima segunda-feira 00:01 após o último sorteio
        const proximaSegunda = this.getProximaSegunda(dataUltimo);
        
        if (agora < proximaSegunda) {
            return { 
                pode: false, 
                proximaSegunda: proximaSegunda,
                ultimoResultado: jogador.ultimo_resultado_desejar
            };
        }

        return { pode: true };
    }

    /**
     * Retorna a próxima segunda-feira 00:01 após uma data
     */
    static getProximaSegunda(data) {
        const d = new Date(data);
        const dia = d.getDay(); // 0=domingo, 1=segunda, ...
        let diasAteSegunda = (8 - dia) % 7; // dias até próxima segunda
        if (diasAteSegunda === 0) diasAteSegunda = 7; // se for segunda, próxima semana
        
        const proxima = new Date(d);
        proxima.setDate(d.getDate() + diasAteSegunda);
        proxima.setHours(0, 1, 0, 0);
        return proxima;
    }

    /**
     * Realiza o sorteio de chave de dungeon
     * Chance de 1 em 5 (20%)
     */
    static async sortearChave(jogador) {
        const sorteio = Math.random() < CHANCE_CHAVE;
        const agora = new Date().toISOString();
        const semana = this.getSemanaAtual();

        // Registrar sorteio
        await new Promise((resolve) => {
            db.run(
                "INSERT INTO sorteios_dungeon (jogador_id, sucesso, rank, data, semana) VALUES (?, ?, ?, ?, ?)",
                [jogador.id, sorteio ? 1 : 0, sorteio ? jogador.rank : null, agora, semana],
                () => resolve()
            );
        });

        if (sorteio) {
            // Sortear nome da dungeon baseado no rank
            const rank = jogador.rank || "E";
            const nomes = DUNGEON_NOMES[rank] || DUNGEON_NOMES["E"];
            const nomeDungeon = nomes[Math.floor(Math.random() * nomes.length)];
            const tema = (DUNGEON_TEMAS[rank] || DUNGEON_TEMAS["E"])[Math.floor(Math.random() * (DUNGEON_TEMAS[rank] || DUNGEON_TEMAS["E"]).length)];

            // Criar chave de dungeon
            await new Promise((resolve) => {
                db.run(
                    `INSERT OR REPLACE INTO chaves_dungeon 
                     (jogador_id, rank, usos_total, usos_restantes, data_obtencao, ativa) 
                     VALUES (?, ?, 5, 5, ?, 1)`,
                    [jogador.id, rank, agora],
                    () => resolve()
                );
            });

            // Atualizar jogador com resultado
            await new Promise((resolve) => {
                db.run(
                    "UPDATE jogadores SET ultimo_sorteio_desejar = ?, ultimo_resultado_desejar = ? WHERE id = ?",
                    [agora, JSON.stringify({ sucesso: true, rank, nomeDungeon, tema }), jogador.id],
                    () => resolve()
                );
            });

            return { sucesso: true, rank, nomeDungeon, tema };
        } else {
            // Atualizar jogador com resultado
            await new Promise((resolve) => {
                db.run(
                    "UPDATE jogadores SET ultimo_sorteio_desejar = ?, ultimo_resultado_desejar = ? WHERE id = ?",
                    [agora, JSON.stringify({ sucesso: false }), jogador.id],
                    () => resolve()
                );
            });

            return { sucesso: false };
        }
    }

    /**
     * Retorna a semana atual (YYYY-WW)
     */
    static getSemanaAtual() {
        const agora = new Date();
        const ano = agora.getFullYear();
        const inicioAno = new Date(ano, 0, 1);
        const dias = Math.floor((agora - inicioAno) / (24 * 60 * 60 * 1000));
        const semana = Math.ceil((dias + inicioAno.getDay() + 1) / 7);
        return `${ano}-W${semana}`;
    }

    /**
     * Busca a chave de dungeon do jogador
     */
    static async getChave(jogadorId) {
        return new Promise((resolve) => {
            db.get("SELECT * FROM chaves_dungeon WHERE jogador_id = ? AND ativa = 1", [jogadorId], (err, chave) => {
                resolve(chave || null);
            });
        });
    }

    /**
     * Vincula uma dungeon da database à chave
     */
    static async vincularDungeon(chaveId, dungeonId) {
        return new Promise((resolve) => {
            db.run(
                "UPDATE chaves_dungeon SET dungeon_id = ? WHERE id = ?",
                [dungeonId, chaveId],
                (err) => resolve(!err)
            );
        });
    }

    /**
     * Busca a dungeon vinculada à chave do jogador
     */
    static async getDungeonVinculada(jogadorId) {
        const chave = await this.getChave(jogadorId);
        if (!chave || !chave.dungeon_id) return null;

        const DungeonDatabaseLoader = require("./dungeonDatabaseLoader");
        return DungeonDatabaseLoader.getDungeonPorId(chave.dungeon_id);
    }

    /**
     * Consome um uso da chave
     */
    static async consumirUso(jogadorId, quantidade = 1) {
        return new Promise((resolve) => {
            db.get("SELECT * FROM chaves_dungeon WHERE jogador_id = ? AND ativa = 1", [jogadorId], (err, chave) => {
                if (!chave) return resolve({ erro: "Você não possui uma Chave de Dungeon." });
                
                const novosUsos = chave.usos_restantes - quantidade;
                if (novosUsos <= 0) {
                    // Chave esgotada - remover
                    db.run("UPDATE chaves_dungeon SET ativa = 0, usos_restantes = 0 WHERE id = ?", [chave.id], () => {
                        resolve({ sucesso: true, usosRestantes: 0, chaveEsgotada: true });
                    });
                } else {
                    db.run("UPDATE chaves_dungeon SET usos_restantes = ? WHERE id = ?", [novosUsos, chave.id], () => {
                        resolve({ sucesso: true, usosRestantes: novosUsos, chaveEsgotada: false });
                    });
                }
            });
        });
    }

    // =====================================
    // FICHA DE DUNGEON (!ficha de Dungeon)
    // =====================================

    /**
     * Gera a ficha da dungeon do jogador
     */
    static async gerarFichaDungeon(jogador) {
        const chave = await this.getChave(jogador.id);
        if (!chave) {
            return { erro: "Você não possui uma Chave de Dungeon. Use !Desejar para tentar obter uma." };
        }

        // Buscar dados da dungeon sorteada
        const resultado = JSON.parse(jogador.ultimo_resultado_desejar || "{}");
        const nomeDungeon = resultado.nomeDungeon || "Dungeon Desconhecida";
        const tema = resultado.tema || "Desconhecido";
        const rank = chave.rank || "E";
        const descricao = DUNGEON_DESCRICOES[rank] || DUNGEON_DESCRICOES["E"];

        // Buscar ficha existente
        const fichaExistente = await new Promise((resolve) => {
            db.get("SELECT * FROM fichas_dungeon WHERE jogador_id = ? AND status = 'ativa'", [jogador.id], (err, ficha) => {
                resolve(ficha || null);
            });
        });

        if (fichaExistente) {
            return {
                ficha: fichaExistente,
                chave: chave,
                nomeDungeon: fichaExistente.dungeon_nome,
                tema: fichaExistente.tema,
                rank: fichaExistente.dungeon_rank,
                descricao: fichaExistente.descricao
            };
        }

        // Criar nova ficha
        const participantes = [jogador.nome];
        const dataCriacao = new Date().toISOString();

        const fichaId = await new Promise((resolve) => {
            db.run(
                `INSERT INTO fichas_dungeon 
                 (jogador_id, dono_nome, dungeon_nome, dungeon_rank, descricao, tema, participantes, usos_consumidos, status, data_criacao) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'ativa', ?)`,
                [jogador.id, jogador.nome, nomeDungeon, rank, descricao, tema, JSON.stringify(participantes), dataCriacao],
                function(err) {
                    resolve(this.lastID);
                }
            );
        });

        const ficha = {
            id: fichaId,
            jogador_id: jogador.id,
            dono_nome: jogador.nome,
            dungeon_nome: nomeDungeon,
            dungeon_rank: rank,
            descricao: descricao,
            tema: tema,
            participantes: JSON.stringify(participantes),
            usos_consumidos: 0,
            status: "ativa",
            data_criacao: dataCriacao
        };

        return {
            ficha: ficha,
            chave: chave,
            nomeDungeon: nomeDungeon,
            tema: tema,
            rank: rank,
            descricao: descricao
        };
    }

    /**
     * Formata a ficha de dungeon para exibição
     */
    static formatarFichaDungeon(dados) {
        const participantes = JSON.parse(dados.ficha.participantes || "[]");
        const chave = dados.chave;
        
        let mensagem = `*═══ FICHA DE DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*DUNGEON INSTANCIADA*

*Nome:* ${dados.nomeDungeon}
*Rank:* ${dados.rank}
*Tema:* ${dados.tema}

*Descrição:*
${dados.descricao}

*Chave de Dungeon:*
> Usos: ${chave.usos_restantes}/${chave.usos_total}

*Participantes (máx. 5):*
${participantes.map((p, i) => `${i + 1}. ${p}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Copie esta ficha, adicione os participantes e envie novamente._
_Depois use *!concluir Dungeon* para finalizar._`;

        return mensagem;
    }

    // =====================================
    // CONCLUIR DUNGEON (!concluir Dungeon)
    // =====================================

    /**
     * Reconhece a ficha de dungeon enviada pelo jogador
     * Extrai participantes e valida
     */
    static async reconhecerFichaDungeon(texto, jogador) {
        const linhas = texto.split("\n");
        const participantes = [];
        let dungeonNome = "";
        let dungeonRank = "";

        linhas.forEach(linha => {
            const linhaLower = linha.toLowerCase().trim();
            
            // Extrair nome da dungeon
            if (linhaLower.startsWith("*nome:*") || linhaLower.startsWith("nome:")) {
                dungeonNome = linha.substring(linha.indexOf(":") + 1).replace(/[*_]/g, "").trim();
            }
            
            // Extrair rank
            if (linhaLower.startsWith("*rank:*") || linhaLower.startsWith("rank:")) {
                dungeonRank = linha.substring(linha.indexOf(":") + 1).replace(/[*_]/g, "").trim();
            }
            
            // Extrair participantes (linhas numeradas)
            const matchParticipante = linha.match(/^\d+\.\s+(.+)$/);
            if (matchParticipante) {
                const nome = matchParticipante[1].replace(/[*_]/g, "").trim();
                if (nome && nome.length > 1) {
                    participantes.push(nome);
                }
            }
        });

        // Verificar se o dono está na lista
        const donoNaLista = participantes.some(p => p.toLowerCase() === jogador.nome.toLowerCase());
        if (!donoNaLista) {
            participantes.unshift(jogador.nome);
        }

        return {
            dungeonNome,
            dungeonRank,
            participantes
        };
    }

    /**
     * Conclui a dungeon - valida participantes e retorna premiações
     */
    static async concluirDungeon(jogador, fichaReconhecida) {
        // Buscar chave
        const chave = await this.getChave(jogador.id);
        if (!chave) {
            return { erro: "Você não possui uma Chave de Dungeon ativa." };
        }

        // Buscar ficha existente
        const ficha = await new Promise((resolve) => {
            db.get("SELECT * FROM fichas_dungeon WHERE jogador_id = ? AND status = 'ativa'", [jogador.id], (err, f) => {
                resolve(f || null);
            });
        });

        if (!ficha) {
            return { erro: "Nenhuma ficha de dungeon encontrada. Use !ficha de Dungeon primeiro." };
        }

        // Validar participantes
        const participantes = fichaReconhecida.participantes || [];
        if (participantes.length === 0) {
            return { erro: "Nenhum participante encontrado na ficha." };
        }

        if (participantes.length > 5) {
            return { erro: "Máximo de 5 participantes por dungeon." };
        }

        // Verificar se o dono está participando
        const donoNaLista = participantes.some(p => p.toLowerCase() === jogador.nome.toLowerCase());
        if (!donoNaLista) {
            return { erro: "O dono da chave deve estar na lista de participantes." };
        }

        // Validar cada participante
        const validacoes = [];
        const participantesValidos = [];
        const semana = this.getSemanaAtual();

        for (const nomeParticipante of participantes) {
            // Buscar jogador pelo nome
            const participante = await JogadorCore.buscarPorNomeLike(nomeParticipante);
            
            if (!participante) {
                validacoes.push(`❌ *${nomeParticipante}* - Jogador não encontrado no sistema.`);
                continue;
            }

            // Verificar rank (players de rank maior que a dungeon não podem participar)
            const rankDungeon = ficha.dungeon_rank || "E";
            const rankParticipante = participante.rank || "E";
            const ordemRanks = ["E", "D", "C", "B", "A", "S"];
            const idxDungeon = ordemRanks.indexOf(rankDungeon);
            const idxParticipante = ordemRanks.indexOf(rankParticipante);

            if (idxParticipante > idxDungeon) {
                validacoes.push(`❌ *${participante.nome}* - Rank ${rankParticipante} é superior ao rank da dungeon (${rankDungeon}).`);
                continue;
            }

            // Verificar se já participou de dungeon instanciada na semana
            const jaParticipou = await new Promise((resolve) => {
                db.get(
                    "SELECT * FROM participacao_dungeon WHERE jogador_id = ? AND semana = ?",
                    [participante.id, semana],
                    (err, row) => resolve(row || null)
                );
            });

            if (jaParticipou) {
                validacoes.push(`❌ *${participante.nome}* - Já participou de uma Dungeon Instanciada esta semana.`);
                continue;
            }

            participantesValidos.push(participante);
        }

        // Se houver erros, retornar
        if (validacoes.length > 0) {
            return {
                erro: "Alguns participantes não podem entrar na dungeon:",
                validacoes: validacoes
            };
        }

        // Consumir usos da chave (1 por participante adicional além do dono)
        const usosConsumir = participantesValidos.length;
        const resultadoUso = await this.consumirUso(jogador.id, usosConsumir);
        
        if (resultadoUso.erro) {
            return { erro: resultadoUso.erro };
        }

        // Atualizar ficha com participantes
        const participantesNomes = participantesValidos.map(p => p.nome);
        await new Promise((resolve) => {
            db.run(
                "UPDATE fichas_dungeon SET participantes = ?, usos_consumidos = ? WHERE id = ?",
                [JSON.stringify(participantesNomes), usosConsumir, ficha.id],
                () => resolve()
            );
        });

        // Registrar participação de todos
        for (const participante of participantesValidos) {
            await new Promise((resolve) => {
                db.run(
                    "INSERT INTO participacao_dungeon (jogador_id, ficha_dungeon_id, semana, data) VALUES (?, ?, ?, ?)",
                    [participante.id, ficha.id, semana, new Date().toISOString()],
                    () => resolve()
                );
            });
        }

        // Retornar premiações
        const premios = PREMIACOES_RANK[ficha.dungeon_rank] || PREMIACOES_RANK["E"];

        // Se a chave esgotou (5 usos concluídos), sortear ticket 50/50
        let ticket = null;
        if (resultadoUso.chaveEsgotada) {
            ticket = await TicketSystem.sortearTicket(jogador.id);
            
            // Atualizar loja automaticamente com os itens misteriosos da dungeon
            await this.atualizarLojaComDrops(ficha.dungeon_rank, chave.dungeon_id);
        }

        return {
            sucesso: true,
            ficha: ficha,
            participantes: participantesValidos,
            premios: premios,
            usosRestantes: resultadoUso.usosRestantes,
            chaveEsgotada: resultadoUso.chaveEsgotada,
            ticket: ticket
        };
    }

    // =====================================
    // PRÊMIOS (!Escolho a opção número X)
    // =====================================

    /**
     * Retorna as opções de prêmio disponíveis para um participante
     */
    static async getOpcoesPremios(fichaDungeonId, jogadorId) {
        const premios = await new Promise((resolve) => {
            db.all(
                "SELECT * FROM premios_dungeon WHERE ficha_dungeon_id = ? AND jogador_id = ?",
                [fichaDungeonId, jogadorId],
                (err, rows) => resolve(rows || [])
            );
        });

        // Prêmios já escolhidos
        const escolhidos = premios.map(p => p.premio_tipo);

        // Buscar ficha para rank
        const ficha = await new Promise((resolve) => {
            db.get("SELECT * FROM fichas_dungeon WHERE id = ?", [fichaDungeonId], (err, row) => resolve(row || null));
        });

        if (!ficha) return [];

        const premiosRank = PREMIACOES_RANK[ficha.dungeon_rank] || PREMIACOES_RANK["E"];

        const opcoes = [];
        let numero = 1;

        // XP extra
        if (!escolhidos.includes("xp_extra")) {
            opcoes.push({ numero, tipo: "xp_extra", nome: "XP Extra", valor: premiosRank.xp, descricao: `${premiosRank.xp} XP` });
            numero++;
        }

        // Wons extra
        if (!escolhidos.includes("won_extra")) {
            opcoes.push({ numero, tipo: "won_extra", nome: "Wons Extra", valor: premiosRank.won, descricao: `${premiosRank.won} Wons` });
            numero++;
        }

        // Atributos (Rank E)
        if (premiosRank.atributos > 0 && !escolhidos.includes("atributos")) {
            opcoes.push({ numero, tipo: "atributos", nome: "Pontos de Atributo", valor: premiosRank.atributos, descricao: `${premiosRank.atributos} pontos de atributo` });
            numero++;
        }

        // Maestria (Ranks D-S)
        if (premiosRank.maestria > 0 && !escolhidos.includes("maestria")) {
            opcoes.push({ numero, tipo: "maestria", nome: "Maestria", valor: premiosRank.maestria, descricao: `${premiosRank.maestria} de Maestria` });
            numero++;
        }

        // Item Misterioso 1
        if (!escolhidos.includes("item_misterioso_1")) {
            opcoes.push({ numero, tipo: "item_misterioso_1", nome: "Item Misterioso 1", valor: 1, descricao: "Item Misterioso #1" });
            numero++;
        }

        // Item Misterioso 2
        if (!escolhidos.includes("item_misterioso_2")) {
            opcoes.push({ numero, tipo: "item_misterioso_2", nome: "Item Misterioso 2", valor: 1, descricao: "Item Misterioso #2" });
            numero++;
        }

        return opcoes;
    }

    /**
     * Escolhe um prêmio para o participante
     */
    static async escolherPremio(fichaDungeonId, jogadorId, numeroOpcao) {
        const opcoes = await this.getOpcoesPremios(fichaDungeonId, jogadorId);
        const opcao = opcoes.find(o => o.numero === numeroOpcao);

        if (!opcao) {
            return { erro: "Opção inválida. Use !Escolho a opção número X para escolher." };
        }

        // Registrar prêmio escolhido
        await new Promise((resolve) => {
            db.run(
                "INSERT INTO premios_dungeon (ficha_dungeon_id, jogador_id, premio_tipo, premio_valor, data) VALUES (?, ?, ?, ?, ?)",
                [fichaDungeonId, jogadorId, opcao.tipo, String(opcao.valor), new Date().toISOString()],
                () => resolve()
            );
        });

        // Aplicar prêmio
        const jogador = await JogadorCore.buscarPorNumero(jogadorId);
        if (!jogador) return { erro: "Jogador não encontrado." };

        let mensagem = "";

        switch (opcao.tipo) {
            case "xp_extra":
                await LevelSystem.adicionarXp(jogador.id, opcao.valor, "Prêmio extra de Dungeon Instanciada");
                mensagem = `*${opcao.valor} XP* adicionados!`;
                break;
            case "won_extra":
                await EconomySystem.adicionarWon(jogador.id, opcao.valor, "Prêmio extra de Dungeon Instanciada");
                mensagem = `*${opcao.valor} Wons* adicionados!`;
                break;
            case "atributos":
                await JogadorCore.adicionarValor(jogador.id, "pontos_atributo", opcao.valor);
                mensagem = `*${opcao.valor} pontos de atributo* adicionados!`;
                break;
            case "maestria":
                await JogadorCore.adicionarValor(jogador.id, "maestria", opcao.valor);
                mensagem = `*${opcao.valor} de Maestria* adicionados!`;
                break;
            case "item_misterioso_1":
            case "item_misterioso_2": {
                // Sortear item da dungeon vinculada
                const DungeonDatabaseLoader = require("./dungeonDatabaseLoader");
                const chaveJogador = await this.getChave(jogador.id);
                if (chaveJogador && chaveJogador.dungeon_id) {
                    const itemSorteado = DungeonDatabaseLoader.sortearItemMisterioso(chaveJogador.dungeon_id);
                    if (itemSorteado) {
                        // Adicionar item ao inventário do jogador
                        const InventorySystem = require("./inventorySystem");
                        // Buscar ou criar item no banco
                        const itemId = await this.criarOuBuscarItem(itemSorteado);
                        if (itemId) {
                            await InventorySystem.adicionarItem(jogador.id, itemId);
                            mensagem = `*${itemSorteado.nome}* [Rank ${itemSorteado.rank}] adicionado ao inventário!\n\n${itemSorteado.descricao}\n\n*Atributos:* ${Object.entries(itemSorteado.atributos).map(([k, v]) => `${k}: +${v}`).join(" • ")}`;
                        } else {
                            mensagem = `*${itemSorteado.nome}* concedido! (Erro ao adicionar ao inventário)`;
                        }
                    } else {
                        mensagem = `*Item Misterioso* concedido! (Nenhum drop disponível para esta dungeon)`;
                    }
                } else {
                    mensagem = `*Item Misterioso* concedido! (Nenhuma dungeon vinculada)`;
                }
                break;
            }
            default:
                mensagem = `Prêmio *${opcao.nome}* concedido!`;
        }

        return {
            sucesso: true,
            opcao: opcao,
            mensagem: mensagem
        };
    }

    /**
     * Cria ou busca um item no banco de dados baseado nos dados do drop
     */
    static async criarOuBuscarItem(itemDrop) {
        const db = require("../core/database");
        
        return new Promise((resolve) => {
            // Buscar item pelo nome
            db.get("SELECT id FROM itens WHERE nome = ?", [itemDrop.nome], (err, item) => {
                if (item) {
                    resolve(item.id);
                } else {
                    // Criar item no banco
                    const isArma = itemDrop.categoria === "Arma 1" || itemDrop.categoria === "Arma 2";
                    const isArmadura = itemDrop.categoria === "Armadura";
                    const isConsumivel = itemDrop.categoria === "Consumível";
                    
                    // Mapear atributos
                    let forcaBonus = 0, resistenciaBonus = 0, velocidadeBonus = 0;
                    let sentidosBonus = 0, inteligenciaBonus = 0, poderMagicoBonus = 0;
                    let efeito = "";
                    
                    if (itemDrop.atributos) {
                        forcaBonus = itemDrop.atributos["Força"] || 0;
                        resistenciaBonus = itemDrop.atributos["Resistência"] || 0;
                        velocidadeBonus = itemDrop.atributos["Agilidade"] || 0;
                        sentidosBonus = itemDrop.atributos["Sentidos"] || 0;
                        inteligenciaBonus = itemDrop.atributos["Inteligência"] || 0;
                        poderMagicoBonus = itemDrop.atributos["Poder Mágico"] || 0;
                        if (itemDrop.atributos.efeito) {
                            efeito = itemDrop.atributos.efeito;
                        }
                    }
                    
                    db.run(
                        `INSERT INTO itens (nome, categoria, tier, descricao, arma, armadura, consumivel, 
                         forca_bonus, resistencia_bonus, velocidade_bonus, sentidos_bonus, 
                         inteligencia_bonus, poder_magico_bonus, efeito) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            itemDrop.nome,
                            itemDrop.categoria,
                            itemDrop.rank,
                            itemDrop.descricao,
                            isArma ? 1 : 0,
                            isArmadura ? 1 : 0,
                            isConsumivel ? 1 : 0,
                            forcaBonus, resistenciaBonus, velocidadeBonus,
                            sentidosBonus, inteligenciaBonus, poderMagicoBonus,
                            efeito
                        ],
                        function(err) {
                            if (err) {
                                console.error("Erro ao criar item:", err.message);
                                resolve(null);
                            } else {
                                resolve(this.lastID);
                            }
                        }
                    );
                }
            });
        });
    }

    /**
     * Aplica premiação geral (XP + Wons) para todos os participantes
     */
    static async aplicarPremiacaoGeral(fichaDungeonId) {
        const ficha = await new Promise((resolve) => {
            db.get("SELECT * FROM fichas_dungeon WHERE id = ?", [fichaDungeonId], (err, row) => resolve(row || null));
        });

        if (!ficha) return { erro: "Ficha não encontrada." };

        const premios = PREMIACOES_RANK[ficha.dungeon_rank] || PREMIACOES_RANK["E"];
        const participantes = JSON.parse(ficha.participantes || "[]");

        for (const nomeParticipante of participantes) {
            const jogador = await JogadorCore.buscarPorNomeLike(nomeParticipante);
            if (!jogador) continue;

            // XP geral
            await LevelSystem.adicionarXp(jogador.id, premios.xp, "Premiação geral de Dungeon Instanciada");
            
            // Wons geral
            await EconomySystem.adicionarWon(jogador.id, premios.won, "Premiação geral de Dungeon Instanciada");
        }

        return { sucesso: true, premios: premios, participantes: participantes };
    }

    /**
     * Atualiza a loja automaticamente com os itens misteriosos da dungeon
     * quando os 5 usos são concluídos
     */
    static async atualizarLojaComDrops(rank, dungeonId) {
        try {
            const DungeonDatabaseLoader = require("./dungeonDatabaseLoader");
            const dungeon = DungeonDatabaseLoader.getDungeonPorId(dungeonId);
            if (!dungeon) return { sucesso: false, erro: "Dungeon não encontrada" };

            const drops = DungeonDatabaseLoader.getDropsDungeon(dungeonId);
            if (!drops || drops.length === 0) return { sucesso: false, erro: "Nenhum drop disponível" };

            // Mapear categoria da loja
            const mapaCategoriaLoja = {
                "Cabeça": "Slot de Cabeça",
                "Corpo": "Slot de Corpo",
                "Pernas": "Slot de Pernas",
                "Pés": "Slot de Pés",
                "Acessórios": "Slot de Acessórios",
                "Item de Apoio": "Itens de Apoio",
                "Arma 1": "Arma 1",
                "Arma 2": "Arma 2"
            };

            // Adicionar drops à loja do rank correspondente
            const rankLoja = rank || "E";
            if (!ITENS_LOJA[rankLoja]) return { sucesso: false, erro: "Rank inválido" };

            let itensAdicionados = 0;
            for (const drop of drops) {
                const categoriaLoja = mapaCategoriaLoja[drop.categoria];
                if (!categoriaLoja) continue;

                // Verificar se o item já existe na loja
                const itensCategoria = ITENS_LOJA[rankLoja][categoriaLoja] || [];
                const jaExiste = itensCategoria.some(i => i.nome === drop.nome);
                if (jaExiste) continue;

                // Adicionar item à loja
                const bonus = this.formatarBonusDrop(drop);
                ITENS_LOJA[rankLoja][categoriaLoja].push({
                    nome: drop.nome,
                    bonus: bonus,
                    preco: this.calcularPrecoDrop(drop, rankLoja),
                    descricao: drop.descricao || "Item misterioso obtido de uma Dungeon Instanciada."
                });
                itensAdicionados++;
            }

            return { sucesso: true, itensAdicionados };
        } catch (error) {
            console.error("Erro ao atualizar loja com drops:", error);
            return { sucesso: false, erro: error.message };
        }
    }

    /**
     * Formata o bonus de um drop para o formato da loja
     */
    static formatarBonusDrop(drop) {
        if (!drop.atributos) return "Sem bônus";
        
        const partes = [];
        const mapa = {
            "Força": "Força",
            "Agilidade": "Agilidade",
            "Resistência": "Resistência",
            "Sentidos": "Sentidos",
            "Inteligência": "Inteligência",
            "Poder Mágico": "Poder Mágico",
            "Sorte": "Sorte"
        };

        for (const [atributo, valor] of Object.entries(drop.atributos)) {
            if (atributo === "efeito") continue;
            const nome = mapa[atributo] || atributo;
            if (typeof valor === "number" && valor > 0) {
                partes.push(`${nome}: +${valor}`);
            }
        }

        return partes.length > 0 ? partes.join(", ") : "Sem bônus";
    }

    /**
     * Calcula o preço de um drop baseado no rank
     */
    static calcularPrecoDrop(drop, rank) {
        const precosBase = {
            "E": 100000,
            "D": 280000,
            "C": 500000,
            "B": 800000,
            "A": 1400000,
            "S": 2200000
        };
        return precosBase[rank] || 100000;
    }

    /**
     * Formata a lista de premiações para exibição
     */
    static formatarPremiacoes(fichaDungeonId, jogadorId) {
        return new Promise(async (resolve) => {
            const opcoes = await this.getOpcoesPremios(fichaDungeonId, jogadorId);
            
            let mensagem = `*═══ PREMIAÇÕES DA DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Escolha uma opção de prêmio extra:*

`;
            opcoes.forEach(opcao => {
                mensagem += `*${opcao.numero}.* ${opcao.nome} - ${opcao.descricao}\n`;
            });

            mensagem += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Use *!Escolho a opção número X* para escolher._
_Apenas participantes da dungeon podem escolher._`;

            resolve(mensagem);
        });
    }

    // =====================================
    // SISTEMA DE MINERAÇÃO
    // =====================================

    /**
     * Verifica se o jogador tem picareta no inventário
     */
    static async verificarPicareta(jogadorId) {
        const picareta = await new Promise((resolve) => {
            db.get(
                `SELECT iu.id FROM inventario_jogador ij
                 JOIN itens i ON ij.item_id = i.id
                 JOIN inventario_usuario iu ON iu.jogador_id = ij.jogador_id AND iu.item_id = i.id
                 WHERE ij.jogador_id = ? AND i.nome = 'Picareta do Minerador'
                 LIMIT 1`,
                [jogadorId],
                (err, row) => resolve(row || null)
            );
        });

        return picareta !== null;
    }

    /**
     * Remove uma picareta do inventário do jogador
     */
    static async consumirPicareta(jogadorId) {
        return new Promise((resolve) => {
            db.get(
                `SELECT iu.id FROM inventario_jogador ij
                 JOIN itens i ON ij.item_id = i.id
                 JOIN inventario_usuario iu ON iu.jogador_id = ij.jogador_id AND iu.item_id = i.id
                 WHERE ij.jogador_id = ? AND i.nome = 'Picareta do Minerador'
                 LIMIT 1`,
                [jogadorId],
                async (err, row) => {
                    if (!row) {
                        return resolve({ sucesso: false, erro: "Jogador não possui picareta." });
                    }

                    // Remover picareta do inventário
                    db.run("DELETE FROM inventario_usuario WHERE id = ?", [row.id], () => {
                        resolve({ sucesso: true });
                    });
                }
            );
        });
    }

    /**
     * Realiza o sorteio de cristais para o minerador
     */
    static async sortearCristais() {
        // Primeiro, determinar o tipo de cristal
        const rand = Math.random() * 100;
        let tipoCristal;
        
        if (rand < 10) {
            tipoCristal = "grande"; // 10% chance
        } else if (rand < 30) {
            tipoCristal = "medio"; // 20% chance
        } else if (rand < 60) {
            tipoCristal = "pequeno"; // 30% chance
        } else {
            return { sucesso: false, mensagem: "Nenhum cristal foi encontrado." };
        }

        // Determinar a quantidade de cristais
        const randQuantidade = Math.random() * 100;
        let quantidade;
        
        if (randQuantidade < 50) {
            quantidade = 1; // 50% chance
        } else if (randQuantidade < 75) {
            quantidade = 2; // 25% chance
        } else if (randQuantidade < 90) {
            quantidade = 3; // 15% chance
        } else if (randQuantidade < 95) {
            quantidade = 4; // 5% chance
        } else {
            quantidade = 5; // 5% chance
        }

        // Calcular valor total
        const valores = {
            "grande": 100000,
            "medio": 60000,
            "pequeno": 20000
        };

        const valorPorCristal = valores[tipoCristal];
        const valorTotal = valorPorCristal * quantidade;

        const nomes = {
            "grande": "Cristal Grande",
            "medio": "Cristal Médio",
            "pequeno": "Cristal Pequeno"
        };

        return {
            sucesso: true,
            tipo: tipoCristal,
            nome: nomes[tipoCristal],
            quantidade: quantidade,
            valorPorCristal: valorPorCristal,
            valorTotal: valorTotal
        };
    }

    /**
     * Processa a mineração para um jogador
     */
    static async processarMineracao(jogadorId, jogadorNome) {
        // Verificar se tem picareta
        const temPicareta = await this.verificarPicareta(jogadorId);
        if (!temPicareta) {
            return { 
                sucesso: false, 
                erro: "Você precisa de uma Picareta do Minerador para participar como minerador. Compre na loja!" 
            };
        }

        // Realizar sorteio de cristais
        const resultado = await this.sortearCristais();
        
        if (!resultado.sucesso) {
            // Consumir picareta mesmo assim
            await this.consumirPicareta(jogadorId);
            return {
                sucesso: true,
                minerador: jogadorNome,
                ...resultado
            };
        }

        // Adicionar wons ao jogador
        await EconomySystem.adicionarWon(jogadorId, resultado.valorTotal, `Mineração - ${resultado.quantidade}x ${resultado.nome}`);
        
        // Consumir picareta
        await this.consumirPicareta(jogadorId);

        return {
            sucesso: true,
            minerador: jogadorNome,
            ...resultado
        };
    }

    /**
     * Formata a mensagem de resultado da mineração
     */
    static formatarMensagemMineracao(resultado) {
        if (!resultado.sucesso) {
            return `*═══ MINERAÇÃO ⛏️ ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Minerador:* ${resultado.minerador}

*${resultado.erro}*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        }

        if (!resultado.valorTotal) {
            return `*═══ MINERAÇÃO ⛏️ ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Minerador:* ${resultado.minerador}

*Resultado:* ${resultado.mensagem}

*A picareta foi consumida.*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        }

        return `*═══ MINERAÇÃO ⛏️ ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Minerador:* ${resultado.minerador}

* Cristal Encontrado!*

*Tipo:* ${resultado.nome}
*Quantidade:* ${resultado.quantidade}
*Valor unitário:* ${resultado.valorPorCristal.toLocaleString()} Wons
*Valor total:* ${resultado.valorTotal.toLocaleString()} Wons

*Os cristais foram adicionados ao seu saldo!*
*A picareta foi consumida.*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    }
}

module.exports = DungeonInstanciadaSystem;
module.exports.PREMIACOES_RANK = PREMIACOES_RANK;
module.exports.FALAS_SUCESSO = FALAS_SUCESSO;
module.exports.FALAS_FALHA = FALAS_FALHA;
