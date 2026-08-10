const MessageService = require("../core/messageService");

/**
 * MESSAGE SPLITTER - Divisão Inteligente de Mensagens
 *
 * Responsável por dividir mensagens longas em múltiplas partes
 * preservando a integridade da narrativa.
 *
 * Regras de divisão:
 * - Dividir apenas em pontos naturais (fim de parágrafo, ação, diálogo)
 * - Nunca dividir uma frase ao meio
 * - Nunca dividir uma ação no meio
 * - Nunca dividir um diálogo no meio
 * - Cada parte deve continuar exatamente de onde a anterior terminou
 *
 * Também implementa validação de integridade para garantir
 * que toda a resposta foi enviada corretamente.
 */

// Limite de caracteres do WhatsApp (com margem de segurança)
const LIMITE_WHATSAPP = 65000; // WhatsApp suporta ~65536, usamos 65000 para segurança

// Limite recomendado para melhor legibilidade (mensagens muito longas são difíceis de ler)
const LIMITE_RECOMENDADO = 3000;

/**
 * Divide uma mensagem longa em múltiplas partes preservando a narrativa.
 *
 * @param {string} mensagem - Mensagem completa a ser dividida
 * @param {number} limite - Limite máximo de caracteres por parte (padrão: 3000)
 * @returns {string[]} Array de partes da mensagem
 */
function dividirMensagem(mensagem, limite = LIMITE_RECOMENDADO) {
    if (!mensagem || typeof mensagem !== 'string') {
        return [];
    }

    const texto = mensagem.trim();

    // Se a mensagem está dentro do limite, retornar como única parte
    if (texto.length <= limite) {
        return [texto];
    }

    const partes = [];
    let posicaoAtual = 0;

    while (posicaoAtual < texto.length) {
        // Se o restante cabe no limite, adicionar e terminar
        const restante = texto.length - posicaoAtual;
        if (restante <= limite) {
            partes.push(texto.slice(posicaoAtual).trim());
            break;
        }

        // Buscar o melhor ponto de divisão dentro do limite
        const trecho = texto.slice(posicaoAtual, posicaoAtual + limite);
        let pontoDivisao = encontrarPontoDivisao(trecho, texto, posicaoAtual, limite);

        if (pontoDivisao === -1) {
            // Não encontrou ponto natural, forçar divisão no limite
            pontoDivisao = limite;
            console.warn('[MessageSplitter] Divisão forçada - nenhum ponto natural encontrado');
        }

        const parte = texto.slice(posicaoAtual, posicaoAtual + pontoDivisao).trim();
        if (parte.length > 0) {
            partes.push(parte);
        }

        posicaoAtual += pontoDivisao;

        // Pular espaços em branco e quebras de linha após o ponto de divisão
        while (posicaoAtual < texto.length && /\s/.test(texto[posicaoAtual])) {
            posicaoAtual++;
        }
    }

    return partes.filter(p => p.length > 0);
}

/**
 * Encontra o melhor ponto para dividir a mensagem.
 * Prioriza divisões em pontos naturais:
 * 1. Fim de parágrafo (linha vazia)
 * 2. Fim de narrativa (_..._)
 * 3. Fim de diálogo (*...*)
 * 4. Fim de linha com pontuação
 * 5. Fim de linha simples
 *
 * @param {string} trecho - Trecho de texto até o limite
 * @param {string} textoCompleto - Texto completo
 * @param {number} inicio - Posição inicial do trecho
 * @param {number} limite - Limite de caracteres
 * @returns {number} Posição relativa para dividir (ou -1 se não encontrar)
 */
