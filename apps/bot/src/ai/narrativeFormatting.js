/**
 * ==========================================================
 * REGRAS DE FORMATAÇÃO NARRATIVA — FONTE ÚNICA DE VERDADE
 * ==========================================================
 *
 * Antes desta mudança, a regra de formatação estava duplicada em
 * src/ia/promptBuilderV2.js e src/ia/promptBuilder.js (v1, hoje sem uso),
 * e não existia de forma alguma em src/ai/narrativeCore.js — a pipeline
 * que hoje atende TODAS as conversas (Ophilia e qualquer NPC migrado)
 * antes de cair no fallback legado. Isso fazia a IA responder sem
 * seguir o padrão _/* na maior parte das conversas reais.
 *
 * Qualquer módulo que monte um prompt de narrativa/diálogo deve importar
 * esta constante em vez de reescrever a regra localmente. Se a convenção
 * mudar (novo marcador, novo exemplo), muda-se em um único lugar.
 *
 * Convenção atual:
 *   _texto_  → narração (ações, descrições, ambiente)
 *   *texto*  → fala (diálogo)
 *   >texto   → pensamento (monólogo interno do personagem, não dito em voz alta)
 */

const FORMATACAO_NARRATIVA = `FORMATAÇÃO OBRIGATÓRIA:

Narrativa (ações, descrições, ambiente) entre _ (underline).

Diálogo (fala) entre * (asteriscos).

Pensamento (monólogo interno do personagem, algo que ele pensa mas não diz em voz alta) começa a linha com > (maior-que), sem underline nem asterisco.

Nunca misture dois desses três formatos na mesma linha.

Nunca use > para falas ditas em voz alta ou para narração — apenas para pensamento interno e silencioso do personagem.

Exemplo:

_Ela olhou pro horizonte e apertou os lábios._

>Ele não vai gostar de ouvir isso, mas não posso mais esconder.

*"Prefiro não falar sobre isso agora."*`;

function validarFormatacao(texto) {
    const lines = String(texto || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    return lines.length > 0 && lines.every(line =>
        /^_[^_*\n]+_$/.test(line) ||
        /^\*[^_*\n]+\*$/.test(line) ||
        /^>\s*[^_*\s>][^_*\n]*$/.test(line)
    );
}

// Normaliza Markdown e falas explicitamente indicadas por aspas ou travessão.
function normalizarFormatacao(texto) {
    let original = String(texto || '').trim();
    // Variações comuns do Markdown não são erros de conteúdo narrativo.
    original = original.replace(/^```(?:markdown|text|txt)?\s*\n([\s\S]*?)\n```$/i, '$1').trim()
        .replace(/\*\*([^*]+)\*\*/g, '*$1*').replace(/__([^_]+)__/g, '_$1_');
    const parts = [];
    let cursor = 0;
    const tokens = /_[^_*]+_|\*[^_*]+\*|^[\t ]*>[^\r\n]*/gm;
    for (const match of original.matchAll(tokens)) {
        if (original.slice(cursor, match.index).trim()) return repararTextoLivre(original);
        parts.push(match[0].trim().replace(/\s*\r?\n\s*/g, ' '));
        cursor = match.index + match[0].length;
    }
    if (original.slice(cursor).trim() || !parts.length) return repararTextoLivre(original);
    return parts.join('\n\n');
}

function repararTextoLivre(texto) {
    if (!/"[^"\n]+"|“[^”\n]+”|^[—–]\s*\S/m.test(texto)) return texto;
    const parts = [];
    // Mantém palavras e ordem. Aspas/travessão identificam fala; prosa é narração.
    for (const line of texto.split(/\r?\n/).map(s => s.trim()).filter(Boolean)) {
        if (line.startsWith('>')) { parts.push(line); continue; }
        if (/^[—–]\s*\S/.test(line)) { parts.push('*' + line.replace(/[*_]/g, '') + '*'); continue; }
        let cursor = 0;
        const tokens = /_[^_*]+_|\*[^_*]+\*|"[^"\n]+"|“[^”\n]+”/g;
        for (const match of line.matchAll(tokens)) {
            const before = line.slice(cursor, match.index).trim();
            if (before) parts.push('_' + before.replace(/[*_]/g, '') + '_');
            parts.push(/^["“]/.test(match[0]) ? '*' + match[0].replace(/[*_]/g, '') + '*' : match[0]);
            cursor = match.index + match[0].length;
        }
        const tail = line.slice(cursor).trim();
        if (tail) parts.push('_' + tail.replace(/[*_]/g, '') + '_');
    }
    return parts.join('\n\n');
}

module.exports = { FORMATACAO_NARRATIVA, validarFormatacao, normalizarFormatacao };
