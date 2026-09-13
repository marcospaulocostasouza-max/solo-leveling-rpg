/**
 * CONFIGURAÇÃO DE GRUPOS
 * 
 * IDs dos grupos oficiais do RPG.
 * Comandos podem ser usados em qualquer conversa.
 */

const GROUP_CONFIG = {
    // Grupo de fichas - Boas-vindas + imagem
    fichas: "120363427833722192@g.us",
    
    // Grupo de aprovação de fichas - ADM aprova aqui
    aprovacao: "120363426252648069@g.us",
    
    // Grupo principal de comandos - Tudo acontece aqui
    comandos: "120363427760363406@g.us",
    
    // Grupo ON - Cenas de treinos, missões, situações (exceto dungeon/eventos)
    on: "120363430150196736@g.us",
    
    // Grupo de Dungeon - Cenas de dungeon auto narrada, títulos, passivas
    dungeon: "120363410421054956@g.us",
    
    // Grupo da Loja - Compras de itens, Dungeons, qualquer tipo de compra
    loja: "120363427487563836@g.us",
    
    // Grupo de Minigames - Jogos e diversão
    minigames: "120363409545820778@g.us"
};

// Os IDs acima são destinos de avisos e organização, não restrições de uso.
function verificarGrupo() {
    return true;
}

module.exports = {
    GROUP_CONFIG,
    verificarGrupo
};
