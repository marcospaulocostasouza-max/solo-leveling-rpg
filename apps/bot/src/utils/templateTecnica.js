/**
 * TEMPLATE DE EXIBIÇÃO DE TÉCNICAS
 * 
 * Formato padronizado para todas as técnicas do RPG.
 * Usado em comandos como !tecnicas, !comprar tecnica, !habilidades, etc.
 */

const divisores = {
    principal: "──────────────────────────",
    tecnica: "┃Técnicas 𖥔 Solo Leveling",
    secao: "─── ── ── ── ── ──",
    situacao: "─( ◆ )───── Situação",
    libera: "─( ◆ )───── O Que Libera",
    detalhes: "─( ◆ )───── Detalhes",
    requisitos: "─( ◆ )───── Requisitos",
    limites: "─( ◆ )───── Limites",
    up: "─( ◆ )───── UP",
    acao: "─( ◆ )───── Ação"
};

/**
 * Exibe uma técnica no formato padronizado
 * @param {Object} tecnica - Dados da técnica
 * @param {Object} jogador - Dados do jogador (para verificarQI/recurso)
 * @param {String} tipoRecurso - nome do recurso exibido
 * @returns {String} Mensagem formatada
 */
function exibirTecnica(tecnicas, jogador = null, tipoRecurso = "Maestria") {
    if (!tecnicas || tecnicas.length === 0) {
        return `_Nenhuma técnica encontrada._`;
    }

    let mensagem = `${divisores.principal}\n`;
    mensagem += `${divisores.tecnica}\n`;
    mensagem += `${divisores.secao}\n\n`;

    tecnicas.forEach((tecnica, index) => {
        // Nome da técnica
        mensagem += `*${tecnica.nome}*\n`;
        
        // Descrição completa (estilo PDF)
        const descricaoExibir = tecnica.descricao_completa || tecnica.descricao || "Sem descrição.";
        mensagem += `> ${descricaoExibir}\n\n`;

        // =====================================
        // SITUAÇÃO (Disponibilidade e Custo)
        // =====================================
        mensagem += `${divisores.situacao}\n`;
        mensagem += `*Status:* Disponível\n`;
        const custoMaestria = tecnica.custo_maestria ?? tecnica.custo_qi ?? 0;
        mensagem += `*Custo:* ${tecnica.custo_maestria_formatado || `${custoMaestria} de Maestria`}\n`;
        
        if (jogador) {
            const recursoJogador = jogador.maestria || 0;
            const falta = Math.max(0, custoMaestria - recursoJogador);
            mensagem += `*Você tem:* ${recursoJogador} ${tipoRecurso}\n`;
            mensagem += `*Falta:* ${falta} ${tipoRecurso}\n`;
        }
        mensagem += `\n`;

        // =====================================
        // O QUE LIBERA (Benefícios)
        // =====================================
        mensagem += `${divisores.libera}\n`;
        mensagem += `> ${tecnica.beneficios || descricaoExibir || "Aumenta poder de combate."}\n`;
        mensagem += `> *Custo de Mana:* ${tecnica.custo_mana || 0} MP\n`;
        if (tecnica.cooldown > 0) {
            mensagem += `> *Recarga:* ${tecnica.cooldown} turno(s)\n`;
        }
        if (tecnica.passiva) {
            mensagem += `> *Tipo:* Passiva (sempre ativa)\n`;
        }
        mensagem += `\n`;

        // =====================================
        // DETALHES
        // =====================================
        mensagem += `${divisores.detalhes}\n`;
        mensagem += `*Classe:* ${tecnica.classe || "Geral"}\n`;
        mensagem += `*Categoria:* ${tecnica.categoria || "Geral"}\n`;
        mensagem += `*Tipo:* ${tecnica.tipo || "Ativa"}\n`;
        if (tecnica.passiva) {
            mensagem += `*Passiva:* Sim\n`;
        }
        mensagem += `*Custo de Mana:* ${tecnica.custo_mana || 0} MP\n`;
        if (tecnica.cooldown > 0) {
            mensagem += `*Recarga:* ${tecnica.cooldown} turno(s)\n`;
        }
        mensagem += `*Nível Mínimo:* ${tecnica.nivel_desbloqueio || 1}\n\n`;

        // =====================================
        // REQUISITOS
        // =====================================
        mensagem += `${divisores.requisitos}\n`;
        if (tecnica.requisitos && tecnica.requisitos.length > 0) {
            tecnica.requisitos.forEach(req => {
                mensagem += `*• ${req}*\n`;
            });
        } else {
            mensagem += `*• Nível ${tecnica.nivel_desbloqueio || 1}*\n`;
        }
        
        if (jogador) {
            const nivelJogador = jogador.nivel || 1;
            const faltaNivel = Math.max(0, (tecnica.nivel_desbloqueio || 1) - nivelJogador);
            if (faltaNivel > 0) {
                mensagem += `\n*Faltando:* ${faltaNivel} níveis\n`;
            } else {
                mensagem += `\n*Nível atual:* ${nivelJogador} ✓\n`;
            }
        }
        mensagem += `\n`;

        // =====================================
        // LIMITES
        // =====================================
        mensagem += `${divisores.limites}\n`;
        mensagem += `> Dano calculado de acordo com o sistema de atributos.\n`;
        if (tecnica.limitacoes) {
            mensagem += `> ${tecnica.limitacoes}\n`;
        }
        if (tecnica.passiva) {
            mensagem += `> Efeito passivo: sempre ativo.\n`;
        }
        mensagem += `\n`;

        // =====================================
        // UP (Evolução)
        // =====================================
        if (tecnica.evolucao || tecnica.levels) {
            mensagem += `${divisores.up}\n`;
            if (tecnica.evolucao) {
                tecnica.evolucao.forEach(evo => {
                    mensagem += `*Level ${evo.level}:* ${evo.descricao}\n`;
                });
            }
            mensagem += `> _Sistema de UP disponível via Tokens._\n\n`;
        }

        // =====================================
        // AÇÃO
        // =====================================
        mensagem += `${divisores.acao}\n`;
        mensagem += `> !comprar tecnica ${tecnica.nome.toLowerCase().replace(/ /g, '_')}\n`;
        mensagem += `> Custo: ${tecnica.custo_qi_formatado || tecnica.custo_qi + " Qi" || "10 Qi"}\n\n`;
        
        mensagem += `${divisores.principal}\n\n`;
    });

    return mensagem;
}

