const MessageService = require("../core/messageService");

/**
 * COMANDO: !avanco
 * 
 * Mostra as opções de classes avançadas disponíveis para a classe atual do jogador.
 * Cada classe inicial tem opções específicas de evolução.
 */

const db = require("../core/database");
const advancedTechniques = require("../tecnicas/avancadas/techniques");

module.exports = async (msg) => {
    const numeroJogador = msg.author || msg.from;
    
    // Buscar jogador no banco
    db.get(`SELECT classe, nivel FROM jogadores WHERE numero = ?`, [numeroJogador], async (err, jogador) => {
        if (err) {
            await MessageService.send({ message: msg, text: "*✖ Erro ao buscar dados.*" });
            return;
        }
        
        if (!jogador) {
            await MessageService.send({ message: msg, text: "*✖ Você precisa ter uma ficha aprovada para usar este comando.*\n> Use !ficha para criar sua ficha." });
            return;
        }
        
        const classeJogador = jogador.classe || "Sem classe";
        const nivelJogador = jogador.nivel || 1;
        
        // Mapeamento de classes iniciais para classes avançadas disponíveis
        const mapaEvolucao = {
            "Lutador": ["Berserk", "Herói do Escudo", "Paladino", "Viking", "Morax", "Uthabiti"],
            "Assassino": ["Lâmina Sombria", "Sword Dancer", "Shinobi", "Thanakir", "Corsário", "Esgrimista"],
            "Tanker": ["Herói do Escudo", "Escudeiro", "Morax", "Uthabiti", "Viking", "Paladino"],
            "Ranger": ["Rastreador", "Herói do Arco", "Andarilho", "Ardito", "Harmonic", "Raijin"],
            "Curador": ["Apotecário", "Músico", "Paladino", "Oráculo", "Chefe", "Freyr"],
            "Mago de Água": ["Pneuma-Ousia", "Mago de Luz", "Grande Mago", "Archon", "Catalys", "Freyr"],
            "Mago de Fogo": ["Necromante", "Mago de Ignição", "Grande Mago", "Archon", "Nidhogg", "Calamitas"],
            "Mago de Gelo": ["Mago de Luz", "Arcanista", "Grande Mago", "Archon", "Warden", "Sábio"],
            "Mago de Terra": ["Morax", "Taumaturgo", "Arcanista", "Grande Mago", "Archon", "Domador"],
            "Mago de Vento": ["Herói do Arco", "Rastreador", "Andarilho", "Sábio", "Archon", "Raijin"],
            "Mago de Raio": ["Mago de Ignição", "Raijin", "Grande Mago", "Archon", "Nazhir", "Estigmas"],
            "Mago Invocador": ["Domador", "Onmyouji", "Warden", "Bruxo", "Grande Mago", "Arcanista"],
            "Mago de Barreira": ["Nazhir", "Escudeiro", "Arcanista", "Grande Mago", "Archon", "Taumaturgo"],
            "Mago de Maldição": ["Bruxo", "Bokor", "Necromante", "Warden", "Estigmas", "Archon"]
        };
        
        const classesDisponiveis = mapaEvolucao[classeJogador] || [];
        
        if (classesDisponiveis.length === 0) {
            await MessageService.send({ message: msg, text: `
*✖ CLASSE SEM EVOLUÇÃO*

_*${classeJogador}*_ ainda não possui evoluções disponíveis.

_Nível atual:_ ${nivelJogador}
_Requerido:_ Nível 40 para primeira evolução
            ` });
            return;
        }
        
        let mensagem = `
*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*
*⚔️ EVOLUÇÃO DE CLASSE*
*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*

*Classe Atual:* ${classeJogador}
*Nível:* ${nivelJogador}

`;
        
        if (nivelJogador < 40) {
            mensagem += `⚠️ *_Atenção:_* Você precisa de *_Nível 40_* para evoluir!\n`;
            mensagem += `_Faltam ${40 - nivelJogador} níveis._\n\n`;
        }
        
        mensagem += `*━━━ OPÇÕES DE EVOLUÇÃO ━━━*\n\n`;
        
        classesDisponiveis.forEach((classeAvancada, index) => {
            const tecnicas = advancedTechniques[classeAvancada] || [];
            const quantidadeTecnicas = tecnicas.length;
            
            mensagem += `*${index + 1}. ${classeAvancada.toUpperCase()}*\n`;
            mensagem += `> *Técnicas:* ${quantidadeTecnicas} disponíveis\n`;
            mensagem += `> *Requisito:* Nível 40+\n`;
            mensagem += `> *Use:* !${classeAvancada.toLowerCase().replace(/ /g, '_')} para ver técnicas\n\n`;
        });
        
        mensagem += `*━━━ COMO FUNCIONA ━━━*\n\n`;
        mensagem += `1. Escolha uma classe avançada acima\n`;
        mensagem += `2. Use *!<nome da classe>* para ver suas técnicas\n`;
        mensagem += `3. Exemplo: *!berserk* para ver técnicas do Berserk\n\n`;
        
        mensagem += `*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*\n`;
        mensagem += `_Boa sorte na sua evolução, Caçador!_`;
        
        await MessageService.send({ message: msg, text: mensagem });
    });
};