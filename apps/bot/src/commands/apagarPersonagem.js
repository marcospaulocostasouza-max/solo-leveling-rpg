"use strict";

const MessageService = require("../core/messageService");
const database = require("../../../../packages/database");
const fichasTemp = require("../utils/fichasTemp");
const { createCharacterDeletionService, isExpired } = require("../systems/characterDeletionService");
const deletionService = createCharacterDeletionService();
const send = (msg, text) => MessageService.send({ message: msg, text });

module.exports = async function apagarPersonagem(msg) {
  const numero = msg.author || msg.from;
  if (String(msg.body || "").toLowerCase().trim() === "!tenho certeza") return confirmar(msg, numero);
  try {
    const [jogador, fichaPendente] = await Promise.all([
      database.get("SELECT * FROM jogadores WHERE numero=?", [numero]),
      database.get("SELECT * FROM fichas_pendentes WHERE numero=?", [numero])
    ]);
    let dados = {};
    try { dados = JSON.parse(fichaPendente?.dados || "{}"); } catch {}
    const nome = jogador?.nome || dados.nome || "dados de cadastro";
    // Versões antigas marcavam o pedido como "confirmado" antes de apagar os
    // dados. Se a exclusão falhasse, esse registro único ficava preso e todo
    // novo !apagar personagem terminava em conflito de chave.
    let processo = await database.get("SELECT * FROM processos_exclusao WHERE numero=?", [numero]);
    if (processo && isExpired(processo.data_expiracao)) {
      await database.run("DELETE FROM processos_exclusao WHERE numero=?", [numero]);
      processo = null;
    }
    if (processo?.status === "aguardando") return send(msg, "*⚠ PROCESSO DE EXCLUSÃO PENDENTE ⚠*\n\nDigite *!tenho certeza* para apagar o personagem e todos os dados ligados a ele.\n_O pedido expira em 5 minutos._");
    const expiration = new Date(Date.now() + 300000).toISOString();
    await database.run(`INSERT INTO processos_exclusao (numero,jogador_nome,status,data_criacao,data_expiracao)
      VALUES (?,?,'aguardando',CURRENT_TIMESTAMP,?)
      ON CONFLICT(numero) DO UPDATE SET jogador_nome=excluded.jogador_nome,status='aguardando',data_criacao=CURRENT_TIMESTAMP,data_expiracao=excluded.data_expiracao`, [numero, nome, expiration]);
    return send(msg, `*⚠ EXCLUSÃO DE PERSONAGEM ⚠*\n\nVocê está prestes a apagar permanentemente:\n> *Nome:* ${nome}\n> *Classe:* ${jogador?.classe || dados.classe || "Não definida"}\n> *Status:* ${jogador ? `Nível ${jogador.nivel || 1}` : fichaPendente ? "Ficha aguardando aprovação" : "Dados residuais de cadastro"}\n\nSerão apagados ficha, atributos, inventário, equipamentos, técnicas, afinidades, missões, dungeons, sorteios e históricos.\n\nDigite *!tenho certeza* em até 5 minutos para confirmar.`);
  } catch (error) {
    console.error("[EXCLUSÃO] Erro ao iniciar:", error);
    return send(msg, "*✖ Não foi possível iniciar a exclusão agora. Tente novamente.*");
  }
};

async function confirmar(msg, numero) {
  try {
    const result = await deletionService.remove(numero);
    if (result.status === "not_pending") return send(msg, "*✖ Nenhum processo de exclusão encontrado.*\nUse *!apagar personagem* para iniciar.");
    if (result.status === "expired") return send(msg, "*✖ A confirmação expirou.*\nUse *!apagar personagem* para iniciar novamente.");
    delete fichasTemp[numero];
    console.log(`[EXCLUSÃO] ${result.name} (${numero}) foi excluído completamente.`);
    return send(msg, `*✓ PERSONAGEM EXCLUÍDO COM SUCESSO*\n\n*${result.name}* e todos os dados vinculados foram apagados. Você já pode usar *!ficha* para recomeçar.`);
  } catch (error) {
    console.error("[EXCLUSÃO] Erro ao confirmar; transação revertida:", error);
    if (error.code === "GUILD_LEADER") return send(msg, `*✖ ${error.message}*\nUse *!guilda transferir <nome completo>* ou *!guilda dissolver confirmar* e confirme novamente.`);
    return send(msg, "*✖ Não foi possível apagar o personagem.*\nNenhum dado foi removido parcialmente. O pedido continua pendente para você tentar novamente.");
  }
}

module.exports.confirmar = confirmar;
