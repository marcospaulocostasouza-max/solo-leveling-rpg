/**
 * SISTEMA DE FORJA DO VYSACHE
 * 
 * Gerencia o sistema completo de criação de itens com o NPC ferreiro Vysache.
 * 
 * Funcionalidades:
 * - Sistema de afinidade com NPC (0% a 100%)
 * - Combinações pré-definidas de materiais
 * - Criação de itens rank E a S
 * - Forja Nacional ao atingir 100% de afinidade
 * - Controle de sessões de forja (fluxo de conversa)
 */

const db = require("../core/database");
const EconomySystem = require("./economySystem");
const InventorySystem = require("./inventorySystem");

// =====================================
// TABELA DE COMBINAÇÕES DE MATERIAIS
// =====================================
// Cada combinação define quais materiais são necessários, o rank resultante,
// o custo base da forja e a categoria do item que será gerado.

const COMBINACOES_MATERIAIS = {
    // =====================================
    // RANK E - Itens básicos
    // =====================================
    "E_arma": {
        rank: "E",
        categoria: "Arma",
        materiais: { "Couro": 2, "Ferro": 1 },
        custoBase: 500,
        bonusBase: 2,
        descricao: "Uma arma simples forjada com materiais básicos."
    },
    "E_armadura": {
        rank: "E",
        categoria: "Armadura",
        materiais: { "Couro": 3 },
        custoBase: 400,
        bonusBase: 2,
        descricao: "Uma armadura de couro básica para iniciantes."
    },
    "E_acessorio": {
        rank: "E",
        categoria: "Acessório",
        materiais: { "Cobre": 2 },
        custoBase: 300,
        bonusBase: 1,
        descricao: "Um acessório simples de cobre."
    },
    "E_escudo": {
        rank: "E",
        categoria: "Escudo",
        materiais: { "Madeira": 2, "Couro": 1 },
        custoBase: 350,
        bonusBase: 2,
        descricao: "Um escudo de madeira reforçado com couro."
    },

    // =====================================
    // RANK D - Itens comuns
    // =====================================
    "D_arma": {
        rank: "D",
        categoria: "Arma",
        materiais: { "Ferro": 3, "Cobre": 1 },
        custoBase: 1500,
        bonusBase: 5,
        descricao: "Uma arma de ferro decente para aventureiros."
    },
    "D_armadura": {
        rank: "D",
        categoria: "Armadura",
        materiais: { "Ferro": 2, "Couro": 2 },
        custoBase: 1200,
        bonusBase: 5,
        descricao: "Uma armadura de ferro com reforços de couro."
    },
    "D_acessorio": {
        rank: "D",
        categoria: "Acessório",
        materiais: { "Latão": 2, "Cobre": 1 },
        custoBase: 1000,
        bonusBase: 3,
        descricao: "Um acessório de latão com propriedades mágicas leves."
    },
    "D_escudo": {
        rank: "D",
        categoria: "Escudo",
        materiais: { "Ferro": 2, "Madeira": 1 },
        custoBase: 1100,
        bonusBase: 5,
        descricao: "Um escudo de ferro robusto."
    },

    // =====================================
    // RANK C - Itens incomuns
    // =====================================
    "C_arma": {
        rank: "C",
        categoria: "Arma",
        materiais: { "Aço": 3, "Ouro": 1 },
        custoBase: 5000,
        bonusBase: 10,
        descricao: "Uma arma de aço temperado com detalhes em ouro."
    },
    "C_armadura": {
        rank: "C",
        categoria: "Armadura",
        materiais: { "Aço": 3, "Arenito": 1 },
        custoBase: 4500,
        bonusBase: 10,
        descricao: "Uma armadura de aço resistente."
    },
    "C_acessorio": {
        rank: "C",
        categoria: "Acessório",
        materiais: { "Jade": 2, "Ouro": 1 },
        custoBase: 4000,
        bonusBase: 7,
        descricao: "Um acessório de jade com energia mágica."
    },
    "C_escudo": {
        rank: "C",
        categoria: "Escudo",
        materiais: { "Aço": 2, "Malaquita": 1 },
        custoBase: 4200,
        bonusBase: 10,
        descricao: "Um escudo de aço com reforços de malaquita."
    },
    "C_capacete": {
        rank: "C",
        categoria: "Capacete",
        materiais: { "Aço": 2, "Jade": 1 },
        custoBase: 3800,
        bonusBase: 8,
        descricao: "Um capacete de aço com inserções de jade."
    },

    // =====================================
    // RANK B - Itens raros
    // =====================================
    "B_arma": {
        rank: "B",
        categoria: "Arma",
        materiais: { "Mithril": 2, "Aço": 1 },
        custoBase: 15000,
        bonusBase: 18,
        descricao: "Uma arma de mithril leve e extremamente afiada."
    },
    "B_armadura": {
        rank: "B",
        categoria: "Armadura",
        materiais: { "Adamantium": 2, "Mithril": 1 },
        custoBase: 14000,
        bonusBase: 18,
        descricao: "Uma armadura de adamantium praticamente indestrutível."
    },
    "B_acessorio": {
        rank: "B",
        categoria: "Acessório",
        materiais: { "Oricalco": 2, "Mithril": 1 },
        custoBase: 12000,
        bonusBase: 12,
        descricao: "Um acessório de oricalco pulsante com energia arcana."
    },
    "B_escudo": {
        rank: "B",
        categoria: "Escudo",
        materiais: { "Adamantium": 2, "Aço": 1 },
        custoBase: 13000,
        bonusBase: 18,
        descricao: "Um escudo de adamantium que pode suportar golpes devastadores."
    },
    "B_capacete": {
        rank: "B",
        categoria: "Capacete",
        materiais: { "Mithril": 2, "Oricalco": 1 },
        custoBase: 11000,
        bonusBase: 15,
        descricao: "Um capacete de mithril com propriedades mágicas."
    },

    // =====================================
    // RANK A - Itens épicos
    // =====================================
    "A_arma": {
        rank: "A",
        categoria: "Arma",
        materiais: { "Relicário": 2, "Mithril": 1 },
        custoBase: 50000,
        bonusBase: 30,
        descricao: "Uma arma lendária forjada com relicário e mithril."
    },
    "A_armadura": {
        rank: "A",
        categoria: "Armadura",
        materiais: { "Urano": 2, "Adamantium": 1 },
        custoBase: 48000,
        bonusBase: 30,
        descricao: "Uma armadura de urano com resistência sobre-humana."
    },
    "A_acessorio": {
        rank: "A",
        categoria: "Acessório",
        materiais: { "Mármore Negro": 2, "Oricalco": 1 },
        custoBase: 45000,
        bonusBase: 20,
        descricao: "Um acessório de mármore negro com poder arcano imenso."
    },
    "A_escudo": {
        rank: "A",
        categoria: "Escudo",
        materiais: { "Urano": 2, "Relicário": 1 },
        custoBase: 47000,
        bonusBase: 30,
        descricao: "Um escudo de urano que emana uma aura protetora."
    },
    "A_capacete": {
        rank: "A",
        categoria: "Capacete",
        materiais: { "Relicário": 2, "Urano": 1 },
        custoBase: 44000,
        bonusBase: 25,
        descricao: "Um capacete de relicário que amplifica os sentidos."
    },

    // =====================================
    // RANK S - Itens lendários
    // =====================================
    "S_arma": {
        rank: "S",
        categoria: "Arma",
        materiais: { "Gelo Verdadeiro": 2, "Relicário": 1 },
        custoBase: 200000,
        bonusBase: 50,
        descricao: "Uma arma de gelo verdadeiro que congela a alma dos inimigos."
    },
    "S_armadura": {
        rank: "S",
        categoria: "Armadura",
        materiais: { "Hexita": 2, "Urano": 1 },
        custoBase: 190000,
        bonusBase: 50,
        descricao: "Uma armadura de hexita que distorce a realidade ao redor."
    },
    "S_acessorio": {
        rank: "S",
        categoria: "Acessório",
        materiais: { "Cristais Elementais": 2, "Mármore Negro": 1 },
        custoBase: 180000,
        bonusBase: 35,
        descricao: "Um acessório de cristais elementais com poder infinito."
    },
    "S_escudo": {
        rank: "S",
        categoria: "Escudo",
        materiais: { "Gelo Verdadeiro": 2, "Hexita": 1 },
        custoBase: 185000,
        bonusBase: 50,
        descricao: "Um escudo de gelo verdadeiro intransponível."
    },
    "S_capacete": {
        rank: "S",
        categoria: "Capacete",
        materiais: { "Hexita": 2, "Cristais Elementais": 1 },
        custoBase: 175000,
        bonusBase: 40,
        descricao: "Um capacete de hexita que concede visão além do alcance."
    }
};

