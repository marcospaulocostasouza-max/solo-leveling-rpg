/**
 * SCRIPT DE ANÁLISE DO PROMPT BUILDER
 * 
 * Mede caracteres, tokens, linhas e tempo de cada bloco do PromptBuilder.
 * 
 * USO: node scripts/analisar_prompt_builder.js
 */

// Carregar o PromptBuilder
const PB = require("../src/ia/promptBuilderV2");

// Carregar um NPC de exemplo
const NPCManager = require("../src/npc/npcManager");
const npc = NPCManager.carregarNPC("cyrus_albright");

// Dados de exemplo
const mensagem = "Olá, Cyrus. Como você está hoje?";
const historico = [
    { papel: "jogador", conteudo: "Olá, Cyrus!" },
    { papel: "npc", conteudo: "Ah, olá! Bem-vindo à biblioteca." },
    { papel: "jogador", conteudo: "Obrigado. Estou procurando informações sobre magia." }
];

const interpretacao = {
    intencao: { tipoIntencao: 'pergunta', ehPergunta: true, assuntos: ['magia'] },
    tom: { tomPredominante: 'curioso' },
    contexto: { contextoPredominante: 'conversa' },
    ritmo: { ritmo: 'curto' },
    estagio: { estagio: 'inicio' },
    orientacao: {
        pensamentoPrincipal: 'Responda naturalmente como Cyrus.',
        ajusteTom: 'Mantenha o tom acadêmico.',
        instrucaoFinal: 'Responda como o personagem.'
    }
};

const estadoEmocional = { emocao: 'calmo', intensidade: 50 };
const mood = { mood: 'sereno', intensidade: 50 };
const favorabilidade = { nivel: 5, titulo: 'Conhecidos' };
const relacionamento = { confianca: 5, respeito: 3, amizade: 2 };
const mundo = { local: 'Biblioteca de Flamesgrace', horario: 'Tarde', clima: 'Ensolarado' };
const jogador = { nome: 'Sung Jin-Woo', classe: 'Lutador', rank: 'E', nivel: 1 };
const memorias = [
    { memoria: 'O jogador perguntou sobre magia antiga.', tipo: 'conversa', importancia: 3 },
    { memoria: 'O jogador parece interessado em livros raros.', tipo: 'observacao', importancia: 2 }
];
const missaoAtual = null;

// =====================================
// MEDIR CADA BLOCO
// =====================================

function medirBloco(nome, fn) {
    const inicio = process.hrtime.bigint();
    const resultado = fn();
    const fim = process.hrtime.bigint();
    const tempoMs = Number(fim - inicio) / 1e6;

    const texto = resultado || '';
    const caracteres = texto.length;
    const tokens = Math.ceil(caracteres / 4);
    const linhas = texto.split('\n').length;

    return { nome, caracteres, tokens, linhas, tempoMs, texto };
}

const blocos = [];

// 1. Sistema (pré-compilado)
blocos.push(medirBloco('Sistema', () => PB.blocoSistema()));

// 2. Interpretação
blocos.push(medirBloco('Interpretação', () => PB.blocoInterpretacao(interpretacao, mensagem)));

// 3. NPC
blocos.push(medirBloco('NPC', () => PB.blocoNPC(npc)));

// 4. Estado Emocional
blocos.push(medirBloco('Estado Emocional', () => PB.blocoEstadoEmocional(estadoEmocional, mood)));

// 5. Relacionamentos
blocos.push(medirBloco('Relacionamentos', () => PB.blocoRelacionamentos(favorabilidade, relacionamento)));

// 6. Cena
blocos.push(medirBloco('Cena', () => PB.blocoCena(mundo)));

// 7. Jogador
blocos.push(medirBloco('Jogador', () => PB.blocoJogador(jogador)));

// 8. Objetivos
blocos.push(medirBloco('Objetivos', () => PB.blocoObjetivos(npc)));

// 9. Missão
blocos.push(medirBloco('Missão', () => PB.blocoMissao(missaoAtual)));

