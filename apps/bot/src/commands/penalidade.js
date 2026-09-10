const db = require("../core/database");
const MessageService = require("../core/messageService");
const { provider } = require("../../../../packages/database/config");

const listar = (sql, params = []) => new Promise((resolve, reject) => db.all(sql, params, (erro, linhas) => erro ? reject(erro) : resolve(linhas || [])));

module.exports = async (msg) => {
    try {
        const jogador = await new Promise((resolve, reject) => db.get("SELECT id, nome, nivel FROM jogadores WHERE numero = ?", [msg.author || msg.from], (erro, linha) => erro ? reject(erro) : resolve(linha)));
        if (!jogador) return MessageService.send({ message: msg, text: "[!] Não foi possível encontrar sua ficha." });
        if (Number(jogador.nivel || 0) < 10) return MessageService.send({ message: msg, text: "[!] A Penalidade exige nível 10 ou superior." });

        // SQLite aceita datetime(texto), mas PostgreSQL não possui essa função.
        const desdeSeteDias = provider === "postgres"
            ? "CURRENT_TIMESTAMP - INTERVAL '7 days'"
            : "datetime('now', '-7 days')";
        const dataAtividade = provider === "postgres" ? "NULLIF(data, '')::timestamptz" : "datetime(data)";
        const dataDungeon = provider === "postgres" ? "NULLIF(data, '')::timestamptz" : "datetime(data)";
        const atividades = await listar(`SELECT tipo FROM atividades_registro WHERE jogador_id = ? AND ${dataAtividade} >= ${desdeSeteDias}`, [jogador.id]);
        const dungeon = await listar(`SELECT id FROM participacao_dungeon WHERE jogador_id = ? AND ${dataDungeon} >= ${desdeSeteDias}`, [jogador.id]);
        const tipos = atividades.map((atividade) => String(atividade.tipo || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
        const bloqueios = [
            tipos.some((tipo) => tipo.includes("treino conjunto")),
            tipos.some((tipo) => tipo.includes("treino diario") || tipo.includes("quest diaria")),
            dungeon.length > 0 || tipos.some((tipo) => tipo.includes("dungeon"))
        ];
        if (bloqueios.some(Boolean)) {
            const motivos = ["treino conjunto", "treino diário", "dungeon"].filter((_, indice) => bloqueios[indice]).join(", ");
            return MessageService.send({ message: msg, text: `[!] A Penalidade não está disponível: você já realizou ${motivos} nos últimos 7 dias.` });
        }

        return MessageService.send({ message: msg, text: [
            "════════════════════════════════════", "*PENALIDADE — DESAFIO DO DESERTO*", "════════════════════════════════════", "",
            "› Elegibilidade confirmada: nenhuma dungeon, treino conjunto ou treino diário registrado nos últimos 7 dias.",
            "› A realização é individual e depende de cena/aprovação da mesa.",
            "› O comando não concede XP ou recompensas automaticamente.",
            "", "_Ao concluir a cena, a administração deve registrar a atividade para que ela apareça em !atividades._"
        ].join("\n") });
    } catch (erro) {
        console.error("Erro ao verificar penalidade:", erro);
        return MessageService.send({ message: msg, text: "[!] Não foi possível verificar sua elegibilidade agora." });
    }
};
