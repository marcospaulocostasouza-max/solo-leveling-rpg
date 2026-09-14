const {test}=require('node:test'),assert=require('node:assert/strict');
const {obterResposta,mensagemErro}=require('../src/npc/conversationResponse');
const {formatarMensagem}=require('../src/utils/messageFormatter');
const guard=require('../src/ai/narrativeResponseGuard');
const npc={nome:'Alexia Song'};
test('fallback sem moldura e NPC com name recebem cabecalho',async()=>{
    const result=await obterResposta({primary:async()=>{throw new Error('falha');},fallback:async()=>'*Oi.*',npc:{name:'Alexia Song'},emotion:async()=>null});
    assert.ok(result.includes('_*Alexia Song*_'));
    assert.equal(result.split('Estado emocional:').length-1,1);
    assert.equal(formatarMensagem({name:'Alexia Song'},result),result);
});
test('fallback preserva uma única moldura',async()=>{
    const formatted=formatarMensagem(npc,'_Ela acena._');
    const result=await obterResposta({primary:async()=>{throw new Error('falha');},fallback:async()=>formatted,npc,emotion:async()=>null});
    assert.equal(result,formatted);assert.equal(result.split('Estado emocional:').length-1,1);
});
test('estado emocional indisponível não gera uma segunda cena',async()=>{
    let primary=0,fallback=0;
    const result=await obterResposta({primary:async()=>{primary++;return '_Ela acena._';},fallback:async()=>{fallback++;},npc,emotion:async()=>{throw new Error('estado');}});
    assert.equal(primary,1);assert.equal(fallback,0);assert.ok(result.endsWith('_Ela acena._'));
});
test('resposta descartada e erro legado preservam a causa',async()=>{
    const invalid=Object.assign(new Error('incoerente'),{code:'NARRATIVE_INVALID'});let fallback=0;
    await assert.rejects(obterResposta({primary:async()=>{throw invalid;},fallback:async()=>{fallback++;}}),error=>error===invalid);
    assert.equal(fallback,0);
    const offline=Object.assign(new Error('offline'),{code:'ECONNREFUSED'});
    await assert.rejects(obterResposta({primary:async()=>{throw new Error('primeira');},fallback:async()=>{throw offline;}}),error=>error===offline);
    assert.match(mensagemErro(offline),/Ollama/);assert.match(mensagemErro(invalid),/descartada/);assert.match(mensagemErro({code:'ETIMEDOUT'}),/demorou/);
});
test('nome deve coincidir; prefixo parecido não vale',()=>{
    const context={npc:{name:'Alexia Song'},message:'Oi'};
    for(const name of ['Alexia Songbird','Alexia Song Helena','Helena'])assert.ok(guard.validate(`*Meu nome é ${name}.*`,context).some(p=>p.includes('outro nome')));
    for(const name of ['Alexia','Alexia Song'])assert.deepEqual(guard.validate(`*Meu nome é ${name}.*`,context),[]);
});
test('pensamento privado não é usado como contexto visível nem como cena copiada',()=>{
    const {textoVisivelParaContexto}=require('../src/npc/sceneParser');
    const input='*Olá.*\n> Estou pensando sobre trauma passado infância amor conhecimento combate.';
    assert.equal(textoVisivelParaContexto(input),'Olá.');
    const context={npc:{name:'Alexia Song'},message:'> Estou pensando sobre trauma passado infância amor conhecimento combate.',messageVisible:''};
    assert.ok(!guard.validate('_Estou pensando sobre trauma passado infância amor conhecimento combate._',context).some(p=>p.includes('reproduziu')));
});
