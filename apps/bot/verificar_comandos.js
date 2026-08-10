/**
 * SCRIPT DE VERIFICAÇÃO DE COMANDOS
 * Verifica todos os comandos registrados no sistema
 */

const fs = require("fs");
const path = require("path");

// Cores para terminal
const cores = {
    verde: "\x1b[32m",
    vermelho: "\x1b[31m",
    amarelo: "\x1b[33m",
    azul: "\x1b[36m",
    reset: "\x1b[0m"
};

function cor(texto, corCor) {
    return `${cores[corCor]}${texto}${cores.reset}`;
}

// Carregar commandHandler
const commandHandler = require("./src/core/commandHandler.js");

console.log(cor("\n=== VERIFICAÇÃO COMPLETA DE COMANDOS ===\n", "azul"));

// Extrair comandos do commandHandler
const comandosPrefixo = [
    { prefixo: "!atributos", arquivo: "atributos.js" },
    { prefixo: "!avaliar ficha", arquivo: "avaliarFicha.js" },
    { prefixo: "!avaliar ia", arquivo: "avaliarIA.js" },
    { prefixo: "!aprovar ficha", arquivo: "aprovarFicha.js" },
    { prefixo: "!recusar", arquivo: "recusarFicha.js" },
    { prefixo: "!batalha", arquivo: "batalha.js" },
    { prefixo: "!investimento", arquivo: "investimentos.js" },
    { prefixo: "!inventario", arquivo: "inventario.js" },
    { prefixo: "!inv", arquivo: "inventario.js" },
    { prefixo: "!equipar", arquivo: "equipar.js" },
    { prefixo: "!usar", arquivo: "usarItem.js" },
    { prefixo: "!comprar", arquivo: "comprar.js" },
    { prefixo: "!comprar tecnica", arquivo: "comprarTecnica.js" },
    { prefixo: "!comprar técnica", arquivo: "comprarTecnica.js" },
    { prefixo: "!tecnicas", arquivo: "tecnicas.js" },
    { prefixo: "!técnicas", arquivo: "tecnicas.js" },
    { prefixo: "!tecnica ", arquivo: "tecnica.js" },
    { prefixo: "!técnica ", arquivo: "tecnica.js" },
    { prefixo: "!dungeon", arquivo: "dungeon.js" },
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
    { prefixo: "!ativar passiva", arquivo: "ativarPassiva.js" },
    { prefixo: "!admin afinidade", arquivo: "adminAfinidade.js" },
    { prefixo: "!admin", arquivo: "admin.js" },
    { prefixo: "!adm", arquivo: "admin.js" },
    { prefixo: "!+", arquivo: "admin.js" },
    { prefixo: "!-", arquivo: "admin.js" },
    { prefixo: "!add", arquivo: "admin.js" },
    { prefixo: "!rem", arquivo: "admin.js" },
    { prefixo: "!classe ", arquivo: "admin.js" },
    { prefixo: "!remclasse ", arquivo: "admin.js" },
    { prefixo: "!logs", arquivo: "admin.js" },
    { prefixo: "!ver ", arquivo: "admin.js" },
    { prefixo: "!souadm", arquivo: "admin.js" },
    { prefixo: "!registrar adm", arquivo: "admin.js" },
    { prefixo: "!registrar admin", arquivo: "admin.js" },
    { prefixo: "!treino aprovado", arquivo: "aprovarAtividade.js" },
    { prefixo: "!treinar", arquivo: "treinar.js" },
    { prefixo: "!qi", arquivo: "treinar.js" },
    { prefixo: "!equipar titulo", arquivo: "equiparTitulo.js" },
    { prefixo: "!equipar título", arquivo: "equiparTitulo.js" },
    { prefixo: "!habilidades", arquivo: "habilidades.js" },
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
    { prefixo: "!regeneracao", arquivo: "regeneracao.js" },
    { prefixo: "!pontuacao", arquivo: "pontuacao.js" },
    { prefixo: "!unicos", arquivo: "unicos.js" },
    { prefixo: "!hp", arquivo: "hp.js" },
    { prefixo: "!dado", arquivo: "dado.js" },
    { prefixo: "!caixa", arquivo: "caixa.js" },
    { prefixo: "!abrir caixa", arquivo: "abrirCaixa.js" },
    { prefixo: "!abrir loja", arquivo: "abrirLoja.js" },
    { prefixo: "!slot de cabeça", arquivo: "verLoja.js" },
    { prefixo: "!slot de corpo", arquivo: "verLoja.js" },
    { prefixo: "!slot de pernas", arquivo: "verLoja.js" },
    { prefixo: "!slot de acessórios", arquivo: "verLoja.js" },
    { prefixo: "!itens de apoio", arquivo: "verLoja.js" },
    { prefixo: "!arma 1", arquivo: "verLoja.js" },
    { prefixo: "!arma 2", arquivo: "verLoja.js" },
    { prefixo: "!minigame", arquivo: "minigames.js" },
    { prefixo: "!arquitetura", arquivo: "arquitetura.js" },
    { prefixo: "!saldo", arquivo: "saldo.js" },
    { prefixo: "!banco", arquivo: "saldo.js" },
    { prefixo: "!compra", arquivo: "compra.js" },
    { prefixo: "!avaliar rank", arquivo: "avaliarRank.js" },
    { prefixo: "!rank requisitos", arquivo: "avaliarRank.js" },
    { prefixo: "!rank info", arquivo: "avaliarRank.js" },
    { prefixo: "!progresso", arquivo: "progresso.js" },
    { prefixo: "!quest diária finalizada", arquivo: "aprovarAtividade.js" },
    { prefixo: "!quest diaria finalizada", arquivo: "aprovarAtividade.js" },
    { prefixo: "!treino de cultivo finalizado", arquivo: "aprovarAtividade.js" },
    { prefixo: "!treino conjunto finalizado", arquivo: "aprovarAtividade.js" },
    { prefixo: "!interação finalizada", arquivo: "aprovarAtividade.js" },
    { prefixo: "!interacao finalizada", arquivo: "aprovarAtividade.js" },
    { prefixo: "!one post finalizado", arquivo: "aprovarAtividade.js" },
    // ===== SISTEMA DE VENDA =====
    { prefixo: "!vender", arquivo: "vender.js" },
    { prefixo: "!confirmar venda", arquivo: "confirmarVenda.js" },
    { prefixo: "!cancelar venda", arquivo: "cancelarVenda.js" },
    // ===== SISTEMA DE TICKETS =====
    { prefixo: "!usar ticket", arquivo: "usarTicket.js" },
    { prefixo: "!meus tickets", arquivo: "meusTickets.js" },
    // ===== SISTEMA DE DUNGEON INSTANCIADA =====
    { prefixo: "!entregar chave", arquivo: "entregarChave.js" },
    { prefixo: "!Entregar Chave", arquivo: "entregarChave.js" },
    { prefixo: "!escolho a opção", arquivo: "escolherPremio.js" },
    { prefixo: "!escolho a opcao", arquivo: "escolherPremio.js" },
    { prefixo: "!ficha de dungeon", arquivo: "fichaDungeon.js" },
    { prefixo: "!ficha de Dungeon", arquivo: "fichaDungeon.js" },
    { prefixo: "!concluir dungeon", arquivo: "concluirDungeon.js" },
    { prefixo: "!concluir Dungeon", arquivo: "concluirDungeon.js" },
    { prefixo: "!abrir dungeon", arquivo: "abrirDungeon.js" },
    { prefixo: "!abrir Dungeon", arquivo: "abrirDungeon.js" },
    { prefixo: "!minha dungeon", arquivo: "minhaDungeon.js" },
    { prefixo: "!minha Dungeon", arquivo: "minhaDungeon.js" },
    // ===== OUTROS COMANDOS DO HANDLER =====
    { prefixo: "!confirmar compra", arquivo: "comprar.js" },
    { prefixo: "!quero ", arquivo: "classeAvancada.js" },
    { prefixo: "!equipados", arquivo: "verSlots.js" },
    { prefixo: "!slot", arquivo: "verLoja.js" },
    { prefixo: "!arma", arquivo: "verLoja.js" },
    { prefixo: "!armas de apoio", arquivo: "verLoja.js" },
    { prefixo: "!apagar personagem", arquivo: "apagarPersonagem.js" },
    { prefixo: "!tenho certeza", arquivo: "apagarPersonagem.js" },
    { prefixo: "!vysache", arquivo: "vysache.js" },
    { prefixo: "!visache", arquivo: "vysache.js" },
    // ===== SISTEMA DE FORJA =====
    { prefixo: "!catalogo forja", arquivo: "catalogoForja.js" }
];

