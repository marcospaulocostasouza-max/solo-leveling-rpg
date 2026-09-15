const {test}=require('node:test');const assert=require('node:assert/strict');const History=require('../src/systems/playerHistoryService');
test('remove duplicação entre recibo e fonte nativa sem apagar giros repetidos',()=>{
 const date='2026-09-15T12:00:00Z';const base={type:'Gacha',resource:'500 XP',quantity:500,direction:'entrada',origin:'GACHA',date};
 const rows=History.deduplicate([
  History.event({...base,reason:'GACHA: 500 XP',reference:'gacha:1:1',source:'LEDGER'}),
  History.event({...base,reason:'3★ no Banner',reference:'gacha:1:1',source:'GACHA_NATIVE'}),
  History.event({...base,reason:'3★ no Banner',reference:'gacha:1:2',source:'GACHA_NATIVE'})
 ]);
 assert.equal(rows.length,2);assert.ok(rows.every(row=>row.reason.includes('3★')));assert.deepEqual(rows.map(row=>row.reference).sort(),['gacha:1:1','gacha:1:2']);
});
test('normaliza nomes quantitativos do mesmo recurso sem misturar moedas',()=>{
 assert.equal(History.normalizedResource('200 XP'),'xp');assert.equal(History.normalizedResource('XP'),'xp');assert.notEqual(History.normalizedResource('Won'),History.normalizedResource('Cristais'));
});
test('não mescla eventos distintos ou registros da mesma fonte',()=>{
 const date='2026-09-15T12:00:00Z',make=(reference,source='XP_NATIVE')=>History.event({type:'XP',resource:'XP',quantity:200,direction:'entrada',origin:'PROGRESSO',date,reference,source});
 assert.equal(History.deduplicate([make('a'),make('b')]).length,2);
 assert.equal(History.deduplicate([make('a'),History.event({...make('b','LEDGER'),quantity:500})]).length,2);
});
test('pagina e filtro são interpretados em qualquer ordem e com acento',()=>{
 assert.deepEqual(History.parseRequest('!Histórico 2 Gacha'),{page:2,filter:'gacha'});
 assert.deepEqual(History.parseRequest('!atividades dungeon 3'),{page:3,filter:'dungeon'});
 const rows=[History.event({type:'Gacha',resource:'Item',reason:'Banner'}),History.event({type:'XP',resource:'XP'})];
 assert.equal(History.filter(rows,'gacha').length,1);
});
test('linha apresenta unidade, direção, horário, origem e referência',()=>{
 const command=require('../src/commands/atividades');
 const text=command.line(History.event({type:'Cristais',resource:'Cristais',quantity:500,direction:'entrada',reason:'Mineração concluída',origin:'DUNGEON_MINERACAO',reference:'mineracao:42',date:'2026-09-15T12:00:00Z'}),1);
 assert.match(text,/\+500 Cristais/);assert.match(text,/15\/09\/26, 09:00/);assert.match(text,/Dungeon Mineracao/);assert.match(text,/mineracao:42/);
});
