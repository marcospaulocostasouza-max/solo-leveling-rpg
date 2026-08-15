const db = require("../core/database");
const QuestSystem = require("./questSystem");
const LevelSystem = require("./levelSystem");
const advancedClasses = require("../utils/advancedClasses");
const advancedTechniques = require("../tecnicas/avancadas/techniques");
const AdvancedClassFeatureSystem = require("./advancedClassFeatureSystem");

class AdvancedClassSystem {
    static normalizarNome(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();
    }

    static familiaClasseInicial(valor) {
        const classe = this.normalizarNome(valor);
        if (classe.startsWith("ranger")) return "ranger";
        if (classe.startsWith("mago")) return "mago";
        if (classe === "curador" || classe === "healer") return "curador";
        return classe;
    }

    static getAtributosAtuais(jogador) {
        return {
            forca: Number(jogador.forca_base || 0) + Number(jogador.forca_buff || 0),
            resistencia: Number(jogador.resistencia_base || 0) + Number(jogador.resistencia_buff || 0),
            velocidade: Number(jogador.velocidade_base || 0) + Number(jogador.velocidade_buff || 0),
            sentidos: Number(jogador.sentidos_base || 0) + Number(jogador.sentidos_buff || 0),
            inteligencia: Number(jogador.inteligencia_base || 0) + Number(jogador.inteligencia_buff || 0),
            poder_magico: Number(jogador.poder_magico_base || 0) + Number(jogador.poder_magico_buff || 0)
        };
    }

    static classeCompativelComJogador(classe, jogador) {
        if (classe.categoria === "Geral") return true;
        const familiaJogador = this.familiaClasseInicial(jogador.classe);
        if (classe.classeInicial) {
            return this.familiaClasseInicial(classe.classeInicial) === familiaJogador;
        }
        const categoriasPorFamilia = {
            lutador: ["Lutador"],
            assassino: ["Assassino"],
            tanker: ["Tanker"],
            ranger: ["Ranger"],
            curador: ["Healer"],
            mago: ["Magos Gerais", "Magos Exclusivos"]
        };
        return (categoriasPorFamilia[familiaJogador] || []).includes(classe.categoria);
    }

    static atendeRequisitos(classe, jogador) {
        const atributos = this.getAtributosAtuais(jogador);
        return Object.entries(classe.requisitos || {}).every(([atributo, valor]) =>
            (atributos[atributo] || 0) >= valor
        );
    }

    static getClassesDisponiveis(jogador) {
        const atributos = this.getAtributosAtuais(jogador);
        const classeInicialJogador = this.familiaClasseInicial(jogador.classe);

        // Mapeamento: classe inicial → categorias de classe avançada disponíveis
        const mapaClasseInicial = {
            "lutador": ["Lutador"],
            "assassino": ["Assassino"],
            "tanker": ["Tanker"],
            "ranger": ["Ranger"],
            "curador": ["Healer"],
            "mago": ["Magos Gerais", "Magos Exclusivos"],
            "mago elemental": ["Magos Gerais", "Magos Exclusivos"],
            "mago invocador": ["Magos Gerais", "Magos Exclusivos"],
            "mago barreira": ["Magos Gerais", "Magos Exclusivos"],
            "mago maldição": ["Magos Gerais", "Magos Exclusivos"],
            "mago maldicao": ["Magos Gerais", "Magos Exclusivos"]
        };

        const categoriasPermitidas = mapaClasseInicial[classeInicialJogador] || [];

        return Object.values(advancedClasses).filter(classe => {
            // Classes bloqueadas por aprovação narrativa
            if (classe.bloqueada) {
                return false;
            }
            
            // Classes Gerais (Hrymir/Freyr) - disponíveis para todos
            if (classe.categoria === "Geral") {
                return this.atendeRequisitos(classe, jogador);
            }
            
            // Filtrar por classe inicial (se definida)
            if (classe.classeInicial) {
                const classeInicialDaAvancada = this.familiaClasseInicial(classe.classeInicial);
                if (classeInicialDaAvancada !== classeInicialJogador) {
                    return false;
                }
            } else {
                // Sem classeInicial definida → usar categoria
                if (!categoriasPermitidas.includes(classe.categoria)) {
                    return false;
                }
            }
            
            // Verificar requisitos de atributos
            return this.atendeRequisitos(classe, jogador);
        });
    }

    static getClasseByName(nome) {
        const nomeNormalizado = this.normalizarNome(nome);
        const chave = Object.keys(advancedClasses).find(c => this.normalizarNome(c) === nomeNormalizado);
        return chave ? advancedClasses[chave] : null;
    }

