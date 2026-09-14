const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const formatting=require('../src/systems/contentCreationService');
test('consulta exibe descrição bônus e proprietário do item personalizado',async()=>{
 const sent=[];const entity={id:9,nome:'Anel Único',tier:'D',descricao:'Descrição completa do anel.',forca_bonus:20};
 const database={all:async()=>[entity],get:async sql=>sql.includes('custom_content_receipts')?{kind:'ITEM',player_id:2,sheet_json:JSON.stringify({categoria:'Acessório',slot:'Acessórios',efeito:'Brilha.',condicao:'Ao equipar.',preco:0})}:{id:2,nome:'Ágata'}};
 const module={exports:{}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/commands/consultarConteudo'),'utf8'),{module,require:dep=>dep==='../core/messageService'?{send:async payload=>sent.push(payload.text)}:dep==='../../../../packages/database'?database:dep==='../systems/contentCreationService'?formatting:dep==='../systems/contentCreationWizard'?{service:{ensure:async()=>{}}}:null});
 await module.exports({body:'!consultar item Anel Único'});
 assert.match(sent[0],/Descrição completa do anel/);assert.match(sent[0],/FORCA:\* 20/);assert.match(sent[0],/Ágata \(ID 2\)/);
});
