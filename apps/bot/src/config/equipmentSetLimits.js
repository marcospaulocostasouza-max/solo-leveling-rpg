"use strict";

/**
 * Limites exclusivos para uma peça de equipamento que integra um conjunto.
 * O valor é a soma de Força, Resistência, Velocidade, Sentidos, Inteligência
 * e Poder Mágico — não o limite de cada atributo isolado.
 */
const EQUIPMENT_SET_ATTRIBUTE_LIMITS = Object.freeze({
    D: 40,
    C: 80,
    B: 160,
    A: 500,
    S: Infinity
});

const ATTRIBUTE_FIELDS = Object.freeze([
    "forca_bonus",
    "resistencia_bonus",
    "velocidade_bonus",
    "sentidos_bonus",
    "inteligencia_bonus",
    "poder_magico_bonus"
]);

function limiteDeAtributosConjunto(rank) {
    return EQUIPMENT_SET_ATTRIBUTE_LIMITS[String(rank || "").trim().toUpperCase()] ?? null;
}

function totalDeAtributos(item = {}) {
    return ATTRIBUTE_FIELDS.reduce((total, field) => total + Math.max(0, Number(item[field] || 0)), 0);
}

module.exports = { EQUIPMENT_SET_ATTRIBUTE_LIMITS, ATTRIBUTE_FIELDS, limiteDeAtributosConjunto, totalDeAtributos };
