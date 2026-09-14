const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function split(text) {
    return String(text || '').split(/(?=^--- (?:Diálogo|Cena) \d+[^\r\n]*---)/mu)
        .map(value=>value.trim()).filter(value=>/^--- (?:Diálogo|Cena) \d+/.test(value));
}
function select(profile, message, relationship = {}, maxChars = 1500, maxExamples = 2) {
    const text = normalize(message);
    const terms = new Set(text.match(/[\p{L}\p{N}]{4,}/gu) || []);
    const intent = /\b(?:oi|ola|bom dia|boa tarde|boa noite)\b/.test(text) ? 'cumprimento'
        : /\b(?:nao|discordo|insisto|recusa|aceite)\b/.test(text) ? 'limite'
        : /\b(?:silencio|calado|quieto)\b/.test(text) ? 'silencio'
        : /como.*(?:dia|esta)|\b(?:cha|cafe|tempo|cotidiano)\b/.test(text) ? 'cotidiano'
        : /\b(?:ajuda|preciso|pedido|como|qual|onde|porque)\b/.test(text) ? 'esclarecer'
        : 'cotidiano';
    const all = [profile.sections?.dialogExamples,profile.sections?.sceneExamples].flatMap(split);
    // Não autorizar intimidade por um rótulo de exemplo.
    const allowed = all.filter(example=>{
        const heading=normalize(example.split('\n')[0]);
        const minimum=Number(example.match(/Vínculo mínimo:\s*(\d+)/i)?.[1] || 0);
        if (Number(relationship.vinculo || 0)<minimum) return false;
        if (/romance|intimidade/.test(heading) && !relationship.romanceConsentido) return false;
        return true;
    });
    let salt=0; for(const char of text) salt=(salt*31+char.charCodeAt(0))>>>0;
    const ranked=allowed.map((item,index)=>({item,index,score:[...terms].filter(term=>normalize(item).includes(term)).length + (normalize(item.split('\n')[0]).includes(intent)?30:0)}))
        .sort((a,b)=>b.score-a.score || ((a.index+salt)%Math.max(allowed.length,1))-((b.index+salt)%Math.max(allowed.length,1)));
    const selected=[];let chars=0;
    for(const {item} of ranked) {
        if(chars+item.length+(selected.length?2:0)>maxChars) continue;
        selected.push(item);chars+=item.length+(selected.length>1?2:0);
        if(selected.length>=maxExamples)break;
    }
    return selected.join('\n\n');
}
module.exports={split,select};
