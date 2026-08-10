/**
 * MEMORY SEARCH
 *
 * Sistema de busca por relevância de memórias.
 *
 * Em vez de carregar todas as memórias de um NPC, este módulo
 * analisa a mensagem do jogador e busca apenas memórias relevantes
 * para aquela conversa.
 *
 * Exemplo:
 * Mensagem: "Você lembra do castelo?"
 * → Busca memórias contendo: castelo, rei, guerra, aquele jogador
 *
 * Nunca carrega o histórico completo.
 */

const MemoryManager = require("../npc/memoryManager");

// =====================================
// EXTRAÇÃO DE PALAVRAS-CHAVE
// =====================================

/**
 * Palavras irrelevantes que não ajudam na busca
 */
const PALAVRAS_IRRELEVANTES = new Set([
    'você', 'voce', 'vocês', 'voces', 'lembra', 'lembra-se', 'lembra de',
    'lembra do', 'lembra da', 'lembra dos', 'lembra das', 'lembra que',
    'lembra quando', 'lembra onde', 'lembra como', 'lembra quem',
    'lembra o', 'lembra a', 'lembra o que', 'lembra aquele', 'lembra aquela',
    'lembra aquilo', 'lembra daquele', 'lembra daquela', 'lembra daquilo',
    'lembra do que', 'lembra da que', 'lembra dos que', 'lembra das que',
    'lembra de que', 'lembra de quem', 'lembra de onde', 'lembra de quando',
    'lembra de como', 'lembra de quanto', 'lembra de qual',
    'lembra de quais', 'lembra de tudo', 'lembra de nada',
    'lembra de algo', 'lembra de alguém', 'lembra de alguem',
    'lembra de mim', 'lembra de você', 'lembra de voce',
    'lembra de nós', 'lembra de nos', 'lembra de vocês', 'lembra de voces',
    'lembra dele', 'lembra dela', 'lembra deles', 'lembra delas',
    'lembra disso', 'lembra disto', 'lembra daquilo',
    'lembra daquele dia', 'lembra daquela noite', 'lembra daquele lugar',
    'lembra daquele momento', 'lembra daquela vez',
    'lembra daquele tempo', 'lembra daquela época', 'lembra daquela epoca',
    'lembra daquele castelo', 'lembra daquele reino', 'lembra daquele rei',
    'lembra daquela guerra', 'lembra daquele jogador',
    'lembra daquele lugar', 'lembra daquele local',
    'lembra daquele evento', 'lembra daquele acontecimento',
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da',
    'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'com', 'sem', 'por',
    'para', 'pra', 'pro', 'que', 'se', 'mas', 'e', 'ou', 'nem', 'também',
    'tambem', 'muito', 'muita', 'muitos', 'muitas', 'pouco', 'pouca',
    'poucos', 'poucas', 'mais', 'menos', 'já', 'ja', 'ainda', 'sempre',
    'nunca', 'agora', 'depois', 'antes', 'então', 'entao', 'aqui', 'ali',
    'lá', 'la', 'cá', 'ca', 'isso', 'isto', 'aquilo', 'esse', 'essa',
    'esses', 'essas', 'este', 'esta', 'estes', 'estas', 'aquele', 'aquela',
    'aqueles', 'aquelas', 'me', 'te', 'se', 'nos', 'vos', 'lhe', 'lhes',
    'eu', 'tu', 'ele', 'ela', 'nós', 'nos', 'vós', 'vos', 'eles', 'elas',
    'meu', 'minha', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas',
    'seu', 'sua', 'seus', 'suas', 'nosso', 'nossa', 'nossos', 'nossas',
    'vosso', 'vossa', 'vossos', 'vossas', 'quem', 'que', 'qual', 'quais',
    'quanto', 'quanta', 'quantos', 'quantas', 'quando', 'onde', 'como',
    'por que', 'porque', 'por quê', 'porque', 'será', 'sera', 'seria',
    'poderia', 'deveria', 'preciso', 'precisa', 'precisamos', 'quero',
    'quer', 'queremos', 'posso', 'pode', 'podemos', 'vou', 'vai', 'vamos',
    'fui', 'foi', 'foram', 'era', 'eram', 'ser', 'estar', 'estou', 'está',
    'esta', 'estamos', 'estão', 'estao', 'tinha', 'tinham', 'tive', 'teve',
    'tiveram', 'tenho', 'tem', 'temos', 'têm', 'tem', 'fazer', 'faz',
    'fazemos', 'fez', 'fizeram', 'dizer', 'diz', 'dizemos', 'disse',
    'disseram', 'ver', 'vejo', 'vê', 've', 'vemos', 'viu', 'viram',
    'saber', 'sei', 'sabe', 'sabemos', 'soube', 'souberam', 'poder',
    'posso', 'pode', 'podemos', 'pôde', 'pode', 'puderam', 'querer',
    'quero', 'quer', 'queremos', 'quis', 'quiseram', 'haver', 'há', 'ha',
    'houve', 'houveram', 'ter', 'tenho', 'tem', 'temos', 'tive', 'teve',
    'tiveram', 'estar', 'estou', 'está', 'esta', 'estamos', 'estive',
    'esteve', 'estiveram', 'ser', 'sou', 'é', 'e', 'somos', 'fui', 'foi',
    'foram', 'sim', 'não', 'nao', 'ok', 'okay', 'tá', 'ta', 'né', 'ne',
    'bem', 'mal', 'melhor', 'pior', 'grande', 'pequeno', 'bom', 'boa',
    'ruim', 'certo', 'errado', 'legal', 'bacana', 'massa', 'top', 'show',
    'cara', 'cara', 'mano', 'cara', 'véi', 'vei', 'cara', 'cara'
]);

