"use strict";
const database = require("../../../../packages/database");
const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const num = value => Number(value || 0);
const fmt = value => num(value).toLocaleString("pt-BR");
function generatedItemDescription(item) {
  const bonuses = [["Força",item.forca_bonus],["Resistência",item.resistencia_bonus],["Velocidade",item.velocidade_bonus],["Sentidos",item.sentidos_bonus],["Inteligência",item.inteligencia_bonus],["Poder Mágico",item.poder_magico_bonus]].filter(([,v])=>num(v));
  const benefit=bonuses.length?` Favorece ${bonuses.map(([n])=>n).join(", ")}.`:"";
  const effect=String(item.efeito||"").trim();
  return `${item.categoria||"Item"} de Rank ${item.rank||item.tier||"não definido"}, integrado ao catálogo do RPG.${benefit}${effect?` Efeito: ${effect}`:""}`;
}
function description(item){const value=String(item.descricao||"").trim();return value&&value!=="?"?value:generatedItemDescription(item);}
function itemSheet(item) {
  const attrs=[["Força",item.forca_bonus],["Resistência",item.resistencia_bonus],["Velocidade",item.velocidade_bonus],["Sentidos",item.sentidos_bonus],["Inteligência",item.inteligencia_bonus],["Poder Mágico",item.poder_magico_bonus]].filter(([,v])=>num(v));
  const lines=[`_*「 ITEM — ${item.nome} 」*_`,`> *ID:* ${item.id}`,`> *Rank:* ${item.rank||item.tier||"Não informado"}`,`> *Categoria:* ${item.categoria||"Não informada"}`,`> *Slot:* ${item.slot||"Não se equipa"}`,`> *Descrição:* ${description(item)}`];
  if(String(item.efeito||"").trim())lines.push(`> *Efeito:* ${String(item.efeito).trim()}`);
  lines.push(`> *Atributos:* ${attrs.length?attrs.map(([n,v])=>`${n} ${num(v)>0?"+":""}${fmt(v)}`).join(" | "):"Sem bônus numérico"}`);
  const price=num(item.preco||item.valor);if(price)lines.push(`> *Valor:* ${fmt(price)} Won`);
  lines.push("",`_Consulta: !consultar item ${item.nome}_`);return lines.join("\n");
}
function techniqueSheet(t) {
  return [`_*「 TÉCNICA — ${t.nome} 」*_`,`> *ID:* ${t.id}`,`> *Rank:* ${t.rank||"Não informado"}`,`> *Classe:* ${t.classe||"Todas"}`,`> *Categoria:* ${t.categoria||"Não informada"}`,`> *Tipo:* ${t.tipo||(num(t.passiva)?"Passiva":"Ativa")}`,`> *Custo de mana:* ${t.custo_mana??"Não informado"}`,`> *Recarga:* ${t.cooldown||"Não informada"}`,`> *Nível necessário:* ${t.nivel_desbloqueio||1}`,`> *Descrição:* ${String(t.descricao||"").trim()||"Técnica integrada ao sistema do RPG."}`,String(t.efeito||"").trim()?`> *Efeito:* ${String(t.efeito).trim()}`:null,"",`_Consulta: !consultar técnica ${t.nome}_`].filter(v=>v!==null).join("\n");
}
async function find(type,name){const table=type==="TECNICA"?"tecnicas":"itens";let rows;if(/^\d+$/.test(String(name).trim())){const row=await database.get(`SELECT * FROM ${table} WHERE id=?`,[Number(name)]);rows=row?[row]:[];}else{const wanted=normalize(name);rows=(await database.all(`SELECT * FROM ${table}`)).filter(row=>normalize(row.nome)===wanted);}if(type==="PASSIVA")rows=rows.filter(row=>normalize(row.categoria)==="passiva");if(type==="TITULO")rows=rows.filter(row=>normalize(row.categoria)==="titulo");return rows;}
async function direct(name){const wanted=normalize(name);if(!wanted)return null;const [items,techniques]=await Promise.all([database.all("SELECT * FROM itens"),database.all("SELECT * FROM tecnicas")]);const item=items.find(row=>normalize(row.nome)===wanted),technique=techniques.find(row=>normalize(row.nome)===wanted);if(!item&&!technique)return null;if(item&&technique)return `${await customSheet("ITEM",item)||itemSheet(item)}\n\n${await customSheet("TECNICA",technique)||techniqueSheet(technique)}`;const entity=item||technique,type=item?"ITEM":"TECNICA";return await customSheet(type,entity)||(item?itemSheet(item):techniqueSheet(technique));}
async function customSheet(type,entity){try{const receipt=await database.get("SELECT * FROM custom_content_receipts WHERE entity_id=? AND "+(type==="TECNICA"?"kind='TECNICA'":"kind<>'TECNICA'"),[entity.id]);if(!receipt)return null;const data=JSON.parse(receipt.sheet_json||"{}");Object.assign(data,{nome:entity.nome,descricao:entity.descricao,rank:entity.rank||entity.tier});if(receipt.kind==="ITEM")for(const key of ["forca","resistencia","velocidade","sentidos","inteligencia","poder_magico"])data[key]=num(entity[key+"_bonus"]);if(receipt.kind==="TECNICA")for(const key of ["classe","categoria","tipo","custo_mana","cooldown","nivel_desbloqueio"])data[key]=entity[key];const player=await database.get("SELECT id,nome FROM jogadores WHERE id=?",[receipt.player_id]);return require("./contentCreationService").sheet(receipt.kind,data,player);}catch(error){if(/no such table|does not exist/i.test(error.message))return null;throw error;}}
async function backfillDescriptions(){const rows=await database.all("SELECT * FROM itens WHERE descricao IS NULL OR TRIM(descricao)='' OR TRIM(descricao)='?'");for(const item of rows)await database.run("UPDATE itens SET descricao=? WHERE id=?",[generatedItemDescription(item),item.id]);return rows.length;}
module.exports={normalize,find,direct,itemSheet,techniqueSheet,customSheet,generatedItemDescription,backfillDescriptions};
