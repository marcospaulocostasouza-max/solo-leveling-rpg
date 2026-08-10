const MessageService = require("../core/messageService");

/*
 * COMANDO: !ficha de Dungeon
 * 
 * Exibe a ficha da Dungeon Instanciada do jogador.
 * Mostra nome, descrição, tema, rank e participantes.
 */

const JogadorCore = require("../core/jogadorCore");
const DungeonInstanciadaSystem = require("../systems/dungeonInstanciadaSystem");

module.exports = async (msg) => {
    try {
        const numero = msg.author || msg.from;
        
        // Buscar jogador
        const jogador = await JogadorCore.buscarPorNumero(numero);
        if (!jogador) {
            return MessageService.send({ message: msg, text: `
*═══ FICHA DE DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Jogador não encontrado!*

Você ainda não possui uma ficha criada.
Use *!ficha* para criar seu personagem.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Gerar ficha de dungeon
        const dados = await DungeonInstanciadaSystem.gerarFichaDungeon(jogador);
        
        if (dados.erro) {
            return MessageService.send({ message: msg, text: `
*═══ FICHA DE DUNGEON ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${dados.erro}

_Use *!Desejar* para tentar obter uma Chave de Dungeon._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Formatar e enviar ficha
        const mensagem = DungeonInstanciadaSystem.formatarFichaDungeon(dados);
        await MessageService.send({ message: msg, text: mensagem });

    } catch (error) {
        console.error("Erro no comando !ficha de Dungeon:", error);
        return MessageService.send({ message: msg, text: `
*═══ ERRO ═══*
_Ocorreu um erro ao carregar a ficha de dungeon._
_Tente novamente mais tarde._` });
    }
};