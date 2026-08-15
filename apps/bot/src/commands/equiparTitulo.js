const MessageService = require("../core/messageService");

/*
 * COMANDO: !equipar título [nome]
 * 
 * Equipa um título e aplica seus buffs automaticamente
 */

const titulos = require('../database/data/titulos.json');

module.exports = async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    
    // Verificar se é o comando de equipar título
    if (!texto.startsWith('!equipar título') && !texto.startsWith('!equipar titulo')) {
        return;
    }
    
    // Extrair o nome do título
    const nomeTitulo = texto.replace('!equipar título', '').replace('!equipar titulo', '').trim();
    
    if (!nomeTitulo) {
        await MessageService.send({ message: msg, text: `
═ *Uso incorreto!*

Use: !equipar título [nome do título]

Exemplo: !equipar título Olho Último
        ` });
        return;
    }
    
    // Buscar título pelo nome
    const titulo = titulos.find(t => 
        t.nome.toLowerCase().includes(nomeTitulo)
    );
    
    if (!titulo) {
        await MessageService.send({ message: msg, text: `
═ *Título não encontrado!*

Verifique se o nome está correto.
Use !meus títulos para consultar os títulos que você conquistou.
        ` });
        return;
    }
    
    // Buscar jogador no banco de dados
    const db = require('../core/database');
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
            
            const tituloConquistado = String(jogador.titulo || '').trim().toLowerCase();
            if (!tituloConquistado || tituloConquistado === 'nenhum' || tituloConquistado !== titulo.nome.toLowerCase()) {
                await MessageService.send({ message: msg, text: `
═ *Título não conquistado!*

Você só pode equipar títulos que já pertencem ao seu personagem.
Use *!meus títulos* para consultar sua lista.
                ` });
                return;
            }
            
            // Aplicar buffs do título
            const buffs = titulo.efeitos || [];
            
            if (buffs.length === 0) {
                await MessageService.send({ message: msg, text: `
═ *Este título não possui efeitos especiais.*
                ` });
                return;
            }
            
            // Atualizar título equipado no banco
            db.run(
                'UPDATE jogadores SET titulo = ? WHERE numero = ?',
                [titulo.nome, numero],
                async (err) => {
                    if (err) {
                        console.error('Erro ao equipar título:', err);
                        await MessageService.send({ message: msg, text: '═ Erro ao equipar título.' });
                        return;
                    }
                    
                    // Mostrar mensagem de sucesso
                    let mensagem = `*═══ TÍTULO EQUIPADO! ═══*\n────────────────────────══\n\n`;
                    mensagem += `*${titulo.nome}*\n`;
                    mensagem += `Categoria: ${titulo.categoria}\n`;
                    mensagem += `Raridade: ${titulo.raridade}\n\n`;
                    mensagem += `*Efeitos aplicados:*\n`;
                    
                    for (const efeito of buffs) {
                        mensagem += `• ${efeito}\n`;
                    }
                    
                    mensagem += `\n────────────────────────══`;
                    mensagem += `\n_Os buffs foram aplicados automaticamente!_`;
                    
                    await MessageService.send({ message: msg, text: mensagem });
                }
            );
        }
    );
};
