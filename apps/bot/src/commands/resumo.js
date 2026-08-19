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
            
            // Comandos específicos por estilo de luta da ficha
            const estiloLuta = jogador.estilo_luta || "";
            const estiloNormalizado = String(estiloLuta).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            
            if (estiloNormalizado.includes("adaga")) {
                mensagem += `> !adaga - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("faca")) {
                mensagem += `> !faca - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("espadas pesadas duplas")) {
                mensagem += `> !espadas pesadas duplas - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("espadas pesadas") || estiloNormalizado.includes("espadao") || estiloNormalizado.includes("espadão")) {
                mensagem += `> !espadas pesadas - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("espada")) {
                mensagem += `> !espadas - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("kanabo")) {
                mensagem += `> !kanabo - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("katana")) {
                mensagem += `> !katana - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("lanca")) {
                mensagem += `> !lança - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("cajado") || estiloNormalizado.includes("orbe") || estiloNormalizado.includes("grimorio")) {
                mensagem += `> !cajado - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("arco")) {
                mensagem += `> !arco - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("pistola")) {
                mensagem += `> !pistola - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("escopeta") || estiloNormalizado.includes("espingarda")) {
                mensagem += `> !escopeta - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("fuzil")) {
                mensagem += `> !fuzil - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("rifle") || estiloNormalizado.includes("sniper")) {
                mensagem += `> !rifle de precisao - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("desarmado") || estiloNormalizado.includes("punho") || estiloNormalizado.includes("marcia")) {
                mensagem += `> !punhos - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("escudo")) {
                mensagem += `> !escudo - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("foice")) {
                mensagem += `> !foice - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("corrente")) {
                mensagem += `> !correntes - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("machado")) {
                mensagem += `> !machado - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("martelo")) {
                mensagem += `> !martelo - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("chicote")) {
                mensagem += `> !chicote - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("manopla")) {
                mensagem += `> !manopla - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("besta")) {
                mensagem += `> !besta - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("bumerangue")) {
                mensagem += `> !bumerangue - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("arremesso")) {
                mensagem += `> !faca - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("garra")) {
                mensagem += `> !garras - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("sabre")) {
                mensagem += `> !sabre - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("tridente")) {
                mensagem += `> !tridente - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("clava")) {
                mensagem += `> !clava - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("florete")) {
                mensagem += `> !florete - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("chakram")) {
                mensagem += `> !chakram - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("luva")) {
                mensagem += `> !luvas - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("mangual")) {
                mensagem += `> !mangual - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("alabarda")) {
                mensagem += `> !alabarda - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("nunchaku")) {
                mensagem += `> !nunchaku - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("tonfa")) {
                mensagem += `> !tonfa - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("kama")) {
                mensagem += `> !kama - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("rapieira")) {
                mensagem += `> !rapieira - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("baculo")) {
                mensagem += `> !báculo - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("cimitarra")) {
                mensagem += `> !cimitarra - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("picareta")) {
                mensagem += `> !picareta - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("bastao") || estiloNormalizado.includes("bastão")) {
                mensagem += `> !bastão - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("funda")) {
                mensagem += `> !funda - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("lamina") || estiloNormalizado.includes("lâmina")) {
                mensagem += `> !lâminas duplas - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("kusarigama") || estiloNormalizado.includes("corrente") && estiloNormalizado.includes("foice")) {
                mensagem += `> !kusarigama - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("leque")) {
                mensagem += `> !leques - Ver técnicas de ${estiloLuta}\n`;
            } else if (estiloNormalizado.includes("instrumento")) {
                mensagem += `> !instrumentos - Ver técnicas de ${estiloLuta}\n`;
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
