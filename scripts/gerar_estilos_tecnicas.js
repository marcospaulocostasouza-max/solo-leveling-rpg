/**
 * Script gerador dos arquivos de técnicas de estilos de luta.
 * 
 * Cria um arquivo para cada estilo de luta em apps/bot/src/tecnicas/estilos/
 * com o molde padrão já formatado, pronto para ser preenchido.
 */

const fs = require("fs");
const path = require("path");

const estilos = require("../apps/bot/src/estilos/listaEstilos");

const DIR_ESTILOS = path.join(__dirname, "..", "apps", "bot", "src", "tecnicas", "estilos");

function normalizarNomeFile(nome) {
    return String(nome || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function gerarMoldeArquivo(estilo) {
    const nomeKey = normalizarNomeFile(estilo.nome.replace(/^Proficiência em\s*/, "").replace(/^Proficiencia em\s*/, ""));
    const nomeVar = nomeKey.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    const nomeTitulo = estilo.nome.replace(/^Proficiência em\s*/, "").replace(/^Proficiencia em\s*/, "");
    const descricao = estilo.descricao || "Molde de técnicas para este estilo de luta.";

    return `/**
 * TÉCNICAS DE ESTILO DE LUTA: ${estilo.nome}
 * 
 * Arma: ${estilo.arma || "Nenhuma"}
 * Técnica associada: ${estilo.tecnica || "Nenhuma"}
 * 
 * Este arquivo contém o molde para as futuras técnicas deste estilo.
 * Preencha o array \`tecnicas\` com as técnicas específicas do estilo.
 * 
 * CAMPOS DE CADA TÉCNICA:
 * - nome: Nome da técnica
 * - classe: Classe do estilo (ex: "${nomeTitulo}")
 * - categoria: "Proficiencia"
 * - tipo: "Física" | "Mágica" | "Defesa" | "Suporte" | "Buff" | "Utilidade" | "Passiva" | "Invocação" | "Movimentação"
 * - descricao: Breve descrição exibida em listas
 * - descricao_completa: Descrição completa com mecânicas, porcentagens e efeitos
 * - custo_mana: Custo em MP
 * - custo_qi: Custo em Maestria
 * - custo_qi_formatado: Custo formatado
 * - cooldown: Recarga em turnos
 * - nivel_desbloqueio: Nível mínimo para desbloquear
 * - passiva: true se for passiva
 */

const ${nomeVar} = {
    nome: "${nomeTitulo}",
    descricao_classe: "${descricao}",
    categoria: "Proficiencia",
    arma: "${estilo.arma || "Nenhuma"}",
    tecnicaInicial: {
        nome: "",
        classe: "${nomeTitulo}",
        categoria: "Proficiencia",
        tipo: "Física",
        descricao: "",
        descricao_completa: "",
        custo_mana: 0,
        custo_qi: 10,
        custo_qi_formatado: "10 Qi",
        cooldown: 1,
        nivel_desbloqueio: 1,
        passiva: false
    },
    tecnicas: [
        // Exemplo de molde a ser preenchido:
        // {
        //     nome: "",
        //     classe: "${nomeTitulo}",
        //     categoria: "Proficiencia",
        //     tipo: "Física",
        //     descricao: "",
        //     descricao_completa: "",
        //     custo_mana: 0,
        //     custo_qi: 20,
        //     custo_qi_formatado: "20 Qi",
        //     cooldown: 2,
        //     nivel_desbloqueio: 3,
        //     passiva: false
        // }
    ]
};

module.exports = ${nomeVar};
`;
}

async function main() {
    if (!fs.existsSync(DIR_ESTILOS)) {
        fs.mkdirSync(DIR_ESTILOS, { recursive: true });
    }

    const criados = [];
    for (const estilo of estilos) {
        const nomeKey = normalizarNomeFile(estilo.nome.replace(/^Proficiência em\s*/, "").replace(/^Proficiencia em\s*/, ""));
        const arquivo = path.join(DIR_ESTILOS, `${nomeKey}.js`);
        const conteudo = gerarMoldeArquivo(estilo);
        fs.writeFileSync(arquivo, conteudo, "utf8");
        criados.push(path.basename(arquivo));
    }

    // Criar index.js com registro de todos
    const linhasImports = [];
    const linhasMapa = [];
    for (const estilo of estilos) {
        const nomeKey = normalizarNomeFile(estilo.nome.replace(/^Proficiência em\s*/, "").replace(/^Proficiencia em\s*/, ""));
        const chave = nomeKey;
        linhasImports.push(`const ${chave} = require("./${chave}");`);
        linhasMapa.push(`    ${chave},`);
    }

    const indexConteudo = `/**
 * REGISTRO DE TODAS AS TÉCNICAS DE ESTILOS DE LUTA
 * 
 * Cada estilo de luta possui seu próprio arquivo de técnicas.
 * Os arquivos estão preparados com o molde padrão para preenchimento.
 */
${linhasImports.join("\n")}

const estilos = {
${linhasMapa.join("\n")}
};

function getTecnicasEstilo(nomeEstilo) {
    const chave = String(nomeEstilo || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    return estilos[chave] || null;
}

function listarEstilos() {
    return Object.keys(estilos).map(key => ({
        chave: key,
        nome: estilos[key].nome,
        descricao: estilos[key].descricao_classe,
        categoria: estilos[key].categoria || "Proficiencia"
    }));
}

module.exports = { estilos, getTecnicasEstilo, listarEstilos };
`;

    fs.writeFileSync(path.join(DIR_ESTILOS, "index.js"), indexConteudo, "utf8");
    criados.push("index.js");

    console.log(`[GERADOR] Criados ${criados.length} arquivos de estilos de luta em ${DIR_ESTILOS}`);
    console.log(criados.join("\n"));
}

main().catch(erro => {
    console.error("[GERADOR] Erro:", erro.message);
    process.exit(1);
});