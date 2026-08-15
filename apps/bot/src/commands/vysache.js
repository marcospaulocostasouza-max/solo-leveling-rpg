const MessageService = require("../core/messageService");

/**
 * COMANDO: !Olá Vysache / !ola vysache
 * 
 * Sistema completo de interação com o NPC ferreiro Vysache.
 * 
 * Fluxo de conversa:
 * 1. Player: !Olá Vysache → Bot responde como Vysache
 * 2. Player: !preciso de um item → Bot pede materiais e envia ficha
 * 3. Player: envia ficha preenchida → Bot analisa e informa custo
 * 4. Player: !pode sim → Bot executa forja, desconta valor e envia item
 * 
 * Comandos auxiliares:
 * - !vysache afinidade → Mostra afinidade atual com Vysache
 * - !vysache forja nacional → Solicita forja nacional (requer 100% afinidade)
 * - !vysache combinacoes → Lista combinações de materiais conhecidas
 * - !vysache ficha → Exibe a ficha do NPC
 */

const db = require("../core/database");
const JogadorCore = require("../core/jogadorCore");
const ForjaSystem = require("../systems/forjaSystem");
const EconomySystem = require("../systems/economySystem");
const templates = require("../utils/templatesMensagens");

// Armazenamento temporário de sessões de conversa (em memória)
const sessoesVysache = {};

function nomeFerreiroDoTexto(texto) {
    return texto.includes("bilac") ? "Bilac" : "Vysache";
}

async function obterSessao(jogador, numero) {
    if (sessoesVysache[numero]) return sessoesVysache[numero];
    const persistida = await ForjaSystem.getSessao(jogador.id);
    if (!persistida) return null;
    sessoesVysache[numero] = {
        sessaoId: persistida.id,
        etapa: persistida.etapa,
        jogadorId: jogador.id,
        npcNome: persistida.npc_nome,
        inicio: Date.now()
    };
    return sessoesVysache[numero];
}

