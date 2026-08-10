const MessageService = require("../core/messageService");

/**
 * COMANDO ADMIN: !admin afinidade [jogador] [elemento]
 * 
 * Permite ao ADM definir/alterar a afinidade elemental de um jogador.
 * Atualiza tanto na tabela de jogadores quanto na ficha.
 */

const db = require("../core/database");
const templates = require("../utils/templatesMensagens");
const elementos = require("../elementos/listaElementos");

module.exports = async (msg) => {
    try {
        const numeroAdm = msg.author || msg.from;
        const args = msg.body.trim().split(" ");
        
        // Verificar se é admin
        const admin = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM administradores WHERE numero = ?", [numeroAdm], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!admin) {
            return MessageService.send({ message: msg, text: templates.erro("Você não tem permissão para usar este comando.") });
        }
        
        // Formato: !admin afinidade [jogador] [elemento]
        const depoisPrefixo = msg.body.substring(msg.body.toLowerCase().indexOf("afinidade") + 10).trim();
        
        if (!depoisPrefixo || args.length < 3) {
            return MessageService.send({ message: msg, text: `
*═══ USO: ADMIN AFINIDADE ═══*
${templates.divisor()}
*!admin afinidade <nome do jogador> <elemento>*

*Elementos disponíveis:*
${carregarElementosDisponiveis()}
${templates.divisor()}
_Exemplo: !admin afinidade Jim Mori Fogo_
            ` });
        }
        
        // Extrair nome do jogador e elemento
        // O elemento é sempre a última palavra
        const palavras = depoisPrefixo.split(" ");
        const elementoNome = palavras.pop();
        const nomeJogador = palavras.join(" ");
        
        if (!nomeJogador || !elementoNome) {
            return MessageService.send({ message: msg, text: templates.erro("Formato inválido. Use: !admin afinidade <jogador> <elemento>") });
        }
        
        // Capitalizar elemento para buscar no JSON
        const elementoCapitalizado = elementoNome.charAt(0).toUpperCase() + elementoNome.slice(1).toLowerCase();
        
        // Verificar se o elemento existe
        const elemento = elementos.find(e => e.nome === elementoCapitalizado);
        
        if (!elemento) {
            return MessageService.send({ message: msg, text: `
*═══ ELEMENTO NÃO ENCONTRADO ═══*
${templates.divisor()}
O elemento "${elementoCapitalizado}" não existe no sistema.
*Elementos disponíveis:*
${carregarElementosDisponiveis()}
            ` });
        }
        
        // Buscar jogador (primeiro tenta por nome, depois por LIKE)
        const jogador = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM jogadores WHERE nome = ?", [nomeJogador], (err, row) => {
                if (err) reject(err);
                else if (row) resolve(row);
                else {
                    // Tentar por LIKE
                    db.get("SELECT * FROM jogadores WHERE nome LIKE ?", [`%${nomeJogador}%`], (err, row2) => {
                        if (err) reject(err);
                        else resolve(row2);
                    });
                }
            });
        });
        
        if (!jogador) {
            return MessageService.send({ message: msg, text: templates.erro(`Jogador "${nomeJogador}" não encontrado no sistema.`) });
        }
        
        const afinidadeAntiga = jogador.afinidade_elemental || "Nenhuma";
        
        // Atualizar afinidade no jogador
        await new Promise((resolve, reject) => {
            db.run(
                "UPDATE jogadores SET afinidade_elemental = ?, afinidade_sorteada = 1 WHERE id = ?",
                [elementoCapitalizado, jogador.id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        // Atualizar também na tabela de fichas
        await new Promise((resolve, reject) => {
            db.run(
                "UPDATE fichas SET elemento = ? WHERE jogador = ?",
                [elementoCapitalizado, jogador.numero],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        // Registrar log administrativo
        db.run(
            "INSERT INTO admin_logs (admin_numero, admin_nome, acao, alvo, detalhes, valor_antigo, valor_novo, data) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))",
            [numeroAdm, admin.nome || "Admin", "alterar afinidade", jogador.nome, `Afinidade alterada de "${afinidadeAntiga}" para "${elementoCapitalizado}"`, afinidadeAntiga, elementoCapitalizado]
        );
        
        await MessageService.send({ message: msg, text: `
*═══ AFINIDADE ALTERADA COM SUCESSO! ═══*
${templates.divisor()}
Jogador: *${jogador.nome}*
Afinidade Antiga: ${afinidadeAntiga}
Nova Afinidade: *${elementoCapitalizado}*

Categoria: ${elemento.categoria}
Raridade: ${elemento.raridade}
Bônus: +${elemento.bonusAfinidade}% Poder Mágico
${templates.divisor()}
${templates.sucesso("Alteração registrada no sistema.")}
        ` });
        
    } catch (erro) {
        console.log("Erro no comando admin afinidade:", erro);
        return MessageService.send({ message: msg, text: templates.erro("Erro ao executar comando administrativo.") });
    }
};

function carregarElementosDisponiveis() {
    try {
        return elementos.map(e => `> ${e.nome} (${e.raridade})`).join("\n");
    } catch {
        return "> Erro ao carregar elementos";
    }
}
