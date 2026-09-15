const {test}=require("node:test");
const assert=require("node:assert/strict");
const catalog=require("../src/systems/catalogConsultationService");
test("ficha comum exibe descrição atributos e valor",()=>{const text=catalog.itemSheet({id:9,nome:"Anel Único",tier:"D",categoria:"Acessório",slot:"Acessórios",descricao:"Descrição completa do anel.",efeito:"Brilha.",forca_bonus:20,preco:5000});assert.match(text,/Descrição completa do anel/);assert.match(text,/Força \+20/);assert.match(text,/5\.000 Won/);});
test("descrição ausente é gerada com categoria rank e atributos",()=>{const text=catalog.itemSheet({id:10,nome:"Lâmina Nova",tier:"C",categoria:"Arma",descricao:"",velocidade_bonus:15});assert.match(text,/Arma de Rank C/);assert.match(text,/Favorece Velocidade/);assert.match(text,/Velocidade \+15/);});
