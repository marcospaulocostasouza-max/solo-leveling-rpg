const MessageService = require("../core/messageService");

/**
 * COMANDO !TÉCNICA (singular) - EXIBE FICHA DETALHADA DE UMA TÉCNICA
 * 
 * !técnica <nome da técnica> → Mostra a ficha completa da técnica
 * 
 * Formato da ficha:
 * ♧┃Técnicas 𖥔 Solo Leveling
 *      ── Classe · Mecanica ──
 * *Nome da técnica*
 * > Descrição
 * 
 * _`─( ◆ )───── 𝗦𝗶𝘁𝘂𝗮𝗰̧𝗮̃𝗼`_
 * *Status:* Disponível
 * *Custo:* ?? Maestria 
 * *Você tem:* X Maestria
 * *Falta:* X Maestria
 * 
 * _`─( ◆ )───── 𝗢 𝗤𝘂𝗲 𝗟𝗶𝗯𝗲𝗿𝗮`_
 * > benefícios e custo de mana
 * 
 * _`─( ◆ )───── 𝗗𝗲𝘁𝗮𝗹𝗵𝗲𝘀`_
 * *Classe:* classe
 * *Ranks:* rank E ao S
 * *Elemento:* elemento ou "Nenhum"
 * *Custo de mana:* X MP
 * 
 * _`─( ◆ )───── 𝗥𝗲𝗾𝘂𝗶𝘀𝗶𝘁𝗼𝘀`_
 * *Precisa:* requisitos
 * *Faltando:* oq falta
 * 
 * _`─( ◆ )───── 𝗟𝗶𝗺𝗶𝘁𝗲𝘀`_
 * > dano de acordo com o sistema de atributos.
 * 
 * _`─( ◆ )───── UP`_
 * Evolução da técnica com tokens.
 * 
 * _`─( ◆ )───── 𝗔𝗰̧𝗮̃𝗼`_
 * !comprar Nome da técnica
 */

const { classesIniciais } = require("../tecnicas/registrarTecnicas");
const advancedTechniques = require("../tecnicas/avancadas/techniques");
const db = require("../core/database");
const { SISTEMA_MAESTRIA } = require("../tecnicas/sistemaMaestria");
const { normalizarTecnica, normalizarJogador } = require("../systems/maestriaSystem");

/**
 * Busca técnica por nome em todas as fontes possíveis
 */
function buscarTecnica(nomeBusca) {
    const nomeLower = nomeBusca.toLowerCase().trim();
    if (!nomeLower) return null;

    // 1. Buscar em classes iniciais
    for (const [key, classe] of Object.entries(classesIniciais)) {
        // Técnica inicial
        if (classe.tecnicaInicial && classe.tecnicaInicial.nome.toLowerCase() === nomeLower) {
            return {
                ...classe.tecnicaInicial,
                classe_nome: classe.nome,
                descricao_classe: classe.descricao_classe,
                categoria_origem: classe.categoria || "Classe",
                fonte: "Classe Inicial"
            };
        }
        // Técnicas da classe
        if (classe.tecnicas && Array.isArray(classe.tecnicas)) {
            for (const tec of classe.tecnicas) {
                if (tec.nome.toLowerCase() === nomeLower) {
                    return {
                        ...tec,
                        classe_nome: classe.nome,
                        descricao_classe: classe.descricao_classe,
                        categoria_origem: classe.categoria || "Classe",
                        fonte: "Classe Inicial"
                    };
                }
            }
        }
    }

    // 2. Buscar em classes avançadas
    for (const [classe, tecs] of Object.entries(advancedTechniques)) {
        if (Array.isArray(tecs)) {
            for (const tec of tecs) {
                if (tec.nome.toLowerCase().trim() === nomeLower) {
                    return {
                        ...tec,
                        classe_nome: classe,
                        categoria: "Avançada",
                        categoria_origem: "Avançada",
                        fonte: "Classe Avançada"
                    };
                }
            }
        }
    }

    return null;
}

/**
 * Determina o rank da técnica baseado no nível de desbloqueio
 */
function determinarRank(nivel) {
    if (!nivel) return "E";
    if (nivel <= 5) return "E";
    if (nivel <= 10) return "D";
    if (nivel <= 20) return "C";
    if (nivel <= 35) return "B";
    if (nivel <= 50) return "A";
    return "S";
}

/**
 * Determina o elemento da técnica baseado na classe
 */