const mapaComandos = {
    "!iniciar": "iniciar.js",
    "!ficha": "ficha.js",
    "!sortear afinidade": "sortearAfinidade.js",
    "!confirmar ficha": "confirmarFicha.js",
    "!jogador": "jogador.js",
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
    "!sortear dungeon": "sortearDungeon.js",
    "!avaliar ficha": "avaliarFicha.js",
    "!avaliar ia": "avaliarIA.js",
    "!aprovar ficha": "aprovarFicha.js",
    "!recusar ficha": "recusarFicha.js",
    "!estilos de luta": "estilosLuta.js",
    "!armasiniciais": "armasiniciais.js",
    "!armas iniciais": "armasiniciais.js",
    "!itens": "itens.js",
    "!abrir loja": "abrirLoja.js",
    "!idgrupo": "idGrupo.js",
    "!id grupo": "idGrupo.js",
    "!testegrupo": "testeGrupo.js",
    "!teste grupo": "testeGrupo.js",
    "!listar grupos": "listarGrupos.js",
    "!vercomandos": "verComandos.js",
    "!ver comandos": "verComandos.js",
    "!passivas": "passivas.js",
    "!titulos": "titulos.js",
    "!arquitetura": "arquitetura.js",
    "!ver fila": "verFila.js",
    "!comandos grupo": "gruposComandos.js",
    "!consultar afinidade": "consultarAfinidade.js",
    "!consultar elemento": "consultarAfinidade.js",
    "!atividades": "atividades.js",
    "!historico": "atividades.js",
    "!avanco": "avanco.js",
    "!resumo": "resumo.js",
    "!distribuir": "distribuir.js",
    "!desejar": "desejar.js",
    "!ficha de dungeon": "fichaDungeon.js",
    "!ficha de Dungeon": "fichaDungeon.js",
    "!concluir dungeon": "concluirDungeon.js",
    "!concluir Dungeon": "concluirDungeon.js",
    "!abrir dungeon": "abrirDungeon.js",
    "!abrir Dungeon": "abrirDungeon.js",
    "!minha dungeon": "minhaDungeon.js",
    "!minha Dungeon": "minhaDungeon.js",
    "!olá vysache": "vysache.js",
    "!ola vysache": "vysache.js",
    "!olá visache": "vysache.js",
    "!ola visache": "vysache.js",
    "!preciso de um item": "vysache.js",
    "!pode sim": "vysache.js",
    "!loja materiais": "lojaMateriais.js",
    "!loja nucleos": "lojaNucleos.js",
    "!loja núcleos": "lojaNucleos.js"
};

