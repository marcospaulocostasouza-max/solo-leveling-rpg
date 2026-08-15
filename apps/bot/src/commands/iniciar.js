const MessageService = require("../core/messageService");

/**
 * COMANDO: !iniciar
 * 
 * Exibe mensagem de boas-vindas com comandos essenciais para criar ficha.
 * Lista apenas comandos básicos necessários para iniciar no RPG.
 */

const templates = require("../utils/templatesMensagens");

module.exports = async (msg) => {
    let mensagem = `*✦ BEM-VINDO AO SOLO LEVELING RPG ✦*\n\n`;
    mensagem += `Eu sou o *Arquiteto* e irei te ajudar a começar sua jornada!\n\n`;
    mensagem += `${templates.divisor()}\n\n`;
    
    mensagem += `❖ *📋 CRIAR FICHA* ❖\n`;
    mensagem += `> *!ficha* - Modelo de ficha para criar personagem\n`;
    mensagem += `> *!regras* - Regras do sistema RPG\n`;
    mensagem += `> *!classes* - Ver classes disponíveis\n`;
    mensagem += `> *!sortear afinidade* - Descobrir seu elemento\n`;
    mensagem += `> *!estilos de luta* - Ver estilos de luta disponíveis\n`;
    mensagem += `> *!armas iniciais* - Ver armas para começar\n`;
    mensagem += `\n${templates.divisor()}\n\n`;
    
    mensagem += `*COMO COMEÇAR:*\n`;
    mensagem += `1. Use *!ficha* para ver o modelo\n`;
    mensagem += `2. Preencha sua ficha seguindo as *!regras*\n`;
    mensagem += `3. Use *!sortear afinidade* para descobrir seu elemento\n`;
    mensagem += `4. Escolha uma *!classe* e *!estilos de luta*\n`;
    mensagem += `5. Envie com *!confirmar ficha*\n\n`;
    
    mensagem += `${templates.divisor()}\n\n`;
    mensagem += `_Boa sorte, Caçador!_\n`;
    mensagem += `_O sistema aguarda sua próxima ação._`;
    
    await MessageService.send({ message: msg, text: mensagem });
};
