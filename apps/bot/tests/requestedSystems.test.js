"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path"),parse=require("../src/utils/parseFichaCampos"),A=require("../src/systems/atributoSystem");
const campos=parse("!Add Quest\n*NOME:* Prova do Sistema\n> JOGADOR: Akashi Novachrono\nOBJETIVO: Vencer");
assert.equal(campos.nome,"Prova do Sistema");assert.equal(campos.jogador,"Akashi Novachrono");assert.equal(campos.objetivo,"Vencer");
assert.equal(A.BONUS_CLASSE_INICIAL.Assassino.atributo,"velocidade_base");
const handler=fs.readFileSync(path.join(__dirname,"../src/core/commandHandler.js"),"utf8");for(const comando of ["!maestria","!ler historia","!fquest","!fdungeon","!consultar dungeon semanal","!excluir item"])assert(handler.includes(comando),`Rota ausente: ${comando}`);
const progresso=fs.readFileSync(path.join(__dirname,"../src/commands/progresso.js"),"utf8");assert(!/![^\n]*(?:admin|adm)|(?:admin|adm)[^\n]*!/i.test(progresso));
console.log("requestedSystems.test.js: passou");
