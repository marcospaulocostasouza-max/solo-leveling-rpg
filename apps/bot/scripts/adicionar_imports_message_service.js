/**
 * SCRIPT PARA ADICIONAR IMPORTS DO MessageService
 * 
 * Adiciona o import do MessageService em todos os arquivos que usam
 * MessageService.send() ou MessageService.sendMedia() mas não importam o serviço.
 * 
 * USO: node scripts/adicionar_imports_message_service.js
 */

const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "src");

/**
 * Adiciona o import do MessageService no topo do arquivo.
 * Calcula o caminho relativo baseado na profundidade do arquivo.
 */
function adicionarImport(texto, caminhoArquivo) {
    // Calcular caminho relativo para src/core/messageService.js
    let relativo = path.relative(path.dirname(caminhoArquivo), path.join(SRC_DIR, "core", "messageService.js"));
    relativo = relativo.replace(/\\/g, "/").replace(/\.js$/, "");
    
    // Garantir ./ ou ../ para require relativo
    if (!relativo.startsWith(".")) {
        relativo = "./" + relativo;
    }

    return `const MessageService = require("${relativo}");\n\n${texto}`;
}

/**
 * Processa um arquivo: adiciona import se necessário.
 */
function processarArquivo(caminhoArquivo) {
    let texto = fs.readFileSync(caminhoArquivo, "utf8");

    // Não processar o próprio MessageService
    if (caminhoArquivo.includes("messageService.js")) {
        return false;
    }

    // Verificar se o arquivo usa MessageService
    const usaMessageService = /\bMessageService\.(send|sendMedia)\(/.test(texto);
    if (!usaMessageService) {
        return false;
    }

    // Verificar se já importa MessageService
    const jaImporta = /require\([^)]*messageService[^)]*\)/.test(texto);
    if (jaImporta) {
        return false;
    }

    // Adicionar import
    texto = adicionarImport(texto, caminhoArquivo);
    fs.writeFileSync(caminhoArquivo, texto, "utf8");
    console.log(`[OK] ${path.relative(SRC_DIR, caminhoArquivo)}`);
    return true;
}

/**
 * Percorre todos os arquivos .js do diretório recursivamente.
 */
function percorrerDiretorio(dir) {
    const entradas = fs.readdirSync(dir, { withFileTypes: true });
    let total = 0;

    for (const entrada of entradas) {
        const caminhoCompleto = path.join(dir, entrada.name);

        if (entrada.isDirectory()) {
            if (entrada.name === "node_modules" || entrada.name === ".wwebjs_auth") {
                continue;
            }
            total += percorrerDiretorio(caminhoCompleto);
        } else if (entrada.name.endsWith(".js")) {
            if (processarArquivo(caminhoCompleto)) {
                total++;
            }
        }
    }

    return total;
}

// =====================================
// EXECUÇÃO
// =====================================

console.log("=== ADICIONANDO IMPORTS DO MessageService ===");
console.log("Processando arquivos em:", SRC_DIR);
console.log("");

const total = percorrerDiretorio(SRC_DIR);

console.log("");
console.log(`=== CONCLUÍDO: ${total} import(s) adicionado(s) ===`);