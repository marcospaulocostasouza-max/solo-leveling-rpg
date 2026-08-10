const MessageService = require("../core/messageService");

﻿/**
 * COMANDO !TÉCNICAS - SISTEMA DE NAVEGAÇÃO DE TÉCNICAS
 * 
 * !técnicas → Menu principal com categorias
 * !técnicas iniciais → Lista técnicas iniciais (primeira técnica de cada classe)
 * !técnicas de classe → Lista todas as técnicas das classes
 * !técnicas de proficiência → Lista técnicas de proficiência
 * !técnicas únicas → Lista técnicas únicas
 * !técnicas de classe avançada → Lista técnicas das classes avançadas
 * !técnicas <nome> → Mostra ficha detalhada da técnica
 */

const template = require("../utils/templateTecnica");
const db = require("../core/database");
const { getTodasTecnicasDetalhadas, listarClasses, classesIniciais } = require("../tecnicas/registrarTecnicas");
const advancedTechniques = require("../tecnicas/avancadas/techniques");
const { normalizarTecnica } = require("../systems/maestriaSystem");

// Categorias de técnicas
const CATEGORIAS = {
    INICIAIS: "iniciais",
    CLASSE: "classe",
    PROFICIENCIA: "proficiencia",
    UNICAS: "unicas",
    CLASSE_AVANCADA: "classe avançada"
};

/**
 * Obtém todas as técnicas iniciais (primeira técnica de cada classe)
 */
function getTecnicasIniciais() {
    const tecnicas = [];
    for (const [key, classe] of Object.entries(classesIniciais)) {
        if (classe.tecnicaInicial) {
            tecnicas.push({
                ...classe.tecnicaInicial,
                classe_nome: classe.nome,
                comando: `!técnica ${classe.tecnicaInicial.nome.toLowerCase()}`
            });
        }
    }
    return tecnicas;
}

/**
 * Obtém todas as técnicas de todas as classes iniciais
 */
function getTecnicasDeClasse() {
    const tecnicas = [];
    const classes = listarClasses();
    
    classes.forEach(classe => {
        const tecs = getTodasTecnicasDetalhadas(classe.nome);
        if (tecs) {
            tecs.forEach(tec => {
                tecnicas.push({
                    ...tec,
                    classe_nome: classe.nome,
                    comando: `!técnica ${tec.nome.toLowerCase()}`
                });
            });
        }
    });
    
    return tecnicas;
}

/**
 * Obtém todas as técnicas das classes avançadas
 */
function getTecnicasClasseAvancada() {
    const tecnicas = [];
    
    for (const [classe, tecs] of Object.entries(advancedTechniques)) {
        if (Array.isArray(tecs)) {
            tecs.forEach(tec => {
                tecnicas.push({
                    ...tec,
                    classe_nome: classe,
                    categoria: "Avançada",
                    comando: `!técnica ${tec.nome.toLowerCase()}`
                });
            });
        }
    }
    
    return tecnicas;
}

/**
 * Obtém técnicas de proficiência do banco de dados
 */
function getTecnicasProficiencia() {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM tecnicas WHERE LOWER(categoria) = 'proficiência' OR LOWER(categoria) = 'proficiencia' ORDER BY nome ASC`,
            [],
            (err, rows) => {
                if (err) {
                    console.error("Erro ao buscar técnicas de proficiência:", err);
                    resolve([]);
                } else {
                    resolve(rows || []);
                }
            }
        );
    });
}

/**
 * Obtém técnicas únicas do banco de dados
 */
function getTecnicasUnicas() {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM tecnicas WHERE LOWER(categoria) = 'única' OR LOWER(categoria) = 'unica' ORDER BY nome ASC`,
            [],
            (err, rows) => {
                if (err) {
                    console.error("Erro ao buscar técnicas únicas:", err);
                    resolve([]);
                } else {
                    resolve(rows || []);
                }
            }
        );
    });
}

/**
 * Busca uma técnica específica por nome em todas as fontes
 */
