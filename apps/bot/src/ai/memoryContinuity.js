const normalize=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
function resolveMentions(text,players) {
    const query=` ${normalize(text)} `;
    const matches=new Map();
    for(const player of players) {
        const full=normalize(player.nome);
        if(!full) continue;
        const alias=full.split(' ')[0];
        const label=query.includes(` ${full} `)?full:alias.length>=3&&query.includes(` ${alias} `)?alias:null;
        if(!label) continue;
        if(!matches.has(label)) matches.set(label,[]);
        matches.get(label).push({id:player.id,nome:player.nome});
    }
    const exact=[...matches].filter(([label,candidates])=>candidates.length===1&&normalize(candidates[0].nome)===label);
    for(const [label] of exact) {
        const short=label.split(' ')[0];
        if(short!==label) matches.delete(short);
    }
    return [...matches].slice(0,6).map(([name,candidates])=>({mencionado:name,candidatos:candidates,ambiguo:candidates.length!==1}));
}
function rankMemories(all,message,limit=8,budget=2400) {
    const stop=new Set(['para','como','com','uma','que','dos','das','por','nao','sua','seu','voce','isso','esta']);
    const words=text=>new Set(normalize(text).split(' ').filter(w=>w.length>=3&&!stop.has(w)));
    const query=words(message);
    const ranked=all.map(memory=>({memory,score:[...words(memory.memoria)].filter(w=>query.has(w)).length*12+Number(memory.importancia||0)}))
        .sort((a,b)=>b.score-a.score||Number(b.memory.id)-Number(a.memory.id));
    let used=0;const selected=[];
    for(const {memory} of ranked) {
        const size=String(memory.memoria||'').length+60;
        if(used+size>budget) continue;
        selected.push(memory);used+=size;
        if(selected.length>=limit) break;
    }
    return selected;
}
async function mentionedPlayers(text) {
    const db=require('../core/database');
    const rows=await new Promise((resolve,reject)=>db.all('SELECT id, nome FROM jogadores',[],(error,rows)=>error?reject(error):resolve(rows||[])));
    return resolveMentions(text,rows);
}
module.exports={resolveMentions,rankMemories,mentionedPlayers};
