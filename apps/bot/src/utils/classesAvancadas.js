'use strict';
// Compatibility adapter: the active catalog is the source of truth.
const classes = require('./advancedClasses');
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const CLASSES_AVANCADAS = Object.fromEntries(Object.entries(classes).map(([key, entry]) => [key, {
    ...entry, classe_base: entry.classeInicial,
    bonus: Object.entries(entry.bonusAtributos || {}).map(([attribute, value]) => `+${value} ${attribute.replace(/_/g, ' ')}`).join(', ')
}]));
function getClasseAvancada(name) {
    const key = Object.keys(CLASSES_AVANCADAS).find(key => normalize(key) === normalize(name));
    return key ? CLASSES_AVANCADAS[key] : null;
}
// Persistence belongs to AdvancedClassSystem.
function aplicarBuffsClasseAvancada(player, name) {
    const entry = getClasseAvancada(name);
    return entry ? { bonus: entry.bonus, bonusAtributos: { ...entry.bonusAtributos }, descricao: entry.descricao } : null;
}
module.exports = { CLASSES_AVANCADAS, getClasseAvancada, aplicarBuffsClasseAvancada };
