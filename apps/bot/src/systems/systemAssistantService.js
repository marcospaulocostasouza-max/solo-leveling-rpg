const db = require("../core/database");
const { ollamaService } = require("../ia/ollamaService");
const { registrarTodosComandos } = require("../core/registroComandos");
const { BASE_CONHECIMENTO } = require("./paimonKnowledgeBase");
const { construirPrompt, INSTRUCAO_SISTEMA } = require("./paimonResponsePolicy");
const fs = require("fs");
const path = require("path");

const MODEL = process.env.SYSTEM_ASSISTANT_MODEL || "qwen3:4b-instruct-2507-q4_K_M";
const DURACAO_SESSAO_MS = Number(process.env.PAIMON_SESSION_MINUTES || 30) * 60 * 1000;
const LIMITE_HISTORICO = 12;
let tabelasProntas;
let indiceSistemas;
let indiceAtualizadoEm = 0;
const cacheCatalogos = new Map();
const consultasCatalogo = new Map();
const conversasEmAndamento = new Map();
const CACHE_CATALOGO_MS = 30000;
const comandosRegistrados = registrarTodosComandos();

const run = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, function(error) { error ? reject(error) : resolve({ lastID: this?.lastID, changes: this?.changes }); }));
const get = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (error, row) => error ? reject(error) : resolve(row || null)));
const all = (sql, params = []) => new Promise((resolve, reject) => db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows || [])));

