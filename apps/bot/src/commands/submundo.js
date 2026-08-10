const MessageService = require("../core/messageService");

/**
 * SISTEMA DO SUBMUNDO - Reformulação Completa
 * 
 * Comandos: !submundo - Lista profissões
 *           !sub <profissão> - Contrata para uma profissão
 * 
 * Sistema de trabalhos clandestinos com duração baseada em palavras.
 * 100 palavras = 1 hora de duração.
 * Jogador fica ocupado durante o trabalho e não pode treinar.
 */

const db = require("../core/database");
const JogadorCore = require("../core/jogadorCore");

// =====================================
// PROFISSÕES DO SUBMUNDO
// =====================================
// Cada profissão tem:
// - nome: Nome da profissão
// - descricao: Descrição detalhada do trabalho
// - custo: Custo em Won para iniciar (0 = sem custo)
// - duracao_horas: Duração em horas (baseado em 100 palavras = 1 hora)
// - recompensa: Recompensa em Won ao concluir
// - requisito_rank: Rank mínimo necessário
// - tipo: Tipo de trabalho (comum, especial, golpe)

const PROFISSOES = {
    "contrabando": {
        nome: "Contrabando",
        descricao: "Transporte e distribuição de mercadorias ilegais pelas ruas da cidade. Requer discrição e conhecimento das rotas de fuga.",
        custo: 0,
        duracao_horas: 10,
        recompensa: 150000,
        requisito_rank: "E",
        tipo: "comum"
    },
    "assassinato": {
        nome: "Assassinato",
        descricao: "Eliminação de alvos específicos designados pelo Submundo. Trabalho sujo para quem não tem escrúpulos.",
        custo: 0,
        duracao_horas: 10,
        recompensa: 100000,
        requisito_rank: "D",
        tipo: "comum"
    },
    "extorsao": {
        nome: "Extorsão",
        descricao: "Cobrança forçada de lojas e estabelecimentos locais. Intimidação e violência são ferramentas de trabalho.",
        custo: 0,
        duracao_horas: 10,
        recompensa: 100000,
        requisito_rank: "E",
        tipo: "comum"
    },
    "contrabando de pessoas": {
        nome: "Contrabando de Pessoas",
        descricao: "Tráfico de despertados ilegais através das fronteiras. Altamente lucrativo, mas extremamente perigoso.",
        custo: 0,
        duracao_horas: 15,
        recompensa: 200000,
        requisito_rank: "C",
        tipo: "especial"
    },
    "falsificacao": {
        nome: "Falsificação",
        descricao: "Forjar documentos e provas para a máfia local. Trabalho de escritório sujo que requer precisão.",
        custo: 3000000,
        duracao_horas: 10,
        recompensa: 200000,
        requisito_rank: "D",
        tipo: "investimento"
    },
    "jogo ilegal": {
        nome: "Jogo Ilegal",
        descricao: "Operar cassinos clandestinos e jogos de azar. Gerencia máquinas e mesas de apostas escondidas.",
        custo: 1500000,
        duracao_horas: 10,
        recompensa: 250000,
        requisito_rank: "D",
        tipo: "investimento"
    },
    "espionagem": {
        nome: "Espionagem",
        descricao: "Coletar informações sigilosas de guildas rivais e organizações. Infiltração e furtividade são essenciais.",
        custo: 0,
        duracao_horas: 5,
        recompensa: 150000,
        requisito_rank: "C",
        tipo: "comum"
    },
    "sequestro e resgate": {
        nome: "Sequestro e Resgate",
        descricao: "Captura de alvos para resgate. O Submundo fica com 20% dos lucros. Alta recompensa, alto risco.",
        custo: 0,
        duracao_horas: 12,
        recompensa: 300000,
        requisito_rank: "B",
        tipo: "especial"
    }
};

