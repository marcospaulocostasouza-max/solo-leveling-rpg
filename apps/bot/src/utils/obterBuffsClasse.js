const buffsClasses = require("./buffsClasses");
const { obterClasseCanonica } = require("./normalizarClasse");

module.exports = function obterBuffsClasse(classe, atributos = {}) {
    const canonica = obterClasseCanonica(classe) || classe;
    if (canonica === "Ranger Físico") {
        return {
            forca_buff: Math.floor(Number(atributos.forca || 0) * 0.5),
            resistencia_buff: 0, velocidade_buff: 0, sentidos_buff: 0,
            inteligencia_buff: 0, poder_magico_buff: 0
        };
    }
    if (canonica === "Ranger Mágico") {
        return {
            forca_buff: 0, resistencia_buff: 0, velocidade_buff: 0,
            sentidos_buff: 0, inteligencia_buff: 0,
            poder_magico_buff: Math.floor(Number(atributos.poder_magico || 0) * 0.5)
        };
    }
    return buffsClasses[canonica] || {};
};
