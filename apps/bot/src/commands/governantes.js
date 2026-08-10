const MessageService = require("../core/messageService");

/**
 * COMANDO: !governantes
 * 
 * Lista dos Governantes e suas características.
 * Governantes são entidades superiores ligadas à Ordem.
 */

const governantes = [
  { nome: "Governante da Purificação", elemento: "Água", tema: "Purificação" },
  { nome: "Governante do Sol", elemento: "Fogo", tema: "Sol" },
  { nome: "Governante da Paz", elemento: "Vento", tema: "Paz" },
  { nome: "Governante da Fé", elemento: "Terra", tema: "Fé" },
  { nome: "Governante do Céu", elemento: "Raio", tema: "Céu" },
  { nome: "Governante da Luz", elemento: "Luz", tema: "Cura" },
  { nome: "Governante da Natureza", elemento: "Planta", tema: "Natureza" },
  { nome: "Governante dos Jogos", elemento: "Luz", tema: "Sorte" },
  { nome: "Governante da Alma", elemento: "Sombras", tema: "Alma" },
  { nome: "Governante da Justiça", elemento: "Luz", tema: "Justiça" },
  { nome: "Governante dos Sonhos", elemento: "Luz e Sombra", tema: "Sonhos" },
  { nome: "Governante das Bestas", elemento: "Água, Vento, Terra, Luz", tema: "Bestas" },
  { nome: "Governante da Gravidade", elemento: "Sombra", tema: "Gravidade" },
  { nome: "Governante do Sangue", elemento: "Água, Sombra", tema: "Sangue" },
  { nome: "Governante das Máquinas", elemento: "Terra, Luz, Sombra", tema: "Máquinas" },
  { nome: "Governante do Som", elemento: "Sombra e Luz", tema: "Som" }
];

module.exports = async (msg) => {
    const args = msg.body.split(" ");
    const subcomando = args[1] ? args.slice(1).join(" ").toLowerCase() : "listar";
    
    if (subcomando === "listar") {
        let mensagem = `*─ Governantes 💫 ─*
        
Os Governantes são entidades superiores ligadas à Ordem, responsáveis por manter o equilíbrio do mundo. Cada Governante possui um elemento e tema específicos, e concede poderes únicos aos Fragmentos que os servem. Existem 16 Governantes, cada um com características próprias.

══════════════════════════

*GOVERNANTES*\n`;
        mensagem += "═".repeat(30) + "\n\n";
        
        governantes.forEach(g => {
            mensagem += `*${g.nome}*\n`;
            mensagem += `> Elemento: ${g.elemento}\n`;
            mensagem += `> Tema: ${g.tema}\n\n`;
        });
        
        mensagem += "_Fragmentos podem servir a estes governantes._";
        await MessageService.send({ message: msg, text: mensagem });
    } else {
        const gov = governantes.find(g => g.nome.toLowerCase().includes(subcomando));
        if (!gov) return MessageService.send({ message: msg, text: "*✖ Governante nao encontrado.*" });
        
        await MessageService.send({ message: msg, text: `
*${gov.nome}*
═${"═".repeat(20)}
Elemento: ${gov.elemento}
Tema: ${gov.tema}
        ` });
    }
};