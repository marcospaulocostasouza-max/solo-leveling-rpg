"use strict";

const ITEM_TYPES = new Set(["weapon", "armor", "accessory", "equipment", "consumable", "material"]);

async function analyzeEntity(engine, type, content = {}, options = {}) {
    let report = null;
    if (ITEM_TYPES.has(type)) report = await engine.analyzeItem(content, options);
    else if (type === "banner") report = engine.analyzeBanner(content, content.pool || [], options);
    else if (type === "dungeon") report = engine.analyzeDungeon(content, options);
    else if (type === "passive") report = engine.analyzePassive(content, options);
    if (!report) return null;
    return report.id ? report : engine.record(report);
}

async function qualityGate({ engine, type, content, options = {} }) {
    const report = await analyzeEntity(engine, type, content, options);
    if (!report) return { passed: true, report: null, blockers: [] };
    const blockers = report.issues.filter(issue => issue.severity === "CRITICAL" || (
        issue.kind === "EXPLOIT" && issue.severity === "HIGH" && process.env.CARDINAL_BLOCK_HIGH_EXPLOITS === "true"
    ));
    return { passed: report.valid !== false && blockers.length === 0, report, blockers };
}

function developerImpact(files = []) {
    const paths = files.map(file => String(file).toLowerCase());
    const scopes = new Set();
    if (paths.some(file => /gacha|banner/.test(file))) scopes.add("gacha-and-economy");
    if (paths.some(file => /dungeon|world|evento/.test(file))) scopes.add("dungeons-and-world");
    if (paths.some(file => /item|equip|set|invent/.test(file))) scopes.add("items-and-equipment");
    if (paths.some(file => /econom|won|loja|shop/.test(file))) scopes.add("economy");
    return [...scopes];
}

module.exports = { ITEM_TYPES, analyzeEntity, qualityGate, developerImpact };