// =====================================
// NOMES DE ITENS POR CATEGORIA E RANK
// =====================================
const NOMES_ITENS = {
    "Arma": {
        "E": ["Adaga de Ferro", "Espada de Couro", "Clava de Madeira"],
        "D": ["Espada de Ferro", "Machado de Bronze", "Lança de Aço"],
        "C": ["Lâmina de Aço", "Arco Composto", "Machado de Guerra"],
        "B": ["Lâmina de Mithril", "Arco Élfico", "Machado Rúnico"],
        "A": ["Lâmina Ancestral", "Arco do Apocalipse", "Machado Celestial"],
        "S": ["Excalibur", "Arco do Infinito", "Machado do Fim"]
    },
    "Armadura": {
        "E": ["Túnica de Couro", "Armadura de Couro"],
        "D": ["Armadura de Ferro", "Cota de Malha"],
        "C": ["Armadura de Aço", "Armadura de Placas"],
        "B": ["Armadura de Mithril", "Armadura Élfica"],
        "A": ["Armadura Ancestral", "Armadura Divina"],
        "S": ["Armadura do Infinito", "Armadura Primordial"]
    },
    "Acessório": {
        "E": ["Anel de Cobre", "Colar Simples"],
        "D": ["Anel de Latão", "Brinco de Bronze"],
        "C": ["Anel de Jade", "Amuleto de Ouro"],
        "B": ["Anel de Oricalco", "Amuleto Arcano"],
        "A": ["Anel do Vazio", "Amuleto Celestial"],
        "S": ["Anel do Infinito", "Amuleto Primordial"]
    },
    "Escudo": {
        "E": ["Escudo de Madeira", "Escudo de Couro"],
        "D": ["Escudo de Ferro", "Escudo Pesado"],
        "C": ["Escudo de Aço", "Escudo de Batalha"],
        "B": ["Escudo de Adamantium", "Escudo Rúnico"],
        "A": ["Escudo Ancestral", "Escudo Divino"],
        "S": ["Escudo do Infinito", "Escudo Primordial"]
    },
    "Capacete": {
        "E": ["Capacete de Couro", "Capacete Simples"],
        "D": ["Capacete de Ferro", "Elmo de Bronze"],
        "C": ["Capacete de Aço", "Elmo de Guerra"],
        "B": ["Capacete de Mithril", "Elmo Rúnico"],
        "A": ["Capacete Ancestral", "Elmo Divino"],
        "S": ["Capacete do Infinito", "Elmo Primordial"]
    }
};

// =====================================
// SLOTS DISPONÍVEIS PARA FORJA NACIONAL
// =====================================
const SLOTS_FORJA_NACIONAL = ["Arma", "Acessório", "Capacete", "Armadura", "Escudo"];

// =====================================
// MAPEAMENTO DE ATRIBUTOS DO CATÁLOGO PARA O SISTEMA
// =====================================
const MAPA_ATRIBUTOS_CATALOGO = {
    "Agilidade": "velocidade",
    "Resistência": "resistencia",
    "Inteligência": "inteligencia",
    "Força": "forca",
    "Poder Mágico": "poder_magico",
    "Sorte": "sentidos"
};

// Bônus do Vysache nos itens forjados a partir de materiais
const BONUS_VYSACHE = 1.3; // +30% nos atributos

// =====================================
// CLASSE PRINCIPAL DO SISTEMA DE FORJA
// =====================================
class ForjaSystem {

    // =====================================
    // SISTEMA DE AFINIDADE
    // =====================================

    /**
     * Obtém a afinidade de um jogador com o Vysache
     */
    static async getAfinidade(jogadorId, npcNome = "Vysache") {
        return new Promise((resolve) => {
            db.get(
                "SELECT * FROM npc_afinidade WHERE jogador_id = ? AND npc_nome = ?",
                [jogadorId, npcNome],
                (err, row) => {
                    if (err || !row) {
                        resolve({ afinidade: 0, itens_forjados: 0, forja_nacional_disponivel: 0 });
                    } else {
                        resolve({
                            afinidade: row.afinidade || 0,
                            itens_forjados: row.itens_forjados || 0,
                            forja_nacional_disponivel: row.forja_nacional_disponivel || 0
                        });
                    }
                }
            );
        });
    }

    /**
     * Cria ou atualiza o registro de afinidade do jogador
     */
    static async setAfinidade(jogadorId, npcNome, afinidade, itensForjados, forjaNacionalDisp) {
        return new Promise((resolve) => {
            db.run(
                `INSERT OR REPLACE INTO npc_afinidade (jogador_id, npc_nome, afinidade, itens_forjados, forja_nacional_disponivel, data_ultima_forja)
                 VALUES (?, ?, ?, ?, ?, datetime('now'))`,
                [jogadorId, npcNome, afinidade, itensForjados, forjaNacionalDisp],
                (err) => resolve(!err)
            );
        });
    }

