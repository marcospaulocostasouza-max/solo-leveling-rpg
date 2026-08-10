/**
 * GERADOR DE ROTINAS EXTRAS
 * 
 * Adiciona rotinas no scheduler.js para todos os NPCs extras
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "src", "npc", "data");
const SCHEDULER = path.join(__dirname, "..", "src", "npc", "scheduler.js");

// Listar todos os NPCs
const arquivos = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json"));
const npcs = [];
for (const arquivo of arquivos) {
    try {
        const dados = JSON.parse(fs.readFileSync(path.join(DATA_DIR, arquivo), "utf8"));
        if (dados.id) npcs.push(dados);
    } catch (e) {}
}

// Ler scheduler atual
let conteudo = fs.readFileSync(SCHEDULER, "utf8");

// Encontrar o ponto de inserção (antes do module.exports)
const pontoInsercao = conteudo.indexOf("module.exports = {");

// Gerar rotinas para NPCs que ainda não têm
let rotinasGeradas = "";
const idsExistentes = ["ophilia", "vysache", "ophilia_clement", "cyrus_albright", "tressa_colzione", 
    "olberic_eisenberg", "primrose_azelhart", "alfyn_greengrass", "therion", "haanit", "hikari_ku",
    "agnea_bristarni", "castti_florenz", "osvald_v_vanstein", "partitio_yellowil", "ochette",
    "temenos_mistral", "throne_anguis", "lyblac", "galdera", "vide_o_corruptor", "trousseau"];

for (const npc of npcs) {
    if (idsExistentes.includes(npc.id)) continue;
    
    const nome = npc.nome;
    const id = npc.id;
    const isVilao = (npc.papel || "").toLowerCase().includes("vil");
    
    if (isVilao) {
        rotinasGeradas += `
// ROTINA PADRAO DO ${nome.toUpperCase()}
cadastrarRotina("${id}", [
    { hora: 0, acao: "Vigilancia", descricao: "${nome} observa seus dominios nas sombras.", disponivel: false },
    { hora: 6, acao: "Planejamento", descricao: "${nome} planeja seus proximos movimentos.", disponivel: false },
    { hora: 12, acao: "Manipulacao", descricao: "${nome} manipula aliados e inimigos nos bastidores.", disponivel: true },
    { hora: 18, acao: "Execucao", descricao: "${nome} executa seus planos sombrios.", disponivel: true },
    { hora: 22, acao: "Recolhimento", descricao: "${nome} se recolhe para recuperar forcas.", disponivel: false }
]);
`;
    } else {
        rotinasGeradas += `
// ROTINA PADRAO DO ${nome.toUpperCase()}
cadastrarRotina("${id}", [
    { hora: 6, acao: "Acorda e se prepara", descricao: "${nome} acorda e se prepara para o dia.", disponivel: false },
    { hora: 8, acao: "Atende cacadores", descricao: "${nome} atende cacadores que buscam ajuda.", disponivel: true },
    { hora: 12, acao: "Almoca", descricao: "${nome} faz uma pausa para almocar.", disponivel: false },
    { hora: 13, acao: "Treina habilidades", descricao: "${nome} treina suas habilidades de combate.", disponivel: true },
    { hora: 18, acao: "Atende novamente", descricao: "${nome} retoma o atendimento aos cacadores.", disponivel: true },
    { hora: 21, acao: "Descansa", descricao: "${nome} descansa apos um longo dia.", disponivel: false },
    { hora: 23, acao: "Dormindo", descricao: "${nome} esta dormindo.", disponivel: false }
]);
`;
    }
}

// Inserir antes do module.exports
conteudo = conteudo.substring(0, pontoInsercao) + rotinasGeradas + "\n" + conteudo.substring(pontoInsercao);

fs.writeFileSync(SCHEDULER, conteudo, "utf8");
console.log(`[OK] Rotinas geradas para ${npcs.length - idsExistentes.length} NPCs extras`);