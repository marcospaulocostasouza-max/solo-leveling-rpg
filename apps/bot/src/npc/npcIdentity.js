const ALIASES = { ophilia: 'ophilia_clement', ophilia_clement: 'ophilia_clement' };
function canonicalId(id) {
    const value = String(id || '').toLowerCase();
    return ALIASES[value] || value;
}
module.exports = { canonicalId };
