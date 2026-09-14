const {test}=require('node:test'),assert=require('node:assert/strict');
const {start,next,key}=require('../src/utils/dungeonWeek');
test('reset exatamente segunda às 00:00 de Brasília, mesmo com servidor UTC',()=>{
 const before=new Date('2026-09-14T02:59:59.999Z'),after=new Date('2026-09-14T03:00:00.000Z');
 assert.equal(key(before),'2026-09-07');assert.equal(key(after),'2026-09-14');
 assert.equal(next(before).toISOString(),after.toISOString());assert.equal(next(after).toISOString(),'2026-09-21T03:00:00.000Z');
 assert.equal(start(after).toISOString(),after.toISOString());
});
test('domingo não reinicia e virada do ano não divide a mesma semana',()=>{
 assert.equal(key(new Date('2026-09-13T15:00:00Z')),'2026-09-07');
 assert.equal(key(new Date('2026-12-31T15:00:00Z')),key(new Date('2027-01-01T15:00:00Z')));
});
