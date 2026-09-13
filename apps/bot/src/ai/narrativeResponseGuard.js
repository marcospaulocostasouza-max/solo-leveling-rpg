const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
function validate(response, context) {
    const problems = [];
    const identity = response.match(/(?:meu nome [ée]|me chamo|chamo-me)\s+([^\n,.*_!?]+)/i)?.[1];
    const canonical = normalize(context.npc.name);
    if (identity && normalize(identity) !== canonical.split(' ')[0] && !normalize(identity).startsWith(canonical)) problems.push('O NPC assumiu outro nome.');
    const words = normalize(context.messageVisible || context.message).split(' ').filter(Boolean);
    const output = normalize(response);
    for (let i = 0; i + 18 <= words.length; i++) if (output.includes(words.slice(i, i + 18).join(' '))) { problems.push('A resposta reproduziu um trecho longo da cena do jogador.'); break; }
    return problems;
}
module.exports = { validate };