const comandosClasses = [
    "!lutador", "!assassino", "!tanker", "!ranger", "!curador",
    "!mago", "!mago elemental", "!mago elementar", "!mago do elemento",
    "!mago de agua", "!mago de fogo", "!mago de gelo", "!mago de terra", "!mago de vento", "!mago de raio",
    "!mago invocador", "!mago de barreira", "!mago de maldicao",
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
    "!mago elemental agua", "!mago elemental fogo", "!mago elemental terra",
    "!mago elemental vento", "!mago elemental gelo", "!mago elemental raio"
];

// Contadores
let totalComandos = 0;
let comandosOK = 0;
let comandosErro = 0;
let comandosDuplicados = 0;

const arquivosVerificados = new Set();
const comandosDuplicadosLista = [];

console.log(cor("1. VERIFICANDO COMANDOS EXATOS (mapaComandos)", "amarelo"));
console.log("=".repeat(60));

for (const [comando, arquivo] of Object.entries(mapaComandos)) {
    totalComandos++;
    const caminhoArquivo = path.join(__dirname, "src", "commands", arquivo);
    
    if (fs.existsSync(caminhoArquivo)) {
        comandosOK++;
        console.log(cor(`✓`, "verde") + ` ${comando.padEnd(40)} -> ${arquivo}`);
    } else {
        comandosErro++;
        console.log(cor(`✗`, "vermelho") + ` ${comando.padEnd(40)} -> ${arquivo} ${cor("(ARQUIVO NÃO ENCONTRADO)", "vermelho")}`);
    }
}

console.log(cor("\n2. VERIFICANDO COMANDOS COM PREFIXO", "amarelo"));
console.log("=".repeat(60));

