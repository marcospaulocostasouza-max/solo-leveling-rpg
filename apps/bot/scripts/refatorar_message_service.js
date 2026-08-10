/**
 * SCRIPT DE REFATORAÇÃO - MessageService
 * 
 * Substitui todas as chamadas diretas:
 * - msg.reply(...) → MessageService.send({ message: msg, text: ... })
 * - msg.client.sendMessage(...) / client.sendMessage(...) → MessageService.send({ chatId: ..., text: ... })
 * 
 * USO: node scripts/refatorar_message_service.js
 */

const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "src");

// =====================================
// UTILITÁRIOS DE BALANCEAMENTO
// =====================================

/**
 * Encontra o índice do parêntese de fechamento correspondente ao parêntese
 * de abertura no índice `inicio`.
 * Considera strings, template literals e comentários.
 */
function encontrarFechamento(texto, inicio) {
    let profundidade = 0;
    let i = inicio;
    let estado = 'normal'; // normal, string, template

    while (i < texto.length) {
        const char = texto[i];
        const next = texto[i + 1];

        if (estado === 'normal') {
            if (char === '"' || char === "'") {
                estado = 'string';
                i++;
                continue;
            }
            if (char === '`') {
                estado = 'template';
                i++;
                continue;
            }
            if (char === '(') {
                profundidade++;
                i++;
                continue;
            }
            if (char === ')') {
                profundidade--;
                if (profundidade === 0) {
                    return i;
                }
                i++;
                continue;
            }
            // Comentário de linha
            if (char === '/' && next === '/') {
                while (i < texto.length && texto[i] !== '\n') i++;
                continue;
            }
            // Comentário de bloco
            if (char === '/' && next === '*') {
                i += 2;
                while (i < texto.length && !(texto[i] === '*' && texto[i + 1] === '/')) i++;
                i += 2;
                continue;
            }
            i++;
            continue;
        }

        if (estado === 'string') {
            if (char === '\\') {
                i += 2;
                continue;
            }
            if (char === '"' || char === "'") {
                estado = 'normal';
            }
            i++;
            continue;
        }

        if (estado === 'template') {
            if (char === '\\') {
                i += 2;
                continue;
            }
            if (char === '`') {
                estado = 'normal';
                i++;
                continue;
            }
            // Interpolação ${...}
            if (char === '$' && next === '{') {
                // Encontrar o fechamento da interpolação
                let prof = 1;
                let j = i + 2;
                while (j < texto.length && prof > 0) {
                    if (texto[j] === '{') prof++;
                    if (texto[j] === '}') prof--;
                    j++;
                }
                i = j;
                continue;
            }
            i++;
            continue;
        }
    }

    return -1;
}

/**
 * Substitui msg.reply(...) por MessageService.send({ message: msg, text: ... })
 */
