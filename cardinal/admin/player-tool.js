"use strict";
const { EntityResolver } = require("./resolver");
const { AdminError, CODES } = require("./errors");
const fields = ["nome", "classe", "classe_avancada", "estilo_luta", "rank", "nivel", "forca_base", "resistencia_base", "velocidade_base", "sentidos_base", "inteligencia_base", "poder_magico_base"];
function playerTool() {
    return { name: "edit_player", permission: "CARDINAL_PLAYER_ADMIN", risk: "HIGH", input_schema: { required: ["player", "changes"], description: "Altera nome, classe, classe_avancada, estilo_luta, rank, nivel ou atributos *_base da ficha. changes é um objeto com os campos e novos valores." }, async execute(ctx, params) {
        const entries = Object.entries(params.changes || {});
        if (!entries.length || entries.some(([key]) => !fields.includes(key))) throw new AdminError(CODES.INVALID_INPUT, `Campos da ficha: ${fields.join(", ")}.`);
        const player = await new EntityResolver(ctx.query).resolve("jogadores", params.player);
        const changes = Object.fromEntries(entries.map(([key, value]) => {
            if (key.endsWith("_base")) { if (!Number.isSafeInteger(value) || value < 0) throw new AdminError(CODES.INVALID_INPUT, "Atributo deve ser um inteiro não negativo."); }
            else if (key === "nivel") { if (!Number.isSafeInteger(value) || value < 1) throw new AdminError(CODES.INVALID_INPUT, "Nível deve ser um inteiro positivo."); }
            else { if (typeof value !== "string" || !value.trim() || value.length > 150) throw new AdminError(CODES.INVALID_INPUT, `${key} inválido.`); value = value.trim(); }
            if (key === "rank") { value = value.toUpperCase(); if (!/^[EDCBAS]$/.test(value)) throw new AdminError(CODES.INVALID_INPUT, "Rank inválido."); }
            return [key, value];
        }));
        if (changes.nome) {
            const same = await ctx.query.all("SELECT id,nome FROM jogadores WHERE LOWER(TRIM(nome))=LOWER(TRIM(?)) AND id<>?", [changes.nome, player.id]);
            if (same.length) throw new AdminError(CODES.INVALID_INPUT, "Outro jogador já usa esse nome.");
        }
        const before = Object.fromEntries(Object.keys(changes).map(key => [key, player[key]]));
        if (!ctx.dryRun) {
            for (const [key, value] of Object.entries(changes)) await ctx.query.run(`UPDATE jogadores SET ${key}=? WHERE id=?`, [value, player.id]);
            if (ctx.database.recalculateAttributes) await ctx.database.recalculateAttributes(player.id, ctx.query);
        }
        return { entity: { type: "player", id: player.id, name: player.nome }, before, after: changes, result: { success: true }, rollback: { kind: "fields", table: "jogadores", id: player.id, values: before } };
    } };
}
module.exports = { playerTool };