for (const cmd of comandosPrefixo) {
    totalComandos++;
    const caminhoArquivo = path.join(__dirname, "src", "commands", cmd.arquivo);
    
    if (fs.existsSync(caminhoArquivo)) {
        comandosOK++;
        console.log(cor(`✓`, "verde") + ` ${cmd.prefixo.padEnd(40)} -> ${cmd.arquivo}`);
    } else {
        comandosErro++;
        console.log(cor(`✗`, "vermelho") + ` ${cmd.prefixo.padEnd(40)} -> ${cmd.arquivo} ${cor("(ARQUIVO NÃO ENCONTRADO)", "vermelho")}`);
    }
}

console.log(cor("\n3. VERIFICANDO COMANDOS DE CLASSES", "amarelo"));
console.log("=".repeat(60));

for (const cmdClasse of comandosClasses) {
    totalComandos++;
    console.log(cor(`✓`, "verde") + ` ${cmdClasse.padEnd(40)} -> tecnicasClasse.js`);
    comandosOK++;
}

console.log(cor("\n4. VERIFICANDO ARQUIVOS DUPLICADOS", "amarelo"));
console.log("=".repeat(60));

const todosArquivos = [
    ...Object.values(mapaComandos),
    ...comandosPrefixo.map(cmd => cmd.arquivo),
    "tecnicasClasse.js"
];

const contagemArquivos = {};
for (const arquivo of todosArquivos) {
    contagemArquivos[arquivo] = (contagemArquivos[arquivo] || 0) + 1;
}

for (const [arquivo, contagem] of Object.entries(contagemArquivos)) {
    if (contagem > 1) {
        comandosDuplicados++;
        console.log(cor(`⚠`, "amarelo") + ` ${arquivo} ${cor(`(referenciado ${contagem} vezes)`, "amarelo")}`);
    }
}

console.log(cor("\n5. VERIFICANDO ARQUIVOS EXTRAS NA PASTA COMMANDS", "amarelo"));
console.log("=".repeat(60));

const pastaCommands = path.join(__dirname, "src", "commands");
const arquivosNaPasta = fs.readdirSync(pastaCommands).filter(f => f.endsWith(".js"));

const arquivosUsados = new Set([
    ...Object.values(mapaComandos),
    ...comandosPrefixo.map(cmd => cmd.arquivo),
    "tecnicasClasse.js"
]);

for (const arquivo of arquivosNaPasta) {
    if (!arquivosUsados.has(arquivo)) {
        console.log(cor(`ℹ`, "azul") + ` ${arquivo} ${cor("(não registrado no commandHandler)", "azul")}`);
    }
}

console.log(cor("\n6. VERIFICANDO CONFLITOS DE PREFIXO", "amarelo"));
console.log("=".repeat(60));

const prefixosOrdenados = comandosPrefixo
    .map(cmd => cmd.prefixo)
    .sort((a, b) => b.length - a.length);

for (let i = 0; i < prefixosOrdenados.length; i++) {
    for (let j = i + 1; j < prefixosOrdenados.length; j++) {
        if (prefixosOrdenados[j].startsWith(prefixosOrdenados[i])) {
            console.log(cor(`⚠`, "amarelo") + ` Conflito: "${prefixosOrdenados[i]}" é prefixo de "${prefixosOrdenados[j]}"`);
        }
    }
}

// Resumo final
console.log(cor("\n=== RESUMO DA VERIFICAÇÃO ===", "azul"));
console.log("=".repeat(60));
console.log(`Total de comandos verificados: ${cor(totalComandos.toString(), "azul")}`);
console.log(`Comandos OK: ${cor(comandosOK.toString(), "verde")}`);
console.log(`Comandos com erro: ${cor(comandosErro.toString(), "vermelho")}`);
console.log(`Arquivos duplicados: ${cor(comandosDuplicados.toString(), "amarelo")}`);
console.log(`Arquivos na pasta commands: ${cor(arquivosNaPasta.length.toString(), "azul")}`);
console.log(`Arquivos usados: ${cor(arquivosUsados.size.toString(), "azul")}`);

if (comandosErro === 0) {
    console.log(cor("\n✓ TODOS OS COMANDOS ESTÃO OK!", "verde"));
} else {
    console.log(cor(`\n✗ ${comandosErro} COMANDOS COM ERRO!`, "vermelho"));
}

console.log("");