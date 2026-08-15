const MessageService = require("../core/messageService");

/**
 * COMANDO: !confirmar ficha
 * 
 * Confirma a ficha preenchida e envia para análise dos ADMs.
 * Salva no banco de dados como pendente para aprovação.
 * 
 * VALIDAÇÃO COMPLETA:
 * - Verifica todos os campos obrigatórios
 * - Valida formato de cada campo (sexo, altura, idade, etc.)
 * - Valida distribuição de atributos (máx 10 pontos, mínimo 0)
 * - Retorna relatório detalhado de erros
 */

const db = require("../core/database");
const { GROUP_CONFIG } = require("../core/groupConfig");
const templates = require("../utils/templatesMensagens");
const { obterClasseCanonica, listarClasses } = require("../utils/normalizarClasse");
const { normalizarDadosFicha } = require("../utils/normalizarDadosFicha");
const { obterEstiloCanonico } = require("../utils/normalizarEstiloLuta");
const elementos = require("../elementos/listaElementos");
const normalizarTexto = valor => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

// =====================================
// REGRAS DE VALIDAÇÃO
// =====================================

const VALIDACOES = {
    nome: {
        obrigatorio: true,
        validar: (v) => {
            if (!v || v.trim().length < 2) return "Nome deve ter pelo menos 2 caracteres";
            if (v.trim().length > 50) return "Nome deve ter no máximo 50 caracteres";
            return null;
        }
    },
    idade: {
        obrigatorio: true,
        validar: (v) => {
            if (!v) return "Idade não informada";
            const idade = parseInt(v);
            if (isNaN(idade)) return "Idade deve ser um número";
            if (idade < 10) return "Idade mínima é 10 anos";
            if (idade > 150) return "Idade máxima é 150 anos";
            return null;
        }
    },
    genero: {
        obrigatorio: true,
        validar: (v) => {
            if (!v) return "Gênero não informado";
            const genero = v.toLowerCase().trim();
            const validos = [
                "masculino", "feminino", "m", "f",
                "cisgênero", "cisgenero", "cis",
                "transgênero", "transgenero", "trans",
                "não-binário", "nao-binario", "nao binario", "nb",
                "homem cisgênero", "mulher cisgênero",
                "homem transgênero", "mulher transgênero",
                "pessoa não-binária", "pessoa nao-binaria"
            ];
            if (!validos.some(s => genero.startsWith(s.trim()))) {
                return "Gênero deve ser: Masculino, Feminino, Cisgênero, Transgênero ou Não-binário";
            }
            return null;
        }
    },
    nacionalidade: {
        obrigatorio: false,
        validar: (v) => {
            if (v && v.trim().length > 30) return "Nacionalidade muito longa (máx 30 caracteres)";
            return null;
        }
    },
    altura: {
        obrigatorio: true,
        validar: (v) => {
            if (!v) return "Altura não informada";
            // Aceita formatos: 1.75, 1,75, 175cm, 1.75m
            const alturaStr = v.toString().replace(",", ".").replace(/[^0-9.]/g, "");
            const altura = parseFloat(alturaStr);
            if (isNaN(altura)) return "Altura deve ser um número (ex: 1.75)";
            if (altura < 0.5) return "Altura mínima é 0.50m";
            if (altura > 3.0) return "Altura máxima é 3.00m";
            return null;
        }
    },
    peso: {
        obrigatorio: false,
        validar: (v) => {
            if (!v) return null;
            const pesoStr = v.toString().replace(",", ".").replace(/[^0-9.]/g, "");
            const peso = parseFloat(pesoStr);
            if (isNaN(peso)) return "Peso deve ser um número (ex: 70)";
            if (peso < 20) return "Peso mínimo é 20kg";
            if (peso > 500) return "Peso máximo é 500kg";
            return null;
        }
    },
    personalidade: {
        obrigatorio: false,
        validar: (v) => {
            if (v && v.trim().length < 10) return "Personalidade muito curta (mínimo 10 caracteres)";
            if (v && v.trim().length > 500) return "Personalidade muito longa (máx 500 caracteres)";
            return null;
        }
    },
    aparencia: {
        obrigatorio: true,
        validar: (v) => {
            if (!v) return "Aparência não informada";
            if (v.trim().length < 10) return "Aparência muito curta (mínimo 10 caracteres)";
            if (v.trim().length > 1000) return "Aparência muito longa (máx 1000 caracteres)";
            return null;
        }
    },
    classe: {
        obrigatorio: true,
        validar: (v) => {
            if (!v) return "Classe não informada";
            if (String(v).trim().toLowerCase() === "ranger") {
                return "Escolha Ranger Físico (+50% de Força) ou Ranger Mágico (+50% de Poder Mágico). Informe a variante completa no campo Classe desejada.";
            }
            if (!obterClasseCanonica(v)) {
                return `Classe "${v}" não reconhecida. Classes válidas: ${listarClasses().join(", ")}`;
            }
            return null;
        }
    },
    estilo_luta: {
        obrigatorio: false,
        validar: (v) => {
            if (v && v.trim().length > 100) return "Estilo de luta/proficiência muito longo (máx 100 caracteres)";
            if (v && !obterEstiloCanonico(v)) return `Estilo "${v}" não reconhecido. Use !estilos de luta para consultar as opções.`;
            return null;
        }
    },
    arma: {
        obrigatorio: false,
        validar: (v) => {
            if (!v || v.trim() === "") return null; // Arma é opcional
            if (v.trim().length > 50) return "Nome da arma muito longo (máx 50 caracteres)";
            // Verificar se a arma existe no itens.json
            const itens = require("../database/itens.json");
            const armasDisponiveis = itens.armas || [];
            const armaEncontrada = armasDisponiveis.some(a => 
                a.nome.toLowerCase().trim() === v.toLowerCase().trim()
            );
            if (!armaEncontrada) {
                return `Arma "${v}" não encontrada. Use !armasiniciais para ver as armas disponíveis`;
            }
            return null;
        }
    },
    historia: {
        obrigatorio: false,
        validar: (v) => {
            if (!v || v.trim() === "") return null; // História será avaliada pelo ADM
            if (v.trim().length > 3000) return "História muito longa (máx 3000 caracteres)";
            return null;
        }
    }
};

