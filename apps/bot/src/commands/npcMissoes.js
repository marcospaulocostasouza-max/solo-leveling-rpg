const MessageService = require("../core/messageService");

/**
 * COMANDO: !missoes npc <id>
 * 
 * Exibe as missões disponíveis de um NPC específico.
 * 
 * Uso:
 * - !missoes npc <id> - Lista as missões do NPC
 * - !missoes npc <id> <numero> - Detalhes de uma missão específica
 */

const fs = require("fs");
const path = require("path");
const NPCManager = require("../npc/npcManager");
const MissionManager = require("../missions/missionManager");
const QuestSystem = require("../systems/questSystem");
const { classificarMissoes } = require("../missions/missionAvailability");
const templates = require("../utils/templatesMensagens");

const MISSIONS_DIR = path.join(__dirname, "..", "missions", "data");

module.exports = async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    const numero = msg.author || msg.from;
    
    // Buscar jogador
    const db = require("../core/database");
    const jogador = await new Promise((resolve) => {
        db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], (err, row) => resolve(row));
    });
    
    if (!jogador) {
        return MessageService.send({ message: msg, text: "⚠ Você precisa ter uma ficha aprovada para ver missões." });
    }
    
    // Extrair ID do NPC do comando
    const partes = texto.split(" ");
    if (partes.length < 3) {
        return MessageService.send({ message: msg, text: 
            `*═══ MISSÕES DE NPCs ═══*\n` +
            `──────────────────────────\n\n` +
            `Para ver as missões de um NPC, use:\n` +
            `> *!missoes npc <id_do_npc>*\n\n` +
            `Exemplo:\n` +
            `> *!missoes npc ophilia_clement*\n\n` +
            `Para ver detalhes de uma missão:\n` +
            `> *!missoes npc <id_do_npc> <numero>*\n\n` +
            `Para listar todos os NPCs:\n` +
            `> *!npcs*`
         });
    }
    
    const npcId = partes[2];
    const numeroMissao = partes[3] ? parseInt(partes[3]) : null;
    
    // Buscar NPC
    const npc = NPCManager.carregarNPC(npcId);
    if (!npc) {
        return MessageService.send({ message: msg, text: `*✖ NPC não encontrado:* ${npcId}\nUse *!npcs* para ver a lista de NPCs disponíveis.` });
    }
    
    // Carregar missões do NPC
    const caminhoMissoes = path.join(MISSIONS_DIR, `${npcId}.json`);
    if (!fs.existsSync(caminhoMissoes)) {
        return MessageService.send({ message: msg, text: `*✖ ${npc.nome} não tem missões disponíveis no momento.*` });
    }
    
    const dadosMissoes = JSON.parse(fs.readFileSync(caminhoMissoes, "utf8"));
    // A mesma sincronização de !missao impede que este catálogo revele
    // conteúdo acima do vínculo atual do jogador.
    const missoesRegistradas = await QuestSystem.listarMissoes(jogador.id);
    const idsDisponiveis = new Set(
        missoesRegistradas
            .filter((missao) => missao.npc_id === npcId && missao.origem_missao_id)
            .map((missao) => missao.origem_missao_id)
    );
    const missoes = classificarMissoes(dadosMissoes.missoes || [])
        .filter((missao) => idsDisponiveis.has(missao.id));
    
    // Se pediu uma missão específica
    if (numeroMissao) {
        const missao = missoes.find(m => m.numero === numeroMissao);
        if (!missao) {
            return MessageService.send({ message: msg, text: `*✖ Missão ${numeroMissao} não encontrada para ${npc.nome}.*` });
        }
        
        let mensagem = `*═══ MISSÃO ${missao.numero} - ${npc.nome.toUpperCase()} ═══*\n`;
        mensagem += `──────────────────────────\n\n`;
        mensagem += `*${missao.nome}*\n\n`;
        mensagem += `*Tipo:* ${missao.tipo}\n`;
        mensagem += `*Categoria:* ${missao.categoria}\n`;
        mensagem += `*Rank:* ${missao.rank}\n`;
        mensagem += `*Dificuldade:* Rank ${missao.rank}\n`;
        if (missao.nivelRecomendado) mensagem += `*Nível recomendado:* ${missao.nivelRecomendado}\n`;
        mensagem += `*Vínculo necessário:* ${missao.vinculoNecessario}%\n\n`;
        mensagem += `*Descrição:*\n> ${missao.descricao}\n\n`;
        mensagem += `*Objetivo:*\n> ${missao.objetivo}\n\n`;
        mensagem += `*Recompensas:*\n`;
        mensagem += `> XP: ${missao.recompensas.xp.toLocaleString()}\n`;
        mensagem += `> Won: ${missao.recompensas.won.toLocaleString()}\n`;
        mensagem += `> Item: ${missao.recompensas.item}\n\n`;
        mensagem += `──────────────────────────\n`;
        mensagem += `Para iniciar esta missão, converse com ${npc.nome}:\n`;
        mensagem += `> !${npc.id}\n`;
        mensagem += `> Quero iniciar a missão ${missao.numero}`;
        
        await MessageService.send({ message: msg, text: mensagem });
        return;
    }
    
    // Listar todas as missões do NPC
    let mensagem = `*═══ MISSÕES DE ${npc.nome.toUpperCase()} ═══*\n`;
    mensagem += `*"${npc.titulo}"*\n`;
    mensagem += `──────────────────────────\n\n`;
    mensagem += `*Total de Missões:* ${missoes.length}\n\n`;
    
    // Agrupar por tipo
    const tipos = {
        "historia": "📜 HISTÓRIA PRINCIPAL",
        "loja": "🛒 LOJA",
        "producao": "⚙️ PRODUÇÃO",
        "caca": "⚔️ CAÇADA"
    };
    
    for (const [tipo, tituloTipo] of Object.entries(tipos)) {
        const missoesTipo = missoes.filter(m => m.tipo === tipo);
        if (missoesTipo.length === 0) continue;
        
        mensagem += `*${tituloTipo}*\n`;
        for (const missao of missoesTipo) {
            mensagem += `> *${missao.numero}.* ${missao.nome}\n`;
            mensagem += `   Dificuldade: Rank ${missao.rank} | Vínculo: ${missao.vinculoNecessario}%\n`;
            if (missao.nivelRecomendado) mensagem += `   Nível recomendado: ${missao.nivelRecomendado}\n`;
            mensagem += `   Recompensa: ${missao.recompensas.xp.toLocaleString()} XP, ${missao.recompensas.won.toLocaleString()} Won\n`;
        }
        mensagem += `\n`;
    }
    
    mensagem += `──────────────────────────\n`;
    mensagem += `*Para ver detalhes de uma missão:*\n`;
    mensagem += `> !missoes npc ${npc.id} <numero>\n\n`;
    mensagem += `*Exemplo:*\n`;
    mensagem += `> !missoes npc ${npc.id} 1\n\n`;
    mensagem += `*Para conversar com ${npc.nome}:*\n`;
    mensagem += `> !${npc.id}\n`;
    mensagem += `> Sua mensagem aqui`;
    
    await MessageService.send({ message: msg, text: mensagem });
};
