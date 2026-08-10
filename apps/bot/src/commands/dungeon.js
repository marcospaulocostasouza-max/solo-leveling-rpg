const MessageService = require("../core/messageService");

/**
 * COMANDO: !dungeon
 * 
 * Sistema de Dungeons - Gerencia exploração de masmorras.
 * 
 * Uso:
 * !dungeon - Mostra status da dungeon atual
 * !dungeon entrar <id> - Entra em uma dungeon
 * !dungeon progresso - Ver progresso
 * !dungeon sair - Sair da dungeon
 * !dungeon listar - Lista dungeons disponíveis
 */

const db = require("../core/database");
const DungeonSystem = require("../systems/dungeonSystem");
const JogadorCore = require("../core/jogadorCore");

module.exports = async (msg) => {
    try {
        const texto = msg.body.toLowerCase().trim();
        const numero = msg.author || msg.from;
        
        // Buscar jogador
        const jogador = await JogadorCore.buscarPorNumero(numero);
        if (!jogador) {
            return MessageService.send({ message: msg, text: `
*═══ DUNGEON ═══*
──────────────────────────

*Jogador não encontrado!*

Você ainda não possui uma ficha criada.
Use *!ficha* para criar seu personagem.

──────────────────────────` });
        }
        
        // !dungeon listar - Lista dungeons disponíveis
        if (texto === '!dungeon listar' || texto === '!dungeons') {
            const dungeons = await DungeonSystem.listarDungeons();
            if (!dungeons || dungeons.length === 0) {
                return MessageService.send({ message: msg, text: "Nenhuma dungeon disponivel no momento." });
            }
            
            let mensagem = `*═══ DUNGEONS DISPONIVEIS ═══*
──────────────────────────

`;
            dungeons.forEach((d, i) => {
                mensagem += `${i+1}. *${d.nome}*
   Rank: ${d.rank} | Andar: ${d.andar}
   Boss: ${d.boss || 'Desconhecido'}
   Recompensa: ${d.recompensa_xp || 0} XP | ${d.recompensa_won || 0} Won

`;
            });
            mensagem += `──────────────────────────
_Para entrar: !dungeon entrar <id>_`;
            
            return MessageService.send({ message: msg, text: mensagem });
        }
        
        // !dungeon entrar <id>
        if (texto.startsWith('!dungeon entrar ')) {
            const dungeonId = parseInt(texto.replace('!dungeon entrar ', '').trim());
            if (isNaN(dungeonId)) {
                return MessageService.send({ message: msg, text: "ID da dungeon invalido. Use !dungeon listar para ver os IDs." });
            }
            
            const resultado = await DungeonSystem.entrarDungeon(jogador.id, dungeonId);
            if (resultado.erro) {
                return MessageService.send({ message: msg, text: `═ ${resultado.erro}` });
            }
            
            const d = resultado.dungeon;
            return MessageService.send({ message: msg, text: `
*═══ ENTRANDO NA DUNGEON ═══*
──────────────────────────

*${d.nome}*
Rank: ${d.rank} | Andar: ${d.andar}

*Descricao:*
${d.descricao || 'Explore e enfrente os desafios!'}

*Boss:* ${d.boss || 'Desconhecido'}

*Recompensas:*
> XP: ${d.recompensa_xp || 0}
> Won: ${d.recompensa_won || 0}

──────────────────────────
_Use !dungeon para ver seu progresso._
_Boa sorte, Caçador!_` });
        }
        
        // !dungeon sair
        if (texto === '!dungeon sair') {
            await new Promise((resolve) => {
                db.run(
                    "UPDATE jogador_dungeons SET status = 'abandonada' WHERE jogador_id = ? AND status = 'ativa'",
                    [jogador.id],
                    (err) => resolve()
                );
            });
            
            return MessageService.send({ message: msg, text: `
*═══ DUNGEON ABANDONADA ═══*
──────────────────────────

Voce saiu da dungeon atual.
Use !abrir dungeon para iniciar uma nova.

──────────────────────────` });
        }
        
        // !dungeon - Mostrar status atual
        const dungeon = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    jd.*,
                    d.nome as dungeon_nome,
                    d.rank,
                    d.descricao,
                    d.boss,
                    d.recompensa_xp,
                    d.recompensa_won,
                    d.andar
                FROM jogador_dungeons jd
                JOIN dungeons d ON jd.dungeon_id = d.id
                WHERE jd.jogador_id = ? AND jd.status = 'ativa'
            `, [jogador.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        let mensagem = `*═══ SISTEMA DE DUNGEONS ═══*
──────────────────────────

`;
        
        if (!dungeon) {
            mensagem += `*Nenhuma Dungeon Ativa*

Você não está em nenhuma dungeon no momento.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⛩️ *DUNGEON — MASMORRA DIMENSIONAL*

Também comumente conhecida como "masmorra", dungeons são um espaço dimensional interconectado ao nosso, alterando a realidade à nossa volta e tornando-a semelhante a um jogo.

Em dungeons mais básicas, o cenário parte do mundo real, acrescentando nele apenas mobs, obstáculos referentes ao tema da dungeon e também uma recompensa atrelada com a sua conclusão.

O sistema age transferindo o jogador para uma simulação de uma dimensão real — ou parte dela. Uma masmorra de fogo, por exemplo, o jogador poderia estar sendo transportado para uma região vulcânica, em alguma dimensão... louco, não?

⚠️ *Diferença entre Dungeon e Portal:*
Deve-se ter em mente que masmorras são diferentes de portais. Portais nada mais são do que entradas para outro mundo. Eles existem, diferente da dungeon. Monstros poderiam sair de um portal e vir para o mundo real. Enquanto que em dungeons sorteadas, somente o jogador pode sair dela.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Tipos de Dungeons:*

> *Instanciadas* — Sorteio semanal pelo Arquiteto
> *Compradas* — Adquiridas por guildas
> *Eventos* — Criadas pela administração

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*⛩️ DUNGEONS INSTANCIADAS:*

Essas são Dungeons que você tem direito de fazer caso tenha a sorte de conseguir no sorteio do Arquiteto.

Toda segunda-feira você tem direito a 1 sorteio para ganhar uma Chave de Dungeon, dada pelo sistema do Arquiteto. Se você for um Fragmento de Luz, a chave é dada pelos Governantes.

*Como funciona:*
> Use *!Desejar* para tentar obter uma chave
> Chance de 1 em 5 (20%) de conseguir
> A chave vem com 5 usos (0/5)
> Cada participante adicional consome 1 uso
> Ao esgotar os 5 usos, o dono recebe um *Ticket Único*

*Ticket Único (50/50):*
> Ao completar os 5 usos, o dono da chave recebe:
> 50% → Ticket de Item Único
> 50% → Ticket de Técnica Única
> Use *!usar ticket* para utilizá-lo
> Entre na fila de avaliação automaticamente

*Atualização da Loja:*
> Ao finalizar os 5 usos, os Itens Misteriosos da Dungeon são enviados automaticamente para a loja do Rank correspondente

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*📋 COMANDOS DE DUNGEON INSTANCIADA:*

> *!Desejar* — Sorteio semanal de Chave de Dungeon
> *!ficha de Dungeon* — Gera a ficha da sua Dungeon
> *!abrir Dungeon* — Abre/visualiza uma Dungeon da database
> *!minha Dungeon* — Ve sua Dungeon atual e usos restantes
> *!concluir Dungeon* — Conclui a Dungeon (envie a ficha preenchida)
> *!Escolho a opção número X* — Escolhe um prêmio extra
> *!usar ticket* — Usa um Ticket de Item/Técnica Única
> *!meus tickets* — Ve seus tickets e posição na fila

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Regras Gerais:*
> 1 sorteio por semana (reset toda segunda às 00:01)
> Máximo de 5 participantes por Dungeon
> O dono da chave deve participar obrigatoriamente
> Players de rank maior que a Dungeon não podem participar
> Cada participante só pode fazer 1 Dungeon Instanciada por semana
> A chave não pode ser doada/roubada/emprestada
> Apenas 1 chave por pessoa

*Recompensas por Rank:*
> Rank E: 4k XP | 20k Won | 20 Atributos
> Rank D: 8k XP | 50k Won | 40 de Maestria
> Rank C: 16k XP | 100k Won | 60 de Maestria
> Rank B: 26k XP | 190k Won | 80 de Maestria
> Rank A: 60k XP | 500k Won | 100 de Maestria
> Rank S: 200k XP | 1kk Won | 200 de Maestria
> + 2 Itens Misteriosos por Dungeon

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Comandos Gerais:*
> !dungeon listar — Ver dungeons disponíveis
> !dungeon entrar <id> — Entrar em uma dungeon
> !dungeon sair — Sair da dungeon atual
`;
        } else {
            mensagem += `*Dungeon Atual:*
> *Nome:* ${dungeon.dungeon_nome}
> *Rank:* ${dungeon.rank}
> *Andar:* ${dungeon.andar}
> *Progresso:* ${dungeon.progresso || 0}%
`;
            if (dungeon.boss) mensagem += `> *Boss:* ${dungeon.boss}\n`;
            mensagem += `
*Recompensas:*
> XP: ${dungeon.recompensa_xp || 0}
> Won: ${dungeon.recompensa_won || 0}

*Comandos:*
> !dungeon sair - Sair da dungeon
> !dungeon listar - Ver outras dungeons
`;
        }
        
        mensagem += `
──────────────────────────
_Boa sorte, Cacador!_`;
        
        await MessageService.send({ message: msg, text: mensagem });
        
    } catch (error) {
        console.error("Erro no comando dungeon:", error);
        return MessageService.send({ message: msg, text: `
*═══ ERRO ═══*
_Ocorreu um erro ao carregar a dungeon._
_Tente novamente mais tarde._` });
    }
};
