const {test}=require('node:test');
const assert=require('node:assert/strict');
const guard=require('../src/ai/narrativeResponseGuard');
const context={npc:{name:'Alexia Song'},message:'O jogador colocou a espada sobre a mesa e aguardou uma resposta em silêncio.'};
test('ações, falas e pensamentos seguem marcadores separados; cabeçalho preserva o corpo',()=>{
    const body='_Alexia fecha o livro._\n\n*Pode perguntar.*\n\n> Ainda preciso entender esse pedido.';
    assert.deepEqual(guard.validate(body,context),[]);
    for(const text of ['Ela fecha o livro.','_Ação sem fechamento','**Pode perguntar.**','_Ela acena._ *Olá.*','> _Pensamento._','']) {
        assert.ok(guard.validate(text,context).some(p=>p.includes('Formatação')));
    }
    const formatted=require('../src/utils/messageFormatter').formatarMensagem({nome:'Alexia Song'},body);
    assert.ok(formatted.endsWith(body));assert.ok(!formatted.includes('> Estado emocional:'));
});
test('resposta sem marcadores é refeita usando o padrão obrigatório',async()=>{
    let attempts=0;
    const result=await guard.generate(async prompt=>{
        assert.match(prompt,/FORMATAÇÃO OBRIGATÓRIA/);
        return {texto:++attempts===1?'Pode entrar.':'_Alexia abre a porta._\n*Pode entrar.*\n> Espero que explique o pedido.'};
    },'Cena',context,{});
    assert.equal(attempts,2);assert.deepEqual(guard.validate(result.texto,context),[]);
});
test('detecta inglês em narração e diálogo misturado, preserva português e nomes próprios',()=>{
    for(const text of ['She smiled.','She looked at the hunter and smiled softly.','_Ela sorriu._\n*The hunter should know that this is dangerous.*','*Thank you.*']) assert.ok(guard.validate(text,context).some(p=>p.includes('inglês')));
    assert.equal(guard.validate('_Alexia Song ergueu uma sobrancelha._\n*Você parece preocupado. Quer conversar?*',context).length,0);
});
test('cópia com oito palavras e formatação alterada é rejeitada; reação própria é aceita',()=>{
    assert.ok(guard.validate('_O jogador colocou a espada sobre a mesa._\n*O que procura?*',context).some(p=>p.includes('reproduziu')));
    assert.equal(guard.validate('_Alexia afasta a cadeira para abrir espaço._\n*Guarde sua arma antes de começarmos.*',context).length,0);
});
test('refaz resposta inválida antes de aceitar; mantém parâmetros do modelo',async()=>{
    const prompts=[],options={num_predict:900,thinking:false};
    const result=await guard.generate(async(prompt,opts)=>{prompts.push(prompt);assert.equal(opts,options);return {texto:prompts.length===1?'She looked at the hunter and smiled.':'_Alexia acena._\n*Pode entrar.*'};},'Cena original',context,options);
    assert.equal(prompts.length,2);assert.match(result.texto,/Pode entrar/);assert.match(prompts[1],/CORREÇÃO OBRIGATÓRIA/);assert.match(prompts[0],/português brasileiro/);
});
test('avisos de validacao nao descartam a cena',async()=>{
    let attempts=0;
    const result=await guard.generate(async()=>{attempts++;return {texto:'She looked at the hunter and smiled.'};},'Cena',context,{});
    assert.equal(result.texto,'She looked at the hunter and smiled.');
    assert.equal(attempts,2);
});
