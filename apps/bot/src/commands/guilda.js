const MessageService = require("../core/messageService");
const db = require("../core/database");
const GuildaSystem = require("../systems/guildaSystem");

const buscarJogador = (numero) => new Promise((resolve, reject) => db.get("SELECT id, nome FROM jogadores WHERE numero = ?", [numero], (erro, linha) => erro ? reject(erro) : resolve(linha)));
const enviar = (msg, linhas) => MessageService.send({ message: msg, text: linhas.join("\n") });

module.exports = async (msg) => {
    try {
        const jogador = await buscarJogador(msg.author || msg.from);
        if (!jogador) return enviar(msg, ["[!] Não foi possível encontrar sua ficha."]);

        const entrada = msg.body.replace(/^!guilda/i, "").trim();
        const [acao = "info", ...restante] = entrada.split(/\s+/);
        const argumento = restante.join(" ").trim();

        if (acao.toLowerCase() === "criar") {
            if (!argumento) return enviar(msg, ["[!] Uso: !guilda criar <nome da guilda>"]);
            const resultado = await GuildaSystem.criarGuilda(argumento, jogador.id, jogador.nome);
            return enviar(msg, [resultado.erro ? `[!] ${resultado.erro}` : `[+] Guilda *${argumento}* criada. Você é o líder.`]);
        }

        if (acao.toLowerCase() === "entrar") {
            if (!argumento) return enviar(msg, ["[!] Uso: !guilda entrar <nome da guilda>"]);
            const guilda = await new Promise((resolve, reject) => db.get("SELECT id FROM guildas WHERE lower(nome) = lower(?)", [argumento], (erro, linha) => erro ? reject(erro) : resolve(linha)));
            if (!guilda) return enviar(msg, ["[!] Guilda não encontrada."]);
            const resultado = await GuildaSystem.entrarGuilda(jogador.id, guilda.id);
            return enviar(msg, [resultado.erro ? `[!] ${resultado.erro}` : `[+] Você entrou na guilda *${resultado.guilda}*.`]);
        }

        if (acao.toLowerCase() === "sair") {
            const resultado = await GuildaSystem.sairGuilda(jogador.id);
            return enviar(msg, [resultado.erro ? `[!] ${resultado.erro}` : `[+] Você saiu da guilda *${resultado.guilda}*.`]);
        }

        const guilda = await new Promise((resolve, reject) => db.get("SELECT g.id, g.nome, g.nivel, g.membros, g.passivas, gm.cargo FROM guilda_membros gm JOIN guildas g ON g.id = gm.guilda_id WHERE gm.jogador_id = ?", [jogador.id], (erro, linha) => erro ? reject(erro) : resolve(linha)));
        if (!guilda) return enviar(msg, ["════════════════════════════════════", "*GUILDAS*", "════════════════════════════════════", "", "› Você ainda não participa de uma guilda.", "› Criar: !guilda criar <nome>", "› Entrar: !guilda entrar <nome>"]);

        if (acao.toLowerCase() === "membros") {
            const membros = await new Promise((resolve, reject) => db.all("SELECT j.nome, gm.cargo FROM guilda_membros gm JOIN jogadores j ON j.id = gm.jogador_id WHERE gm.guilda_id = ? ORDER BY CASE gm.cargo WHEN 'Líder' THEN 0 ELSE 1 END, j.nome", [guilda.id], (erro, linhas) => erro ? reject(erro) : resolve(linhas || [])));
            return enviar(msg, [`*MEMBROS — ${guilda.nome}*`, "", ...membros.map((membro) => `› ${membro.nome} — ${membro.cargo}`)]);
        }

        return enviar(msg, ["════════════════════════════════════", "*GUILDA*", "════════════════════════════════════", "", `› Nome: *${guilda.nome}*`, `› Nível: *${guilda.nivel}*`, `› Membros: *${guilda.membros}*`, `› Seu cargo: *${guilda.cargo}*`, `› Passivas: ${guilda.passivas || "Nenhuma"}`, "", "› !guilda membros", "› !guilda sair", "", "_A criação de grupos de WhatsApp exige uma ação externa explícita de um administrador da comunidade._"]);
    } catch (erro) {
        console.error("Erro no comando guilda:", erro);
        return enviar(msg, ["[!] Não foi possível consultar a guilda agora."]);
    }
};
