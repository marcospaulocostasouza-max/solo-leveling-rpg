const {test}=require('node:test'),assert=require('node:assert/strict');
const db=require('../src/ai/npcDatabase'),guard=require('../src/ai/narrativeResponseGuard');
const {validarFormatacao,normalizarFormatacao}=require('../src/ai/narrativeFormatting');
test('74 NPCs: fala/ação na mesma linha e ação multiline não repetem geração',async()=>{
    let checked=0;
    for(const id of db.listNPCs().filter(id=>!id.startsWith('_'))){
        const npc=db.getNPC(id).profile;
        const context={npc,message:'*Olá.*'};
        const speech=id==='redeye'?'':' *Pode falar.*';
        const input=`_${npc.name} mantém\na atenção no visitante._${speech}\n> Preciso observar melhor.`;
        let calls=0;
        const result=await guard.generate(async()=>{calls++;return {texto:input,metricas:{tokens:20}};},'Cena',context,{});
        assert.equal(calls,1,id);assert.ok(validarFormatacao(result.texto),id);
        assert.equal(result.metricas.tokens,20);assert.deepEqual(guard.validate(result.texto,context),[]);
        checked++;
    }
    assert.equal(checked,74);
});
test('espaços antes do pensamento e CRLF não causam nova geração',async()=>{
    for(const indent of ['  ','\t']){
        const input=`_Ela acena._ *Pode entrar.*\r\n${indent}> Preciso ouvir melhor.`;
        let calls=0;
        const result=await guard.generate(async()=>{calls++;return {texto:input};},'Cena',{npc:{name:'Alexia Song'},message:'Oi'},{});
        assert.equal(calls,1);
        assert.equal(result.texto,'_Ela acena._\n\n*Pode entrar.*\n\n> Preciso ouvir melhor.');
        assert.equal(normalizarFormatacao(result.texto),result.texto);
    }
});
test('normalização não inventa marcadores nem aceita conteúdo livre ou formatos misturados',()=>{
    for(const text of ['Pode falar.','_Ela sorri._ texto sem marcador','> *Fala disfarçada*','**Fala.**','_Ação sem fechamento']){
        assert.equal(normalizarFormatacao(text),text);assert.ok(!validarFormatacao(normalizarFormatacao(text)));
    }
    assert.equal(normalizarFormatacao('_Ela sorri._ *Olá.*'),'_Ela sorri._\n\n*Olá.*');
});
test('corrigir quebras não libera idioma, identidade ou cópia inválidos',async()=>{
    const context={npc:{name:'Alexia Song'},message:'O visitante colocou uma espada muito antiga sobre a mesa.'};
    for(const text of ['_She looked at the hunter and smiled._ *Olá.*','_Ela sorri._ *Meu nome é Helena.*','_O visitante colocou uma espada muito antiga sobre a mesa._']){
        let calls=0;
        await assert.rejects(guard.generate(async()=>{calls++;return {texto:text};},'Cena',context,{}),{code:'NARRATIVE_INVALID'});
        assert.equal(calls,2);
    }
});
