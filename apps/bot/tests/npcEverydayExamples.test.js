const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),cp=require('child_process');
const database=require('../src/ai/npcDatabase'),examples=require('../src/ai/narrativeExamples');
const dataset=path.resolve(__dirname,'../NPC_LORA/dataset');
const {validarFormatacao}=require('../src/ai/narrativeFormatting');
test('74 NPCs: exemplos completos, falas próprias sem duplicação e limites explícitos',()=>{
    const ids=database.listNPCs().filter(id=>!id.startsWith('_'));
    assert.equal(ids.length,74);
    const allResponses=new Set();
    for(const id of ids){
        const profile=database.getNPC(id).profile;assert.ok(profile,id);
        const dialogs=examples.split(profile.sections.dialogExamples),scenes=examples.split(profile.sections.sceneExamples);
        assert.equal(dialogs.length,3,id);assert.equal(scenes.length,2,id);
        for(const block of [...dialogs,...scenes]){
            assert.match(block,/Condição:/,id);assert.match(block,/Entrada do jogador:/,id);assert.match(block,/Resposta exclusiva do NPC:/,id);
            const response=block.split('Resposta exclusiva do NPC:\n')[1];
            assert.ok(response && response.length<500,id);
            assert.ok(validarFormatacao(response),`Formatação do exemplo: ${id}`);
            assert.ok(!allResponses.has(response),`Resposta repetida: ${id}`);allResponses.add(response);
            assert.ok(!/REVISAR MANUALMENTE|Ã/.test(block),id);
        }
        for(const message of ['Olá.','Como foi seu dia?','Preciso de ajuda.','Discordo, insisto.','Permaneço calado.']){
            const selected=examples.select(profile,message,{vinculo:0});assert.ok(selected.length<=1500,id);
            for(const block of examples.split(selected))assert.ok([...dialogs,...scenes].includes(block),`Exemplo cortado: ${id}`);
        }
    }
});
test('seleção escolhe situação; não autoriza romance por vínculo sozinho nem corta blocos',()=>{
    const profile=database.getNPC('cyrus_albright').profile;
    assert.match(examples.select(profile,'Olá.').split('\n')[0],/cumprimento/);
    assert.match(examples.select(profile,'Como foi seu dia?').split('\n')[0],/cotidiano/);
    const romantic='--- Diálogo 1: Romance ---\nVínculo mínimo: 70\nResposta exclusiva do NPC:\n*Amor.*';
    const p={sections:{dialogExamples:romantic}};
    assert.equal(examples.select(p,'romance',{vinculo:100}),'');
    assert.equal(examples.select(p,'romance',{vinculo:20,romanceConsentido:true}),'');
    assert.equal(examples.select(p,'romance',{vinculo:100,romanceConsentido:true}),romantic);
    assert.equal(examples.select(p,'romance',{vinculo:100,romanceConsentido:true},10),'');
});
test('personalidades Markdown existentes e campos canônicos JSON permanecem intactos',()=>{
    const files=fs.readdirSync(path.resolve(__dirname,'../src/npc/data')).filter(f=>f.endsWith('.json'));
    for(const file of files){
        const relative=`apps/bot/src/npc/data/${file}`;
        let original;try{original=JSON.parse(cp.execFileSync('git',['show',`HEAD:${relative}`],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));}catch{continue;}
        const actual=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../src/npc/data',file),'utf8'));
        for(const key of ['id','nome','personalidade','historia','atributos','rank','classe','habilidade_unica'])assert.deepEqual(actual[key],original[key],`${file}: ${key}`);
    }
    for(const id of database.listNPCs().filter(id=>!id.startsWith('_'))){
        const relative=`apps/bot/NPC_LORA/dataset/${id}/04_personality.md`;
        let original;try{original=cp.execFileSync('git',['show',`HEAD:${relative}`],{encoding:'utf8',stdio:['ignore','pipe','ignore']});}catch{continue;}
        assert.equal(fs.readFileSync(path.join(dataset,id,'04_personality.md'),'utf8'),original,id);
    }
});