function encontrarPontoDivisao(trecho, textoCompleto, inicio, limite) {
    // 1. Procurar fim de parágrafo (linha vazia ou \n\n) - melhor opção
    let melhorPos = -1;

    // Buscar de trás para frente para encontrar o último ponto natural
    for (let i = trecho.length - 1; i >= 0; i--) {
        const char = trecho[i];

        // Fim de parágrafo (\n\n)
        if (char === '\n' && i > 0 && trecho[i - 1] === '\n') {
            return i + 1;
        }

        // Fim de narrativa (_..._) - procurar o _ de fechamento
        if (char === '_' && i > 0) {
            // Verificar se é um _ de fechamento (não de abertura)
            const antes = trecho.slice(0, i);
            const underscoreAbertura = (antes.match(/_/g) || []).length;
            if (underscoreAbertura % 2 === 1) {
                // É um _ de fechamento
                // Procurar próxima quebra de linha após este _
                for (let j = i + 1; j < trecho.length; j++) {
                    if (trecho[j] === '\n') {
                        return j + 1;
                    }
                }
                return i + 1;
            }
        }

        // Fim de diálogo (*...*) - procurar o * de fechamento
        if (char === '*' && i > 0) {
            const antes = trecho.slice(0, i);
            const asteriscoAbertura = (antes.match(/\*/g) || []).length;
            if (asteriscoAbertura % 2 === 1) {
                // É um * de fechamento
                for (let j = i + 1; j < trecho.length; j++) {
                    if (trecho[j] === '\n') {
                        return j + 1;
                    }
                }
                return i + 1;
            }
        }

        // Fim de linha com pontuação (. ! ?)
        if (char === '\n' && i > 0) {
            const linhaAnterior = trecho.slice(0, i).split('\n').pop();
            if (/[.!?…]$/.test(linhaAnterior.trim())) {
                if (melhorPos === -1) {
                    melhorPos = i + 1;
                }
            }
        }
    }

    // 2. Se não encontrou \n\n, usar o melhor fim de linha com pontuação
    if (melhorPos !== -1) {
        return melhorPos;
    }

    // 3. Procurar qualquer quebra de linha
    for (let i = trecho.length - 1; i >= 0; i--) {
        if (trecho[i] === '\n') {
            return i + 1;
        }
    }

    // 4. Procurar pontuação seguida de espaço
    for (let i = trecho.length - 1; i >= 0; i--) {
        if (/[.!?…]/.test(trecho[i]) && i + 1 < trecho.length && /\s/.test(trecho[i + 1])) {
            return i + 1;
        }
    }

    // 5. Procurar qualquer espaço (último recurso)
    for (let i = trecho.length - 1; i >= 0; i--) {
        if (/\s/.test(trecho[i])) {
            return i + 1;
        }
    }

    return -1;
}

/**
 * Valida a integridade da mensagem enviada.
 * Compara a resposta original com as partes enviadas e verifica
 * se todo o conteúdo foi preservado.
 *
 * @param {string} respostaOriginal - Resposta completa gerada pela IA
 * @param {string[]} partesEnviadas - Array de partes que foram enviadas
 * @returns {Object} Resultado da validação { valida: boolean, diferenca: string, detalhes: string }
 */
function validarIntegridade(respostaOriginal, partesEnviadas) {
    if (!respostaOriginal) {
        return {
            valida: false,
            diferenca: 'Resposta original vazia',
            detalhes: 'A resposta gerada pela IA estava vazia.'
        };
    }

    if (!partesEnviadas || partesEnviadas.length === 0) {
        return {
            valida: false,
            diferenca: 'Nenhuma parte foi enviada',
            detalhes: 'O array de partes enviadas está vazio.'
        };
    }

    // Reconstruir a mensagem a partir das partes
    const mensagemReconstruida = partesEnviadas.join('\n').trim();
    const originalTrim = respostaOriginal.trim();

    // Remover espaços extras para comparação
    const normalizar = (texto) => texto.replace(/\s+/g, ' ').trim();
    const originalNormalizada = normalizar(originalTrim);
    const reconstruidaNormalizada = normalizar(mensagemReconstruida);

    if (originalNormalizada === reconstruidaNormalizada) {
        return {
            valida: true,
            diferenca: '',
            detalhes: `Integridade confirmada: ${partesEnviadas.length} parte(s) enviada(s), ${originalTrim.length} caracteres preservados.`
        };
    }

    // Calcular a diferença
    const tamanhoOriginal = originalNormalizada.length;
    const tamanhoReconstruido = reconstruidaNormalizada.length;
    const diferenca = Math.abs(tamanhoOriginal - tamanhoReconstruido);

    // Identificar onde ocorreu a perda
    let detalhes = '';
    if (tamanhoReconstruido < tamanhoOriginal) {
        detalhes = `Perda de conteúdo detectada: ${diferenca} caracteres perdidos. `;
        detalhes += `Original: ${tamanhoOriginal} chars, Reconstruído: ${tamanhoReconstruido} chars. `;

        // Tentar identificar onde a perda ocorreu
        for (let i = 0; i < Math.min(originalNormalizada.length, reconstruidaNormalizada.length); i++) {
            if (originalNormalizada[i] !== reconstruidaNormalizada[i]) {
                const contexto = originalNormalizada.slice(Math.max(0, i - 20), i + 20);
                detalhes += `Primeira divergência na posição ${i}: "...${contexto}..."`;
                break;
            }
        }
    } else {
        detalhes = `Conteúdo extra detectado: ${diferenca} caracteres adicionais. `;
        detalhes += `Original: ${tamanhoOriginal} chars, Reconstruído: ${tamanhoReconstruido} chars.`;
    }

    return {
        valida: false,
        diferenca: `${diferenca} caracteres`,
        detalhes: detalhes
    };
}