module.exports = async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    const args = texto.split(" ");
    const comandoBase = args[0]; // !submundo ou !sub
    const numero = msg.author || msg.from;
    
    // =====================================
    // !submundo - Lista todas as profissões
    // =====================================
    if (comandoBase === "!submundo") {
        let mensagem = `
*═══ SUBMUNDO ═══*
Organizações clandestinas que operam à margem das leis.

*COMO FUNCIONA:*
Use *!sub <profissão>* para iniciar um trabalho.
O custo será descontado automaticamente da sua ficha.
Você ficará ocupado até o trabalho ser concluído.
Nenhum treino poderá ser aprovado enquanto estiver ocupado.

*DURAÇÃO:*
A duração é baseada na complexidade do trabalho.
Cada trabalho tem um tempo estimado em horas.

══════════════════════════

*LISTA DE PROFISSÕES:*
        `;
        
        const profissoesArray = Object.values(PROFISSOES);
        profissoesArray.forEach(p => {
            const custoTexto = p.custo > 0 ? `Custo: ${p.custo.toLocaleString()} Won` : "Sem custo inicial";
            mensagem += `
*${p.nome}* (Rank ${p.requisito_rank}+)
> ${p.descricao}
> ${custoTexto} | Duração: ${p.duracao_horas}h | Recompensa: ${p.recompensa.toLocaleString()} Won
            `;
        });
        
        mensagem += `
══════════════════════════
_Para se candidatar: !sub <nome da profissão>_
_Exemplo: !sub contrabando_
        `;
        
        await MessageService.send({ message: msg, text: mensagem });
        return;
    }
    
    // =====================================
    // !sub <profissão> - Contratar para profissão
    // =====================================
    if (comandoBase === "!sub") {
        const nomeProfissao = args.slice(1).join(" ").toLowerCase().trim();
        
        if (!nomeProfissao) {
            return MessageService.send({ message: msg, text: `
*═══ USO INCORRETO ═══*
Use: *!sub <profissão>*
Exemplo: *!sub contrabando*

*Profissões disponíveis:*
${Object.keys(PROFISSOES).map(p => `> ${p}`).join("\n")}
            ` });
        }
        
        // Buscar a profissão
        const profissao = PROFISSOES[nomeProfissao];
        if (!profissao) {
            return MessageService.send({ message: msg, text: `
*═══ PROFISSÃO NÃO ENCONTRADA ═══*
"${nomeProfissao}" não é uma profissão válida.

*Profissões disponíveis:*
${Object.keys(PROFISSOES).map(p => `> ${p}`).join("\n")}
            ` });
        }
        
        // Buscar jogador
        const jogador = await JogadorCore.buscarPorNumero(numero);
        if (!jogador) {
            return MessageService.send({ message: msg, text: "*═══ Você precisa criar uma ficha primeiro! ═══* Use !ficha" });
        }
        
        // Verificar se a ficha foi aprovada
        if (!jogador.ficha_aprovada) {
            return MessageService.send({ message: msg, text: "*═══ Sua ficha precisa ser aprovada primeiro! ═══*" });
        }
        
        // Verificar requisito de rank
        const ranksOrdem = ["E", "D", "C", "B", "A", "S"];
        const rankJogador = ranksOrdem.indexOf(jogador.rank || "E");
        const rankRequisito = ranksOrdem.indexOf(profissao.requisito_rank);
        
        if (rankJogador < rankRequisito) {
            return MessageService.send({ message: msg, text: `
*═══ RANK INSUFICIENTE ═══*
Você precisa ser rank ${profissao.requisito_rank}+ para esta profissão.
Seu rank atual: ${jogador.rank}
            ` });
        }
        
        // Verificar se está ocupado
        if (jogador.ocupado) {
            return MessageService.send({ message: msg, text: `
*═══ VOCÊ ESTÁ OCUPADO ═══*
Você já está realizando um trabalho no Submundo.
Aguarde a conclusão antes de iniciar outro.

Motivo: ${jogador.ocupado_motivo || "Trabalho no Submundo"}
            ` });
        }
        
        // Verificar se tem Won suficiente
        if (profissao.custo > 0 && (jogador.won || 0) < profissao.custo) {
            return MessageService.send({ message: msg, text: `
*═══ SALDO INSUFICIENTE ═══*
Esta profissão requer ${profissao.custo.toLocaleString()} Won de custo inicial.
Seu saldo atual: ${(jogador.won || 0).toLocaleString()} Won
            ` });
        }
        
        // =====================================
        // INICIAR O TRABALHO
        // =====================================
        
        // Descontar custo
        if (profissao.custo > 0) {
            await JogadorCore.atualizarCampo(jogador.id, "won", (jogador.won || 0) - profissao.custo);
        }
        
        // Calcular horários
        const agora = new Date();
        const termino = new Date(agora.getTime() + profissao.duracao_horas * 60 * 60 * 1000);
        
        const agoraISO = agora.toISOString();
        const terminoISO = termino.toISOString();
        
        // Marcar jogador como ocupado
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE jogadores SET ocupado = 1, ocupado_ate = ?, ocupado_motivo = ? WHERE id = ?`,
                [terminoISO, `Trabalhando no Submundo: ${profissao.nome}`, jogador.id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        // Registrar atividade no submundo
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT OR REPLACE INTO submundo_atividades (jogador_id, profissao_id, inicio, termino_previsto, status, recompensa_pendente)
                 VALUES (?, ?, ?, ?, 'em_andamento', ?)`,
                [jogador.id, profissao.nome, agoraISO, terminoISO, profissao.recompensa],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        // Calcular tempo restante
        const horas = profissao.duracao_horas;
        const minutos = 0;
        
        await MessageService.send({ message: msg, text: `
*═══ TRABALHO INICIADO! ═══*

*Profissão:* ${profissao.nome}
*Descrição:* ${profissao.descricao}
*Duração estimada:* ${horas}h
*Recompensa:* ${profissao.recompensa.toLocaleString()} Won
${profissao.custo > 0 ? `*Custo descontado:* ${profissao.custo.toLocaleString()} Won` : ""}

*Você está ocupado até o término do trabalho.*
_Nenhum treino poderá ser aprovado durante este período._

*Horário de término previsto:*
${termino.toLocaleString("pt-BR")}

_Após a conclusão, você receberá automaticamente sua recompensa._
        ` });
        
        // =====================================
        // AGENDAR CONCLUSÃO AUTOMÁTICA
        // =====================================
        const tempoMs = profissao.duracao_horas * 60 * 60 * 1000;
        
        setTimeout(async () => {
            try {
                // Buscar dados atualizados do jogador
                const jogadorAtual = await JogadorCore.buscarPorNumero(numero);
                if (!jogadorAtual) return;
                
                const recompensa = profissao.recompensa;
                
                // Adicionar recompensa
                await JogadorCore.adicionarValor(jogadorAtual.id, "won", recompensa);
                
                // Liberar jogador
                await new Promise((resolve, reject) => {
                    db.run(
                        `UPDATE jogadores SET ocupado = 0, ocupado_ate = '', ocupado_motivo = '' WHERE id = ?`,
                        [jogadorAtual.id],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
                
                // Atualizar status da atividade
                await new Promise((resolve, reject) => {
                    db.run(
                        `UPDATE submundo_atividades SET status = 'concluido' WHERE jogador_id = ? AND status = 'em_andamento'`,
                        [jogadorAtual.id],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
                
                // Registrar transação
                db.run(
                    `INSERT INTO transacoes (jogador_id, valor, tipo, motivo, data) VALUES (?, ?, ?, ?, datetime('now'))`,
                    [jogadorAtual.id, recompensa, "submundo", `Recompensa: ${profissao.nome}`]
                );
                
                console.log(`[SUBMUNDO] ${jogadorAtual.nome} concluiu ${profissao.nome} e recebeu ${recompensa} Won`);
                
            } catch (err) {
                console.error("[SUBMUNDO] Erro ao concluir trabalho:", err);
            }
        }, tempoMs);
        
        return;
    }
};