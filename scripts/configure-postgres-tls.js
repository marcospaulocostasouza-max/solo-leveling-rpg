"use strict";

// Updates the ignored local .env without reading or printing credentials.
const fs = require("fs");
const path = require("path");
const file = path.resolve(__dirname, "../.env");
if (!fs.existsSync(file)) throw new Error(".env nao encontrado.");
const original = fs.readFileSync(file, "utf8");
const next = /^\s*DATABASE_SSL_REJECT_UNAUTHORIZED\s*=/m.test(original)
  ? original.replace(/^\s*DATABASE_SSL_REJECT_UNAUTHORIZED\s*=.*$/m, "DATABASE_SSL_REJECT_UNAUTHORIZED=false")
  : `${original.endsWith("\n") ? original : `${original}\n`}DATABASE_SSL_REJECT_UNAUTHORIZED=false\n`;
fs.writeFileSync(file, next, "utf8");
console.log("TLS do pooler configurado localmente; nenhum segredo foi exibido.");
