/**
 * ARQUITETURA DA IA - SISTEMA INTELIGENTE
 * 
 * Funcionalidades:
 * - Análise de fichas com sugestões
 * - Geração de habilidades únicas
 * - Avaliação inteligente de personagens
 * - Sugestões de balanceamento
 */

const db = require("../core/database");

class ArquitetoIA {
    constructor() {
        this.nome = "Arquiteto de Personagens";
        this.versao = "1.0.0";
        
        // Base de conhecimento da IA
        this.baseConhecimento = {
            classes: this.carregarClasses(),
            elementos: this.carregarElementos(),
            estilosLuta: this.carregarEstilosLuta(),
            historias: this.carregarHistoriasReferencia()
        };
    }

    // =====================================
    // ANÁLISE DE FICHA
    // =====================================
    
    async analisarFicha(dadosFicha) {
        const analise = {
            pontuacao: 0,
            sugestoes: [],
            melhorias: [],
            aprovacao: false,
            notaFinal: "C"
        };

        // Análise de identidade
        this.analisarIdentidade(dadosFicha, analise);
        
        // Análise de combate
        this.analisarCombate(dadosFicha, analise);
        
        // Análise de atributos
        this.analisarAtributos(dadosFicha, analise);
        
        // Análise de história
        this.analisarHistoria(dadosFicha, analise);

        // Calcular nota final
        analise.notaFinal = this.calcularNota(analise.pontuacao);
        analise.aprovacao = analise.pontuacao >= 70;

        return analise;
    }

    analisarIdentidade(dados, analise) {
        const camposIdentidade = ['nome', 'idade', 'genero', 'sexo', 'nacionalidade', 'altura', 'peso'];
        let camposPreenchidos = 0;

        camposIdentidade.forEach(campo => {
            if (dados[campo] && dados[campo].length > 1) {
                camposPreenchidos++;
            } else {
                analise.sugestoes.push(`Preencher ${campo} para melhor imersão`);
            }
        });

        const percentual = (camposPreenchidos / camposIdentidade.length) * 100;
        analise.pontuacao += percentual * 0.2; // 20% da nota

        if (dados.personalidade && dados.personalidade.length >= 10) {
            analise.pontuacao += 10;
            analise.melhorias.push("✓ Personalidade bem desenvolvida");
        } else {
            analise.sugestoes.push("Desenvolver mais a personalidade (mínimo 10 caracteres)");
        }

        if (dados.aparencia && dados.aparencia.length >= 10) {
            analise.pontuacao += 10;
            analise.melhorias.push("✓ Aparência bem descrita");
        } else {
            analise.sugestoes.push("Adicionar detalhes na aparência do personagem");
        }
    }

    analisarCombate(dados, analise) {
        // Verificar classe
        if (dados.classe && this.baseConhecimento.classes[dados.classe.toLowerCase()]) {
            analise.pontuacao += 15;
            analise.melhorias.push(`✓ Classe ${dados.classe} válida no sistema`);
        } else if (dados.classe) {
            analise.sugestoes.push(`Classe "${dados.classe}" não reconhecida. Verifique as classes disponíveis`);
        }

        // Verificar estilo de luta
        if (dados.estilo_luta) {
            analise.pontuacao += 5;
        } else {
            analise.sugestoes.push("Adicionar estilo de luta");
        }

        // Verificar arma inicial
        if (dados.arma) {
            analise.pontuacao += 5;
        } else {
            analise.sugestoes.push("Adicionar arma inicial");
        }

        // Verificar elemento
        if (dados.elemento && this.baseConhecimento.elementos[dados.elemento.toLowerCase()]) {
            analise.pontuacao += 5;
            analise.melhorias.push(`✓ Elemento ${dados.elemento} válido`);
        } else if (dados.elemento) {
            analise.sugestoes.push(`Elemento "${dados.elemento}" será substituído por sorteio`);
        }
    }

    analisarAtributos(dados, analise) {
        const atributos = ['forca', 'resistencia', 'velocidade', 'sentidos', 'inteligencia', 'poder_magico'];
        let soma = 0;
        let valoresValidos = true;

        atributos.forEach(attr => {
            const valor = parseInt(dados[attr]) || 0;
            soma += valor;

            if (valor > 10) {
                valoresValidos = false;
                analise.sugestoes.push(`${attr}: ${valor} (máximo 10)`);
            }
            if (valor < 0) {
                valoresValidos = false;
            }
        });

        if (soma === 10) {
            analise.pontuacao += 20;
            analise.melhorias.push("✓ Distribuição de atributos perfeita (10/10 pontos)");
        } else if (soma <= 10 && soma > 0) {
            analise.pontuacao += 15;
            analise.sugestoes.push(`Faltam ${10 - soma} pontos para distribuir`);
        } else if (soma > 10) {
            analise.sugestoes.push(`Total: ${soma}/10 pontos (excedeu o limite)`);
        }

        // Análise de sinergia com classe
        if (dados.classe) {
            this.analisarSinergiaClasses(dados, analise);
        }
    }