// =====================================
// VALIDAÇÃO DE ATRIBUTOS
// =====================================

const ATRIBUTOS = ["forca", "resistencia", "velocidade", "sentidos", "inteligencia", "poder_magico"];
const PONTOS_MAXIMOS = 10;
const PONTOS_TOTAIS_MAXIMOS = 10;

function validarAtributos(dados) {
    const erros = [];
    let somaTotal = 0;
    
    for (const attr of ATRIBUTOS) {
        const valor = parseInt(dados[attr]);
        
        if (dados[attr] === undefined || dados[attr] === null || dados[attr] === "") {
            erros.push(`• *${formatarNomeAtributo(attr)}*: não informado`);
            continue;
        }
        
        if (isNaN(valor)) {
            erros.push(`• *${formatarNomeAtributo(attr)}*: "${dados[attr]}" não é um número válido`);
            continue;
        }
        
        if (valor < 0) {
            erros.push(`• *${formatarNomeAtributo(attr)}*: ${valor} (valor negativo não permitido)`);
            continue;
        }
        
        if (valor > PONTOS_MAXIMOS) {
            erros.push(`• *${formatarNomeAtributo(attr)}*: ${valor} (máximo ${PONTOS_MAXIMOS} pontos)`);
            continue;
        }
        
        somaTotal += valor;
    }
    
    if (somaTotal > PONTOS_TOTAIS_MAXIMOS) {
        erros.push(`• *Total de pontos*: ${somaTotal}/${PONTOS_TOTAIS_MAXIMOS} (você só pode distribuir ${PONTOS_TOTAIS_MAXIMOS} pontos no total)`);
    }
    
    return erros;
}

function formatarNomeAtributo(attr) {
    const mapa = {
        forca: "Força",
        resistencia: "Resistência",
        velocidade: "Velocidade",
        sentidos: "Sentidos/Agilidade",
        inteligencia: "Inteligência",
        poder_magico: "Poder Mágico"
    };
    return mapa[attr] || attr;
}

// =====================================
// COMANDO PRINCIPAL
// =====================================

