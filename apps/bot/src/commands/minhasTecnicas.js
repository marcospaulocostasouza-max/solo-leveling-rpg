const db = require("../core/database");
const MessageService = require("../core/messageService");
const normalizar = valor => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

module.exports = async (msg) => {
    const numero = msg.author || msg.from;
    const jogador = await new Promise(resolve => db.get("SELECT id, nome, classe, classe_avancada FROM jogadores WHERE numero = ?", [numero], (erro, linha) => resolve(erro ? null : linha)));
    if (!jogador) return MessageService.send({ message: msg, text: "[!] Você precisa ter uma ficha aprovada." });
    const tecnicas = await new Promise(resolve => db.all("SELECT t.nome, t.classe, t.categoria FROM jogador_tecnicas jt JOIN tecnicas t ON t.id = jt.tecnica_id WHERE jt.jogador_id = ? ORDER BY t.classe, t.nome", [jogador.id], (erro, linhas) => resolve(erro ? [] : linhas || [])));
    const grupos = { "Classe": [], "Classe avançada": [], "Estilos de luta": [], "Outras": [] };
    for (const tecnica of tecnicas) {
        const classe = normalizar(tecnica.classe);
        if (classe === normalizar(jogador.classe)) grupos["Classe"].push(tecnica.nome);
        else if (classe === normalizar(jogador.classe_avancada)) grupos["Classe avançada"].push(tecnica.nome);
        else if (normalizar(tecnica.categoria).includes("proficiencia")) grupos["Estilos de luta"].push(tecnica.nome);
        else grupos.Outras.push(tecnica.nome);
    }
    let texto = `*════════════════════════════════════*\n*MINHAS TÉCNICAS — ${jogador.nome}*\n*════════════════════════════════════*\n`;
    for (const [titulo, lista] of Object.entries(grupos)) texto += `\n*${titulo.toUpperCase()}*\n${lista.length ? lista.map(nome => `› ${nome}`).join("\n") : "> Nenhuma técnica."}\n`;
    texto += "\n_Para consultar uma técnica: !técnica <NOME DA TÉCNICA>_";
    return MessageService.send({ message: msg, text: texto });
};
