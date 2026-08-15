const MessageService = require("../core/messageService");

/**
 * COMANDO: !aprovar ficha / !recusar ficha
 * 
 * Sistema de aprovação de fichas pelo ADM.
 * Cria Habilidade Única automaticamente na aprovação.
 */

const db = require("../core/database");
const adminCore = require("../core/adminCore");
const elementos = require("../elementos/listaElementos");
const templates = require("../utils/templatesMensagens");
const { obterClasseCanonica } = require("../utils/normalizarClasse");
const obterBuffsClasse = require("../utils/obterBuffsClasse");
const { normalizarDadosFicha } = require("../utils/normalizarDadosFicha");

function adicionarArmaInicial(jogadorId, nomeArma, nomeJogador) {
    if (!jogadorId || !nomeArma) return;
    const armas = require("../database/itens.json").armas || [];
    const arma = armas.find(item => item.nome.toLowerCase().trim() === nomeArma.toLowerCase().trim());
    if (!arma) return;
    db.run(`INSERT OR IGNORE INTO itens (nome, categoria, tier, descricao, arma, preco)
            VALUES (?, 'Arma 1', 'Inicial', ?, 1, 0)`, [arma.nome, arma.descricao || "Arma inicial"], err => {
        if (err) return console.error("[APROVACAO] Erro ao registrar arma inicial:", err.message);
        db.get("SELECT id FROM itens WHERE LOWER(nome) = LOWER(?)", [arma.nome], (erro, item) => {
            if (erro || !item) return console.error("[APROVACAO] Arma inicial não localizada após registro.");
            db.run("INSERT OR IGNORE INTO inventario_jogador (jogador_id, item_id, quantidade, equipado, item_inicial) VALUES (?, ?, 1, 1, 1)", [jogadorId, item.id], falha => {
                if (falha) console.error("[APROVACAO] Erro ao entregar arma inicial:", falha.message);
                else console.log(`[APROVACAO] Arma "${arma.nome}" adicionada ao inventário de ${nomeJogador}`);
            });
        });
    });
}

async function enviarRecadoPosAprovacao(numeroJogador, nomeJogador) {
    const resultado = await MessageService.send({
        chatId: numeroJogador,
        text: templates.recadoPosAprovacao(nomeJogador)
    });

    if (!resultado.sucesso) {
        console.error(`[APROVACAO] Nao foi possivel enviar o recado de boas-vindas para ${nomeJogador}: ${resultado.erro}`);
    }
}

