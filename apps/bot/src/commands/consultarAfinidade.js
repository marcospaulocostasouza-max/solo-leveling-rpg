const MessageService = require("../core/messageService");

/**
 * COMANDO: !consultar afinidade
 * 
 * Exibe a afinidade elemental que o jogador possui.
 * Caso não tenha, informa que precisa sortear.
 */

const db = require("../core/database");
const templates = require("../utils/templatesMensagens");
const elementos = require("../elementos/listaElementos");
const AfinidadesAdicionais = require("../systems/afinidadesAdicionaisSystem");

module.exports = async (msg) => {
    try {
        const numeroJogador = msg.author || msg.from;
        
        const jogador = await new Promise((resolve, reject) => {
            db.get("SELECT id, afinidade_elemental FROM jogadores WHERE numero = ?", [numeroJogador], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        // Se jogador não existe, criar registro básico
        if (!jogador) {
            await new Promise((resolve, reject) => {
                db.run(
                    "INSERT OR IGNORE INTO jogadores (numero, afinidade_elemental, afinidade_sorteada) VALUES (?, 'Nenhuma', 0)",
                    [numeroJogador],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
        
        if (!jogador || !jogador.afinidade_elemental || jogador.afinidade_elemental === "Nenhuma") {
            return MessageService.send({ message: msg, text: `
*═ NENHUMA AFINIDADE ENCONTRADA*
${templates.divisor()}
Você ainda não possui uma afinidade elemental.
${templates.divisor()}
_Use *!sortear afinidade* para descobrir seu elemento!_
            ` });
        }
        
        // Buscar detalhes do elemento
        const elemento = elementos.find(e => e.nome === jogador.afinidade_elemental);
        
        let mensagem = `*═══ SUA AFINIDADE ELEMENTAL ═══*
${templates.divisor()}
> *Elemento Primário:* ${jogador.afinidade_elemental}`;
        
        if (elemento) {
            mensagem += `\n> Categoria: ${elemento.categoria}`;
            mensagem += `\n> Raridade: ${elemento.raridade}`;
            mensagem += `\n> Bônus: +${elemento.bonusAfinidade}% Poder Mágico`;
            
            if (elemento.vantagens && elemento.vantagens.length > 0) {
                mensagem += `\n> Vantagens contra: ${elemento.vantagens.join(", ")}`;
            }
        }
        
        const adicionais = await AfinidadesAdicionais.listar(jogador.id);
        for (const afinidade of adicionais) {
            mensagem += `\n> *${Number(afinidade.slot) === 2 ? "Segundo Elemento" : "Terceiro Elemento"}:* ${afinidade.elemento}`;
        }

        mensagem += `\n${templates.divisor()}`;
        mensagem += `\n\n*Expressão visual e narrativa*`;
        mensagem += `\nA afinidade fortalece técnicas do mesmo elemento conforme as regras delas. Você também pode aplicar características visuais do elemento às suas técnicas, independentemente da classe inicial.`;
        mensagem += `\n\nExemplo: um Assassino com afinidade de Fogo pode narrar sua lâmina envolta em chamas. Isso é *somente visual e narrativo*: não muda o efeito, não acrescenta dano e não concede bônus extra.`;
        mensagem += `\n${templates.divisor()}\n_Afinidade salva permanentemente no sistema._`;
        
        await MessageService.send({ message: msg, text: mensagem });
        
    } catch (erro) {
        console.log("Erro ao consultar afinidade:", erro);
        return MessageService.send({ message: msg, text: templates.erro("Erro ao consultar afinidade.") });
    }
};
