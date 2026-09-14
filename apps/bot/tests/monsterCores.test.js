const {test}=require('node:test');const assert=require('node:assert/strict');
const policy=require('../../../packages/datasets/monster-cores');
test('todos os ranks permitem somente o próprio rank e inferiores',()=>{
 const ranks=Object.keys(policy.prices);
 for(const [i,rank] of ranks.entries())for(const [j,required] of ranks.entries()){
  const action=()=>policy.assertCanBuy({rank},{nome:`Nucleo de Monstro Rank ${required}`});
  if(j>i)assert.throws(action,/rank ou inferior/);else assert.doesNotThrow(action);
 }
 assert.throws(()=>policy.assertCanBuy({}, {nome:'Núcleo Branco'}));
});
test('cores e rank são equivalentes; objetos de missão não são núcleos comerciais',()=>{
 assert.equal(policy.coreRank({nome:'Núcleo Verde'}),'C');
 assert.equal(policy.coreRank({nome:'Núcleo de Mana Primordial'}),null);
 const catalog=require('../src/database/forja_catalogo.json');
 for(const core of catalog.nucleos)assert.equal(core.preco,policy.prices[core.rank]);
});
