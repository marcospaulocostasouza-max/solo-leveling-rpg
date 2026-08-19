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
        await MessageService.send({ message: msg, text: `
*═══ CRIAÇÃO DE ITEM ÚNICO ═══*
══════════════════════════

Preencha o modelo abaixo e envie no grupo.
Depois de enviar a ficha preenchida, um ADM usa *!add item* para integrar.

══════════════════════════
*NOME:* [Nome do Item]
*DESCRIÇÃO:* [Descrição detalhada]
*CATEGORIA:* [Arma / Armadura / Escudo / Acessório / Consumível]
*SLOT:* [Cabeça / Corpo / Acessórios / Item de Apoio / Pernas / Pés / Arma 1 / Arma 2]
*TIER:* [E / D / C / B / A / S / Comum / Raro / Épico / Lendário / Único]
*FORÇA:* [Bônus numérico]
*RESISTÊNCIA:* [Bônus numérico]
*VELOCIDADE:* [Bônus numérico]
*SENTIDOS:* [Bônus numérico]
*INTELIGÊNCIA:* [Bônus numérico]
*PODER MÁGICO:* [Bônus numérico]
*EFEITO:* [Descrição do efeito especial]
*PERTENCENTE:* [Nome do Jogador]
══════════════════════════

*Exemplo:*
NOME: Espada do Dragão Negro
DESCRIÇÃO: Uma espada imbuída com a essência de um dragão ancião.
CATEGORIA: Arma
SLOT: Arma 1
TIER: Lendário
FORÇA: 25
RESISTÊNCIA: 10
VELOCIDADE: 15
SENTIDOS: 5
INTELIGÊNCIA: 0
PODER MÁGICO: 20
EFEITO: Causa dano extra de fogo
PERTENCENTE: Sung Jin Woo
        ` });
        return;
    }
};
