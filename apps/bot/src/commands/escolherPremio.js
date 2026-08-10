const MessageService = require("../core/messageService");

/*
 * COMANDO: !Escolho a opção número X
 * 
 * Permite que participantes da Dungeon Instanciada escolham seus prêmios.
 * Cada prêmio só pode ser escolhido uma vez por uso de dungeon.
 */

const JogadorCore = require("../core/jogadorCore");
const DungeonInstanciadaSystem = require("../systems/dungeonInstanciadaSystem");

module.exports = async (msg) => {
    try {
        const numero = msg.author || msg.from;
        const texto = msg.body.toLowerCase();
        
        // Buscar jogador
        const jogador = await JogadorCore.buscarPorNumero(numero);
        if (!jogador) {
            return MessageService.send({ message: msg, text: `
*═══ ESCOLHER PRÊMIO ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Jogador não encontrado!*

Você ainda não possui uma ficha criada.
Use *!ficha* para criar seu personagem.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Extrair número da opção
        const match = texto.match(/!escolho a op[çc][ãa]o n[uú]mero\s+(\d+)/i);
        if (!match) {
            return MessageService.send({ message: msg, text: `
*═══ ESCOLHER PRÊMIO ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Formato inválido!*

Use: *!Escolho a opção número X*
Exemplo: *!Escolho a opção número 1*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        const numeroOpcao = parseInt(match[1]);

        // Buscar ficha de dungeon ativa do jogador
        const ficha = await new Promise((resolve) => {
            const db = require("../core/database");
            db.get(
                "SELECT * FROM fichas_dungeon WHERE jogador_id = ? AND status = 'ativa'",
                [jogador.id],
                (err, row) => resolve(row || null)
            );
        });

        if (!ficha) {
            return MessageService.send({ message: msg, text: `
*═══ ESCOLHER PRÊMIO ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Nenhuma dungeon ativa encontrada.*

_Use *!ficha de Dungeon* para ver sua ficha._
_Use *!concluir Dungeon* para finalizar._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Verificar se o jogador é participante da dungeon
        const participantes = JSON.parse(ficha.participantes || "[]");
        const ehParticipante = participantes.some(p => p.toLowerCase() === jogador.nome.toLowerCase());
        
        if (!ehParticipante) {
            return MessageService.send({ message: msg, text: `
*═══ ESCOLHER PRÊMIO ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Você não é participante desta dungeon.*

Apenas participantes da dungeon podem escolher prêmios.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Escolher prêmio
        const resultado = await DungeonInstanciadaSystem.escolherPremio(ficha.id, jogador.id, numeroOpcao);

        if (resultado.erro) {
            return MessageService.send({ message: msg, text: `
*═══ ESCOLHER PRÊMIO ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*${resultado.erro}*

_Use *!Escolho a opção número X* para escolher._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Mostrar prêmio escolhido
        return MessageService.send({ message: msg, text: `
*═══ PRÊMIO ESCOLHIDO! ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*${resultado.opcao.nome}*

${resultado.mensagem}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Prêmio registrado com sucesso._` });

    } catch (error) {
        console.error("Erro no comando !Escolho:", error);
        return MessageService.send({ message: msg, text: `
*═══ ERRO ═══*
_Ocorreu um erro ao escolher o prêmio._
_Tente novamente mais tarde._` });
    }
};