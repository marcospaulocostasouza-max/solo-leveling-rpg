const MessageService = require("../core/messageService");

/*
 * COMANDO: !treinar
 * 
 * Sistema de treino para ganhar Maestria.
 */

const db = require('../core/database');

module.exports = async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    
    // !treinar - Inicia um treino
    if (texto === '!treinar') {
        const numero = msg.author || msg.from;
        
        db.get(
            'SELECT * FROM jogadores WHERE numero = ?',
            [numero],
            async (err, jogador) => {
                if (err) {
                    console.error('Erro ao buscar jogador:', err);
                    await MessageService.send({ message: msg, text: '═ Erro ao buscar dados do jogador.' });
                    return;
                }
                
                if (!jogador) {
                    await MessageService.send({ message: msg, text: `
═ *Jogador não encontrado!*

Use !ficha para criar sua ficha primeiro.
                    ` });
                    return;
                }
                
                // Mantém exatamente a regra antiga de ganho.
                const maestriaGanha = Math.floor(Math.random() * 10) + jogador.nivel;
                
                // Atualizar Maestria do jogador
                db.run(
                    'UPDATE jogadores SET maestria = maestria + ? WHERE id = ?',
                    [maestriaGanha, jogador.id],
                    async (err) => {
                        if (err) {
                            console.error('Erro ao atualizar Maestria:', err);
                            await MessageService.send({ message: msg, text: '═ Erro ao processar treino.' });
                            return;
                        }
                        
                        await MessageService.send({ message: msg, text: `
*═══ TREINO CONCLUÍDO! ═══*
────────────────────────══

*Seu treino foi intenso!*

*Maestria obtida:* +${maestriaGanha}
*Maestria total:* ${(Number(jogador.maestria) || 0) + maestriaGanha}

────────────────────────══
_Continue treinando para ganhar mais Maestria e aprender técnicas!_
                        ` });
                    }
                );
            }
        );
        return;
    }
    
    // !maestria é o comando oficial. !qi é apenas alias legado.
    if (texto === '!maestria' || texto === '!qi') {
        const numero = msg.author || msg.from;
        
        db.get(
            'SELECT maestria, nivel FROM jogadores WHERE numero = ?',
            [numero],
            async (err, jogador) => {
                if (err) {
                    console.error('Erro ao buscar jogador:', err);
                    await MessageService.send({ message: msg, text: '═ Erro ao buscar dados do jogador.' });
                    return;
                }
                
                if (!jogador) {
                    await MessageService.send({ message: msg, text: `
═ *Jogador não encontrado!*

Use !ficha para criar sua ficha primeiro.
                    ` });
                    return;
                }
                
                await MessageService.send({ message: msg, text: `
_*「 MAESTRIA 」*_
_— Poder bruto não basta, Jogador. Maestria representa o domínio que você conquistou sobre sua classe, suas armas, sua mana e suas técnicas. Ela é um recurso de aprendizado: não substitui XP, não aumenta seu nível e não é dinheiro._

*Seu registro atual*
• Maestria disponível: *${jogador.maestria || 0}*
• Nível: *${jogador.nivel}*

*Como conquistar Maestria?*
Realize *Treinos de Maestria* pelo sistema de progresso e participe de atividades, eventos ou recompensas que concedam esse recurso. O ganho entra no registro quando a atividade correspondente é validada pelo Sistema.

*Onde ela é usada?*
A Maestria é gasta para aprender técnicas compatíveis com sua classe normal ou sua Classe Avançada. Cada compra exige:
• classe correta;
• nível mínimo da técnica;
• Maestria suficiente;
• não possuir a técnica anteriormente.

*Custos progressivos*
• Técnicas da classe normal: *10, 20, 40, 70, 110, 160, 230, 320, 450, 650...*
• Técnicas da Classe Avançada: *200, 300, 450, 650, 900...*
Cada nova técnica da mesma classe custa um pouco mais que a anterior, com progressão controlada.

*Como usar, passo a passo*
1. Veja as opções: *!Técnicas*
2. Consulte os detalhes: *!Técnica <nome>*
3. Aprenda: *!Comprar Técnica <nome>*
4. Confira as adquiridas: *!Minhas Técnicas*

_A Maestria permanece guardada até ser utilizada. Em caso de falha na compra, nenhum ponto deve ser descontado._
                ` });
            }
        );
        return;
    }
};