function substituirMsgReply(texto) {
    let resultado = texto;
    const regex = /\bmsg\.reply\(/g;
    let match;
    const substituicoes = [];

    while ((match = regex.exec(resultado)) !== null) {
        const inicio = match.index;
        const inicioArgs = inicio + match[0].length;
        const fim = encontrarFechamento(resultado, inicioArgs - 1);

        if (fim === -1) {
            console.error("  [ERRO] Não foi possível encontrar fechamento para msg.reply em:", resultado.slice(inicio, inicio + 100));
            continue;
        }

        const conteudoArgs = resultado.slice(inicioArgs, fim);
        
        // Verificar se é chamada de mídia (msg.reply(media, null, { caption: ... }))
        if (conteudoArgs.trim().startsWith("media") && conteudoArgs.includes(", null, { caption")) {
            const novaChamada = `MessageService.sendMedia({ message: msg, media, opcoesAdicionais: { caption${conteudoArgs.slice(conteudoArgs.indexOf(":") + 1)} } })`;
            substituicoes.push({
                inicio,
                fim,
                nova: novaChamada
            });
        } else {
            const novaChamada = `MessageService.send({ message: msg, text: ${conteudoArgs} })`;
            substituicoes.push({
                inicio,
                fim,
                nova: novaChamada
            });
        }
    }

    // Aplicar substituições de trás para frente
    for (let i = substituicoes.length - 1; i >= 0; i--) {
        const sub = substituicoes[i];
        resultado = resultado.slice(0, sub.inicio) + sub.nova + resultado.slice(sub.fim + 1);
    }

    return resultado;
}

/**
 * Substitui msg.client.sendMessage(chatId, texto) e client.sendMessage(chatId, texto)
 * por MessageService.send({ chatId, text: texto })
 */
function substituirSendMessage(texto) {
    let resultado = texto;
    const regex = /(?:\bmsg\.client\.sendMessage|\bclient\.sendMessage)\(/g;
    let match;
    const substituicoes = [];

    while ((match = regex.exec(resultado)) !== null) {
        const inicio = match.index;
        const inicioArgs = inicio + match[0].length;
        const fim = encontrarFechamento(resultado, inicioArgs - 1);

        if (fim === -1) {
            console.error("  [ERRO] Não foi possível encontrar fechamento para sendMessage em:", resultado.slice(inicio, inicio + 100));
            continue;
        }

        const conteudoArgs = resultado.slice(inicioArgs, fim);
        
        // Separar o primeiro argumento (chatId) do segundo (texto)
        // Precisamos encontrar a vírgula no nível superior
        let profundidade = 0;
        let indiceVirgula = -1;
        let estado = 'normal';
        let i = 0;
        
        while (i < conteudoArgs.length) {
            const char = conteudoArgs[i];
            const next = conteudoArgs[i + 1];
            
            if (estado === 'normal') {
                if (char === '"' || char === "'") {
                    estado = 'string';
                    i++;
                    continue;
                }
                if (char === '`') {
                    estado = 'template';
                    i++;
                    continue;
                }
                if (char === '(' || char === '{' || char === '[') {
                    profundidade++;
                    i++;
                    continue;
                }
                if (char === ')' || char === '}' || char === ']') {
                    profundidade--;
                    i++;
                    continue;
                }
                if (char === ',' && profundidade === 0) {
                    indiceVirgula = i;
                    break;
                }
                i++;
                continue;
            }
            
            if (estado === 'string') {
                if (char === '\\') {
                    i += 2;
                    continue;
                }
                if (char === '"' || char === "'") {
                    estado = 'normal';
                }
                i++;
                continue;
            }
            
            if (estado === 'template') {
                if (char === '\\') {
                    i += 2;
                    continue;
                }
                if (char === '`') {
                    estado = 'normal';
                    i++;
                    continue;
                }
                if (char === '$' && next === '{') {
                    let prof = 1;
                    let j = i + 2;
                    while (j < conteudoArgs.length && prof > 0) {
                        if (conteudoArgs[j] === '{') prof++;
                        if (conteudoArgs[j] === '}') prof--;
                        j++;
                    }
                    i = j;
                    continue;
                }
                i++;
                continue;
            }
        }

        if (indiceVirgula === -1) {
            console.error("  [ERRO] sendMessage sem vírgula separando chatId e texto:", conteudoArgs);
            continue;
        }

        const chatId = conteudoArgs.slice(0, indiceVirgula).trim();
        const texto = conteudoArgs.slice(indiceVirgula + 1).trim();

        const novaChamada = `MessageService.send({ chatId: ${chatId}, text: ${texto} })`;

        substituicoes.push({
            inicio,
            fim,
            nova: novaChamada
        });
    }

    // Aplicar substituições de trás para frente
    for (let i = substituicoes.length - 1; i >= 0; i--) {
        const sub = substituicoes[i];
        resultado = resultado.slice(0, sub.inicio) + sub.nova + resultado.slice(sub.fim + 1);
    }

    return resultado;
}

/**
 * Adiciona o import do MessageService no topo do arquivo.
 * Calcula o caminho relativo baseado na profundidade do arquivo.
 */
function adicionarImport(texto, caminhoArquivo) {
    // Não adicionar se já importa MessageService
    if (texto.includes("messageService") || texto.includes("MessageService")) {
        return texto;
    }

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
 * Processa um arquivo: aplica todas as substituições.
 */
function processarArquivo(caminhoArquivo) {
    let texto = fs.readFileSync(caminhoArquivo, "utf8");
    const original = texto;

    // Não processar o próprio MessageService
    if (caminhoArquivo.includes("messageService.js")) {
        return false;
    }

    // Verificar se o arquivo já importa MessageService
    const jaImporta = texto.includes('require("') && texto.includes("messageService");

    let modificado = false;

    // Substituir msg.reply(...)
    if (/\bmsg\.reply\(/.test(texto)) {
        texto = substituirMsgReply(texto);
        modificado = true;
    }

    // Substituir sendMessage(...)
    if (/\bmsg\.client\.sendMessage\(|\bclient\.sendMessage\(/.test(texto)) {
        texto = substituirSendMessage(texto);
        modificado = true;
    }

    // Adicionar import se houve modificação e ainda não importa
    if (modificado && !jaImporta) {
        texto = adicionarImport(texto, caminhoArquivo);
    }

    if (modificado) {
        fs.writeFileSync(caminhoArquivo, texto, "utf8");
        console.log(`[OK] ${path.relative(SRC_DIR, caminhoArquivo)}`);
        return true;
    }

    return false;
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
            // Pular diretórios que não deveriam ser processados
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

console.log("=== REFATORAÇÃO PARA MessageService ===");
console.log("Processando arquivos em:", SRC_DIR);
console.log("");

const total = percorrerDiretorio(SRC_DIR);

console.log("");
console.log(`=== REFATORAÇÃO CONCLUÍDA: ${total} arquivo(s) modificado(s) ===`);