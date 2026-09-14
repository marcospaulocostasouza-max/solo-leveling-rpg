const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const english = new Set('the she he they you your his her their was were is are and but with from into of to at it this that would could should said says looked looks smiled smiles nodded nods stepped steps walked walks whispered whispers asked asks replied replies turned turns have has had been will know welcome hunter thank thanks'.split(' '));
const portuguese = new Set('ela ele eles elas voce seu sua seus suas estava estavam e mas com para por que nao uma um do da dos das ao aos disse diz olhou sorriu assentiu caminhou perguntou respondeu virou tinha tem foi sera isso este esta'.split(' '));
const CONSTRAINTS = 'IDIOMA E AUTORIA OBRIGATÓRIOS: toda a narração e todas as falas devem ser em português brasileiro, mesmo se o histórico ou exemplos estiverem em inglês. Nomes próprios podem manter a grafia original. A cena recebida pertence ao jogador: não a copie, não a resuma, não reencene suas ações e não a traduza. Comece pela reação inédita do NPC e avance a cena com ações e falas próprias. Exemplos são informações e referências, nunca texto para reproduzir.';
// A recarga de comandos pode encontrar uma versão antiga deste módulo em cache.
const formattingPath = require.resolve('./narrativeFormatting');
if (typeof require(formattingPath).normalizarFormatacao !== 'function') delete require.cache[formattingPath];
const { FORMATACAO_NARRATIVA, validarFormatacao, normalizarFormatacao } = require(formattingPath);
function validate(response, context) {
    response = String(response || '');
    const problems = [];
    if (!validarFormatacao(response)) problems.push('Formatação inválida: use _ações_, *falas* e > pensamentos, cada tipo em sua própria linha.');
    const identity = response.match(/(?:meu nome [ée]|me chamo|chamo-me)\s+([^\n,.*_!?]+)/i)?.[1];
    const canonical = normalize(context.npc.name);
    if (identity && normalize(identity) !== canonical.split(' ')[0] && normalize(identity) !== canonical) problems.push('O NPC assumiu outro nome.');
    const words = normalize(context.messageVisible ?? context.message).split(' ').filter(Boolean);
    const output = normalize(response);
    for (let i = 0; i + 8 <= words.length; i++) if (output.includes(words.slice(i, i + 8).join(' '))) { problems.push('A resposta reproduziu um trecho da cena do jogador. Gere uma reação própria, sem recontar a cena recebida.'); break; }
    for (const sentence of String(response || '').split(/[.!?\n]+/)) {
        const tokens = normalize(sentence).split(' ').filter(Boolean);
        const names = new Set(normalize(context.npc.name).split(' '));
        const en = tokens.filter(word => english.has(word) && !names.has(word)).length;
        const pt = tokens.filter(word => portuguese.has(word)).length;
        if ((tokens.length >= 5 && en >= 3 && en > pt + 1 && en / tokens.length >= 0.3) || (tokens.length >= 2 && en >= 2 && pt === 0 && en / tokens.length >= 0.5) || /\b(?:thank you|i don t know|welcome back|let me|how are you)\b/.test(normalize(sentence))) {
            problems.push('A resposta contém narração ou diálogo em inglês. Reescreva inteiramente em português brasileiro.'); break;
        }
    }
    return problems;
}
async function generate(generateResponse, prompt, context, options) {
    const fullPrompt = `${prompt}\n\n${CONSTRAINTS}\n\n${FORMATACAO_NARRATIVA}`;
    let result = await generateResponse(fullPrompt, options);
    result = { ...result, texto: normalizarFormatacao(result?.texto) };
    let problems = validate(result.texto || '', context);
    if (problems.length) {
        const originalResult = result;
        try {
        result = await generateResponse(`${fullPrompt}\n\nCORREÇÃO OBRIGATÓRIA: ${problems.join(' ')} Reescreva do zero somente a continuação do NPC ${context.npc.name}, mantendo sua identidade e personalidade.`, options);
        } catch (error) {
            console.warn('[NPC_VALIDATION] Correção indisponível; enviando a cena gerada:', error.message);
            return result;
        }
        result = { ...result, texto: normalizarFormatacao(result?.texto) };
        // Uma correção vazia não pode substituir a cena que já foi gerada.
        if (!String(result.texto || '').trim()) result = originalResult;
        problems = validate(result.texto || '', context);
        // Prefira a tentativa com menos problemas, preservando a cena original.
        const originalProblems = validate(originalResult.texto || '', context);
        if (originalProblems.length < problems.length) {
            result = originalResult;
            problems = originalProblems;
        }
        if (problems.length) console.warn(`[NPC_VALIDATION] Cena será enviada e salva apesar dos avisos: ${problems.join(' ')}`);
    }
    return result;
}
module.exports = { validate, generate, CONSTRAINTS };