// 10. Memórias
blocos.push(medirBloco('Memórias', () => PB.blocoMemorias(memorias)));

// 11. Perfil de Fala
blocos.push(medirBloco('Perfil de Fala', () => PB.blocoPerfilFala(npc)));

// 12. Direção da Resposta
blocos.push(medirBloco('Direção da Resposta', () => PB.blocoDirecaoResposta(mensagem, historico)));

// 13. Mensagem Atual
blocos.push(medirBloco('Mensagem Atual', () => PB.blocoMensagemAtual(npc, mensagem)));

// 14. Histórico
blocos.push(medirBloco('Histórico', () => PB.blocoHistorico(historico, npc)));

// =====================================
// EXIBIR RELATÓRIO
// =====================================

console.log("=".repeat(100));
console.log("ANÁLISE COMPLETA DO PROMPT BUILDER V2");
console.log("=".repeat(100));
console.log("");

console.log("NPC analisado:", npc ? npc.nome : "N/A");
console.log("Mensagem:", mensagem);
console.log("Histórico:", historico.length, "mensagens");
console.log("");

console.log("-".repeat(100));
console.log("| Bloco                | Caracteres | Tokens | Linhas | Tempo (ms) |");
console.log("-".repeat(100));

let totalChars = 0;
let totalTokens = 0;
let totalLinhas = 0;
let totalTempo = 0;

for (const bloco of blocos) {
    console.log(`| ${bloco.nome.padEnd(20)} | ${String(bloco.caracteres).padStart(10)} | ${String(bloco.tokens).padStart(6)} | ${String(bloco.linhas).padStart(6)} | ${bloco.tempoMs.toFixed(3).padStart(10)} |`);
    totalChars += bloco.caracteres;
    totalTokens += bloco.tokens;
    totalLinhas += bloco.linhas;
    totalTempo += bloco.tempoMs;
}

console.log("-".repeat(100));
console.log(`| TOTAL                | ${String(totalChars).padStart(10)} | ${String(totalTokens).padStart(6)} | ${String(totalLinhas).padStart(6)} | ${totalTempo.toFixed(3).padStart(10)} |`);
console.log("-".repeat(100));
console.log("");

// =====================================
// ANÁLISE DE ESTABILIDADE
// =====================================

console.log("=".repeat(100));
console.log("ANÁLISE DE ESTABILIDADE DOS BLOCOS");
console.log("=".repeat(100));
console.log("");

