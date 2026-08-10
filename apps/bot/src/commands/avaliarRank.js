const MessageService = require("../core/messageService");

/**
 * COMANDO: !avaliar rank
 * 
 * Sistema de avaliação de rank.
 * ADM avalia e concede ranks aos jogadores conforme os requisitos.
 * 
 * REGRAS:
 * Rank E: Nível 1 (inicial)
 * Rank D: Nível 15 → Bônus: 15 pontos, 50.000 Won
 * Rank C: Nível 30 → Bônus: 20 pontos, 70.000 Won
 * Rank B: Nível 60 → Bônus: 25 pontos, 80.000 Won
 * Rank A: Nível 80 → Bônus: 50 pontos, 100.000 Won
 * Rank S: Nível 100 → Bônus: 150 pontos, 1.000.000 Won
 * 
 * Uso:
 * !avaliar rank <nome> <rank> - ADM concede rank ao jogador
 * !rank requisitos - Mostra requisitos de cada rank
 */

const db = require("../core/database");
const adminCore = require("../core/adminCore");
const LevelSystem = require("../systems/levelSystem");

const RANK_INFO = {
    "E": { nivel: 1, bonus: "Rank inicial" },
    "D": { nivel: 15, bonus: "15 pontos de atributo + 50.000 Won" },
    "C": { nivel: 30, bonus: "20 pontos de atributo + 70.000 Won" },
    "B": { nivel: 60, bonus: "25 pontos de atributo + 80.000 Won" },
    "A": { nivel: 80, bonus: "50 pontos de atributo + 100.000 Won" },
    "S": { nivel: 100, bonus: "150 pontos de atributo + 1.000.000 Won" }
};

module.exports = async (msg) => {
    try {
        const texto = msg.body.toLowerCase().trim();
        const numero = msg.author || msg.from;
        
        // !rank requisitos - Mostra requisitos (qualquer um pode ver)
        if (texto === '!rank requisitos' || texto === '!rank info') {
            let mensagem = `*═══ REQUISITOS DE RANK ═══*
──────────────────────────

*Rank E* - Nivel 1
> Rank inicial de todo Cacador

*Rank D* - Nivel 15
> Bonus: 15 pontos de atributo + 50.000 Won

*Rank C* - Nivel 30
> Bonus: 20 pontos de atributo + 70.000 Won

*Rank B* - Nivel 60
> Bonus: 25 pontos de atributo + 80.000 Won

*Rank A* - Nivel 80
> Bonus: 50 pontos de atributo + 100.000 Won

*Rank S* - Nivel 100
> Bonus: 150 pontos de atributo + 1.000.000 Won

*O QUE DEFINE O RANK*
> Rank identifica a faixa oficial de ameaça e responsabilidade de um Caçador.
> Ele acompanha a progressão do personagem e sobe automaticamente ao alcançar o nível exigido.
> Os requisitos abaixo mostram os marcos usados pelo sistema para reconhecer essa evolução.
> Rank também orienta missões, dungeons e a leitura narrativa do poder de cada ficha.
> Acima dos ranks conhecidos existe um rank secreto, reservado a condições excepcionais da história.
> O rank não substitui julgamento narrativo: técnica, condição e cena ainda importam.

──────────────────────────
_Para solicitar avaliacao de rank, procure um ADM._
_ADMs usam: !avaliar rank <jogador> <rank>_`;
            
            return MessageService.send({ message: msg, text: mensagem });
        }
        
        // Verificar se é admin
        const admin = await adminCore.isAdmin(numero);
        if (!admin) {
            if (texto.startsWith('!avaliar rank')) {
                return MessageService.send({ message: msg, text: "═ *ACESSO NEGADO*\n\nComando restrito para administradores." });
            }
            return;
        }
        
        // !avaliar rank <nome> <rank>
        if (texto.startsWith('!avaliar rank ')) {
            const restante = texto.replace('!avaliar rank ', '').trim();
            const partes = restante.split(/\s+/);
            
            if (partes.length < 2) {
                return MessageService.send({ message: msg, text: `
*═══ AVALIAR RANK ═══*
──────────────────────────

Uso: *!avaliar rank <jogador> <rank>*

Ranks disponiveis: E, D, C, B, A, S
Exemplo: !avaliar rank SungJinWoo D

──────────────────────────` });
            }
            
            const rankDesejado = partes.pop().toUpperCase();
            const nomeJogador = partes.join(' ');
            
            if (!['E', 'D', 'C', 'B', 'A', 'S'].includes(rankDesejado)) {
                return MessageService.send({ message: msg, text: `Rank invalido: ${rankDesejado}. Use: E, D, C, B, A ou S.` });
            }
            
            // Buscar jogador
            let jogador = await adminCore.buscarJogador(nomeJogador);
            if (!jogador) {
                jogador = await adminCore.buscarJogadorLike(nomeJogador);
            }
            if (!jogador) return MessageService.send({ message: msg, text: `Jogador "${nomeJogador}" nao encontrado.` });
            
            const adminInfo = await adminCore.getAdminLevel(numero);
            
            // Aplicar rank
            const resultado = await LevelSystem.aplicarRank(jogador.id, rankDesejado);
            
            if (resultado.success) {
                // Registrar log
                adminCore.registrarLog(
                    numero, adminInfo.nome || "Admin",
                    'avaliar_rank', jogador.nome,
                    `Rank ${rankDesejado} concedido`,
                    jogador.rank, rankDesejado
                );
                
                return MessageService.send({ message: msg, text: `
*═══ RANK CONCEDIDO! ═══*
──────────────────────────

Jogador: *${jogador.nome}*
Novo Rank: *${rankDesejado}*
Rank Anterior: ${jogador.rank}

${resultado.mensagem}

──────────────────────────
_Avaliado por: ${adminInfo.nome || "Admin"}_` });
            } else {
                return MessageService.send({ message: msg, text: `═ ${resultado.mensagem}` });
            }
        }
        
    } catch (error) {
        console.error("Erro no comando avaliar rank:", error);
        return MessageService.send({ message: msg, text: "═ Erro ao processar avaliacao de rank." });
    }
};
