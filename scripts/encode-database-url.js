"use strict";

// Encodes only the password segment of DATABASE_URL in the ignored local .env file.
// It intentionally never prints the URL, password, or encoded password.
const fs = require("fs");
const path = require("path");
const file = path.resolve(__dirname, "../.env");
const variableName = process.argv[2] || "DATABASE_URL";
if (!/^[A-Z][A-Z0-9_]*$/.test(variableName)) throw new Error("Nome de variavel invalido.");
if (!fs.existsSync(file)) throw new Error(".env não encontrado.");
const original = fs.readFileSync(file, "utf8");
const match = original.match(new RegExp(`^(\\s*${variableName}\\s*=\\s*)([^\\r\\n]*)(\\r?\\n|$)`, "m"));
if (!match || !match[2].trim()) throw new Error("DATABASE_URL não está preenchida.");
const prefix = match[1];
const raw = match[2].trim().replace(/^['"]|['"]$/g, "");
const schemeEnd = raw.indexOf("://"); const at = raw.lastIndexOf("@");
if (schemeEnd < 0 || at < schemeEnd) throw new Error("DATABASE_URL não possui formato de credenciais esperado.");
const userInfo = raw.slice(schemeEnd + 3, at); const separator = userInfo.indexOf(":");
if (separator < 0) throw new Error("DATABASE_URL não possui senha no formato esperado.");
const username = userInfo.slice(0, separator);
const suppliedPassword = userInfo.slice(separator + 1);
// Supabase displays [YOUR-PASSWORD] as a replacement marker. Brackets around a
// real password are removed before encoding, but a remaining placeholder aborts.
const password = /^\[([\s\S]*)\]$/.test(suppliedPassword) ? suppliedPassword.slice(1, -1) : suppliedPassword;
if (/^(?:your[-_ ]?)?password$/i.test(password) || /\[(?:your[-_ ]?)?password\]/i.test(suppliedPassword)) {
  throw new Error(`${variableName} ainda contem um placeholder de senha.`);
}
let decoded; try { decoded = decodeURIComponent(password); } catch { decoded = password; }
const normalized = `${raw.slice(0, schemeEnd + 3)}${username}:${encodeURIComponent(decoded)}${raw.slice(at)}`;
fs.writeFileSync(file, original.replace(match[0], `${prefix}"${normalized}"${match[3]}`), "utf8");
console.log(`${variableName} normalizada localmente; nenhum segredo foi exibido.`);
