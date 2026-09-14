const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function weighted(entries, weight, rng = Math.random) {
    if (!entries.length) return null;
    const weights = entries.map(weight);
    let roll = rng() * weights.reduce((a,b) => a+b, 0);
    for (let i=0;i<entries.length;i++) { roll -= weights[i]; if (roll < 0) return entries[i]; }
    return entries[entries.length-1];
}
function chooseSlot(slots, player, rng) {
    const magic = /mago|curador/.test(norm(player.classe));
    return weighted(slots, slot => magic && slot === 'Acessórios' ? 2 : !magic && slot.startsWith('Arma') ? 2 : 1, rng);
}
function chooseRecipe(recipes, player, rng) {
    const words = norm(player.estilo_luta || player.estilo || '').split(/\W+/).filter(w => w.length >= 4 && !['proficiencia','combate'].includes(w)).map(w => w.replace(/s$/, ''));
    return weighted(recipes, recipe => words.some(w => norm(recipe.itemCatalogo?.nome).includes(w)) ? 2 : 1, rng);
}
module.exports = {chooseSlot, chooseRecipe};
