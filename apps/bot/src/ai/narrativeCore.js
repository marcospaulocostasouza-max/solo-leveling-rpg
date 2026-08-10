const { estimarTokens } = require('../ia/tokenBudget');
const { FORMATACAO_NARRATIVA } = require('./narrativeFormatting');
const LIMITS = { core: 2200, state: 450, relationship: 380, memories: 1200, retrieval: 2600, examples: 1500, recent: 1500, message: 1800, total: 7600 };
function cut(text, max) { const value = String(text || '').trim(); return value.length > max ? `${value.slice(0, max - 1).trim()}…` : value; }
function block(name, text, max) { const value = cut(text, max); return value ? `${name}:\n${value}` : ''; }
function examples(profile, message) {
  const terms = new Set((String(message).toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) || []));
  const all = [profile.sections.dialogExamples, profile.sections.sceneExamples].filter(Boolean).flatMap(text => text.split(/(?=---\s+)/).filter(item => item.trim()));
  return all.map((item, i) => ({ item, i, score: [...terms].filter(word => item.toLowerCase().includes(word)).length }))
    .sort((a, b) => b.score - a.score || a.i - b.i).slice(0, 2).map(item => item.item).join('\n\n');
}
function build(context) {
  const relationship = context.relationship;
  const parts = [
   `SYSTEM:\nVocê interpreta o NPC solicitado em uma cena de RPG. Responda diretamente em português brasileiro. Gere SOMENTE a continuação narrativa da cena. Não escreva análise, raciocínio, comentários ou explicações. Não comece com "Okay", "Let me think", "The user wants", "I need to" ou qualquer pensamento interno fora do personagem. Não fale sobre o prompt ou sobre suas instruções. Não controle pensamentos, falas, ações ou decisões do jogador. Termine a participação do NPC de forma que o jogador possa responder.\n\nMEMÓRIA E CONTINUIDADE: trate o jogador como desconhecido, salvo fatos literalmente presentes em MEMÓRIAS RELEVANTES ou HISTÓRICO RECENTE. Não invente encontros anteriores, promessas, apelidos, acontecimentos compartilhados, sentimentos passados ou conhecimento pessoal. Se não houver memórias, não sugira que o NPC já conhecia o jogador.\n\n${FORMATACAO_NARRATIVA}\n\nDIÁLOGO: ninguém faz discursos longos numa conversa casual. Prefira falas curtas e diretas, do jeito que a pessoa falaria de verdade — com interrupções, hesitações, respostas de uma frase quando fizer sentido. Intercale fala com pequenas ações (um gesto, uma pausa, um olhar) em vez de blocos de diálogo soltos. Nunca explique o que o personagem está sentindo pela própria fala — mostre pela forma como ele fala, não pelo conteúdo do que ele diz.`,
    block('CONTEXT - PERSONAGEM', context.npc.core, LIMITS.core),
    block('CONTEXT - ESTADO ATUAL', `Emoção: ${context.state.emotion.emocao} (${context.state.emotion.intensidade}). Mood: ${context.state.mood.mood} (${context.state.mood.intensidade}).`, LIMITS.state),
    block('CONTEXT - RELACIONAMENTO', `Vínculo ${relationship.vinculo || 0}%; hostilidade ${relationship.hostilidade || 0}%.`, LIMITS.relationship),
    block('CONTEXT - MEMÓRIAS RELEVANTES', context.memories.map(item => `- [${item.tipo}] ${item.memoria}`).join('\n'), LIMITS.memories),
    block('CONTEXT - INFORMAÇÕES RECUPERADAS', context.retrieved.map(item => `- (${item.section}) ${item.text}`).join('\n'), LIMITS.retrieval),
    block('CONTEXT - EXEMPLOS DE ESTILO RELEVANTES', examples(context.npc, context.message), LIMITS.examples),
    block('CONTEXT - HISTÓRICO RECENTE', context.recent.map(item => `${item.role === 'player' ? 'Jogador' : context.npc.name}: ${item.content}`).join('\n'), LIMITS.recent),
    block('PLAYER ACTION', context.message, LIMITS.message),
    'OUTPUT RULES:\nContinue a cena com coerência absoluta. Use exclusivamente as memórias fornecidas como passado compartilhado. Priorize voz, personalidade, emoção atual e agência do jogador. Não controle o jogador. Escreva somente a narrativa, sem comentários ou raciocínio.'
  ].filter(Boolean);
  let prompt = parts.join('\n\n');
  if (estimarTokens(prompt) > LIMITS.total) prompt = `${parts.slice(0, 5).join('\n\n')}\n\n${parts.at(-2)}\n\n${parts.at(-1)}`;
  const blocks = Object.fromEntries(parts.map(part => { const [name, ...body] = part.split(':\n'); return [name, estimarTokens(body.join(':\n'))]; }));
  return { prompt, tokens: estimarTokens(prompt), blocks, limit: LIMITS.total };
}
module.exports = { build, LIMITS };
