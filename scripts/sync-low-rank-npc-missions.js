"use strict";

// Atualiza somente missões de aproximação ainda não concluídas. Pode ser
// executado novamente sem alterar histórico ou recompensas já entregues.
const fs = require("fs");
const path = require("path");
const database = require("../packages/database");
const QuestSystem = require("../apps/bot/src/systems/questSystem");

async function main() {
    await QuestSystem.garantirMetadadosMissoes();
    const directory = path.join(__dirname, "../apps/bot/src/missions/data");
    const missions = fs.readdirSync(directory).filter(name => name.endsWith(".json"))
        .map(name => JSON.parse(fs.readFileSync(path.join(directory, name), "utf8")))
        .map(data => data.missoes.find(mission => Number(mission.numero) === 5))
        .filter(Boolean);

    const changed = await database.transaction(async query => {
        let count = 0;
        for (const mission of missions) {
            const result = await query.run(
                `UPDATE missoes SET nome=?, descricao=?, rank=?, objetivo_texto=?, recompensa_xp=?, recompensa_won=?, recompensa_cristais=?, recompensa_item=?, nivel_recomendado=?
                 WHERE origem_missao_id=? AND status <> 'completa'`,
                [mission.nome, mission.descricao, mission.rank, mission.objetivo,
                    Number(mission.recompensas?.xp || 0), Number(mission.recompensas?.won || 0),
                    Number(mission.recompensas?.cristais || 0), mission.recompensas?.item || null,
                    mission.nivelMinimo ? `${mission.nivelMinimo}+` : null, mission.id]
            );
            count += Number(result.changes || 0);
        }
        return count;
    });
    console.log(JSON.stringify({ catalogos: missions.length, missoesPendentesAtualizadas: changed }));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
