const MessageService = require("../core/messageService");

/**
 * RECONHECEDOR DE FICHA DE MATERIAIS
 * 
 * Processa a ficha de materiais preenchida pelo jogador durante
 * a sessão de forja com o Vysache.
 * 
 * Quando o jogador envia uma ficha de materiais (não é um comando),
 * este módulo verifica se há uma sessão ativa do Vysache e processa
 * os materiais para encontrar combinações possíveis.
 */

const ForjaSystem = require("../systems/forjaSystem");
const JogadorCore = require("../core/jogadorCore");
const EconomySystem = require("../systems/economySystem");
const templates = require("./templatesMensagens");

// Referência às sessões do Vysache (será carregada dinamicamente)
let sessoesVysache = null;

function getSessoesVysache() {
    if (!sessoesVysache) {
        try {
            const vysacheModule = require("../commands/vysache");
            sessoesVysache = vysacheModule.sessoesVysache;
        } catch (e) {
            sessoesVysache = {};
        }
    }
    return sessoesVysache;
}

/**
 * Verifica se o texto parece uma ficha de materiais
 */
function pareceFichaMateriais(texto) {
    const textoLower = texto.toLowerCase();
    return textoLower.includes("material:") && textoLower.includes("quantidade:");
}

/**
 * Processa a ficha de materiais enviada pelo jogador
 */
async function processarFichaMateriais(msg) {
    const numero = msg.author || msg.from;
    const texto = msg.body;

    // Verificar se há sessão ativa do Vysache
    const sessoes = getSessoesVysache();
    const sessao = sessoes[numero];

    if (!sessao || sessao.etapa !== "aguardando_materiais") {
        return false;
    }

    // Verificar se parece uma ficha de materiais
    if (!pareceFichaMateriais(texto)) {
        return false;
    }

    // Buscar jogador
    const jogador = await JogadorCore.buscarPorNumero(numero);
    if (!jogador) {
        return false;
    }

    // Analisar os materiais
    const analise = ForjaSystem.analisarMateriais(texto);

    if (analise.erro) {
        await MessageService.send({ message: msg, text: `*Vysache:* "${analise.erro}"` });
        return true;
    }

    // Materiais válidos mas sem combinação
    if (!analise.sucesso) {
        await MessageService.send({ message: msg, text: `*Vysache:* "${analise.erro || "Não consegui encontrar uma combinação com esses materiais."}"` });
        return true;
    }

    // Combinações encontradas!
    const combinacoes = analise.combinacoes;

    // Se houver apenas uma combinação, usar ela
    // Se houver múltiplas, Vysache escolhe a melhor (ou a primeira)
    let combinacaoEscolhida;

    if (combinacoes.length === 1) {
        combinacaoEscolhida = combinacoes[0];
    } else {
        // Vysache escolhe a combinação de maior rank disponível
        const ordemRanks = ["S", "A", "B", "C", "D", "E"];
        for (const rank of ordemRanks) {
            const comb = combinacoes.find(c => c.rank === rank);
            if (comb) {
                combinacaoEscolhida = comb;
                break;
            }
        }
        if (!combinacaoEscolhida) {
            combinacaoEscolhida = combinacoes[0];
        }
    }

    // Calcular custo final com desconto de afinidade
    const afinidadeInfo = await ForjaSystem.getAfinidade(jogador.id, "Vysache");
    const custoFinal = ForjaSystem.calcularCustoFinal(combinacaoEscolhida.custo, afinidadeInfo.afinidade);

    // Salvar combinação na sessão
    await ForjaSystem.atualizarSessao(sessao.jogadorId, {
        etapa: "aguardando_confirmacao",
        materiais: JSON.stringify(analise.materiais_recebidos),
        combinacao_resultado: JSON.stringify(combinacaoEscolhida),
        custo: custoFinal
    });

    // Atualizar sessão em memória
    sessoes[numero].etapa = "aguardando_confirmacao";

    // Construir mensagem de resposta do Vysache
    let mensagem = `*Vysache:* "Hmmm, deixe-me ver..."\n\n`;
    mensagem += `${templates.divisor()}\n`;
    mensagem += `*ANÁLISE DOS MATERIAIS*\n\n`;
    mensagem += `> *Materiais informados:*\n`;
    for (const [material, qtd] of Object.entries(analise.materiais_recebidos)) {
        mensagem += `  - ${material}: ${qtd}\n`;
    }
    mensagem += `\n`;

    // Mostrar todas as combinações possíveis
    if (combinacoes.length > 1) {
        mensagem += `> *Combinações possíveis:*\n`;
        combinacoes.forEach((c, i) => {
            const mats = Object.entries(c.materiais_necessarios)
                .map(([m, q]) => `${m} x${q}`)
                .join(", ");
            mensagem += `  ${i + 1}. *${c.itemCatalogo ? c.itemCatalogo.nome : c.categoria}* [${c.rank}] (${mats})\n`;
        });
        mensagem += `\n`;
    }

    mensagem += `${templates.divisor()}\n`;
    mensagem += `*COMBINAÇÃO ESCOLHIDA POR VYSACHE*\n`;

    // Se veio do catálogo, mostrar o item específico com atributos +30%
    if (combinacaoEscolhida.itemCatalogo) {
        const itemCat = combinacaoEscolhida.itemCatalogo;
        const bonusVysache = 1.3;

        mensagem += `> *Item:* ${itemCat.nome}\n`;
        mensagem += `> *Slot:* ${itemCat.slot}\n`;
        mensagem += `> *Rank:* ${itemCat.rank}\n`;
        mensagem += `> *Descrição:* ${itemCat.descricao}\n`;
        mensagem += `${templates.divisor()}\n`;
        mensagem += `*ATRIBUTOS (com +30% do Vysache):*\n`;
        mensagem += `> ${itemCat.atributo1}: +${Math.floor(itemCat.valor1 * bonusVysache)}`;
        if (itemCat.atributo2 && itemCat.valor2) {
            mensagem += ` | ${itemCat.atributo2}: +${Math.floor(itemCat.valor2 * bonusVysache)}`;
        }
        mensagem += `\n`;
        mensagem += `> _Bônus de +30% aplicado por Vysache_\n`;
    } else {
        mensagem += `> *Rank:* ${combinacaoEscolhida.rank}\n`;
        mensagem += `> *Categoria:* ${combinacaoEscolhida.categoria}\n`;
        mensagem += `> *Descrição:* ${combinacaoEscolhida.descricao}\n`;
    }

    mensagem += `${templates.divisor()}\n`;
    mensagem += `> *Custo da forja:* ${custoFinal} Wons`;

    if (afinidadeInfo.afinidade > 0) {
        const desconto = Math.floor((afinidadeInfo.afinidade / 100) * 30);
        if (desconto > 0) {
            mensagem += ` (Desconto de ${desconto}% por afinidade)\n`;
        }
    }

    const saldo = await EconomySystem.getSaldo(jogador.id);
    mensagem += `\n> *Seu saldo:* ${saldo} Wons\n`;
    mensagem += `> *Conferência:* os materiais serão validados e consumidos do seu inventário ao confirmar.\n`;
    mensagem += `${templates.divisor()}\n\n`;
    mensagem += `*Vysache:* "Posso produzir este item para você. Posso prosseguir?"\n\n`;
    mensagem += `> Responda *!pode sim* para confirmar a forja.\n`;
    mensagem += `> Use *!Olá Vysache* para cancelar e recomeçar.`;

    await MessageService.send({ message: msg, text: mensagem });
    return true;
}

module.exports = { processarFichaMateriais, pareceFichaMateriais };