/**
 * Palavras que indicam contexto de memória (sinônimos e variações)
 */
const PALAVRAS_CONTEXTO = {
    'castelo': ['castelo', 'fortaleza', 'torre', 'palácio', 'palacio', 'cidadela'],
    'rei': ['rei', 'rainha', 'monarca', 'soberano', 'trono', 'coroa', 'realeza'],
    'guerra': ['guerra', 'batalha', 'conflito', 'combate', 'invasão', 'invasao', 'cerco', 'rebelião', 'rebeliao'],
    'jogador': ['jogador', 'caçador', 'cacador', 'herói', 'heroi', 'guerreiro', 'aventureiro'],
    'dungeon': ['dungeon', 'masmorra', 'portal', 'portão', 'portao', 'torre', 'ruínas', 'ruinas'],
    'promessa': ['promessa', 'juramento', 'voto', 'compromisso', 'palavra'],
    'missao': ['missão', 'missao', 'tarefa', 'quest', 'objetivo', 'pedido', 'favor'],
    'amizade': ['amigo', 'amiga', 'amizade', 'companheiro', 'companheira', 'parceiro', 'parceira'],
    'amor': ['amor', 'paixão', 'paixao', 'romance', 'sentimento', 'coração', 'coracao'],
    'traicao': ['traição', 'traicao', 'trair', 'mentira', 'engano', 'deslealdade'],
    'medo': ['medo', 'terror', 'pavor', 'horror', 'pesadelo'],
    'perda': ['perda', 'morte', 'falecimento', 'luto', 'adeus', 'despedida'],
    'vinganca': ['vingança', 'vinganca', 'vingar', 'justiça', 'justica', 'retribuição', 'retribuicao'],
    'segredo': ['segredo', 'oculto', 'escondido', 'misterio', 'mistério', 'enigma'],
    'familia': ['família', 'familia', 'pai', 'mãe', 'mae', 'irmão', 'irmao', 'irmã', 'irma', 'filho', 'filha'],
    'templo': ['templo', 'igreja', 'santuário', 'santuario', 'abadia', 'mosteiro'],
    'guilda': ['guilda', 'clã', 'cla', 'facção', 'faccao', 'aliança', 'alianca', 'ordem'],
    'magia': ['magia', 'feitiço', 'feitico', 'encantamento', 'arcano', 'mana', 'poder'],
    'arma': ['arma', 'espada', 'lâmina', 'lamina', 'adaga', 'machado', 'lança', 'lanca', 'arco'],
    'cidade': ['cidade', 'vila', 'aldeia', 'capital', 'reino', 'província', 'provincia'],
    'evento': ['evento', 'acontecimento', 'incidente', 'ocorrência', 'ocorrencia', 'fato'],
    'passado': ['passado', 'história', 'historia', 'origem', 'infância', 'infancia', 'juventude'],
    'futuro': ['futuro', 'destino', 'profecia', 'previsão', 'previsao', 'plano'],
    'poder': ['poder', 'força', 'forca', 'habilidade', 'técnica', 'tecnica', 'skill', 'dom'],
    'mundo': ['mundo', 'universo', 'dimensão', 'dimensao', 'realidade', 'plano']
};

