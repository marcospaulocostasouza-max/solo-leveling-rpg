/**
 * 🌀 SOLO LEVELING RPG BOT
 * 
 * Ponto de entrada principal.
 * Redireciona para a nova estrutura organizada em src/
 */

console.log("==================================");
console.log(" 🌀 SOLO LEVELING RPG BOT ");
console.log(" Iniciando sistema... ");
console.log("==================================");

// Redirecionar para a nova estrutura
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
require("./src/index.js");