    /**
     * Aumenta a afinidade em 1% após cada item forjado
     * Ao chegar a 100%, libera a Forja Nacional
     */
    static async aumentarAfinidade(jogadorId, npcNome = "Vysache") {
        const afinidadeAtual = await this.getAfinidade(jogadorId, npcNome);
        let novaAfinidade = Math.min(100, afinidadeAtual.afinidade + 1);
        let novosItensForjados = afinidadeAtual.itens_forjados + 1;
        let forjaNacionalDisp = afinidadeAtual.forja_nacional_disponivel;

        // Ao atingir 100%, libera a forja nacional
        if (novaAfinidade >= 100 && afinidadeAtual.afinidade < 100) {
            forjaNacionalDisp = 1;
        }

        await this.setAfinidade(jogadorId, npcNome, novaAfinidade, novosItensForjados, forjaNacionalDisp);

        return {
            afinidade: novaAfinidade,
            itens_forjados: novosItensForjados,
            forja_nacional_disponivel: forjaNacionalDisp,
            atingiu_100: novaAfinidade >= 100 && afinidadeAtual.afinidade < 100
        };
    }

    // =====================================
    // SISTEMA DE SESSÕES DE FORJA
    // =====================================

    /**
     * Cria uma nova sessão de forja para o jogador
     */
    static async criarSessao(jogadorId, npcNome = "Vysache") {
        return new Promise((resolve) => {
            // Remove sessões anteriores ativas
            db.run(
                "DELETE FROM forja_sessoes WHERE jogador_id = ? AND etapa != 'concluida'",
                [jogadorId],
                () => {
                    db.run(
                        `INSERT INTO forja_sessoes (jogador_id, npc_nome, etapa, data_criacao, data_atualizacao)
                         VALUES (?, ?, 'aguardando_materiais', datetime('now'), datetime('now'))`,
                        [jogadorId, npcNome],
                        function (err) {
                            resolve(err ? null : this.lastID);
                        }
                    );
                }
            );
        });
    }

    /**
     * Busca a sessão ativa do jogador
     */
    static async getSessao(jogadorId) {
        return new Promise((resolve) => {
            db.get(
                "SELECT * FROM forja_sessoes WHERE jogador_id = ? AND etapa != 'concluida' ORDER BY id DESC LIMIT 1",
                [jogadorId],
                (err, row) => resolve(err ? null : row)
            );
        });
    }

    /**
     * Atualiza a etapa da sessão
     */
    static async atualizarSessao(sessaoId, dados) {
        return new Promise((resolve) => {
            const campos = [];
            const valores = [];
            for (const [chave, valor] of Object.entries(dados)) {
                campos.push(`${chave} = ?`);
                valores.push(valor);
            }
            campos.push("data_atualizacao = datetime('now')");
            valores.push(sessaoId);

            db.run(
                `UPDATE forja_sessoes SET ${campos.join(", ")} WHERE id = ?`,
                valores,
                (err) => resolve(!err)
            );
        });
    }

    /**
     * Encerra a sessão de forja
     */
    static async encerrarSessao(sessaoId) {
        return this.atualizarSessao(sessaoId, { etapa: "concluida" });
    }

    // =====================================
    // SISTEMA DE COMBINAÇÕES
    // =====================================

    /**
     * Analisa os materiais enviados pelo jogador e encontra combinações possíveis
     * no catálogo de forja (Ligas: Material × Material + Forjados: Material × Núcleo)
     */
    static analisarMateriais(materiaisTexto) {
        // Parsear os materiais do texto enviado
        const materiais = this.parsearMateriais(materiaisTexto);

        if (Object.keys(materiais).length === 0) {
            return { erro: "Nenhum material válido encontrado. Verifique o formato da ficha." };
        }

        // Carregar catálogo
        const catalogo = this.carregarCatalogo();
        if (!catalogo) {
            return { erro: "Erro ao carregar o catálogo de forja. Tente novamente." };
        }

        const valoresMateriais = {};
        for (const m of (catalogo.materiais || [])) {
            valoresMateriais[m.nome.toLowerCase().trim()] = m;
        }

        // Buscar combinações no catálogo que correspondem aos materiais enviados
        const combinacoesEncontradas = [];

        // Verificar Ligas (Material × Material)
        for (const item of catalogo.ligas) {
            const mat1Lower = item.material1.toLowerCase().trim();
            const mat2Lower = item.material2.toLowerCase().trim();

            // Encontrar os materiais enviados pelo jogador
            const mat1Jogador = this.buscarMaterial(materiais, item.material1);
            const mat2Jogador = this.buscarMaterial(materiais, item.material2);

            if (mat1Jogador && mat2Jogador) {
                const info1 = valoresMateriais[mat1Lower];
                const info2 = valoresMateriais[mat2Lower];
                const custoMateriais = (info1 ? info1.preco : 0) + (info2 ? info2.preco : 0);
                const precoCatalogo = item.preco || Math.floor(custoMateriais * 1.6);

                combinacoesEncontradas.push({
                    chave: `liga_${item.nome}`,
                    rank: item.rank,
                    categoria: item.slot,
                    custo: precoCatalogo,
                    descricao: item.descricao,
                    materiais_necessarios: { [item.material1]: 1, [item.material2]: 1 },
                    itemCatalogo: item
                });
            }
        }

        // Verificar Forjados (Material × Núcleo)
        for (const item of catalogo.forjados) {
            const matJogador = this.buscarMaterial(materiais, item.material);
            // Procurar núcleo nos materiais enviados (ex: "Núcleo Branco", "Nucleo Branco", "Branco")
            const nucleoJogador = this.buscarMaterial(materiais, `Núcleo ${item.nucleoCor}`) ||
                                 this.buscarMaterial(materiais, `Nucleo ${item.nucleoCor}`) ||
                                 this.buscarMaterial(materiais, `núcleo ${item.nucleoCor}`) ||
                                 this.buscarMaterial(materiais, `nucleo ${item.nucleoCor}`) ||
                                 this.buscarMaterial(materiais, item.nucleoCor);

            if (matJogador && nucleoJogador) {
                const infoMat = valoresMateriais[item.material.toLowerCase().trim()];
                const valorNucleo = {
                    "Branco": 5000, "Amarelo": 7500, "Verde": 10000,
                    "Azul": 15000, "Vermelho": 20000, "Roxo": 30000
                }[item.nucleoCor] || 0;
                const custoMateriais = (infoMat ? infoMat.preco : 0) + valorNucleo;
                const precoCatalogo = item.preco || Math.floor(custoMateriais * 1.6);

                combinacoesEncontradas.push({
                    chave: `forjado_${item.nome}`,
                    rank: item.rank,
                    categoria: item.slot,
                    custo: precoCatalogo,
                    descricao: item.descricao,
                    materiais_necessarios: { [item.material]: 1, [`Núcleo ${item.nucleoCor}`]: 1 },
                    itemCatalogo: item
                });
            }
        }

        if (combinacoesEncontradas.length === 0) {
            return {
                erro: "Vysache analisa os materiais e balança a cabeça.\n\n\"Hmmm... Esses materiais não formam nenhuma combinação que eu conheça. Tente trazer materiais diferentes.\"",
                materiais_recebidos: materiais
            };
        }

        return {
            sucesso: true,
            combinacoes: combinacoesEncontradas,
            materiais_recebidos: materiais
        };
    }

