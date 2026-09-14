const {test}=require('node:test');const assert=require('node:assert/strict');
const guard=require('../src/utils/characterSubmissionGuard');
const fs=require('node:fs');const vm=require('node:vm');
test('confirmar ficha bloqueia personagem existente antes de ler ou atualizar pendências',async()=>{
 const sent=[];const queries=[];const db={get(sql,args,callback){queries.push(sql);callback(null,{id:5,nome:'Player'});}};
 const module={exports:{}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/commands/confirmarFicha'),'utf8'),{module,console:{log(){},error(){}},require:dep=>dep==='../core/database'?db:dep==='../core/messageService'?{send:async payload=>sent.push(payload.text)}:dep==='../utils/characterSubmissionGuard'?guard:dep==='../elementos/listaElementos'?[]:{}});
 await module.exports({author:'5511@c.us',body:'!confirmar ficha'});
 assert.deepEqual(sent,[guard.message]);assert.equal(queries.length,1);assert.match(queries[0],/FROM jogadores/);
});
test('guard permite novo jogador e propaga erro de consulta sem assumir ausência',async()=>{
 assert.equal(await guard.existingCharacter({get:(sql,args,cb)=>cb(null,null)},'novo'),null);
 await assert.rejects(guard.existingCharacter({get:(sql,args,cb)=>cb(new Error('offline'))},'novo'),/offline/);
});
