/**
 * ==========================================================
 * COMPLEXITY ANALYZER
 * ==========================================================
 *
 * Responsável por calcular a complexidade da mensagem do jogador.
 *
 * A complexidade é medida em uma escala de 0 a 100, considerando:
 *
 * - Tamanho da mensagem
 * - Quantidade de assuntos mencionados
 * - Necessidade de raciocínio
 * - Necessidade de consultar memória
 * - Quantidade de entidades citadas
 * - Necessidade de interpretar contexto
 * - Necessidade de inferência
 * - Presença de questões emocionais, morais ou estratégicas
 *
 * Classificação:
 *
 * 0~20  → Muito simples
 * 21~40 → Simples
 * 41~60 → Média
 * 61~80 → Complexa
 * 81~100 → Muito complexa
 *
 * Princípios SOLID:
 * - Single Responsibility: apenas calcula complexidade
 * - Open/Closed: novas métricas via extensão
 * - Dependency Injection: recebe configuração externa
 *
 * Este módulo NÃO decide se deve usar thinking.
 * Ele apenas mede a complexidade.
 */

const fs = require('fs');
const path = require('path');

// Configuração padrão (será sobrescrita pela configuração externa)
const CONFIG_PADRAO = {
    // Pesos de cada fator (total = 100)
    pesos: {
        tamanho: 5,
        assuntos: 5,
        raciocinio: 40,
        memoria: 25,
        entidades: 5,
        inferencia: 20
    },

    // Limites de tamanho (caracteres)
    tamanho: {
        muitoCurto: 15,    // 0-15 chars
        curto: 50,         // 16-50 chars
        medio: 120,        // 51-120 chars
        longo: 300,        // 121-300 chars
        muitoLongo: 501    // 301+ chars
    },

    // Limites de palavras
    palavras: {
        simples: 10,
        medio: 25,
        complexo: 50
    },

    // Marcadores que indicam necessidade de raciocínio
    marcadoresRaciocinio: [
        'por quê', 'por que', 'porque', 'como', 'quem', 'o que', 'quando',
        'onde', 'e se', 'será', 'sera', 'seria', 'poderia', 'poderia ter',
        'significa', 'deveria', 'precisamos', 'preciso saber', 'preciso pensar',
        'me ajude a entender', 'me explica', 'explique', 'qual a razão',
        'qual a razao', 'qual o motivo', 'você acha', 'voce acha',
        'você pensa', 'voce pensa', 'o que você faria', 'o que voce faria',
        'o que você sente', 'o que voce sente', 'em sua opinião', 'em sua opiniao',
        'na sua visão', 'na sua visao', 'decidir', 'escolher', 'preciso decidir',
        'preciso escolher', 'pensar', 'refletir', 'analisar', 'avaliar',
        'conte', 'me conte', 'me conta', 'conta', 'matou', 'matar',
        'por quê', 'porque', 'e por quê', 'e porque',
        'certo', 'errado', 'sacrificar', 'salvar', 'proteger', 'trair'
    ],

    // Marcadores que indicam consulta à memória
    marcadoresMemoria: [
        'lembra', 'lembra-se', 'recorda', 'memória', 'memoria', 'lembrou',
        'esqueceu', 'aconteceu', 'você conhece', 'voce conhece', 'sabe quem',
        'sabe o que', 'sabe onde', 'sabe como', 'já viu', 'ja viu',
        'já ouviu', 'ja ouviu', 'já foi', 'ja foi', 'você estava', 'voce estava',
        'você presenciou', 'voce presenciou', 'você lembra de mim', 'voce lembra de mim',
        'você se lembra', 'voce se lembra', 'lembra de mim', 'me conhece',
        'estava lá', 'estava la', 'você estava lá', 'voce estava la',
        'há quanto tempo', 'ha quanto tempo', 'desde quando', 'quanto tempo'
    ],

    // Entidades do universo Solo Leveling (contribuem para complexidade)
    entidades: [
        'solo leveling', 'sung jin-woo', 'sung jinwoo', 'jin-woo', 'jinwoo',
        'monarca', 'monarcas', 'governante', 'governantes', 'arquiteto',
        'sistema', 'portão', 'portao', 'portal', 'masmorra', 'dungeon',
        'rank', 's-rank', 'a-rank', 'b-rank', 'c-rank', 'd-rank', 'e-rank',
        'caçador', 'cacador', 'caçadores', 'cacadores', 'guilda', 'guildas',
        'associação', 'associacao', 'caçadores', 'despertar', 'manifestação',
        'manifestacao', 'sombra', 'sombras', 'exército de sombras', 'exercito de sombras',
        'rei das sombras', 'igris', 'beru', 'bellion', 'tusk', 'tanque',
        'círculo mágico', 'circulo magico', 'maná', 'mana', 'núcleo', 'nucleo',
        'pedra de mana', 'pedra de maná', 'reino', 'reinos', 'deus', 'deuses',
        'demônio', 'demonio', 'demônios', 'demonios', 'dragão', 'dragao',
        'leviatã', 'leviata', 'bestas', 'colosso', 'gigante', 'troll',
        'duende', 'orco', 'ogro', 'esqueleto', 'espectro', 'fantasma',
        'cavaleiro', 'cavaleiros', 'guardião', 'guardiao', 'guardiões', 'guardioes',
        'templo', 'santuário', 'santuario', 'ruínas', 'ruinas', 'catacumbas',
        'torre', 'torre do inferno', 'teste', 'provação', 'provacao',
        'recompensa', 'recompensas', 'penalidade', 'bônus', 'bonus',
        'nivel', 'nível', 'level', 'exp', 'pontos de habilidade', 'skill',
        'skills', 'habilidade', 'habilidades', 'técnica', 'tecnica', 'técnicas',
        'invocação', 'invocacao', 'invocar', 'armazenar', 'item', 'itens',
        'arma', 'armas', 'equipamento', 'equipamentos', 'armadura', 'poção', 'pocao',
        'elixir', 'benção', 'bencao', 'maldição', 'maldicao', 'artefato',
        'relíquia', 'reliquia', 'grimório', 'grimorio', 'pergaminho',
        'fragmento', 'essência', 'essencia', 'alma', 'almas', 'energia',
        'força', 'forca', 'poder', 'poderes', 'domínio', 'dominio',
        'área de combate', 'area de combate', 'campo de batalha', 'arena',
        'boss', 'chefe', 'sub-chefe', 'mini-boss', 'raid', 'incursão', 'incursao'
    ],

    // Palavras com conotação emocional/moral (adicionam complexidade)
    palavrasEmocionais: [
        'amor', 'ódio', 'odio', 'raiva', 'medo', 'tristeza', 'felicidade',
        'esperança', 'esperanca', 'desespero', 'traição', 'traicao', 'lealdade',
        'honra', 'justiça', 'justica', 'injustiça', 'injustica', 'culpa',
        'remorso', 'perdão', 'perdao', 'vingança', 'vinganca', 'sacrifício',
        'sacrificio', 'sacrificar', 'morte', 'vida', 'liberdade', 'escravidão', 'escravidao',
        'poder', 'fraqueza', 'coragem', 'covardia', 'verdade', 'mentira',
        'segredo', 'destino', 'escolha', 'decisão', 'decisao', 'consequência',
        'consequencia', 'moral', 'ético', 'etico', 'certo', 'errado',
        'salvar', 'proteger', 'trair', 'ajudar'
    ]
};