    static async atualizarTotais(jogadorId) {
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
                    `UPDATE jogadores SET forca_total = ?, resistencia_total = ?, velocidade_total = ?, sentidos_total = ?, inteligencia_total = ?, poder_magico_total = ? WHERE id = ?`,
                    [forca_total, resistencia_total, velocidade_total, sentidos_total, inteligencia_total, poder_magico_total, jogadorId],
                    (error) => {
                        resolve(!error);
                    }
                );
            });
        });
    }

    static async criarQuestClasseAvancada(jogadorId) {
        const nomeMissao = "Classe Avançada";
        return new Promise((resolve) => {
            db.get("SELECT * FROM missoes WHERE jogador_id = ? AND nome = ?", [jogadorId, nomeMissao], async (err, missao) => {
                if (err || missao) return resolve(false);

                const descricao = "Você recebeu a Quest de Classe Avançada. Escolha uma classe avançada compatível com seus atributos e solicite aprovação do ADM.";
                const criada = await QuestSystem.criarMissao(jogadorId, nomeMissao, descricao, "classe_avancada", 1, 0, 0);
                resolve(criada);
            });
        });
    }

    static async registrarClasseAvancada(nomeJogador, nomeClasse, aprovadoPor) {
        // Prepara os registros narrativos das classes especiais. Nenhum efeito
        // de técnica, mana, dano ou atributo é aplicado nesta etapa.
        await AdvancedClassFeatureSystem.garantirTabelas();
        return new Promise((resolve) => {
            db.get("SELECT * FROM jogadores WHERE LOWER(nome) = ?", [nomeJogador.toLowerCase()], async (err, jogador) => {
                if (err) return resolve({ success: false, mensagem: "Erro interno ao buscar jogador." });
                if (!jogador) return resolve({ success: false, mensagem: `Jogador não encontrado: ${nomeJogador}` });
                if (Number(jogador.nivel || 0) < 40) {
                    return resolve({ success: false, mensagem: "O jogador precisa estar no nível 40 ou superior para avançar de classe." });
                }
                if (jogador.classe_avancada && jogador.classe_avancada !== "Nenhuma" && jogador.classe_avancada !== "BLOQUEADO") {
                    return resolve({ success: false, mensagem: "Este jogador já possui uma classe avançada aprovada." });
                }

                const classe = this.getClasseByName(nomeClasse);
                if (!classe) {
                    return resolve({ success: false, mensagem: `Classe avançada desconhecida: ${nomeClasse}` });
                }

                if (!this.classeCompativelComJogador(classe, jogador)) {
                    return resolve({ success: false, mensagem: `A classe ${classe.nome} não é compatível com a classe inicial ${jogador.classe}.` });
                }
                if (!this.atendeRequisitos(classe, jogador)) {
                    return resolve({ success: false, mensagem: `O jogador não atende aos requisitos de atributos da classe ${classe.nome}.` });
                }

                const bonus = classe.bonusAtributos || {};
                const novaForcaBuff = Number(jogador.forca_buff || 0) + Number(bonus.forca || 0);
                const novaResistenciaBuff = Number(jogador.resistencia_buff || 0) + Number(bonus.resistencia || 0);
                const novaVelocidadeBuff = Number(jogador.velocidade_buff || 0) + Number(bonus.velocidade || 0);
                const novosSentidosBuff = Number(jogador.sentidos_buff || 0) + Number(bonus.sentidos || 0);
                const novaInteligenciaBuff = Number(jogador.inteligencia_buff || 0) + Number(bonus.inteligencia || 0);
                const novoPoderMagicoBuff = Number(jogador.poder_magico_buff || 0) + Number(bonus.poder_magico || 0);

                db.run(
                    `UPDATE jogadores SET classe_avancada = ?, classe_avancada_nivel = 1, forca_buff = ?, resistencia_buff = ?, velocidade_buff = ?, sentidos_buff = ?, inteligencia_buff = ?, poder_magico_buff = ? WHERE id = ?`,
                    [classe.nome, novaForcaBuff, novaResistenciaBuff, novaVelocidadeBuff, novosSentidosBuff, novaInteligenciaBuff, novoPoderMagicoBuff, jogador.id],
                    async (error) => {
                        if (error) {
                            return resolve({ success: false, mensagem: "Erro ao aplicar classe avançada." });
                        }

                        const atualizou = await this.atualizarTotais(jogador.id);
                        return resolve({ success: atualizou, mensagem: atualizou ? "Classe avançada aprovada com sucesso." : "Classe aprovada, mas falha ao atualizar atributos." });
                    }
                );
            });
        });
    }

    static getTecnicasDaClasse(nomeClasse) {
        return advancedTechniques[nomeClasse] || [];
    }

    static getTodosNomesDeClasses() {
        return Object.keys(advancedClasses);
    }
}

module.exports = AdvancedClassSystem;
