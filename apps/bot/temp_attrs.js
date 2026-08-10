const fs = require("fs");
const c = JSON.parse(fs.readFileSync("src/database/forja_catalogo.json", "utf8"));
const attrs = new Set();
c.ligas.forEach(i => { attrs.add(i.atributo1); if (i.atributo2) attrs.add(i.atributo2); });
c.forjados.forEach(i => { attrs.add(i.atributo1); if (i.atributo2) attrs.add(i.atributo2); });
console.log("Atributos no catalogo:", [...attrs].sort().join(", "));
console.log("Total ligas:", c.ligas.length);
console.log("Total forjados:", c.forjados.length);
console.log("Sample forjado:", JSON.stringify(c.forjados[0], null, 2));