/**
 * ==========================================================
 * COMPLEXITY ANALYZER
 * ==========================================================
 */

class ComplexityAnalyzer {
    constructor() {
        this.configuracao = { ...CONFIG_PADRAO };
        this._carregarConfiguracao();
    }

    /**
     * Calcula a complexidade de uma mensagem
     *
     * @param {string} mensagem - Mensagem do jogador
     * @param {Object} contexto - Contexto da conversa (opcional)
     * @returns {Object} Análise de complexidade
     */
    analisar(mensagem, contexto = {}) {
        const inicio = Date.now();

        if (!mensagem || typeof mensagem !== 'string' || mensagem.trim().length === 0) {
            return this._resultadoBasico();
        }

        // Calcular cada fator
        const fatorTamanho = this._calcularTamanho(mensagem);
        const fatorAssuntos = this._calcularAssuntos(mensagem);
        const fatorRaciocinio = this._calcularRaciocinio(mensagem);
        const fatorMemoria = this._calcularMemoria(mensagem);
        const fatorEntidades = this._calcularEntidades(mensagem);
        const fatorInferencia = this._calcularInferencia(mensagem, contexto);

        // Calcular pontuação ponderada
        const pontuacao = Math.min(100, Math.round(
            fatorTamanho.pontos * (this.configuracao.pesos.tamanho / 100) +
            fatorAssuntos.pontos * (this.configuracao.pesos.assuntos / 100) +
            fatorRaciocinio.pontos * (this.configuracao.pesos.raciocinio / 100) +
            fatorMemoria.pontos * (this.configuracao.pesos.memoria / 100) +
            fatorEntidades.pontos * (this.configuracao.pesos.entidades / 100) +
            fatorInferencia.pontos * (this.configuracao.pesos.inferencia / 100)
        ));

        return {
            pontuacao: pontuacao,
            classificacao: this._classificar(pontuacao),
            fatores: {
                tamanho: fatorTamanho,
                assuntos: fatorAssuntos,
                raciocinio: fatorRaciocinio,
                memoria: fatorMemoria,
                entidades: fatorEntidades,
                inferencia: fatorInferencia
            },
            detalhes: {
                palavras: mensagem.trim().split(/\s+/).length,
                caracteres: mensagem.trim().length,
                tempoAnalise: Date.now() - inicio
            },
            requerThinking: pontuacao >= this._getLimiteThinking()
        };
    }