module.exports = async (msg) => {
    try {
        console.log("[FICHA] ===== COMANDO CONFIRMAR FICHA CHAMADO =====");
        const numero = msg.author || msg.from;
        console.log(`[FICHA] Numero do jogador: ${numero}`);
        
        // Buscar ficha pendente salva pelo reconhecedor
        db.get("SELECT * FROM fichas_pendentes WHERE numero = ? AND status = 'aguardando'", [numero], async (err, ficha) => {
            if (err) {
                console.error("[FICHA] Erro ao buscar ficha:", err);
                return MessageService.send({ message: msg, text: templates.erro("Erro ao buscar ficha. Tente novamente.") });
            }
            
            if (!ficha) {
                console.warn(`[FICHA] Nenhuma ficha pendente encontrada para ${numero}`);
                return MessageService.send({ message: msg, text: templates.erro("Nenhuma ficha encontrada para confirmar.") + "\n_Envie sua ficha primeiro com os campos Nome, Classe, etc._" });
            }
            
            console.log(`[FICHA] Ficha encontrada: ${JSON.stringify(ficha)}`);
            
            const dados = JSON.parse(ficha.dados || "{}");
            const classeCanonica = obterClasseCanonica(dados.classe);
            if (classeCanonica) dados.classe = classeCanonica;
            
            // ===================================================================
            // VALIDAÇÃO COMPLETA DA FICHA
            // ===================================================================
            const errosValidacao = [];
            const avisos = [];
            
            // Validar campos individuais
            for (const [campo, regras] of Object.entries(VALIDACOES)) {
                const valor = dados[campo];
                
                if (regras.obrigatorio && (!valor || valor.toString().trim() === "")) {
                    errosValidacao.push(`• *${formatarNomeCampo(campo)}*: ${regras.validar() || "campo obrigatório não preenchido"}`);
                    continue;
                }
                
                if (valor && valor.toString().trim() !== "") {
                    const erro = regras.validar(valor);
                    if (erro) {
                        errosValidacao.push(`• *${formatarNomeCampo(campo)}*: ${erro}`);
                    }
                }
            }
            
            // Validar atributos
            const errosAtributos = validarAtributos(dados);
            errosValidacao.push(...errosAtributos);
            
            // ===================================================================
            // VERIFICAR CONFLITO DE AFINIDADE ELEMENTAL E CONVERTER MAGO ELEMENTAL
            // ===================================================================
            const afinidadeFicha = dados.elemento || dados.afinidade || "";
            if (afinidadeFicha) {
                const elementoCanonico = elementos.find(elemento => normalizarTexto(elemento.nome) === normalizarTexto(afinidadeFicha));
                if (!elementoCanonico) errosValidacao.push(`• *Elemento/Afinidade*: "${afinidadeFicha}" não existe no sistema.`);
                else dados.elemento = elementoCanonico.nome;
            }
            
            // Se o jogador escolheu "Mago Elemental", converter para o elemento da afinidade
            if (dados.classe && dados.classe.toLowerCase().includes("mago elemental")) {
                try {
                    const jogador = await new Promise((resolve, reject) => {
                        db.get("SELECT afinidade_elemental FROM jogadores WHERE numero = ?", [numero], (err, row) => {
                            if (err) reject(err);
                            else resolve(row);
                        });
                    });
                    
                    if (jogador && jogador.afinidade_elemental && jogador.afinidade_elemental !== "Nenhuma") {
                        const elemento = jogador.afinidade_elemental;
                        const classeConvertida = `Mago de ${elemento}`;
                        
                        console.log(`[FICHA] Convertendo Mago Elemental para ${classeConvertida} (afinidade: ${elemento})`);
                        
                        // Atualizar a classe na ficha
                        dados.classe = classeConvertida;
                        
                        // Atualizar no banco de dados
                        const fichaAtualizada = JSON.stringify(dados);
                        db.run("UPDATE fichas_pendentes SET dados = ? WHERE numero = ?", [fichaAtualizada, numero], (err) => {
                            if (err) {
                                console.error("[FICHA] Erro ao atualizar classe:", err);
                            } else {
                                console.log(`[FICHA] Classe atualizada para ${classeConvertida}`);
                            }
                        });
                        
                        avisos.push(`⚡ *Conversão de Classe*: Mago Elemental → ${classeConvertida} (baseado na sua afinidade ${elemento})`);
                    } else {
                        errosValidacao.push(`• *Classe*: Você escolheu "Mago Elemental" mas não possui afinidade elemental sorteada. Use !sortear afinidade primeiro ou escolha outra classe.`);
                    }
                } catch (e) {
                    console.log("[FICHA] Erro ao converter Mago Elemental:", e);
                    errosValidacao.push(`• *Classe*: Erro ao verificar afinidade. Tente novamente.`);
                }
            } else if (afinidadeFicha) {
                // Verificar conflito de afinidade para outras classes
                try {
                    const jogador = await new Promise((resolve, reject) => {
                        db.get("SELECT afinidade_elemental FROM jogadores WHERE numero = ?", [numero], (err, row) => {
                            if (err) reject(err);
                            else resolve(row);
                        });
                    });
                    
                    if (jogador && jogador.afinidade_elemental && jogador.afinidade_elemental !== "Nenhuma") {
                        const afinidadeSorteada = jogador.afinidade_elemental;
                        if (afinidadeFicha.toLowerCase() !== afinidadeSorteada.toLowerCase()) {
                            errosValidacao.push(`• *Elemento/Afinidade*: conflito! Você colocou "${afinidadeFicha}" na ficha, mas sua afinidade sorteada é "${afinidadeSorteada}". Use a afinidade correta.`);
                        }
                    }
                } catch (e) {
                    console.log("[FICHA] Erro ao verificar afinidade:", e);
                }
            }
            
            // ===================================================================
            // SE HOUVER ERROS, RETORNAR RELATÓRIO DETALHADO
            // ===================================================================
            if (errosValidacao.length > 0) {
                let mensagemErro = `*═══ FICHA REPROVADA NA VALIDAÇÃO ═══*\n`;
                mensagemErro += `${templates.divisor()}\n`;
                mensagemErro += `*Foram encontrados ${errosValidacao.length} erro(s):*\n\n`;
                mensagemErro += errosValidacao.join("\n");
                mensagemErro += `\n\n${templates.divisor()}`;
                mensagemErro += `\n*Corrija os campos acima e envie a ficha novamente.*`;
                mensagemErro += `\n_Use !ficha para ver o modelo de preenchimento._`;
                
                if (avisos.length > 0) {
                    mensagemErro += `\n\n*⚠ Avisos:*\n`;
                    mensagemErro += avisos.join("\n");
                }
                
                return MessageService.send({ message: msg, text: mensagemErro });
            }

            Object.assign(dados, normalizarDadosFicha(dados));
            if (dados.estilo_luta) dados.estilo_luta = obterEstiloCanonico(dados.estilo_luta) || dados.estilo_luta;
            
            // ===================================================================
            // SE PASSAR NA VALIDAÇÃO, ENVIAR PARA APROVAÇÃO
            // ===================================================================
            console.log(`[FICHA] Dados validados com sucesso: ${JSON.stringify(dados)}`);
            
            // Atualizar status para "pendente" (pronto para aprovação)
            db.run("UPDATE fichas_pendentes SET dados = ?, status = 'pendente', data_envio = datetime('now') WHERE numero = ?", [JSON.stringify(dados), numero], (err) => {
                if (err) {
                    console.error("[FICHA] Erro ao atualizar status:", err);
                }
            });
            
            // Responder diretamente à mensagem do jogador (reply)
            const mensagem = templates.fichaConfirmada(dados);
            console.log(`[FICHA] Enviando confirmação para jogador...`);
            await MessageService.send({ message: msg, text: mensagem });
            console.log(`[FICHA] Confirmação enviada com sucesso para ${dados.nome}`);
            
            // Enviar ficha para o grupo de aprovação
            const grupoAprovacao = GROUP_CONFIG.aprovacao;
            console.log(`[FICHA] Grupo de aprovação: ${grupoAprovacao}`);
            console.log(`[FICHA] Client disponível: ${!!msg.client}`);
            
            if (grupoAprovacao && msg.client) {
                const fichaAprovacao = templates.fichaEnviadaAprovacao(dados);
                console.log(`[FICHA] Enviando ficha para grupo de aprovação...`);
                
                try {
                    await MessageService.send({ chatId: grupoAprovacao, text: fichaAprovacao });
                    console.log(`[FICHA] ✓ Ficha enviada com sucesso para grupo de aprovação: ${dados.nome}`);
                } catch (erro) {
                    console.error("[FICHA] ✗ Erro ao enviar ficha para grupo de aprovacao:", erro);
                }
            } else {
                console.warn("[FICHA] Grupo de aprovação não configurado ou client não disponível");
            }
            
            console.log(`[FICHA] Processo concluído: ${dados.nome} (${numero})`);
        });
    } catch (error) {
        console.error("[FICHA] Erro geral no comando confirmar:", error);
    }
};

// =====================================
// FUNÇÕES AUXILIARES
// =====================================

function formatarNomeCampo(campo) {
    const mapa = {
        nome: "Nome",
        idade: "Idade",
        genero: "Gênero",
        sexo: "Gênero",
        nacionalidade: "Nacionalidade",
        altura: "Altura",
        peso: "Peso",
        personalidade: "Personalidade",
        aparencia: "Aparência",
        classe: "Classe",
        estilo_luta: "Estilo de Luta",
        arma: "Arma Inicial",
        historia: "História"
    };
    return mapa[campo] || campo;
}

module.exports.VALIDACOES = VALIDACOES;