module.exports = async (msg) => {
    const numero = msg.author || msg.from;
    if (!await adminCore.isAdmin(numero)) {
        return MessageService.send({ message: msg, text: templates.acessoNegado() });
    }
    const corpo = msg.body.toLowerCase();
    
    // Verificar se é aprovação ou recusa
    const ehAprovacao = corpo.includes("aprovar");
    const ehRecusa = corpo.includes("recusar");
    
    if (!ehAprovacao && !ehRecusa) {
        return MessageService.send({ message: msg, text: "*✖ Use: !aprovar ficha [nome] [habilidade_unica]*\nou\n*!recusar ficha [nome] [motivo]*" });
    }
    
    // ===================================================================
    // EXTRAIR NOME COMPLETO DO JOGADOR (suporta nomes com sobrenomes)
    // ===================================================================
    const textoCompleto = msg.body.trim();
    let nomeJogador = "";
    let restoComando = "";
    
    if (ehAprovacao) {
        // Formato: !aprovar ficha Nome Completo do Jogador Habilidade Única
        const prefixo = corpo.startsWith("!aprovar ficha ") ? "!aprovar ficha " : "!aprovar ficha";
        const depoisPrefixo = textoCompleto.substring(textoCompleto.toLowerCase().indexOf("ficha") + 6).trim();
        
        // Dividir em palavras: a última parte é a habilidade única
        // Se só tem 1 palavra depois do prefixo, é só o nome
        const palavras = depoisPrefixo.split(" ");
        if (palavras.length < 2) {
            nomeJogador = depoisPrefixo;
            restoComando = "";
        } else {
            // A habilidade única é tudo após o nome - mas como saber onde termina o nome?
            // Buscamos primeiro pelo nome completo no banco, se não achar, tentamos progressivamente
            nomeJogador = depoisPrefixo; // Assume tudo é nome inicialmente
            restoComando = ""; // Será tratado após encontrar a ficha
        }
    } else {
        // Formato: !recusar ficha Nome Completo do Jogador Motivo
        const depoisPrefixo = textoCompleto.substring(textoCompleto.toLowerCase().indexOf("ficha") + 6).trim();
        nomeJogador = depoisPrefixo;
    }
    
    if (!nomeJogador) {
        return MessageService.send({ message: msg, text: "*✖ Especifique o nome do jogador.*\nEx: !aprovar ficha Fichers" });
    }
    
    // ===================================================================
    // BUSCAR FICHA PENDENTE PELO NOME COMPLETO (suporta sobrenomes)
    // ===================================================================
    // Tenta encontrar a ficha pelo nome exato primeiro, depois por LIKE
    const buscarFichaPorNome = (nomeBusca) => {
        return new Promise((resolve, reject) => {
            // Busca nos dados JSON da ficha pendente pelo nome do jogador
            db.all("SELECT * FROM fichas_pendentes WHERE status = 'pendente'", [], (err, fichas) => {
                if (err) return reject(err);
                
                // Procurar correspondência exata ignorando maiúsculas/minúsculas
                const nomeBuscaLower = nomeBusca.toLowerCase().trim();
                
                // 1. Tentar correspondência exata do nome
                let fichaEncontrada = fichas.find(f => {
                    try {
                        const dados = JSON.parse(f.dados || "{}");
                        const nomeFicha = (dados.nome || "").toLowerCase().trim();
                        return nomeFicha === nomeBuscaLower;
                    } catch { return false; }
                });
                
                // 2. Se não achou, tentar começa com (para nomes parciais)
                if (!fichaEncontrada) {
                    fichaEncontrada = fichas.find(f => {
                        try {
                            const dados = JSON.parse(f.dados || "{}");
                            const nomeFicha = (dados.nome || "").toLowerCase().trim();
                            return nomeFicha.startsWith(nomeBuscaLower) || nomeBuscaLower.startsWith(nomeFicha);
                        } catch { return false; }
                    });
                }
                
                // 3. Se ainda não achou, tentar contém (parte do nome)
                if (!fichaEncontrada) {
                    fichaEncontrada = fichas.find(f => {
                        try {
                            const dados = JSON.parse(f.dados || "{}");
                            const nomeFicha = (dados.nome || "").toLowerCase().trim();
                            return nomeFicha.includes(nomeBuscaLower) || nomeBuscaLower.includes(nomeFicha);
                        } catch { return false; }
                    });
                }
                
                resolve(fichaEncontrada);
            });
        });
    };
    
    let ficha = await buscarFichaPorNome(nomeJogador);
    
    if (!ficha) {
        return MessageService.send({ message: msg, text: `*✖ Nenhuma ficha pendente encontrada para: ${nomeJogador}*\n_Veja se o nome está correto. Use !ver fila para listar as fichas pendentes._` });
    }
    
    const dados = normalizarDadosFicha(JSON.parse(ficha.dados || "{}"));
    dados.classe = obterClasseCanonica(dados.classe) || dados.classe;
    const nomeReal = dados.nome || nomeJogador;
    
    if (ehRecusa) {
        // RECUSAR FICHA
        // O motivo é tudo após o comando !recusar ficha
        const prefixoRecusa = textoCompleto.toLowerCase().includes("!recusar ficha") ? "!recusar ficha " : "!recusar";
        const depoisComando = textoCompleto.substring(textoCompleto.toLowerCase().indexOf("recusar") + 8).trim();
        const motivo = depoisComando || "Motivo não especificado";
        
        db.run("UPDATE fichas_pendentes SET status = 'recusado', motivo = ? WHERE id = ?", 
            [motivo, ficha.id]);
        
        // Deletar do banco de jogadores se existir
        db.run("DELETE FROM jogadores WHERE nome = ?", [nomeReal]);
        
        const mensagemRecusa = templates.fichaRecusada(dados, motivo);
        return MessageService.send({ message: msg, text: mensagemRecusa });
    }
    
    if (ehAprovacao) {
        // ===================================================================
        // EXTRAIR HABILIDADE ÚNICA
        // ===================================================================
        // O nome real do jogador foi encontrado no banco. 
        // A habilidade única é o texto que SOBRA depois de remover o nome do comando original.
        const textoAposFicha = textoCompleto.substring(textoCompleto.toLowerCase().indexOf("ficha") + 6).trim();
        const nomeRealLower = nomeReal.toLowerCase();
        
        // Remover o nome do jogador do texto para extrair a habilidade única
        let habilidadeUnica = "";
        if (textoAposFicha.toLowerCase().startsWith(nomeRealLower)) {
            habilidadeUnica = textoAposFicha.substring(nomeReal.length).trim();
        } else {
            // Fallback: tenta remover palavra por palavra do início até achar a ficha
            const palavrasTexto = textoAposFicha.split(" ");
            let nomeEncontrado = "";
            let idx = 0;
            for (let i = 1; i <= palavrasTexto.length; i++) {
                const tentativaNome = palavrasTexto.slice(0, i).join(" ");
                if (nomeRealLower.startsWith(tentativaNome.toLowerCase())) {
                    nomeEncontrado = tentativaNome;
                    idx = i;
                } else {
                    break;
                }
            }
            if (nomeEncontrado) {
                habilidadeUnica = palavrasTexto.slice(idx).join(" ");
            } else {
                // Último recurso: assume que a primeira palavra do nome é o nome
                const primeiraPalavra = nomeReal.split(" ")[0];
                const idxPrimeira = textoAposFicha.toLowerCase().indexOf(primeiraPalavra.toLowerCase());
                if (idxPrimeira >= 0) {
                    habilidadeUnica = textoAposFicha.substring(idxPrimeira + primeiraPalavra.length).trim();
                }
            }
        }
        
        if (!habilidadeUnica) {
            return MessageService.send({ message: msg, text: `*✖ Especifique a Habilidade Única.*\nEx: !aprovar ficha ${nomeReal} Manipulação do tempo` });
        }
        
        // Calcular atributos finais com buffs de classe
        const buffClasse = obterBuffsClasse(dados.classe, dados);
        
        const forcaFinal = parseInt(dados.forca || 0) + (buffClasse.forca_buff || 0);
        const resistenciaFinal = parseInt(dados.resistencia || 0) + (buffClasse.resistencia_buff || 0);
        const velocidadeFinal = parseInt(dados.velocidade || 0) + (buffClasse.velocidade_buff || 0);
        const sentidosFinal = parseInt(dados.sentidos || 0) + (buffClasse.sentidos_buff || 0);
        const inteligenciaFinal = parseInt(dados.inteligencia || 0) + (buffClasse.inteligencia_buff || 0);
        const poderMagicoFinal = parseInt(dados.poder_magico || 0) + (buffClasse.poder_magico_buff || 0);
        
        // Calcular HP e Mana
        const hpMaximo = 100 + (resistenciaFinal * 10);
        const manaMaxima = 100 + (inteligenciaFinal * 10);
        
        // Verificar se jogador já existe (para preservar campos como afinidade_elemental, etc.)
        const jogadorExistente = await new Promise((resolve, reject) => {
            db.get("SELECT id, afinidade_elemental, afinidade_sorteada, estilo_luta, arma_inicial FROM jogadores WHERE numero = ?", [ficha.numero], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (jogadorExistente) {
            // Jogador já existe → fazer UPDATE preservando campos existentes
            db.run(`
                UPDATE jogadores SET
                    nome = ?, idade = ?, sexo = ?, nacionalidade = ?, altura = ?, peso = ?,
                    personalidade = ?, aparencia = ?, historia = ?, classe = ?,
                    forca_base = ?, resistencia_base = ?, velocidade_base = ?, sentidos_base = ?,
                    inteligencia_base = ?, poder_magico_base = ?,
                    forca_buff = ?, resistencia_buff = ?, velocidade_buff = ?, sentidos_buff = ?,
                    inteligencia_buff = ?, poder_magico_buff = ?,
                    forca_total = ?, resistencia_total = ?, velocidade_total = ?, sentidos_total = ?,
                    inteligencia_total = ?, poder_magico_total = ?,
                    vida_maxima = ?, vida_atual = ?, mana_maxima = ?, mana_atual = ?,
                    habilidade_unica = ?, ficha_aprovada = ?,
                    pontos_atributo = ?,
                    estilo_luta = COALESCE(NULLIF(?, ''), estilo_luta),
                    arma_inicial = COALESCE(NULLIF(?, ''), arma_inicial)
                WHERE numero = ?
            `, [
                nomeReal,
                dados.idade || "?",
                dados.genero || dados.sexo || "?",
                dados.nacionalidade || "?",
                dados.altura || "?",
                dados.peso || "?",
                dados.personalidade || "?",
                dados.aparencia || "?",
                dados.historia || "Sem história",
                dados.classe || "Sem classe",
                dados.forca || 0,
                dados.resistencia || 0,
                dados.velocidade || 0,
                dados.sentidos || 0,
                dados.inteligencia || 0,
                dados.poder_magico || 0,
                buffClasse.forca_buff || 0,
                buffClasse.resistencia_buff || 0,
                buffClasse.velocidade_buff || 0,
                buffClasse.sentidos_buff || 0,
                buffClasse.inteligencia_buff || 0,
                buffClasse.poder_magico_buff || 0,
                forcaFinal,
                resistenciaFinal,
                velocidadeFinal,
                sentidosFinal,
                inteligenciaFinal,
                poderMagicoFinal,
                hpMaximo,
                hpMaximo,
                manaMaxima,
                manaMaxima,
                habilidadeUnica,
                1,  // ficha_aprovada = 1 (aprovado)
                0,  // pontos_atributo inicial
                dados.estilo_luta || "",
                dados.arma || "",
                ficha.numero
            ], function(err) {
                if (err) {
                    console.log("Erro ao atualizar ficha:", err);
                    return MessageService.send({ message: msg, text: "*✖ Erro ao aprovar ficha. Tente novamente.*" });
                }
                
                db.run("UPDATE fichas_pendentes SET status = 'aprovado', aprovado_por = ? WHERE id = ?", 
                    [numero, ficha.id]);
                
                const mensagemAprovacao = templates.fichaAprovada(dados, habilidadeUnica, hpMaximo, manaMaxima);
                MessageService.send({ message: msg, text: mensagemAprovacao });
                enviarRecadoPosAprovacao(ficha.numero, nomeReal);
                
                // Adicionar arma inicial ao inventário do jogador
                adicionarArmaInicial(jogadorExistente.id, dados.arma, nomeReal);
                
                console.log(`[APROVACAO] ${nomeReal} atualizado por ${numero}`);
            });
        } else {
            // Jogador não existe → INSERT completo
            db.run(`
                INSERT INTO jogadores (
                    numero, nome, idade, sexo, nacionalidade, altura, peso,
                    personalidade, aparencia, historia, classe,
                    estilo_luta, arma_inicial,
                    forca_base, resistencia_base, velocidade_base, sentidos_base, 
                    inteligencia_base, poder_magico_base,
                    forca_buff, resistencia_buff, velocidade_buff, sentidos_buff,
                    inteligencia_buff, poder_magico_buff,
                    forca_total, resistencia_total, velocidade_total, sentidos_total,
                    inteligencia_total, poder_magico_total,
                    vida_maxima, vida_atual, mana_maxima, mana_atual,
                    habilidade_unica, ficha_aprovada, pontos_atributo, rank, nivel, experiencia, won
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 'E', 1, 0, 10000) RETURNING id
            `, [
                ficha.numero,
                nomeReal,
                dados.idade || "?",
                dados.genero || dados.sexo || "?",
                dados.nacionalidade || "?",
                dados.altura || "?",
                dados.peso || "?",
                dados.personalidade || "?",
                dados.aparencia || "?",
                dados.historia || "Sem história",
                dados.classe || "Sem classe",
                dados.estilo_luta || "Nenhum",
                dados.arma || "Nenhuma",
                dados.forca || 0,
                dados.resistencia || 0,
                dados.velocidade || 0,
                dados.sentidos || 0,
                dados.inteligencia || 0,
                dados.poder_magico || 0,
                buffClasse.forca_buff || 0,
                buffClasse.resistencia_buff || 0,
                buffClasse.velocidade_buff || 0,
                buffClasse.sentidos_buff || 0,
                buffClasse.inteligencia_buff || 0,
                buffClasse.poder_magico_buff || 0,
                forcaFinal,
                resistenciaFinal,
                velocidadeFinal,
                sentidosFinal,
                inteligenciaFinal,
                poderMagicoFinal,
                hpMaximo,
                hpMaximo,
                manaMaxima,
                manaMaxima,
                habilidadeUnica,
                1,  // ficha_aprovada = 1 (aprovado)
                0   // pontos_atributo inicial
            ], function(err) {
                if (err) {
                    console.log("Erro ao criar ficha:", err);
                    return MessageService.send({ message: msg, text: "*✖ Erro ao aprovar ficha. Tente novamente.*" });
                }
                
                db.run("UPDATE fichas_pendentes SET status = 'aprovado', aprovado_por = ? WHERE id = ?", 
                    [numero, ficha.id]);
                
                const mensagemAprovacao = templates.fichaAprovada(dados, habilidadeUnica, hpMaximo, manaMaxima);
                MessageService.send({ message: msg, text: mensagemAprovacao });
                enviarRecadoPosAprovacao(ficha.numero, nomeReal);
                
                // Adicionar arma inicial ao inventário do novo jogador
                adicionarArmaInicial(this.lastID, dados.arma, nomeReal);
                
                console.log(`[APROVACAO] ${nomeReal} criado por ${numero}`);
            });
        }
    }
};