    /**
     * Calcula o fator de tamanho da mensagem
     *
     * @param {string} mensagem - Mensagem do jogador
     * @returns {Object} Fator de tamanho
     * @private
     */
    _calcularTamanho(mensagem) {
        const tamanho = mensagem.trim().length;
        const palavras = mensagem.trim().split(/\s+/).length;
        const config = this.configuracao.tamanho;

        let pontos = 0;
        let descricao = '';

        if (tamanho <= config.muitoCurto) {
            pontos = 10;
            descricao = 'Muito curta';
        } else if (tamanho <= config.curto) {
            pontos = 25;
            descricao = 'Curta';
        } else if (tamanho <= config.medio) {
            pontos = 50;
            descricao = 'Média';
        } else if (tamanho <= config.longo) {
            pontos = 75;
            descricao = 'Longa';
        } else {
            pontos = 100;
            descricao = 'Muito longa';
        }

        // Ajuste por número de palavras
        if (palavras > this.configuracao.palavras.complexo) {
            pontos = Math.min(100, pontos + 15);
        } else if (palavras > this.configuracao.palavras.medio) {
            pontos = Math.min(100, pontos + 10);
        }

        return {
            pontos: pontos,
            descricao: descricao,
            caracteres: tamanho,
            palavras: palavras
        };
    }

    /**
     * Calcula a quantidade de assuntos mencionados
     *
     * @param {string} mensagem - Mensagem do jogador
     * @returns {Object} Fator de assuntos
     * @private
     */
    _calcularAssuntos(mensagem) {
        const texto = mensagem.toLowerCase();

        // Detectar multiplicidade de assuntos
        const marcadoresMultiplos = [
            ' e ', ' ou ', ' também', ' tambem', ' além de', ' alem de',
            'também', 'tambem', 'outra coisa', 'mais uma', 'outro',
            'primeiro', 'segundo', 'além disso', 'alem disso',
            'sobre isso', 'sobre aquilo', 'depois', 'então', 'entao',
            'e também', 'e tambem', 'quando você', 'quando voce'
        ];

        const palavras = texto.split(/\s+/);
        let contagemConjuncoes = 0;

        for (const marcador of marcadoresMultiplos) {
            const ocorrencias = texto.split(marcador).length - 1;
            contagemConjuncoes += ocorrencias;
        }

        // Assuntos = 1 base + 1 por conector de assunto
        const assuntos = Math.max(1, 1 + contagemConjuncoes);

        let pontos = 0;
        let descricao = '';

        if (assuntos === 1) {
            pontos = 20;
            descricao = '1 assunto';
        } else if (assuntos === 2) {
            pontos = 50;
            descricao = '2 assuntos';
        } else if (assuntos === 3) {
            pontos = 75;
            descricao = '3 assuntos';
        } else {
            pontos = 100;
            descricao = `${assuntos} assuntos`;
        }

        return {
            pontos: pontos,
            descricao: descricao,
            quantidade: assuntos
        };
    }

