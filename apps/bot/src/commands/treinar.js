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
*Maestria total:* ${(jogador.maestria || 0) + maestriaGanha}

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
*═══ MAESTRIA ═══*
────────────────────────══

*Sua Maestria:* ${jogador.maestria || 0}
*Nível:* ${jogador.nivel}

────────────────────────══
_Use !treinar para ganhar mais Maestria!_
_Use !comprar técnica [nome] para gastar Maestria e aprender técnicas!_
                ` });
            }
        );
        return;
    }
};
