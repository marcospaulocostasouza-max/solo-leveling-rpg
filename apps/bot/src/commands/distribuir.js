const MessageService = require("../core/messageService");

/*
 * COMANDO: !distribuir
 * 
 * Sistema de distribuicao de pontos de atributo pos-criacao de ficha.
 * Jogadores distribuem pontos livres recebidos por level up.
 * 
 * Uso: !distribuir <quantidade> <atributo> [quantidade2 atributo2 ...]
 * Exemplo: !distribuir 3 forca 2 resistencia 1 inteligencia
 */

const db = require("../core/database");
const AtributoSystem = require("../systems/atributoSystem");

// Mapeamento de atributos (normalizado sem acento)
const ATRIBUTOS_MAP = {
    forca: "forca_base",
    resistencia: "resistencia_base",
    velocidade: "velocidade_base",
    sentidos: "sentidos_base",
    inteligencia: "inteligencia_base",
    "poder magico": "poder_magico_base",
    agilidade: "velocidade_base",
    "poder": "poder_magico_base"
};

// Função para normalizar texto (remover acentos e caracteres especiais)
function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^a-z0-9\s]/g, "") // Remove caracteres especiais
        .trim();
}

module.exports = async (msg) => {
    const numeroJogador = msg.author || msg.from;
    const textoCompleto = msg.body.trim();
    
    // Remover o comando base
    const args = textoCompleto.slice(11).trim().toLowerCase().split(/\s+/);
    
    // Se nao ha argumentos, mostrar status
    if (args.length === 0 || args[0] === "") {
        return exibirStatusDistribuicao(msg, numeroJogador);
    }
    
    // Validar entrada: formato !distribuir <quantidade> <atributo> [quantidade2 atributo2 ...]
    if (args.length < 2 || args.length % 2 !== 0) {
        return MessageService.send({ message: msg, text: `*═══ FORMATO INVÁLIDO ═══*
──────────────────────────

*Uso correto:*
> !distribuir <quantidade> <atributo> [quantidade2 atributo2 ...]

*Exemplo:*
> !distribuir 3 forca 2 resistencia 1 inteligencia

*─── Atributos Disponíveis ───*
> • Força
> • Resistência
> • Velocidade / Agilidade
> • Sentidos
> • Inteligência
> • Poder Mágico / Poder` });
    }
    
    // Buscar jogador
    const jogador = await new Promise((resolve, reject) => {
        db.get(`SELECT * FROM jogadores WHERE numero = ?`, [numeroJogador], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    
    if (!jogador) {
        return MessageService.send({ message: msg, text: "*✖ Você precisa criar uma ficha primeiro!*\n_Use !ficha_" });
    }
    
    // Verificar se a ficha foi aprovada
    if (!jogador.ficha_aprovada) {
        return MessageService.send({ message: msg, text: `*✖ FICHA NÃO APROVADA ═══*
──────────────────────────

Sua ficha ainda não foi aprovada por um Administrador.
Aguarde a aprovação para poder distribuir seus atributos.

*─── Status Atual ───*
> Ficha enviada: ${jogador.ficha_enviada ? "Sim" : "Não"}
> Ficha confirmada: ${jogador.ficha_confirmada ? "Sim" : "Não"}
> Ficha aprovada: ${jogador.ficha_aprovada ? "Sim" : "Não"}

_Após a aprovação, use !jogador para ver seus pontos disponíveis._` });
    }
    
    const pontosDisponiveis = jogador.pontos_atributo || 0;
    
    if (pontosDisponiveis <= 0) {
        return MessageService.send({ message: msg, text: "*✖ Você não tem pontos de atributo disponíveis para distribuir!*" });
    }
    
    // Processar distribuicao (formato: !distribuir <quantidade> <atributo> ou !distribuir <atributo> <quantidade>)
    const alteracoes = {};
    let pontosRequisitados = 0;
    let erros = [];
    
    // Detectar formato: se o primeiro argumento é um número, é formato quantidade primeiro
    // Se o primeiro argumento é texto, é formato atributo primeiro
    const primeiroEhNumero = !isNaN(parseInt(args[0]));
    
    for (let i = 0; i < args.length; i++) {
        let quantidade, atributo;
        
        if (primeiroEhNumero) {
            // Formato: quantidade primeiro (!distribuir 2 forca)
            quantidade = parseInt(args[i]);
            atributo = args[i + 1];
            i++; // Pular o próximo (atributo)
        } else {
            // Formato: atributo primeiro (!distribuir forca 2)
            atributo = args[i];
            quantidade = parseInt(args[i + 1]);
            i++; // Pular o próximo (quantidade)
        }
        
        // Validar quantidade
        if (isNaN(quantidade) || quantidade <= 0) {
            erros.push(`Quantidade invalida para ${atributo}: ${quantidade}`);
            continue;
        }
        
        if (quantidade > pontosDisponiveis) {
            erros.push(`Pontos insuficientes para ${atributo}: requisitado ${quantidade}, disponivel ${pontosDisponiveis}`);
            continue;
        }
        
        // Validar atributo (normalizar para remover acentos)
        const atributoNormalizado = normalizarTexto(atributo);
        const coluna = ATRIBUTOS_MAP[atributoNormalizado];
        if (!coluna) {
            erros.push(`Atributo nao reconhecido: ${atributo}. Use: forca, resistencia, velocidade, sentidos, inteligencia, poder magico, agilidade ou poder`);
            continue;
        }
        
        alteracoes[coluna] = quantidade;
        pontosRequisitados += quantidade;
    }
    
    if (erros.length > 0) {
        return MessageService.send({ message: msg, text: `*═══ Erros encontrados: ═══*\n\n${erros.map(e => "> " + e).join("\n")}` });
    }
    
    if (pontosRequisitados > pontosDisponiveis) {
        return MessageService.send({ message: msg, text: `*═══ Total de pontos requisitados (${pontosRequisitados}) excede os disponiveis (${pontosDisponiveis})! ═══*` });
    }
    
    // Aplicar alteracoes
    let query = `UPDATE jogadores SET pontos_atributo = ?`;
    const params = [pontosDisponiveis - pontosRequisitados];
    
    for (const [coluna, valor] of Object.entries(alteracoes)) {
        query += `, ${coluna} = ${coluna} + ?`;
        params.push(valor);
    }
    
    query += ` WHERE numero = ?`;
    params.push(numeroJogador);
    
    await new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
    
    // Recalcular TODOS os atributos automaticamente (inclui bônus de classe 50%)
    await AtributoSystem.recalcularAtributos(jogador.id);
    
    // Buscar novos valores
    const jogadorAtualizado = await new Promise((resolve, reject) => {
        db.get(`SELECT * FROM jogadores WHERE numero = ?`, [numeroJogador], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    
    // Confirmar sucesso
    const resumoAlteracoes = Object.entries(alteracoes)
        .map(([coluna, qtd]) => {
            const nomeAtributo = Object.keys(ATRIBUTOS_MAP).find(k => ATRIBUTOS_MAP[k] === coluna);
            return `• ${nomeAtributo}: +${qtd}`;
        })
        .join("\n");
    
    await MessageService.send({ message: msg, text: `
*═══ ATRIBUTOS DISTRIBUIDOS COM SUCESSO! ═══*

*────────────────────────══ RESUMO ────────────────────────══*
Pontos utilizados: ${pontosRequisitados}
Pontos restantes: ${pontosDisponiveis - pontosRequisitados}

*═══ Alteracoes: ═══*
${resumoAlteracoes}

*═══ Novos Valores: ═══*
Forca: ${jogadorAtualizado.forca_base}
Resistencia: ${jogadorAtualizado.resistencia_base}
Velocidade: ${jogadorAtualizado.velocidade_base}
Sentidos: ${jogadorAtualizado.sentidos_base}
Inteligencia: ${jogadorAtualizado.inteligencia_base}
Poder Magico: ${jogadorAtualizado.poder_magico_base}

*═══ Todos os atributos derivados foram recalculados automaticamente. ═══*
` });
};

// =====================================
// FUNCOES AUXILIARES
// =====================================

function exibirStatusDistribuicao(msg, numeroJogador) {
    new Promise((resolve, reject) => {
        db.get(`SELECT * FROM jogadores WHERE numero = ?`, [numeroJogador], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    }).then(jogador => {
        if (!jogador) {
            return MessageService.send({ message: msg, text: "*═══ Voce precisa criar uma ficha primeiro! ═══* Use !ficha" });
        }
        
        const pontosNaoDistribuidos = jogador.pontos_atributo || 0;
        
        const atributos = {
            "Forca": jogador.forca_base || 0,
            "Resistencia": jogador.resistencia_base || 0,
            "Velocidade": jogador.velocidade_base || 0,
            "Sentidos": jogador.sentidos_base || 0,
            "Inteligencia": jogador.inteligencia_base || 0,
            "Poder Magico": jogador.poder_magico_base || 0
        };
        
        MessageService.send({ message: msg, text: `
*────────────────────────══ DISTRIBUICAO DE ATRIBUTOS ────────────────────────══*

Jogador: ${jogador.nome || "Sem nome"}
Pontos Disponiveis: ${pontosNaoDistribuidos}

*────────────────────────══ ATRIBUTOS ATUAIS ────────────────────────══*
${Object.entries(atributos).map(([nome, valor]) => `${nome}: ${valor}`).join("\n")}

*────────────────────────══ COMO DISTRIBUIR ────────────────────────══*
Digite no formato:
*!*distribuir <quantidade> <atributo> [quantidade2 atributo2 ...]

Exemplo:
*!*distribuir 3 forca 2 resistencia 1 inteligencia

*Atributos validos:*
Forca / Resistencia / Velocidade (ou Agilidade)
Sentidos / Inteligencia / Poder Magico (ou Poder)

_═ A cada Level Up: +3 pontos de atributo_
_Pontos ficam armazenados ate serem distribuidos_
_Todos os calculos sao atualizados automaticamente_
` });
    }).catch(err => {
        MessageService.send({ message: msg, text: "*═══ Erro ao buscar dados do jogador. ═══*" });
        console.error("Erro em distribuir.js:", err);
    });
}