    /**
     * Calcula a necessidade de raciocínio
     *
     * @param {string} mensagem - Mensagem do jogador
     * @returns {Object} Fator de raciocínio
     * @private
     */
    _calcularRaciocinio(mensagem) {
        const texto = mensagem.toLowerCase();
        let ocorrencias = 0;
        const marcadoresEncontrados = [];

        for (const marcador of this.configuracao.marcadoresRaciocinio) {
            if (texto.includes(marcador)) {
                ocorrencias++;
                marcadoresEncontrados.push(marcador);
            }
        }

        // Pergunta direta é um forte indicador
        const ehPergunta = mensagem.trim().endsWith('?') ||
            /\b(o que|qual|quais|como|onde|quando|quem|por que|porque|por quê)\b/i.test(mensagem);

        if (ehPergunta && ocorrencias > 0) {
            ocorrencias += 2; // Bônus para perguntas com marcadores
        }

        let pontos = 0;
        let descricao = '';

        if (ocorrencias === 0 && !ehPergunta) {
            pontos = 5;
            descricao = 'Sem raciocínio necessário';
        } else if (ocorrencias === 0 && ehPergunta) {
            pontos = 30;
            descricao = 'Pergunta simples';
        } else if (ocorrencias === 1) {
            pontos = 45;
            descricao = 'Raciocínio leve';
        } else if (ocorrencias === 2) {
            pontos = 70;
            descricao = 'Raciocínio moderado';
        } else if (ocorrencias <= 4) {
            pontos = 90;
            descricao = 'Raciocínio elevado';
        } else {
            pontos = 100;
            descricao = 'Raciocínio intenso';
        }

        return {
            pontos: pontos,
            descricao: descricao,
            ocorrencias: ocorrencias,
            marcadores: marcadoresEncontrados
        };
    }

    /**
     * Calcula a necessidade de consultar memória
     *
     * @param {string} mensagem - Mensagem do jogador
     * @returns {Object} Fator de memória
     * @private
     */
    _calcularMemoria(mensagem) {
        const texto = mensagem.toLowerCase();
        let ocorrencias = 0;
        const marcadoresEncontrados = [];

        for (const marcador of this.configuracao.marcadoresMemoria) {
            if (texto.includes(marcador)) {
                ocorrencias++;
                marcadoresEncontrados.push(marcador);
            }
        }

        // Contexto histórico (palavras relacionadas a passado)
        const marcadoresPassado = [
            'antigamente', 'há muito tempo', 'ha muito tempo', 'no passado',
            'lembra quando', 'aconteceu antes', 'daquela época', 'daquela epoca',
            'naquele dia', 'quando era', 'quando fui', 'quando você era',
            'quando voce era', 'história', 'historia', 'lenda', 'mito',
            'desde o início', 'desde o inicio', 'do começo', 'do comeco',
            'do início', 'do inicio', 'toda a história', 'toda a historia'
        ];

        for (const marcador of marcadoresPassado) {
            if (texto.includes(marcador)) {
                ocorrencias++;
                marcadoresEncontrados.push(marcador);
            }
        }

        let pontos = 0;
        let descricao = '';

        if (ocorrencias === 0) {
            pontos = 5;
            descricao = 'Sem consulta à memória';
        } else if (ocorrencias === 1) {
            pontos = 50;
            descricao = 'Memória leve';
        } else if (ocorrencias === 2) {
            pontos = 75;
            descricao = 'Memória moderada';
        } else if (ocorrencias <= 4) {
            pontos = 90;
            descricao = 'Memória elevada';
        } else {
            pontos = 100;
            descricao = 'Memória profunda';
        }

        return {
            pontos: pontos,
            descricao: descricao,
            ocorrencias: ocorrencias,
            marcadores: marcadoresEncontrados
        };
    }

    /**
     * Calcula a quantidade de entidades citadas
     *
     * @param {string} mensagem - Mensagem do jogador
     * @returns {Object} Fator de entidades
     * @private
     */
    _calcularEntidades(mensagem) {
        const texto = mensagem.toLowerCase();
        const entidadesEncontradas = [];

        for (const entidade of this.configuracao.entidades) {
            if (texto.includes(entidade)) {
                entidadesEncontradas.push(entidade);
            }
        }

        const quantidade = entidadesEncontradas.length;

        let pontos = 0;
        let descricao = '';

        if (quantidade === 0) {
            pontos = 10;
            descricao = 'Nenhuma entidade';
        } else if (quantidade === 1) {
            pontos = 35;
            descricao = '1 entidade';
        } else if (quantidade === 2) {
            pontos = 60;
            descricao = '2 entidades';
        } else if (quantidade <= 4) {
            pontos = 85;
            descricao = `${quantidade} entidades`;
        } else {
            pontos = 100;
            descricao = `${quantidade} entidades`;
        }

        return {
            pontos: pontos,
            descricao: descricao,
            quantidade: quantidade,
            entidades: entidadesEncontradas
        };
    }