function buscarTecnicaPorNomeCompleto(nomeBusca) {
    const nomeLower = nomeBusca.toLowerCase().trim();
    
    // Buscar em técnicas iniciais (classes)
    for (const [key, classe] of Object.entries(classesIniciais)) {
        // Técnica inicial
        if (classe.tecnicaInicial && classe.tecnicaInicial.nome.toLowerCase().includes(nomeLower)) {
            return {
                ...classe.tecnicaInicial,
                classe_nome: classe.nome,
                fonte: "Classe Inicial"
            };
        }
        // Técnicas da classe
        if (classe.tecnicas && Array.isArray(classe.tecnicas)) {
            for (const tec of classe.tecnicas) {
                if (tec.nome.toLowerCase().includes(nomeLower)) {
                    return {
                        ...tec,
                        classe_nome: classe.nome,
                        fonte: "Classe Inicial"
                    };
                }
            }
        }
    }
    
    // Buscar em técnicas avançadas
    for (const [classe, tecs] of Object.entries(advancedTechniques)) {
        if (Array.isArray(tecs)) {
            for (const tec of tecs) {
                if (tec.nome.toLowerCase().includes(nomeLower)) {
                    return {
                        ...tec,
                        classe_nome: classe,
                        categoria: "Avançada",
                        fonte: "Classe Avançada"
                    };
                }
            }
        }
    }
    
    return null;
}

/**
 * Exibe o menu principal de categorias
 */
function exibirMenuPrincipal() {
    return `
*═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═*
*𓂃 TÉCNICAS 𑁯 Solo Leveling*
*═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═*

Escolha uma categoria abaixo:

*1. 🌱 Técnicas Iniciais*
> Habilidade inicial de cada classe
> Use: *!técnicas iniciais*

*2. ⚔️ Técnicas de Classe*
> Todas as técnicas das classes iniciais
> Use: *!técnicas de classe*

*3. 🔰 Técnicas de Proficiência*
> Técnicas de proficiência
> Use: *!técnicas de proficiência*

*4. 💎 Técnicas Únicas*
> Técnicas únicas e especiais
> Use: *!técnicas únicas*

*5. 🔥 Técnicas de Classe Avançada*
> Técnicas das classes avançadas
> Use: *!técnicas de classe avançada*

──────────────────────────
*Use o comando da categoria*
*Para ver a lista completa.*

*Exemplo:* !técnicas iniciais

──────────────────────────
_Para ver a ficha de uma técnica:_
_!técnica nome da técnica_
`;
}

/**
 * Exibe lista de técnicas de uma categoria
 */
