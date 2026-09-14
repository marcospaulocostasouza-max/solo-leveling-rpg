'use strict';
const prices=Object.freeze({E:100000,D:250000,C:350000,B:500000,A:1000000,S:1500000});
const colors={branco:'E',amarelo:'D',verde:'C',azul:'B',vermelho:'A',roxo:'S'};
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function coreRank(item){
 const name=normalize(item.nome || item.item_nome);
 const color=name.match(/^nucleo (branco|amarelo|verde|azul|vermelho|roxo)$/);
 if(color)return colors[color[1]];
 return name.match(/^nucleo(?: de monstro)? rank ([edcbas])$/)?.[1].toUpperCase() || null;
}
function assertCanBuy(player,item){
 const required=coreRank(item);if(!required)return;
 const actual=String(player.rank||'').trim().toUpperCase();
 const order=['E','D','C','B','A','S','SS','SSS','NACIONAL'];
 if(order.indexOf(actual)<order.indexOf(required))throw new Error(`Você só pode comprar núcleos do seu rank ou inferior. Núcleo Rank ${required}; jogador Rank ${actual || 'não definido'}.`);
}
module.exports={prices,coreRank,assertCanBuy};