function normalizar(valor) {
    return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function tokens(valor) {
    const ignorar = new Set(["que", "como", "qual", "quais", "para", "uma", "meu", "minha", "dos", "das", "preciso", "quero", "posso", "funciona", "funcionar", "uso", "usar", "antes", "depois"]);
    return normalizar(valor).split(" ").filter(token => token.length > 2 && !ignorar.has(token));
}
function pontuar(texto, consulta) {
    const base = normalizar(texto);
    return tokens(consulta).reduce((total, token) => total + (base.includes(token) ? (base.startsWith(token) ? 3 : 1) : 0), 0);
}

const SINONIMOS = {
    upo: ["nivel", "xp", "experiencia", "progressao", "atividades", "dungeon", "missao", "treino"],
    upar: ["nivel", "xp", "experiencia", "progressao", "atividades", "dungeon", "missao", "treino"],
    evoluir: ["nivel", "xp", "experiencia", "progressao", "rank"],
    evoluo: ["nivel", "xp", "experiencia", "progressao", "rank"],
    progrido: ["nivel", "xp", "experiencia", "progressao", "atividades"],
    dinheiro: ["won", "yulls", "saldo", "economia"],
    grana: ["won", "yulls", "saldo", "economia"],
    habilidade: ["tecnica", "passiva", "skill"],
    habilidades: ["tecnicas", "passivas", "skills"],
    arma: ["equipamento", "item", "inventario", "equipar"],
    forte: ["atributos", "equipamentos", "tecnicas", "nivel", "rank"],
    fortalecer: ["atributos", "equipamentos", "tecnicas", "nivel", "rank"],
    vejo: ["ver", "consultar", "listar"],
    compro: ["comprar", "compra"],
    ganho: ["ganhar", "obter", "receber"]
};
function expandirConsulta(pergunta) {
    const base = tokens(pergunta); const expandidos = [...base];
    for (const token of base) if (SINONIMOS[token]) expandidos.push(...SINONIMOS[token]);
    return [...new Set(expandidos)].join(" ");
}
function construirIndiceSistemas() {
    if (indiceSistemas && Date.now() - indiceAtualizadoEm < 60000) return indiceSistemas;
    const raiz = path.resolve(__dirname, "../../../..");
    const entradas = [path.join(raiz, "README.md"), path.join(raiz, "docs"), path.join(raiz, "apps/bot/src/commands"), path.join(raiz, "apps/bot/src/systems"), path.join(raiz, "apps/site/lib/architect-catalog.ts")];
    const arquivos = [];
    function visitar(alvo) {
        if (!fs.existsSync(alvo)) return; const stat = fs.statSync(alvo);
        if (stat.isDirectory()) return fs.readdirSync(alvo, { withFileTypes: true }).forEach(item => { if (!item.name.includes("NPC_LORA") && !item.name.startsWith(".")) visitar(path.join(alvo, item.name)); });
        if (/\.(?:js|md|ts)$/i.test(alvo) && stat.size <= 250000 && path.basename(alvo) !== "systemAssistantService.js") arquivos.push(alvo);
    }
    entradas.forEach(visitar); const blocos = [];
    for (const arquivo of arquivos) {
        const relativo = path.relative(raiz, arquivo).replace(/\\/g, "/");
        const texto = fs.readFileSync(arquivo, "utf8").replace(/\r/g, "");
        const linhas = texto.split("\n");
        for (let inicio = 0; inicio < linhas.length; inicio += 24) {
            const conteudo = linhas.slice(inicio, inicio + 32).join("\n").trim();
            if (conteudo.length >= 80) blocos.push({ fonte: `${relativo}:${inicio + 1}`, conteudo, textoBusca: normalizar(conteudo) });
        }
    }
    indiceAtualizadoEm = Date.now(); indiceSistemas = blocos; return blocos;
}
function recuperarConhecimentoSistemas(pergunta, limite = 6, ehAdmin = false) {
    const consulta = expandirConsulta(pergunta);
    const termos = tokens(consulta);
    const progressao = /\b(?:upo|upar|evoluir|nivel|xp|experiencia|progressao)\b/.test(consulta);
    const porArquivo = new Map();
    const assunto = identificarIntencao(pergunta);
    const preferidas = /\bsemanal\b/.test(consulta) && /\bdungeon\b/.test(consulta)
        ? /\/(?:weeklyDungeonSystem|dungeonSemanal)\.js:/i
        : ({ GACHA: /\/gacha[^/]*\.js:/i, TECNICAS: /\/(?:comprarTecnica|tecnicas|techniquePurchaseService)[^/]*\.js:/i,
            EQUIPAMENTO: /\/(?:inventario|equipar|desequipar)[^/]*\.js:/i,
            ATIVIDADES: /\/(?:questSystem|missionProgressService|missoes|npcMissoes|dungeon)[^/]*\.js:/i,
            ECONOMIA: /\/(?:loja|saldo|comprar|economia)[^/]*\.js:/i })[assunto];
    return construirIndiceSistemas().filter(bloco => ehAdmin || !/(?:^|\/)(?:admin|aprovar|confirmar|avaliar)[^/]*\.js:|\/[^/]*(?:Admin|Adm)[^/]*\.js:/i.test(bloco.fonte)).map(bloco => {
        let pontos = termos.reduce((total, termo) => total + (bloco.textoBusca.includes(termo) ? 1 : 0), 0);
        if (pontos && preferidas?.test(bloco.fonte)) pontos += 16;
        if (progressao && /\/(?:levelSystem|nivel|progresso|dungeon|missoes)\.js:/i.test(bloco.fonte)) pontos += 8;
        return { ...bloco, pontos };
    }).filter(bloco => bloco.pontos > 0).sort((a, b) => b.pontos - a.pontos).filter(bloco => {
        const arquivo = bloco.fonte.split(":")[0];
        const quantidade = porArquivo.get(arquivo) || 0;
        porArquivo.set(arquivo, quantidade + 1);
        return quantidade < 2;
    }).slice(0, limite);
}
function recuperarBasePaimon(pergunta, limite = 5, ehAdmin = false) {
    const consulta = expandirConsulta(pergunta);
    const genericos = new Set(["como", "uso", "usar", "para", "serve", "qual", "quais", "comando", "comandos", "faco", "fazer", "quero", "posso", "consigo"]);
    const termosOriginais = tokens(pergunta).filter(token => !genericos.has(token));
    const termosConsulta = tokens(consulta).filter(token => !genericos.has(token));
    const comandosExplicitos = [...String(pergunta).matchAll(/!([\p{L}\p{N}_]+)/gu)].map(match => normalizar(match[1]));
    const semanal = /\bdungeon semanal\b/.test(normalizar(pergunta));
    return BASE_CONHECIMENTO.filter(item => (ehAdmin || !item.administrativo) && (!semanal || /dungeon semanal/.test(normalizar(item.comando)))).map(item => {
        const texto = normalizar(`${item.pergunta} ${item.termos}`);
        const textoComando = normalizar(item.comando);
        const tokensComando = new Set(textoComando.split(" "));
        let pontos = termosConsulta.reduce((total, token) => total + (texto.includes(token) ? 1 : 0), 0);
        pontos += termosOriginais.reduce((total, token) => total + (texto.includes(token) ? 2 : 0) + (tokensComando.has(token) ? 16 : 0), 0);
        if (comandosExplicitos.some(comando => textoComando.split(" ").includes(comando))) pontos += 30;
        return { ...item, pontos };
    }).filter(item => item.pontos > 0).sort((a, b) => b.pontos - a.pontos || a.id.localeCompare(b.id))
        .filter((item, indice, lista) => lista.findIndex(outro => outro.comando === item.comando) === indice).slice(0, limite);
}

async function garantirTabelas() {
    if (!tabelasProntas) tabelasProntas = (async () => {
        await run("CREATE TABLE IF NOT EXISTS paimon_sessoes (numero TEXT PRIMARY KEY, ativa INTEGER NOT NULL DEFAULT 0, atualizado_em TEXT NOT NULL)");
        await run("CREATE TABLE IF NOT EXISTS paimon_mensagens (numero TEXT NOT NULL, sequencia INTEGER NOT NULL, papel TEXT NOT NULL, conteudo TEXT NOT NULL, criado_em TEXT NOT NULL, PRIMARY KEY (numero, sequencia))");
    })().catch(error => { tabelasProntas = null; throw error; });
    return tabelasProntas;
}
async function definirSessao(numero, ativa) {
    await garantirTabelas();
    await run(`INSERT INTO paimon_sessoes (numero, ativa, atualizado_em) VALUES (?, ?, ?)
        ON CONFLICT(numero) DO UPDATE SET ativa = excluded.ativa, atualizado_em = excluded.atualizado_em`, [numero, ativa ? 1 : 0, new Date().toISOString()]);
}
async function sessaoAtiva(numero) {
    await garantirTabelas();
    const sessao = await get("SELECT ativa, atualizado_em FROM paimon_sessoes WHERE numero = ?", [numero]);
    if (!sessao || !Number(sessao.ativa)) return false;
    const ativa = Date.now() - Date.parse(sessao.atualizado_em) <= DURACAO_SESSAO_MS;
    if (!ativa) await definirSessao(numero, false);
    return ativa;
}
async function salvarMensagem(numero, papel, conteudo) {
    await garantirTabelas();
    await run(`INSERT INTO paimon_mensagens (numero, sequencia, papel, conteudo, criado_em)
        SELECT ?, COALESCE(MAX(sequencia), 0) + 1, ?, ?, ?
        FROM paimon_mensagens WHERE numero = ?`, [numero, papel, String(conteudo).slice(0, 5000), new Date().toISOString(), numero]);
    await definirSessao(numero, true);
}
async function obterHistorico(numero, pergunta) {
    await garantirTabelas();
    const mensagens = await all("SELECT sequencia, papel, conteudo FROM paimon_mensagens WHERE numero = ? ORDER BY sequencia DESC LIMIT 80", [numero]);
    const continuacao = ehContinuacao(pergunta);
    const escolhidas = continuacao ? mensagens.slice(0, LIMITE_HISTORICO) : mensagens.map(item => ({ ...item, pontos: pontuar(item.conteudo, expandirConsulta(pergunta)) })).filter(item => item.pontos > 0).sort((a, b) => b.pontos - a.pontos).slice(0, 6);
    return escolhidas.sort((a, b) => a.sequencia - b.sequencia).map(item => `${item.papel === "user" ? "Jogador" : "Paimon"}: ${item.conteudo}`).join("\n").slice(-3600);
}

function ehContinuacao(pergunta) {
    return /\b(?:isso|isto|aquilo|ele|ela|eles|elas|desse|dessa|nisso|depois|tambem)\b|^e\b/.test(normalizar(pergunta)) || tokens(pergunta).length < 2;
}

function definirTamanhoResposta(pergunta) {
    const texto = String(pergunta || "").trim();
    const palavras = texto.split(/\s+/).filter(Boolean).length;
    const ampla = /explique|detalh|passo a passo|tudo sobre|como funciona|compare|diferen/i.test(normalizar(texto));
    if (ampla || palavras > 30) return { numPredict: 640, maxCaracteres: 2600, tipo: "detalhada" };
    if (palavras > 12 || /\b(?:como|porque|por que)\b/.test(normalizar(texto))) return { numPredict: 360, maxCaracteres: 1500, tipo: "explicativa" };
    return { numPredict: 260, maxCaracteres: 1000, tipo: "objetiva" };
}
function identificarIntencao(pergunta) {
    const texto = normalizar(pergunta);
    if (/\b(?:gacha|banner|banners|convergir|pity)\b/.test(texto)) return "GACHA";
    if (/\bdungeon semanal\b/.test(texto)) return "ATIVIDADES";
    if (/\b(?:upo|upar|evoluir|xp|experiencia|progressao|progredir|nivel)\b/.test(texto)) return "PROGRESSAO";
    if (/\b(?:equipar|desequipar|inventario|item|arma|armadura|acessorio)\b/.test(texto)) return "EQUIPAMENTO";
    if (/\b(?:gacha|banner|convergir|cristais|pity)\b/.test(texto)) return "GACHA";
    if (/\b(?:tecnica|passiva|maestria|habilidade)\b/.test(texto)) return "TECNICAS";
    if (/\b(?:dungeon|masmorra|missao|treino|atividade)\b/.test(texto)) return "ATIVIDADES";
    if (/\b(?:won|saldo|comprar|loja|preco)\b/.test(texto)) return "ECONOMIA";
    return "GERAL";
}
function orientacaoDaIntencao(intencao) {
    return ({
        PROGRESSAO: "Explique como obter XP e progredir usando somente atividades confirmadas; não cite nível, Rank ou ficha se não foram perguntados.",
        EQUIPAMENTO: "Diga como consultar, obter ou equipar itens conforme os comandos e requisitos recuperados.",
        GACHA: "Explique banners, cristais e convergência somente pelos dados recuperados; não invente chances ou pity.",
        TECNICAS: "Diga requisitos, consulta ou obtenção de técnicas/passivas apenas quando estiverem confirmados.",
        ATIVIDADES: "Explique o fluxo da atividade e o comando aplicável, sem prometer recompensa que não esteja nas regras.",
        ECONOMIA: "Explique como consultar ou obter recursos apenas pelas fontes recuperadas.",
        GERAL: "Responda à dúvida principal usando o trecho mais diretamente relacionado."
    })[intencao];
}
function limitarResposta(texto, limite) {
    if (texto.length <= limite) return texto;
    const trecho = texto.slice(0, limite - 1);
    const corte = Math.max(trecho.lastIndexOf("."), trecho.lastIndexOf("\n"), trecho.lastIndexOf(" "));
    return `${trecho.slice(0, corte > limite * 0.6 ? corte + 1 : trecho.length).trim()}…`;
}
function limparRespostaPaimon(texto) {
    const linhas = String(texto || "").replace(/\r/g, "").split("\n").map(linha => linha.trim());
    const unicas = [];
    for (const linha of linhas) {
        if (!linha) { if (unicas.length && unicas.at(-1)) unicas.push(""); continue; }
        const limpa = linha.replace(/^(?:paimon|resposta da paimon)\s*:\s*/i, "").trim();
        if (limpa && !unicas.some(anterior => normalizar(anterior) === normalizar(limpa))) unicas.push(limpa);
    }
    return unicas.join("\n").replace(/\b(?:como uma ia|como assistente|com base no contexto fornecido)\b[:, ]*/ig, "").trim();
}
function comandoAdministrativo(comando) {
    return /\badm\b|gachaadm|administrativ|administrador|aprovar|recusar|registrar adm|liberar|avaliar ficha/.test(normalizar(`${comando.nome} ${comando.funcao} ${comando.descricao} ${comando.categoria}`));
}
function obterGuiaComandos(ehAdmin, pergunta = "") {
    const itens = comandosRegistrados.filter(comando => comando.ativo && (ehAdmin || !comandoAdministrativo(comando))).map(comando => ({ comando, pontos: pontuar(`${comando.nome} ${comando.funcao} ${comando.descricao} ${comando.categoria}`, pergunta) }));
    const relevantes = itens.filter(item => item.pontos > 0).sort((a, b) => b.pontos - a.pontos).slice(0, 8);
    return relevantes.map(({ comando }) => `${comando.nome}: ${comando.descricao}`).join("\n");
}
function resumirJogador(jogador) {
    return `Nome: ${jogador.nome}; nível ${jogador.nivel}; Rank ${jogador.rank}; classe ${jogador.classe}; classe avançada ${jogador.classe_avancada || "Nenhuma"}; estilo ${jogador.estilo_luta || "Nenhum"}; Maestria ${jogador.maestria}; Won ${jogador.won}; Cristais ${jogador.cristais || 0}.`;
}
async function consultarCatalogo(pergunta) {
    const consulta = normalizar(pergunta);
    const buscas = [
        ["técnicas", /\b(?:tecnica|tecnicas|habilidade|habilidades|skill|skills|passiva|passivas)\b/, "SELECT nome, classe, categoria, descricao, custo_mana, nivel_desbloqueio FROM tecnicas LIMIT 1200"],
        ["itens", /\b(?:item|itens|arma|armas|armadura|equipamento|material|materiais|comprar|loja)\b/, "SELECT nome, categoria, tier, preco, descricao, efeito, habilidade FROM itens LIMIT 1200"],
        ["estilos", /\b(?:estilo|estilos|proficiencia|proficiencias)\b/, "SELECT nome, arma, descricao, tecnica_nome, descricao_tecnica FROM estilos_luta LIMIT 200"]
    ];
    // Cache only public catalog data, never personal data or generated answers.
    const selecionadas = buscas.filter(([, expressao]) => expressao.test(consulta));
    if (!selecionadas.length && identificarIntencao(pergunta) === "GERAL") selecionadas.push(...buscas);
    const termos = tokens(pergunta);
    const resultados = await Promise.all(selecionadas.map(async ([rotulo, , sql]) => {
        try {
            let cache = cacheCatalogos.get(rotulo);
            if (!cache || Date.now() - cache.criadoEm >= CACHE_CATALOGO_MS) {
                if (!consultasCatalogo.has(rotulo)) consultasCatalogo.set(rotulo, all(sql).then(linhas => {
                    const entrada = { criadoEm: Date.now(), linhas: linhas.map(item => ({ item, busca: normalizar(Object.values(item).join(" ")), nome: normalizar(item.nome) })) };
                    cacheCatalogos.set(rotulo, entrada); return entrada;
                }).finally(() => consultasCatalogo.delete(rotulo)));
                cache = await consultasCatalogo.get(rotulo);
            }
            const melhores = cache.linhas.map(({ item, busca, nome }) => ({ item, pontos: termos.reduce((total, termo) => total + (busca.includes(termo) ? 1 : 0) + (nome.includes(termo) ? 4 : 0), 0) })).filter(item => item.pontos > 0).sort((a, b) => b.pontos - a.pontos).slice(0, 3);
            return melhores.length ? `${rotulo}: ${melhores.map(({ item }) => formatarCatalogo(rotulo, item).slice(0, 600)).join(" | ")}` : "";
        } catch (error) { console.warn(`[PAIMON] Consulta de ${rotulo} indisponível:`, error.message); return `${rotulo}: consulta indisponível; não confirme preços, requisitos ou efeitos deste catálogo.`; }
    }));
    return resultados.filter(Boolean).join("\n");
}
function formatarCatalogo(rotulo, item = {}) {
    if (rotulo === "técnicas") return `${item.nome} — ${item.classe || "classe não informada"}; nível ${item.nivel_desbloqueio ?? "não informado"}; custo em MP: ${item.custo_mana ?? "não informado"}. ${item.descricao || ""}`.trim();
    if (rotulo === "itens") return `${item.nome} — ${item.categoria || "item"} Rank/Tier ${item.tier || "não informado"}; preço ${item.preco ?? "não informado"}. ${item.efeito || item.habilidade || item.descricao || ""}`.trim();
    return `${item.nome} — arma: ${item.arma || "não informada"}. ${item.descricao_tecnica || item.descricao || ""}`.trim();
}
async function obterContexto(numero, ehAdmin = false, pergunta = "") {
    const pedeFicha = /\b(?:meu|minha|meus|minhas|quanto\s+(?:tenho|falta))\b/.test(normalizar(pergunta));
    const [jogador, catalogo] = await Promise.all([
        pedeFicha ? get("SELECT * FROM jogadores WHERE numero = ?", [numero]) : null,
        consultarCatalogo(pergunta)
    ]);
    const contexto = [];
    const fluxoSemanal = /\bdungeon semanal\b/.test(normalizar(pergunta));
    if (fluxoSemanal) {
        // Facts from weeklyDungeonSystem.aprovarConclusao and the active command
        // route. These distinguish the weekly flow from instanced dungeons.
        contexto.push(`Fatos confirmados do fluxo semanal: participação global, disponível a todos os jogadores. O jogador deve cumprir os objetivos e apresentar a atividade narrativa para a ADM avaliar; apenas participar não basta. A ADM lê a atividade e registra a aprovação diretamente com !aprovar dungeon semanal <nome do jogador>. Nenhum comando prévio de conclusão do jogador é necessário. A ausência desse comando não dispensa realizar e comprovar a atividade. !concluir dungeon pertence ao fluxo de dungeons instanciadas, não é requisito da semanal. A aprovação entrega os prêmios e impede pagamento duplicado para o mesmo jogador na mesma dungeon. A duração é de sete dias após a liberação, não um início fixo de calendário.`);
    }
    if (identificarIntencao(pergunta) === "GACHA") {
        try {
            const banners = await all("SELECT nome FROM gacha_banners WHERE ativo=1 AND (permanente=1 OR (inicio_em<=CURRENT_TIMESTAMP AND fim_em>=CURRENT_TIMESTAMP)) ORDER BY id");
            contexto.push(`Consulta atual de banners disponíveis: ${banners.length ? banners.map(item => item.nome).join("; ") : "nenhum"}. Não há confirmação de outros nomes de banners.`);
        } catch (error) {
            contexto.push("A lista atual de banners não pôde ser consultada. Oriente !Banners sem afirmar nomes ou disponibilidade.");
        }
    }
    const detalhada = definirTamanhoResposta(pergunta).tipo === "detalhada";
    const comandoExplicito = !detalhada && /![\p{L}\p{N}_]+/u.test(pergunta);
    const faq = recuperarBasePaimon(pergunta, comandoExplicito ? 1 : detalhada ? 3 : 2, ehAdmin);
    if (faq.length) contexto.push(`Referências de comandos: informações para interpretar, nunca respostas prontas.\n${faq.map(item => `${item.comando}: ${item.resposta}`).join("\n")}`);
    // Syntax guidance already has the verified command reference. Raw output
    // templates contain runtime placeholders, not the player's current values.
    const soSintaxe = comandoExplicito && /como (?:uso|usar)|qual.*comando|para que serve/.test(normalizar(pergunta));
    const conhecimento = soSintaxe || fluxoSemanal ? [] : recuperarConhecimentoSistemas(pergunta, comandoExplicito ? 1 : 2, ehAdmin);
    if (conhecimento.length) contexto.push(`Comportamento atual do sistema:\n${conhecimento.map(item => item.conteudo.slice(0, detalhada ? 1600 : 1100)).join("\n\n")}`);
    if (jogador && pedeFicha) contexto.push(`Dados do jogador, use somente se ajudarem a responder: ${resumirJogador(jogador)}`);
    else if (!jogador && pedeFicha) contexto.push("Não há ficha aprovada vinculada a este número.");
    if (jogador && pedeFicha) {
        try {
            const tecnicas = await all("SELECT t.nome, t.classe, t.nivel_desbloqueio FROM jogador_tecnicas jt JOIN tecnicas t ON t.id = jt.tecnica_id WHERE jt.jogador_id = ? ORDER BY t.nivel_desbloqueio, t.nome LIMIT 30", [jogador.id]);
            contexto.push(`Técnicas do jogador: ${tecnicas.length ? tecnicas.map(t => `${t.nome} (${t.classe}, nv. ${t.nivel_desbloqueio})`).join("; ") : "nenhuma"}.`);
        } catch (error) {
            console.warn("[PAIMON] Técnicas do jogador indisponíveis nesta consulta:", error.message);
        }
        try {
            const inventario = await all("SELECT i.nome, i.categoria, i.tier, inv.quantidade, inv.equipado FROM inventario_jogador inv JOIN itens i ON i.id = inv.item_id WHERE inv.jogador_id = ? ORDER BY inv.equipado DESC, i.nome LIMIT 40", [jogador.id]);
            contexto.push(`Inventário do jogador: ${inventario.length ? inventario.map(item => `${item.nome} (${item.categoria || "Item"}, ${item.tier || "sem rank"}, x${item.quantidade || 0}${Number(item.equipado) ? ", equipado" : ""})`).join("; ") : "vazio"}.`);
        } catch (error) {
            console.warn("[PAIMON] Inventário do jogador indisponível nesta consulta:", error.message);
        }
    }
    if (catalogo) contexto.push(`Resultados relevantes do banco:\n${catalogo}`);
    if (!faq.length) contexto.push(`Comandos relacionados:\n${obterGuiaComandos(ehAdmin, expandirConsulta(pergunta))}`);
    return contexto.join("\n").slice(0, 6500);
}

async function gerarRespostaPergunta(numero, pergunta, ehAdmin) {
    await garantirTabelas();
    const [historico, ultimaPergunta] = await Promise.all([
        obterHistorico(numero, pergunta),
        get("SELECT conteudo FROM paimon_mensagens WHERE numero = ? AND papel = 'user' ORDER BY sequencia DESC LIMIT 1", [numero])
    ]);
    const dependeDoContexto = ehContinuacao(pergunta);
    const consultaPesquisa = dependeDoContexto && ultimaPergunta ? `${ultimaPergunta.conteudo}\n${pergunta}` : pergunta;
    const contexto = await obterContexto(numero, ehAdmin, consultaPesquisa);
    const tamanho = definirTamanhoResposta(pergunta), intencao = identificarIntencao(consultaPesquisa);
    const prompt = construirPrompt({
        pergunta, historico, contexto, ehAdmin, tamanho, intencao, orientacao: orientacaoDaIntencao(intencao)
    });
    const resultado = await ollamaService.gerarResposta(prompt, {
        model: MODEL, system: INSTRUCAO_SISTEMA, temperature: 0, top_p: 0.8, num_predict: tamanho.numPredict,
        num_ctx: Math.ceil((prompt.length + INSTRUCAO_SISTEMA.length) / 3) + tamanho.numPredict + 128 <= 2048 ? 2048 : 4096,
        usarCache: false, thinking: false, signal: AbortSignal.timeout(180000)
    });
    const resposta = limitarResposta(limparRespostaPaimon(resultado.texto), tamanho.maxCaracteres);
    if (!resposta) throw new Error("Paimon recebeu uma resposta vazia do modelo.");
    await salvarMensagem(numero, "user", pergunta);
    await salvarMensagem(numero, "assistant", resposta);
    return resposta;
}

function responderPergunta(numero, pergunta, ehAdmin = false) {
    // Preserve conversational order for this player without blocking others.
    const anterior = conversasEmAndamento.get(numero) || Promise.resolve();
    const atual = anterior.catch(() => {}).then(() => gerarRespostaPergunta(numero, pergunta, ehAdmin));
    conversasEmAndamento.set(numero, atual);
    const limpar = () => { if (conversasEmAndamento.get(numero) === atual) conversasEmAndamento.delete(numero); };
    atual.then(limpar, limpar);
    return atual;
}
function deveEncerrar(texto) {
    return /^(?:sair|encerrar|fechar|tchau|ate mais|até mais|obrigad[oa],? tchau|tchau paimon)[!. ]*$/i.test(String(texto || "").trim());
}

module.exports = { consultarCatalogo, responderPergunta, obterContexto, obterGuiaComandos, expandirConsulta, recuperarConhecimentoSistemas, recuperarBasePaimon, definirTamanhoResposta, identificarIntencao, orientacaoDaIntencao, limitarResposta, limparRespostaPaimon, formatarCatalogo, garantirTabelas, definirSessao, sessaoAtiva, salvarMensagem, obterHistorico, deveEncerrar, normalizar, pontuar, MODEL, DURACAO_SESSAO_MS };