function determinarElemento(tecnica) {
    // Verificar se tem elemento explícito
    if (tecnica.elemento) return tecnica.elemento;
    
    const classeLower = (tecnica.classe_nome || tecnica.classe || "").toLowerCase();
    
    const mapaElementos = {
        "fogo": "Fogo",
        "gelo": "Gelo",
        "agua": "Água",
        "terra": "Terra",
        "vento": "Vento",
        "raio": "Raio",
        "eletrico": "Raio",
        "trevas": "Trevas",
        "escuridao": "Trevas",
        "escuridão": "Trevas",
        "luz": "Luz",
        "sagrado": "Luz",
        "divino": "Luz",
        "planta": "Planta",
        "natureza": "Planta",
        "maldicao": "Maldição",
        "maldição": "Maldição",
        "invocador": "Invocação",
        "invocacao": "Invocação",
        "barreira": "Barreira",
        "espiritual": "Espiritual",
        "espirito": "Espiritual"
    };
    
    for (const [palavra, elemento] of Object.entries(mapaElementos)) {
        if (classeLower.includes(palavra)) return elemento;
    }
    
    // Se não encontrou, verificar na descrição
    const descLower = (tecnica.descricao || tecnica.descricao_completa || "").toLowerCase();
    for (const [palavra, elemento] of Object.entries(mapaElementos)) {
        if (descLower.includes(palavra)) return elemento;
    }
    
    return "Nenhum";
}

/**
 * Formata a ficha completa da técnica no padrão especificado
 */
function formatarFicha(tecnica, jogador = null) {
    if (!tecnica) return null;
    tecnica = normalizarTecnica(tecnica);
    jogador = normalizarJogador(jogador);

    const descricaoExibir = tecnica.descricao_completa || tecnica.descricao || "Sem descrição disponível.";
    const tipoTec = tecnica.passiva ? "Passiva" : tecnica.tipo || "Ativa";
    const classe = tecnica.classe_nome || tecnica.classe || "Geral";
    const categoria = tecnica.categoria || tecnica.fonte || "Geral";
    const custoMana = tecnica.custo_mana || 0;
    const cooldown = tecnica.cooldown || 0;
    const nivel = tecnica.nivel_desbloqueio || 1;
    const rank = determinarRank(nivel);
    const elemento = determinarElemento(tecnica);
    
    // Custo em Maestria
    const custoMaestria = tecnica.custo_maestria || 0;
    const custoMaestriaFormatado = tecnica.custo_maestria_formatado || `${custoMaestria} de Maestria`;
    
    // Maestria do jogador
    const qiJogador = jogador ? (jogador.maestria || 0) : 0;
    const faltaMaestria = Math.max(0, custoMaestria - qiJogador);
    
    // Nível do jogador
    const nivelJogador = jogador ? (jogador.nivel || 1) : 1;
    const faltaNivel = Math.max(0, nivel - nivelJogador);

    let mensagem = `
♧┃Técnicas 𖥔 Solo Leveling
     ── ${classe} · ${tipoTec} ──
*${tecnica.nome}*
> ${descricaoExibir}

_─( ◆ )───── 𝗦𝗶𝘁𝘂𝗮𝗰̧𝗮̃𝗼_
*Status:* Disponível
*Custo:* ${custoMaestriaFormatado}
`;
    
    if (jogador) {
        mensagem += `*Sua Maestria:* ${qiJogador}\n`;
        mensagem += `*Falta:* ${faltaMaestria} de Maestria\n`;
    }

    // Benefícios
    const beneficios = tecnica.beneficios || tecnica.descricao_completa || tecnica.descricao || "Aumenta poder de combate.";
    mensagem += `
_─( ◆ )───── 𝗢 𝗤𝘂𝗲 𝗟𝗶𝗯𝗲𝗿𝗮_
> ${beneficios}
> *Custo de Mana:* ${custoMana} MP
`;

    // Cooldown se tiver
    if (cooldown > 0 && !tecnica.passiva) {
        mensagem += `> *Recarga:* ${cooldown} turno(s)\n`;
    }

    mensagem += `
_─( ◆ )───── 𝗗𝗲𝘁𝗮𝗹𝗵𝗲𝘀_
*Classe:* ${classe}
*Ranks:* ${rank}
*Elemento:* ${elemento}
*Custo de Mana:* ${custoMana} MP
`;

    if (tecnica.alcance) mensagem += `*Alcance:* ${tecnica.alcance}\n`;
    if (tecnica.area) mensagem += `*Área:* ${tecnica.area}\n`;
    if (tecnica.duracao) mensagem += `*Duração:* ${tecnica.duracao}\n`;

    // Requisitos
    mensagem += `
_─( ◆ )───── 𝗥𝗲𝗾𝘂𝗶𝘀𝗶𝘁𝗼𝘀_
`;
    if (tecnica.requisitos && tecnica.requisitos.length > 0) {
        tecnica.requisitos.forEach(req => {
            mensagem += `*• ${req}*\n`;
        });
    } else {
        mensagem += `*• Nível mínimo: ${nivel}*\n`;
    }
    
    if (jogador) {
        if (faltaNivel > 0) {
            mensagem += `*Faltando:* ${faltaNivel} níveis\n`;
        } else {
            mensagem += `*Nível atual:* ${nivelJogador} ✓\n`;
        }
    }

    // Limites
    mensagem += `
_─( ◆ )───── 𝗟𝗶𝗺𝗶𝘁𝗲𝘀_
> Dano calculado de acordo com o sistema de atributos.
`;
    if (tecnica.passiva) {
        mensagem += `> Efeito passivo: sempre ativo.\n`;
    }

    // UP (Evolução)
    mensagem += `
_─( ◆ )───── UP_
`;
    if (tecnica.evolucao && tecnica.evolucao.length > 0) {
        tecnica.evolucao.forEach(evo => {
            mensagem += `*Level ${evo.level}:* ${evo.descricao}\n`;
        });
    } else if (tecnica.levels) {
        mensagem += `*Sistema de evolução disponível.*\n`;
    } else {
        mensagem += `_Sistema de UP disponível via Tokens._\n`;
        mensagem += `_Alcance, menor custo de mana, etc._\n`;
    }

    // Ação
    const nomeParaComando = tecnica.nome.toLowerCase().replace(/[^a-záéíóúãõâêîôûàèìòùç0-9\s]/g, '').replace(/\s+/g, '_');
    mensagem += `
_─( ◆ )───── 𝗔𝗰̧𝗮̃𝗼_
!comprar tecnica ${nomeParaComando}
`;
    
    return mensagem;
}

