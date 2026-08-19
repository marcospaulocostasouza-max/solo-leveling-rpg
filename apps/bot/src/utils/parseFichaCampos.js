function limpar(v){return String(v||"").trim().replace(/^[*_>\s]+|[*_\s]+$/g,"").replace(/^\[|\]$/g,"").trim()}
module.exports=function(texto){const out={};for(const linha of String(texto||"").split(/\r?\n/)){const m=linha.match(/^\s*[*_>\s]*([^:]+):\s*(.*)$/);if(m)out[limpar(m[1]).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()]=limpar(m[2])}return out};
