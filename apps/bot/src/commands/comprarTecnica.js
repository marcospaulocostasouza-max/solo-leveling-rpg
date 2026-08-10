const MessageService = require("../core/messageService");

/*
 * COMANDO: !comprar técnica [nome]
 * 
 * Compra técnicas usando Maestria (Força Interior)
 * Sistema de custo progressivo: 1ª = 10 Maestria, 2ª = 20 Maestria, 3ª = 40 Maestria... (2x a cada compra)
 * O jogador só pode comprar técnicas da sua classe
 */

const db = require('../core/database');
const { SISTEMA_MAESTRIA } = require('../tecnicas/sistemaMaestria');
const normalizarClasse = (valor = "") => String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

module.exports = async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    
    // Verificar se é o comando de comprar técnica
    if (!texto.startsWith('!comprar técnica') && !texto.startsWith('!comprar tecnica')) {
        return;
    }
    
    // Extrair o nome da técnica
    const nomeTecnica = texto.replace('!comprar técnica', '').replace('!comprar tecnica', '').trim();
    
    if (!nomeTecnica) {
        await MessageService.send({ message: msg, text: `
*═══ USO INCORRETO ═══*

Use: !comprar técnica [nome da técnica]

Exemplo: !comprar técnica Corte Rápido
        ` });
        return;
    }
    
    const numero = msg.author || msg.from;
    
    // Buscar jogador
    db.get(
        'SELECT * FROM jogadores WHERE numero = ?',
        [numero],
        async (err, jogador) => {
            if (err) {
                console.error('Erro ao buscar jogador:', err);
                await MessageService.send({ message: msg, text: '*═══ Erro ao buscar dados do jogador. ═══*' });
                return;
            }
            
            if (!jogador) {
                await MessageService.send({ message: msg, text: `
*═══ JOGADOR NÃO ENCONTRADO ═══*

Use !ficha para criar sua ficha primeiro.
                ` });
                return;
            }
            
            // Buscar técnica
            db.get(
                'SELECT * FROM tecnicas WHERE LOWER(nome) LIKE ?',
                [`%${nomeTecnica}%`],
                async (err, tecnica) => {
                    if (err) {
                        console.error('Erro ao buscar técnica:', err);
                        await MessageService.send({ message: msg, text: '*═══ Erro ao buscar técnica. ═══*' });
                        return;
                    }
                    
                    if (!tecnica) {
                        await MessageService.send({ message: msg, text: `
*═══ TÉCNICA NÃO ENCONTRADA ═══*

Verifique se o nome está correto.
Use !tecnicas para ver todas as técnicas disponíveis.
                        ` });
                        return;
                    }
                    
                    // Verificar se a técnica é da classe do jogador
                    const classesDoJogador = [jogador.classe, jogador.classe_avancada]
                        .map(normalizarClasse)
                        .filter(classe => classe && classe !== "nenhuma" && classe !== "bloqueado");
                    const tecnicaCompativel = normalizarClasse(tecnica.classe) === "todas" ||
                        classesDoJogador.includes(normalizarClasse(tecnica.classe));
                    if (!tecnicaCompativel) {
                        await MessageService.send({ message: msg, text: `
*═══ CLASSE INCOMPATÍVEL ═══*

Esta técnica é da classe *${tecnica.classe}*.
Sua classe atual é *${jogador.classe}*.

Você só pode comprar técnicas da sua classe!
                        ` });
                        return;
                    }
                    
                    // Verificar nível mínimo
                    if (jogador.nivel < (tecnica.nivel_desbloqueio || 1)) {
                        await MessageService.send({ message: msg, text: `
*═══ NÍVEL INSUFICIENTE ═══*

Técnica: *${tecnica.nome}*
Nível necessário: *${tecnica.nivel_desbloqueio || 1}*
Seu nível: *${jogador.nivel}*

Você precisa de mais ${(tecnica.nivel_desbloqueio || 1) - jogador.nivel} níveis!
                        ` });
                        return;
                    }
                    
                    // Verificar se já possui a técnica
                    db.get(
                        'SELECT * FROM jogador_tecnicas WHERE jogador_id = ? AND tecnica_id = ?',
                        [jogador.id, tecnica.id],
                        async (err, jaPossui) => {
                            if (err) {
                                console.error('Erro ao verificar técnica:', err);
                                await MessageService.send({ message: msg, text: '*═══ Erro ao verificar técnica. ═══*' });
                                return;
                            }
                            
                            if (jaPossui) {
                                await MessageService.send({ message: msg, text: `
*═══ VOCÊ JÁ POSSUI ESTA TÉCNICA! ═══*
                                ` });
                                return;
                            }
                            
                            // Verificar se é técnica de classe avançada
                            const isClasseAvancada = tecnica.categoria === "classe avançada" || 
                                                    tecnica.fonte === "Classe Avançada" ||
                                                    tecnica.classe === "classe avançada";
                            
                            let custoMaestria, custoFormatado, indiceTecnica;
                            
                            if (isClasseAvancada) {
                                // Técnicas de classe avançada: 500 Maestria fixo
                                custoMaestria = 500;
                                custoFormatado = "500 de Maestria";
                                indiceTecnica = 1;
                            } else {
                                // Técnicas normais: sistema progressivo (10, 20, 40, 80...)
                                const tecnicasDaClasse = await new Promise((resolve) => {
                                    db.get(
                                        `SELECT COUNT(*) as total FROM jogador_tecnicas jt
                                         INNER JOIN tecnicas t ON jt.tecnica_id = t.id
                                         WHERE jt.jogador_id = ? AND t.classe = ?`,
                                        [jogador.id, tecnica.classe],
                                        (err, row) => resolve(row ? row.total : 0)
                                    );
                                });
                                
                                indiceTecnica = tecnicasDaClasse + 1;
                                custoMaestria = SISTEMA_MAESTRIA.calcularCusto(indiceTecnica);
                                custoFormatado = SISTEMA_MAESTRIA.getCustoFormatado(indiceTecnica);
                            }
                            
                            // Verificar se tem Maestria suficiente
                            if ((jogador.maestria || 0) < custoMaestria) {
                                await MessageService.send({ message: msg, text: `
*═══ Maestria INSUFICIENTE ═══*

Técnica: *${tecnica.nome}*
Custo: *${custoFormatado}*
Sua Maestria: *${jogador.maestria || 0}*
Próxima técnica já custará: *${SISTEMA_MAESTRIA.getCustoFormatado(indiceTecnica + 1)}*

Você precisa de mais ${custoMaestria - (jogador.maestria || 0)} de Maestria!
Participe das atividades que concedem Maestria para aumentar seu saldo.
                                ` });
                                return;
                            }
                            
                            // Deduzir Maestria e adicionar técnica
                            db.run(
                                'UPDATE jogadores SET maestria = maestria - ? WHERE id = ? AND maestria >= ?',
                                [custoMaestria, jogador.id, custoMaestria],
                                async function (err) {
                                    if (err) {
                                        console.error('Erro ao deduzir Maestria:', err);
                                        await MessageService.send({ message: msg, text: '*═══ Erro ao processar compra. ═══*' });
                                        return;
                                    }
                                    if (this.changes !== 1) {
                                        await MessageService.send({ message: msg, text: '*[!] Maestria insuficiente.*' });
                                        return;
                                    }
                                    
                                    // Adicionar técnica ao jogador
                                    db.run(
                                        'INSERT INTO jogador_tecnicas (jogador_id, tecnica_id, nivel, experiencia) VALUES (?, ?, 1, 0)',
                                        [jogador.id, tecnica.id],
                                        async (err) => {
                                            if (err) {
                                                console.error('Erro ao adicionar técnica:', err);
                                                await MessageService.send({ message: msg, text: '*═══ Erro ao adicionar técnica. ═══*' });
                                                return;
                                            }
                                            
                                            // Mantém um histórico próprio de gastos de Maestria.
                                            // A tabela compras registra somente transações em Yulls.
                                            db.run("CREATE TABLE IF NOT EXISTS historico_maestria (id INTEGER PRIMARY KEY AUTOINCREMENT, jogador_id INTEGER NOT NULL, descricao TEXT NOT NULL, valor INTEGER NOT NULL, data TEXT NOT NULL)");
                                            db.run(
                                                "INSERT INTO historico_maestria (jogador_id, descricao, valor, data) VALUES (?, ?, ?, datetime('now'))",
                                                [jogador.id, `Técnica: ${tecnica.nome}`, custoMaestria]
                                            );

                                            // Exibir descrição completa
                                            const descricaoFinal = tecnica.descricao_completa || tecnica.descricao || "Sem descrição.";
                                            const qiRestante = jogador.maestria - custoMaestria;
                                            const proximaTecnica = SISTEMA_MAESTRIA.getCustoFormatado(indiceTecnica + 1);
                                            
                                            // Mensagem de sucesso
                                            let mensagem = `*═══ TÉCNICA ADQUIRIDA! ═══*\n`;
                                            mensagem += `──────────────────────────\n\n`;
                                            mensagem += `*${tecnica.nome}*\n`;
                                            mensagem += `> ${descricaoFinal}\n\n`;
                                            mensagem += `*—— Detalhes ——*\n`;
                                            mensagem += `Classe: ${tecnica.classe}\n`;
                                            mensagem += `Categoria: ${tecnica.tipo || tecnica.categoria}\n`;
                                            mensagem += `Custo de Mana: ${tecnica.custo_mana || 0} MP\n`;
                                            if (tecnica.cooldown) {
                                                mensagem += `Recarga: ${tecnica.cooldown} turno(s)\n`;
                                            }
                                            mensagem += `\n*—— Custo ——*\n`;
                                            mensagem += `Valor pago: ${custoFormatado} ✓\n`;
                                            mensagem += `Maestria restante: ${qiRestante}\n`;
                                            mensagem += `Próxima técnica da classe: ${proximaTecnica}\n\n`;
                                            mensagem += `──────────────────────────\n`;
                                            mensagem += `_Use !minhas técnicas para ver suas técnicas._`;
                                            
                                            await MessageService.send({ message: msg, text: mensagem });
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};
