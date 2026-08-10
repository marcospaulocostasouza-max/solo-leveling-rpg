const MessageService = require("../core/messageService");

/*
 * COMANDO: !ativar passiva [nome]
 * 
 * Ativa uma passiva para o jogador
 * Passivas podem ser acumulativas
 */

const passivas = require('../database/data/passivas.json');

module.exports = async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    
    // Verificar se é o comando de ativar passiva
    if (!texto.startsWith('!ativar passiva')) {
        return;
    }
    
    // Extrair o nome da passiva
    const nomePassiva = texto.replace('!ativar passiva', '').trim();
    
    if (!nomePassiva) {
        await MessageService.send({ message: msg, text: `
═ *Uso incorreto!*

Use: !ativar passiva [nome da passiva]

Exemplo: !ativar passiva Presença Calculado
        ` });
        return;
    }
    
    // Buscar passiva pelo nome
    const passiva = passivas.find(p => 
        p.nome.toLowerCase().includes(nomePassiva)
    );
    
    if (!passiva) {
        await MessageService.send({ message: msg, text: `
═ *Passiva não encontrada!*

Verifique se o nome está correto.
Use !passivas para ver todas as passivas disponíveis.
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
            
            // Buscar passivas ativas do jogador
            let passivasAtivas = [];
            try {
                passivasAtivas = jogador.passivas_ativas ? 
                    JSON.parse(jogador.passivas_ativas) : [];
            } catch (e) {
                passivasAtivas = [];
            }
            
            // Verificar se já tem esta passiva (máximo 10 acumulações)
            const passivasMesmoNome = passivasAtivas.filter(p => p.nome === passiva.nome);
            
            if (passivasMesmoNome.length >= 10) {
                await MessageService.send({ message: msg, text: `
═ *Limite de acumulação atingido!*

Você já tem ${passivasMesmoNome.length}x esta passiva.
Máximo: 10x
                ` });
                return;
            }
            
            // Adicionar passiva à lista
            const novaPassiva = {
                nome: passiva.nome,
                descricao: passiva.descricao,
                categoria: passiva.categoria,
                condicao: passiva.condicao,
                data_ativacao: new Date().toISOString()
            };
            
            passivasAtivas.push(novaPassiva);
            
            // Salvar no banco
            db.run(
                'UPDATE jogadores SET passivas_ativas = ? WHERE id = ?',
                [JSON.stringify(passivasAtivas), jogador.id],
                async (err) => {
                    if (err) {
                        console.error('Erro ao salvar passiva:', err);
                        await MessageService.send({ message: msg, text: '═ Erro ao ativar passiva.' });
                        return;
                    }
                    
                    // Mensagem de sucesso
                    const quantidade = passivasMesmoNome.length + 1;
                    
                    await MessageService.send({ message: msg, text: `
*═══ PASSIVA ATIVADA! ═══*
────────────────────────══

*${passiva.nome}*
Categoria: ${passiva.categoria}

*Descrição:*
${passiva.descricao}

*Condição:*
${passiva.condicao || 'Nenhuma'}

────────────────────────══
_Quantidade: ${quantidade}x_
_Total de passivas ativas: ${passivasAtivas.length}_
                    ` });
                }
            );
        }
    );
};