function exibirListaCategoria(tecnicas, titulo, icone) {
    const lista = tecnicas || [];
    if (lista.length === 0) {
        return `\n*${titulo.toUpperCase()}*\n\n_Nenhuma técnica encontrada nesta categoria._`;
    }

    const porClasse = {};
    lista.forEach((tec) => {
        const classe = tec.classe_nome || tec.classe || "Geral";
        (porClasse[classe] ||= []).push(tec);
    });

    let mensagemSimples = `\n*${titulo.toUpperCase()}*\n\n`;
    for (const [classe, listaDaClasse] of Object.entries(porClasse)) {
        mensagemSimples += `*${classe}*\n`;
        listaDaClasse.forEach((tec) => {
            mensagemSimples += `› *${tec.nome}*\n`;
            mensagemSimples += `  _Para consultar a técnica use !técnica ${tec.nome.toLowerCase()}_\n`;
        });
        mensagemSimples += "\n";
    }
    return mensagemSimples.trim();

    if (!tecnicas || tecnicas.length === 0) {
        return `
*═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═*
*${icone} ${titulo.toUpperCase()}*
*═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═*

_Nenhuma técnica encontrada nesta categoria._
`;
    }

    let mensagem = `
*═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═*
*${icone} ${titulo.toUpperCase()} 𑁯 Solo Leveling*
*═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═*

Total: ${tecnicas.length} técnica(s)
──────────────────────────

`;

    // Agrupar por classe se for técnicas de classe
    const agrupado = {};
    tecnicas.forEach(tec => {
        const classe = tec.classe_nome || tec.classe || "Geral";
        if (!agrupado[classe]) agrupado[classe] = [];
        agrupado[classe].push(tec);
    });

    for (const [classe, lista] of Object.entries(agrupado)) {
        mensagem += `*── ${classe} ──*\n`;
        lista.forEach(tec => {
            const tipo = tec.passiva ? "Passiva" : tec.tipo || "Ativa";
            const tecnica = normalizarTecnica(tec);
            const custo = tecnica.custo_maestria ? tecnica.custo_maestria_formatado : `${tecnica.custo_mana || 0} MP`;
            mensagem += `\n*✦ ${tec.nome}*\n`;
            mensagem += `> Tipo: ${tipo} | Custo: ${custo}\n`;
            if (tec.nivel_desbloqueio) {
                mensagem += `> Nível: ${tec.nivel_desbloqueio}\n`;
            }
            const desc = (tec.descricao_completa || tec.descricao || "Sem descrição.").substring(0, 120);
            mensagem += `> ${desc}${desc.length >= 120 ? "..." : ""}\n`;
            // Mostrar comando para ver ficha completa
            const nomeTec = tec.nome.toLowerCase();
            mensagem += `> \`!técnica ${nomeTec}\`\n`;
        });
        mensagem += `\n`;
    }

    mensagem += `──────────────────────────
_Para ver os detalhes completos:_
_\`!técnica nome da técnica\`_
`;
    
    return mensagem;
}

/**
 * Exibe a ficha completa de uma técnica
 */
function exibirFichaTecnica(tecnica) {
    if (!tecnica) {
        return `_Técnica não encontrada._`;
    }

    const divisores = {
        principal: "═══════════════════════════════════════",
        secao: "─── ── ── ── ── ──"
    };

    const descricaoExibir = tecnica.descricao_completa || tecnica.descricao || "Sem descrição.";
    const tipoTec = tecnica.passiva ? "Passiva" : tecnica.tipo || "Ativa";
    const classe = tecnica.classe_nome || tecnica.classe || "Geral";
    const categoria = tecnica.categoria || tecnica.fonte || "Geral";
    const custoMana = tecnica.custo_mana || 0;
    const cooldown = tecnica.cooldown || 0;
    const nivel = tecnica.nivel_desbloqueio || 1;

    let mensagem = `
${divisores.principal}
*𓂃 ${tecnica.nome}*
${divisores.secao}

> ${descricaoExibir}

*─( ◆ )───── INFORMAÇÕES*
*Classe:* ${classe}
*Categoria:* ${categoria}
*Tipo:* ${tipoTec}
*Custo de Mana:* ${custoMana} MP
${cooldown > 0 ? `*Recarga:* ${cooldown} turno(s)` : "*Recarga:* 0 turnos"}
*Nível Mínimo:* ${nivel}
${normalizarTecnica(tecnica).custo_maestria ? `*Custo em Maestria:* ${normalizarTecnica(tecnica).custo_maestria_formatado}` : ""}

${divisores.principal}
_Para comprar:_ \`!comprar tecnica ${tecnica.nome.toLowerCase().replace(/ /g, '_')}\`
`;
    
    return mensagem;
}

/**
 * Comando principal !técnicas
 */
