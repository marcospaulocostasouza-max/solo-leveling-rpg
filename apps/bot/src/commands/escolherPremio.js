const MessageService = require('../core/messageService');
const JogadorCore = require('../core/jogadorCore');
const DungeonInstanciadaSystem = require('../systems/dungeonInstanciadaSystem');
module.exports = async msg => {
    const responder = text => MessageService.send({ message: msg, text });
    try {
        const jogador = await JogadorCore.buscarPorNumero(msg.author || msg.from);
        if (!jogador) return responder('Jogador não encontrado. Crie sua ficha com !ficha.');
        const texto = String(msg.body || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const match = texto.match(/!escolho(?:\s+(?:a\s+)?opcao)?(?:\s+numero)?\s+(\d+)/);
        if (!match) return responder('Use !Escolho número X, com uma opção de 1 a 5.');
        const opcao = Number(match[1]);
        const dungeonId = texto.match(/\bdungeon\s+#?(\d+)\b/)?.[1];
        let fichaId = Number(dungeonId);
        if (!dungeonId) {
            const pendentes = await DungeonInstanciadaSystem.getFichasPendentesParaPremio(jogador.id);
            if (pendentes.length > 1) return responder(`Você tem prêmios pendentes em mais de uma dungeon:\n${pendentes.map(f => `#${f.id} — ${f.dungeon_nome}`).join('\n')}\nUse !Escolho número ${opcao} dungeon ID.`);
            if (!pendentes.length) return responder('Você não tem prêmio pendente. Consulte !premios dungeon.');
            fichaId = pendentes[0].id;
        }
        const resultado = await DungeonInstanciadaSystem.escolherPremio(fichaId, jogador.id, opcao);
        return responder(resultado.erro || resultado.mensagem);
    } catch (error) {
        console.error('Erro no comando !Escolho:', error);
        return responder('Não foi possível entregar o prêmio. Tente novamente; nenhuma escolha foi confirmada.');
    }
};
