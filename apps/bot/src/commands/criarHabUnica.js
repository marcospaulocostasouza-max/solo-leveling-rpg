const MessageService = require("../core/messageService");

/**
 * SISTEMA DE CRIAÇÃO DE HABILIDADES ÚNICAS
 * 
 * Comandos: !criar hab única - Envia template para ADM preencher
 *           !confirmar hab única - Processa o template preenchido
 * 
 * Fluxo:
 * 1. ADM usa !criar hab única → bot envia template
 * 2. ADM preenche o template com os dados da habilidade
 * 3. ADM usa !confirmar hab única → bot reconhece e cria a técnica
 * 4. A técnica é adicionada ao jogador informado em "Pertencente"
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
    // !criar hab única - Envia template
    // =====================================
    if (["!ftécnica", "!ftecnica", "!criar hab única", "!criar hab unica", "!criar habilidade única", "!criar habilidade unica"].includes(texto)) {
        await MessageService.send({ message: msg, text: `
*═══ FICHA DE TÉCNICA PERSONALIZADA ═══*
══════════════════════════

Preencha o modelo abaixo e envie no grupo.
Depois de enviar a ficha preenchida, um ADM usa *!add técnica* para integrar.

══════════════════════════
*NOME:* [Nome da Técnica]
*DESCRIÇÃO:* [Descrição detalhada]
*CUSTO DE MANA:* [Número]
*COOLDOWN:* [Número em turnos]
*TIPO:* [Ativa / Passiva]
*CATEGORIA:* [Física / Mágica / Suporte]
*CLASSE:* [Classe específica ou "Geral"]
*RANK:* [E / D / C / B / A / S]
*NÍVEL DE DESBLOQUEIO:* [Número]
*PERTENCENTE:* [Nome do Jogador]
══════════════════════════

*Exemplo:*
NOME: Lâmina Sombria
DESCRIÇÃO: Invoca uma lâmina de sombra que causa dano sombrio.
CUSTO DE MANA: 30
COOLDOWN: 3
TIPO: Ativa
CATEGORIA: Física
CLASSE: Geral
RANK: B
NÍVEL DE DESBLOQUEIO: 1
PERTENCENTE: Sung Jin Woo
        ` });
        return;
    }
    
    // =====================================
    // !confirmar hab única - Processa template
    // =====================================
    if (texto === "!confirmar hab única" || texto === "!confirmar hab unica" || texto === "!confirmar habilidade única" || texto === "!confirmar habilidade unica") {
        return MessageService.send({ message: msg, text: `
*═══ USO INCORRETO ═══*
Use *!confirmar hab única* APÓS enviar o template preenchido.

*Formato:*
1. Primeiro envie o template preenchido no grupo
2. Depois use *!confirmar hab única* para processar

_O bot reconhecerá automaticamente o último template enviado._
        ` });
    }
    
    // =====================================
    // RECONHECER TEMPLATE DE HABILIDADE ÚNICA
    // =====================================
    // Se a mensagem contém os campos do template, salvar como pendente
    if (texto.includes("nome:") && texto.includes("descrição:") && texto.includes("pertencente:")) {
        try {
            const dados = {
                nome: extrairCampo(msg.body, "NOME"),
                descricao: extrairCampo(msg.body, "DESCRIÇÃO"),
                custo_mana: parseInt(extrairCampo(msg.body, "CUSTO DE MANA")) || 0,
                cooldown: parseInt(extrairCampo(msg.body, "COOLDOWN")) || 0,
                tipo: extrairCampo(msg.body, "TIPO") || "Ativa",
                categoria: extrairCampo(msg.body, "CATEGORIA") || "Geral",
                classe: extrairCampo(msg.body, "CLASSE") || "Geral",
                pertencente: extrairCampo(msg.body, "PERTENCENTE")
            };
            
            if (!dados.nome || !dados.pertencente) {
                return MessageService.send({ message: msg, text: "*✖ Preencha pelo menos NOME e PERTENCENTE no template.*" });
            }
            
            // Salvar na tabela de pendentes
            const dataAtual = new Date().toISOString();
            await new Promise((resolve) => {
                db.run(
                    `INSERT INTO habilidades_unicas_pendentes (dados, status, data_envio, criado_por) VALUES (?, 'pendente', ?, ?)`,
                    [JSON.stringify(dados), dataAtual, numero],
                    function(err) {
                        resolve();
                    }
                );
            });
            
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
Use *!confirmar hab única* para finalizar a criação.
            ` });
            
            return;
        } catch (err) {
            console.error("[HABUNICA] Erro ao processar template:", err);
            return MessageService.send({ message: msg, text: "*✖ Erro ao processar o template. Verifique o formato.*" });
        }
    }
};

// =====================================
// FUNÇÃO AUXILIAR
// =====================================
function extrairCampo(texto, campo) {
    const linhas = texto.split("\n");
    for (const linha of linhas) {
        const linhaLower = linha.toLowerCase().trim();
        const campoLower = campo.toLowerCase();
        if (linhaLower.startsWith(campoLower + ":")) {
            return linha.substring(linha.indexOf(":") + 1).trim();
        }
        if (linhaLower.startsWith(campoLower + ":")) {
            return linha.substring(linha.indexOf(":") + 1).trim();
        }
    }
    return "";
}
