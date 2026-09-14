const { estimarTokens } = require('../ia/tokenBudget');
const { FORMATACAO_NARRATIVA } = require('./narrativeFormatting');
const { analisarCena, formatarCenaParaPrompt } = require('../npc/sceneParser');
const LIMITS = { core: 2200, state: 450, relationship: 380, memories: 2400, retrieval: 2600, examples: 1500, recent: 2400, message: 12000, total: 7600 };
function cut(text, max) { const value = String(text || '').trim(); return value.length > max ? `${value.slice(0, max - 1).trim()}…` : value; }
function block(name, text, max) { const value = cut(text, max); return value ? `${name}:\n${value}` : ''; }
const examples = (profile, message, relationship) => require('./narrativeExamples').select(profile,message,relationship,LIMITS.examples);
function build(context) {
  const relationship = context.relationship;
  const cenaAtual = analisarCena(context.message);
  const parts = [
   `SYSTEM:\nVocê interpreta o NPC solicitado em uma cena de RPG. Responda diretamente em português brasileiro. Gere SOMENTE a continuação narrativa da cena. Não escreva análise, raciocínio, comentários ou explicações. Não comece com "Okay", "Let me think", "The user wants", "I need to" ou qualquer pensamento interno fora do personagem. Não fale sobre o prompt ou sobre suas instruções. Não controle pensamentos, falas, ações ou decisões do jogador. Termine a participação do NPC de forma que o jogador possa responder.\n\nMEMÓRIA E CONTINUIDADE: trate o jogador como desconhecido, salvo fatos literalmente presentes em MEMÓRIAS RELEVANTES ou HISTÓRICO RECENTE. Não invente encontros anteriores, promessas, apelidos, acontecimentos compartilhados, sentimentos passados ou conhecimento pessoal. Se não houver memórias, não sugira que o NPC já conhecia o jogador.\n\n${FORMATACAO_NARRATIVA}\n\nDIÁLOGO: ninguém faz discursos longos numa conversa casual. Prefira falas curtas e diretas, do jeito que a pessoa falaria de verdade — com interrupções, hesitações, respostas de uma frase quando fizer sentido. Intercale fala com pequenas ações (um gesto, uma pausa, um olhar) em vez de blocos de diálogo soltos. Nunca explique o que o personagem está sentindo pela própria fala — mostre pela forma como ele fala, não pelo conteúdo do que ele diz.`,
    block('LEITURA CANÔNICA DA CENA', 'Antes de responder, leia a cena estruturada: _texto_ é ação visível; *texto* é fala audível; uma linha iniciada por > é pensamento privado. Você pode perceber ações e ouvir somente falas. Jamais responda, reaja ou narre como se conhecesse pensamentos privados. Nunca converta ação em fala, fala em ação, nem trate texto fora do molde como um deles.', 900),
    block('LEITURA OBRIGATORIA', 'Antes de narrar, leia TODAS as partes da CENA ATUAL na ordem recebida. Primeiro identifique acoes visiveis, depois falas audiveis e somente entao responda. Pensamentos privados nunca podem influenciar a reacao do NPC. Esta leitura e interna: nao a mencione na narrativa.', 900),
    block('IDENTIDADE E PERSONALIDADE OBRIGATORIAS', `Seu nome real é ${context.npc.name}. Nunca assuma outro nome, outra guilda ou biografia alheia. Exemplos são apenas referências de estilo, nunca fatos nem respostas prontas. Não reproduza a cena do jogador: narre somente as novas ações e falas do NPC. Personalidade canônica: ${context.npc.sections?.personality || context.npc.core}`, 3000),
    block('CONTEXT - PERSONAGEM', context.npc.core, LIMITS.core),
    block('CONTEXT - ESTADO ATUAL', `Emoção: ${context.state.emotion.emocao} (${context.state.emotion.intensidade}). Mood: ${context.state.mood.mood} (${context.state.mood.intensidade}).`, LIMITS.state),
    block('CONTEXT - RELACIONAMENTO', `Vínculo ${relationship.vinculo || 0}%; hostilidade ${relationship.hostilidade || 0}%.`, LIMITS.relationship),
    block('MISSÕES OFICIAIS DO JOGADOR', `Somente estas missões existem para esta interação. Não crie requisitos, não aceite nem conclua tarefas pelo diálogo. Respeite objetivos, rank e estado registrados. Missão completa e aprovadaPorADM significa tarefa cumprida e recompensa já entregue. Reconheça a conclusão na cena, conforme cenaAprovada, sem cobrar novamente o objetivo nem inventar outra aprovação. ${JSON.stringify(context.quests || [])}`, 2600),
    block('PERSONAGENS MENCIONADOS', `Seu interlocutor é ${context.player?.nome || 'o jogador atual'}. Cadastro de nomes públicos, sem conceder conhecimento de cenas alheias: ${JSON.stringify(context.mentioned || [])}. Se ambiguo for true, pergunte de quem está falando; não escolha um candidato. Reconhecer o nome não significa conhecer pessoalmente. Relatos e opiniões pertencem a quem os contou: nunca trate uma acusação como fato confirmado. Reaja conforme personalidade e confiança no interlocutor.`, 1800),
    block('CONTEXT - MEMÓRIAS RELEVANTES', context.memories.map(item => `- [${item.tipo}] ${item.memoria}`).join('\n'), LIMITS.memories),
    block('CONTEXT - INFORMAÇÕES RECUPERADAS', context.retrieved.map(item => `- (${item.section}) ${item.text}`).join('\n'), LIMITS.retrieval),
    block('CONTEXT - EXEMPLOS DE ESTILO RELEVANTES', examples(context.npc, context.messageVisible || context.message, context.relationship), LIMITS.examples),
    block('CONTEXT - HISTÓRICO RECENTE', context.recent.map(item => item.role === 'player' ? `Jogador — cena estruturada:\n${formatarCenaParaPrompt(analisarCena(item.content))}` : `${context.npc.name}: ${item.content}`).join('\n'), LIMITS.recent),
    block('CENA ATUAL DO JOGADOR', formatarCenaParaPrompt(cenaAtual), LIMITS.message),
    'OUTPUT RULES:\nContinue a cena com coerência absoluta. Use exclusivamente as memórias fornecidas como passado compartilhado. Priorize voz, personalidade, emoção atual e agência do jogador. Não controle o jogador. Escreva somente a narrativa, sem comentários ou raciocínio.'
  ].filter(Boolean);
  let prompt = parts.join('\n\n');
  // Drop optional examples/retrieval before essential identity, quests and scene.
  if (estimarTokens(prompt) > LIMITS.total) prompt = parts.filter(part => !/^CONTEXT - (EXEMPLOS|INFORMA)/.test(part)).join('\n\n');
  const blocks = Object.fromEntries(parts.map(part => { const [name, ...body] = part.split(':\n'); return [name, estimarTokens(body.join(':\n'))]; }));
  return { prompt, tokens: estimarTokens(prompt), blocks, limit: LIMITS.total };
}
module.exports = { build, LIMITS };