const analise = [
    {
        bloco: 'Sistema',
        estatico: true,
        mudaEntreMensagens: 'NUNCA muda',
        reconstruido: 'Pré-compilado na inicialização (linha 255: _BLOCO_SISTEMA_CACHE)',
        reutilizavel: 'JÁ é reutilizado via cache'
    },
    {
        bloco: 'Interpretação',
        estatico: false,
        mudaEntreMensagens: 'Muda a cada mensagem (depende da interpretação)',
        reconstruido: 'Reconstruído a cada mensagem',
        reutilizavel: 'Não reutilizável - depende da mensagem'
    },
    {
        bloco: 'NPC',
        estatico: false,
        mudaEntreMensagens: 'Muda apenas se o NPC mudar (raro)',
        reconstruido: 'Reconstruído a cada mensagem, mas conteúdo é praticamente o mesmo',
        reutilizavel: 'PODERIA ser cacheado por NPC (TTL 24h)'
    },
    {
        bloco: 'Estado Emocional',
        estatico: false,
        mudaEntreMensagens: 'Muda quando emoção/mood mudam (a cada 5-30 min)',
        reconstruido: 'Reconstruído a cada mensagem',
        reutilizavel: 'PODERIA ser cacheado (já tem cache no cacheManager)'
    },
    {
        bloco: 'Relacionamentos',
        estatico: false,
        mudaEntreMensagens: 'Muda quando relacionamento muda (a cada 10 min)',
        reconstruido: 'Reconstruído a cada mensagem',
        reutilizavel: 'PODERIA ser cacheado (já tem cache no cacheManager)'
    },
    {
        bloco: 'Cena',
        estatico: false,
        mudaEntreMensagens: 'Muda se local/horário/clima mudarem',
        reconstruido: 'Reconstruído a cada mensagem',
        reutilizavel: 'Parcialmente reutilizável (local é estático)'
    },
    {
        bloco: 'Jogador',
        estatico: false,
        mudaEntreMensagens: 'Muda apenas se jogador mudar (raro)',
        reconstruido: 'Reconstruído a cada mensagem',
        reutilizavel: 'PODERIA ser cacheado por jogador (TTL 10 min)'
    },
    {
        bloco: 'Objetivos',
        estatico: true,
        mudaEntreMensagens: 'NUNCA muda (dados do NPC)',
        reconstruido: 'Reconstruído a cada mensagem',
        reutilizavel: 'PODERIA ser pré-compilado por NPC'
    },
    {
        bloco: 'Missão',
        estatico: false,
        mudaEntreMensagens: 'Muda quando missão muda',
        reconstruido: 'Reconstruído a cada mensagem',
        reutilizavel: 'PODERIA ser cacheado'
    },
    {
        bloco: 'Memórias',
        estatico: false,
        mudaEntreMensagens: 'Muda a cada mensagem (memórias relevantes)',
        reconstruido: 'Reconstruído a cada mensagem',
        reutilizavel: 'Não reutilizável - depende da mensagem'
    },
    {
        bloco: 'Perfil de Fala',
        estatico: true,
        mudaEntreMensagens: 'NUNCA muda (perfil do NPC)',
        reconstruido: 'Reconstruído a cada mensagem',
        reutilizavel: 'PODERIA ser pré-compilado por NPC'
    },
    {
        bloco: 'Direção da Resposta',
        estatico: false,
        mudaEntreMensagens: 'Muda a cada mensagem (depende do tamanho)',
        reconstruido: 'Reconstruído a cada mensagem',
        reutilizavel: 'Não reutilizável - depende da mensagem'
    },
    {
        bloco: 'Mensagem Atual',
        estatico: false,
        mudaEntreMensagens: 'Muda a cada mensagem',
        reconstruido: 'Reconstruído a cada mensagem',
        reutilizavel: 'Não reutilizável - é a mensagem atual'
    },
    {
        bloco: 'Histórico',
        estatico: false,
        mudaEntreMensagens: 'Muda a cada mensagem (últimas 6)',
        reconstruido: 'Reconstruído a cada mensagem',
        reutilizavel: 'Não reutilizável - histórico cresce'
    }
];

for (const item of analise) {
    console.log(`\n### ${item.bloco}`);
    console.log(`  Estático: ${item.estatico ? 'SIM' : 'NÃO'}`);
    console.log(`  Muda entre mensagens: ${item.mudaEntreMensagens}`);
    console.log(`  Reconstruído: ${item.reconstruido}`);
    console.log(`  Reutilizável: ${item.reutilizavel}`);
}

// =====================================
// ANÁLISE DE CUSTO
// =====================================

console.log("\n" + "=".repeat(100));
console.log("ANÁLISE DE CUSTO EM TOKENS");
console.log("=".repeat(100));
console.log("");

const blocosOrdenados = [...blocos].sort((a, b) => b.tokens - a.tokens);
console.log("Blocos ordenados por custo de tokens (maior → menor):");
console.log("");

for (const bloco of blocosOrdenados) {
    const percentual = ((bloco.tokens / totalTokens) * 100).toFixed(1);
    console.log(`  ${bloco.nome.padEnd(20)}: ${String(bloco.tokens).padStart(6)} tokens (${percentual}%)`);
}

console.log("");
console.log(`TOTAL: ${totalTokens} tokens (${totalChars} caracteres, ${totalLinhas} linhas)`);
console.log(`Tempo total de montagem: ${totalTempo.toFixed(3)} ms`);