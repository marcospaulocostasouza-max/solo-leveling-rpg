const MessageService = require("../core/messageService");

/**
 * COMANDO: !monarcas
 * 
 * Lista as classes dos Monarcas.
 */

module.exports = async (msg) => {
    const mensagem = `
*─ Sistema de Monarcas ♠️ ─*

No universo de Solo Leveling RPG, os Monarcas são entidades poderosas e enigmáticas, cada um com sua própria personalidade, ambições e visão de mundo. Encontrar um Monarca é um evento raro e memorável, que ocorre apenas durante momentos cruciais da história principal ou em DLCs exclusivas. Cada Monarca possui uma classe avançada base e raças, e pode nomear um Sucessor para continuar seu legado.

══════════════════════════

*CLASSES DOS MONARCAS*

*Classe Geral*
Monarca dos Glacinatas [Hrymir]
Monarca da Caca [Freyr]

*Tank*
Monarca do Azar [Paladino] | Monarca do Sacrificio [Escudeiro]
Monarca do Desafio [Uthabiti] | Monarca do Nucleo [Morax]
Monarca das Presas [Berserker] | Monarca do Corpo de Ferro [Heroi do Escudo]
Monarca do Caos [Construtor]

*Assassino*
Monarca dos Mares [Corsario] | Monarca da Paciencia [Shinobi]
Monarca da Vida [Thanakir] | Monarca dos Abyssais [Pneuma-ousia]
Monarca da Morte [Lamina Sombria] | Monarca do Amor [Heroi da Lanca]
Monarca dos Cavaleiros [Dancarino das Espadas] | Monarca do Espaco [Nidhogg]

*Ranger*
Monarca do Fim [Palhaco] | Monarca da Verdade [Ardito]
Monarca das Trevas [Raijin] | Monarca da Gloria [Harmonic]
Monarca da Guerra [Rastreadores] | Monarca dos Combates [Andarilho]
Monarca dos Herois [Heroi do Arco]

*Healer*
Monarca do Futuro [Oraculo] | Monarca das Estrelas [Estigmas]
Monarca do Dia [Nazhir] | Monarca da Pureza [Calamitas]
Monarca da Fome [Chefe] | Monarca das Pragas [Apotecario]
Monarca da Loucura [Musico] | Monarca da Ordem [Luz]

*Lutador*
Monarca das Copas [Inquisidor] | Monarca do Ouro [Esgrimista]
Monarca da Noite [Noktal] | Monarca da Retencao [Traveler]
Monarca da Piedade [Espadachim] | Monarca das Chamas Brancas [Heroi da Espada]
Monarca da Destruicao [Monge] | Monarca do Derramamento [Viking]

*Mago Geral*
Monarca da Dadiva [Grande Mago] | Monarca da Divindade [Feiticeiro]
Monarca do Passado [Druida] | Monarca da Transmutacao [Alquimista]

*Elemental*
Monarca do Cataclismo [Catalys]
Monarca de Gelo/Fogo/Agua/Terra/Planta/Raios [Archon]
Monarca do Defensor [Warden]

*Barreira/Maldicao/Invocador*
Monarca dos Shikigamis [Taoista] | Monarca do Presente [Sabio]
Monarca da Ascencao [Onmyouji] | Monarca das Runas [Runico]
Monarca do Inicio [Arcanista] | Monarca da Ruptura [Taumaturgo]
Monarca dos Mortos [Bokor] | Monarca das Sombras [Necromante]
Monarca do Vazio [Escuridao] | Monarca da Mecanica [Ignicao]
Monarca da Transfiguracao [Domador] | Monarca do Desejo [Bruxo]
    `;
    
    await MessageService.send({ message: msg, text: mensagem });
};