/**
 * Exibe lista resumida de técnicas
 * @param {Array} tecnicas - Lista de técnicas
 * @param {String} categoria - Categoria para filtrar
 * @returns {String} Mensagem formatada
 */
function exibirListaTecnicas(tecnicas, categoria = null) {
    if (!tecnicas || tecnicas.length === 0) {
        return `_Nenhuma técnica encontrada._`;
    }

    let mensagem = `${divisores.principal}\n`;
    mensagem += `${divisores.tecnica}\n`;
    mensagem += `${divisores.secao}\n\n`;

    if (categoria) {
        mensagem += `*─── ${categoria} ───*\n\n`;
    }

    tecnicas.forEach((tecnica, index) => {
        mensagem += `*${index + 1}. ${tecnica.nome}*\n`;
        mensagem += `> Custo: ${tecnica.custo_qi_formatado || tecnica.custo_qi + " Qi" || "10 Qi"} | ${tecnica.custo_mana || 0} MP\n`;
        const descLista = tecnica.descricao_completa || tecnica.descricao || "Sem descrição.";
        mensagem += `> ${descLista.substring(0, 100)}${descLista.length > 100 ? "..." : ""}\n\n`;
    });

    mensagem += `${divisores.principal}\n`;
    mensagem += `_Use o nome da técnica para ver detalhes completos._`;

    return mensagem;
}

module.exports = {
    exibirTecnica,
    exibirListaTecnicas,
    divisores
};
