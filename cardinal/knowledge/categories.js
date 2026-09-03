"use strict";

const RULES = [
    ["sets", /conjunto|equipment.?set/], ["equipment", /equip|slot|inventar/], ["weapons", /arma|weapon|forja/],
    ["materials", /material|minera|nucleo|fermenta/], ["skills", /tecnic|habilidade|maestria|skill/],
    ["passives", /passiv/], ["titles", /titulo/], ["classes", /classe/], ["attributes", /atribut|forca|resistencia|inteligencia/],
    ["ranks", /\brank\b|nivel|progress/], ["missions", /miss|quest/], ["banners", /banner|gacha|cristal/],
    ["economy", /econom|won|loja|compra|venda|invest/], ["dungeons", /dungeon|masmorra|gate/], ["npcs", /\bnpc\b|personagen/],
    ["guilds", /guilda/], ["territories", /territorio|guerra/], ["locations", /local|viagem|mapa|cidade/],
    ["events", /evento|atividade/], ["administration", /admin|aprovar|recusar|avaliar/]
];

function categorizar(source, content = "") {
    const texto = `${source} ${content.slice(0, 800)}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return RULES.find(([, pattern]) => pattern.test(texto))?.[0] || "rules";
}

const SYNONYMS = Object.freeze({
    espada: ["arma", "lamina", "forja"], armadura: ["equipamento", "protecao", "slot"],
    mochila: ["inventario", "itens"], dinheiro: ["won", "economia"], moeda: ["won", "cristais"],
    upar: ["nivel", "experiencia", "xp", "progressao"], evoluir: ["nivel", "rank", "progressao"],
    poder: ["atributo", "forca", "poder magico"], golpe: ["tecnica", "habilidade"], skill: ["tecnica", "habilidade"],
    cla: ["guilda"], gremio: ["guilda"], masmorra: ["dungeon", "gate"], portal: ["gate", "dungeon"],
    equipamento: ["slot", "item", "inventario"], premio: ["recompensa"], sorteio: ["gacha", "banner"]
});

module.exports = { RULES, SYNONYMS, categorizar };