    analisarSinergiaClasses(dados, analise) {
        const classe = dados.classe.toLowerCase();
        const sinergias = {
            'lutador': { principal: 'forca', secundario: 'resistencia' },
            'assassino': { principal: 'agilidade', secundario: 'velocidade' },
            'mago': { principal: 'poder_magico', secundario: 'inteligencia' },
            'tanker': { principal: 'resistencia', secundario: 'forca' },
            'ranger': { principal: 'velocidade', secundario: 'agilidade' },
            'curador': { principal: 'inteligencia', secundario: 'poder_magico' }
        };

        const sinergia = sinergias[classe];
        if (sinergia) {
            const attrPrincipal = dados[sinergia.principal] || 0;
            const attrSecundario = dados[sinergia.secundario] || 0;

            if (attrPrincipal >= 7) {
                analise.pontuacao += 5;
                analise.melhorias.push(`✓ Excelente ${sinergia.principal} para ${dados.classe}`);
            } else if (attrPrincipal >= 5) {
                analise.pontuacao += 3;
            } else {
                analise.sugestoes.push(`Considerar aumentar ${sinergia.principal} para ${dados.classe}`);
            }

            if (attrSecundario >= 5) {
                analise.pontuacao += 3;
            }
        }
    }

    analisarHistoria(dados, analise) {
        if (!dados.historia) {
            analise.sugestoes.push("Adicionar história do personagem");
            return;
        }

        const tamanho = dados.historia.length;

        if (tamanho >= 200) {
            analise.pontuacao += 20;
            analise.melhorias.push("✓ História bem detalhada");
        } else if (tamanho >= 100) {
            analise.pontuacao += 15;
            analise.sugestoes.push("História boa, mas pode ser mais detalhada");
        } else if (tamanho >= 50) {
            analise.pontuacao += 10;
            analise.sugestoes.push("História muito curta (mínimo 50 caracteres)");
        } else {
            analise.sugestoes.push("História muito curta, adicione mais detalhes");
        }

        // Verificar elementos narrativos
        const elementosNarrativos = this.verificarElementosNarrativos(dados.historia);
        if (elementosNarrativos.conflito) analise.pontuacao += 5;
        if (elementosNarrativos.motivacao) analise.pontuacao += 5;
        if (elementosNarrativos.origem) analise.pontuacao += 5;
    }

    verificarElementosNarrativos(historia) {
        const lower = historia.toLowerCase();
        
        return {
            conflito: lower.includes('guerra') || lower.includes('perda') || lower.includes('batalha') || lower.includes('conflito'),
            motivacao: lower.includes('proteger') || lower.includes('vingança') || lower.includes('poder') || lower.includes('justiça'),
            origem: lower.includes('família') || lower.includes('vila') || lower.includes('acidente') || lower.includes('treinamento')
        };
    }

    // =====================================
    // GERAÇÃO DE HABILIDADES ÚNICAS
    // =====================================

    gerarHabilidadeUnica(dadosFicha) {
        const classe = dadosFicha.classe?.toLowerCase() || 'genérico';
        const elemento = dadosFicha.elemento?.toLowerCase() || 'neutro';
        const estilo = dadosFicha.estilo_luta?.toLowerCase() || 'padrão';

        // Banco de templates de habilidades
        const templatesHabilidades = {
            lutador: {
                nomes: ["Soco do Dragão", "Golpe do Tigre", "Punho do Trovão", "Impacto da Serpente"],
                descricoes: [
                    `Concentra ${elemento} em seus punhos, aumentando drasticamente o poder de impacto.`,
                    `Técnica de combate corpo-a-corpo que canaliza energia para golpes devastadores.`,
                    `Movimento rápido que desfere múltiplos golpes em sequência.`
                ]
            },
            mago: {
                nomes: ["Canalização Arcana", "Explosão Elemental", "Barreira Mística", "Enxame Mágico"],
                descricoes: [
                    `Manipula ${elemento} de forma avançada, criando efeitos devastadores.`,
                    `Conjura uma onda de energia ${elemento} que destrói tudo no caminho.`,
                    `Cria uma proteção mágica que absorve danos.`
                ]
            },
            assassino: {
                nomes: ["Golpe Silencioso", "Danza das Sombras", "Lâmina Fantasma", "Passo Sombrio"],
                descricoes: [
                    `Ataque furtivo que causa dano massivo em pontos vitais.`,
                    `Movimento ágil que confunde o inimigo com múltiplos ataques.`,
                    `Técnica que permite atacar e desaparecer nas sombras.`
                ]
            },
            tanker: {
                nomes: ["Muralha Inabalável", "Escudo do Titã", "Resistência Sobrenatural", "Aura Protetora"],
                descricoes: [
                    `Resiste a danos massivos e protege aliados próximos.`,
                    `Cria uma barreira impenetrável que bloqueia todo o mal.`,
                    `Absorve energia do ambiente para fortalecer defesas.`
                ]
            },
            ranger: {
                nomes: ["Tiro Preciso", "Chuva de Flechas", "Olho de Águia", "Disparo Letal"],
                descricoes: [
                    `Ataque à distância com precisão absoluta e dano crítico.`,
                    `Dispara múltiplos projéteis em área, cobrindo grande espaço.`,
                    `Perfeita mira que nunca erra o alvo.`
                ]
            },
            curador: {
                nomes: ["Toque da Vida", "Cura Arcana", "Bênção Divina", "Regeneração Rápida"],
                descricoes: [
                    `Canaliza energia curativa para feridas graves.`,
                    `Cria uma aura que regenera HP de aliados ao longo do tempo.`,
                    `Remove efeitos negativos e protege contra danos futuros.`
                ]
            }
        };

        const templates = templatesHabilidades[classe] || templatesHabilidades['lutador'];

        const nome = templates.nomes[Math.floor(Math.random() * templates.nomes.length)];
        const descricao = templates.descricoes[Math.floor(Math.random() * templates.descricoes.length)];

        return {
            nome: `${nome} - ${elemento}`,
            descricao: descricao,
            custoMana: Math.floor(Math.random() * 30) + 20,
            cooldown: Math.floor(Math.random() * 3) + 2,
            dano: Math.floor(Math.random() * 50) + 50
        };
    }

