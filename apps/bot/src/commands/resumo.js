const MessageService = require("../core/messageService");

/**
 * COMANDO: !resumo
 * 
 * Mostra resumo da ficha do jogador e lista todos os comandos disponíveis.
 * Após ficha aprovada, exibe comandos específicos da classe.
 */

const db = require("../core/database");

module.exports = async (msg) => {
    const numeroJogador = msg.author || msg.from;
    
    // Buscar dados do jogador
    db.get(`SELECT * FROM jogadores WHERE numero = ?`, [numeroJogador], async (err, jogador) => {
        if (err) {
            await MessageService.send({ message: msg, text: "*✖ Erro ao buscar dados.*" });
            return;
        }
        
        if (!jogador) {
            await MessageService.send({ message: msg, text: "*✖ Você não possui ficha aprovada.*\n> Use !ficha para criar sua ficha." });
            return;
        }
        
        let mensagem = `
*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*
*📋 RESUMO DA FICHA*
*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*

*Nome:* ${jogador.nome || "Não definido"}
*Classe:* ${jogador.classe || "Não definida"}
*Nível:* ${jogador.nivel || 1}
*Maestria:* ${jogador.maestria || 0}

`;

        // Se aprovada, mostrar comandos específicos
        if (jogador.aprovado) {
            const classeJogador = jogador.classe || "";
            
            mensagem += `*━━━ COMANDOS DISPONÍVEIS ━━━*\n\n`;
            
            // Comandos básicos (sempre disponíveis)
            mensagem += `*📖 INFORMAÇÕES*\n`;
            mensagem += `> !ficha - Ver sua ficha\n`;
            mensagem += `> !inventario / !inv - Ver itens\n`;
            mensagem += `> !atributos - Ver atributos\n`;
            mensagem += `> !tecnicas - Lista todas técnicas\n\n`;
            
            // Comandos de classe
            mensagem += `*⚔️ TÉCNICAS DE CLASSE*\n`;
            
            // Comando para ver técnicas da classe atual
            const classeCmd = classeJogador.toLowerCase().replace(/ /g, '_');
            mensagem += `> !${classeCmd} - Ver técnicas de ${classeJogador}\n`;
            
            // Comandos específicos por classe
            if (classeJogador.includes("Lutador") || classeJogador === "Lutador") {
                mensagem += `> !punhos / !manopla / !kanabo / !espadão - Ver técnicas do estilo\n`;
            } else if (classeJogador.includes("Assassino")) {
                mensagem += `> !foice / !kusarigama / !adaga / !katana - Ver técnicas do estilo\n`;
            } else if (classeJogador.includes("Ranger")) {
                mensagem += `> !arco / !faca / !pistola / !espingarda / !fuzil / !sniper - Ver técnicas da arma\n`;
            }
            
            mensagem += `> !comprar tecnica <nome> - Comprar técnica\n\n`;
            
            // Comando de avanço (se nível 40+)
            if (jogador.nivel >= 40) {
                mensagem += `*⭐ EVOLUÇÃO (Nível 40+)*\n`;
                mensagem += `> !avanco - Ver classes avançadas disponíveis\n\n`;
            }
            
            // Comandos gerais
            mensagem += `*🎮 GERAL*\n`;
            mensagem += `> !saldo - Consultar Yulls e Maestria\n`;
            mensagem += `> !abrir loja / !itens - Ver itens\n`;
            mensagem += `> !dado - Rolar dado\n`;
            mensagem += `> !iniciar - Ver todos comandos\n\n`;
            
            mensagem += `*━━━ COMO CONSULTAR TÉCNICAS ━━━*\n\n`;
            mensagem += `1. Use *!<nome da classe>* para ver lista\n`;
            mensagem += `   Exemplo: !assassino\n\n`;
            mensagem += `2. Use *!<nome da técnica>* para ver detalhes\n`;
            mensagem += `   Exemplo: !esfera de raio\n\n`;
            mensagem += `3. Use *!comprar tecnica <nome>* para comprar\n`;
            mensagem += `   Exemplo: !comprar tecnica esfera_de_raio\n`;
            
        } else {
            mensagem += `*⏳ AGUARDANDO APROVAÇÃO*\n\n`;
            mensagem += `Sua ficha está em análise.\n`;
            mensagem += `Aguarde um administrador aprovar.\n\n`;
            mensagem += `*Comandos disponíveis:*\n`;
            mensagem += `> !ficha - Ver sua ficha\n`;
            mensagem += `> !regras - Ver regras\n`;
            mensagem += `> !classes - Ver classes\n`;
            mensagem += `> !iniciar - Ver todos comandos\n`;
        }
        
        mensagem += `\n*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*\n`;
        mensagem += `_Sistema Online_`;
        
        await MessageService.send({ message: msg, text: mensagem });
    });
};
