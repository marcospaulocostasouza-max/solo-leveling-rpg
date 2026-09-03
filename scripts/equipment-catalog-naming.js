"use strict";

const SUFIXOS = Object.freeze({
    C: ["Despertar Arcano", "Juramento da Torre", "Lua Partida", "Coração de Mana", "Provação do Gate", "Véu Astral", "Caçada Carmesim", "Eco das Ruínas", "Pacto Espiritual", "Limiar do Abismo"],
    B: ["Ascensão Celestial", "Trono do Conquistador", "Domínio do Abismo", "Coroa da Ruptura", "Monarca Desperto", "Soberania Dracônica", "Eclipse Absoluto", "Legado do Regente", "Apoteose da Mana", "Último Horizonte"]
});

const ITENS_RENOMEADOS = new Map([
    ["C|Calças de Combate Profundo de Caçador", "Calças do Caminhante Dimensional"],
    ["B|Calças de Combate Silencioso de Eclipse", "Calças do Eclipse Fraturado"],
    ["B|Grevas Imperial de Imperador", "Grevas do Imperador do Ocaso"],
    ["C|Manto Celeste de Eclipse", "Manto do Eclipse Astral"],
    ["C|Visor Arcano de Ceifador", "Visor do Ceifador Etéreo"]
]);

function nomeConjuntoUnico(nomeBase, rank, indiceNoRank) {
    const base = String(nomeBase || "").trim();
    const grau = String(rank || "").toUpperCase();
    if (grau === "D") return `${base} — Rank D`;
    const sufixos = SUFIXOS[grau];
    const sufixo = sufixos ? sufixos[Number(indiceNoRank) % sufixos.length] : `Rank ${grau}`;
    return `${base}: ${sufixo}`;
}

function nomeItemUnico(nomeBase, rank) {
    const base = String(nomeBase || "").trim();
    const grau = String(rank || "").toUpperCase();
    return `${ITENS_RENOMEADOS.get(`${grau}|${base}`) || base} — Rank ${grau}`;
}

module.exports = { SUFIXOS, ITENS_RENOMEADOS, nomeConjuntoUnico, nomeItemUnico };
