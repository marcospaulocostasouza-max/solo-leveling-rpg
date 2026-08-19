const db = require("../core/database");
const MessageService = require("../core/messageService");

const all = (sql, params = []) => new Promise(resolve =>
    db.all(sql, params, (erro, linhas) => resolve(erro ? [] : (linhas || [])))
);

module.exports = async (msg) => {
    const estilos = await all("SELECT nome FROM estilos_luta ORDER BY nome");
    const contagens = await all(`
        SELECT classe, COUNT(*) AS total
        FROM tecnicas
        WHERE LOWER(categoria) IN ('proficiencia', 'proficiência')
        GROUP BY classe
        ORDER BY classe
    `);
    const mapa = new Map(contagens.map(x => [String(x.classe || "").toLowerCase(), Number(x.total || 0)]));

    let texto = "*════════════════════════════════════*\n*TÉCNICAS DE ESTILO DE LUTA*\n*════════════════════════════════════*\n";
    for (const estilo of estilos) {
        const nomeCurto = String(estilo.nome || "").replace(/^Proficiência em\s+/i, "");
        const total = mapa.get(nomeCurto.toLowerCase()) || 0;
        texto += `\n*${estilo.nome}*\n`;
        texto += `› ${total} técnica(s) registrada(s)\n`;
        texto += `_Use o comando da arma/estilo ou !técnicas de proficiência._\n`;
    }
    if (!estilos.length) texto += "\n› Nenhum estilo de luta registrado.";
    texto += "\n\n_Consulta individual: !técnica <nome>_\n_Compra: !comprar técnica <nome>_";
    return MessageService.send({ message: msg, text: texto });
};
