'use strict';
const message='*NOVA FICHA NÃO PERMITIDA*\nVocê já possui um personagem criado. Não é possível enviar outra ficha para avaliação.\nUse !jogador para consultar sua ficha atual.';
async function existingCharacter(database,number){
 return new Promise((resolve,reject)=>database.get('SELECT id,nome FROM jogadores WHERE numero=? AND COALESCE(ficha_aprovada,0)=1',[number],(error,row)=>error?reject(error):resolve(row||null)));
}
module.exports={message,existingCharacter};
