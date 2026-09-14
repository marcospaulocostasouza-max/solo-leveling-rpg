'use strict';
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
function select(tickets,input,playerName){
 const value=normalize(input);
 if(!value)return null;
 if(/^\d+$/.test(value))return tickets.find(t=>Number(t.id)===Number(value))||null;
 const typed=value.replace(/^ticket(?: de)?\s+/, '');
 const type=/^(?:item|item unico)$/.test(typed)?'item_unico':/^(?:tecnica|tecnica unica)$/.test(typed)?'tecnica_unica':null;
 const matches=tickets.filter(t=>type?t.tipo===type:normalize(t.nome)===value || value===normalize(playerName));
 if(!matches.length)return null;
 if(!type&&matches.length>1)throw new Error('Há mais de um ticket disponível. Informe o tipo ou o ID exibido em !usar ticket.');
 return matches.sort((a,b)=>Number(a.id)-Number(b.id))[0];
}
module.exports={select,normalize};
