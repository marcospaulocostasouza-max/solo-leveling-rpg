const {test}=require('node:test');
const assert=require('node:assert/strict');
const guard=require('../src/ai/narrativeResponseGuard');
const context={npc:{name:'Alexia Song'},message:'O jogador colocou a espada sobre a mesa e aguardou uma resposta em silêncio.'};
test('detecta inglês em narração e diálogo misturado, preserva português e nomes próprios',()=>{
    for(const text of ['She smiled.','She looked at the hunter and smiled softly.','_Ela sorriu._ *The hunter should know that this is dangerous.*','*Thank you.*']) assert.ok(guard.validate(text,context).some(p=>p.includes('inglês')));
    assert.equal(guard.validate('_Alexia Song ergueu uma sobrancelha._ *Você parece preocupado. Quer conversar?*',context).length,0);
});
test('cópia com oito palavras e formatação alterada é rejeitada; reação própria é aceita',()=>{
    assert.ok(guard.validate('_O jogador colocou a espada sobre a mesa._ *O que procura?*',context).some(p=>p.includes('reproduziu')));
    assert.equal(guard.validate('_Alexia afasta a cadeira para abrir espaço._ *Guarde sua arma antes de começarmos.*',context).length,0);
});
test('refaz resposta inválida antes de aceitar; mantém parâmetros do modelo',async()=>{
    const prompts=[],options={num_predict:900,thinking:false};
    const result=await guard.generate(async(prompt,opts)=>{prompts.push(prompt);assert.equal(opts,options);return {texto:prompts.length===1?'She looked at the hunter and smiled.':'_Alexia acena._ *Pode entrar.*'};},'Cena original',context,options);
    assert.equal(prompts.length,2);assert.match(result.texto,/Pode entrar/);assert.match(prompts[1],/CORREÇÃO OBRIGATÓRIA/);assert.match(prompts[0],/português brasileiro/);
});
test('duas respostas inválidas são descartadas com erro que impede fallback e histórico',async()=>{
    let attempts=0;
    await assert.rejects(guard.generate(async()=>{attempts++;return {texto:'She looked at the hunter and smiled.'};},'Cena',context,{}),{code:'NARRATIVE_INVALID'});
    assert.equal(attempts,2);
});
