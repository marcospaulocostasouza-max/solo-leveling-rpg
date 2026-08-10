"use strict";

const fs = require("fs");
const path = require("path");
const file = path.resolve(__dirname, "../.env");
if (!fs.existsSync(file)) throw new Error(".env nao encontrado.");
const source = fs.readFileSync(file, "utf8");
const value = "DATABASE_PROVIDER=postgres";
const result = /^\s*DATABASE_PROVIDER\s*=/m.test(source)
  ? source.replace(/^\s*DATABASE_PROVIDER\s*=.*$/m, value)
  : `${source.endsWith("\n") ? source : `${source}\n`}${value}\n`;
fs.writeFileSync(file, result, "utf8");
console.log("Provider PostgreSQL configurado localmente; nenhum segredo foi exibido.");
