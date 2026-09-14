const {test}=require('node:test');const assert=require('node:assert/strict');
const {originalPrice}=require('../../../packages/datasets/item-pricing');
const fs=require('node:fs'),vm=require('node:vm');
const moduleVenda={exports:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../src/systems/vendaSystem'),'utf8'),{module:moduleVenda,require:name=>name==='../../../../packages/datasets/item-pricing'?require('../../../packages/datasets/item-pricing'):name==='../../../../packages/datasets/catalog'?require('../../../packages/datasets/catalog'):{}});
test('preço ausente recupera catálogo e ignora DEFAULT 1000',()=>{
 const catalog=[{nome:'Adaga do Aspirante',rank:'E',preco:100000}];
 assert.equal(originalPrice({nome:'Adaga do Aspirante',tier:'E',preco:0,valor:1000},catalog),100000);
 assert.equal(originalPrice({nome:'Desconhecido',preco:0,valor:1000},catalog),0);
 assert.equal(originalPrice({nome:'Personalizado',preco:60000,valor:1000},catalog),60000);
 assert.equal(originalPrice({nome:'Barato',preco:1000,valor:1000},catalog),1000);
});
test('preço ambíguo não escolhe valor de outro rank',()=>{
 const catalog=[{nome:'Anel',rank:'E',preco:100000},{nome:'Anel',rank:'D',preco:300000}];
 assert.equal(originalPrice({nome:'Anel',tier:'D',preco:0,valor:1000},catalog),300000);
 assert.equal(originalPrice({nome:'Anel',preco:0,valor:1000},catalog),0);
});
test('proposta e confirmação usam metade do preço oficial e quantidade correta',()=>{
 const venda=moduleVenda.exports;
 assert.equal(venda.calcularValorVenda({nome:'Adaga do Aspirante',tier:'E',preco:0,valor:1000}),50000);
 assert.equal(venda.calcularValorVenda({nome:'Adaga do Aspirante',tier:'E',preco:0,valor:1000},3),150000);
 assert.equal(venda.calcularValorVenda({nome:'Desconhecido',preco:0,valor:1000}),0);
 assert.equal(venda.calcularValorVenda({nome:'Cristal Grande',preco:0,valor:1000}),100000);
});
