const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\b(de|do|da)\b/g, '').replace(/\s+/g, ' ').trim();
function classKey(value) { const key = normalize(value); return ({ 'mago elementar': 'mago elemental', 'ranger fisico': 'ranger', 'ranger magico': 'ranger' })[key] || key; }
const isPassive = value => value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
function techniqueName(row) {
    if (classKey(row.classe) !== 'assassino') return row.nome;
    const key = normalize(row.nome).replace(/\s+/g, '').replace('[passivo]', '');
    return ({ marcaexecucao: 'Marca da Execução', marcadaexecucao: 'Marca da Execução', pontofraco: 'Ponto Fraco' })[key] || row.nome;
}
module.exports = { classKey, isPassive, techniqueName };
