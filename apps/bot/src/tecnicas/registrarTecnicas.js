// Registro de todas as técnicas de classe inicial do sistema
const assassino = require('./iniciais/assassino');
const magoRaio = require('./iniciais/magoRaio');
const ranger = require('./iniciais/ranger');
const magoVento = require('./iniciais/magoVento');
const magoAgua = require('./iniciais/magoAgua');
const magoGelo = require('./iniciais/magoGelo');
const curador = require('./iniciais/curador');
const magoPlanta = require('./iniciais/magoPlanta');
const tanker = require('./iniciais/tanker');
const magoBarreira = require('./iniciais/magoBarreira');
const magoFogo = require('./iniciais/magoFogo');
const magoTerra = require('./iniciais/magoTerra');
const magoInvocador = require('./iniciais/magoInvocador');
const lutador = require('./iniciais/lutador');

const { aplicarSistemaMaestria } = require('./sistemaMaestria');

// Mapeamento de todas as classes de classe inicial
const classesIniciais = {
    assassino,
    magoRaio,
    ranger,
    magoVento,
    magoAgua,
    magoGelo,
    curador,
    magoPlanta,
    tanker,
    magoBarreira,
    magoFogo,
    magoTerra,
    magoInvocador,
    lutador
};

Object.values(classesIniciais).forEach(classe => aplicarSistemaMaestria(classe));

// Função para obter todas as técnicas de uma classe
function getTecnicasClasse(nomeClasse) {
    const classe = classesIniciais[nomeClasse.toLowerCase()];
    if (!classe) {
        return null;
    }
    
    return {
        nome: classe.nome,
        descricao: classe.descricao_classe,
        tecnicaInicial: classe.tecnicaInicial,
        tecnicas: classe.tecnicas
    };
}

// Função para listar todas as classes disponíveis
function listarClasses() {
    return Object.keys(classesIniciais).map(key => ({
        id: key,
        nome: classesIniciais[key].nome,
        descricao: classesIniciais[key].descricao_classe
    }));
}

// Função para buscar técnica por nome
function buscarTecnicaPorNome(nomeTecnica) {
    for (const classe of Object.values(classesIniciais)) {
        // Busca na técnica inicial
        if (classe.tecnicaInicial.nome.toLowerCase() === nomeTecnica.toLowerCase()) {
            return {
                ...classe.tecnicaInicial,
                classeNome: classe.nome
            };
        }
        
        // Busca nas técnicas
        for (const tecnica of classe.tecnicas) {
            if (tecnica.nome.toLowerCase() === nomeTecnica.toLowerCase()) {
                return {
                    ...tecnica,
                    classeNome: classe.nome
                };
            }
        }
    }
    
    return null;
}

// Função para obter todas as técnicas de uma classe com detalhes
function getTodasTecnicasDetalhadas(nomeClasse) {
    // Buscar por nome ou ID
    const classe = classesIniciais[nomeClasse.toLowerCase()] || 
                   Object.values(classesIniciais).find(c => c.nome.toLowerCase() === nomeClasse.toLowerCase());
    if (!classe) {
        return null;
    }
    
    const todasTecnicas = [classe.tecnicaInicial, ...classe.tecnicas];
    
    return todasTecnicas.map(tec => ({
        nome: tec.nome,
        tipo: tec.tipo,
        descricao: tec.descricao,
        descricao_completa: tec.descricao_completa,
        custo_mana: tec.custo_mana,
        custo_qi: tec.custo_qi,
        custo_qi_formatado: tec.custo_qi_formatado,
        cooldown: tec.cooldown,
        nivel_desbloqueio: tec.nivel_desbloqueio,
        passiva: tec.passiva,
        alcance: tec.alcance || null,
        area: tec.area || null,
        duracao: tec.duracao || null,
        tamanho: tec.tamanho || null
    }));
}

module.exports = {
    classesIniciais,
    getTecnicasClasse,
    listarClasses,
    buscarTecnicaPorNome,
    getTodasTecnicasDetalhadas
};