"use strict";

const database = require("../packages/database");
const { nomeConjuntoUnico, nomeItemUnico } = require("./equipment-catalog-naming");

function retirarRank(nome) {
    return String(nome || "").replace(/\s*—\s*Rank\s+[DCBAS]\s*$/i, "").trim();
}

async function main() {
    const conjuntos = await database.all(`SELECT id, nome, rank FROM equipment_sets WHERE ativo=1
        ORDER BY CASE rank WHEN 'D' THEN 1 WHEN 'C' THEN 2 WHEN 'B' THEN 3 WHEN 'A' THEN 4 WHEN 'S' THEN 5 ELSE 6 END, id`);
    const indicePorRank = {};
    const alteracoes = await database.transaction(async query => {
        let conjuntosAlterados = 0; let itensAlterados = 0;
        for (const conjunto of conjuntos) {
            const rank = String(conjunto.rank).toUpperCase();
            const indice = indicePorRank[rank] || 0; indicePorRank[rank] = indice + 1;
            const nomeAntigo = conjunto.nome;
            const nomeNovo = nomeConjuntoUnico(retirarRank(nomeAntigo).split(":")[0], rank, indice);
            if (nomeNovo !== nomeAntigo) {
                await query.run("UPDATE equipment_sets SET nome=?, atualizado_em=CURRENT_TIMESTAMP WHERE id=?", [nomeNovo, conjunto.id]);
                await query.run("UPDATE itens SET descricao=REPLACE(descricao, ?, ?) WHERE id IN (SELECT item_id FROM equipment_set_items WHERE set_id=?)", [nomeAntigo, nomeNovo, conjunto.id]);
                conjuntosAlterados++;
            }
            const itens = await query.all("SELECT i.id,i.nome FROM equipment_set_items esi JOIN itens i ON i.id=esi.item_id WHERE esi.set_id=?", [conjunto.id]);
            for (const item of itens) {
                const base = retirarRank(item.nome);
                const nomeItemNovo = nomeItemUnico(base, rank);
                if (nomeItemNovo !== item.nome) {
                    await query.run("UPDATE itens SET nome=? WHERE id=?", [nomeItemNovo, item.id]);
                    itensAlterados++;
                }
            }
        }
        return { conjuntosAlterados, itensAlterados };
    });
    console.log(JSON.stringify(alteracoes, null, 2));
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
