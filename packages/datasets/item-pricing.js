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
const statKeys=['forca','resistencia','velocidade','sentidos','inteligencia','poder_magico'];
function attributes(item){return statKeys.reduce((total,key)=>total+Math.max(0,Number(item[key+'_bonus']||0)),0);}
function category(item){
 const text=normalize(item.slot||item.categoria).replace(/^slot de /,'');
 if(/material|minerio|nucleo/.test(text))return 'material';
 if(/apoio|consumivel|chave|titulo|passiva/.test(text))return 'apoio';
 if(/acessor/.test(text))return 'acessorios';
 if(/armadura/.test(text))return 'corpo';
 if(/escudo/.test(text))return 'arma 2';
 if(text==='arma')return 'arma 1';
 return text;
}
function estimatePrice(item,catalog){
 const original=originalPrice(item,catalog);
 if(original)return {price:original,source:'estabelecido'};
 const ranks={inicial:'E',comum:'E',raro:'D',epico:'B',lendario:'A',unico:'S'};
 const raw=normalize(item.tier||item.rank);const rank=/^[edcbas]$/.test(raw)?raw.toUpperCase():ranks[raw]||'E';
 const candidates=catalog.filter(entry=>String(entry.rank).toUpperCase()===rank&&Number.isSafeInteger(Number(entry.preco))&&Number(entry.preco)>0);
 const matching=candidates.filter(entry=>category(entry)===category(item));
 const reference=matching.length?matching:candidates.filter(entry=>category(entry)!=='material');
 if(!reference.length)throw new Error(`Sem referência de loja para estimar ${item.nome}.`);
 const mean=reference.reduce((sum,entry)=>sum+Number(entry.preco),0)/reference.length;
 const meanAttributes=reference.reduce((sum,entry)=>sum+attributes(entry),0)/reference.length;
 const itemAttributes=attributes(item);
 // Metade do valor deriva do tipo/rank; metade cresce com a força relativa.
 const combatReferences=candidates.filter(entry=>category(entry)!=='material'&&attributes(entry)>0);
 const fallbackAttributes=combatReferences.length?combatReferences.reduce((sum,entry)=>sum+attributes(entry),0)/combatReferences.length:0;
 const factor=meanAttributes>0?0.5+0.5*itemAttributes/meanAttributes:
  itemAttributes>0&&fallbackAttributes>0?1+0.5*itemAttributes/fallbackAttributes:1;
 const price=Math.max(2,Math.round(mean*factor));
 if(!Number.isSafeInteger(price))throw new Error(`Atributos ou valor inválido para ${item.nome}.`);
 return {price,source:'estimado',rank,category:category(item),samples:reference.length,mean,meanAttributes,itemAttributes,factor};
}
module.exports={catalogPrice,originalPrice,estimatePrice,attributes,category};
