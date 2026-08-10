/**
 * REGISTRADOR DE COMANDOS DE NPCs
 * 
 * Gera automaticamente o registro de todos os comandos NPC
 * no commandHandler.js
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "src", "npc", "data");
const COMMAND_HANDLER = path.join(__dirname, "..", "src", "core", "commandHandler.js");

// Listar todos os arquivos JSON de NPCs
const arquivos = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json"));

const npcIds = [];
for (const arquivo of arquivos) {
    try {
        const dados = JSON.parse(fs.readFileSync(path.join(DATA_DIR, arquivo), "utf8"));
        if (dados.id) {
            npcIds.push(dados.id);
        }
    } catch (e) {
        console.error(`Erro ao ler ${arquivo}:`, e.message);
    }
}

// Gerar entradas para o mapa de comandos exatos
let mapaExato = "";
let mapaPrefixo = "";

for (const id of npcIds) {
    mapaExato += `        "!${id}": "npc_${id}.js",\n`;
    mapaPrefixo += `        { prefixo: "!${id}", arquivo: "npc_${id}.js" },\n`;
}

// Ler o commandHandler atual
let conteudo = fs.readFileSync(COMMAND_HANDLER, "utf8");

// Substituir a seção de comandos NPC no mapa exato
const inicioExato = conteudo.indexOf("// =====================================\n        // COMANDOS DE NPCs");
const fimExato = conteudo.indexOf("    };", inicioExato);

if (inicioExato !== -1 && fimExato !== -1) {
    const novaSecao = `// =====================================
        // COMANDOS DE NPCs
        // =====================================
${mapaExato}    `;
    conteudo = conteudo.substring(0, inicioExato) + novaSecao + conteudo.substring(fimExato);
}

// Substituir a seção de comandos NPC no prefixo
const inicioPrefixo = conteudo.indexOf("// =====================================\n        // COMANDOS DE NPCs (prefixo)");
const fimPrefixo = conteudo.indexOf("    ];", inicioPrefixo);

if (inicioPrefixo !== -1 && fimPrefixo !== -1) {
    const novaSecao = `// =====================================
        // COMANDOS DE NPCs (prefixo)
        // =====================================
${mapaPrefixo}    `;
    conteudo = conteudo.substring(0, inicioPrefixo) + novaSecao + conteudo.substring(fimPrefixo);
}

fs.writeFileSync(COMMAND_HANDLER, conteudo, "utf8");
console.log(`[OK] ${npcIds.length} comandos NPC registrados no commandHandler.js`);