'use strict';
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function catalogPrice(item,catalog){
 const matches=catalog.filter(entry=>normalize(entry.nome)===normalize(item.nome));
 const ranked=matches.filter(entry=>normalize(entry.rank)===normalize(item.tier||item.rank));
 const prices=[...new Set((ranked.length?ranked:matches).map(entry=>Number(entry.preco)).filter(price=>Number.isSafeInteger(price)&&price>0))];
 return prices.length===1?prices[0]:0;
}
function originalPrice(item,catalog){
 const price=Number(item.preco);
 if(Number.isSafeInteger(price)&&price>0)return price;
 const official=catalogPrice(item,catalog);if(official)return official;
 const legacy=Number(item.valor);
 // 1000 é o DEFAULT da coluna, não evidência de preço original.
 return Number.isSafeInteger(legacy)&&legacy>0&&legacy!==1000?legacy:0;
}
module.exports={catalogPrice,originalPrice};
