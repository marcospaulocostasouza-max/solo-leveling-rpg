/**
 * CONTEXTO OFICIAL DA OPHILIA
 *
 * Carrega, sob demanda, as fontes oficiais da Ophilia e mantém apenas o
 * resultado no processo atual. Em cada uso são consultados somente metadados
 * dos arquivos; o conteúdo é relido apenas se algum arquivo for alterado.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const OPHILIA_MD_DIR = path.join(ROOT_DIR, 'NPC_LORA', 'dataset', 'ophilia_clement');
const OPHILIA_JSON_FILES = [
    path.join(ROOT_DIR, 'src', 'npc', 'data', 'ophilia.json'),
    path.join(ROOT_DIR, 'src', 'npc', 'data', 'ophilia_clement.json'),
    path.join(ROOT_DIR, 'src', 'missions', 'data', 'ophilia_clement.json')
];

const TITULOS_MD = {
    '01_identity.md': 'IDENTIDADE',
    '02_summary.md': 'RESUMO',
    '03_history.md': 'HISTÓRIA',
    '04_personality.md': 'PERSONALIDADE',
    '05_interpretation.md': 'DIRETRIZES DE INTERPRETAÇÃO',
    '06_speech.md': 'FORMA DE FALAR',
    '07_values.md': 'VALORES E CRENÇAS',
    '08_likes.md': 'GOSTOS',
    '09_dislikes.md': 'DESGOSTOS',
    '10_traumas.md': 'TRAUMAS',
    '11_relationships.md': 'RELACIONAMENTOS',
    '12_goals.md': 'OBJETIVOS',
    '13_knowledge.md': 'CONHECIMENTOS',
    '14_curiosities.md': 'CURIOSIDADES',
    '15_narrative_gaps.md': 'LACUNAS NARRATIVAS',
    '16_absolute_rules.md': 'REGRAS ABSOLUTAS',
    '17_dialog_examples.md': 'EXEMPLOS DE DIÁLOGO',
    '18_scene_examples.md': 'EXEMPLOS DE CENA'
};

let cache = null;

function listarArquivosFonte() {
    const markdown = fs.readdirSync(OPHILIA_MD_DIR)
        .filter(nome => nome.toLowerCase().endsWith('.md'))
        .sort()
        .map(nome => path.join(OPHILIA_MD_DIR, nome));

    return [...OPHILIA_JSON_FILES, ...markdown].filter(fs.existsSync);
}

function criarAssinatura(arquivos) {
    return arquivos.map(arquivo => {
        const stat = fs.statSync(arquivo);
        return `${arquivo}:${stat.size}:${stat.mtimeMs}`;
    }).join('|');
}

function tituloParaArquivo(arquivo) {
    const nome = path.basename(arquivo);
    if (nome.endsWith('.md')) return TITULOS_MD[nome] || `OUTRAS INFORMAÇÕES (${nome})`;
    if (arquivo.includes(`${path.sep}missions${path.sep}`)) return 'MISSÕES OFICIAIS';
    return `DADOS JSON OFICIAIS (${nome})`;
}

function montarBloco(titulo, conteudo) {
    return `### ${titulo}\n${conteudo}`;
}

function montarContextos(arquivos) {
    const blocos = [
        'Use exclusivamente as fontes oficiais abaixo para interpretar Ophilia.',
        'Os exemplos são referência de voz e narrativa; não os copie como continuação da cena.',
        'Nunca determine pensamentos, falas ou ações do jogador. Continue apenas a partir do que ele informou.'
    ];
    const exemplosDialogo = [];
    const exemplosCena = [];

    for (const arquivo of arquivos) {
        const conteudo = fs.readFileSync(arquivo, 'utf8').trim();
        if (!conteudo) continue;
        const nome = path.basename(arquivo);
        if (nome === '17_dialog_examples.md') {
            exemplosDialogo.push(...separarExemplos(conteudo));
        } else if (nome === '18_scene_examples.md') {
            exemplosCena.push(...separarExemplos(conteudo));
        } else {
            blocos.push(montarBloco(tituloParaArquivo(arquivo), conteudo));
        }
    }

    const contextoEssencial = blocos.join('\n\n');
    return {
        contextoEssencial,
        exemplosDialogo,
        exemplosCena,
        contextoCompleto: [
            contextoEssencial,
            montarBloco('EXEMPLOS DE DIÁLOGO', exemplosDialogo.join('\n\n')),
            montarBloco('EXEMPLOS DE CENA', exemplosCena.join('\n\n'))
        ].join('\n\n')
    };
}

function separarExemplos(conteudo) {
    // Os títulos usam acentuação em arquivos legados; a marcação "--- ... N"
    // é estável e permite separar sem depender da codificação do acento.
    return conteudo.split(/(?=--- [^\r\n]*\d+[^\r\n]*)/)
        .map(item => item.trim())
        .filter(item => item.startsWith('--- '));
}

function palavrasRelevantes(texto) {
    return new Set((texto.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
        .filter(palavra => palavra.length >= 4));
}

function selecionarExemplos(exemplos, cena, limite) {
    const palavrasCena = palavrasRelevantes(cena);
    return exemplos
        .map((exemplo, indice) => ({
            exemplo,
            indice,
            pontuacao: [...palavrasRelevantes(exemplo)]
                .reduce((total, palavra) => total + (palavrasCena.has(palavra) ? 1 : 0), 0)
        }))
        .sort((a, b) => b.pontuacao - a.pontuacao || a.indice - b.indice)
        .slice(0, limite)
        .map(item => item.exemplo);
}

function montarContextoParaCena(contextoCache, cena) {
    // Um exemplo de diálogo e um de cena preservam a referência de estilo
    // sem reenviar toda a biblioteca literária em cada turno.
    const dialogos = selecionarExemplos(contextoCache.exemplosDialogo, cena, 1);
    const cenas = selecionarExemplos(contextoCache.exemplosCena, cena, 1);
    return {
        contexto: [
            contextoCache.contextoEssencial,
            montarBloco('EXEMPLOS DE DIÁLOGO RELEVANTES', dialogos.join('\n\n')),
            montarBloco('EXEMPLOS DE CENA RELEVANTES', cenas.join('\n\n'))
        ].join('\n\n'),
        exemplosSelecionados: dialogos.length + cenas.length
    };
}

function exibirCabecalho(titulo) {
    console.log('\n============================================================');
    console.log(titulo);
    console.log('============================================================');
}

function carregarContextoOphilia() {
    const arquivos = listarArquivosFonte();
    const assinatura = criarAssinatura(arquivos);

    if (cache && cache.assinatura === assinatura) {
        exibirCabecalho('🧠 OPHILIA JÁ ESTÁ EM CACHE');
        console.log('✅ Reutilizando contexto existente.');
        console.log(`📄 Arquivos: ${cache.arquivos.length} | Contexto: ${cache.contexto.length} caracteres | ~${cache.tokensEstimados} tokens`);
        console.log('============================================================\n');
        return cache;
    }

    const alterada = Boolean(cache);
    exibirCabecalho(alterada ? '🔄 OPHILIA ALTERADA' : '🧠 CARREGANDO OPHILIA');
    if (alterada) {
        console.log('⚠️ Cache antigo invalidado.');
        console.log('🔄 Recarregando arquivos...');
    }
    console.log(`📂 Pasta: ${OPHILIA_MD_DIR}`);
    console.log(`📄 Arquivos encontrados: ${arquivos.length}`);
    console.log('📚 Arquivos carregados:');
    for (const arquivo of arquivos) console.log(`- ${path.relative(ROOT_DIR, arquivo)}`);

    const contextos = montarContextos(arquivos);
    cache = {
        assinatura,
        arquivos,
        contexto: contextos.contextoCompleto,
        contextoEssencial: contextos.contextoEssencial,
        exemplosDialogo: contextos.exemplosDialogo,
        exemplosCena: contextos.exemplosCena,
        tokensEstimados: Math.ceil(contextos.contextoCompleto.length / 4),
        carregadoEm: new Date().toISOString()
    };

    console.log('🧠 Contexto da Ophilia criado.');
    console.log('💾 Ophilia armazenada em cache.');
    console.log(`📏 Contexto: ${cache.contexto.length} caracteres | ~${cache.tokensEstimados} tokens`);
    if (alterada) console.log('✅ Novo contexto criado.');
    console.log('============================================================\n');

    return cache;
}

function limparCacheOphilia() {
    cache = null;
}

module.exports = {
    carregarContextoOphilia,
    montarContextoParaCena,
    limparCacheOphilia
};
