const MessageService = require("../core/messageService");

const { GROUP_CONFIG } = require("../core/groupConfig");

const nomesGrupos = {
    [GROUP_CONFIG.fichas]: "📋 Fichas",
    [GROUP_CONFIG.aprovacao]: "✅ Aprovação",
    [GROUP_CONFIG.comandos]: "⚙️ Comandos",
    [GROUP_CONFIG.on]: "🎭 ON (Treinos/Missões)",
    [GROUP_CONFIG.dungeon]: "🏰 Dungeon",
    [GROUP_CONFIG.loja]: "🛒 Loja",
    [GROUP_CONFIG.minigames]: "🎮 Minigames"
};

function gerarMapaGrupos() {
    const comandosGlobais = ["!ficha", "!jogador", "!regras", "!classes", "!iniciar"];
    
    const mapa = {};
    Object.values(GROUP_CONFIG).forEach(id => {
        mapa[id] = [];
    });
    
    const mapeamento = {
        [GROUP_CONFIG.fichas]: [
            "!ficha", "!sortear afinidade", "!confirmar ficha",
            "!estilos de luta", "!armasiniciais", "!armas iniciais",
            "!classes", "!regras", "!afinidades"
        ],
        [GROUP_CONFIG.aprovacao]: [
            "!avaliar ficha", "!aprovar ficha", "!recusar ficha",
            "!ver fila", "!avaliar ia"
        ],
        [GROUP_CONFIG.dungeon]: ["!dungeon", "!dungeon auto"],
        [GROUP_CONFIG.loja]: [
            "!loja virtual", "!drops", "!abrir loja", "!comprar", "!confirmar compra", "!comprar tecnica", "!comprar técnica"
        ],
        [GROUP_CONFIG.on]: [
            "!missao", "!batalha"
        ],
        [GROUP_CONFIG.minigames]: ["!minigame"],
        [GROUP_CONFIG.comandos]: [
            "!iniciar", "!jogador", "!atributos", "!inventario", "!inv",
            "!equipar", "!usar", "!tecnicas", "!técnicas", "!classes",
            "!classe avancada", "!classe avançada", "!passivas", "!titulos",
            "!minhas técnicas", "!minhas passivas", "!nivel", "!level", "!ranking", "!rank", "!mvp",
            "!guilda", "!territorio", "!local", "!investimento", "!calcularbuff",
            "!portais", "!bigorna", "!fermentacao", "!encantamento", "!dlc",
            "!token", "!materiais", "!penalidade", "!membroa", "!cargosa",
            "!guerra", "!pontuacao", "!unicos", "!hp", "!mineracao", "!arena",
            "!fragmento", "!governante", "!submundo", "!nucleo", "!sucessor",
            "!monarca", "!meus titulos", "!equipar titulo", "!equipar título",
            "!npc", "!peatz", "!skills", "!loja virtual", "!drops", "!ascensão", "!ascensao", "!associações", "!associacoes", "!biblioteca", "!história", "!historia", "!acervo", "!listar npcs", "!amizade", "!fim de interação", "!fim de interacao",
            "!olá bilac", "!ola bilac", "!olá vysache", "!ola vysache", "!preciso de um item", "!pode sim",
            "!comprar tecnica", "!comprar técnica", "!abrir dungeon", "!dado",
            "!armasiniciais", "!armas iniciais", "!itens", "!abrir loja", "!distribuir",
            "!arquitetura", "!dado", "!caixa", "!missao",
            "!batalha", "!regeneração", "!dungeon", "!dungeon auto"
        ]
    };
    
    Object.entries(mapeamento).forEach(([grupoId, cmd]) => {
        mapa[grupoId] = cmd;
    });
    
    return { mapa, comandosGlobais };
}

module.exports = async (msg) => {
    const { mapa, comandosGlobais } = gerarMapaGrupos();
    
    let mensagem = `*═══ COMANDOS POR GRUPO ═══*\n`;
    mensagem += `Consulte aqui onde cada comando pode ser usado.\n\n`;
    
    mensagem += `*─── Comandos Globais ───*\n`;
    mensagem += `_(Funcionam em qualquer grupo)_\n`;
    comandosGlobais.forEach(cmd => {
        mensagem += `> ${cmd}\n`;
    });
    mensagem += `\n──────────────────────────\n\n`;
    
    Object.entries(nomesGrupos).forEach(([grupoId, nomeGrupo]) => {
        const comandos = mapa[grupoId] || [];
        mensagem += `*${nomeGrupo}*\n`;
        
        if (comandos.length === 0) {
            mensagem += `> *Nenhum comando registrado*\n`;
        } else {
            comandos.forEach(cmd => {
                mensagem += `> ${cmd}\n`;
            });
        }
        
        mensagem += `\n──────────────────────────\n\n`;
    });
    
    mensagem += `_Use !comandos grupo para ver esta mensagem novamente._`;
    
    await MessageService.send({ message: msg, text: mensagem });
};