/**
 * Envia uma mensagem (possivelmente dividida em partes) via WhatsApp.
 * Implementa validação de integridade automática.
 *
 * @param {Object} msg - Objeto de mensagem do WhatsApp
 * @param {string} resposta - Resposta completa a ser enviada
 * @param {Object} opcoes - Opções { limite: number, delay: number }
 * @returns {Promise<Object>} Resultado do envio { sucesso: boolean, partes: number, validacao: Object }
 */
async function enviarMensagemCompleta(msg, resposta, opcoes = {}) {
    const limite = opcoes.limite || LIMITE_RECOMENDADO;
    const delay = opcoes.delay || 500; // Delay entre partes (ms)

    if (!resposta || typeof resposta !== 'string') {
        console.error('[MessageSplitter] Resposta inválida:', typeof resposta);
        await MessageService.send({ message: msg, text: 'Erro: resposta inválida.' });
        return { sucesso: false, partes: 0, validacao: { valida: false } };
    }

    console.log(`[MessageSplitter] Resposta original: ${resposta.length} caracteres`);

    // Dividir a mensagem em partes
    const partes = dividirMensagem(resposta, limite);

    console.log(`[MessageSplitter] Dividida em ${partes.length} parte(s)`);

    if (partes.length === 0) {
        console.error('[MessageSplitter] Nenhuma parte gerada após divisão');
        await MessageService.send({ message: msg, text: 'Erro: não foi possível processar a resposta.' });
        return { sucesso: false, partes: 0, validacao: { valida: false } };
    }

    // Enviar cada parte
    const partesEnviadas = [];
    for (let i = 0; i < partes.length; i++) {
        const parte = partes[i];

        try {
            // Log de cada parte
            console.log(`[MessageSplitter] Enviando parte ${i + 1}/${partes.length}: ${parte.length} caracteres`);

            if (i === 0) {
                // Primeira parte: usar reply
                await MessageService.send({ message: msg, text: parte });
            } else {
                // Partes seguintes: usar sendMessage com delay
                if (delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                await MessageService.send({ message: msg, text: parte });
            }

            partesEnviadas.push(parte);
        } catch (erro) {
            console.error(`[MessageSplitter] Erro ao enviar parte ${i + 1}:`, erro.message);
            return {
                sucesso: false,
                partes: i,
                validacao: { valida: false, detalhes: `Erro ao enviar parte ${i + 1}: ${erro.message}` }
            };
        }
    }

    // Validar integridade
    const validacao = validarIntegridade(resposta, partesEnviadas);

    if (validacao.valida) {
        console.log(`[MessageSplitter] ✅ Integridade confirmada: ${partesEnviadas.length} partes, ${resposta.length} chars`);
    } else {
        console.error(`[MessageSplitter] ❌ FALHA DE INTEGRIDADE: ${validacao.detalhes}`);
    }

    return {
        sucesso: validacao.valida,
        partes: partesEnviadas.length,
        validacao: validacao
    };
}

// =====================================
// EXPORTAÇÕES
// =====================================

module.exports = {
    dividirMensagem,
    validarIntegridade,
    enviarMensagemCompleta,
    encontrarPontoDivisao,
    LIMITE_WHATSAPP,
    LIMITE_RECOMENDADO
};