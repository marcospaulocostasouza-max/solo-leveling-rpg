const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const continuity=require('../src/ai/memoryContinuity'),parser=require('../src/npc/sceneParser');
function load(store){
    const manager={buscarMemorias:async(n,p)=>store.filter(m=>m.n===n&&m.p===p),registrarLembranca:async()=>{},
        salvarMemoria:async(n,p,memoria,tipo,importancia)=>{const id=store.length+1;store.push({id,n,p,memoria,tipo,importancia});return id;}};
    const sandbox={module:{exports:{}},require:name=>name==='../npc/memoryManager'?manager:name==='../npc/sceneParser'?parser:name==='../npc/npcIdentity'?require('../src/npc/npcIdentity'):continuity};
    vm.runInNewContext(fs.readFileSync(require.resolve('../src/ai/memoryEngine'),'utf8'),sandbox);
    return sandbox.module.exports;
}
test('nomes completos, nomes curtos ambíguos e limites de palavras',()=>{
    const players=[{id:1,nome:'Roque Silva'},{id:2,nome:'Roque Santos'},{id:3,nome:'Takeru'}];
    assert.equal(continuity.resolveMentions('Roque não presta.',players)[0].ambiguo,true);
    assert.equal(continuity.resolveMentions('Roque Silva não presta.',players).find(m=>m.mencionado==='roque silva').candidatos[0].id,1);
    assert.equal(continuity.resolveMentions('Roquefort',players).length,0);
});
test('assunto antigo supera memórias recentes irrelevantes com limite de contexto',()=>{
    const memories=Array.from({length:20},(_,i)=>({id:i+2,importancia:10,memoria:'Tratamento de ferimentos e curativos.'}));
    memories.push({id:1,importancia:6,memoria:'O interlocutor disse que Roque não presta.'});
    const selected=continuity.rankMemories(memories,'Roque',8,2400);
    assert.equal(selected[0].id,1);assert.ok(selected.length<=8);
    assert.ok(selected.reduce((n,m)=>n+m.memoria.length+60,0)<=2400);
});
test('cenas extensas, autoria, isolamento e recuperação após recarga',async()=>{
    const store=[],engine=load(store);
    await engine.captureScene('cyrus','takeru',[{papel:'jogador',conteudo:'*Roque não presta.*\n> Segredo privado invisível.'},
        {papel:'npc',conteudo:'_Cyrus fecha o livro._\n*Por que diz isso?*'},
        {papel:'jogador',conteudo:`_${'Caminhou pela trilha. '.repeat(110)}FINAL DA CENA_`}]);
    assert.ok(store.some(m=>m.memoria.includes('FINAL DA CENA')));
    assert.ok(store.some(m=>m.memoria.includes('Fala do jogador')&&m.memoria.includes('Roque')));
    assert.ok(store.some(m=>m.memoria.includes('Fala do NPC')));
    assert.ok(!store.some(m=>m.memoria.includes('Segredo privado')));
    const restored=load(store);
    assert.ok((await restored.retrieve('cyrus','takeru','Roque')).some(m=>m.memoria.includes('Roque')));
    assert.equal((await restored.retrieve('ophilia','takeru','Roque')).length,0);
    assert.equal((await restored.retrieve('cyrus','roque','Roque')).length,0);
    const before=store.length;
    await restored.captureScene('cyrus','takeru',[{papel:'jogador',conteudo:'*Roque não presta.*'}]);
    assert.equal(store.length,before);
});
