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

module.exports = { FORMATACAO_NARRATIVA };