    /**
     * Calcula a necessidade de inferência (subtender, interpretar contexto)
     *
     * @param {string} mensagem - Mensagem do jogador
     * @param {Object} contexto - Contexto da conversa
     * @returns {Object} Fator de inferência
     * @private
     */
    _calcularInferencia(mensagem, contexto = {}) {
        const texto = mensagem.toLowerCase();
        let ocorrencias = 0;
        const indicadores = [];

        // Palavras que indicam inferência
        const marcadoresInferencia = [
            'e se', 'será', 'sera', 'seria', 'poderia', 'poderia ter',
            'talvez', 'possivelmente', 'provavelmente', 'imaginar',
            'imagina', 'suponha', 'considere', 'quem sabe', 'na verdade',
            'nao seria', 'não seria', 'entende', 'percebe', 'nota',
            'o que significa', 'o que implica', 'o que quer dizer',
            'deixa eu entender', 'me faz pensar', 'pode ser que',
            'isso quer dizer', 'isso significa'
        ];

        for (const marcador of marcadoresInferencia) {
            if (texto.includes(marcador)) {
                ocorrencias++;
                indicadores.push(marcador);
            }
        }

        // Palavras emocionais/morais (requerem interpretação)
        for (const palavra of this.configuracao.palavrasEmocionais) {
            if (texto.includes(palavra)) {
                ocorrencias++;
                indicadores.push(palavra);
            }
        }

        // Contexto histórico significativo
        if (contexto.historico && contexto.historico.length >= 5) {
            ocorrencias++;
            indicadores.push('histórico extenso');
        }

        let pontos = 0;
        let descricao = '';

        if (ocorrencias === 0) {
            pontos = 10;
            descricao = 'Sem inferência';
        } else if (ocorrencias === 1) {
            pontos = 45;
            descricao = 'Inferência leve';
        } else if (ocorrencias === 2) {
            pontos = 70;
            descricao = 'Inferência moderada';
        } else if (ocorrencias <= 4) {
            pontos = 90;
            descricao = 'Inferência elevada';
        } else {
            pontos = 100;
            descricao = 'Inferência profunda';
        }

        return {
            pontos: pontos,
            descricao: descricao,
            ocorrencias: ocorrencias,
            indicadores: indicadores
        };
    }

    /**
     * Classifica a pontuação em categorias
     *
     * @param {number} pontuacao - Pontuação de complexidade
     * @returns {string} Classificação
     * @private
     */
    _classificar(pontuacao) {
        if (pontuacao <= 20) return 'Muito simples';
        if (pontuacao <= 40) return 'Simples';
        if (pontuacao <= 60) return 'Média';
        if (pontuacao <= 80) return 'Complexa';
        return 'Muito complexa';
    }

    /**
     * Obtém o limite de thinking da configuração
     *
     * @returns {number} Limite de thinking
     * @private
     */
    _getLimiteThinking() {
        // Usa o limite já carregado no construtor (cacheado)
        return this.configuracao.limiteThinking || 40;
    }

    /**
     * Retorna um resultado básico para mensagens vazias
     *
     * @returns {Object} Resultado básico
     * @private
     */
    _resultadoBasico() {
        return {
            pontuacao: 0,
            classificacao: 'Muito simples',
            fatores: {
                tamanho: { pontos: 0, descricao: 'Vazia' },
                assuntos: { pontos: 0, descricao: 'Nenhum' },
                raciocinio: { pontos: 0, descricao: 'Nenhum' },
                memoria: { pontos: 0, descricao: 'Nenhuma' },
                entidades: { pontos: 0, descricao: 'Nenhuma' },
                inferencia: { pontos: 0, descricao: 'Nenhuma' }
            },
            detalhes: {
                palavras: 0,
                caracteres: 0,
                tempoAnalise: 0
            },
            requerThinking: false
        };
    }

    /**
     * Carrega a configuração externa se disponível
     *
     * @private
     */
    _carregarConfiguracao() {
        try {
            const configPath = path.join(__dirname, 'thinking-config.json');
            if (fs.existsSync(configPath)) {
                const configExterna = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                if (configExterna.limiteThinking) {
                    this.configuracao.limiteThinking = configExterna.limiteThinking;
                }
            }
        } catch (erro) {
            // Mantém configuração padrão se falhar
        }
    }
}

// Instância singleton
const complexityAnalyzer = new ComplexityAnalyzer();

module.exports = {
    ComplexityAnalyzer,
    complexityAnalyzer
};