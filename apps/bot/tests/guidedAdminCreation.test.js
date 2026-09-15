const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Wizard=require('../src/systems/creationWizardService');

test('questionários administrativos possuem todos os campos essenciais',()=>{
 const fields=type=>Wizard.questions(type).map(([field])=>field);
 assert.deepEqual(fields('GUILD'),['nome','lider','passivas']);
 for(const field of ['jogador','nome','rank','descricao','objetivo','quantidade','xp','won','cristais','item'])assert.ok(fields('MISSION').includes(field));
 assert.match(Wizard.questions('MISSION')[0][1],/Todos/);
 for(const field of ['nome','rank','tema','elemento','entrada','monstro','boss','bossHabilidades','xp','won'])assert.ok(fields('INSTANCE_DUNGEON').includes(field));
});

test('comandos guiados estão registrados no roteador',()=>{
 const handler=fs.readFileSync(path.join(__dirname,'../src/core/commandHandler.js'),'utf8');
 for(const command of ['!criar guilda','!criar missao','!criar dungeon instanciada'])assert.match(handler,new RegExp(command));
});