    /**
     * Verifica se os materiais do jogador cobrem os necessários
     */
    static verificarMateriais(materiaisJogador, materiaisNecessarios) {
        for (const [material, quantidade] of Object.entries(materiaisNecessarios)) {
            const materialEncontrado = this.buscarMaterial(materiaisJogador, material);
            if (!materialEncontrado || materialEncontrado.quantidade < quantidade) {
                return false;
            }
        }
        return true;
    }

    /**
     * Busca um material no objeto do jogador (com tolerância a variações)
     * Usa word boundaries para evitar falsos positivos (ex: "ouro" em "couro")
     */
    static buscarMaterial(materiaisJogador, nomeMaterial) {
        const nomeLower = nomeMaterial.toLowerCase().trim();
        // Normalizar acentos para comparação
        const normalizar = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const nomeNorm = normalizar(nomeLower);

        for (const [chave, dados] of Object.entries(materiaisJogador)) {
            const chaveLower = chave.toLowerCase().trim();
            const chaveNorm = normalizar(chaveLower);

            // Match exato (ignorando acentos e capitalização)
            if (chaveNorm === nomeNorm) {
                return { nome: chave, quantidade: dados };
            }

            // Match se o material do jogador contém o nome procurado como palavra inteira
            // Ex: "Núcleo Branco" contém "Branco", mas "Couro" NÃO contém "ouro"
            const regex = new RegExp(`\\b${nomeNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
            if (regex.test(chaveNorm)) {
                return { nome: chave, quantidade: dados };
            }

            // Match se o nome procurado contém o material do jogador como palavra inteira
            // Ex: procurando "Núcleo Branco" e jogador enviou "Branco"
            const regexInv = new RegExp(`\\b${chaveNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
            if (regexInv.test(nomeNorm)) {
                return { nome: chave, quantidade: dados };
            }
        }
        return null;
    }

    /**
     * Normaliza o nome de um material para comparações entre o catálogo
     * e os nomes efetivamente guardados no inventário.
     */
    static normalizarNomeMaterial(nome) {
        return String(nome || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    /**
     * Confere se um item do inventário corresponde a um material do catálogo.
     * A igualdade exata tem prioridade. A comparação por palavras inteiras
     * aceita variantes como "Núcleo de Monstro Branco", sem confundir "Ouro"
     * com "Couro".
     */
    static itemCorrespondeAoMaterial(nomeItem, nomeMaterial) {
        const itemNormalizado = this.normalizarNomeMaterial(nomeItem);
        const materialNormalizado = this.normalizarNomeMaterial(nomeMaterial);

        if (!itemNormalizado || !materialNormalizado) return false;
        if (itemNormalizado === materialNormalizado) return true;

        const materialEscapado = materialNormalizado.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (new RegExp(`\\b${materialEscapado}\\b`).test(itemNormalizado)) return true;

        const palavrasMaterial = materialNormalizado
            .split(" ")
            .filter(palavra => !["de", "da", "do", "dos", "das"].includes(palavra));
        const palavrasItem = new Set(itemNormalizado.split(" "));
        return palavrasMaterial.length > 0 && palavrasMaterial.every(palavra => palavrasItem.has(palavra));
    }

    /**
     * Monta uma reserva de materiais usando somente o inventário real.
     * Nenhum item é removido nesta etapa; a remoção ocorre de forma atômica
     * apenas depois da confirmação da forja.
     */
    static async prepararConsumoMateriais(jogadorId, materiaisNecessarios) {
        const necessidades = Object.entries(materiaisNecessarios || {})
            .filter(([, quantidade]) => Number(quantidade) > 0)
            .map(([nome, quantidade]) => ({ nome, quantidade: Number(quantidade) }));

        if (necessidades.length === 0) {
            return { sucesso: false, faltantes: ["combinação de materiais inválida"] };
        }

        const itensInventario = await new Promise((resolve) => {
            db.all(
                `SELECT inv.id AS inventario_id, inv.item_id, inv.quantidade, i.nome
                 FROM inventario_jogador inv
                 JOIN itens i ON i.id = inv.item_id
                 WHERE inv.jogador_id = ? AND inv.quantidade > 0`,
                [jogadorId],
                (err, rows) => resolve(err ? [] : rows || [])
            );
        });

        const disponivelPorLinha = new Map(
            itensInventario.map(item => [item.inventario_id, Number(item.quantidade)])
        );
        const consumos = [];
        const faltantes = [];

        for (const necessidade of necessidades) {
            let restante = necessidade.quantidade;
            const candidatos = itensInventario
                .filter(item => this.itemCorrespondeAoMaterial(item.nome, necessidade.nome))
                .sort((a, b) => {
                    const aExato = this.normalizarNomeMaterial(a.nome) === this.normalizarNomeMaterial(necessidade.nome);
                    const bExato = this.normalizarNomeMaterial(b.nome) === this.normalizarNomeMaterial(necessidade.nome);
                    return Number(bExato) - Number(aExato);
                });

            for (const item of candidatos) {
                const quantidadeDisponivel = disponivelPorLinha.get(item.inventario_id) || 0;
                if (quantidadeDisponivel <= 0 || restante <= 0) continue;

                const quantidadeUsada = Math.min(quantidadeDisponivel, restante);
                consumos.push({
                    inventarioId: item.inventario_id,
                    itemId: item.item_id,
                    nome: item.nome,
                    quantidade: quantidadeUsada
                });
                disponivelPorLinha.set(item.inventario_id, quantidadeDisponivel - quantidadeUsada);
                restante -= quantidadeUsada;
            }

            if (restante > 0) faltantes.push(`${necessidade.nome} x${restante}`);
        }

        return faltantes.length > 0
            ? { sucesso: false, faltantes }
            : { sucesso: true, consumos };
    }

    /**
     * Remove a reserva de materiais com verificação de quantidade dentro de
     * uma transação SQLite. Se algum item mudou entre a conferência e a
     * confirmação, nada é consumido.
     */
    static async consumirMateriaisReservados(consumos) {
        if (!Array.isArray(consumos) || consumos.length === 0) return false;

        return new Promise((resolve) => {
            db.serialize(() => {
                db.run("BEGIN IMMEDIATE", (erroInicio) => {
                    if (erroInicio) return resolve(false);

                    let indice = 0;
                    let finalizado = false;
                    const finalizar = (sucesso) => {
                        if (finalizado) return;
                        finalizado = true;
                        db.run(sucesso ? "COMMIT" : "ROLLBACK", () => resolve(sucesso));
                    };

                    const consumirProximo = () => {
                        if (indice >= consumos.length) return finalizar(true);
                        const consumo = consumos[indice++];

                        db.run(
                            `UPDATE inventario_jogador
                             SET quantidade = quantidade - ?
                             WHERE id = ? AND quantidade >= ?`,
                            [consumo.quantidade, consumo.inventarioId, consumo.quantidade],
                            function (erro) {
                                if (erro || this.changes !== 1) return finalizar(false);
                                db.run(
                                    "DELETE FROM inventario_jogador WHERE id = ? AND quantidade <= 0",
                                    [consumo.inventarioId],
                                    (erroDelete) => erroDelete ? finalizar(false) : consumirProximo()
                                );
                            }
                        );
                    };

                    consumirProximo();
                });
            });
        });
    }

    /** Restaura materiais se a criação do item falhar depois do consumo. */
    static async restaurarMateriais(jogadorId, consumos) {
        for (const consumo of consumos || []) {
            const restaurado = await InventorySystem.adicionarItem(jogadorId, consumo.itemId, consumo.quantidade);
            if (!restaurado) return false;
        }
        return true;
    }

    static resumirMateriaisConsumidos(consumos) {
        return (consumos || []).reduce((materiais, consumo) => {
            materiais[consumo.nome] = (materiais[consumo.nome] || 0) + consumo.quantidade;
            return materiais;
        }, {});
    }

    /**
     * Parseia o texto de materiais enviado pelo jogador
     * Formato esperado:
     * Material: Ferro
     * Quantidade: 3
     * 
     * Material: Couro
     * Quantidade: 2
     */
    static parsearMateriais(texto) {
        const materiais = {};
        const linhas = texto.split("\n");
        let materialAtual = null;

        for (const linha of linhas) {
            const linhaTrim = linha.trim();
            if (!linhaTrim) continue;

            // Remover formatação
            const linhaLimpa = linhaTrim.replace(/[*_>\-]/g, "").trim();
            const partes = linhaLimpa.split(":");

            if (partes.length >= 2) {
                const chave = partes[0].trim().toLowerCase();
                const valor = partes.slice(1).join(":").trim();

                if (chave === "material" || chave === "material") {
                    materialAtual = valor;
                } else if (chave === "quantidade" || chave === "qtd") {
                    const qtd = parseInt(valor) || 1;
                    if (materialAtual) {
                        materiais[materialAtual] = qtd;
                        materialAtual = null;
                    }
                }
            }
        }

        // Também suporta formato "Material: Quantidade" em uma linha
        if (Object.keys(materiais).length === 0) {
            for (const linha of linhas) {
                const linhaTrim = linha.trim();
                if (!linhaTrim) continue;
                const linhaLimpa = linhaTrim.replace(/[*_>\-]/g, "").trim();
                const partes = linhaLimpa.split(":");
                if (partes.length >= 2) {
                    const nome = partes[0].trim();
                    const qtd = parseInt(partes[1].trim()) || 1;
                    if (nome && !nome.toLowerCase().includes("material") && !nome.toLowerCase().includes("quantidade")) {
                        materiais[nome] = qtd;
                    }
                }
            }
        }

        return materiais;
    }

    // =====================================
    // SISTEMA DE CRIAÇÃO DE ITENS
    // =====================================

    /**
     * Gera um item baseado na combinação escolhida
     * O Vysache decide qual slot/categoria do item (não o jogador)
     * 40% chance de ser da proficiência do player, 60% para qualquer outro slot
     */
    static gerarItemForja(combinacao, jogador) {
        const rank = combinacao.rank;
        const categoria = combinacao.categoria;
        const bonusBase = combinacao.bonusBase || 5;

        // Determinar o nome do item
        const nomesDisponiveis = NOMES_ITENS[categoria]?.[rank] || ["Item Forjado"];
        const nomeItem = nomesDisponiveis[Math.floor(Math.random() * nomesDisponiveis.length)];

        // Gerar bônus de atributos aleatoriamente
        const atributos = ["forca", "resistencia", "velocidade", "sentidos", "inteligencia", "poder_magico"];
        const bonus = {
            forca: 0,
            resistencia: 0,
            velocidade: 0,
            sentidos: 0,
            inteligencia: 0,
            poder_magico: 0
        };

        // Distribuir bônus base em 2-3 atributos aleatórios
        const numAtributos = Math.floor(Math.random() * 2) + 2; // 2 ou 3 atributos
        const atributosEscolhidos = [];
        while (atributosEscolhidos.length < numAtributos) {
            const atr = atributos[Math.floor(Math.random() * atributos.length)];
            if (!atributosEscolhidos.includes(atr)) {
                atributosEscolhidos.push(atr);
            }
        }

        let bonusRestante = bonusBase;
        for (let i = 0; i < atributosEscolhidos.length; i++) {
            if (i === atributosEscolhidos.length - 1) {
                bonus[atributosEscolhidos[i]] = bonusRestante;
            } else {
                const parte = Math.floor(bonusRestante / (numAtributos - i));
                bonus[atributosEscolhidos[i]] = parte;
                bonusRestante -= parte;
            }
        }

        // Determinar flags de categoria
        const isArma = categoria === "Arma" ? 1 : 0;
        const isArmadura = categoria === "Armadura" ? 1 : 0;
        const isEscudo = categoria === "Escudo" ? 1 : 0;
        const isAcessorio = categoria === "Acessório" ? 1 : 0;
        const isCapacete = categoria === "Capacete" ? 1 : 0;

        // Mapear capacete para categoria Cabeça
        const categoriaFinal = isCapacete ? "Cabeça" : categoria;

        return {
            nome: nomeItem,
            categoria: categoriaFinal,
            rank: rank,
            descricao: combinacao.descricao,
            isArma,
            isArmadura,
            isEscudo,
            isAcessorio,
            isConsumivel: 0,
            bonus: bonus,
            efeito: this.gerarEfeitoEspecial(rank, categoria)
        };
    }

    /**
     * Gera um efeito especial baseado no rank
     */
    static gerarEfeitoEspecial(rank, categoria) {
        const efeitos = {
            "E": ["Aumenta levemente a resistência física.", "Melhora a durabilidade em combate."],
            "D": ["Concede +5% de resistência contra ataques físicos.", "Aumenta a recuperação de stamina."],
            "C": ["Concede +10% de resistência elemental.", "Aumenta a precisão em combate."],
            "B": ["Concede +15% de dano contra monstros.", "Reduz dano recebido em 10%."],
            "A": ["Concede +25% de poder em combate.", "Emana aura protetora que reduz dano mágico em 20%."],
            "S": ["Concede +50% de poder total.", "O item pulsa com energia primordial, concedendo regeneração passiva."]
        };

        const listaEfeitos = efeitos[rank] || efeitos["E"];
        return listaEfeitos[Math.floor(Math.random() * listaEfeitos.length)];
    }

    /**
     * Gera um item a partir do catálogo de forja com o bônus de +30% do Vysache
     */
    static gerarItemDoCatalogo(itemCatalogo) {
        const bonus = {
            forca: 0,
            resistencia: 0,
            velocidade: 0,
            sentidos: 0,
            inteligencia: 0,
            poder_magico: 0
        };

        // Aplicar +30% nos atributos do catálogo
        const aplicarBonus = (nomeAtributo, valor) => {
            const chaveMap = {
                "Agilidade": "velocidade",
                "Resistência": "resistencia",
                "Inteligência": "inteligencia",
                "Força": "forca",
                "Poder Mágico": "poder_magico",
                "Sorte": "sentidos"
            };
            const chave = chaveMap[nomeAtributo];
            if (chave && valor) {
                bonus[chave] = Math.floor(valor * BONUS_VYSACHE);
            }
        };

        if (itemCatalogo.atributo1 && itemCatalogo.valor1) {
            aplicarBonus(itemCatalogo.atributo1, itemCatalogo.valor1);
        }
        if (itemCatalogo.atributo2 && itemCatalogo.valor2) {
            aplicarBonus(itemCatalogo.atributo2, itemCatalogo.valor2);
        }

        // Determinar flags de categoria baseado no slot do catálogo
        const slot = itemCatalogo.slot || "";
        const isArma = (slot === "Arma 1" || slot === "Arma 2") ? 1 : 0;
        const isArmadura = slot === "Corpo" ? 1 : 0;
        const isEscudo = 0;
        const isAcessorio = slot === "Acessório" ? 1 : 0;
        const isConsumivel = 0;

        // Categoria final para o sistema de slots do inventário
        let categoriaFinal = slot;
        if (slot === "Acessório") categoriaFinal = "Acessórios";
        if (slot === "Arma 1") categoriaFinal = "Arma 1";
        if (slot === "Arma 2") categoriaFinal = "Arma 2";

        return {
            nome: itemCatalogo.nome,
            categoria: categoriaFinal,
            rank: itemCatalogo.rank,
            descricao: itemCatalogo.descricao,
            isArma,
            isArmadura,
            isEscudo,
            isAcessorio,
            isConsumivel,
            bonus,
            efeito: "Item forjado por Vysache: Bônus de +30% nos atributos sobre o catálogo de forja.",
            itemCatalogo: itemCatalogo
        };
    }

    /**
     * Cria o item no banco de dados e adiciona ao inventário do jogador
     */
    static async criarItemNoBanco(jogadorId, dadosItem) {
        // Verificar se o item já existe
        const itemExistente = await new Promise((resolve) => {
            db.get("SELECT * FROM itens WHERE LOWER(nome) = LOWER(?)", [dadosItem.nome], (err, row) => resolve(row));
        });

        let itemId;

        if (itemExistente) {
            itemId = itemExistente.id;
        } else {
            // Criar novo item
            itemId = await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO itens (nome, categoria, tier, descricao, arma, armadura, escudo, acessorio, consumivel,
                     forca_bonus, resistencia_bonus, velocidade_bonus, sentidos_bonus, inteligencia_bonus, poder_magico_bonus, efeito)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        dadosItem.nome,
                        dadosItem.categoria,
                        dadosItem.rank,
                        dadosItem.descricao,
                        dadosItem.isArma,
                        dadosItem.isArmadura,
                        dadosItem.isEscudo,
                        dadosItem.isAcessorio,
                        dadosItem.isConsumivel,
                        dadosItem.bonus.forca,
                        dadosItem.bonus.resistencia,
                        dadosItem.bonus.velocidade,
                        dadosItem.bonus.sentidos,
                        dadosItem.bonus.inteligencia,
                        dadosItem.bonus.poder_magico,
                        dadosItem.efeito
                    ],
                    function (err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });
        }

        if (!itemId) return null;

        // Adicionar ao inventário. A forja só é considerada concluída se a
        // entrega funcionar; assim os materiais e os Wons podem ser reembolsados.
        const itemAdicionado = await InventorySystem.adicionarItem(jogadorId, itemId, 1);
        if (!itemAdicionado) return null;

        return { itemId, nome: dadosItem.nome };
    }

    /**
     * Registra a forja no histórico
     */
    static async registrarHistorico(jogadorId, npcNome, materiaisUsados, itemNome, itemCategoria, itemRank, custo, tipoForja = "normal") {
        return new Promise((resolve) => {
            db.run(
                `INSERT INTO forja_historico (jogador_id, npc_nome, materiais_usados, item_nome, item_categoria, item_rank, custo, tipo_forja, data)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                [jogadorId, npcNome, JSON.stringify(materiaisUsados), itemNome, itemCategoria, itemRank, custo, tipoForja],
                (err) => resolve(!err)
            );
        });
    }

    // =====================================
    // FORJA NACIONAL
    // =====================================

    /**
     * Gera um item de nível nacional (quando afinidade = 100%)
     * O Vysache decide qual slot/categoria do item
     * 40% chance de ser da proficiência do player, 60% para qualquer outro slot
     */
    static gerarItemNacional(jogador) {
        // Determinar a proficiência do jogador (classe)
        const classeJogador = (jogador.classe || "").toLowerCase();
        const proficiencia = this.getProficienciaClasse(classeJogador);

        // 40% chance de ser da proficiência, 60% para qualquer outro slot
        let categoriaEscolhida;
        const roll = Math.random() * 100;

        if (roll < 40) {
            // 40% - proficiência do player
            categoriaEscolhida = proficiencia;
        } else {
            // 60% - qualquer outro slot (excluindo a proficiência)
            const outrosSlots = SLOTS_FORJA_NACIONAL.filter(s => s !== proficiencia);
            categoriaEscolhida = outrosSlots[Math.floor(Math.random() * outrosSlots.length)];
        }

        // Gerar nome do item nacional
        const prefixos = ["Nacional", "Imperial", "Real", "Soberano", "Supremo"];
        const prefixo = prefixos[Math.floor(Math.random() * prefixos.length)];

        const nomesBase = {
            "Arma": ["Lâmina", "Arco", "Machado", "Lança", "Cetro"],
            "Acessório": ["Anel", "Amuleto", "Brinco", "Colar", "Diadema"],
            "Capacete": ["Elmo", "Coroa", "Capacete", "Tiara"],
            "Armadura": ["Armadura", "Cota", "Placa", "Couraça"],
            "Escudo": ["Escudo", "Broquel", "Aegis"]
        };

        const nomes = nomesBase[categoriaEscolhida] || ["Artefato"];
        const nomeBase = nomes[Math.floor(Math.random() * nomes.length)];
        const nomeItem = `[Nacional] ${prefixo} ${nomeBase} de ${jogador.nome || "Lendário"}`;

        // Bônus massivos para item nacional
        const bonusNacional = 80; // Bônus base muito alto
        const atributos = ["forca", "resistencia", "velocidade", "sentidos", "inteligencia", "poder_magico"];

        const bonus = {
            forca: 0,
            resistencia: 0,
            velocidade: 0,
            sentidos: 0,
            inteligencia: 0,
            poder_magico: 0
        };

        // Distribuir em 3-4 atributos
        const numAtributos = Math.floor(Math.random() * 2) + 3;
        const atributosEscolhidos = [];
        while (atributosEscolhidos.length < numAtributos) {
            const atr = atributos[Math.floor(Math.random() * atributos.length)];
            if (!atributosEscolhidos.includes(atr)) {
                atributosEscolhidos.push(atr);
            }
        }

        let bonusRestante = bonusNacional;
        for (let i = 0; i < atributosEscolhidos.length; i++) {
            if (i === atributosEscolhidos.length - 1) {
                bonus[atributosEscolhidos[i]] = bonusRestante;
            } else {
                const parte = Math.floor(bonusRestante / (numAtributos - i));
                bonus[atributosEscolhidos[i]] = parte;
                bonusRestante -= parte;
            }
        }

        // Determinar flags
        const isArma = categoriaEscolhida === "Arma" ? 1 : 0;
        const isArmadura = categoriaEscolhida === "Armadura" ? 1 : 0;
        const isEscudo = categoriaEscolhida === "Escudo" ? 1 : 0;
        const isAcessorio = categoriaEscolhida === "Acessório" ? 1 : 0;
        const isCapacete = categoriaEscolhida === "Capacete" ? 1 : 0;

        const categoriaFinal = isCapacete ? "Cabeça" : categoriaEscolhida;

        return {
            nome: nomeItem,
            categoria: categoriaFinal,
            rank: "S",
            descricao: `Um item de nível nacional forjado por Vysache. Este artefato foi criado com maestria suprema, superando qualquer item comum. Uma obra-prima que carrega o nome de ${jogador.nome || "seso portador"}.`,
            isArma,
            isArmadura,
            isEscudo,
            isAcessorio,
            isConsumivel: 0,
            bonus: bonus,
            efeito: "Item Nacional: Concede +50% de poder total e regeneração passiva de vida e mana. Este item é uma obra-prima lendária.",
            tipoForja: "nacional"
        };
    }

    /**
     * Retorna a proficiência de forja baseada na classe do jogador
     */
    static getProficienciaClasse(classe) {
        const mapaProficiencia = {
            "lutador": "Arma",
            "assassino": "Arma",
            "tanker": "Escudo",
            "ranger": "Arma",
            "curador": "Acessório",
            "mago elemental": "Acessório",
            "mago invocador": "Acessório",
            "mago de barreira": "Acessório",
            "mago de maldicao": "Acessório",
            "mago de maldição": "Acessório"
        };

        return mapaProficiencia[classe] || "Arma";
    }

    // =====================================
    // SISTEMA DE CUSTO
    // =====================================

    /**
     * Calcula o custo final da forja baseado na afinidade
     * Quanto maior a afinidade, maior o desconto
     */
    static calcularCustoFinal(custoBase, afinidade) {
        const desconto = Math.floor((afinidade / 100) * 30); // Até 30% de desconto
        return Math.floor(custoBase * (1 - desconto / 100));
    }

    // =====================================
    // FLUXO PRINCIPAL DE FORJA
    // =====================================

    /**
     * Executa a forja do item
     */
    static async executarForja(jogadorId, combinacao, jogador, npcNome = "Vysache") {
        if (!combinacao || !combinacao.materiais_necessarios) {
            return { erro: "A combinação de materiais desta forja é inválida." };
        }

        // A ficha enviada na conversa serve para Vysache identificar a receita.
        // A disponibilidade e o consumo sempre usam o inventário real do jogador.
        const reservaMateriais = await this.prepararConsumoMateriais(jogadorId, combinacao.materiais_necessarios);
        if (!reservaMateriais.sucesso) {
            return {
                erro: `Materiais insuficientes no inventário: ${reservaMateriais.faltantes.join(", ")}.`,
                faltantes: reservaMateriais.faltantes
            };
        }

        // Verificar saldo
        const afinidadeInfo = await this.getAfinidade(jogadorId, npcNome);
        const custoFinal = this.calcularCustoFinal(combinacao.custo, afinidadeInfo.afinidade);

        const saldo = await EconomySystem.getSaldo(jogadorId);
        if (saldo < custoFinal) {
            return {
                erro: `Saldo insuficiente! Você precisa de ${custoFinal} Wons para esta forja.`,
                custo: custoFinal,
                saldo: saldo
            };
        }

        // Gerar o item
        // Se a combinação veio do catálogo de forja (com itemCatalogo), gerar item do catálogo com +30%
        let dadosItem;
        if (combinacao.itemCatalogo) {
            dadosItem = this.gerarItemDoCatalogo(combinacao.itemCatalogo);
        } else {
            dadosItem = this.gerarItemForja(combinacao, jogador);
        }

        // Debitar o custo
        const debitado = await EconomySystem.removerWon(jogadorId, custoFinal, `Forja por ${npcNome}: ${dadosItem.nome}`);

        if (!debitado) {
            return { erro: "Erro ao debitar o valor da forja." };
        }

        const materiaisConsumidos = await this.consumirMateriaisReservados(reservaMateriais.consumos);
        if (!materiaisConsumidos) {
            await EconomySystem.adicionarWon(jogadorId, custoFinal, "Reembolso: materiais indisponíveis para forja");
            return { erro: "Os materiais não estavam mais disponíveis no inventário. Seus Wons foram reembolsados." };
        }

        // Criar item no banco e adicionar ao inventário
        let resultadoItem;
        try {
            resultadoItem = await this.criarItemNoBanco(jogadorId, dadosItem);
        } catch (erro) {
            resultadoItem = null;
        }

        if (!resultadoItem) {
            // Reembolsar se falhar
            await EconomySystem.adicionarWon(jogadorId, custoFinal, "Reembolso de forja falha");
            await this.restaurarMateriais(jogadorId, reservaMateriais.consumos);
            return { erro: "Erro ao criar o item. Seus Wons e materiais foram reembolsados." };
        }

        // Aumentar afinidade
        const afinidadeResult = await this.aumentarAfinidade(jogadorId, npcNome);

        // Registrar histórico
        await this.registrarHistorico(
            jogadorId, npcNome,
            this.resumirMateriaisConsumidos(reservaMateriais.consumos),
            dadosItem.nome, dadosItem.categoria, dadosItem.rank,
            custoFinal, "normal"
        );

        return {
            sucesso: true,
            item: dadosItem,
            itemId: resultadoItem.itemId,
            custo: custoFinal,
            afinidade: afinidadeResult,
            materiaisConsumidos: this.resumirMateriaisConsumidos(reservaMateriais.consumos)
        };
    }

    /**
     * Executa a Forja Nacional
     */
    static async executarForjaNacional(jogadorId, jogador, npcNome = "Vysache") {
        // Verificar se a forja nacional está disponível
        const afinidadeInfo = await this.getAfinidade(jogadorId, npcNome);

        if (afinidadeInfo.afinidade < 100 || afinidadeInfo.forja_nacional_disponivel < 1) {
            return {
                erro: "A Forja Nacional não está disponível. Você precisa atingir 100% de afinidade com Vysache."
            };
        }

        // Custo da forja nacional
        const custoNacional = 500000;
        const saldo = await EconomySystem.getSaldo(jogadorId);

        if (saldo < custoNacional) {
            return {
                erro: `Saldo insuficiente! A Forja Nacional custa ${custoNacional} Wons.`,
                custo: custoNacional,
                saldo: saldo
            };
        }

        // Gerar item nacional
        const dadosItem = this.gerarItemNacional(jogador);

        // Debitar custo
        const debitado = await EconomySystem.removerWon(jogadorId, custoNacional, `Forja Nacional por ${npcNome}: ${dadosItem.nome}`);

        if (!debitado) {
            return { erro: "Erro ao debitar o valor da forja nacional." };
        }

        // Criar item no banco
        const resultadoItem = await this.criarItemNoBanco(jogadorId, dadosItem);

        if (!resultadoItem) {
            await EconomySystem.adicionarWon(jogadorId, custoNacional, "Reembolso de forja nacional falha");
            return { erro: "Erro ao criar o item nacional. Você foi reembolsado." };
        }

        // Consumir a forja nacional disponível
        await this.setAfinidade(
            jogadorId, npcNome,
            afinidadeInfo.afinidade,
            afinidadeInfo.itens_forjados,
            0 // forja_nacional_disponivel = 0 (consumido)
        );

        // Registrar histórico
        await this.registrarHistorico(
            jogadorId, npcNome,
            { "Materiais Especiais": "N/A" },
            dadosItem.nome, dadosItem.categoria, "S (Nacional)",
            custoNacional, "nacional"
        );

        return {
            sucesso: true,
            item: dadosItem,
            itemId: resultadoItem.itemId,
            custo: custoNacional
        };
    }

    // =====================================
    // CONSULTAS
    // =====================================

    /**
     * Lista o histórico de forjas do jogador
     */
    static async getHistorico(jogadorId, limite = 10) {
        return new Promise((resolve) => {
            db.all(
                "SELECT * FROM forja_historico WHERE jogador_id = ? ORDER BY data DESC LIMIT ?",
                [jogadorId, limite],
                (err, rows) => resolve(err ? [] : (rows || []))
            );
        });
    }

    /**
     * Lista todas as combinações disponíveis (para guia)
     */
    static getCombinacoesDisponiveis() {
        const lista = [];
        for (const [chave, comb] of Object.entries(COMBINACOES_MATERIAIS)) {
            lista.push({
                rank: comb.rank,
                categoria: comb.categoria,
                materiais: comb.materiais,
                custo: comb.custoBase
            });
        }
        return lista;
    }

    // =====================================
    // CATÁLOGO DE FORJA (Ligas + Materiais x Nucleos)
    // =====================================

    /**
     * Carrega o catalogo de forja do arquivo JSON
     */
    static carregarCatalogo() {
        try {
            const fs = require("fs");
            const path = require("path");
            const caminho = path.join(__dirname, "..", "database", "forja_catalogo.json");
            const dados = JSON.parse(fs.readFileSync(caminho, "utf8"));
            return dados;
        } catch (e) {
            console.error("Erro ao carregar catalogo de forja:", e.message);
            return null;
        }
    }

    /**
     * Busca itens do catalogo por slot e rank
     */
    static buscarCatalogoPorSlot(slot, rank = null, tipo = null, limite = 20) {
        const catalogo = this.carregarCatalogo();
        if (!catalogo) return [];

        let itens = [...catalogo.ligas, ...catalogo.forjados];

        // Filtrar por slot
        itens = itens.filter(i => i.slot === slot);

        // Filtrar por rank se especificado
        if (rank) {
            itens = itens.filter(i => i.rank === rank.toUpperCase());
        }

        // Filtrar por tipo (liga ou forjado) se especificado
        if (tipo) {
            itens = itens.filter(i => i.tipo === tipo);
        }

        return itens.slice(0, limite);
    }

    /**
     * Busca item especifico do catalogo por nome
     */
    static buscarItemCatalogo(nome) {
        const catalogo = this.carregarCatalogo();
        if (!catalogo) return null;

        const nomeLower = nome.toLowerCase().trim();
        const todos = [...catalogo.ligas, ...catalogo.forjados];

        // Busca exata
        let item = todos.find(i => i.nome.toLowerCase() === nomeLower);
        if (item) return item;

        // Busca parcial
        item = todos.find(i => i.nome.toLowerCase().includes(nomeLower));
        return item || null;
    }

    /**
     * Formata um item do catalogo para exibicao
     */
    static formatarItemCatalogo(item) {
        let texto = `*${item.nome}* [Rank ${item.rank}]\n`;
        texto += `${item.descricao}\n`;
        texto += `${item.atributo1}: +${item.valor1}`;
        if (item.atributo2 && item.valor2) {
            texto += ` - ${item.atributo2}: +${item.valor2}`;
        }
        texto += `\n${item.preco.toLocaleString()} Won`;
        return texto;
    }

    /**
     * Gera mensagem de catalogo para um slot especifico
     */
    static gerarMensagemCatalogo(slot, rank = null, pagina = 0, itensPorPagina = 15) {
        const itens = this.buscarCatalogoPorSlot(slot, rank, null, 1000);
        if (itens.length === 0) {
            return `*Nenhum item encontrado para o slot "${slot}"${rank ? " Rank " + rank : ""}.*`;
        }

        const inicio = pagina * itensPorPagina;
        const fim = inicio + itensPorPagina;
        const itensPagina = itens.slice(inicio, fim);
        const totalPaginas = Math.ceil(itens.length / itensPorPagina);

        let mensagem = `*═══ CATALOGO DE FORJA - ${slot.toUpperCase()} ═══*\n`;
        if (rank) mensagem += `> Rank: ${rank}\n`;
        mensagem += `> Total: ${itens.length} itens | Pagina ${pagina + 1}/${totalPaginas}\n`;
        mensagem += `──────────────────────────\n\n`;

        itensPagina.forEach((item, i) => {
            mensagem += `${inicio + i + 1}. *${item.nome}* [${item.rank}]\n`;
            mensagem += `   ${item.atributo1}: +${item.valor1}`;
            if (item.atributo2 && item.valor2) {
                mensagem += ` | ${item.atributo2}: +${item.valor2}`;
            }
            mensagem += `\n   ${item.preco.toLocaleString()} Won\n\n`;
        });

        if (totalPaginas > 1) {
            mensagem += `──────────────────────────\n`;
            mensagem += `_Use !catalogo forja ${slot}${rank ? " " + rank : ""} ${pagina + 2} para ver a proxima pagina._`;
        }

        return mensagem;
    }
}

module.exports = ForjaSystem;
module.exports.COMBINACOES_MATERIAIS = COMBINACOES_MATERIAIS;
module.exports.NOMES_ITENS = NOMES_ITENS;
module.exports.SLOTS_FORJA_NACIONAL = SLOTS_FORJA_NACIONAL;
