const MessageService = require("../core/messageService");

/**
 * COMANDO: !darius_kwon
 * 
 * Exibe a ficha completa do NPC Darius Kwon.
 */

const NPCManager = require("../npc/npcManager");

module.exports = async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    
    const npc = NPCManager.carregarNPC("darius_kwon");
    
    if (!npc) {
        return MessageService.send({ message: msg, text: "*✖ NPC não encontrado.*" });
    }
    
    if (texto === "!darius_kwon ficha" || texto === "!darius_kwon ficha completa") {
        let mensagem = `*═══ FICHA DE DARIUS KWON ═══*
`;
        mensagem += `──────────────────────────

`;
        mensagem += `*IDENTIDADE*
`;
        mensagem += `> *Nome:* ${npc.nome}
`;
        mensagem += `> *Título:* ${npc.titulo}
`;
        mensagem += `> *Papel:* ${npc.papel}
`;
        mensagem += `> *Idade:* ${npc.idade}
`;
        mensagem += `> *Nacionalidade:* ${npc.nacionalidade}
`;
        mensagem += `> *Localização:* ${npc.localizacao}

`;
        mensagem += `*APARÊNCIA*
`;
        mensagem += `> ${npc.aparencia}
`;
        mensagem += `> *Altura/Peso:* ${npc.altura_peso}

`;
        mensagem += `*PERSONALIDADE*
`;
        mensagem += `> ${npc.personalidade}

`;
        mensagem += `*HISTÓRIA*
`;
        mensagem += `> ${npc.historia}

`;
        mensagem += `*CLASSE*
`;
        mensagem += `> *Classe:* ${npc.classe}
`;
        mensagem += `> *Classe Avançada:* ${npc.classe_avancada}
`;
        mensagem += `> *Rank:* ${npc.rank} | *Nível:* ${npc.nivel}
`;
        mensagem += `> *Elemento:* ${npc.elemento}

`;
        mensagem += `*ATRIBUTOS*
`;
        mensagem += `> *Força:* ${npc.atributos.forca}
`;
        mensagem += `> *Resistência:* ${npc.atributos.resistencia}
`;
        mensagem += `> *Velocidade:* ${npc.atributos.velocidade}
`;
        mensagem += `> *Sentidos:* ${npc.atributos.sentidos}
`;
        mensagem += `> *Inteligência:* ${npc.atributos.inteligencia}
`;
        mensagem += `> *Poder Mágico:* ${npc.atributos.poder_magico}

`;
        mensagem += `*HABILIDADE ÚNICA*
`;
        mensagem += `> ${npc.habilidade_unica}

`;
        mensagem += `*TÉCNICAS*
`;
        (npc.tecnicas || []).forEach(t => {
            mensagem += `> ✦ ${t}
`;
        });
        mensagem += `
──────────────────────────
`;
        mensagem += `_Para conversar com ${npc.nome}, use:_
`;
        mensagem += `> !${npc.id}
`;
        mensagem += `> Sua mensagem aqui`;
        
        await MessageService.send({ message: msg, text: mensagem });
        return;
    }
    
    let mensagem = `*═══ ${npc.nome.toUpperCase()} ═══*
`;
    mensagem += `──────────────────────────

`;
    mensagem += `*"${npc.titulo}"*

`;
    mensagem += `*Papel:* ${npc.papel}
`;
    mensagem += `*Classe:* ${npc.classe}
`;
    mensagem += `*Classe Avançada:* ${npc.classe_avancada}
`;
    mensagem += `*Rank:* ${npc.rank} | *Nível:* ${npc.nivel}
`;
    mensagem += `*Elemento:* ${npc.elemento}

`;
    mensagem += `*Aparência:*
`;
    mensagem += `> ${npc.aparencia}

`;
    mensagem += `*Personalidade:*
`;
    mensagem += `> ${npc.personalidade}

`;
    mensagem += `*Habilidade Única:*
`;
    mensagem += `> ${npc.habilidade_unica}

`;
    mensagem += `*Técnicas:*
`;
    (npc.tecnicas || []).forEach(t => {
        mensagem += `> ✦ ${t}
`;
    });
    mensagem += `
──────────────────────────
`;
    mensagem += `*Comandos:*
`;
    mensagem += `> !${npc.id} ficha - Ficha completa
`;
    mensagem += `> !${npc.id} conversar - Conversar com o NPC
`;
    mensagem += `
_Para conversar, envie:_
`;
    mensagem += `> !${npc.id}
`;
    mensagem += `> Sua mensagem aqui`;
    
    await MessageService.send({ message: msg, text: mensagem });
};
