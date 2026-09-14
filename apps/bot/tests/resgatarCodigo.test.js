const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
function fixture(player={id:42},error=null){
 const sent=[],calls=[];let actor;
 const module={exports:{}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/commands/resgatarCodigo'),'utf8'),{module,console,require:name=>name.includes('messageService')?{send:async data=>sent.push(data.text)}:name.endsWith('/redeem')?{getService:()=>({claim:async(id,code)=>{calls.push([id,code]);if(error)throw error;return {message:'Código resgatado com sucesso.',rewards:[{nome:'XP',quantidade:500},{nome:'Won',quantidade:100000}]};}})}:{playerByPhone:async value=>{actor=value;return player;}}});
 return {command:module.exports,sent,calls,actor:()=>actor};
}
test('resgata com identidade do autor e mostra quantidades',async()=>{
 const f=fixture();await f.command({body:'!resgatar código: solo2026',author:'PLAYER',from:'GROUP'});
 assert.equal(f.actor(),'PLAYER');assert.equal(f.calls[0][0],42);assert.equal(f.calls[0][1],'solo2026');assert.match(f.sent[0],/500 XP/);assert.match(f.sent[0],/100\.000 Won/);
});
test('privado, ficha ausente e sintaxe inválida',async()=>{
 const f=fixture();await f.command({body:'!resgatar codigo: SOLO2026',from:'PLAYER'});assert.equal(f.actor(),'PLAYER');
 const missing=fixture(null);await missing.command({body:'!resgatar codigo: SOLO2026',from:'PLAYER'});assert.equal(missing.calls.length,0);assert.match(missing.sent[0],/ficha/);
 await f.command({body:'!resgatar codigo: ',from:'PLAYER'});assert.equal(f.calls.length,1);assert.match(f.sent[1],/Use/);
});
test('duplicidade do serviço compartilhado mantém mensagem clara',async()=>{
 const f=fixture({id:42},Object.assign(new Error('Você já resgatou este código.'),{code:'ALREADY_CLAIMED'}));await f.command({body:'!resgatar codigo: SOLO2026',from:'PLAYER'});assert.match(f.sent[0],/já resgatou/);
});
