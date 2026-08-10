const db = require("../core/database");
const MessageService = require("../core/messageService");
module.exports = async (msg) => {
    const estilos = await new Promise(resolve => db.all("SELECT nome, tecnica_nome FROM estilos_luta ORDER BY nome", [], (erro, linhas) => resolve(erro ? [] : linhas || [])));
    let texto = "*════════════════════════════════════*\n*TÉCNICAS DE ESTILO DE LUTA*\n*════════════════════════════════════*\n";
    for (const estilo of estilos) texto += `\n*${estilo.nome}*\n› ${estilo.tecnica_nome || "Técnica ainda não registrada."}\n_Para consultar a técnica use !técnica <NOME DA TÉCNICA>_\n`;
    if (!estilos.length) texto += "\n› Nenhum estilo de luta registrado.";
    return MessageService.send({ message: msg, text: texto });
};
