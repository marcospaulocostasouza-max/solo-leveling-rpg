const MessageService = require("../core/messageService");

/**
 * COMANDO: !sortear afinidade
 * 
 * Sorteia uma afinidade elemental para o jogador.
 * Salva permanentemente no banco de dados.
 * Só pode ser usado uma vez.
 */

const db = require("../core/database");
const templates = require("../utils/templatesMensagens");
const elementos = require("../elementos/listaElementos");
const LIMITE_VARIANTE_ACIMA_DE_RARA = 1;

module.exports = async (msg) => {
    try {
        const numeroJogador = msg.author || msg.from;
        
        // Verificar se o jogador já tem uma afinidade salva
        let jogador = await new Promise((resolve, reject) => {
            db.get("SELECT id, afinidade_elemental, afinidade_sorteada FROM jogadores WHERE numero = ?", [numeroJogador], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        // Se o jogador não existe na tabela, criar um registro básico
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
            // Buscar novamente
            jogador = await new Promise((resolve, reject) => {
                db.get("SELECT id, afinidade_elemental, afinidade_sorteada FROM jogadores WHERE numero = ?", [numeroJogador], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        }
        
        // Verificar se já possui afinidade OU já sorteou anteriormente
        if (jogador && (jogador.afinidade_sorteada === 1 || (jogador.afinidade_elemental && jogador.afinidade_elemental !== "Nenhuma"))) {
            return MessageService.send({ message: msg, text: `
*═══ VOCÊ JÁ POSSUI UMA AFINIDADE! ═══*
${templates.divisor()}
Sua afinidade elemental é: *${jogador.afinidade_elemental}*
${templates.divisor()}
_Use !consultar afinidade para ver detalhes._
            ` });
        }

        const ocupacaoRara = await new Promise((resolve, reject) => db.all(
            `SELECT LOWER(afinidade_elemental) AS elemento, COUNT(*) AS total
             FROM jogadores
             WHERE afinidade_elemental IS NOT NULL AND afinidade_elemental <> 'Nenhuma' AND numero <> ?
             GROUP BY LOWER(afinidade_elemental)`, [numeroJogador],
            (err, rows) => err ? reject(err) : resolve(new Map((rows || []).map(row => [row.elemento, Number(row.total)])))
        ));
        const acimaDeRara = new Set(["Muito Raro", "Lendário"]);
        const elementosSorteaveis = elementos.filter(e => e.sorteavel === true && (
            !acimaDeRara.has(e.raridade) || (ocupacaoRara.get(e.nome.toLowerCase()) || 0) < LIMITE_VARIANTE_ACIMA_DE_RARA
        ));

        if (!elementosSorteaveis || elementosSorteaveis.length === 0) {
            return MessageService.send({ message: msg, text: templates.erro("Nenhum elemento disponível para sorteio.") });
        }

        // Pool de sorteio baseado em raridade
        let sorteados = [];
        elementosSorteaveis.forEach(elemento => {
            let chance = 0;
            switch(elemento.raridade) {
                case "Comum": chance = 70; break;
                case "Incomum": chance = 20; break;
                case "Raro": chance = 8; break;
                case "Muito Raro": chance = 2; break;
                case "Lendário": chance = 1; break;
            }
            for(let i = 0; i < chance; i++) sorteados.push(elemento);
        });

        const resultado = sorteados[Math.floor(Math.random() * sorteados.length)];

        if (!resultado) {
            return MessageService.send({ message: msg, text: templates.erro("Não foi possível sortear a afinidade elemental.") });
        }

        // Salvar afinidade no banco de dados permanentemente
        await new Promise((resolve, reject) => {
            db.run(
                "UPDATE jogadores SET afinidade_elemental = ?, afinidade_sorteada = 1 WHERE numero = ?",
                [resultado.nome, numeroJogador],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        await MessageService.send({ message: msg, text: `
*═══ DESPERTAR ELEMENTAL ═══*
${templates.divisor()}
_A energia mágica começou a reagir..._
*═══ Afinidade Elemental despertada: ═══*
> *${resultado.nome}*

> Categoria: ${resultado.categoria}
> Raridade: ${resultado.raridade}
> Bônus de Afinidade: +${resultado.bonusAfinidade}% Poder Mágico
${templates.divisor()}
_Sua afinidade foi salva permanentemente!_
_Use !consultar afinidade para ver detalhes._
        ` });

        return resultado;

    } catch (erro) {
        console.log("Erro no sorteio elemental:", erro);
        return MessageService.send({ message: msg, text: templates.erro("Erro ao realizar sorteio elemental.") });
    }
};
