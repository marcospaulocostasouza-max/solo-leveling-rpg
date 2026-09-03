"use strict";

const path = require("path");
const { ATTRIBUTES, RANKS, SET_RANKS, TIERS, schemaFor } = require("./schemas");
const { CODES, issue } = require("./errors");

function normalize(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function result(errors, warnings, rulesChecked, sources) { return { valid: errors.length === 0, errors, warnings, rules_checked: [...new Set(rulesChecked)], sources: [...new Set(sources)] }; }
function checkSchema(content, schema, errors, rules) {
    rules.push(`schema:v${schema.version}`);
    for (const field of schema.required) if (content[field] === undefined || content[field] === null || content[field] === "" || (Array.isArray(content[field]) && !content[field].length)) errors.push(issue(CODES.VALIDATION_FAILED, `Campo obrigatório ausente: ${field}.`, field));
    for (const field of Object.keys(content)) if (!Object.hasOwn(schema.properties, field)) errors.push(issue(CODES.VALIDATION_FAILED, `Campo não permitido pelo schema: ${field}.`, field));
    for (const [field, definition] of Object.entries(schema.properties)) {
        if (content[field] == null) continue;
        const types = Array.isArray(definition.type) ? definition.type : [definition.type];
        const actual = Array.isArray(content[field]) ? "array" : content[field] === null ? "null" : Number.isInteger(content[field]) ? "integer" : typeof content[field];
        if (!types.includes(actual)) errors.push(issue(CODES.VALIDATION_FAILED, `Tipo inválido em ${field}: esperado ${types.join(" ou ")}.`, field));
        if (definition.minimum != null && Number(content[field]) < definition.minimum) errors.push(issue(CODES.VALIDATION_FAILED, `${field} não pode ser menor que ${definition.minimum}.`, field));
    }
}

class ForgeValidator {
    constructor(options = {}) {
        this.retriever = options.retriever;
        this.rules = options.rules || {};
        this.slots = options.slots || require(path.resolve(__dirname, "../../packages/database")).slots;
        if (options.forgeCombinations) this.forgeCombinations = options.forgeCombinations;
        else { try { this.forgeCombinations = require(path.resolve(__dirname, "../../apps/bot/src/systems/forjaSystem")).COMBINACOES_MATERIAIS; } catch { this.forgeCombinations = {}; } }
    }
    async validate(type, content) {
        const errors = [], warnings = [], rules = [], sources = [];
        const schema = schemaFor(type);
        if (!schema) return result([issue(CODES.UNKNOWN_TYPE, `Tipo de Forge desconhecido: ${type}.`)], [], [], []);
        checkSchema(content || {}, schema, errors, rules);
        if (type === "weapon" || type === "armor" || type === "accessory" || type === "equipment" || type === "consumable" || type === "material") await this.validateItem(type, content || {}, errors, warnings, rules, sources);
        if (type === "set") this.validateSet(content || {}, errors, warnings, rules);
        if (type === "passive" || type === "title") this.validateRanked(content || {}, errors, rules);
        if (type === "mission") await this.validateMission(content || {}, errors, warnings, rules, sources);
        if (type === "banner") this.validateBanner(content || {}, errors, warnings, rules);
        if (type === "dungeon") await this.validateDungeon(content || {}, errors, warnings, rules, sources);
        if (type === "guild") this.validateGuild(content || {}, errors, rules);
        if (type === "event") rules.push("database:eventos");
        await this.duplicates(content?.nome, errors, warnings, rules, sources);
        return result(errors, warnings, rules, sources);
    }
    async validateItem(type, content, errors, warnings, rules, sources) {
        rules.push("packages/database:index.slots", "database:itens"); sources.push("packages/database/index.js", "apps/bot/src/core/database.js");
        const slot = Object.keys(this.slots).find(value => normalize(value) === normalize(content.slot));
        if (type !== "material" && !slot) errors.push(issue(CODES.INVALID_SLOT, `Slot inexistente: ${content.slot || "não informado"}.`, "slot", { allowed: Object.keys(this.slots) }));
        if (content.tier && !TIERS.some(value => normalize(value) === normalize(content.tier))) errors.push(issue(CODES.UNKNOWN_RARITY, `Rank/Tier desconhecido: ${content.tier}.`, "tier", { allowed: TIERS }));
        const values = ATTRIBUTES.map(name => [`${name}_bonus`, content[`${name}_bonus`] ?? 0]);
        for (const [field, value] of values) if (!Number.isSafeInteger(value) || value < 0) errors.push(issue(CODES.INVALID_ATTRIBUTE, `Atributo ${field} deve ser inteiro não negativo.`, field));
        const total = values.reduce((sum, [, value]) => sum + (Number.isSafeInteger(value) ? value : 0), 0);
        const officialLimit = Number.isFinite(this.rules.attributeLimit) ? this.rules.attributeLimit : this.attributeLimit(type, content);
        if (Number.isFinite(officialLimit)) {
            rules.push("forjaSystem:COMBINACOES_MATERIAIS.bonusBase"); sources.push("apps/bot/src/systems/forjaSystem.js");
            if (total > officialLimit) errors.push(issue(CODES.ATTRIBUTE_LIMIT, `Total de atributos ${total} excede o limite oficial ${officialLimit} para esta categoria e Rank.`, "attributes", { total, limit: officialLimit }));
        } else if (type !== "material" && type !== "consumable") warnings.push(issue(CODES.RULE_NOT_FOUND, "Não foi encontrado limite oficial geral para bônus desta combinação de categoria/Rank; apenas formato e valores não negativos foram validados.", "attributes"));
        const expected = { weapon: ["Arma 1", "Arma 2"], armor: ["Cabeça", "Corpo", "Pernas", "Pés"], accessory: ["Acessórios"], consumable: ["Item de Apoio"] }[type];
        if (expected && slot && !expected.includes(slot)) errors.push(issue(CODES.INVALID_SLOT, `O slot ${slot} não é compatível com o tipo ${type}.`, "slot", { allowed: expected }));
        if (content.classe_requerida && normalize(content.classe_requerida) !== "nenhuma") await this.requireKnownEntity(content.classe_requerida, "classes", "classe_requerida", errors, warnings, sources);
        if (content.estilo_requerido && normalize(content.estilo_requerido) !== "nenhum") await this.requireKnownEntity(content.estilo_requerido, null, "estilo_requerido", errors, warnings, sources);
    }
    attributeLimit(type, content) {
        const category = { weapon: "arma", armor: "armadura", accessory: "acessorio", equipment: normalize(content.categoria), consumable: "consumivel", material: "material" }[type];
        const rank = String(content.tier || "").toUpperCase();
        const matches = Object.values(this.forgeCombinations || {}).filter(rule => String(rule.rank).toUpperCase() === rank && normalize(rule.categoria) === category && Number.isFinite(Number(rule.bonusBase)));
        return matches.length ? Math.max(...matches.map(rule => Number(rule.bonusBase))) : null;
    }
    validateSet(content, errors, warnings, rules) {
        rules.push("equipment_sets", "equipment_set_bonuses:2,4,6");
        if (content.rank && !SET_RANKS.includes(String(content.rank).toUpperCase())) errors.push(issue(CODES.UNKNOWN_RARITY, "Conjuntos aceitam apenas ranks D, C, B, A ou S.", "rank"));
        if (Array.isArray(content.itens) && content.itens.length < 6) errors.push(issue(CODES.VALIDATION_FAILED, "O conjunto precisa de pelo menos seis itens.", "itens"));
        const stages = new Set((content.estagios || []).map(stage => Number(stage.pecas)));
        for (const amount of [2, 4, 6]) if (!stages.has(amount)) errors.push(issue(CODES.VALIDATION_FAILED, `Falta o bônus de ${amount} equipamentos.`, "estagios"));
        if ((content.itens || []).some(item => !item.nome || !item.slot)) warnings.push(issue(CODES.RULE_NOT_FOUND, "Cada peça deve referenciar nome e slot válidos antes da futura publicação.", "itens"));
    }
    validateRanked(content, errors, rules) { rules.push("rank:E,D,C,B,A,S"); if (content.rank && !RANKS.includes(String(content.rank).toUpperCase())) errors.push(issue(CODES.UNKNOWN_RARITY, `Rank inválido: ${content.rank}.`, "rank")); }
    async validateMission(content, errors, warnings, rules, sources) {
        this.validateRanked(content, errors, rules); rules.push("database:missoes"); sources.push("apps/bot/src/core/database.js");
        for (const field of ["objetivo", "recompensa_xp", "recompensa_won"]) if (content[field] != null && (!Number.isSafeInteger(content[field]) || content[field] < 0)) errors.push(issue(CODES.VALIDATION_FAILED, `${field} deve ser inteiro não negativo.`, field));
        await this.requireKnownEntity(content.local, "locations", "local", errors, warnings, sources);
    }
    validateBanner(content, errors, warnings, rules) {
        rules.push("gacha_banners", "gacha_pool:weighted");
        if (!content.permanente) {
            const start = Date.parse(content.inicio_em); const end = Date.parse(content.fim_em);
            if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) errors.push(issue(CODES.VALIDATION_FAILED, "Banner temporário exige início e fim válidos, com fim posterior.", "periodo"));
        }
        for (const reward of content.pool || []) if (!reward.nome || !Number.isFinite(reward.peso) || reward.peso <= 0) errors.push(issue(CODES.VALIDATION_FAILED, "Cada recompensa do pool exige nome e peso positivo.", "pool"));
        if (content.custo_cristais == null) warnings.push(issue(CODES.RULE_NOT_FOUND, "O custo não foi fixado no draft; custos oficiais atuais são 100 para 1 giro e 1000 para 10.", "custo_cristais"));
        if (content.hard_pity == null) warnings.push(issue(CODES.RULE_NOT_FOUND, "Hard pity não foi inventado; deve ser obtido da configuração ativa do Gacha.", "hard_pity"));
    }
    async validateDungeon(content, errors, warnings, rules, sources) {
        this.validateRanked(content, errors, rules); rules.push("database:dungeons"); sources.push("apps/bot/src/core/database.js");
        for (const field of ["andar", "recompensa_xp", "recompensa_won"]) if (content[field] != null && (!Number.isSafeInteger(content[field]) || content[field] < (field === "andar" ? 1 : 0))) errors.push(issue(CODES.VALIDATION_FAILED, `${field} possui valor inválido.`, field));
        if (content.gate_tipo && !["comum", "vermelho", "red"].includes(normalize(content.gate_tipo))) errors.push(issue(CODES.VALIDATION_FAILED, "Tipo de Gate não confirmado. Use comum ou vermelho.", "gate_tipo"));
        await this.requireKnownEntity(content.local, "locations", "local", errors, warnings, sources);
    }
    validateGuild(content, errors, rules) {
        rules.push("guildas:nivel_1_10", "guildas:membros_10", "guildas:custo_200000");
        if (!Number.isInteger(content.nivel) || content.nivel < 1 || content.nivel > 10) errors.push(issue(CODES.VALIDATION_FAILED, "Nível de guilda deve estar entre 1 e 10.", "nivel"));
        if (!Number.isInteger(content.membros) || content.membros < 1 || content.membros > 10) errors.push(issue(CODES.VALIDATION_FAILED, "O limite atual é 10 membros.", "membros"));
        if (content.valor !== 200000) errors.push(issue(CODES.VALIDATION_FAILED, "O custo oficial para criar guilda é 200.000 Won.", "valor"));
    }
    async requireKnownEntity(value, category, field, errors, warnings, sources) {
        if (!value || !this.retriever) return;
        const found = await this.retriever.searchKnowledge(value, { ...(category ? { category } : {}), limit: 5 });
        const exact = found.some(item => normalize(item.entity) === normalize(value) || normalize(item.content).includes(normalize(value)));
        if (!exact) errors.push(issue(CODES.RULE_NOT_FOUND, `${field} não encontrado nas fontes oficiais: ${value}.`, field));
        else sources.push(...found.slice(0, 2).map(item => item.file));
    }
    async duplicates(name, errors, warnings, rules, sources) {
        if (!name || !this.retriever) return;
        rules.push("duplicate_check");
        const found = await this.retriever.searchKnowledge(name, { limit: 8 });
        const exact = found.filter(item => normalize(item.entity) === normalize(name));
        const similar = found.filter(item => normalize(item.entity) !== normalize(name) && normalize(item.entity).includes(normalize(name).split(" ")[0])).slice(0, 3);
        if (exact.length) warnings.push(issue(CODES.DUPLICATE_ENTITY, `Já existe entidade chamada ${name}.`, "nome", { matches: exact.map(item => item.entity) }));
        else if (similar.length) warnings.push(issue(CODES.DUPLICATE_ENTITY, `Foram encontrados nomes semelhantes a ${name}.`, "nome", { matches: similar.map(item => item.entity) }));
        sources.push(...[...exact, ...similar].map(item => item.file));
    }
}

module.exports = { ForgeValidator, normalize, checkSchema };
