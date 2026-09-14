const {test}=require('node:test');
const assert=require('node:assert/strict');
const db=require('../src/ai/npcDatabase');
const examples=require('../src/ai/narrativeExamples');
const {montarContextoParaCena}=require('../src/ia/ophiliaContextCache');
test('cumprimento não envia o dossiê integral nem duplica o prompt base',()=>{
    const profile=db.getNPC('ophilia').profile;
    const cached={contextoEssencial:'DOSSIÊ INTEGRAL '+ 'x'.repeat(26000),
        exemplosDialogo:examples.split(profile.sections.dialogExamples),exemplosCena:examples.split(profile.sections.sceneExamples)};
    const result=montarContextoParaCena(cached,'*Olá.*');
    assert.ok(result.contexto.includes(profile.core));
    assert.ok(!result.contexto.includes('DOSSIÊ INTEGRAL'));
    assert.ok(result.contexto.length<7500);
    const built=require('../src/ia/promptBuilderV2').construirPrompt({npc:profile.json,
        promptBase:'BASE DUPLICADA '+ 'x'.repeat(6750),ophiliaContextoOficial:result.contexto,
        historico:[],memorias:[],relacionamento:{vinculo:0,hostilidade:0}},'*Olá.*');
    assert.ok(!built.prompt.includes('BASE DUPLICADA'));
    assert.ok(built.prompt.length<16000);
    console.log(`Ophilia cumprimento: ${result.contexto.length} caracteres oficiais; ${built.prompt.length} caracteres de prompt.`);
});
test('validação recarrega exportação antiga em cache antes da geração',()=>{
    const f=require.resolve('../src/ai/narrativeFormatting'),g=require.resolve('../src/ai/narrativeResponseGuard');
    const saved=require.cache[f];
    require.cache[f]={...saved,exports:{FORMATACAO_NARRATIVA:'ANTIGA'}};delete require.cache[g];
    try {
        const guard=require(g);
        assert.deepEqual(guard.validate('_Ophilia acena._\n*Olá.*',{npc:{name:'Ophilia Clement'},message:'Oi'}),[]);
    } finally {require.cache[f]=saved;delete require.cache[g];}
});
test('diagnóstico inclui LLM interrompido e conta blocos apenas uma vez',()=>{
    const {PerformanceProfiler:Profiler}=require('../src/utils/performanceProfiler');
    const p=new Profiler();p.inicioTotal();p.inicio('LLM');p.marcos.LLM=Date.now()-12000;
    p.dados.PromptParts={Sistema:{caracteres:100,tokens:25},TOTAL:{caracteres:100,tokens:25},_budget:{tokens:50}};
    p.fimTotal();const report=p.gerarRelatorio();
    assert.match(report,/Gargalo principal: LLM/);assert.match(report,/TOTAL: 100 chars \| 25 tokens/);
    assert.ok(!report.includes('200 chars'));
});
