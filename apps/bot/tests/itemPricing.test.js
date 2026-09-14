const {test}=require('node:test');const assert=require('node:assert/strict');
const {originalPrice,estimatePrice}=require('../../../packages/datasets/item-pricing');
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
 assert.ok(venda.calcularValorVenda({nome:'Desconhecido',preco:0,valor:1000})>0);
 assert.equal(venda.calcularValorVenda({nome:'Cristal Grande',preco:0,valor:1000}),100000);
});
test('estimativa usa média do mesmo tipo/rank e valoriza atributos altos',()=>{
 const catalog=[{nome:'Referência 1',rank:'D',categoria:'Arma 1',preco:200000,forca_bonus:10},{nome:'Referência 2',rank:'D',categoria:'Arma 1',preco:400000,forca_bonus:30},{nome:'Outra categoria',rank:'D',categoria:'Corpo',preco:900000,forca_bonus:20}];
 const base={nome:'Novo',tier:'D',categoria:'Arma',preco:0,valor:1000};
 const average=estimatePrice({...base,forca_bonus:20},catalog),strong=estimatePrice({...base,forca_bonus:60},catalog);
 assert.equal(average.price,300000);assert.equal(strong.price,600000);assert.equal(average.samples,2);
 assert.equal(estimatePrice({...base,preco:70000},catalog).price,70000);
 assert.equal(estimatePrice({...base,preco:0,valor:25000},catalog).price,25000);
});
test('Inicial usa referência E e estimativa não cria atributos',()=>{
 const item={nome:'Arma inicial',tier:'Inicial',categoria:'Arma 1',preco:0,valor:1000,forca_bonus:5};
 const copy=JSON.stringify(item);assert.ok(estimatePrice(item,[{nome:'Arma comum',rank:'E',categoria:'Arma 1',preco:100000,forca_bonus:10}]).price>0);assert.equal(JSON.stringify(item),copy);
});
test('apoio com atributos altos também recebe valorização',()=>{
 const catalog=[{nome:'Poção',rank:'D',categoria:'Itens de Apoio',preco:100000},{nome:'Arma',rank:'D',categoria:'Arma 1',preco:300000,forca_bonus:20}];
 const base={nome:'Amuleto de apoio',tier:'D',categoria:'Item de Apoio',preco:0,valor:1000};
 assert.equal(estimatePrice(base,catalog).price,100000);
 assert.equal(estimatePrice({...base,forca_bonus:40},catalog).price,200000);
});