module.exports = async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    const numero = msg.author || msg.from;

    // Buscar jogador
    const jogador = await JogadorCore.buscarPorNumero(numero);

    if (!jogador) {
        return MessageService.send({ message: msg, text: 
            `${templates.titulo("VYSACHE - FERREIRO")}\n` +
            `${templates.divisor()}\n\n` +
            `⚠ Você precisa ter uma ficha aprovada para interagir com Vysache.\n\n` +
            `> Use *!ficha* para criar seu personagem.`
         });
    }

    // =====================================
    // !Olá Vysache - Início da conversa
    // =====================================
    if (["!olá vysache", "!ola vysache", "!olá visache", "!ola visache", "!olá bilac", "!ola bilac"].includes(texto)) {
        const npcNome = nomeFerreiroDoTexto(texto);
        // Criar sessão de forja
        const sessaoBanco = await ForjaSystem.criarSessao(jogador.id, npcNome);
        if (!sessaoBanco) return MessageService.send({ message: msg, text: "*A forja não conseguiu abrir uma sessão agora. Tente novamente.*" });

        // Iniciar sessão de conversa em memória
        sessoesVysache[numero] = {
            sessaoId: sessaoBanco.id,
            etapa: "saudacao",
            jogadorId: jogador.id,
            npcNome,
            inicio: Date.now()
        };

        // Buscar afinidade atual
        const afinidade = await ForjaSystem.getAfinidade(jogador.id, npcNome);

        let mensagem = `*═══ 🔨 ${npcNome.toUpperCase()} ═══*\n`;
        mensagem += `${templates.divisor()}\n\n`;
        mensagem += npcNome === "Bilac"
            ? `*Bilac:* "Ora, uma encomenda? Mostre o que trouxe. Se o metal for grande demais para minha bigorna, eu mesmo o mando falar com meu pai."\n\n`
            : `*Vysache:* "Bilac o encaminhou ou você trouxe algo digno da minha bigorna? Fale."\n\n`;
        mensagem += `${templates.divisor()}\n`;
        mensagem += `> *Afinidade:* ${afinidade.afinidade}%\n`;
        mensagem += `> *Itens Forjados:* ${afinidade.itens_forjados}\n`;

        if (npcNome === "Vysache" && afinidade.forja_nacional_disponivel) {
            mensagem += `> *Forja Nacional:* ✅ DISPONÍVEL!\n`;
        }

        mensagem += `\n${templates.divisor()}\n`;
        mensagem += `*Comandos disponíveis:*\n`;
        mensagem += `> *!preciso de um item* - Solicitar forja\n`;
        mensagem += `> *!${npcNome.toLowerCase()} afinidade* - Ver afinidade\n`;
        mensagem += `> *!${npcNome.toLowerCase()} combinacoes* - Ver combinações\n`;

        if (npcNome === "Vysache" && afinidade.forja_nacional_disponivel) {
            mensagem += `> *!vysache forja nacional* - Forja Nacional\n`;
        }

        await MessageService.send({ message: msg, text: mensagem });
        return;
    }

    // =====================================
    // !preciso de um item - Solicitar forja
    // =====================================
    if (texto === "!preciso de um item" || texto === "!preciso de um item!") {
        // Verificar se há sessão ativa
        const sessao = await obterSessao(jogador, numero);
        if (!sessao) {
            return MessageService.send({ message: msg, text: 
                `*A oficina não possui uma encomenda ativa em seu nome.*\n\nUse *!Olá Bilac* para itens Rank E a B ou *!Olá Vysache* para itens Rank A e S.`
             });
        }

        // Atualizar etapa da sessão
        sessoesVysache[numero].etapa = "aguardando_materiais";
        await ForjaSystem.atualizarSessao(sessao.sessaoId, { etapa: "aguardando_materiais" });

        let mensagem = `*${sessao.npcNome}:* "Quais materiais você trouxe?"\n\n`;
        mensagem += `${templates.divisor()}\n`;
        mensagem += `*FICHA DE MATERIAIS*\n`;
        mensagem += `Preencha a ficha abaixo com os materiais e quantidades:\n\n`;
        mensagem += `${templates.divisor()}\n`;
        mensagem += `Material: [Nome do material]\n`;
        mensagem += `Quantidade: [Quantidade]\n\n`;
        mensagem += `Material: [Nome do material]\n`;
        mensagem += `Quantidade: [Quantidade]\n\n`;
        mensagem += `Material: [Nome do material]\n`;
        mensagem += `Quantidade: [Quantidade]\n`;
        mensagem += `${templates.divisor()}\n`;
        mensagem += `_Envie a ficha preenchida e eu analisarei as combinações possíveis._\n`;
        mensagem += `_Na confirmação, os materiais serão conferidos e consumidos diretamente do seu inventário._\n`;
        mensagem += `_Consulte *!vysache combinacoes* para ver materiais conhecidos._`;

        await MessageService.send({ message: msg, text: mensagem });
        return;
    }

    // =====================================
    // !pode sim - Confirmar forja
    // =====================================
    if (texto === "!aceitar forja vysache" || texto === "!aceitar forja bilac") {
        const sessao = await obterSessao(jogador, numero);
        const destino = texto.endsWith("vysache") ? "Vysache" : "Bilac";
        const etapaEsperada = destino === "Vysache" ? "encaminhado_vysache" : "encaminhado_bilac";
        if (!sessao || sessao.etapa !== etapaEsperada || sessao.npcNome !== destino) {
            return MessageService.send({ message: msg, text: `*${destino}:* "Não recebi nenhuma receita encaminhada em seu nome."` });
        }
        const sessaoBanco = await ForjaSystem.getSessao(jogador.id);
        const combinacao = sessaoBanco?.combinacao_resultado ? JSON.parse(sessaoBanco.combinacao_resultado) : null;
        if (!combinacao) return MessageService.send({ message: msg, text: "*A receita encaminhada não pôde ser recuperada.*" });
        const afinidade = await ForjaSystem.getAfinidade(jogador.id, destino);
        const multiplicador = destino === "Vysache" ? 1.5 : 1;
        const custo = ForjaSystem.calcularCustoFinal(Math.floor(Number(combinacao.custo || 0) * multiplicador), afinidade.afinidade);
        await ForjaSystem.atualizarSessao(sessao.sessaoId, { etapa: "aguardando_confirmacao", custo });
        sessao.etapa = "aguardando_confirmacao";
        return MessageService.send({ message: msg, text: `*${destino}:* "Aceito a encomenda. Uma obra Rank ${combinacao.rank} custará *${custo.toLocaleString("pt-BR")} Wons*. Os materiais serão conferidos novamente."\n\nSe concordar, use *!pode sim*.` });
    }

    if (texto === "!pode sim" || texto === "!pode sim!") {
        const sessao = await obterSessao(jogador, numero);
        if (!sessao || sessao.etapa !== "aguardando_confirmacao") {
            return MessageService.send({ message: msg, text: 
                `*Vysache:* "Confirmar o quê? Primeiro me traga materiais para analisar."`
             });
        }

        // Buscar sessão no banco
        const sessaoBanco = await ForjaSystem.getSessao(jogador.id);
        if (!sessaoBanco || !sessaoBanco.combinacao_resultado) {
            return MessageService.send({ message: msg, text: `*${sessao.npcNome}:* "Os dados desta forja estão incompletos. Comece novamente com *!Olá ${sessao.npcNome}*."` });
        }

        const combinacao = JSON.parse(sessaoBanco.combinacao_resultado);

        // Executar a forja
        const resultado = await ForjaSystem.executarForja(jogador.id, combinacao, jogador, sessao.npcNome);

        if (resultado.erro) {
            return MessageService.send({ message: msg, text: `*${sessao.npcNome}:* "${resultado.erro}"` });
        }

        // Encerrar sessão
        await ForjaSystem.encerrarSessao(sessaoBanco.id);
        delete sessoesVysache[numero];

        // Construir mensagem do item forjado
        const item = resultado.item;
        let mensagem = `*═══ 🔨 FORJA CONCLUÍDA! ═══*\n`;
        mensagem += `${templates.divisor()}\n\n`;
        mensagem += `*${sessao.npcNome}:* "Pronto! Aqui está o que eu forjei para você."\n\n`;
        mensagem += `${templates.divisor()}\n`;
        mensagem += `*ITEM FORJADO*\n`;
        mensagem += `> *Nome:* ${item.nome}\n`;
        mensagem += `> *Categoria:* ${item.categoria}\n`;
        mensagem += `> *Rank:* ${item.rank}\n`;
        mensagem += `> *Descrição:* ${item.descricao}\n`;
        mensagem += `${templates.divisor()}\n`;
        mensagem += `*BÔNUS:*\n`;
        if (item.bonus.forca > 0) mensagem += `> Força: +${item.bonus.forca}\n`;
        if (item.bonus.resistencia > 0) mensagem += `> Resistência: +${item.bonus.resistencia}\n`;
        if (item.bonus.velocidade > 0) mensagem += `> Velocidade: +${item.bonus.velocidade}\n`;
        if (item.bonus.sentidos > 0) mensagem += `> Sentidos: +${item.bonus.sentidos}\n`;
        if (item.bonus.inteligencia > 0) mensagem += `> Inteligência: +${item.bonus.inteligencia}\n`;
        if (item.bonus.poder_magico > 0) mensagem += `> Poder Mágico: +${item.bonus.poder_magico}\n`;
        mensagem += `${templates.divisor()}\n`;
        mensagem += `*Efeito Especial:* ${item.efeito}\n`;
        mensagem += `${templates.divisor()}\n`;
        mensagem += `> *Custo:* ${resultado.custo} Wons\n`;
        mensagem += `> *Afinidade:* ${resultado.afinidade.afinidade}% (+1%)\n`;
        mensagem += `> *Itens Forjados:* ${resultado.afinidade.itens_forjados}\n`;

        if (sessao.npcNome === "Vysache" && resultado.afinidade.atingiu_100) {
            mensagem += `\n${templates.destaque("AFINIDADE MÁXIMA ALCANÇADA!")}\n`;
            mensagem += `*Vysache:* "Você... alcançou minha confiança total. Venha, posso forjar algo de nível nacional para você. Use *!vysache forja nacional* quando estiver pronto."\n`;
        }

        mensagem += `\n${templates.divisor()}\n`;
        mensagem += `*✔ O item foi adicionado ao seu inventário!*\n`;
        mensagem += `_Use *!inventario* para ver seus itens._`;

        await MessageService.send({ message: msg, text: mensagem });
        return;
    }

    // =====================================
    // !vysache afinidade - Ver afinidade
    // =====================================
    if (["!vysache afinidade", "!visache afinidade", "!bilac afinidade"].includes(texto)) {
        const npcNome = nomeFerreiroDoTexto(texto);
        const afinidade = await ForjaSystem.getAfinidade(jogador.id, npcNome);

        let mensagem = `*═══ AFINIDADE COM ${npcNome.toUpperCase()} ═══*\n`;
        mensagem += `${templates.divisor()}\n\n`;
        mensagem += `> *Afinidade:* ${afinidade.afinidade}%\n`;
        mensagem += `> *Itens Forjados:* ${afinidade.itens_forjados}\n`;

        // Barra de progresso visual
        const barras = Math.floor(afinidade.afinidade / 5);
        const barraVazia = 20 - barras;
        mensagem += `\n[${"█".repeat(barras)}${"░".repeat(barraVazia)}] ${afinidade.afinidade}%\n`;

        mensagem += `${templates.divisor()}\n`;

        if (afinidade.afinidade < 100) {
            const restante = 100 - afinidade.afinidade;
            mensagem += `> Faltam *${restante}* forjas para atingir 100%\n`;
            mensagem += `> Cada item forjado aumenta 1% de afinidade\n`;
        } else if (npcNome === "Vysache") {
            mensagem += `> *AFINIDADE MÁXIMA!* ✅\n`;
            if (afinidade.forja_nacional_disponivel) {
                mensagem += `> *Forja Nacional DISPONÍVEL!* Use *!vysache forja nacional*\n`;
            } else {
                mensagem += `> Forja Nacional já utilizada. Continue forjando!\n`;
            }
        }

        mensagem += `${templates.divisor()}`;

        await MessageService.send({ message: msg, text: mensagem });
        return;
    }

    // =====================================
    // !vysache forja nacional - Forja Nacional
    // =====================================
    if (texto === "!vysache forja nacional" || texto === "!visache forja nacional") {
        const resultado = await ForjaSystem.executarForjaNacional(jogador.id, jogador, "Vysache");

        if (resultado.erro) {
            return MessageService.send({ message: msg, text: `*Vysache:* "${resultado.erro}"` });
        }

        const item = resultado.item;
        let mensagem = `*═══ 👑 FORJA NACIONAL! ═══*\n`;
        mensagem += `${templates.divisor()}\n\n`;
        mensagem += `*Vysache:* "Esta é minha maior obra-prima. Use-a com sabedoria."\n\n`;
        mensagem += `${templates.divisor()}\n`;
        mensagem += `*ITEM NACIONAL FORJADO*\n`;
        mensagem += `> *Nome:* ${item.nome}\n`;
        mensagem += `> *Categoria:* ${item.categoria}\n`;
        mensagem += `> *Rank:* S (Nacional)\n`;
        mensagem += `> *Descrição:* ${item.descricao}\n`;
        mensagem += `${templates.divisor()}\n`;
        mensagem += `*BÔNUS:*\n`;
        if (item.bonus.forca > 0) mensagem += `> Força: +${item.bonus.forca}\n`;
        if (item.bonus.resistencia > 0) mensagem += `> Resistência: +${item.bonus.resistencia}\n`;
        if (item.bonus.velocidade > 0) mensagem += `> Velocidade: +${item.bonus.velocidade}\n`;
        if (item.bonus.sentidos > 0) mensagem += `> Sentidos: +${item.bonus.sentidos}\n`;
        if (item.bonus.inteligencia > 0) mensagem += `> Inteligência: +${item.bonus.inteligencia}\n`;
        if (item.bonus.poder_magico > 0) mensagem += `> Poder Mágico: +${item.bonus.poder_magico}\n`;
        mensagem += `${templates.divisor()}\n`;
        mensagem += `*Efeito Especial:* ${item.efeito}\n`;
        mensagem += `${templates.divisor()}\n`;
        mensagem += `> *Custo:* ${resultado.custo} Wons\n`;
        mensagem += `\n${templates.destaque("ITEM DE NÍVEL NACIONAL CRIADO!")}\n`;
        mensagem += `*✔ O item foi adicionado ao seu inventário!*\n`;
        mensagem += `_Use *!inventario* para ver seus itens._`;

        await MessageService.send({ message: msg, text: mensagem });
        return;
    }

    // =====================================
    // !vysache combinacoes - Lista materiais conhecidos do catálogo
    // =====================================
    if (["!vysache combinacoes", "!visache combinacoes", "!bilac combinacoes"].includes(texto)) {
        const npcNome = nomeFerreiroDoTexto(texto);
        const catalogo = ForjaSystem.carregarCatalogo();

        let mensagem = `*═══ MATERIAIS CONHECIDOS POR ${npcNome.toUpperCase()} ═══*\n`;
        mensagem += `${templates.divisor()}\n`;
        mensagem += `*${npcNome}:* "Estes são os materiais que posso trabalhar. Combine 2 materiais para ver o que posso forjar."\n`;
        mensagem += npcNome === "Bilac" ? `> Especialidade: itens Rank E a B.\n\n` : `> Especialidade: itens Rank A, S e Nacional.\n\n`;

        if (catalogo && catalogo.materiais) {
            // Agrupar por rank
            const porRank = {};
            for (const mat of catalogo.materiais) {
                if (!porRank[mat.rank]) porRank[mat.rank] = [];
                porRank[mat.rank].push(mat);
            }

            const ordemRanks = npcNome === "Bilac" ? ["E", "D", "C", "B"] : ["A", "S"];

            for (const rank of ordemRanks) {
                if (!porRank[rank]) continue;
                mensagem += `${templates.secao(`RANK ${rank}`)}\n`;
                for (const mat of porRank[rank]) {
                    mensagem += `> *${mat.nome}* (${mat.tipo}) - ${mat.preco.toLocaleString()} Wons\n`;
                }
                mensagem += `\n`;
            }

            mensagem += `${templates.divisor()}\n`;
            mensagem += `*NÚCLEOS DE MONSTROS:*\n`;
            if (catalogo.nucleos) {
                for (const nuc of catalogo.nucleos) {
                    mensagem += `> *Núcleo ${nuc.cor}* (Rank ${nuc.rank}) - ${nuc.preco.toLocaleString()} Wons\n`;
                }
            }
        } else {
            mensagem += `> Não foi possível carregar o catálogo.\n`;
        }

        mensagem += `${templates.divisor()}\n`;
        mensagem += `_Envie os materiais na ficha para ${npcNome} analisar a combinação._\n`;
        mensagem += `_Converse com ${npcNome} e use !preciso de um item para iniciar uma forja._\n`;
        mensagem += `_Cada item forjado aumenta 1% de afinidade._\n`;
        if (npcNome === "Vysache") mensagem += `_Atingindo 100%, a Forja Nacional é liberada._`;

        await MessageService.send({ message: msg, text: mensagem });
        return;
    }

    // =====================================
    // !vysache ficha - Exibe ficha do NPC
    // =====================================
    if (["!vysache ficha", "!visache ficha", "!bilac ficha"].includes(texto)) {
        const npcNome = nomeFerreiroDoTexto(texto);
        const npc = require(`../npc/data/${npcNome.toLowerCase()}.json`);

        let mensagem = `*═══ FICHA DE VYSACHE ═══*\n`;
        mensagem += `${templates.linha()}\n\n`;
        mensagem += `${templates.secao("IDENTIDADE")}\n`;
        mensagem += `> *Nome:* ${npc.nome}\n`;
        mensagem += `> *Raça:* ${npc.raca}\n`;
        mensagem += `> *Nível:* ${npc.nivel}\n`;
        mensagem += `> *Rank:* ${npc.rank}\n`;
        mensagem += `> *Nacionalidade:* ${npc.nacionalidade}\n`;
        mensagem += `> *Localização:* ${npc.localizacao}\n\n`;
        mensagem += `${templates.secao("APARÊNCIA")}\n`;
        mensagem += `> *Aparência:* ${npc.aparencia}\n`;
        mensagem += `> *Altura:* ${npc.altura}\n`;
        mensagem += `> *Peso:* ${npc.peso}\n\n`;
        mensagem += `${templates.secao("PERSONALIDADE")}\n`;
        mensagem += `> *Personalidade:* ${npc.personalidade}\n\n`;
        mensagem += `${templates.secao("HISTÓRIA")}\n`;
        mensagem += `> *História:* ${npc.historia}\n\n`;
        mensagem += `${templates.secao("CLASSE")}\n`;
        mensagem += `> *Classe:* ${npc.classe}\n`;
        mensagem += `> *Classe Avançada:* ${npc.classe_avancada}\n\n`;
        mensagem += `${templates.secao("ATRIBUTOS")}\n`;
        mensagem += `> *Força:* ${npc.atributos.forca}\n`;
        mensagem += `> *Resistência:* ${npc.atributos.resistencia}\n`;
        mensagem += `> *Velocidade:* ${npc.atributos.velocidade}\n`;
        mensagem += `> *Sentidos:* ${npc.atributos.sentidos}\n`;
        mensagem += `> *Inteligência:* ${npc.atributos.inteligencia}\n`;
        mensagem += `> *Poder Mágico:* ${npc.atributos.poder_magico}\n\n`;
        mensagem += `${templates.secao("ESPECIALIDADE")}\n`;
        mensagem += `> *Especialidade:* ${npc.especialidade}\n`;
        mensagem += `> *Habilidade Especial:* ${npc.habilidade_especial}\n`;
        mensagem += `${templates.divisor()}\n`;
        mensagem += `> *Descrição:* ${npc.descricao}`;

        await MessageService.send({ message: msg, text: mensagem });
        return;
    }

    // =====================================
    // !vysache historico - Histórico de forjas
    // =====================================
    if (["!vysache historico", "!visache historico", "!bilac historico"].includes(texto)) {
        const npcNome = nomeFerreiroDoTexto(texto);
        const historico = await ForjaSystem.getHistorico(jogador.id, 10, npcNome);

        if (historico.length === 0) {
            return MessageService.send({ message: msg, text: 
                `*═══ HISTÓRICO DE FORJA ═══*\n${templates.divisor()}\n\n` +
                `*${npcNome}:* "Você ainda não encomendou nenhuma forja. Que tal começarmos?"\n\n` +
                `> Use *!Olá ${npcNome}* para iniciar.`
             });
        }

        let mensagem = `*═══ HISTÓRICO DE FORJA ═══*\n`;
        mensagem += `${templates.divisor()}\n\n`;

        historico.forEach((h, i) => {
            const tipo = h.tipo_forja === "nacional" ? " 👑" : "";
            mensagem += `*${i + 1}. ${h.item_nome}*${tipo}\n`;
            mensagem += `> Rank: ${h.item_rank} | Categoria: ${h.item_categoria}\n`;
            mensagem += `> Custo: ${h.custo} Wons | Data: ${h.data}\n\n`;
        });

        mensagem += `${templates.divisor()}`;

        await MessageService.send({ message: msg, text: mensagem });
        return;
    }
};

// Exportar sessões para uso no reconhecedor de ficha de materiais
module.exports.sessoesVysache = sessoesVysache;