    // =====================================
    // SUGESTÕES DE MELHORIA
    // =====================================

    gerarSugestoesAtributos(dadosFicha) {
        const sugestoes = [];
        const classe = dadosFicha.classe?.toLowerCase() || '';

        const distribuicaoIdeal = {
            'lutador': { forca: 8, resistencia: 6, velocidade: 4, agilidade: 3, inteligencia: 2, poder_magico: 1 },
            'assassino': { forca: 4, resistencia: 3, velocidade: 8, agilidade: 8, inteligencia: 4, poder_magico: 2 },
            'mago': { forca: 2, resistencia: 3, velocidade: 4, agilidade: 3, inteligencia: 9, poder_magico: 9 },
            'tanker': { forca: 6, resistencia: 10, velocidade: 2, agilidade: 2, inteligencia: 3, poder_magico: 2 },
            'ranger': { forca: 4, resistencia: 4, velocidade: 9, agilidade: 8, inteligencia: 5, poder_magico: 3 },
            'curador': { forca: 2, resistencia: 4, velocidade: 5, agilidade: 5, inteligencia: 9, poder_magico: 8 }
        };

        const ideal = distribuicaoIdeal[classe];
        if (ideal) {
            Object.keys(ideal).forEach(atributo => {
                const valorAtual = parseInt(dadosFicha[atributo]) || 0;
                const valorIdeal = ideal[atributo];

                if (valorAtual < valorIdeal - 2) {
                    sugestoes.push(`Aumentar ${atributo} (atual: ${valorAtual}, recomendado: ${valorIdeal})`);
                }
            });
        }

        return sugestoes;
    }

    // =====================================
    // AVALIAÇÃO INTELIGENTE
    // =====================================

    async avaliarComIA(dadosFicha) {
        const analise = await this.analisarFicha(dadosFicha);
        const habilidadeSugerida = this.gerarHabilidadeUnica(dadosFicha);
        const sugestoesAtributos = this.gerarSugestoesAtributos(dadosFicha);

        return {
            ...analise,
            habilidadeSugerida: habilidadeSugerida,
            sugestoesAtributos: sugestoesAtributos,
            recomendacao: this.gerarRecomendacao(analise)
        };
    }

    gerarRecomendacao(analise) {
        if (analise.pontuacao >= 90) return "Ficha excelente! Aprovar sem ressalvas.";
        if (analise.pontuacao >= 75) return "Ficha muito boa! Aprovada com pequenos ajustes.";
        if (analise.pontuacao >= 60) return "Ficha aceitável, mas precisa de melhorias.";
        return "Ficha precisa de revisão. Solicitar ajustes ao jogador.";
    }

    // =====================================
    // BASE DE CONHECIMENTO
    // =====================================

    carregarClasses() {
        // Carregar classes do banco
        return {};
    }

    carregarElementos() {
        // Carregar elementos do banco
        return {};
    }

    carregarEstilosLuta() {
        // Carregar estilos de luta do banco
        return [];
    }

    carregarHistoriasReferencia() {
        return [
            "Perda de ente querido",
            "Desejo de poder",
            "Proteção à família",
            "Vingança",
            "Justiça",
            "Sobrevivência",
            "Busca por conhecimento",
            "Acidente trágico"
        ];
    }

    // =====================================
    // UTILITÁRIOS
    // =====================================

    calcularNota(pontuacao) {
        if (pontuacao >= 90) return "S";
        if (pontuacao >= 80) return "A";
        if (pontuacao >= 70) return "B";
        if (pontuacao >= 60) return "C";
        if (pontuacao >= 50) return "D";
        return "F";
    }
}

// Instância singleton
const arquiteto = new ArquitetoIA();

module.exports = arquiteto;