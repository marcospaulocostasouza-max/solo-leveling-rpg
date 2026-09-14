'use strict';
require('dotenv').config();
const database=require('../packages/database');
const {provider}=require('../packages/database/config');
const service=require('../apps/bot/src/systems/ticketQueueService').createService(database,provider);
service.repair().then(rows=>console.log(JSON.stringify(rows.map(row=>({nome:row.jogador_nome,posicao:row.posicao,tipo:row.tipo})),null,2))).catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(provider==='postgres')await require('../packages/database/postgres').getPool().end();});
