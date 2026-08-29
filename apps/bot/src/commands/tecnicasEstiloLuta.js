const db = require("../core/database");
const MessageService = require("../core/messageService");
const { obterEstiloCanonico } = require("../utils/normalizarEstiloLuta");

const get = (sql, params = []) => new Promise((resolve, reject) =>
    db.get(sql, params, (erro, linha) => erro ? reject(erro) : resolve(linha || null))
);
const all = (sql, params = []) => new Promise((resolve, reject) =>
    db.all(sql, params, (erro, linhas) => erro ? reject(erro) : resolve(linhas || []))
);

function normalizar(valor) {
    return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function extrairConsulta(corpo) {
    return String(corpo || "").replace(/^!t[eé]cnicas?\s+(?:estilo\s+de\s+luta|profici[êe]ncia)\s*/i, "").trim();
}

// A ficha usa “Proficiência em Lanças”, enquanto a coluna `classe` das
// técnicas usa somente “Lanças”. Esta é a chave usada em todas as consultas.
function nomeEstiloTecnico(estilo) {
    return String(estilo || "").replace(/^profici[êe]ncia\s+(?:em|e|m)\s+/i, "").trim();
}

function montarResposta(estilo, tecnicas) {
    let texto = `*TÉCNICAS DE PROFICIÊNCIA: ${estilo.toUpperCase()}*\n\n`;
    if (!tecnicas.length) return `${texto}_Ainda não há técnicas registradas para esta proficiência._`;
    tecnicas.forEach((tecnica, indice) => {
        const passiva = tecnica.passiva === true || Number(tecnica.passiva) === 1 || String(tecnica.passiva).toLowerCase() === "true";
        texto += `*${indice + 1}. ${tecnica.nome}*\n`;
        texto += `> Tipo: ${passiva ? "Passiva" : tecnica.tipo || "Ativa"}\n`;
        texto += `> Nível: ${tecnica.nivel_desbloqueio || 1} | Custo: ${tecnica.custo_mana || 0} MP\n`;
        const descricao = tecnica.descricao || "Sem descrição.";
        texto += `> ${descricao}\n`;
        texto += "\n";
    });
    return `${texto}_Para comprar: !comprar técnica <nome>_`;
}

async function consultarEstilo(msg, consultaInformada = "") {
    const jogador = await get("SELECT id, estilo_luta FROM jogadores WHERE numero = ?", [msg.author || msg.from]);
    if (!jogador) return MessageService.send({ message: msg, text: "*Você precisa ter uma ficha aprovada primeiro.*" });

    const estilo = obterEstiloCanonico(consultaInformada || jogador.estilo_luta);
    if (!estilo) {
        const origem = consultaInformada ? "A proficiência informada" : "Sua proficiência registrada";
        return MessageService.send({ message: msg, text: `*${origem} não corresponde a um estilo específico.*\n\nUse *Pistolas*, *Escopetas*, *Fuzis* ou *Rifles de Precisão*. “Arma de Fogo” genérico não é mais válido.` });
    }

    const estiloTecnico = nomeEstiloTecnico(estilo);
    const tecnicas = await all(
        `SELECT nome, descricao, tipo, passiva, nivel_desbloqueio, custo_mana
         FROM tecnicas
         WHERE LOWER(categoria) IN ('proficiencia', 'proficiência') AND LOWER(classe) = ?
         ORDER BY nivel_desbloqueio ASC, nome ASC`,
        // A coluna no PostgreSQL preserva acentos ("Lanças", "Báculos").
        // LOWER faz a comparação sem distinguir maiúsculas, mas não remove
        // acentos; por isso não devemos normalizar este parâmetro para ASCII.
        [String(estiloTecnico).toLocaleLowerCase("pt-BR")]
    );
    return MessageService.send({ message: msg, text: montarResposta(estiloTecnico, tecnicas) });
}

module.exports = async msg => {
    try {
        return await consultarEstilo(msg, extrairConsulta(msg.body));
    } catch (erro) {
        console.error("[TECNICAS-ESTILO]", erro.message);
        return MessageService.send({ message: msg, text: "*Não foi possível consultar as técnicas de proficiência agora.*" });
    }
};

module.exports.extrairConsulta = extrairConsulta;
module.exports.montarResposta = montarResposta;
module.exports.nomeEstiloTecnico = nomeEstiloTecnico;
