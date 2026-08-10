/**
 * SCRIPT DE VERIFICAÇÃO DE SINTAXE
 * 
 * Verifica se todos os arquivos .js do projeto têm sintaxe válida.
 * 
 * USO: node scripts/verificar_sintaxe.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SRC_DIR = path.join(__dirname, "..", "src");

function verificarArquivo(caminhoArquivo) {
    try {
        // Usar node --check para verificar sintaxe
        execSync(`node --check "${caminhoArquivo}"`, { stdio: "pipe" });
        return true;
    } catch (erro) {
        console.error(`[ERRO] ${path.relative(SRC_DIR, caminhoArquivo)}:`);
        console.error(erro.stderr ? erro.stderr.toString() : erro.message);
        return false;
    }
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
            if (!verificarArquivo(caminhoCompleto)) {
                erros++;
            }
        }
    }

    return { total, erros };
}

console.log("=== VERIFICAÇÃO DE SINTAXE ===");
console.log("Verificando arquivos em:", SRC_DIR);
console.log("");

const resultado = percorrerDiretorio(SRC_DIR);

console.log("");
console.log(`=== RESULTADO: ${resultado.total} arquivo(s) verificados, ${resultado.erros} erro(s) ===`);

if (resultado.erros > 0) {
    process.exit(1);
}