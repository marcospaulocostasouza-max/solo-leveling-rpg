const MessageService = require("../core/messageService");

/**
 * RECONHECEDOR DE FICHA
 * 
 * Extrai todos os campos de uma ficha de personagem enviada pelo jogador.
 * Salva em memória temporária (fichasTemp) até confirmação.
 * Também reconhece templates de Habilidades Únicas e Itens Únicos.
 */

const fichasTemp = require("./fichasTemp");
const templates = require("./templatesMensagens");
const { obterClasseCanonica } = require("./normalizarClasse");
const { obterEstiloCanonico } = require("./normalizarEstiloLuta");

module.exports = async (msg) => {
    const texto = msg.body.trim();
    const textoLower = texto.toLowerCase();
    
    // =====================================
    // RECONHECER FICHA DE MATERIAIS (VYSACHE)
    // =====================================
    // Verificar primeiro se é uma ficha de materiais do sistema de forja
    if (textoLower.includes("material:") && textoLower.includes("quantidade:")) {
        const { processarFichaMateriais } = require("./reconhecerMateriais");
        const processado = await processarFichaMateriais(msg);
        if (processado) return;
    }
    
    // =====================================
    // RECONHECER FICHA DE DUNGEON INSTANCIADA
    // =====================================
    if (textoLower.includes("ficha de dungeon") || 
        (textoLower.includes("dungeon instanciada") && textoLower.includes("participantes"))) {
        
        const db = require("../core/database");
        const JogadorCore = require("../core/jogadorCore");
        const DungeonInstanciadaSystem = require("../systems/dungeonInstanciadaSystem");
        
        const numero = msg.author || msg.from;
        const jogador = await JogadorCore.buscarPorNumero(numero);
        
        if (jogador) {
            // Reconhecer ficha de dungeon
            const fichaReconhecida = await DungeonInstanciadaSystem.reconhecerFichaDungeon(texto, jogador);
            
            if (fichaReconhecida.participantes.length > 0) {
                // Salvar ficha reconhecida em memória para o comando !concluir Dungeon
                const fichasDungeonTemp = require("./fichasDungeonTemp");
                fichasDungeonTemp[numero] = fichaReconhecida;
                
                await MessageService.send({ message: msg, text: `
*═══ FICHA DE DUNGEON RECONHECIDA! ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Dungeon:* ${fichaReconhecida.dungeonNome || "Não identificada"}
*Rank:* ${fichaReconhecida.dungeonRank || "Não identificado"}

*Participantes (${fichaReconhecida.participantes.length}):*
${fichaReconhecida.participantes.map((p, i) => `${i + 1}. ${p}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Use *!concluir Dungeon* para finalizar._` });
                return;
            }
        }
    }
    
    // =====================================
    // RECONHECER TEMPLATE DE HABILIDADE ÚNICA
    // =====================================
    if (textoLower.includes("nome:") && textoLower.includes("pertencente:") &&
        (textoLower.includes("custo de mana:") || textoLower.includes("cooldown:") || textoLower.includes("nível de desbloqueio:") || textoLower.includes("nivel de desbloqueio:")) &&
        !textoLower.includes("tier:") && !textoLower.includes("slot:")) {
        
        const db = require("../core/database");
        
        const dados = {
            nome: extrairCampo(msg.body, "NOME"),
            descricao: extrairCampo(msg.body, "DESCRIÇÃO") || extrairCampo(msg.body, "DESCRICAO"),
            custo_mana: parseInt(extrairCampo(msg.body, "CUSTO DE MANA")) || 0,
            cooldown: parseInt(extrairCampo(msg.body, "COOLDOWN")) || 0,
            tipo: extrairCampo(msg.body, "TIPO") || "Ativa",
            categoria: extrairCampo(msg.body, "CATEGORIA") || "Geral",
            classe: extrairCampo(msg.body, "CLASSE") || "Geral",
            rank: extrairCampo(msg.body, "RANK") || "E",
            nivel_desbloqueio: parseInt(extrairCampo(msg.body, "NÍVEL DE DESBLOQUEIO") || extrairCampo(msg.body, "NIVEL DE DESBLOQUEIO")) || 1,
            pertencente: extrairCampo(msg.body, "PERTENCENTE")
        };
        
        if (dados.nome && dados.pertencente) {
            const dataAtual = new Date().toISOString();
            const numero = msg.author || msg.from;
            
            db.run(
                `INSERT INTO habilidades_unicas_pendentes (dados, status, data_envio, criado_por) VALUES (?, 'pendente', ?, ?)`,
                [JSON.stringify(dados), dataAtual, numero]
            );
            
            await MessageService.send({ message: msg, text: `
*═══ HABILIDADE ÚNICA RECONHECIDA! ═══*
══════════════════════════

*Nome:* ${dados.nome}
*Descrição:* ${dados.descricao || "N/A"}
*Custo de Mana:* ${dados.custo_mana}
*Cooldown:* ${dados.cooldown} turnos
*Tipo:* ${dados.tipo}
*Categoria:* ${dados.categoria}
*Classe:* ${dados.classe}
*Pertencente:* ${dados.pertencente}

══════════════════════════
Um ADM deve usar *!add técnica* para integrar e entregar ao dono.
            ` });
            return;
        }
    }
    
    // =====================================
    // RECONHECER TEMPLATE DE ITEM ÚNICO
    // =====================================
    if (textoLower.includes("nome:") && textoLower.includes("pertencente:") &&
        (textoLower.includes("categoria:") || textoLower.includes("tier:"))) {
        
        const db = require("../core/database");
        
        const dados = {
            nome: extrairCampo(msg.body, "NOME"),
            descricao: extrairCampo(msg.body, "DESCRIÇÃO") || extrairCampo(msg.body, "DESCRICAO"),
            categoria: extrairCampo(msg.body, "CATEGORIA") || "Equipamento",
            slot: extrairCampo(msg.body, "SLOT") || "",
            tier: extrairCampo(msg.body, "TIER") || "Único",
            forca_bonus: parseInt(extrairCampo(msg.body, "FORÇA")) || 0,
            resistencia_bonus: parseInt(extrairCampo(msg.body, "RESISTÊNCIA")) || 0,
            velocidade_bonus: parseInt(extrairCampo(msg.body, "VELOCIDADE")) || 0,
            sentidos_bonus: parseInt(extrairCampo(msg.body, "SENTIDOS")) || 0,
            inteligencia_bonus: parseInt(extrairCampo(msg.body, "INTELIGÊNCIA")) || 0,
            poder_magico_bonus: parseInt(extrairCampo(msg.body, "PODER MÁGICO")) || 0,
            efeito: extrairCampo(msg.body, "EFEITO") || "",
            pertencente: extrairCampo(msg.body, "PERTENCENTE")
        };
        
        if (dados.nome && dados.pertencente) {
            const dataAtual = new Date().toISOString();
            const numero = msg.author || msg.from;
            
            db.run(
                `INSERT INTO itens_unicos_pendentes (dados, status, data_envio, criado_por) VALUES (?, 'pendente', ?, ?)`,
                [JSON.stringify(dados), dataAtual, numero]
            );
            
            await MessageService.send({ message: msg, text: `
*═══ ITEM ÚNICO RECONHECIDO! ═══*
══════════════════════════

*Nome:* ${dados.nome}
*Descrição:* ${dados.descricao || "N/A"}
*Categoria:* ${dados.categoria}
*Tier:* ${dados.tier}
*Bônus:* Força +${dados.forca_bonus} | Resistência +${dados.resistencia_bonus} | Velocidade +${dados.velocidade_bonus}
        Sentidos +${dados.sentidos_bonus} | Inteligência +${dados.inteligencia_bonus} | Poder Mágico +${dados.poder_magico_bonus}
*Efeito:* ${dados.efeito || "Nenhum"}
*Pertencente:* ${dados.pertencente}

══════════════════════════
Um ADM deve usar *!add item* para integrar e entregar ao dono.
            ` });
            return;
        }
    }
    
    // =====================================
    // RECONHECER FICHA DE PERSONAGEM
    // =====================================
    // Verificação rigorosa: só processa se parecer uma ficha
    const textoLower2 = texto.toLowerCase();
    
    // Verificar se tem campos básicos de ficha
    const temNome = textoLower2.includes("nome:");
    const temClasse = textoLower2.includes("classe");
    const temHistoria = textoLower2.includes("historia") || textoLower2.includes("história");
    const temAtributos = textoLower2.includes("força") || textoLower2.includes("forca") || textoLower2.includes("resistencia") || textoLower2.includes("forca:");
    
    // Verificar se tem múltiplas linhas (fichas têm várias linhas)
    const linhas = texto.split("\n").filter(l => l.trim().length > 0);
    const temMultiplasLinhas = linhas.length >= 5;
    
    // Se não atender critérios mínimos, ignorar
    if (!temNome && !temClasse) {
        return;
    }
    
    if (!temMultiplasLinhas) {
        return;
    }
    
    // Extrair campos
    const ficha = {};
    let camposEncontrados = 0;
    
    linhas.forEach(linha => {
        const partes = linha.split(":");
        if (partes.length < 2) return;
        
        const chave = partes[0].replace(/[*_>\-]/g, "").trim().toLowerCase();
        const valor = partes.slice(1).join(":").replace(/[*_>]/g, "").trim();
        
        // Ignorar placeholders e valores vazios
        if (!valor || valor === "_" || valor.startsWith("(") || (valor.length < 2 && !/^\d+$/.test(valor.trim()))) {
            // Para atributos numéricos (como 0), permitir mesmo com 1 caractere
            if (valor && /^\d+$/.test(valor.trim())) {
                // ok, valor numérico válido
            } else {
                return;
            }
        }
        
        const campos = {
            // Identidade
            "nome": "nome",
            "idade": "idade",
            "sexo": "genero",
            "gênero": "genero",
            "genero": "genero",
            "nacionalidade": "nacionalidade",
            "altura": "altura",
            "peso": "peso",
            "personalidade": "personalidade",
            "aparencia": "aparencia",
            "aparência": "aparencia",
            
            // Classe / Combate
            "classe desejada": "classe",
            "classe": "classe",
            "estilo de luta": "estilo_luta",
            "estilo de luta / proficiencia": "estilo_luta",
            "estilo de luta / proficiência": "estilo_luta",
            "estilo de luta/proficiencia": "estilo_luta",
            "estilo de luta/proficiência": "estilo_luta",
            "proficiencia": "estilo_luta",
            "proficiência": "estilo_luta",
            "estilo": "estilo_luta",
            "arma inicial": "arma",
            "arma": "arma",
            
            // Afinidade Elemental (mais variações)
            "elemento": "elemento",
            "afinidade elemental": "elemento",
            "afinidade": "elemento",
            "elemento/afinidade": "elemento",
            "elemento / afinidade": "elemento",
            "afinidade elementar": "elemento",
            
            // Atributos (com todas as variações possíveis)
            "força": "forca",
            "forca": "forca",
            "resistencia": "resistencia",
            "resistência": "resistencia",
            "velocidade": "velocidade",
            "agilidade": "sentidos",
            "sentidos": "sentidos",
            "inteligencia": "inteligencia",
            "inteligência": "inteligencia",
            "poder magico": "poder_magico",
            "poder mágico": "poder_magico",
            "poder magico:": "poder_magico",
            "poder mágico:": "poder_magico",
            "poder": "poder_magico",
            
            // História
            "historia": "historia",
            "história": "historia"
        };
        
        if (campos[chave]) {
            ficha[campos[chave]] = valor;
            camposEncontrados++;
        }
    });
    
    // Verificar se encontrou campos suficientes
    if (!ficha.nome || !ficha.classe) {
        return;
    }
    
    if (camposEncontrados < 3) {
        return;
    }

    ficha.classe = obterClasseCanonica(ficha.classe) || ficha.classe.trim();
    if (ficha.estilo_luta) ficha.estilo_luta = obterEstiloCanonico(ficha.estilo_luta) || ficha.estilo_luta.trim();
    
    // Salvar na memória temporária E no banco de dados
    const numero = msg.author || msg.from;
    fichasTemp[numero] = ficha;
    
    const db = require("../core/database");
    await new Promise((resolve, reject) => db.run(
        `INSERT INTO fichas_pendentes (numero, dados, status, data_envio, aprovado_por, motivo)
         VALUES (?, ?, 'aguardando', NULL, '', '')
         ON CONFLICT(numero) DO UPDATE SET
            dados = excluded.dados,
            status = 'aguardando',
            data_envio = NULL,
            aprovado_por = '',
            motivo = ''`,
        [numero, JSON.stringify(ficha)],
        err => err ? reject(err) : resolve()
    ));
    
    // Responder ao jogador com todos os dados
    const resposta = templates.fichaReconhecida(ficha);
    
    await MessageService.send({ message: msg, text: resposta });
    
    console.log(`[FICHA] Nova ficha reconhecida: ${ficha.nome} - ${ficha.classe}`);
};

// =====================================
// FUNÇÃO AUXILIAR
// =====================================
function extrairCampo(texto, campo) {
    const linhas = texto.split("\n");
    for (const linha of linhas) {
        const linhaLimpa = linha.replace(/^[\s>*_-]+/, "").replace(/[\s*_]+$/, "").trim();
        const linhaLower = linhaLimpa.toLowerCase();
        const campoLower = campo.toLowerCase();
        if (linhaLower.startsWith(campoLower + ":")) {
            return linhaLimpa.substring(linhaLimpa.indexOf(":") + 1).replace(/[>*_]/g, "").trim();
        }
    }
    return "";
}

module.exports.extrairCampo = extrairCampo;
