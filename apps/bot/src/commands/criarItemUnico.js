const MessageService = require("../core/messageService");

/**
 * SISTEMA DE CRIAÇÃO DE ITENS ÚNICOS
 * 
 * Comandos: !criar item único - Envia template para ADM preencher
 * 
 * Fluxo:
 * 1. ADM usa !criar item único → bot envia template
 * 2. ADM preenche o template com os dados do item
 * 3. O bot reconhece automaticamente e salva como pendente
 * 4. ADM usa !confirmar item único → bot cria o item e adiciona ao jogador
 */

const db = require("../core/database");
const adminCore = require("../core/adminCore");

module.exports = async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    const numero = msg.author || msg.from;
    
    // Verificar se é admin
    const admin = await adminCore.isAdmin(numero);
    if (!admin) {
        return MessageService.send({ message: msg, text: "*═══ ACESSO NEGADO ═══*\nVocê não tem permissão para usar este comando." });
    }
    
    // =====================================
    // !criar item único - Envia template
    // =====================================
    if (["!fitem", "!criar item único", "!criar item unico", "!criar item"].includes(texto)) {
        await MessageService.send({ message: msg, text: `*═══ FICHA DE ITEM PERSONALIZADO ═══*
──────────────────────────
_Preencha a ficha e envie no grupo. Depois, use *!add item* para integrar._

*─── Identidade do Item ───*
> NOME:
> DESCRIÇÃO:
> CATEGORIA: [Arma / Armadura / Escudo / Acessório / Consumível]
> SLOT: [Cabeça / Corpo / Acessórios / Item de Apoio / Pernas / Pés / Arma 1 / Arma 2]
> TIER: [E / D / C / B / A / S / Comum / Raro / Épico / Lendário / Único]

*─── Atributos ───*
> FORÇA: 0
> RESISTÊNCIA: 0
> VELOCIDADE: 0
> SENTIDOS: 0
> INTELIGÊNCIA: 0
> PODER MÁGICO: 0

*─── Propriedade Especial ───*
> EFEITO:
> PERTENCENTE: [Nome do Jogador ou Item Raro]

──────────────────────────
_Use *PERTENCENTE: Item Raro* para itens exclusivos de Banners e Conjuntos._
_Limite total de atributos por peça de Conjunto: Rank D 40 • C 80 • B 160 • A 500 • S sem limite._
_Títulos e Passivas agora possuem as fichas próprias *!Ftitulo* e *!Fpassiva*._` });
        return;
    }
};
