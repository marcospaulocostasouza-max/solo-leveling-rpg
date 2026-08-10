"use strict";
const fs = require("fs"); const path = require("path");
const file = path.resolve(__dirname, "../.env");
if (!fs.existsSync(file)) throw new Error(".env nao encontrado.");
const source = fs.readFileSync(file, "utf8"); const value = "SITE_URL=http://localhost:3000";
fs.writeFileSync(file, /^\s*SITE_URL\s*=/m.test(source) ? source.replace(/^\s*SITE_URL\s*=.*$/m, value) : `${source.endsWith("\n") ? source : `${source}\n`}${value}\n`, "utf8");
console.log("SITE_URL configurada localmente; nenhum segredo foi exibido.");
