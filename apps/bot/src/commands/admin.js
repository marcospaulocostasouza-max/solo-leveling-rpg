const MessageService = require("../core/messageService");

/**
 * SISTEMA ADMINISTRATIVO COMPLETO
 * 
 * Comandos exclusivos para ADMs do grupo:
 * 
 * Formato simplificado sem limites:
 * !+xp NomeDoJogador Valor
 * !+qi NomeDoJogador Valor
 * !+yulls NomeDoJogador Valor
 * !+for NomeDoJogador Valor
 * etc.
 * 
 * Comandos especiais:
 * !adm / !admin - Lista comandos
 * !addpassiva / !rempassiva - Gerenciar passivas
 * !addhab / !remhab - Habilidades únicas
 * !addtitulo / !remtitulo - Títulos
 * !addtecnica / !remtecnica - Técnicas
 * !classe / !remclasse - Classes
 * !additem / !remitem - Itens
 * !addconquista / !remconquista - Conquistas
 * !addboss / !remboss - Bosses derrotados
 * !logs - Ver logs administrativos
 * !ver - Consultar informações do jogador
 */

const db = require("../core/database");
const adminCore = require("../core/adminCore");
const JogadorCore = require("../core/jogadorCore");

module.exports = async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    const numero = msg.author || msg.from;
    
    // =====================================
    // !souadm / !registrar adm - NÃO precisa ser admin para usar
    // =====================================
    if (texto.startsWith('!souadm') || texto.startsWith('!registrar adm') || texto.startsWith('!registrar admin')) {
        let nome = "";
        if (texto.startsWith('!souadm')) {
            nome = msg.body.replace(/!souadm/i, '').trim();
        } else {
            nome = msg.body.replace(/!registrar adm(in)?/i, '').trim();
        }
        if (!nome) {
            return MessageService.send({ message: msg, text: "Uso: !souadm SeuNome  ou  !registrar adm SeuNome" });
        }
        
        return new Promise((resolve) => {
            db.get("SELECT * FROM administradores WHERE numero = ?", [numero], (err, existente) => {
                if (existente) {
                    MessageService.send({ message: msg, text: "Voce ja esta registrado como admin." });
                    return resolve();
                }
                
                db.run("INSERT INTO administradores (numero, nome, nivel, permissao) VALUES (?, ?, 1, 'admin')", [numero, nome], (err) => {
                    if (err) {
                        MessageService.send({ message: msg, text: "Erro ao registrar: " + err.message });
                    } else {
                        MessageService.send({ message: msg, text: `═ *ADMIN REGISTRADO!*
                        
Bem-vindo, ${nome}!
Use !adm para ver os comandos disponiveis.` });
                    }
                    return resolve();
                });
            });
        });
    }
    
    // Verificar se é admin
    const admin = await adminCore.isAdmin(numero);
    if (!admin) {
        if (texto.startsWith('!+') || texto.startsWith('!-') || 
            texto.startsWith('!add') || texto.startsWith('!rem') ||
            texto.startsWith('!adm') || texto.startsWith('!admin') ||
            texto.startsWith('!logs') || texto.startsWith('!ver ') ||
            texto.startsWith('!classe ') || texto.startsWith('!remclasse ')) {
            return MessageService.send({ message: msg, text: adminCore.msgAcessoNegado() });
        }
        return;
    }

    const adminInfo = await adminCore.getAdminLevel(numero);
    const adminNome = adminInfo.nome;
    
    try {
        // =====================================
        // !adm / !admin - Lista comandos
        // =====================================
        if (texto === '!adm' || texto === '!admin') {
            let mensagem = `
═ *PAINEL ADMINISTRATIVO*
═

*RECURSOS E PROGRESSÃO:*
*!*+xp NomeCompleto Valor - adiciona XP e verifica nível/rank
*!*+maestria NomeCompleto Valor - adiciona Maestria para técnicas
*!*+won NomeCompleto Valor - adiciona Won
*!*+for NomeDoJogador Valor - Adicionar Forca
*!*+res NomeDoJogador Valor - Adicionar Resistencia
*!*+agi NomeDoJogador Valor - Adicionar Agilidade
*!*+sen NomeDoJogador Valor - Adicionar Sentidos
*!*+int NomeDoJogador Valor - Adicionar Inteligencia
*!*+pm NomeDoJogador Valor - Adicionar Poder Magico

*PARA REMOVER:*
*!*-xp NomeDoJogador Valor
*!*-maestria NomeCompleto Valor
*!*-won NomeCompleto Valor
(Use o mesmo formato para os demais atributos)

*COMANDOS DE GERENCIAMENTO:*
*!*addpassiva NomePassiva @Nome - Adicionar passiva
*!*rempassiva NomePassiva @Nome - Remover passiva
*!*addhab Nome @Nome - Adicionar habilidade unica
*!*remhab @Nome - Remover habilidade unica
*!*addtitulo Nome @Nome - Adicionar titulo
*!*remtitulo @Nome - Remover titulo
*!*addtecnica Nome @Nome - Adicionar tecnica
*!*remtecnica Nome @Nome - Remover tecnica
*!*classe NomeClasse @Nome - Definir classe
*!*remclasse @Nome - Remover classe avancada
*!*additem NomeItem @Nome - Adicionar item ao inventario
*!*remitem NomeItem @Nome - Remover item do inventario
*!*addconquista Nome @Nome - Adicionar conquista
*!*remconquista Nome @Nome - Remover conquista
*!*addboss NomeBoss @Nome - Marcar boss como derrotado
*!*remboss NomeBoss @Nome - Desmarcar boss

*APROVAÇÃO DE ATIVIDADES (SOMENTE ADM REGISTRADO):*
*!*quest diária finalizada NomeCompleto - entrega XP, Won, atributos e caixa pelo rank
*!*treino de maestria finalizado NomeCompleto [1/7/15/30 dias] - entrega XP e Maestria
*!*treino conjunto finalizado Nome1/Nome2 - entrega XP e bônus de duo
*!*interação finalizada Nome1/Nome2 - entrega XP da interação
*!*one post finalizado Nome1/Nome2 - entrega XP e bônus de duo

*FICHAS PERSONALIZADAS:*
*!*FTécnica - envia o modelo de técnica com dono
*!*add técnica - integra a última ficha, somente para ADM
*!*FItem - envia o modelo de item com dono e slot
*!*add item - integra o item e envia ao inventário, somente para ADM

*COMANDOS DE CONSULTA:*
*!*ver @Nome - Ver informacoes completas
*!*logs - Ver ultimos logs
*!*logs @Nome - Ver logs de um jogador
*!*Pontuação - explica a pontuação usada nas avaliações de cenas
*!*Minigame - abre a lista e as instruções dos minigames
*!*Admin encerrar cenas npc - encerra todas as cenas e libera NPCs e jogadores

═
_Formato simplificado: !+recurso NomeDoJogador Valor_
_Exemplo: !+xp SungJinWoo 5000_
_Exemplo: !+maestria Sung Jin Woo 200_
_Exemplo: !+won Sung Jin Woo 100000_
═`;
            return MessageService.send({ message: msg, text: mensagem });
        }
        
        // =====================================
        // SISTEMA DE ADIÇÃO/REMOÇÃO (!+ e !-) - NOVO FORMATO
        // Formato: !+xp NomeDoJogador Valor
        // =====================================
        if (texto.startsWith('!+') || texto.startsWith('!-')) {
            const isAdicao = texto.startsWith('!+');
            const prefixo = isAdicao ? '!+' : '!-';
            let restante = texto.replace(prefixo, '').trim();
            
            // NOVO FORMATO: tipo NomeDoJogador Valor
            // Extrair tipo (primeira palavra)
            const partes = restante.split(/\s+/);
            if (partes.length < 3) {
                return MessageService.send({ message: msg, text: `═ *FORMATO INVALIDO*
                
Use: ${prefixo}tipo NomeDoJogador Valor
Exemplo: ${prefixo}xp SungJinWoo 5000

Tipos validos: xp, maestria, won, for, res, agi, sen, int, pm` });
            }
            
            const tipo = partes[0].toLowerCase();
            
            // Encontrar o valor (última parte numérica)
            let valorIndex = -1;
            let valor = 0;
            for (let i = partes.length - 1; i >= 1; i--) {
                const num = parseInt(partes[i]);
                if (!isNaN(num) && num > 0) {
                    valor = num;
                    valorIndex = i;
                    break;
                }
            }
            
            if (valorIndex === -1) {
                return MessageService.send({ message: msg, text: `═ Valor invalido. Use: ${prefixo}tipo NomeDoJogador Valor` });
            }
            
            // Nome do jogador é tudo entre o tipo e o valor
            const nomeJogador = partes.slice(1, valorIndex).join(' ');
            
            if (!nomeJogador) {
                return MessageService.send({ message: msg, text: `═ Nome do jogador nao encontrado. Use: ${prefixo}tipo NomeDoJogador Valor` });
            }
            
            // Buscar jogador
            let jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) {
                jogador = await adminCore.buscarJogadorLike(nomeJogador);
            }
            
            if (!jogador) {
                return MessageService.send({ message: msg, text: `═ Jogador "${nomeJogador}" nao encontrado.` });
            }
            
            const operacao = isAdicao ? 'adicionado' : 'removido';
            const sinal = isAdicao ? '+' : '-';
            let valorFinal = isAdicao ? valor : -valor;
            
            // Mapear tipos para colunas do banco
            const mapaAtributos = {
                'xp': { coluna: 'experiencia', nome: 'Experiencia' },
                'maestria': { coluna: 'maestria', nome: 'Maestria' },
                // Alias de compatibilidade para comandos administrativos antigos.
                'qi': { coluna: 'maestria', nome: 'Maestria' },
                'yulls': { coluna: 'won', nome: 'Yulls (Won)' },
                'won': { coluna: 'won', nome: 'Yulls (Won)' },
                '$': { coluna: 'won', nome: 'Yulls (Won)' },
                'for': { coluna: 'forca_base', nome: 'Forca' },
                'forca': { coluna: 'forca_base', nome: 'Forca' },
                'res': { coluna: 'resistencia_base', nome: 'Resistencia' },
                'resistencia': { coluna: 'resistencia_base', nome: 'Resistencia' },
                'agi': { coluna: 'velocidade_base', nome: 'Agilidade' },
                'agilidade': { coluna: 'velocidade_base', nome: 'Agilidade' },
                'sen': { coluna: 'sentidos_base', nome: 'Sentidos' },
                'sentidos': { coluna: 'sentidos_base', nome: 'Sentidos' },
                'int': { coluna: 'inteligencia_base', nome: 'Inteligencia' },
                'inteligencia': { coluna: 'inteligencia_base', nome: 'Inteligencia' },
                'pm': { coluna: 'poder_magico_base', nome: 'Poder Magico' },
                'poder magico': { coluna: 'poder_magico_base', nome: 'Poder Magico' }
            };
            
            const attr = mapaAtributos[tipo];
            if (!attr) {
                return MessageService.send({ message: msg, text: `═ Tipo "${tipo}" invalido. Tipos: xp, maestria, won, for, res, agi, sen, int, pm` });
            }
            
            const valorAntigo = Number(jogador[attr.coluna] || 0);
            const valorNovo = Math.max(0, valorAntigo + valorFinal);
            
            // Atualizar no banco usando JogadorCore para garantir sincronização
            if (isAdicao) {
                await JogadorCore.adicionarValor(jogador.id, attr.coluna, valor);
            } else {
                await JogadorCore.atualizarCampo(jogador.id, attr.coluna, valorNovo);
            }
            
            // Recalcular totais se for atributo físico/mágico
            if (['forca_base', 'resistencia_base', 'velocidade_base', 'sentidos_base', 'inteligencia_base', 'poder_magico_base'].includes(attr.coluna)) {
                await JogadorCore.recalcularTotais(jogador.id);
            }
            
            // Registrar log
            adminCore.registrarLog(
                numero, adminNome,
                isAdicao ? 'adicao' : 'remocao',
                jogador.nome,
                `${attr.nome} ${operacao}`,
                valorAntigo, valorNovo
            );
            
            // Verificar se houve mudança de nível (para XP)
            let mensagemExtra = '';
            if (attr.coluna === 'experiencia') {
                const progressao = await JogadorCore.verificarEAtualizarNivel(jogador.id);
                if (progressao && progressao.subiuNivel) {
                    mensagemExtra = `\n\n*SUBIOU DE NIVEL!* ${progressao.nivelAntigo} → ${progressao.nivelNovo}`;
                    if (progressao.subiuRank) {
                        mensagemExtra += progressao.rankMensagem;
                    }
                }
            }
            
            const diferenca = valorNovo - valorAntigo;
            const sinalDisp = diferenca >= 0 ? '+' : '';
            
            return MessageService.send({ message: msg, text: `
═ *ALTERACAO REALIZADA*
═

Jogador: *${jogador.nome}*
Campo: *${attr.nome}*
Valor antigo: ${valorAntigo}
Valor novo: *${valorNovo}* (${sinalDisp}${diferenca})${mensagemExtra}

═
_Registrado por: ${adminNome}_` });
        }
        
        // =====================================
        // COMANDOS DE GERENCIAMENTO
        // =====================================
        
        // add/rem passiva
        if (texto.startsWith('!addpassiva ') || texto.startsWith('!rempassiva ')) {
            const isAdd = texto.startsWith('!addpassiva ');
            const restante = texto.replace(isAdd ? '!addpassiva ' : '!rempassiva ', '');
            
            const partes = restante.split('@');
            if (partes.length < 2) {
                return MessageService.send({ message: msg, text: "Uso: !addpassiva NomeDaPassiva @NomeJogador" });
            }
            
            const nomePassiva = partes[0].trim();
            const nomeJogador = partes[1].trim();
            
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            const passivasAtuais = jogador.passivas || '';
            const passivasArray = passivasAtuais ? passivasAtuais.split(', ').filter(p => p) : [];
            
            if (isAdd) {
                if (passivasArray.includes(nomePassiva)) {
                    return MessageService.send({ message: msg, text: "Jogador ja possui esta passiva." });
                }
                passivasArray.push(nomePassiva);
            } else {
                const index = passivasArray.indexOf(nomePassiva);
                if (index === -1) return MessageService.send({ message: msg, text: "Jogador nao possui esta passiva." });
                passivasArray.splice(index, 1);
            }
            
            const novoValor = passivasArray.join(', ');
            
            db.run("UPDATE jogadores SET passivas = ? WHERE id = ?", [novoValor, jogador.id], (err) => {
                if (err) return MessageService.send({ message: msg, text: "Erro ao atualizar: " + err.message });
                
                adminCore.registrarLog(numero, adminNome, isAdd ? 'add_passiva' : 'rem_passiva', jogador.nome, nomePassiva, passivasAtuais, novoValor);
                return MessageService.send({ message: msg, text: `═ Passiva "${nomePassiva}" ${isAdd ? 'adicionada' : 'removida'} de ${jogador.nome}.` });
            });
            return;
        }
        
        // add/rem habilidade única
        if (texto.startsWith('!addhab ') || texto.startsWith('!addhabilidade ')) {
            const prefix = texto.startsWith('!addhab ') ? '!addhab ' : '!addhabilidade ';
            const restante = texto.replace(prefix, '');
            const partes = restante.split('@');
            if (partes.length < 2) return MessageService.send({ message: msg, text: "Uso: !addhab NomeHabilidade @NomeJogador" });
            
            const nomeHab = partes[0].trim();
            const nomeJogador = partes[1].trim();
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            db.run("UPDATE jogadores SET habilidade_unica = ? WHERE id = ?", [nomeHab, jogador.id], (err) => {
                if (err) return MessageService.send({ message: msg, text: "Erro: " + err.message });
                adminCore.registrarLog(numero, adminNome, 'add_habilidade', jogador.nome, nomeHab, jogador.habilidade_unica, nomeHab);
                return MessageService.send({ message: msg, text: `═ Habilidade unica "${nomeHab}" adicionada a ${jogador.nome}.` });
            });
            return;
        }
        
        if (texto.startsWith('!remhab ') || texto.startsWith('!remhabilidade ')) {
            const nomeJogador = texto.replace(/^!remhab |^!remhabilidade /, '').trim().replace('@', '');
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            db.run("UPDATE jogadores SET habilidade_unica = 'Nenhuma' WHERE id = ?", [jogador.id], (err) => {
                if (err) return MessageService.send({ message: msg, text: "Erro: " + err.message });
                adminCore.registrarLog(numero, adminNome, 'rem_habilidade', jogador.nome, 'Removida', jogador.habilidade_unica, 'Nenhuma');
                return MessageService.send({ message: msg, text: `═ Habilidade unica removida de ${jogador.nome}.` });
            });
            return;
        }
        
        // add/rem título
        if (texto.startsWith('!addtitulo ') || texto.startsWith('!addtítulo ')) {
            const prefix = texto.includes('!addtitulo ') ? '!addtitulo ' : '!addtítulo ';
            const restante = texto.replace(prefix, '');
            const partes = restante.split('@');
            if (partes.length < 2) return MessageService.send({ message: msg, text: "Uso: !addtitulo NomeTitulo @NomeJogador" });
            
            const nomeTitulo = partes[0].trim();
            const nomeJogador = partes[1].trim();
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            db.run("UPDATE jogadores SET titulo = ? WHERE id = ?", [nomeTitulo, jogador.id], (err) => {
                if (err) return MessageService.send({ message: msg, text: "Erro: " + err.message });
                adminCore.registrarLog(numero, adminNome, 'add_titulo', jogador.nome, nomeTitulo, jogador.titulo, nomeTitulo);
                return MessageService.send({ message: msg, text: `═ Titulo "${nomeTitulo}" adicionado a ${jogador.nome}.` });
            });
            return;
        }
        
        if (texto.startsWith('!remtitulo ') || texto.startsWith('!remtítulo ')) {
            const nomeJogador = texto.replace(/^!remtitulo |^!remtítulo /, '').trim().replace('@', '');
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            db.run("UPDATE jogadores SET titulo = 'Nenhum' WHERE id = ?", [jogador.id], (err) => {
                if (err) return MessageService.send({ message: msg, text: "Erro: " + err.message });
                adminCore.registrarLog(numero, adminNome, 'rem_titulo', jogador.nome, 'Removido', jogador.titulo, 'Nenhum');
                return MessageService.send({ message: msg, text: `═ Titulo removido de ${jogador.nome}.` });
            });
            return;
        }
        
        // add/rem técnica
        if (texto.startsWith('!addtecnica ') || texto.startsWith('!addtécnica ')) {
            const prefix = texto.includes('!addtecnica ') ? '!addtecnica ' : '!addtécnica ';
            const restante = texto.replace(prefix, '');
            const partes = restante.split('@');
            if (partes.length < 2) return MessageService.send({ message: msg, text: "Uso: !addtecnica NomeTecnica @NomeJogador" });
            
            const nomeTecnica = partes[0].trim();
            const nomeJogador = partes[1].trim();
            
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            db.get("SELECT * FROM tecnicas WHERE LOWER(nome) LIKE LOWER(?)", [`%${nomeTecnica}%`], async (err, tecnica) => {
                if (!tecnica) return MessageService.send({ message: msg, text: `Tecnica "${nomeTecnica}" nao encontrada no banco.` });
                
                db.get("SELECT * FROM jogador_tecnicas WHERE jogador_id = ? AND tecnica_id = ?", [jogador.id, tecnica.id], (err, jaTem) => {
                    if (jaTem) return MessageService.send({ message: msg, text: "Jogador ja possui esta tecnica." });
                    
                    db.run("INSERT INTO jogador_tecnicas (jogador_id, tecnica_id) VALUES (?, ?)", [jogador.id, tecnica.id], (err) => {
                        if (err) return MessageService.send({ message: msg, text: "Erro: " + err.message });
                        adminCore.registrarLog(numero, adminNome, 'add_tecnica', jogador.nome, tecnica.nome, '', tecnica.nome);
                        return MessageService.send({ message: msg, text: `═ Tecnica "${tecnica.nome}" adicionada a ${jogador.nome}.` });
                    });
                });
            });
            return;
        }
        
        if (texto.startsWith('!remtecnica ') || texto.startsWith('!remtécnica ')) {
            const prefix = texto.includes('!remtecnica ') ? '!remtecnica ' : '!remtécnica ';
            const restante = texto.replace(prefix, '');
            const partes = restante.split('@');
            if (partes.length < 2) return MessageService.send({ message: msg, text: "Uso: !remtecnica NomeTecnica @NomeJogador" });
            
            const nomeTecnica = partes[0].trim();
            const nomeJogador = partes[1].trim();
            
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            db.get("SELECT * FROM tecnicas WHERE LOWER(nome) LIKE LOWER(?)", [`%${nomeTecnica}%`], (err, tecnica) => {
                if (!tecnica) return MessageService.send({ message: msg, text: `Tecnica "${nomeTecnica}" nao encontrada.` });
                
                db.run("DELETE FROM jogador_tecnicas WHERE jogador_id = ? AND tecnica_id = ?", [jogador.id, tecnica.id], (err) => {
                    if (err) return MessageService.send({ message: msg, text: "Erro: " + err.message });
                    adminCore.registrarLog(numero, adminNome, 'rem_tecnica', jogador.nome, tecnica.nome, tecnica.nome, '');
                    return MessageService.send({ message: msg, text: `═ Tecnica "${tecnica.nome}" removida de ${jogador.nome}.` });
                });
            });
            return;
        }
        
        // classe / remclasse
        if (texto.startsWith('!classe ')) {
            const restante = texto.replace('!classe ', '');
            const partes = restante.split('@');
            if (partes.length < 2) return MessageService.send({ message: msg, text: "Uso: !classe NomeClasse @NomeJogador" });
            
            const nomeClasse = partes[0].trim();
            const nomeJogador = partes[1].trim();
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            db.run("UPDATE jogadores SET classe = ? WHERE id = ?", [nomeClasse, jogador.id], (err) => {
                if (err) return MessageService.send({ message: msg, text: "Erro: " + err.message });
                adminCore.registrarLog(numero, adminNome, 'set_classe', jogador.nome, nomeClasse, jogador.classe, nomeClasse);
                return MessageService.send({ message: msg, text: `═ Classe de ${jogador.nome} alterada para "${nomeClasse}".` });
            });
            return;
        }
        
        if (texto.startsWith('!remclasse ')) {
            const nomeJogador = texto.replace('!remclasse ', '').trim().replace('@', '');
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            db.run("UPDATE jogadores SET classe_avancada = 'Nenhuma', classe_avancada_nivel = 0 WHERE id = ?", [jogador.id], (err) => {
                if (err) return MessageService.send({ message: msg, text: "Erro: " + err.message });
                adminCore.registrarLog(numero, adminNome, 'rem_classe_avancada', jogador.nome, 'Removida', jogador.classe_avancada, 'Nenhuma');
                return MessageService.send({ message: msg, text: `═ Classe avancada removida de ${jogador.nome}.` });
            });
            return;
        }
        
        // add/rem item
        if (texto.startsWith('!additem ')) {
            const restante = texto.replace('!additem ', '');
            const partes = restante.split('@');
            if (partes.length < 2) return MessageService.send({ message: msg, text: "Uso: !additem NomeItem @NomeJogador" });
            
            const nomeItem = partes[0].trim();
            const nomeJogador = partes[1].trim();
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            db.get("SELECT * FROM itens WHERE LOWER(nome) LIKE LOWER(?)", [`%${nomeItem}%`], (err, item) => {
                if (!item) return MessageService.send({ message: msg, text: `Item "${nomeItem}" nao encontrado.` });
                
                db.run("INSERT INTO inventario_jogador (jogador_id, item_id, quantidade) VALUES (?, ?, 1)", [jogador.id, item.id], (err) => {
                    if (err) return MessageService.send({ message: msg, text: "Erro: " + err.message });
                    adminCore.registrarLog(numero, adminNome, 'add_item', jogador.nome, item.nome, '', item.nome);
                    return MessageService.send({ message: msg, text: `═ Item "${item.nome}" adicionado a ${jogador.nome}.` });
                });
            });
            return;
        }
        
        if (texto.startsWith('!remitem ')) {
            const restante = texto.replace('!remitem ', '');
            const partes = restante.split('@');
            if (partes.length < 2) return MessageService.send({ message: msg, text: "Uso: !remitem NomeItem @NomeJogador" });
            
            const nomeItem = partes[0].trim();
            const nomeJogador = partes[1].trim();
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            db.get("SELECT * FROM itens WHERE LOWER(nome) LIKE LOWER(?)", [`%${nomeItem}%`], (err, item) => {
                if (!item) return MessageService.send({ message: msg, text: `Item "${nomeItem}" nao encontrado.` });
                
                db.run("DELETE FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogador.id, item.id], (err) => {
                    if (err) return MessageService.send({ message: msg, text: "Erro: " + err.message });
                    adminCore.registrarLog(numero, adminNome, 'rem_item', jogador.nome, item.nome, item.nome, '');
                    return MessageService.send({ message: msg, text: `═ Item "${item.nome}" removido de ${jogador.nome}.` });
                });
            });
            return;
        }
        
        // add/rem conquista
        if (texto.startsWith('!addconquista ')) {
            const restante = texto.replace('!addconquista ', '');
            const partes = restante.split('@');
            if (partes.length < 2) return MessageService.send({ message: msg, text: "Uso: !addconquista NomeConquista @NomeJogador" });
            
            const nomeConquista = partes[0].trim();
            const nomeJogador = partes[1].trim();
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            db.get("SELECT * FROM conquistas WHERE LOWER(nome) LIKE LOWER(?)", [`%${nomeConquista}%`], (err, conquista) => {
                if (!conquista) {
                    db.run("INSERT INTO conquistas (nome, descricao, categoria) VALUES (?, 'Conquista administrativa', 'Geral')", [nomeConquista], function(err) {
                        if (err) return MessageService.send({ message: msg, text: "Erro ao criar conquista: " + err.message });
                        
                        db.run("INSERT INTO jogador_conquistas (jogador_id, conquista_id, data) VALUES (?, ?, datetime('now'))", [jogador.id, this.lastID], (err) => {
                            if (err) return MessageService.send({ message: msg, text: "Erro: " + err.message });
                            adminCore.registrarLog(numero, adminNome, 'add_conquista', jogador.nome, nomeConquista, '', nomeConquista);
                            return MessageService.send({ message: msg, text: `═ Conquista "${nomeConquista}" adicionada a ${jogador.nome}.` });
                        });
                    });
                } else {
                    db.run("INSERT OR IGNORE INTO jogador_conquistas (jogador_id, conquista_id, data) VALUES (?, ?, datetime('now'))", [jogador.id, conquista.id], (err) => {
                        if (err) return MessageService.send({ message: msg, text: "Erro: " + err.message });
                        adminCore.registrarLog(numero, adminNome, 'add_conquista', jogador.nome, nomeConquista, '', nomeConquista);
                        return MessageService.send({ message: msg, text: `═ Conquista "${nomeConquista}" adicionada a ${jogador.nome}.` });
                    });
                }
            });
            return;
        }
        
        if (texto.startsWith('!remconquista ')) {
            const restante = texto.replace('!remconquista ', '');
            const partes = restante.split('@');
            if (partes.length < 2) return MessageService.send({ message: msg, text: "Uso: !remconquista NomeConquista @NomeJogador" });
            
            const nomeConquista = partes[0].trim();
            const nomeJogador = partes[1].trim();
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            db.get("SELECT * FROM conquistas WHERE LOWER(nome) LIKE LOWER(?)", [`%${nomeConquista}%`], (err, conquista) => {
                if (!conquista) return MessageService.send({ message: msg, text: "Conquista nao encontrada." });
                
                db.run("DELETE FROM jogador_conquistas WHERE jogador_id = ? AND conquista_id = ?", [jogador.id, conquista.id], (err) => {
                    if (err) return MessageService.send({ message: msg, text: "Erro: " + err.message });
                    adminCore.registrarLog(numero, adminNome, 'rem_conquista', jogador.nome, nomeConquista, nomeConquista, '');
                    return MessageService.send({ message: msg, text: `═ Conquista "${nomeConquista}" removida de ${jogador.nome}.` });
                });
            });
            return;
        }
        
        // add/rem boss
        if (texto.startsWith('!addboss ')) {
            const restante = texto.replace('!addboss ', '');
            const partes = restante.split('@');
            if (partes.length < 2) return MessageService.send({ message: msg, text: "Uso: !addboss NomeBoss @NomeJogador" });
            
            const nomeBoss = partes[0].trim();
            const nomeJogador = partes[1].trim();
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            const bossesAtuais = jogador.bosses_derrotados || '';
            const bossesArray = bossesAtuais ? bossesAtuais.split(', ').filter(b => b) : [];
            
            if (bossesArray.includes(nomeBoss)) {
                return MessageService.send({ message: msg, text: "Boss ja esta registrado como derrotado." });
            }
            bossesArray.push(nomeBoss);
            
            db.run("UPDATE jogadores SET bosses_derrotados = ? WHERE id = ?", [bossesArray.join(', '), jogador.id], (err) => {
                if (err) return MessageService.send({ message: msg, text: "Erro: " + err.message });
                adminCore.registrarLog(numero, adminNome, 'add_boss', jogador.nome, nomeBoss, '', nomeBoss);
                return MessageService.send({ message: msg, text: `═ Boss "${nomeBoss}" marcado como derrotado por ${jogador.nome}.` });
            });
            return;
        }
        
        if (texto.startsWith('!remboss ')) {
            const restante = texto.replace('!remboss ', '');
            const partes = restante.split('@');
            if (partes.length < 2) return MessageService.send({ message: msg, text: "Uso: !remboss NomeBoss @NomeJogador" });
            
            const nomeBoss = partes[0].trim();
            const nomeJogador = partes[1].trim();
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            const bossesAtuais = jogador.bosses_derrotados || '';
            const bossesArray = bossesAtuais ? bossesAtuais.split(', ').filter(b => b) : [];
            const index = bossesArray.indexOf(nomeBoss);
            
            if (index === -1) return MessageService.send({ message: msg, text: "Boss nao esta na lista do jogador." });
            bossesArray.splice(index, 1);
            
            db.run("UPDATE jogadores SET bosses_derrotados = ? WHERE id = ?", [bossesArray.join(', '), jogador.id], (err) => {
                if (err) return MessageService.send({ message: msg, text: "Erro: " + err.message });
                adminCore.registrarLog(numero, adminNome, 'rem_boss', jogador.nome, nomeBoss, nomeBoss, '');
                return MessageService.send({ message: msg, text: `═ Boss "${nomeBoss}" removido da lista de ${jogador.nome}.` });
            });
            return;
        }
        
        // =====================================
        // !logs - Visualizar logs
        // =====================================
        if (texto === '!logs') {
            const logs = await adminCore.getUltimosLogs(15);
            if (logs.length === 0) return MessageService.send({ message: msg, text: "Nenhum log registrado." });
            
            let mensagem = `═ *ULTIMOS LOGS ADMINISTRATIVOS*
═

`;
            logs.forEach((log, i) => {
                mensagem += `${i+1}. [${log.data}] ${log.admin_nome}
   Acao: ${log.acao} em ${log.alvo}
   Detalhes: ${log.detalhes || 'N/A'}
   ${log.valor_antigo ? `Antes: ${log.valor_antigo} | Depois: ${log.valor_novo}` : ''}

`;
            });
            
            mensagem += `═
_Fim dos logs_`;
            return MessageService.send({ message: msg, text: mensagem });
        }
        
        if (texto.startsWith('!logs ')) {
            const nomeJogador = texto.replace('!logs ', '').trim();
            const logs = await adminCore.getLogsDoJogador(nomeJogador, 10);
            if (logs.length === 0) return MessageService.send({ message: msg, text: `Nenhum log encontrado para ${nomeJogador}.` });
            
            let mensagem = `═ *LOGS DE ${nomeJogador.toUpperCase()}*
═

`;
            logs.forEach((log, i) => {
                mensagem += `${i+1}. [${log.data}] ${log.admin_nome}
   Acao: ${log.acao}
   Detalhes: ${log.detalhes || 'N/A'}
   ${log.valor_antigo ? `Antes: ${log.valor_antigo} | Depois: ${log.valor_novo}` : ''}

`;
            });
            
            return MessageService.send({ message: msg, text: mensagem });
        }
        
        // =====================================
        // !ver @Nome - Consultar informações do jogador
        // =====================================
        if (texto.startsWith('!ver ')) {
            const nomeJogador = texto.replace('!ver ', '').trim().replace('@', '');
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            let mensagem = `
═ *FICHA COMPLETA: ${jogador.nome.toUpperCase()}*
═

*BASICOS:*
Nivel: ${jogador.nivel} | Rank: ${jogador.rank}
XP: ${jogador.experiencia} | QI: ${jogador.qi || 0}
Yulls: ${jogador.won} | Classe: ${jogador.classe}
Classe Avancada: ${jogador.classe_avancada || 'Nenhuma'}
Elemento: ${jogador.afinidade_elemental || 'Nenhum'}
Estilo Luta: ${jogador.estilo_luta || 'Nenhum'}
Titulo: ${jogador.titulo || 'Nenhum'}
Habilidade Unica: ${jogador.habilidade_unica || 'Nenhuma'}

*ATRIBUTOS BASE:*
Forca: ${jogador.forca_base} | Resistencia: ${jogador.resistencia_base}
Agilidade: ${jogador.velocidade_base} | Sentidos: ${jogador.sentidos_base}
Inteligencia: ${jogador.inteligencia_base} | PM: ${jogador.poder_magico_base}

*ATRIBUTOS TOTAIS:*
Forca: ${jogador.forca_total} | Resistencia: ${jogador.resistencia_total}
Agilidade: ${jogador.velocidade_total} | Sentidos: ${jogador.sentidos_total}
Inteligencia: ${jogador.inteligencia_total} | PM: ${jogador.poder_magico_total}

*VIDA E MANA:*
Vida: ${jogador.vida_atual}/${jogador.vida_maxima}
Mana: ${jogador.mana_atual}/${jogador.mana_maxima}

═
_Para ver inventario: !ver inventario @Nome_`;
            
            return MessageService.send({ message: msg, text: mensagem });
        }
        
        if (texto.startsWith('!ver inventario ') || texto.startsWith('!ver inv ')) {
            const prefix = texto.includes('!ver inventario ') ? '!ver inventario ' : '!ver inv ';
            const nomeJogador = texto.replace(prefix, '').trim().replace('@', '');
            const jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) return MessageService.send({ message: msg, text: "Jogador nao encontrado." });
            
            db.all(
                `SELECT i.nome, i.categoria, i.tier, inv.quantidade, inv.equipado
                 FROM inventario_jogador inv
                 JOIN itens i ON inv.item_id = i.id
                 WHERE inv.jogador_id = ?
                 ORDER BY i.categoria, i.tier`,
                [jogador.id],
                (err, itens) => {
                    if (!itens || itens.length === 0) return MessageService.send({ message: msg, text: "Inventario vazio." });
                    
                    let mensagem = `═ *INVENTARIO DE ${jogador.nome.toUpperCase()}*
═

`;
                    itens.forEach(item => {
                        const equipado = item.equipado ? ' [EQUIPADO]' : '';
                        mensagem += `> ${item.nome}${equipado} (${item.categoria}) [${item.tier || 'Comum'}] x${item.quantidade}\n`;
                    });
                    
                    return MessageService.send({ message: msg, text: mensagem });
                }
            );
            return;
        }
    } catch (error) {
        console.error("Erro no sistema admin:", error);
        await MessageService.send({ message: msg, text: "═ Erro interno no sistema administrativo." });
    }
};
