const MessageService = require("../core/messageService");

/**
 * COMANDO: !Slot de Cabeça <Rank>, !Arma 1 <Rank>, etc.
 * 
 * Exibe todos os itens de uma categoria e rank específicos.
 * Exemplos: !Slot de Cabeça E, !Arma 1 D, !Itens de Apoio C
 */

const db = require("../core/database");
const { getItensLoja, ITENS_LOJA } = require("../utils/lojaItens");

// Função para normalizar categoria (remover acentos e converter para lowercase)
function normalizarCategoria(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .trim();
}

module.exports = async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    const numero = msg.author || msg.from;
    
    // Buscar jogador
    const jogador = await new Promise((resolve) => {
        db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], (err, row) => {
            resolve(row);
        });
    });
    
    if (!jogador) {
        return MessageService.send({ message: msg, text: "*✖ Você precisa ter uma ficha aprovada primeiro.*" });
    }
    
    // Extrair categoria e rank do comando
    // Formato: "!slot de cabeça e" ou "!arma 1 d"
    const partes = texto.split(" ");
    
    // Encontrar o rank (última parte deve ser uma letra)
    const rank = partes[partes.length - 1].toUpperCase();
    
    // Verificar se o rank é válido
    const ranksValidos = ["E", "D", "C", "B", "A", "S"];
    if (!ranksValidos.includes(rank)) {
        return MessageService.send({ message: msg, text: `
*✖ RANK INVÁLIDO*

Use: !<Categoria> <Rank>

*Exemplos:*
!Slot de Cabeça E
!Arma 1 D
!Itens de Apoio C

*Ranks válidos:* E, D, C, B, A, S
_Use !abrir loja para ver as categorias disponíveis._
        ` });
    }
    
    // Extrair categoria (remover "!" e pegar tudo até o rank)
    const categoria = partes.slice(0, -1).join(" ").replace("!", "").trim();
    
    if (!categoria) {
        return MessageService.send({ message: msg, text: "*✖ Especifique a categoria.*\n_Use !abrir loja para ver as opções._" });
    }
    
    // Buscar itens (normalizar categoria para comparar)
    const itens = getItensLoja(categoria, rank);
    
    console.log(`[VERLOJA] Categoria recebida: "${categoria}"`);
    console.log(`[VERLOJA] Rank: "${rank}"`);
    console.log(`[VERLOJA] Itens encontrados (busca direta): ${itens.length}`);
    
    // Se não encontrou, tentar buscar com normalização
    if (itens.length === 0) {
        const categoriaNormalizada = normalizarCategoria(categoria);
        console.log(`[VERLOJA] Categoria normalizada: "${categoriaNormalizada}"`);
        
        const itensRank = ITENS_LOJA[rank];
        console.log(`[VERLOJA] Categorias disponíveis para rank ${rank}:`, itensRank ? Object.keys(itensRank).join(", ") : "Nenhuma");
        
        if (itensRank) {
            const categoriaEncontrada = Object.keys(itensRank).find(
                cat => normalizarCategoria(cat) === categoriaNormalizada
            );
            console.log(`[VERLOJA] Categoria encontrada após normalização: "${categoriaEncontrada}"`);
            
            if (categoriaEncontrada) {
                const itensFinal = itensRank[categoriaEncontrada];
                return exibirItens(msg, categoriaEncontrada, rank, itensFinal);
            }
        }
    }
    
    if (itens.length === 0) {
        return MessageService.send({ message: msg, text: `
*✖ CATEGORIA NÃO ENCONTRADA*

Categoria: ${categoria}
Rank: ${rank}

_Verifique se a categoria existe para este rank._
_Use !abrir loja para ver as opções disponíveis._
        ` });
    }
    
    // Montar mensagem
    let mensagem = `*═══ ${categoria.toUpperCase()} — RANK ${rank} ═══*\n`;
    mensagem += `──────────────────────────\n\n`;
    
    itens.forEach((item, index) => {
        mensagem += `*${index + 1}. ${item.nome}*\n`;
        mensagem += `> *Bônus:* ${item.bonus}\n`;
        mensagem += `> *Preço:* ${item.preco.toLocaleString()} Won\n`;
        mensagem += `> *Descrição:* ${item.descricao}\n\n`;
    });
    
    mensagem += `──────────────────────────\n`;
    mensagem += `> *Total:* ${itens.length} item(ns)\n`;
    mensagem += `_Use !comprar <nome do item> para comprar._`;
    
    await MessageService.send({ message: msg, text: mensagem });
};

// Função auxiliar para exibir itens
function exibirItens(msg, categoria, rank, itens) {
    let mensagem = `*═══ ${categoria.toUpperCase()} — RANK ${rank} ═══*\n`;
    mensagem += `──────────────────────────\n\n`;
    
    itens.forEach((item, index) => {
        mensagem += `*${index + 1}. ${item.nome}*\n`;
        mensagem += `> *Bônus:* ${item.bonus}\n`;
        mensagem += `> *Preço:* ${item.preco.toLocaleString()} Won\n`;
        mensagem += `> *Descrição:* ${item.descricao}\n\n`;
    });
    
    mensagem += `──────────────────────────\n`;
    mensagem += `> *Total:* ${itens.length} item(ns)\n`;
    mensagem += `_Use !comprar <nome do item> para comprar._`;
    
    return MessageService.send({ message: msg, text: mensagem });
}
