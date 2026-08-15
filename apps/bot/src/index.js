const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const MessageService = require("./core/messageService");

const { registrarTodosComandos } = require("./core/registroComandos");
const comandosRegistrados = registrarTodosComandos();

const database = require("./core/database");

database.iniciarBanco(() => {
    console.log("[OK] Banco de dados inicializado com sucesso!");

    // Inicia no boot a expiração persistente de cenas de NPC. O módulo
    // executa uma limpeza imediata e mantém a verificação a cada 10 minutos.
    require("./npc/interactionManager");
    
    const { registrarTodasTecnicas } = require("./core/registrarSistemas");
    registrarTodasTecnicas();
    
    console.log("[OK] Sistemas registrados com sucesso!");
    console.log("[INFO] Total de comandos carregados:", comandosRegistrados.length);
    console.log("[INFO] Lista de comandos:", comandosRegistrados.map(c => c.nome).join(', '));

    // =====================================
    // INICIALIZAR RUNTIME DATABASE
    // =====================================
    try {
        const { runtimeDatabase } = require("./runtime/RuntimeDatabase");
        runtimeDatabase.initialize();
        console.log("[OK] Runtime Database inicializado!");
    } catch (err) {
        console.log("[!] Erro ao iniciar Runtime Database:", err.message);
    }
    
    // =====================================
    // INICIAR SISTEMAS AUTOMÁTICOS
    // =====================================
    try {
        // Iniciar sistema de salários da Associação
        const AssociacaoSalarioSystem = require("./systems/associacaoSalarioSystem");
        AssociacaoSalarioSystem.iniciar();
        console.log("[OK] Sistema de salários da Associação iniciado!");
    } catch (err) {
        console.log("[!] Erro ao iniciar sistema de salários:", err.message);
    }
    try {
        require("./systems/dungeonAnnouncementService").iniciar();
        console.log("[OK] Avisos de Dungeon preparados!");
    } catch (err) {
        console.log("[!] Erro ao iniciar avisos de Dungeon:", err.message);
    }
});

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: "./.wwebjs_auth"
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

client.on("qr", (qr) => {
    console.log("==================================");
    console.log(" Escaneie o QR Code abaixo:");
    console.log("==================================");
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    console.log("==================================");
    console.log(" BOT SOLO LEVELING ONLINE!");
    console.log("==================================");
    console.log(" " + comandosRegistrados.length + " comandos carregados");
    console.log("==================================");

    // Registrar client no MessageService
    MessageService.registrarClient(client);
    console.log("[OK] MessageService inicializado!");
});

client.on("message", async (msg) => {
    try {
        const msgFrom = msg.from || msg.author;
        console.log(`[MSG] ${msgFrom}: ${msg.body}`);
        const comando = msg.body.toLowerCase().trim();
        console.log(`[MSG] Processando comando: "${comando}"`);
        const { executarComando } = require("./core/commandHandler");
        await executarComando(msg, comando, comandosRegistrados);
        console.log(`[MSG] Comando processado com sucesso`);
    } catch (error) {
        console.error("[MSG] ERRO NO INDEX:", error);
    }
});

const setupBoasVindas = require("./events/boasvindas");
setupBoasVindas(client);

client.on("auth_failure", (msg) => {
    console.log("[FALHA] Falha na autenticacao do WhatsApp:", msg);
});

client.on("disconnected", (reason) => {
    console.log("[!] WhatsApp desconectado:", reason);
});

client.initialize();

module.exports = { client, comandosRegistrados };