/**
 * Extrai palavras-chave relevantes da mensagem do jogador
 *
 * @param {string} mensagem - Mensagem do jogador
 * @returns {Array<string>} Lista de palavras-chave
 */
function extrairPalavrasChave(mensagem) {
    if (!mensagem) return [];

    const texto = mensagem.toLowerCase()
        .replace(/[?!.,;:()\[\]{}"']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const palavras = texto.split(' ');
    const palavrasChave = new Set();

    for (const palavra of palavras) {
        // Ignorar palavras irrelevantes
        if (PALAVRAS_IRRELEVANTES.has(palavra)) continue;
        if (palavra.length < 3) continue;

        // Adicionar palavra original
        palavrasChave.add(palavra);

        // Adicionar sinônimos/contexto
        for (const [categoria, sinonimos] of Object.entries(PALAVRAS_CONTEXTO)) {
            if (sinonimos.includes(palavra)) {
                // Adicionar todos os sinônimos da categoria
                for (const sinonimo of sinonimos) {
                    palavrasChave.add(sinonimo);
                }
                break;
            }
        }
    }

    return [...palavrasChave];
}

/**
 * Calcula a relevância de uma memória para as palavras-chave
 *
 * @param {Object} memoria - Memória do banco
 * @param {Array<string>} palavrasChave - Palavras-chave da mensagem
 * @returns {number} Pontuação de relevância (0-100)
 */
function calcularRelevancia(memoria, palavrasChave) {
    if (!memoria || !memoria.memoria || palavrasChave.length === 0) return 0;

    const textoMemoria = memoria.memoria.toLowerCase();
    let pontuacao = 0;

    for (const palavra of palavrasChave) {
        if (textoMemoria.includes(palavra)) {
            pontuacao += 20;
        }
    }

    // Bônus por importância
    pontuacao += (memoria.importancia || 5) * 2;

    // Bônus por tipo relevante
    const tiposRelevantes = ['promessa', 'revelacao', 'missao', 'favor', 'decisao', 'evento', 'emocional', 'relacao'];
    if (tiposRelevantes.includes(memoria.tipo)) {
        pontuacao += 10;
    }

    return Math.min(100, pontuacao);
}

/**
 * Busca memórias relevantes para a mensagem do jogador
 *
 * @param {string} npcId - ID do NPC
 * @param {string} jogadorId - ID do jogador
 * @param {string} mensagem - Mensagem do jogador
 * @param {number} limite - Limite de memórias a retornar (padrão 5)
 * @returns {Promise<Array>} Lista de memórias relevantes ordenadas por relevância
 */
async function buscarMemoriasRelevantes(npcId, jogadorId, mensagem, limite = 5) {
    try {
        // Extrair palavras-chave da mensagem
        const palavrasChave = extrairPalavrasChave(mensagem);

        // Se não há palavras-chave, retornar memórias mais importantes
        if (palavrasChave.length === 0) {
            const memorias = await MemoryManager.buscarMemoriasImportantes(npcId, jogadorId, 7);
            return memorias.slice(0, limite);
        }

        // Buscar todas as memórias do NPC (sem limite para filtrar por relevância)
        const todasMemorias = await MemoryManager.buscarMemorias(npcId, jogadorId);

        // Calcular relevância de cada memória
        const comRelevancia = todasMemorias.map(memoria => ({
            ...memoria,
            _relevancia: calcularRelevancia(memoria, palavrasChave)
        }));

        // Filtrar apenas memórias com relevância mínima
        const relevantes = comRelevancia
            .filter(m => m._relevancia >= 20)
            .sort((a, b) => b._relevancia - a._relevancia);

        // Se não encontrou memórias relevantes, retornar as mais importantes
        if (relevantes.length === 0) {
            const memoriasImportantes = await MemoryManager.buscarMemoriasImportantes(npcId, jogadorId, 7);
            return memoriasImportantes.slice(0, limite);
        }

        return relevantes.slice(0, limite);
    } catch (error) {
        console.error("[MEMORY_SEARCH] Erro ao buscar memórias relevantes:", error.message);
        return [];
    }
}

module.exports = {
    buscarMemoriasRelevantes,
    extrairPalavrasChave,
    calcularRelevancia,
    PALAVRAS_CONTEXTO
};