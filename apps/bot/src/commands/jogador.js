const MessageService = require("../core/messageService");

/**
 * COMANDO: !jogador / !status
 * 
 * Exibe a ficha completa do jogador com todas as informações.
 * Inclui identidade, combate, atributos, equipamentos e história.
 * Agora mostra pontos de atributo disponíveis e instruções de uso.
 */

const db = require("../core/database");
const AtributoSystem = require("../systems/atributoSystem");
const InventorySystem = require("../systems/inventorySystem");
const AfinidadesAdicionais = require("../systems/afinidadesAdicionaisSystem");
const get = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});
const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
    });
});

function normalizar(valor) {
    return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

module.exports = async (msg) => {
    try {
        const numero = msg.author || msg.from;
        
        // Buscar dados completos do jogador
        let jogador = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!jogador) {
            return MessageService.send({ message: msg, text: `
*═ JOGADOR NÃO ENCONTRADO*
──────────────────────────
Você ainda não possui uma ficha criada.

_Use *!ficha* para criar seu personagem._
            ` });
        }
        
        // RECALCULAR ATRIBUTOS ANTES DE EXIBIR (garante bônus de equipamentos atualizados)
        await AtributoSystem.recalcularAtributos(jogador.id);
        
        // Buscar dados atualizados após recálculo
        jogador = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM jogadores WHERE id = ?", [jogador.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        // Buscar bônus de equipamentos para exibir separadamente
        const bonusEquip = await InventorySystem.calcularBonusEquipados(jogador.id);
        const afinidadesAdicionais = await AfinidadesAdicionais.listar(jogador.id);
        
        // Atributos totais (agora atualizados pelo recalcularAtributos)
        const forcaTotal = Number(jogador.forca_total || 0);
        const resistenciaTotal = Number(jogador.resistencia_total || 0);
        const velocidadeTotal = Number(jogador.velocidade_total || 0);
        const sentidosTotal = Number(jogador.sentidos_total || 0);
        const inteligenciaTotal = Number(jogador.inteligencia_total || 0);
        const poderMagicoTotal = Number(jogador.poder_magico_total || 0);
        
        // Montar mensagem
        let mensagem = `*═══ FICHA DO PERSONAGEM ═══*\n\n`;
        
        // Identidade
        mensagem += `*─── Identidade ───*\n`;
        mensagem += `> *Nome:* ${jogador.nome}\n`;
        mensagem += `> *Raça:* ${jogador.raca || "Humano"}\n`;
        mensagem += `> *Idade:* ${jogador.idade || "?"} anos\n`;
        mensagem += `> *Gênero:* ${jogador.sexo || "?"}\n`;
        mensagem += `> *Nacionalidade:* ${jogador.nacionalidade || "?"}\n`;
        mensagem += `> *Altura:* ${jogador.altura || "?"}m\n`;
        mensagem += `> *Peso:* ${jogador.peso || "?"}kg\n\n`;
        
        // Personalidade e Aparência
        if (jogador.personalidade && jogador.personalidade !== "?" && jogador.personalidade !== "") {
            mensagem += `*─── Personalidade ───*\n`;
            mensagem += `> ${jogador.personalidade}\n\n`;
        }
        if (jogador.aparencia && jogador.aparencia !== "?" && jogador.aparencia !== "") {
            mensagem += `*─── Aparência ───*\n`;
            mensagem += `> ${jogador.aparencia}\n\n`;
        }
        
        // Combate
        mensagem += `*─── Combate ───*\n`;
        mensagem += `> *Classe:* ${jogador.classe || "Não definida"}\n`;
        if (String(jogador.classe || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() === "mago elemental") {
            mensagem += `> *Elemento Primário:* ${jogador.afinidade_elemental || "Não definido"}\n`;
        }
        mensagem += `> *Classe Avançada:* ${jogador.classe_avancada || "Nenhuma"}\n`;
        mensagem += `> *Estilo de Luta:* ${jogador.estilo_luta || "Nenhum"}\n`;
        mensagem += `> *Arma Inicial:* ${jogador.arma_inicial || "Nenhuma"}\n`;
        mensagem += `> *Rank:* ${jogador.rank || "E"}\n`;
        mensagem += `> *Nível:* ${jogador.nivel || 1}\n`;
        mensagem += `> *XP:* ${jogador.experiencia || 0}\n`;
        mensagem += `> *Maestria:* ${jogador.maestria || 0}\n`;
        mensagem += `> *Won:* ${jogador.won || 0}\n\n`;
        
        // Buscar cargo na Associação
        const membroAssociacao = await new Promise((resolve) => {
            db.get("SELECT cargo FROM associacao_membros WHERE jogador_id = ? AND ativo = 1", [jogador.id], (err, row) => {
                resolve(row);
            });
        });
        
        // Afinidades
        mensagem += `*─── Afinidades ───*\n`;
        mensagem += `> *Elemento:* ${jogador.afinidade_elemental || "Nenhuma"}\n`;
        for (const afinidade of afinidadesAdicionais) {
            mensagem += `> *${Number(afinidade.slot) === 2 ? "Segundo Elemento" : "Terceiro Elemento"}:* ${afinidade.elemento}\n`;
        }
        mensagem += `> *Habilidade Única:* ${jogador.habilidade_unica || "Nenhuma"}\n`;
        mensagem += `> *Título:* ${jogador.titulo || "Nenhum"}\n\n`;
        
        // Cargo na Associação
        if (membroAssociacao && membroAssociacao.cargo) {
            mensagem += `*─── Cargo na Associação ───*\n`;
            mensagem += `> *Cargo:* ${membroAssociacao.cargo}\n\n`;
        }
        
        // Atributos Base
        mensagem += `*─── Atributos Base ───*\n`;
        mensagem += `> *Força:* ${jogador.forca_base || 0}\n`;
        mensagem += `> *Resistência:* ${jogador.resistencia_base || 0}\n`;
        mensagem += `> *Velocidade:* ${jogador.velocidade_base || 0}\n`;
        mensagem += `> *Sentidos:* ${jogador.sentidos_base || 0}\n`;
        mensagem += `> *Inteligência:* ${jogador.inteligencia_base || 0}\n`;
        mensagem += `> *Poder Mágico:* ${jogador.poder_magico_base || 0}\n\n`;
        
        // Bônus de Classe Avançada
        mensagem += `*─── Bônus de Classe ───*\n`;
        mensagem += `> *Força:* +${jogador.forca_buff || 0}\n`;
        mensagem += `> *Resistência:* +${jogador.resistencia_buff || 0}\n`;
        mensagem += `> *Velocidade:* +${jogador.velocidade_buff || 0}\n`;
        mensagem += `> *Sentidos:* +${jogador.sentidos_buff || 0}\n`;
        mensagem += `> *Inteligência:* +${jogador.inteligencia_buff || 0}\n`;
        mensagem += `> *Poder Mágico:* +${jogador.poder_magico_buff || 0}\n\n`;
        
        // Bônus de Equipamentos
        mensagem += `*─── Bônus de Equipamentos ───*\n`;
        mensagem += `> *Força:* +${bonusEquip.forca || 0}\n`;
        mensagem += `> *Resistência:* +${bonusEquip.resistencia || 0}\n`;
        mensagem += `> *Velocidade:* +${bonusEquip.velocidade || 0}\n`;
        mensagem += `> *Sentidos:* +${bonusEquip.sentidos || 0}\n`;
        mensagem += `> *Inteligência:* +${bonusEquip.inteligencia || 0}\n`;
        mensagem += `> *Poder Mágico:* +${bonusEquip.poderMagico || 0}\n\n`;

        const tecnicas = await all(
            "SELECT t.nome, t.classe, t.categoria FROM jogador_tecnicas jt JOIN tecnicas t ON t.id = jt.tecnica_id WHERE jt.jogador_id = ? ORDER BY t.classe, t.nome",
            [jogador.id]
        );
        const gruposTecnicas = { "Classe": [], "Classe Avançada": [], "Estilo de Luta": [], "Outras": [] };
        for (const tecnica of tecnicas) {
            const classeTecnica = normalizar(tecnica.classe);
            const classeBase = normalizar(jogador.classe);
            const classeAvancada = normalizar(jogador.classe_avancada);
            if (classeTecnica && classeTecnica === classeBase) gruposTecnicas["Classe"].push(tecnica.nome);
            else if (classeTecnica && classeTecnica === classeAvancada) gruposTecnicas["Classe Avançada"].push(tecnica.nome);
            else if (normalizar(tecnica.categoria).includes("proficiencia")) gruposTecnicas["Estilo de Luta"].push(tecnica.nome);
            else gruposTecnicas.Outras.push(tecnica.nome);
        }

        mensagem += `*─── Técnicas Aprendidas ───*\n`;
        mensagem += `> *Total:* ${tecnicas.length}\n`;
        if (tecnicas.length === 0) {
            mensagem += `> Nenhuma técnica aprendida ainda.\n`;
        } else {
            for (const [titulo, lista] of Object.entries(gruposTecnicas)) {
                if (lista.length === 0) continue;
                const preview = lista.slice(0, 4).join(" • ");
                mensagem += `> *${titulo}:* ${preview}${lista.length > 4 ? ` • +${lista.length - 4}` : ""}\n`;
            }
        }
        mensagem += `> Use *!minhas técnicas* para ver a lista completa.\n\n`;
        
        // Atributos Totais
        mensagem += `*─── Atributos Totais ───*\n`;
        mensagem += `> *Força Total:* ${forcaTotal}\n`;
        mensagem += `> *Resistência Total:* ${resistenciaTotal}\n`;
        mensagem += `> *Velocidade Total:* ${velocidadeTotal}\n`;
        mensagem += `> *Sentidos Total:* ${sentidosTotal}\n`;
        mensagem += `> *Inteligência Total:* ${inteligenciaTotal}\n`;
        mensagem += `> *Poder Mágico Total:* ${poderMagicoTotal}\n\n`;
        
        // Vida/Mana
        mensagem += `*─── Vida/Mana ───*\n`;
        mensagem += `> *HP:* ${jogador.vida_atual || 0}/${jogador.vida_maxima || 100}\n`;
        mensagem += `> *Mana:* ${jogador.mana_atual || 0}/${jogador.mana_maxima || 100} MP\n\n`;

        // Slots de Equipamento
        mensagem += `*─── Equipamentos ───*\n`;
        mensagem += `> Use *!equipados* para ver seus slots de equipamento\n`;
        mensagem += `> Use *!equipar <item>* para equipar/desequipar\n\n`;
        
        // =====================================
        // PONTOS DE ATRIBUTO DISPONÍVEIS
        // =====================================
        const pontosAtributo = jogador.pontos_atributo || 0;
        mensagem += `*─── Pontos de Atributo ───*\n`;
        mensagem += `> *Pontos Disponíveis:* ${pontosAtributo}\n`;
        
        if (pontosAtributo > 0) {
            mensagem += `\n*╔══ COMO DISTRIBUIR ══╗*\n`;
            mensagem += `Use: *!distribuir <quantidade> <atributo>*\n`;
            mensagem += `Exemplo: *!distribuir 3 forca 2 resistencia*\n\n`;
            mensagem += `*Atributos:* Forca | Resistencia | Velocidade\n`;
            mensagem += `          Sentidos | Inteligencia | Poder Magico\n\n`;
            mensagem += `*Você recebe:*\n`;
            mensagem += `> +3 pontos por nível\n`;
            mensagem += `> +1 em cada atributo por nível (automático)\n`;
            mensagem += `> Bônus por evolução de Rank\n`;
            mensagem += `> Bônus por Classes Avançadas\n`;
        } else {
            mensagem += `\n_Você não tem pontos disponíveis no momento._\n`;
            mensagem += `_Ganhe pontos ao subir de nível (+3 por nível)!_\n`;
        }
        mensagem += `\n`;
        
        // História
        // Comandos rápidos
        mensagem += `*─── Comandos Rápidos ───*\n`;
        mensagem += `> !distribuir | !inventario | !equipados\n`;
        mensagem += `> !equipar | !tecnicas | !passivas\n`;
        mensagem += `> !meus titulos | !atividades | !atributos\n\n`;
        
        mensagem += `──────────────────────────\n`;
        mensagem += `_Sistema Online_`;
        
        await MessageService.send({ message: msg, text: mensagem });
        
    } catch (error) {
        console.error("Erro ao exibir ficha do jogador:", error);
        return MessageService.send({ message: msg, text: `*═ ERRO*\n_Ocorreu um erro ao carregar sua ficha._` });
    }
};
