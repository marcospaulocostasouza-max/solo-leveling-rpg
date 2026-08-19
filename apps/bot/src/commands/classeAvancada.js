const MessageService = require("../core/messageService");

/**
 * SISTEMA DE CLASSE AVANÇADA
 * 
 * Regras:
 * - Nível 40 é o máximo sem classe avançada
 * - XP fica estagnado até escolher classe avançada
 * - A quest só é criada quando o jogador inicia com !iniciar quest classe avançada
 * - Comandos: !iniciar quest classe avançada, !escolher classe avançada, !quero <classe>
 */

const db = require("../core/database");
const AdvancedClassSystem = require("../systems/advancedClassSystem");
const AtributoSystem = require("../systems/atributoSystem");

module.exports = async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    const numero = msg.author || msg.from;
    
    // Buscar jogador
    const jogador = await new Promise((resolve) => {
        db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], (err, row) => {
            resolve(row);
        });
    });
    
    if (!jogador) {
        return MessageService.send({ message: msg, text: "*✖ Você precisa ter uma ficha aprovada primeiro.*" });
    }
    
    const nivel = jogador.nivel || 1;
    const classeAtual = jogador.classe || "";
    const classeAvancada = jogador.classe_avancada || "";
    
    // =====================================
    // VERIFICAR SE JÁ TEM CLASSE AVANÇADA
    // =====================================
    if (classeAvancada && classeAvancada !== "Nenhuma" && classeAvancada !== "BLOQUEADO") {
        return MessageService.send({ message: msg, text: `*═══ CLASSE AVANÇADA JÁ ESCOLHIDA ═══*
──────────────────────────

> Você já possui a classe avançada: *${classeAvancada}*

_Não é possível escolher outra classe avançada._` });
    }
    
    // Buscar quest de classe avançada (se houver)
    const quest = await new Promise((resolve) => {
        db.get("SELECT * FROM missoes WHERE jogador_id = ? AND tipo = 'classe_avancada' AND status = 'ativa' ORDER BY id DESC LIMIT 1", [jogador.id], (err, row) => {
            resolve(row);
        });
    });
    
    // =====================================
    // !INICIAR QUEST CLASSE AVANÇADA
    // =====================================
    if (texto === "!iniciar quest classe avançada" || texto === "!iniciar quest classe avancada") {
        if (nivel < 40) {
            return MessageService.send({ message: msg, text: "*✖ Você precisa estar no nível 40 para iniciar a quest de classe avançada.*" });
        }
        
        // Se já tem classe avançada escolhida
        if (classeAvancada && classeAvancada !== "Nenhuma" && classeAvancada !== "BLOQUEADO") {
            return MessageService.send({ message: msg, text: `*✖ Você já possui a classe avançada ${classeAvancada}.*` });
        }
        
        // Verificar se já tem quest ativa (só deve criar quando o player inicia)
        if (quest) {
            // Limpar quests antigas duplicadas e criar uma unica quest ativa
            await new Promise((resolve) => {
                db.run(
                    "DELETE FROM missoes WHERE jogador_id = ? AND tipo = 'classe_avancada' AND status = 'ativa'",
                    [jogador.id],
                    () => resolve()
                );
            });
        }
        
        // Criar quest SOMENTE agora (quando o jogador inicia)
        const dataAtual = new Date().toISOString();
        const questCriada = await new Promise((resolve) => {
            db.run(
                `INSERT INTO missoes (jogador_id, nome, descricao, tipo, status, data) VALUES (?, ?, ?, ?, ?, ?)`,
                [jogador.id, "Quest de Classe Avançada", "Escolher e evoluir para uma classe avançada", "classe_avancada", "ativa", dataAtual],
                (err) => resolve(!err)
            );
        });

        if (!questCriada) {
            return MessageService.send({ message: msg, text: "*✖ Não foi possível registrar a Quest de Classe Avançada. Tente novamente mais tarde.*" });
        }
        
        // Marcar como bloqueado (aguardando escolha)
        const jogadorBloqueado = await new Promise((resolve) => {
            db.run("UPDATE jogadores SET classe_avancada = ? WHERE id = ?", ["BLOQUEADO", jogador.id], (err) => resolve(!err));
        });

        if (!jogadorBloqueado) {
            await new Promise(resolve => db.run(
                "DELETE FROM missoes WHERE jogador_id = ? AND tipo = 'classe_avancada' AND status = 'ativa'",
                [jogador.id],
                () => resolve()
            ));
            return MessageService.send({ message: msg, text: "*✖ A quest foi criada, mas não foi possível bloquear o avanço do jogador. A operação foi desfeita; tente novamente.*" });
        }
        
        return MessageService.send({ message: msg, text: `*═══ QUEST INICIADA ═══*
──────────────────────────

*Seu personagem foi analisado.*

Você gostaria de prosseguir para a escolha da classe avançada?

Use o comando: *!escolher classe avançada*

_Seu avanço está trancado até concluir esta quest._` });
    }
    
    // =====================================
    // !ESCOLHER CLASSE AVANÇADA
    // =====================================
    if (texto === "!escolher classe avançada" || texto === "!escolher classe avancada") {
        // Verificar se tem quest ativa
        if (!quest) {
            return MessageService.send({ message: msg, text: "*✖ Você precisa iniciar a quest primeiro com !iniciar quest classe avançada*" });
        }
        
        // Buscar classes avançadas disponíveis para a classe atual (usa AdvancedClassSystem)
        const classesDisponiveis = AdvancedClassSystem.getClassesDisponiveis(jogador);
        
        if (classesDisponiveis.length === 0) {
            return MessageService.send({ message: msg, text: `*✖ NENHUMA CLASSE AVANÇADA DISPONÍVEL*
──────────────────────────

> Classe atual: *${classeAtual}*

Você não atende aos requisitos mínimos das classes avançadas da sua classe.
Fortaleça seus atributos e consulte novamente para liberar novas opções.` });
        }
        
        let mensagem = `
*═══ ESCOLHA SUA CLASSE AVANÇADA ═══*

*Seu personagem foi analisado.*

Escolha uma das opções abaixo:

`;
        
        classesDisponiveis.forEach((classe, index) => {
            mensagem += `${index + 1}. *${classe.nome}*\n`;
            mensagem += `   > ${classe.descricao || "Classe avançada"}\n`;
            if (classe.requisitos) mensagem += `   > Requisitos: ${Object.entries(classe.requisitos).map(([atributo, valor]) => `${atributo.replace(/_/g, " ")}: ${valor}`).join(" | ")}\n`;
            if (classe.bloqueada) mensagem += `   > 🔒 Requer aprovação narrativa\n`;
            mensagem += `\n`;
        });
        
        mensagem += `*Para escolher, use:*\n`;
        mensagem += `!quero <nome da classe>\n\n`;
        mensagem += `_Exemplo: !quero ${classesDisponiveis[0]?.nome || "Nome da Classe"}_`;
        
        return MessageService.send({ message: msg, text: mensagem });
    }
    
    // =====================================
    // !QUERO <CLASSE AVANÇADA>
    // =====================================
    if (texto.startsWith("!quero ")) {
        const nomeClasse = texto.replace("!quero ", "").trim();
        
        // Verificar se tem quest ativa
        if (!quest) {
            return MessageService.send({ message: msg, text: "*✖ Você precisa iniciar a quest primeiro.*" });
        }
        
        // Buscar a classe avançada escolhida (usa AdvancedClassSystem)
        const classeEscolhida = AdvancedClassSystem.getClasseByName(nomeClasse);
        
        if (!classeEscolhida) {
            return MessageService.send({ message: msg, text: `
*✖ Classe "${nomeClasse}" não encontrada ou não disponível.*

Use *!escolher classe avançada* para ver as opções.
            ` });
        }
        
        // Verificar se está bloqueada por aprovação narrativa
        if (classeEscolhida.bloqueada) {
            return MessageService.send({ message: msg, text: `
*✖ Esta classe requer aprovação narrativa!*

A classe *${classeEscolhida.nome}* exige validação narrativa especial dentro do RPG.
Conclua os requisitos narrativos indicados para solicitar esta evolução.
            ` });
        }
        
        // Verificar se a classe é compatível com a classe inicial
        const classeInicialDaAvancada = classeEscolhida.classeInicial;
        if (classeInicialDaAvancada) {
            if (AdvancedClassSystem.familiaClasseInicial(classeInicialDaAvancada) !== AdvancedClassSystem.familiaClasseInicial(classeAtual)) {
                return MessageService.send({ message: msg, text: `*✖ A classe ${classeEscolhida.nome} não é compatível com sua classe inicial ${classeAtual}.*` });
            }
        } else if (classeEscolhida.categoria !== "Geral") {
            // Verificar por categoria
            const disponiveis = AdvancedClassSystem.getClassesDisponiveis(jogador);
            if (!disponiveis.some(c => c.nome === classeEscolhida.nome)) {
                return MessageService.send({ message: msg, text: `*✖ A classe ${classeEscolhida.nome} não está disponível para sua classe inicial ${classeAtual}.*` });
            }
        }
        
        // Aplicar classe avançada via sistema (que aplica bônus e recalcula)
        const resultado = await AdvancedClassSystem.registrarClasseAvancada(jogador.nome, classeEscolhida.nome, numero);
        
        if (!resultado.success) {
            return MessageService.send({ message: msg, text: `*✖ ${resultado.mensagem}*` });
        }
        
        // Completar quest
        await new Promise((resolve) => {
            db.run(
                "UPDATE missoes SET status = 'concluida' WHERE jogador_id = ? AND tipo = 'classe_avancada' AND status = 'ativa'",
                [jogador.id],
                () => resolve()
            );
        });
        
        // Recalcular atributos
        await AtributoSystem.recalcularAtributos(jogador.id);
        
        // Montar mensagem de confirmação
        const nomeClasseFormatado = classeEscolhida.nome.toLowerCase().replace(/ /g, "_");
        
        let mensagemFinal = `
*══════════════════════════*
*🎉 PARABÉNS! 🎉*
*══════════════════════════*

*VOCÊ ESCOLHEU A CLASSE AVANÇADA*
*${classeEscolhida.nome.toUpperCase()}*

*Descrição:*
${classeEscolhida.descricao || "Uma classe avançada poderosa"}

*Bônus concedidos:*
${Object.entries(classeEscolhida.bonusAtributos || {}).map(([atributo, valor]) => `> ${atributo.replace(/_/g, " ")}: +${valor}`).join("\n") || "> Consulte a descriÃ§Ã£o da classe."}

*Novas técnicas serão liberadas e novos itens únicos de sua classe podem ser adquiridos futuramente!*

*══════════════════════════*
*📖 COMANDOS DA CLASSE:*
*══════════════════════════*

*Ver técnicas da classe:*
> !${nomeClasseFormatado}
> !tecnicas ${classeEscolhida.nome}

*Ver detalhes da classe:*
> !classe avançada

*Ver suas habilidades:*
> !minhas técnicas

*Comprar técnicas:*
> !comprar tecnica <nome>

*Seu avanço está liberado!*
Agora você pode continuar ganhando XP e evoluindo.

_Parabéns por alcançar este marco!_`;
        
        return MessageService.send({ message: msg, text: mensagemFinal });
    }
    
    // Se não reconheceu o comando
    return MessageService.send({ message: msg, text: `
*═══ SISTEMA DE CLASSE AVANÇADA ═══*

*Comandos disponíveis:*
!iniciar quest classe avançada - Iniciar a quest (nível 40+)
!escolher classe avançada - Ver opções disponíveis
!quero <nome> - Escolher classe avançada

_Use !iniciar quest classe avançada para começar._
    ` });
};
