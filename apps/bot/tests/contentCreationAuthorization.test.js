const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
test('player não inicia criação guiada nem cria sessão',async()=>{
 let writes=0;const module={exports:{}};
 const factory={...require('../src/systems/contentCreationService'),createService:()=>({start:async()=>{writes++;},get:async()=>{writes++;}})};
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/systems/contentCreationWizard'),'utf8'),{module,require:dep=>dep==='../core/adminCore'?{isAdmin:async()=>false}:dep==='./contentCreationService'?factory:dep==='../../../../packages/database/config'?{provider:'sqlite'}:{}});
 await assert.rejects(module.exports.start({author:'player',from:'chat'},'ITEM'),/Apenas ADM/);assert.equal(writes,0);
});
