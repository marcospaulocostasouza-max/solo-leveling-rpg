const MessageService = require("./messageService");

/**
 * ROTEADOR PRINCIPAL DE COMANDOS
 * 
 * Processa todas as mensagens recebidas e direciona para o comando correto.
 * Tambem reconhece fichas enviadas sem comando.
 */

const fs = require("fs");
const path = require("path");

function normalizarComando(valor) {
    let texto = String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const cardinal = texto.match(/^\s*\.\s*#\s*cardinal\b\s*/i);
    const comandoNormal = texto.match(/^\s*!+\s*/);
    const prefixo = cardinal ? ".#cardinal" : comandoNormal ? "!" : "";
    if (cardinal) texto = texto.slice(cardinal[0].length);
    else if (comandoNormal) texto = texto.slice(comandoNormal[0].length);

    texto = texto
        .replace(/[“”"'`´]/g, " ")
        .replace(/[.,:;!?()[\]{}*_~|]+/g, " ")
        .replace(/[—–]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (prefixo === ".#cardinal") return texto ? `${prefixo} ${texto}` : prefixo;
    return `${prefixo}${texto}`;
}

function aliasesDePlural(chave) {
    const palavras = String(chave || "").split(" ");
    return palavras.flatMap((palavra, indice) => {
        if (palavra.length < 4 || !palavra.endsWith("s")) return [];
        const radical = palavra.endsWith("oes") ? `${palavra.slice(0, -3)}ao`
            : palavra.endsWith("aes") ? `${palavra.slice(0, -3)}ao`
                : palavra.endsWith("is") ? `${palavra.slice(0, -2)}l`
                    : palavra.slice(0, -1);
        const copia = [...palavras];
        copia[indice] = radical;
        return [copia.join(" ")];
    });
}

function criarIndiceDeComandos(mapa) {
    const indice = new Map();
    for (const [nome, arquivo] of Object.entries(mapa)) {
        const chave = normalizarComando(nome);
        if (!indice.has(chave)) indice.set(chave, { arquivo, nome });
        for (const alias of aliasesDePlural(chave)) {
            if (!indice.has(alias)) indice.set(alias, { arquivo, nome });
        }
    }
    return indice;
}

function normalizarMensagemParaHandler(msg, quantidadePalavras, prefixoCanonico) {
    const corpoOriginal = String(msg.body || "");
    if (prefixoCanonico === ".#cardinal") {
        msg.body = corpoOriginal.replace(/^\s*\.\s*#\s*cardinal\b/i, prefixoCanonico);
        return corpoOriginal;
    }
    // !+xp e !-xp usam o sinal e o recurso no mesmo token. O tratamento
    // genérico por palavras removia esse token inteiro e entregava só !+ ou
    // !- ao módulo administrativo.
    if (prefixoCanonico === "!+" || prefixoCanonico === "!-") {
        const sinal = prefixoCanonico.slice(1).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        msg.body = corpoOriginal.replace(new RegExp(`^\\s*!${sinal}`, "i"), prefixoCanonico);
        return corpoOriginal;
    }
    const [primeiraLinha, ...restante] = corpoOriginal.split(/\r?\n/);
    const palavras = primeiraLinha.trim().split(/\s+/);
    if (!palavras.length || !palavras[0]) return corpoOriginal;
    const restoDaLinha = palavras.slice(quantidadePalavras).join(" ");
    const corpoNormalizado = `${prefixoCanonico}${restoDaLinha ? ` ${restoDaLinha}` : ""}`;
    msg.body = [corpoNormalizado, ...restante].join("\n");
    return corpoOriginal;
}

// Cache de comandos carregados
const cacheComandos = {};

function carregarComando(arquivo) {
    try {
        if (cacheComandos[arquivo]) {
            return cacheComandos[arquivo];
        }
        
        // Caminho correto para src/commands/
        let caminhoComando = path.join(__dirname, "..", "commands", arquivo);
        
        // Se nao existir em commands, tentar em utils
        if (!fs.existsSync(caminhoComando)) {
            // Verificar se o arquivo tem subcaminho (ex: utils/reconhecerFicha.js)
            if (arquivo.includes("/")) {
                caminhoComando = path.join(__dirname, "..", arquivo);
            } else {
                caminhoComando = path.join(__dirname, "..", "utils", arquivo);
            }
        }
        
        if (fs.existsSync(caminhoComando)) {
            const modulo = require(caminhoComando);
            cacheComandos[arquivo] = modulo;
            return modulo;
        }
        
        console.log("Comando nao encontrado:", arquivo);
        return null;
    } catch (erro) {
        console.log("Erro ao carregar comando " + arquivo + ":", erro.message);
        return null;
    }
}

// Lista de comandos de classes que consultam o banco de dados
const comandosClasses = [
    // Classes Iniciais
    "!lutador", "!assassino", "!tanker", "!ranger fisico", "!ranger magico", "!ranger", "!curador",
    "!mago", "!mago elemental", "!mago elementar", "!mago do elemento",
    "!mago de agua", "!mago de fogo", "!mago de gelo", "!mago de terra", "!mago de vento", "!mago de raio",
    "!mago invocador", "!mago de barreira", "!mago de maldicao",
    // Classes Avancadas
    "!hrymir", "!freyr", "!berserk", "!heroi do escudo", "!construtor",
    "!paladino", "!escudeiro", "!uthabiti", "!morax", "!viking",
    "!lamina sombria", "!sword dancer", "!corsario", "!shinobi", "!thanakir",
    "!pneuma-ousia", "!pneuma ousia", "!rastreador", "!andarilho", "!heroi do arco",
    "!palhaco", "!ardito", "!raijin", "!harmonic", "!chefe",
    "!apotecario", "!musico", "!oraculo", "!estigmas", "!nazhir",
    "!calamitas", "!mago de luz", "!samurai", "!heroi da espada", "!monge",
    "!inquisitor", "!esgrimista", "!heroi da lanca", "!alquimista", "!grande mago",
    "!feiticeiros", "!feiticeiro", "!druida", "!catalys", "!archon",
    "!warden", "!arcanista", "!taoista", "!sabio", "!mago runico",
    "!domador", "!onmyouji", "!bruxo", "!mago de ignicao", "!necromante",
    "!taumaturgo", "!bokor", "!mago de escuridao", "!nidhogg",
    // Classes Iniciais (alias)
    "!mago elemental agua", "!mago elemental fogo", "!mago elemental terra",
    "!mago elemental vento", "!mago elemental gelo", "!mago elemental raio"
    , "!adaga", "!adagas", "!foice", "!foices", "!katana", "!katanas", "!kusarigama", "!pistola", "!pistolas", "!escopeta", "!escopetas", "!espingarda", "!fuzil", "!fuzis",
    "!arco", "!arcos", "!faca", "!facas", "!sniper", "!espadao", "!espadão", "!espadoes", "!espadões", "!espadas pesadas", "!espadas pesadas duplas", "!espadoes duplos", "!espadões duplos", "!espada", "!espadas", "!manopla", "!manoplas", "!punhos", "!punho", "!kanabo",
    "!lanca", "!lança", "!lanças", "!lancas", "!cajado", "!cajados", "!cajados e orbes", "!cajado e orbe", "!orbe", "!orbes", "!grimorio", "!grimório",
    "!revolver", "!rifle", "!rifles", "!rifle de precisao", "!rifles de precisao", "!rifle de precisão", "!rifles de precisão", "!combate desarmado", "!artes marciais",
    "!escudo", "!escudos", "!corrente", "!correntes", "!machado", "!machados", "!martelo", "!martelos",
    "!chicote", "!chicotes", "!besta", "!bestas", "!bumerangue", "!bumerangues", "!arremesso",
    "!garra", "!garras", "!sabre", "!sabres", "!foices duplas", "!foices dupla", "!tridente", "!tridentes",
    "!clava", "!clavas", "!florete", "!floretes", "!chakram", "!chakrams", "!luvas", "!luvas de combate",
    "!mangual", "!manguais", "!alabarda", "!alabardas", "!nunchaku", "!nunchakus", "!tonfa", "!tonfas",
    "!kama", "!kamas", "!rapieira", "!rapieiras", "!baculo", "!báculo", "!báculos", "!baculos",
    "!cimitarra", "!cimitarras", "!picareta", "!picaretas", "!picaretas de guerra", "!bastao", "!bastão", "!bastões", "!bastoes",
    "!funda", "!fundas", "!laminas duplas", "!lâminas duplas", "!lamina dupla", "!lâmina dupla",
    "!correntes com foice", "!leques", "!leques de guerra", "!leque", "!instrumentos", "!instrumentos musicais", "!instrumento"
];

async function executarComando(msg, comando, comandosRegistrados) {
    try { await require("../systems/recoverySystem").verificar48h(msg.author || msg.from); }
    catch (erro) { console.error("[RECOVERY]", erro.message); }
    const msgBody = msg.body;
    // Normaliza acentos para que aliases com ou sem acento tenham o mesmo
    // roteamento, inclusive em arquivos legados com codificação antiga.
    const comandoLower = normalizarComando(comando);
    const grupoId = msg.from || msg.author;
    
    console.log(`[EXEC] ===== NOVA MENSAGEM RECEBIDA =====`);
    console.log(`[EXEC] Conteúdo: "${msgBody}"`);
    console.log(`[EXEC] Comando processado: "${comandoLower}"`);

    // Sessões guiadas de criação aceitam a próxima resposta em texto comum.
    try { if (await require('../systems/contentCreationWizard').consumeMessage(msg)) return; }
    catch (erro) { console.error('[CONTENT_WIZARD]',erro.message); }
    // Elas são verificadas antes do roteamento para que a resposta não seja
    // confundida com uma ficha ou conversa de NPC.
    try { if (await require("../systems/creationWizardService").consumeMessage(msg)) return; }
    catch (erro) { console.error("[WIZARD]", erro.message); }
    try { if (await require('../systems/redeemWizardService').consumeMessage(msg)) return; }
    catch (erro) { console.error('[REDEEM_WIZARD]',erro.message); }
    
    // =====================================
    // MAPEAMENTO DE COMANDOS
    // =====================================
    const mapaComandos = {
        "!criar codigo": "redeemAdm.js",
        "!criar item": "criarConteudoGuiado.js",
        "!criar item unico": "criarConteudoGuiado.js",
        "!criar passiva": "criarConteudoGuiado.js",
        "!criar titulo": "criarConteudoGuiado.js",
        "!criar tecnica": "criarConteudoGuiado.js",
        "!criar tecnica unica": "criarConteudoGuiado.js",
        "!criar habilidade unica": "criarConteudoGuiado.js",
        "!criar hab unica": "criarConteudoGuiado.js",
        "!trocar dungeon": "confirmarTrocaDungeon.js",
        "!manter dungeon": "confirmarTrocaDungeon.js",
        "!premios dungeon": "consultarPremiosDungeon.js",
        "!banners": "gacha.js",
        "!banner": "gacha.js",
        "!convergir": "gacha.js",
        "!conjuntos": "conjunto.js",
        "!conjunto": "conjunto.js",
        "!ftitulo": "criarTituloPassiva.js",
        "!ftítulo": "criarTituloPassiva.js",
        "!fpassiva": "criarTituloPassiva.js",
        "!gacha": "gacha.js",
        "!gachaadm": "gachaAdm.js",
        "!iniciar": "iniciar.js",
        "!maestria": "treinar.js",
        "!qi": "treinar.js",
        "!ler historia": "lerHistoria.js",
        "!fquest": "fQuest.js",
        "!fdungeon": "fDungeonSemanal.js",
        "!dungeon semanal": "consultarDungeonSemanal.js",
        "!consultar dungeon semanal": "consultarDungeonSemanal.js",
        "!arquiteto": "arquiteto.js",
        "!caçador": "cacador.js",
        "!cacador": "cacador.js",
        "!ficha": "ficha.js",
        "!sortear afinidade": "sortearAfinidade.js",
        "!confirmar ficha": "confirmarFicha.js",
        "!jogador": "jogador.js",
        "!aparencias": "aparencias.js",
        "!aparências": "aparencias.js",
        "!status": "jogador.js",
        "!regras": "regras.js",
        "!classes": "classes.js",
        "!iniciar quest classe avançada": "classeAvancada.js",
        "!iniciar quest classe avancada": "classeAvancada.js",
        "!escolher classe avançada": "classeAvancada.js",
        "!escolher classe avancada": "classeAvancada.js",
        "!classe avancada": "classeAvancada.js",
        "!classe avançada": "classeAvancada.js",
        "!tecnicas": "tecnicas.js",
        "!técnicas": "tecnicas.js",
        "!tecnica": "tecnica.js",
        "!técnica": "tecnica.js",
        "!avaliar ficha": "avaliarFicha.js",
        "!avaliar ia": "avaliarIA.js",
        "!aprovar ficha": "aprovarFicha.js",
        "!recusar ficha": "recusarFicha.js",
        "!estilos de luta": "estilosLuta.js",
        "!armasiniciais": "armasiniciais.js",
        "!armas iniciais": "armasiniciais.js",
        "!itens": "itens.js",
        "!idgrupo": "idGrupo.js",
        "!id grupo": "idGrupo.js",
        "!testegrupo": "testeGrupo.js",
        "!teste grupo": "testeGrupo.js",
        "!listar grupos": "listarGrupos.js",
        "!vercomandos": "verComandos.js",
        "!ver comandos": "verComandos.js",
        "!passivas": "passivas.js",
        "!minhas passivas": "passivas.js",
        "!minhas tecnicas": "minhasTecnicas.js",
        "!minhas técnicas": "minhasTecnicas.js",
        "!titulos": "titulos.js",
        "!meus titulos": "meusTitulos.js",
        "!meus títulos": "meusTitulos.js",
        "!arquitetura": "arquitetura.js",
        "!ver fila": "verFila.js",
        "!ver lista": "verFila.js",
        "!ftécnica": "criarHabUnica.js",
        "!ftecnica": "criarHabUnica.js",
        "!fitem": "criarItemUnico.js",
        "!add técnica": "confirmarHabUnica.js",
        "!add tecnica": "confirmarHabUnica.js",
        "!add item": "confirmarItemUnico.js",
        "!comandos grupo": "gruposComandos.js",
        "!consultar afinidade": "consultarAfinidade.js",
        "!consultar elemento": "consultarAfinidade.js",
        "!afinidades": "afinidades.js",
        "!todas afinidades": "afinidades.js",
        "!todas as afinidades": "afinidades.js",
        "!atividades": "atividades.js",
        "!historico": "atividades.js",
        "!avanco": "avanco.js",
        "!faixa de atributos": "faixaAtributos.js",
        "!fcombate": "fcombate.js",
        "!fight": "fcombate.js",
        "!resumo": "resumo.js",
        "!distribuir": "distribuir.js",
        "!desejar": "desejar.js",
        "!ficha de dungeon": "fichaDungeon.js",
        "!ficha de Dungeon": "fichaDungeon.js",
        "!concluir dungeon": "concluirDungeon.js",
        "!concluir Dungeon": "concluirDungeon.js",
        "!abrir dungeon": "abrirDungeon.js",
        "!abrir Dungeon": "abrirDungeon.js",
        "!abrir chave": "abrirDungeon.js",
        "!minha dungeon": "minhaDungeon.js",
        "!minha Dungeon": "minhaDungeon.js",
        "!olá vysache": "vysache.js",
        "!ola vysache": "vysache.js",
        "!olá visache": "vysache.js",
        "!ola visache": "vysache.js",
        "!olá bilac": "vysache.js",
        "!ola bilac": "vysache.js",
        "!preciso de um item": "vysache.js",
        "!pode sim": "vysache.js",
        "!aceitar forja vysache": "vysache.js",
        "!aceitar forja bilac": "vysache.js",
        "!loja materiais": "lojaMateriais.js",
        "!loja armas simples": "lojaArmasSimples.js",
        "!armas simples": "lojaArmasSimples.js",
        "!loja nucleos": "lojaNucleos.js",
        "!loja núcleos": "lojaNucleos.js",
        // =====================================
        // COMANDOS DE NPCs
        // =====================================
        "!ophilia_clement": "npc_ophilia_clement.js",
        "!cyrus_albright": "npc_cyrus_albright.js",
        "!tressa_colzione": "npc_tressa_colzione.js",
        "!olberic_eisenberg": "npc_olberic_eisenberg.js",
        "!primrose_azelhart": "npc_primrose_azelhart.js",
        "!alfyn_greengrass": "npc_alfyn_greengrass.js",
        "!therion": "npc_therion.js",
        "!haanit": "npc_haanit.js",
        "!hikari_ku": "npc_hikari_ku.js",
        "!agnea_bristarni": "npc_agnea_bristarni.js",
        "!castti_florenz": "npc_castti_florenz.js",
        "!osvald_v_vanstein": "npc_osvald_v_vanstein.js",
        "!partitio_yellowil": "npc_partitio_yellowil.js",
        "!ochette": "npc_ochette.js",
        "!temenos_mistral": "npc_temenos_mistral.js",
        "!throne_anguis": "npc_throne_anguis.js",
        "!lyblac": "npc_lyblac.js",
        "!galdera": "npc_galdera.js",
        "!vide_o_corruptor": "npc_vide_o_corruptor.js",
        "!trousseau": "npc_trousseau.js",
        // ===== OT0 =====
        "!stia_han": "npc_stia_han.js",
        "!phenn_doyoung": "npc_phenn_doyoung.js",
        "!laurana_bae": "npc_laurana_bae.js",
        "!celsus_park": "npc_celsus_park.js",
        "!macy_eun": "npc_macy_eun.js",
        "!alexia_song": "npc_alexia_song.js",
        "!viator_yoon": "npc_viator_yoon.js",
        "!ludo_wei": "npc_ludo_wei.js",
        "!carinda_moon": "npc_carinda_moon.js",
        "!pius_kang": "npc_pius_kang.js",
        "!saoirse_ryu": "npc_saoirse_ryu.js",
        "!xerc_baek": "npc_xerc_baek.js",
        "!delitia_song": "npc_delitia_song.js",
        "!esperre_jin": "npc_esperre_jin.js",
        "!goodwin_cha": "npc_goodwin_cha.js",
        "!reime_oh": "npc_reime_oh.js",
        "!heidne_ahn": "npc_heidne_ahn.js",
        // ===== CotC =====
        "!bargello_yeon": "npc_bargello_yeon.js",
        "!alaune_yeong": "npc_alaune_yeong.js",
        "!richard_han": "npc_richard_han.js",
        "!solon_wi": "npc_solon_wi.js",
        "!eltrix_noh": "npc_eltrix_noh.js",
        "!rondo_baek": "npc_rondo_baek.js",
        "!isla_gwon": "npc_isla_gwon.js",
        "!sazantos_do": "npc_sazantos_do.js",
        "!elrica_edoras": "npc_elrica_edoras.js",
        "!tatloch": "npc_tatloch.js",
        // ===== Bosses OT1 =====
        "!mattias_cardoso": "npc_mattias_cardoso.js",
        "!werner_choi": "npc_werner_choi.js",
        "!simeon_ha": "npc_simeon_ha.js",
        "!darius_kwon": "npc_darius_kwon.js",
        "!redeye": "npc_redeye.js",
        "!miguel_bang": "npc_miguel_bang.js",
        // ===== Vilões Complemento =====
        "!gaston_rho": "npc_gaston_rho.js",
        "!yvon_baik": "npc_yvon_baik.js",
        "!lucia_yeom": "npc_lucia_yeom.js",
        "!vanessa_hysel": "npc_vanessa_hysel.js",
        "!gideon_ma": "npc_gideon_ma.js",
        "!rufus_deng": "npc_rufus_deng.js",
        "!trish_yamaguchi": "npc_trish_yamaguchi.js",
        "!warden_davids": "npc_warden_davids.js",
        "!helgenish": "npc_helgenish.js",
        "!entidade_mae": "npc_entidade_mae.js",
        // ===== Ordem da Meia-Noite =====
        "!mugen_ku": "npc_mugen_ku.js",
        "!kazan": "npc_kazan.js",
        "!tanzy_woo": "npc_tanzy_woo.js",
        "!ori_choi": "npc_ori_choi.js",
        "!harvey_jeong": "npc_harvey_jeong.js",
        "!arcanette": "npc_arcanette.js",
        "!kaldena_ryu": "npc_kaldena_ryu.js",
        "!claude": "npc_claude.js",
        "!petrichor": "npc_petrichor.js",
        "!missoes npc": "npcMissoes.js",
        "!npc": "npc.js",
        "!peatz": "peatz.js",
        "!ascensão": "ascensao.js",
        "!ascensao": "ascensao.js",
        "!ascenção": "ascensao.js",
        "!ascencao": "ascensao.js",
        "!associações": "associacoes.js",
        "!associacoes": "associacoes.js",
        "!biblioteca": "biblioteca.js",
        "!história": "historia.js",
        "!historia": "historia.js",
        "!acervo": "acervo.js",
        "!skills": "skills.js",
        "!loja virtual": "lojaVirtual.js",
        "!drops": "drops.js",
        "!listar npcs": "listarNpcs.js",
        "!admin encerrar cenas npc": "encerrarCenasNpc.js",
        "!admin encerrar interacoes npc": "encerrarCenasNpc.js",
        "!site": "site.js"
    };

    // Comandos com prefixo (startsWith)
    const comandosPrefixo = [
        { prefixo: ".#cardinal", arquivo: "cardinalAdmin.js" },
        { prefixo: "!anexar imagem dungeon semanal", arquivo: "criarDungeonSemanalGuiada.js" },
        { prefixo: "!criar dungeon semanal", arquivo: "criarDungeonSemanalGuiada.js" },
        { prefixo: "!criar dungeon instanciada", arquivo: "criarAdministrativoGuiado.js" },
        { prefixo: "!criar guilda", arquivo: "criarAdministrativoGuiado.js" },
        { prefixo: "!criar missao", arquivo: "criarAdministrativoGuiado.js" },
        { prefixo: "!criar missão", arquivo: "criarAdministrativoGuiado.js" },
        { prefixo: "!título criar", arquivo: "criarTituloPassiva.js" },
        { prefixo: "!titulo criar", arquivo: "criarTituloPassiva.js" },
        { prefixo: "!passiva criar", arquivo: "criarTituloPassiva.js" },
        { prefixo: "!ftítulo", arquivo: "criarTituloPassiva.js" },
        { prefixo: "!ftitulo", arquivo: "criarTituloPassiva.js" },
        { prefixo: "!fpassiva", arquivo: "criarTituloPassiva.js" },
        { prefixo: "!conjuntos", arquivo: "conjunto.js" },
        { prefixo: "!conjunto", arquivo: "conjunto.js" },
        { prefixo: "!anexar imagem banner", arquivo: "gachaAdm.js" },
        { prefixo: "!criar codigo", arquivo: "redeemAdm.js" },
        { prefixo: "!codigo", arquivo: "redeemAdm.js" },
        { prefixo: "!resgatar codigo", arquivo: "resgatarCodigo.js" },
        { prefixo: "!criar banner", arquivo: "gachaAdm.js" },
        { prefixo: "!excluir banner", arquivo: "gachaAdm.js" },
        { prefixo: "!desativar banner", arquivo: "gachaAdm.js" },
        { prefixo: "!desativarbanner", arquivo: "gachaAdm.js" },
        { prefixo: "!convergir", arquivo: "gacha.js" },
        { prefixo: "!banners", arquivo: "gacha.js" },
        { prefixo: "!banner", arquivo: "gacha.js" },
        { prefixo: "!gachaadm", arquivo: "gachaAdm.js" },
        { prefixo: "!gacha", arquivo: "gacha.js" },
        { prefixo: "!atributos", arquivo: "atributos.js" },
        { prefixo: "!avaliar ficha", arquivo: "avaliarFicha.js" },
        { prefixo: "!avaliar ia", arquivo: "avaliarIA.js" },
        { prefixo: "!aprovar ficha", arquivo: "aprovarFicha.js" },
        { prefixo: "!recusar", arquivo: "recusarFicha.js" },
        { prefixo: "!batalha", arquivo: "batalha.js" },
        { prefixo: "!investimento", arquivo: "investimentos.js" },
        { prefixo: "!inventario", arquivo: "inventario.js" },
        { prefixo: "!inv", arquivo: "inventario.js" },
        { prefixo: "!equipar titulo", arquivo: "equiparTitulo.js" },
        { prefixo: "!equipar título", arquivo: "equiparTitulo.js" },
        { prefixo: "!desequipar", arquivo: "desequipar.js" },
        { prefixo: "!equipar", arquivo: "equipar.js" },
        { prefixo: "!usar ticket", arquivo: "usarTicket.js" },
        { prefixo: "!trocar aparencia", arquivo: "trocarAparencia.js" },
        { prefixo: "!trocar aparência", arquivo: "trocarAparencia.js" },
        { prefixo: "!usar", arquivo: "usarItem.js" },
        { prefixo: "!comprar tecnica", arquivo: "comprarTecnica.js" },
        { prefixo: "!comprar técnica", arquivo: "comprarTecnica.js" },
        { prefixo: "!confirmar compra", arquivo: "comprar.js" },
        { prefixo: "!comprar", arquivo: "comprar.js" },
        // Consultas específicas devem vir antes do prefixo genérico !tecnicas.
        { prefixo: "!tecnicas proficiencia", arquivo: "tecnicasEstiloLuta.js" },
        { prefixo: "!técnicas proficiência", arquivo: "tecnicasEstiloLuta.js" },
        { prefixo: "!tecnicas estilo de luta", arquivo: "tecnicasEstiloLuta.js" },
        { prefixo: "!técnicas estilo de luta", arquivo: "tecnicasEstiloLuta.js" },
        { prefixo: "!tecnica proficiencia", arquivo: "tecnicasEstiloLuta.js" },
        { prefixo: "!técnica proficiência", arquivo: "tecnicasEstiloLuta.js" },
        { prefixo: "!tecnica estilo de luta", arquivo: "tecnicasEstiloLuta.js" },
        { prefixo: "!técnica estilo de luta", arquivo: "tecnicasEstiloLuta.js" },
        { prefixo: "!tÃ©cnicas estilo de luta", arquivo: "tecnicasEstiloLuta.js" },
        { prefixo: "!minhas tecnicas", arquivo: "minhasTecnicas.js" },
        { prefixo: "!minhas técnicas", arquivo: "minhasTecnicas.js" },
        { prefixo: "!tecnicas", arquivo: "tecnicas.js" },
        { prefixo: "!técnicas", arquivo: "tecnicas.js" },
        { prefixo: "!tecnica ", arquivo: "tecnica.js" },
        { prefixo: "!técnica ", arquivo: "tecnica.js" },
        { prefixo: "!dungeon", arquivo: "dungeon.js" },
        { prefixo: "!amizade", arquivo: "amizade.js" },
        { prefixo: "!presentear", arquivo: "presentear.js" },
        { prefixo: "!consultar missoes", arquivo: "missoes.js" },
        { prefixo: "!consultar missao", arquivo: "missoes.js" },
        { prefixo: "!aceitar missao", arquivo: "missoes.js" },
        { prefixo: "!aceitar", arquivo: "missoes.js" },
        { prefixo: "!iniciar missao", arquivo: "missoes.js" },
        { prefixo: "!confirmar missao", arquivo: "missoes.js" },
        { prefixo: "!confirmar", arquivo: "missoes.js" },
        { prefixo: "!entregar missao", arquivo: "missaoEntrega.js" },
        { prefixo: "!concluir missao", arquivo: "missaoEntrega.js" },
        { prefixo: "!aprovar missao", arquivo: "missaoEntrega.js" },
        { prefixo: "!missoes npc", arquivo: "npcMissoes.js" },
        { prefixo: "!missao", arquivo: "missoes.js" },
        { prefixo: "!guilda", arquivo: "guilda.js" },
        { prefixo: "!rank requisitos", arquivo: "avaliarRank.js" },
        { prefixo: "!rank info", arquivo: "avaliarRank.js" },
        { prefixo: "!ranking", arquivo: "ranking.js" },
        { prefixo: "!rank", arquivo: "ranking.js" },
        { prefixo: "!nivel", arquivo: "nivel.js" },
        { prefixo: "!level", arquivo: "nivel.js" },
        { prefixo: "!mvp", arquivo: "mvp.js" },
        { prefixo: "!aprovada para classe avancada", arquivo: "aprovadaClasseAvancada.js" },
        { prefixo: "!aprovada para classe avançada", arquivo: "aprovadaClasseAvancada.js" },
        { prefixo: "!admin afinidade", arquivo: "adminAfinidade.js" },
        { prefixo: "!premiar todos", arquivo: "premiarTodos.js" },
        { prefixo: "!atualizar", arquivo: "atualizarJogador.js" },
        { prefixo: "!admin", arquivo: "admin.js" },
        { prefixo: "!adm", arquivo: "admin.js" },
        { prefixo: "!+", arquivo: "admin.js" },
        { prefixo: "!-", arquivo: "admin.js" },
        { prefixo: "!add", arquivo: "admin.js" },
        { prefixo: "!rem", arquivo: "admin.js" },
        { prefixo: "!quero ", arquivo: "classeAvancada.js" },
        { prefixo: "!classe especial", arquivo: "classeEspecial.js" },
        { prefixo: "!classe ", arquivo: "admin.js" },
        { prefixo: "!remclasse ", arquivo: "admin.js" },
        { prefixo: "!logs", arquivo: "admin.js" },
        { prefixo: "!ver comandos", arquivo: "verComandos.js" },
        { prefixo: "!vercomandos", arquivo: "verComandos.js" },
        { prefixo: "!ver ", arquivo: "admin.js" },
        { prefixo: "!souadm", arquivo: "admin.js" },
        { prefixo: "!registrar adm", arquivo: "admin.js" },
        { prefixo: "!registrar admin", arquivo: "admin.js" },
        { prefixo: "!treino aprovado", arquivo: "aprovarAtividade.js" },
        { prefixo: "!equipar titulo", arquivo: "equiparTitulo.js" },
        { prefixo: "!equipar título", arquivo: "equiparTitulo.js" },
        { prefixo: "!territorio", arquivo: "territorios.js" },
        { prefixo: "!local", arquivo: "locais.js" },
        { prefixo: "!mineracao", arquivo: "mineracao.js" },
        { prefixo: "!arena", arquivo: "arena.js" },
        { prefixo: "!fragmento", arquivo: "fragmentos.js" },
        { prefixo: "!governante", arquivo: "governantes.js" },
        { prefixo: "!submundo", arquivo: "submundo.js" },
        { prefixo: "!sub ", arquivo: "submundo.js" },
        { prefixo: "!sub", arquivo: "submundo.js" },
        { prefixo: "!nucleo", arquivo: "nucleos.js" },
        { prefixo: "!sucessor", arquivo: "sucessores.js" },
        { prefixo: "!monarca", arquivo: "monarcas.js" },
        { prefixo: "!calcularbuff", arquivo: "calcularbuff.js" },
        { prefixo: "!portais", arquivo: "portais.js" },
        { prefixo: "!bigorna", arquivo: "bigorna.js" },
        { prefixo: "!fermentacao", arquivo: "fermentacao.js" },
        { prefixo: "!encantamento", arquivo: "encantamento.js" },
        { prefixo: "!dlc", arquivo: "dlc.js" },
        { prefixo: "!token", arquivo: "token.js" },
        { prefixo: "!criar hab única", arquivo: "criarHabUnica.js" },
        { prefixo: "!criar hab unica", arquivo: "criarHabUnica.js" },
        { prefixo: "!criar habilidade única", arquivo: "criarHabUnica.js" },
        { prefixo: "!criar habilidade unica", arquivo: "criarHabUnica.js" },
        { prefixo: "!confirmar hab única", arquivo: "confirmarHabUnica.js" },
        { prefixo: "!confirmar hab unica", arquivo: "confirmarHabUnica.js" },
        { prefixo: "!confirmar habilidade única", arquivo: "confirmarHabUnica.js" },
        { prefixo: "!confirmar habilidade unica", arquivo: "confirmarHabUnica.js" },
        { prefixo: "!criar item único", arquivo: "criarItemUnico.js" },
        { prefixo: "!criar item unico", arquivo: "criarItemUnico.js" },
        { prefixo: "!criar item", arquivo: "criarItemUnico.js" },
        { prefixo: "!confirmar item único", arquivo: "confirmarItemUnico.js" },
        { prefixo: "!confirmar item unico", arquivo: "confirmarItemUnico.js" },
        { prefixo: "!materiais", arquivo: "materiais.js" },
        { prefixo: "!penalidade", arquivo: "penalidade.js" },
        { prefixo: "!aprovado associacao", arquivo: "associacao.js" },
        { prefixo: "!aprovado associação", arquivo: "associacao.js" },
        { prefixo: "!sair associacao", arquivo: "associacao.js" },
        { prefixo: "!sair associação", arquivo: "associacao.js" },
        { prefixo: "!membroa", arquivo: "associacao.js" },
        { prefixo: "!cargosa", arquivo: "associacao.js" },
        { prefixo: "!guerra ", arquivo: "guerra.js" },
        { prefixo: "!pontuacao", arquivo: "pontuacao.js" },
        { prefixo: "!add quest", arquivo: "addQuest.js" },
        { prefixo: "!liberar dungeon", arquivo: "liberarDungeonSemanal.js" },
        { prefixo: "!excluir item", arquivo: "excluirItem.js" },
        { prefixo: "!unicos", arquivo: "unicos.js" },
        { prefixo: "!hp", arquivo: "hp.js" },
        { prefixo: "!dado", arquivo: "dado.js" },
        { prefixo: "!caixa", arquivo: "caixa.js" },
        { prefixo: "!abrir caixa", arquivo: "abrirCaixa.js" },
        { prefixo: "!abrir loja", arquivo: "abrirLoja.js" },
        { prefixo: "!equipados", arquivo: "verSlots.js" },
        { prefixo: "!slot", arquivo: "verLoja.js" },
        { prefixo: "!arma", arquivo: "verLoja.js" },
        { prefixo: "!itens de apoio", arquivo: "verLoja.js" },
        { prefixo: "!armas de apoio", arquivo: "verLoja.js" },
        { prefixo: "!minigame", arquivo: "minigames.js" },
        { prefixo: "!arquitetura", arquivo: "arquitetura.js" },
        { prefixo: "!saldo", arquivo: "saldo.js" },
        { prefixo: "!banco", arquivo: "saldo.js" },
        { prefixo: "!minhas compras", arquivo: "compra.js" },
        { prefixo: "!compra", arquivo: "compra.js" },
        { prefixo: "!avaliar rank", arquivo: "avaliarRank.js" },
        { prefixo: "!rank requisitos", arquivo: "avaliarRank.js" },
        { prefixo: "!rank info", arquivo: "avaliarRank.js" },
        { prefixo: "!progresso", arquivo: "progresso.js" },
        { prefixo: "!distribuir", arquivo: "distribuir.js" },
        { prefixo: "!apagar personagem", arquivo: "apagarPersonagem.js" },
        { prefixo: "!tenho certeza", arquivo: "apagarPersonagem.js" },
        { prefixo: "!quest diária finalizada", arquivo: "aprovarAtividade.js" },
        { prefixo: "!quest diaria finalizada", arquivo: "aprovarAtividade.js" },
        { prefixo: "!treino de maestria finalizado", arquivo: "aprovarAtividade.js" },
        { prefixo: "!treino conjunto finalizado", arquivo: "aprovarAtividade.js" },
        { prefixo: "!interação finalizada", arquivo: "aprovarAtividade.js" },
        { prefixo: "!interacao finalizada", arquivo: "aprovarAtividade.js" },
        { prefixo: "!fim de interação", arquivo: "fimInteracao.js" },
        { prefixo: "!fim de interacao", arquivo: "fimInteracao.js" },
        { prefixo: "!one post finalizado", arquivo: "aprovarAtividade.js" },
        { prefixo: "!desejar", arquivo: "desejar.js" },
        { prefixo: "!ficha de dungeon", arquivo: "fichaDungeon.js" },
        { prefixo: "!ficha de Dungeon", arquivo: "fichaDungeon.js" },
        { prefixo: "!concluir dungeon", arquivo: "concluirDungeon.js" },
        { prefixo: "!aprovar dungeon semanal", arquivo: "aprovarDungeonSemanal.js" },
        { prefixo: "!concluir Dungeon", arquivo: "concluirDungeon.js" },
        { prefixo: "!escolho a opção", arquivo: "escolherPremio.js" },
        { prefixo: "!escolho a opcao", arquivo: "escolherPremio.js" },
        { prefixo: "!escolho", arquivo: "escolherPremio.js" },
        { prefixo: "!abrir dungeon", arquivo: "abrirDungeon.js" },
        { prefixo: "!abrir Dungeon", arquivo: "abrirDungeon.js" },
        { prefixo: "!abrir chave", arquivo: "abrirDungeon.js" },
        { prefixo: "!minha dungeon", arquivo: "minhaDungeon.js" },
        { prefixo: "!minha Dungeon", arquivo: "minhaDungeon.js" },
        { prefixo: "!usar ticket", arquivo: "usarTicket.js" },
        { prefixo: "!meus tickets", arquivo: "meusTickets.js" },
        { prefixo: "!fila tickets", arquivo: "filaTickets.js" },
        { prefixo: "!consultar item", arquivo: "consultarConteudo.js" },
        { prefixo: "!consultar tecnica", arquivo: "consultarConteudo.js" },
        { prefixo: "!consultar passiva", arquivo: "consultarConteudo.js" },
        { prefixo: "!consultar titulo", arquivo: "consultarConteudo.js" },
        { prefixo: "!entregar chave", arquivo: "entregarChave.js" },
        { prefixo: "!Entregar Chave", arquivo: "entregarChave.js" },
        { prefixo: "!vysache", arquivo: "vysache.js" },
        { prefixo: "!visache", arquivo: "vysache.js" },
        { prefixo: "!bilac afinidade", arquivo: "vysache.js" },
        { prefixo: "!bilac combinacoes", arquivo: "vysache.js" },
        { prefixo: "!bilac historico", arquivo: "vysache.js" },
        { prefixo: "!bilac ficha", arquivo: "vysache.js" },
        { prefixo: "!vender", arquivo: "vender.js" },
        { prefixo: "!premios dungeon", arquivo: "consultarPremiosDungeon.js" },
        { prefixo: "!confirmar venda", arquivo: "confirmarVenda.js" },
        { prefixo: "!cancelar venda", arquivo: "cancelarVenda.js" },
        { prefixo: "!paimon", arquivo: "sistema.js" },
        { prefixo: "!ia", arquivo: "ia.js" },
        // =====================================
        // COMANDOS DE NPCs (prefixo)
        // =====================================
        { prefixo: "!ophilia_clement", arquivo: "npc_ophilia_clement.js" },
        { prefixo: "!cyrus_albright", arquivo: "npc_cyrus_albright.js" },
        { prefixo: "!tressa_colzione", arquivo: "npc_tressa_colzione.js" },
        { prefixo: "!olberic_eisenberg", arquivo: "npc_olberic_eisenberg.js" },
        { prefixo: "!primrose_azelhart", arquivo: "npc_primrose_azelhart.js" },
        { prefixo: "!alfyn_greengrass", arquivo: "npc_alfyn_greengrass.js" },
        { prefixo: "!therion", arquivo: "npc_therion.js" },
        { prefixo: "!haanit", arquivo: "npc_haanit.js" },
        { prefixo: "!hikari_ku", arquivo: "npc_hikari_ku.js" },
        { prefixo: "!agnea_bristarni", arquivo: "npc_agnea_bristarni.js" },
        { prefixo: "!castti_florenz", arquivo: "npc_castti_florenz.js" },
        { prefixo: "!osvald_v_vanstein", arquivo: "npc_osvald_v_vanstein.js" },
        { prefixo: "!partitio_yellowil", arquivo: "npc_partitio_yellowil.js" },
        { prefixo: "!ochette", arquivo: "npc_ochette.js" },
        { prefixo: "!temenos_mistral", arquivo: "npc_temenos_mistral.js" },
        { prefixo: "!throne_anguis", arquivo: "npc_throne_anguis.js" },
        { prefixo: "!lyblac", arquivo: "npc_lyblac.js" },
        { prefixo: "!galdera", arquivo: "npc_galdera.js" },
        { prefixo: "!vide_o_corruptor", arquivo: "npc_vide_o_corruptor.js" },
        { prefixo: "!trousseau", arquivo: "npc_trousseau.js" },
        // ===== OT0 =====
        { prefixo: "!stia_han", arquivo: "npc_stia_han.js" },
        { prefixo: "!phenn_doyoung", arquivo: "npc_phenn_doyoung.js" },
        { prefixo: "!laurana_bae", arquivo: "npc_laurana_bae.js" },
        { prefixo: "!celsus_park", arquivo: "npc_celsus_park.js" },
        { prefixo: "!macy_eun", arquivo: "npc_macy_eun.js" },
        { prefixo: "!alexia_song", arquivo: "npc_alexia_song.js" },
        { prefixo: "!viator_yoon", arquivo: "npc_viator_yoon.js" },
        { prefixo: "!ludo_wei", arquivo: "npc_ludo_wei.js" },
        { prefixo: "!carinda_moon", arquivo: "npc_carinda_moon.js" },
        { prefixo: "!pius_kang", arquivo: "npc_pius_kang.js" },
        { prefixo: "!saoirse_ryu", arquivo: "npc_saoirse_ryu.js" },
        { prefixo: "!xerc_baek", arquivo: "npc_xerc_baek.js" },
        { prefixo: "!delitia_song", arquivo: "npc_delitia_song.js" },
        { prefixo: "!esperre_jin", arquivo: "npc_esperre_jin.js" },
        { prefixo: "!goodwin_cha", arquivo: "npc_goodwin_cha.js" },
        { prefixo: "!reime_oh", arquivo: "npc_reime_oh.js" },
        { prefixo: "!heidne_ahn", arquivo: "npc_heidne_ahn.js" },
        // ===== CotC =====
        { prefixo: "!bargello_yeon", arquivo: "npc_bargello_yeon.js" },
        { prefixo: "!alaune_yeong", arquivo: "npc_alaune_yeong.js" },
        { prefixo: "!richard_han", arquivo: "npc_richard_han.js" },
        { prefixo: "!solon_wi", arquivo: "npc_solon_wi.js" },
        { prefixo: "!eltrix_noh", arquivo: "npc_eltrix_noh.js" },
        { prefixo: "!rondo_baek", arquivo: "npc_rondo_baek.js" },
        { prefixo: "!isla_gwon", arquivo: "npc_isla_gwon.js" },
        { prefixo: "!sazantos_do", arquivo: "npc_sazantos_do.js" },
        { prefixo: "!elrica_edoras", arquivo: "npc_elrica_edoras.js" },
        { prefixo: "!tatloch", arquivo: "npc_tatloch.js" },
        // ===== Bosses OT1 =====
        { prefixo: "!mattias_cardoso", arquivo: "npc_mattias_cardoso.js" },
        { prefixo: "!werner_choi", arquivo: "npc_werner_choi.js" },
        { prefixo: "!simeon_ha", arquivo: "npc_simeon_ha.js" },
        { prefixo: "!darius_kwon", arquivo: "npc_darius_kwon.js" },
        { prefixo: "!redeye", arquivo: "npc_redeye.js" },
        { prefixo: "!miguel_bang", arquivo: "npc_miguel_bang.js" },
        // ===== Vilões Complemento =====
        { prefixo: "!gaston_rho", arquivo: "npc_gaston_rho.js" },
        { prefixo: "!yvon_baik", arquivo: "npc_yvon_baik.js" },
        { prefixo: "!lucia_yeom", arquivo: "npc_lucia_yeom.js" },
        { prefixo: "!vanessa_hysel", arquivo: "npc_vanessa_hysel.js" },
        { prefixo: "!gideon_ma", arquivo: "npc_gideon_ma.js" },
        { prefixo: "!rufus_deng", arquivo: "npc_rufus_deng.js" },
        { prefixo: "!trish_yamaguchi", arquivo: "npc_trish_yamaguchi.js" },
        { prefixo: "!warden_davids", arquivo: "npc_warden_davids.js" },
        { prefixo: "!helgenish", arquivo: "npc_helgenish.js" },
        { prefixo: "!entidade_mae", arquivo: "npc_entidade_mae.js" },
        // ===== Ordem da Meia-Noite =====
        { prefixo: "!mugen_ku", arquivo: "npc_mugen_ku.js" },
        { prefixo: "!kazan", arquivo: "npc_kazan.js" },
        { prefixo: "!tanzy_woo", arquivo: "npc_tanzy_woo.js" },
        { prefixo: "!ori_choi", arquivo: "npc_ori_choi.js" },
        { prefixo: "!harvey_jeong", arquivo: "npc_harvey_jeong.js" },
        { prefixo: "!arcanette", arquivo: "npc_arcanette.js" },
        { prefixo: "!kaldena_ryu", arquivo: "npc_kaldena_ryu.js" },
        { prefixo: "!claude", arquivo: "npc_claude.js" },
        { prefixo: "!petrichor", arquivo: "npc_petrichor.js" },
        { prefixo: "!missoes npc", arquivo: "npcMissoes.js" },
    ];

    // =====================================
    // VERIFICAR CONVERSA COM NPC (multi-linha)
    // =====================================
    // Mensagens no formato "!npc_id\nmensagem" são conversas com NPCs
    // Devem ser verificadas antes dos comandos normais
    if (msgBody.startsWith("!") && msgBody.includes("\n") && !/^!paimon\b/i.test(msgBody) && !/^!criar banner\b/i.test(msgBody) && !/^!conjunto\s+criar\b/i.test(msgBody) && !/^!(?:t[ií]tulo|passiva)\s+criar\b/i.test(msgBody)) {
        try {
            const { processarConversaNPC } = require("../npc/npcConversa");
            const processado = await processarConversaNPC(msg);
            if (processado) {
                console.log(`[CMD] Conversa com NPC processada com sucesso`);
                return;
            }
        } catch (e) {
            console.log(`[CMD] Erro ao verificar conversa NPC:`, e.message);
        }
    }

    const indiceComandos = criarIndiceDeComandos(mapaComandos);

    // Verificar comando exato primeiro
    console.log(`[CMD] Buscando comando exato: "${comandoLower}"`);
    const comandoExato = indiceComandos.get(comandoLower);
    if (comandoExato) {
        console.log(`[CMD] Comando exato encontrado: ${comandoExato.arquivo}`);
        const modulo = carregarComando(comandoExato.arquivo);
        if (modulo) {
            console.log(`[CMD] Executando comando: ${comandoExato.arquivo}`);
            const originalBody = normalizarMensagemParaHandler(msg, comandoExato.nome.trim().split(/\s+/).length, comandoExato.nome);
            try {
                await modulo(msg);
            } finally {
                msg.body = originalBody;
            }
            console.log(`[CMD] Comando executado com sucesso`);
            return;
        } else {
            console.log(`[CMD] Módulo não encontrado: ${mapaComandos[comandoLower]}`);
        }
    }
    
    // =====================================
    // COMANDOS DE CLASSES - consultam banco de dados
    // =====================================
    // Os nomes mais especificos precisam ser avaliados primeiro. Sem isso,
    // "!mago de barreira" era capturado pelo prefixo curto "!mago".
    for (const cmdClasse of [...comandosClasses].sort((a, b) => b.length - a.length)) {
        const classeCanonica = normalizarComando(cmdClasse);
        const classesAceitas = [classeCanonica, ...aliasesDePlural(classeCanonica)];
        if (classesAceitas.some(classe => comandoLower === classe || comandoLower.startsWith(classe + " "))) {
            const nomeClasse = cmdClasse.replace("!", "");
            const tecnicasClasse = carregarComando("tecnicasClasse.js");
            if (tecnicasClasse) {
                await tecnicasClasse(msg, nomeClasse);
                return;
            }
        }
    }

    // Verificar comandos com prefixo
    const prefixosAceitos = comandosPrefixo.flatMap(cmd => {
        const prefixo = normalizarComando(cmd.prefixo);
        return [prefixo, ...aliasesDePlural(prefixo)].map(alias => ({ ...cmd, prefixoCanonico: alias }));
    }).sort((a, b) => b.prefixoCanonico.length - a.prefixoCanonico.length);
    console.log(`[CMD] Verificando ${prefixosAceitos.length} comandos com prefixo...`);
    for (const cmd of prefixosAceitos) {
        // Os comandos administrativos usam o sinal junto ao recurso
        // (ex.: !+won e !+xp), portanto não há espaço após !+ ou !-.
        // Os demais prefixos continuam exigindo limite de palavra para evitar
        // colisões entre comandos de nomes parecidos.
        const prefixoDeRecurso = cmd.prefixoCanonico === "!+" || cmd.prefixoCanonico === "!-";
        const correspondeAoPrefixo = prefixoDeRecurso
            ? comandoLower.startsWith(cmd.prefixoCanonico)
            : comandoLower === cmd.prefixoCanonico || comandoLower.startsWith(cmd.prefixoCanonico + " ");
        if (correspondeAoPrefixo) {
            console.log(`[CMD] Prefixo encontrado: "${cmd.prefixo}" -> ${cmd.arquivo}`);
            const modulo = carregarComando(cmd.arquivo);
            if (modulo) {
                console.log(`[CMD] Executando: ${cmd.arquivo}`);
                // O Cardinal usa um prefixo próprio. Os módulos internos continuam
                // recebendo a forma canônica para não interferir nos demais comandos.
                const quantidadePalavras = String(cmd.prefixo).trim().split(/\s+/).length;
                const originalBody = normalizarMensagemParaHandler(msg, quantidadePalavras, cmd.prefixoCanonico);
                if (cmd.arquivo === "cardinalAdmin.js") msg.body = String(msg.body || "").replace(/^\.\#cardinal/i, "!cardinal");
                try {
                    await modulo(msg);
                } finally {
                    msg.body = originalBody;
                }
                console.log(`[CMD] Comando com prefixo executado com sucesso`);
                return;
            } else {
                console.log(`[CMD] Módulo não encontrado: ${cmd.arquivo}`);
            }
        }
    }

    // =====================================
    // RECONHECER FICHA AUTOMATICA
    // =====================================
    if (!msg.body.startsWith("!")) {
        console.log(`[EXEC] Reconhecendo ficha automaticamente...`);
        const reconhecerFicha = carregarComando("utils/reconhecerFicha.js");
        if (reconhecerFicha) {
            await reconhecerFicha(msg);
        }
        return;
    }

    // =====================================
    // VERIFICAR CONVERSA COM NPC (linha única)
    // =====================================
    // Se chegou até aqui e não foi nenhum comando conhecido,
    // verifica se é um NPC válido (ex: !ophilia sem mensagem)
    if (msgBody.startsWith("!")) {
        try {
            const { processarConversaNPC } = require("../npc/npcConversa");
            const processado = await processarConversaNPC(msg);
            if (processado) {
                console.log(`[CMD] Conversa com NPC (linha única) processada`);
                return;
            }
        } catch (e) {
            console.log(`[CMD] Erro ao verificar conversa NPC (linha única):`, e.message);
        }
    }

    // Comando nao encontrado
    console.log(`[CMD] ✗ Comando não encontrado: "${comandoLower}"`);
    if (msg.body.startsWith("!")) {
        await MessageService.send({ message: msg, text: `
*X COMANDO NAO RECONHECIDO*
O comando *${msg.body}* nao existe no sistema.
> Use !iniciar para ver os comandos disponiveis.
        ` });
    }
}

module.exports = {
    executarComando,
    normalizarComando,
    aliasesDePlural,
    criarIndiceDeComandos
};