module.exports = async (msg) => {
    try {
        const comando = msg.body.toLowerCase().trim();
        const numero = msg.author || msg.from;
        
        // Extrair o nome da técnica (remove !técnica)
        const args = comando.split(' ').slice(1);
        const nomeBusca = args.join(' ').trim();

        if (!nomeBusca) {
            return MessageService.send({ message: msg, text: `
*═ COMANDO !TÉCNICA*
──────────────────────────
*Uso correto:* \`!técnica nome da técnica\`

*Exemplos:*
\`!técnica ataque furtivo\`
\`!técnica emboscada fantasmagórica\`

*Ou use !técnicas para ver as categorias.*
` });
        }

        // Buscar dados do jogador
        const jogador = await new Promise((resolve) => {
            db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], (err, row) => {
                if (err) resolve(null);
                else resolve(row);
            });
        });

        // 1. Busca exata
        let tecnica = buscarTecnica(nomeBusca);

        // 2. Se não achou, tenta busca aproximada no banco de dados
        if (!tecnica) {
            const tecBanco = await new Promise((resolve) => {
                db.all(
                    `SELECT * FROM tecnicas WHERE LOWER(nome) LIKE ? ORDER BY 
                        CASE 
                            WHEN LOWER(nome) = ? THEN 0
                            WHEN LOWER(nome) LIKE ? THEN 1
                            ELSE 2
                        END 
                    LIMIT 1`,
                    [`%${nomeBusca}%`, nomeBusca, `${nomeBusca}%`],
                    (err, rows) => {
                        if (err) resolve(null);
                        else resolve(rows && rows.length > 0 ? rows[0] : null);
                    }
                );
            });

            if (tecBanco) {
                tecnica = tecBanco;
            }
        }

        // 3. Se ainda não achou, tenta busca aproximada nas classes
        if (!tecnica) {
            for (const [key, classe] of Object.entries(classesIniciais)) {
                if (classe.tecnicaInicial && classe.tecnicaInicial.nome.toLowerCase().includes(nomeBusca)) {
                    tecnica = { ...classe.tecnicaInicial, classe_nome: classe.nome, fonte: "Classe Inicial" };
                    break;
                }
                if (classe.tecnicas && Array.isArray(classe.tecnicas)) {
                    for (const tec of classe.tecnicas) {
                        if (tec.nome.toLowerCase().includes(nomeBusca)) {
                            tecnica = { ...tec, classe_nome: classe.nome, fonte: "Classe Inicial" };
                            break;
                        }
                    }
                    if (tecnica) break;
                }
            }
        }

        // 4. Se ainda não achou, busca aproximada nas avançadas
        if (!tecnica) {
            for (const [classe, tecs] of Object.entries(advancedTechniques)) {
                if (Array.isArray(tecs)) {
                    for (const tec of tecs) {
                        if (tec.nome.toLowerCase().includes(nomeBusca)) {
                            tecnica = { ...tec, classe_nome: classe, categoria: "Avançada", fonte: "Classe Avançada" };
                            break;
                        }
                    }
                    if (tecnica) break;
                }
            }
        }

        if (!tecnica) {
            return MessageService.send({ message: msg, text: `
*═ TÉCNICA NÃO ENCONTRADA*
──────────────────────────
_Nenhuma técnica encontrada para "${nomeBusca}"._

*Use !técnicas para navegar pelas categorias:*
🌱 \`!técnicas iniciais\`
⚔️ \`!técnicas de classe\`
🔰 \`!técnicas de proficiência\`
💎 \`!técnicas únicas\`
🔥 \`!técnicas de classe avançada\`
` });
        }

        const resposta = formatarFicha(tecnica, jogador);
        await MessageService.send({ message: msg, text: resposta });

    } catch (error) {
        console.error("Erro no comando !técnica:", error);
        return MessageService.send({ message: msg, text: `
*═ ERRO AO CARREGAR TÉCNICA*
──────────────────────────
_Ocorreu um erro ao buscar a técnica._
_Tente novamente._
        ` });
    }
};
