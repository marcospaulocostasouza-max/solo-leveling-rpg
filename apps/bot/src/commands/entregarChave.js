const MessageService = require("../core/messageService");

/*
 * COMANDO: !Entregar Chave <player> <rank> <nome da dungeon>
 * 
 * Comando administrativo para entregar uma Chave de Dungeon a um jogador.
 * 
 * Uso:
 * !Entregar Chave <player> - Entrega chave com rank do jogador
 * !Entregar Chave <player> <rank> - Entrega chave com rank específico
 * !Entregar Chave <player> <rank> <nome da dungeon> - Entrega com nome personalizado
 * 
 * Exemplos:
 * !Entregar Chave Marcos
 * !Entregar Chave Marcos S
 * !Entregar Chave Marcos S Torre do Fim
 */

const db = require("../core/database");
const JogadorCore = require("../core/jogadorCore");
const DungeonInstanciadaSystem = require("../systems/dungeonInstanciadaSystem");

// Verificar se é admin
async function verificarAdmin(numero) {
    return new Promise((resolve) => {
        db.get("SELECT * FROM administradores WHERE numero = ?", [numero], (err, row) => {
            resolve(row || null);
        });
    });
}

module.exports = async (msg) => {
    try {
        const numero = msg.author || msg.from;
        const texto = msg.body.trim();

        // Verificar se é admin
        const admin = await verificarAdmin(numero);
        if (!admin) {
            return MessageService.send({ message: msg, text: "*✖ Apenas administradores podem usar este comando.*" });
        }

        // Extrair argumentos
        // Formato: !Entregar Chave <player> [rank] [nome da dungeon]
        const partes = texto.split(" ");
        
        // Remover "!Entregar" e "Chave"
        const args = partes.slice(2);
        
        if (args.length === 0) {
            return MessageService.send({ message: msg, text: `
*═══ ENTREGAR CHAVE DE DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Uso:*
*!Entregar Chave <player>* - Entrega chave com rank do jogador
*!Entregar Chave <player> <rank>* - Entrega chave com rank específico
*!Entregar Chave <player> <rank> <nome da dungeon>* - Entrega com nome personalizado

*Exemplos:*
> !Entregar Chave Marcos
> !Entregar Chave Marcos S
> !Entregar Chave Marcos S Torre do Fim

*Ranks válidos:* E, D, C, B, A, S

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Primeiro argumento é o nome do player
        const nomePlayer = args[0];
        
        // Buscar jogador pelo nome
        const jogador = await JogadorCore.buscarPorNomeLike(nomePlayer);
        
        if (!jogador) {
            return MessageService.send({ message: msg, text: `
*═══ ENTREGAR CHAVE ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*❌ Jogador não encontrado!*

Player: *${nomePlayer}*

_Verifique se o nome está correto._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Verificar segundo argumento (rank)
        const ranksValidos = ["E", "D", "C", "B", "A", "S"];
        let rank = jogador.rank || "E";
        let nomeDungeon = "";
        let tema = "";

        if (args.length >= 2 && ranksValidos.includes(args[1].toUpperCase())) {
            rank = args[1].toUpperCase();
            
            // Se tem mais argumentos, é o nome da dungeon
            if (args.length >= 3) {
                nomeDungeon = args.slice(2).join(" ");
            }
        } else if (args.length >= 2) {
            // Se o segundo argumento não é rank, pode ser o nome da dungeon
            nomeDungeon = args.slice(1).join(" ");
        }

        // Se não especificou nome da dungeon, sortear um
        if (!nomeDungeon) {
            const nomesDungeon = {
                "E": ["Caverna dos Ecos", "Ruínas Esquecidas", "Túnel Sombrio", "Floresta dos Sussurros", "Mina Abandonada"],
                "D": ["Catacumbas de Pedra", "Bosque Sombrio", "Templo Submerso", "Cripta dos Antigos", "Vale da Névoa"],
                "C": ["Fortaleza em Ruínas", "Abismo Rastejante", "Torre do Lamento", "Pântano Amaldiçoado", "Cidadela Sombria"],
                "B": ["Labirinto do Caos", "Montanha do Trovão", "Cidade Perdida", "Necrópole Viva", "Portal do Vazio"],
                "A": ["Santuário Proibido", "Reino das Sombras", "Abismo Sem Fim", "Trono do Devorador", "Coração do Abismo"],
                "S": ["Torre do Fim", "Jardim do Apocalipse", "Trono do Caos", "Vazio Absoluto", "Portão do Juízo Final"]
            };
            const temasDungeon = {
                "E": ["Caverna", "Ruínas", "Floresta", "Mina"],
                "D": ["Cripta", "Templo", "Pântano", "Vale"],
                "C": ["Fortaleza", "Torre", "Abismo", "Cidadela"],
                "B": ["Labirinto", "Montanha", "Necrópole", "Portal"],
                "A": ["Santuário", "Reino", "Abismo", "Trono"],
                "S": ["Torre", "Jardim", "Vazio", "Portão"]
            };
            
            const nomes = nomesDungeon[rank] || nomesDungeon["E"];
            const temas = temasDungeon[rank] || temasDungeon["E"];
            nomeDungeon = nomes[Math.floor(Math.random() * nomes.length)];
            tema = temas[Math.floor(Math.random() * temas.length)];
        } else {
            // Tema padrão baseado no rank
            const temasDungeon = {
                "E": "Caverna",
                "D": "Cripta",
                "C": "Fortaleza",
                "B": "Labirinto",
                "A": "Santuário",
                "S": "Torre"
            };
            tema = temasDungeon[rank] || "Masmorra";
        }

        // Verificar se o jogador já tem uma chave ativa
        const chaveExistente = await DungeonInstanciadaSystem.getChave(jogador.id);
        if (chaveExistente) {
            return MessageService.send({ message: msg, text: `
*═══ ENTREGAR CHAVE ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*⚠️ O jogador já possui uma Chave de Dungeon ativa!*

Player: *${jogador.nome}*
Rank da chave atual: *${chaveExistente.rank}*
Usos restantes: *${chaveExistente.usos_restantes}/${chaveExistente.usos_total}*

_O jogador precisa esgotar a chave atual antes de receber uma nova._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Criar chave de dungeon
        const agora = new Date().toISOString();
        
        await new Promise((resolve) => {
            db.run(
                `INSERT OR REPLACE INTO chaves_dungeon 
                 (jogador_id, rank, usos_total, usos_restantes, data_obtencao, ativa) 
                 VALUES (?, ?, 5, 5, ?, 1)`,
                [jogador.id, rank, agora],
                () => resolve()
            );
        });

        // Atualizar jogador com resultado do sorteio
        await new Promise((resolve) => {
            db.run(
                "UPDATE jogadores SET ultimo_sorteio_desejar = ?, ultimo_resultado_desejar = ? WHERE id = ?",
                [agora, JSON.stringify({ sucesso: true, rank, nomeDungeon, tema, entreguePor: admin.nome }), jogador.id],
                () => resolve()
            );
        });

        // Registrar log administrativo
        await new Promise((resolve) => {
            db.run(
                `INSERT INTO admin_logs (admin_numero, admin_nome, acao, alvo, detalhes, data) 
                 VALUES (?, ?, 'entregar_chave', ?, ?, ?)`,
                [numero, admin.nome, jogador.nome, `Chave Rank ${rank} - ${nomeDungeon}`, agora],
                () => resolve()
            );
        });

        // Mensagem de sucesso
        return MessageService.send({ message: msg, text: `
*═══ CHAVE ENTREGUE COM SUCESSO! ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*⟨ ARQUITETO ⟩*

*Uma Chave de Dungeon foi concedida administrativamente.*

> *Jogador:* ${jogador.nome}
> *Rank da Chave:* ${rank}
> *Dungeon:* ${nomeDungeon}
> *Tema:* ${tema}
> *Usos:* 5/5

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Entregue por:* ${admin.nome}

_O jogador pode usar *!ficha de Dungeon* para ver sua ficha._
_O jogador pode usar *!concluir Dungeon* para iniciar._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });

    } catch (error) {
        console.error("Erro no comando !Entregar Chave:", error);
        return MessageService.send({ message: msg, text: `
*═══ ERRO ═══*
_Ocorreu um erro ao entregar a chave._
_Detalhes: ${error.message}_

_Tente novamente._` });
    }
};