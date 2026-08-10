const MessageService = require("../core/messageService");

/*
 * COMANDO: !Desejar
 * 
 * Sorteio semanal de Chave de Dungeon Instanciada.
 * Chance de 1 em 5 (20%) de conseguir uma chave.
 * Cooldown semanal (reset toda segunda-feira às 00:01).
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
*═══ ARQUITETO ═══*

*Jogador não encontrado!*

Você ainda não possui uma ficha criada.
Use *!ficha* para criar seu personagem.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Verificar cooldown semanal
        const cooldown = await DungeonInstanciadaSystem.podeSortear(jogador);
        
        if (!cooldown.pode) {
            // Já sorteou esta semana - mostrar resultado anterior
            let resultadoAnterior = "";
            try {
                const resultado = JSON.parse(cooldown.ultimoResultado || "{}");
                if (resultado.sucesso) {
                    resultadoAnterior = `
*Resultado do seu sorteio:*
> ✅ Chave de Dungeon de Rank *${resultado.rank}* obtida!
> Dungeon: *${resultado.nomeDungeon}*`;
                } else {
                    resultadoAnterior = `
*Resultado do seu sorteio:*
> ❌ Nenhuma Chave de Dungeon foi obtida.`;
                }
            } catch (e) {
                resultadoAnterior = "";
            }

            const proximaSegunda = cooldown.proximaSegunda;
            const dataFormatada = proximaSegunda.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });

            return MessageService.send({ message: msg, text: `
*═══ ARQUITETO ═══*

*Você já realizou seu sorteio semanal.*

${resultadoAnterior}

*Próximo sorteio:* ${dataFormatada}
_A partir de segunda-feira às 00:01 você poderá sortear novamente._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Realizar sorteio
        const resultado = await DungeonInstanciadaSystem.sortearChave(jogador);

        if (resultado.sucesso) {
            // Escolher fala aleatória de sucesso
            const falas = DungeonInstanciadaSystem.FALAS_SUCESSO;
            const fala = falas[Math.floor(Math.random() * falas.length)];
            const mensagem = fala.replace("{RANK}", resultado.rank);

            return MessageService.send({ message: msg, text: `
${mensagem}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Dungeon:* ${resultado.nomeDungeon}
*Tema:* ${resultado.tema}
*Usos:* 0/5

_Use *!ficha de Dungeon* para ver sua ficha._
_Use *!inventario* para ver sua Chave de Dungeon._` });
        } else {
            // Escolher fala aleatória de falha
            const falas = DungeonInstanciadaSystem.FALAS_FALHA;
            const fala = falas[Math.floor(Math.random() * falas.length)];

            return MessageService.send({ message: msg, text: `
${fala}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Tente novamente na próxima segunda-feira._` });
        }

    } catch (error) {
        console.error("Erro no comando !Desejar:", error);
        return MessageService.send({ message: msg, text: `
*═══ ERRO ═══*
_Ocorreu um erro ao processar o sorteio._
_Tente novamente mais tarde._` });
    }
};