module.exports = async (msg) => {
    try {
        const comando = msg.body.toLowerCase().trim();
        const args = comando.split(' ').slice(1); // Remove !técnicas
        
        // Se não há argumentos, mostrar menu principal
        if (args.length === 0) {
            return MessageService.send({ message: msg, text: exibirMenuPrincipal() });
        }

        const subcomando = args.join(' ').toLowerCase().trim();

        // Uma classe informada diretamente sempre mostra apenas os nomes.
        // A ficha detalhada permanece no comando !técnica <nome>.
        for (const [nomeClasse, tecnicasDaClasse] of Object.entries(advancedTechniques)) {
            const normalizado = nomeClasse.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (normalizado === subcomando.normalize("NFD").replace(/[\u0300-\u036f]/g, "")) {
                return MessageService.send({
                    message: msg,
                    text: exibirListaCategoria(
                        tecnicasDaClasse.map((tecnica) => ({ ...tecnica, classe_nome: nomeClasse })),
                        `Técnicas de ${nomeClasse}`,
                        ""
                    )
                });
            }
        }

        for (const classe of Object.values(classesIniciais)) {
            const normalizado = (classe.nome || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (normalizado === subcomando.normalize("NFD").replace(/[\u0300-\u036f]/g, "")) {
                return MessageService.send({
                    message: msg,
                    text: exibirListaCategoria(getTodasTecnicasDetalhadas(classe.nome) || [], `Técnicas de ${classe.nome}`, "")
                });
            }
        }
        
        // === SUBCOMANDOS DE CATEGORIA ===
        
        // !técnicas iniciais
        if (subcomando === "iniciais" || subcomando === "inicial") {
            const tecnicas = getTecnicasIniciais();
            return MessageService.send({ message: msg, text: exibirListaCategoria(tecnicas, "Técnicas Iniciais", "🌱") });
        }
        
        // !técnicas de classe
        if (subcomando === "de classe" || subcomando === "classe" || subcomando === "classes") {
            const tecnicas = getTecnicasDeClasse();
            return MessageService.send({ message: msg, text: exibirListaCategoria(tecnicas, "Técnicas de Classe", "⚔️") });
        }
        
        // !técnicas de proficiência
        if (subcomando === "de proficiência" || subcomando === "de proficiencia" || subcomando === "proficiência" || subcomando === "proficiencia") {
            const tecnicas = await getTecnicasProficiencia();
            if (tecnicas.length === 0) {
                return MessageService.send({ message: msg, text: `
*═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═*
*🔰 TÉCNICAS DE PROFICIÊNCIA*
*═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═*

_Nenhuma técnica de proficiência encontrada no banco de dados._
` });
            }
            return MessageService.send({ message: msg, text: exibirListaCategoria(tecnicas, "Técnicas de Proficiência", "🔰") });
        }
        
        // !técnicas únicas
        if (subcomando === "únicas" || subcomando === "unicas" || subcomando === "únicos" || subcomando === "unicos" || subcomando === "de únicas" || subcomando === "de unicas" || subcomando === "de únicos" || subcomando === "de unicos") {
            const tecnicas = await getTecnicasUnicas();
            if (tecnicas.length === 0) {
                return MessageService.send({ message: msg, text: `
*═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═*
*💎 TÉCNICAS ÚNICAS*
*═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═*

_Nenhuma técnica única encontrada no banco de dados._
` });
            }
            return MessageService.send({ message: msg, text: exibirListaCategoria(tecnicas, "Técnicas Únicas", "💎") });
        }
        
        // !técnicas de classe avançada
        if (subcomando === "de classe avançada" || subcomando === "de classe avancada" || 
            subcomando === "classe avançada" || subcomando === "classe avancada" ||
            subcomando === "avançada" || subcomando === "avancada" ||
            subcomando === "avançadas" || subcomando === "avancadas") {
            const tecnicas = getTecnicasClasseAvancada();
            return MessageService.send({ message: msg, text: exibirListaCategoria(tecnicas, "Técnicas de Classe Avançada", "🔥") });
        }
        
        // === BUSCAR TÉCNICAS DE UMA CLASSE ESPECÍFICA ===
        
        // Verificar se o subcomando é o nome de uma classe avançada
        for (const [nomeClasse, tecs] of Object.entries(advancedTechniques)) {
            if (nomeClasse.toLowerCase().trim() === subcomando || 
                nomeClasse.toLowerCase().replace(/[^a-z0-9]/g, '') === subcomando.replace(/[^a-z0-9]/g, '')) {
                // Encontrou a classe - listar técnicas com descrição breve
                let msg = `*═══ TÉCNICAS DE ${nomeClasse.toUpperCase()} ═══*\n`;
                msg += `──────────────────────────\n\n`;
                msg += `*Total:* ${tecs.length} técnica(s)\n\n`;
                
                tecs.forEach((tec, i) => {
                    const desc = (tec.descricao || "").substring(0, 100);
                    msg += `> *${i + 1}. ${tec.nome}*\n`;
                    msg += `_${desc}${desc.length >= 100 ? "..." : ""}_\n`;
                    msg += `*Tipo:* ${tec.tipo || "Ativa"} | *Custo:* ${tec.custo_mana || "Nulo"}\n`;
                    if (tec.nivel_desbloqueio) msg += `*Nível:* ${tec.nivel_desbloqueio}\n`;
                    msg += `\n`;
                });
                
                msg += `──────────────────────────\n`;
                msg += `_Para ver detalhes completos: !tecnica <nome da técnica>_`;
                return MessageService.send({ message: msg, text: msg });
            }
        }
        
        // Verificar se é uma classe inicial
        for (const [key, classe] of Object.entries(classesIniciais)) {
            if (classe.nome && classe.nome.toLowerCase().trim() === subcomando) {
                const tecs = getTodasTecnicasDetalhadas(classe.nome);
                if (tecs && tecs.length > 0) {
                    let msg = `*═══ TÉCNICAS DE ${classe.nome.toUpperCase()} ═══*\n`;
                    msg += `──────────────────────────\n\n`;
                    msg += `*Total:* ${tecs.length} técnica(s)\n\n`;
                    
                    tecs.forEach((tec, i) => {
                        const desc = (tec.descricao || "").substring(0, 100);
                        msg += `> *${i + 1}. ${tec.nome}*\n`;
                        msg += `_${desc}${desc.length >= 100 ? "..." : ""}_\n`;
                        msg += `*Tipo:* ${tec.tipo || "Ativa"} | *Custo:* ${tec.custo_mana || 0} MP\n`;
                        msg += `\n`;
                    });
                    
                    msg += `──────────────────────────\n`;
                    msg += `_Para ver detalhes completos: !tecnica <nome da técnica>_`;
                    return MessageService.send({ message: msg, text: msg });
                }
            }
        }
        
        // === SE NÃO É SUBCOMANDO NEM CLASSE, BUSCAR POR NOME ===
        
        // Buscar técnica por nome (comportamento original)
        const tecnica = buscarTecnicaPorNomeCompleto(subcomando);
        
        if (!tecnica) {
            // Tentar buscar no banco de dados também
            const tecBanco = await new Promise((resolve) => {
                db.all(
                    `SELECT * FROM tecnicas WHERE LOWER(nome) LIKE ? ORDER BY nome ASC LIMIT 5`,
                    [`%${subcomando}%`],
                    (err, rows) => {
                        if (err) resolve([]);
                        else resolve(rows || []);
                    }
                );
            });
            
            if (tecBanco && tecBanco.length > 0) {
                // Mostrar a primeira encontrada
                const tecEncontrada = tecBanco[0];
                return MessageService.send({ message: msg, text: exibirFichaTecnica(tecEncontrada) });
            }

            return MessageService.send({ message: msg, text: `
*═ TÉCNICA NÃO ENCONTRADA*
──────────────────────────
_Nenhuma técnica encontrada para "${subcomando}"._

*Categorias disponíveis:*
🌱 \`!técnicas iniciais\`
⚔️ \`!técnicas de classe\`
🔰 \`!técnicas de proficiência\`
💎 \`!técnicas únicas\`
🔥 \`!técnicas de classe avançada\`
` });
        }
        
        // Exibir técnica usando template
        return MessageService.send({ message: msg, text: exibirFichaTecnica(tecnica) });
        
    } catch (error) {
        console.error("Erro no comando tecnicas:", error);
        return MessageService.send({ message: msg, text: `
*═ ERRO AO CARREGAR TÉCNICAS*
──────────────────────────
_Ocorreu um erro ao buscar as técnicas._
_Tente novamente._
        ` });
    }
};
