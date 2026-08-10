const MessageService = require("../core/messageService");

/**
 * COMANDO: !avaliar ia
 * 
 * Usa a IA para analisar uma ficha e dar sugestões detalhadas.
 * Disponível para ADMs no grupo de aprovação.
 */

const db = require("../core/database");
const adminCore = require("../core/adminCore");
const arquiteto = require("../ia/arquiteturaIA");
const templates = require("../utils/templatesMensagens");

module.exports = async (msg) => {
    const numero = msg.author || msg.from;
    if (!await adminCore.isAdmin(numero)) {
        return MessageService.send({ message: msg, text: templates.acessoNegado() });
    }
    const args = msg.body.split(" ");
    const nomeJogador = args[2];
    
    if (!nomeJogador) {
        return MessageService.send({ message: msg, text: templates.erro("Especifique o nome do jogador.") + "\n_Ex: !avaliar ia Fichers_" });
    }
    
    // Buscar ficha pendente pelo nome do jogador (nos dados JSON)
    db.all("SELECT * FROM fichas_pendentes WHERE status = 'pendente' OR status = 'aguardando'", [], async (err, fichas) => {
        if (err || !fichas || fichas.length === 0) {
            return MessageService.send({ message: msg, text: templates.erro(`Nenhuma ficha pendente encontrada.`) });
        }
        
        // Procurar ficha pelo nome do jogador
        const nomeLower = nomeJogador.toLowerCase().trim();
        const ficha = fichas.find(f => {
            try {
                const dados = JSON.parse(f.dados || "{}");
                return (dados.nome || "").toLowerCase().trim().includes(nomeLower) || 
                       nomeLower.includes((dados.nome || "").toLowerCase().trim());
            } catch { return false; }
        });
        
        if (!ficha) {
            return MessageService.send({ message: msg, text: templates.erro(`Nenhuma ficha encontrada para: ${nomeJogador}`) });
        }
        
        const dados = JSON.parse(ficha.dados || "{}");
        
        // Analisar com IA
        const analise = await arquiteto.analisarFicha(dados);
        const habilidadeSugerida = arquiteto.gerarHabilidadeUnica(dados);
        const sugestoesAtributos = arquiteto.gerarSugestoesAtributos(dados);
        
        // Montar mensagem com template
        let mensagem = `*✦ ANÁLISE INTELIGENTE DE FICHA ✦*`;
        mensagem += `\n${templates.divisor()}`;
        mensagem += `\n${templates.campo("Jogador", dados.nome)}`;
        mensagem += `\n${templates.campo("Classe", dados.classe)}`;
        mensagem += `\n${templates.divisor()}`;
        
        // Status da análise
        if (analise.aprovacao) {
            mensagem += `\n${templates.sucesso(`ANÁLISE: APROVADO (Nota: ${analise.pontuacao.toFixed(0)}/100 - ${analise.notaFinal})`)}`;
        } else {
            mensagem += `\n${templates.aviso(`ANÁLISE: NECESSITA AJUSTES (Nota: ${analise.pontuacao.toFixed(0)}/100 - ${analise.notaFinal})`)}`;
        }
        
        mensagem += `\n${templates.divisor()}`;
        
        // Melhorias encontradas
        if (analise.melhorias.length > 0) {
            mensagem += `\n❖ *PONTOS POSITIVOS* ❖`;
            analise.melhorias.forEach(melhororia => {
                mensagem += `\n> ${melhororia}`;
            });
        }
        
        // Sugestões
        if (analise.sugestoes.length > 0) {
            mensagem += `\n${templates.divisor()}`;
            mensagem += `\n❖ *SUGESTÕES DE MELHORIA* ❖`;
            analise.sugestoes.forEach(sugestao => {
                mensagem += `\n> ${sugestao}`;
            });
        }
        
        // Sugestões de atributos
        if (sugestoesAtributos.length > 0) {
            mensagem += `\n${templates.divisor()}`;
            mensagem += `\n❖ *DISTRIBUIÇÃO DE ATRIBUTOS* ❖`;
            sugestoesAtributos.forEach(sugestao => {
                mensagem += `\n> ${sugestao}`;
            });
        }
        
        // Habilidade sugerida
        mensagem += `\n${templates.divisor()}`;
        mensagem += `\n❖ *HABILIDADE ÚNICA SUGERIDA* ❖`;
        mensagem += `\n> *Nome:* ${habilidadeSugerida.nome}`;
        mensagem += `\n> *Descrição:* ${habilidadeSugerida.descricao}`;
        mensagem += `\n> *Custo de Mana:* ${habilidadeSugerida.custoMana}`;
        mensagem += `\n> *Cooldown:* ${habilidadeSugerida.cooldown} turnos`;
        mensagem += `\n> *Dano:* ${habilidadeSugerida.dano}`;
        
        // Recomendação final
        mensagem += `\n${templates.divisor()}`;
        mensagem += `\n❖ *RECOMENDAÇÃO* ❖`;
        mensagem += `\n> ${analise.recomendacao}`;
        mensagem += `\n${templates.divisor()}`;
        
        await MessageService.send({ message: msg, text: mensagem });
    });
};
