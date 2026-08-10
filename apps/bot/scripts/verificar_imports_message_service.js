/**
 * SCRIPT DE VERIFICAÇÃO DE IMPORTS DO MessageService
 * 
 * Verifica se todos os arquivos que usam MessageService.send() ou
 * MessageService.sendMedia() têm o import correto do serviço.
 * 
 * USO: node scripts/verificar_imports_message_service.js
 */

const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "src");

function processarArquivo(caminhoArquivo) {
    const texto = fs.readFileSync(caminhoArquivo, "utf8");

    // Não processar o próprio MessageService
    if (caminhoArquivo.includes("messageService.js")) {
        return { ok: true, msg: "" };
    }

    // Verificar se o arquivo usa MessageService
    const usaMessageService = /\bMessageService\.(send|sendMedia)\(/.test(texto);
    if (!usaMessageService) {
        return { ok: true, msg: "" };
    }

    // Verificar se importa MessageService
    const importaMessageService = /require\([^)]*messageService[^)]*\)/.test(texto);
    if (!importaMessageService) {
        return { ok: false, msg: `FALTA IMPORT: ${path.relative(SRC_DIR, caminhoArquivo)}` };
    }

    return { ok: true, msg: "" };
}

function percorrerDiretorio(dir) {
    const entradas = fs.readdirSync(dir, { withFileTypes: true });
    let total = 0;
    let erros = 0;

    for (const entrada of entradas) {
        const caminhoCompleto = path.join(dir, entrada.name);

        if (entrada.isDirectory()) {
            if (entrada.name === "node_modules" || entrada.name === ".wwebjs_auth") {
                continue;
            }
            const resultado = percorrerDiretorio(caminhoCompleto);
            total += resultado.total;
            erros += resultado.erros;
        } else if (entrada.name.endsWith(".js")) {
            total++;
            const resultado = processarArquivo(caminhoCompleto);
            if (!resultado.ok) {
                console.error(`[ERRO] ${resultado.msg}`);
                erros++;
            }
        }
    }

    return { total, erros };
}

console.log("=== VERIFICAÇÃO DE IMPORTS DO MessageService ===");
console.log("Verificando arquivos em:", SRC_DIR);
console.log("");

const resultado = percorrerDiretorio(SRC_DIR);

console.log("");
console.log(`=== RESULTADO: ${resultado.total} arquivo(s) verificados, ${resultado.erros} erro(s) ===`);

if (resultado.erros > 0) {
    process.exit(1);
}