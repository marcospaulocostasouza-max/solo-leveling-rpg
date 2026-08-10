/**
 * NPC MANAGER
 *
 * Gerencia todos os NPCs do sistema.
 *
 * Carrega automaticamente todos os arquivos .json da pasta src/npc/data
 * ao iniciar o projeto, armazena em memória (cache) usando o id como chave.
 *
 * Para adicionar um novo NPC, basta colocar um arquivo .json na pasta data.
 *
 * Funções:
 * - carregarNPC(id) - Busca NPC pelo id
 * - buscarPorNome(nome) - Busca NPC pelo nome
 * - listarNPCs() - Lista todos os NPCs carregados
 * - salvarNPC(npc) - Salva/atualiza um NPC
 * - existeNPC(id) - Verifica se um NPC existe
 */

const fs = require("fs");
const path = require("path");

// Caminho da pasta de dados dos NPCs
const DATA_DIR = path.join(__dirname, "data");

// Cache em memória: { id: npc }
const cacheNPCs = {};

/**
 * Carrega todos os arquivos .json da pasta data para o cache
 */
function carregarTodosNPCs() {
    try {
        // Criar a pasta data se não existir
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
            console.log("[NPC] Pasta de dados criada:", DATA_DIR);
        }

        // Listar todos os arquivos .json
        const arquivos = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json"));

        let carregados = 0;
        for (const arquivo of arquivos) {
            try {
                const caminho = path.join(DATA_DIR, arquivo);
                const dados = JSON.parse(fs.readFileSync(caminho, "utf8"));

                // Validar se tem id
                if (!dados.id) {
                    console.warn(`[NPC] Arquivo ${arquivo} ignorado: não possui campo "id".`);
                    continue;
                }

                cacheNPCs[dados.id] = dados;
                carregados++;
            } catch (err) {
                console.error(`[NPC] Erro ao carregar ${arquivo}:`, err.message);
            }
        }

        console.log(`[NPC] ${carregados} NPCs carregados com sucesso.`);
        return carregados;
    } catch (err) {
        console.error("[NPC] Erro ao carregar NPCs:", err.message);
        return 0;
    }
}

/**
 * Busca um NPC pelo id
 */
function carregarNPC(id) {
    return cacheNPCs[id] || null;
}

/**
 * Busca um NPC pelo nome (case insensitive)
 * Aceita nome completo ou primeiro nome
 */
function buscarPorNome(nome) {
    if (!nome) return null;
    const nomeLower = nome.toLowerCase().trim();

    // Busca exata
    let npc = Object.values(cacheNPCs).find(n => n.nome && n.nome.toLowerCase() === nomeLower);
    if (npc) return npc;

    // Busca por primeiro nome
    npc = Object.values(cacheNPCs).find(n => {
        if (!n.nome) return false;
        const primeiroNome = n.nome.split(' ')[0].toLowerCase();
        return primeiroNome === nomeLower;
    });
    if (npc) return npc;

    // Busca parcial (contém o nome digitado)
    npc = Object.values(cacheNPCs).find(n => n.nome && n.nome.toLowerCase().includes(nomeLower));
    return npc || null;
}

/**
 * Lista todos os NPCs carregados
 */
function listarNPCs() {
    return Object.values(cacheNPCs);
}

/**
 * Salva um NPC no cache e no arquivo JSON
 */
function salvarNPC(npc) {
    if (!npc || !npc.id) {
        throw new Error("NPC inválido: é necessário um campo 'id'.");
    }

    // Atualizar cache
    cacheNPCs[npc.id] = npc;

    // Salvar no arquivo
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        const caminho = path.join(DATA_DIR, `${npc.id}.json`);
        fs.writeFileSync(caminho, JSON.stringify(npc, null, 2), "utf8");
        return true;
    } catch (err) {
        console.error(`[NPC] Erro ao salvar NPC ${npc.id}:`, err.message);
        return false;
    }
}

/**
 * Verifica se um NPC existe pelo id
 */
function existeNPC(id) {
    return Boolean(cacheNPCs[id]);
}

// Carregar todos os NPCs ao iniciar o módulo
carregarTodosNPCs();

module.exports = {
    carregarNPC,
    buscarPorNome,
    listarNPCs,
    salvarNPC,
    existeNPC,
    carregarTodosNPCs
};