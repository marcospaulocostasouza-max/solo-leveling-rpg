const MessageService = require("../core/messageService");

const db = require("../core/database");

function normalizar(valor) {
    return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function resolverConsultaClasse(nomeClasse) {
    const chave = normalizar(nomeClasse);
    const consultas = {
        "mago de barreira": { titulo: "Mago de Barreira", nomes: ["Mago de Barreira", "Mago Barreira"], padrao: "mago%barreira" },
        "mago barreira": { titulo: "Mago de Barreira", nomes: ["Mago de Barreira", "Mago Barreira"], padrao: "mago%barreira" },
        "mago de maldicao": { titulo: "Mago de Maldição", nomes: ["Mago de Maldição", "Mago Maldição"], padrao: "mago%maldi%" },
        "mago maldicao": { titulo: "Mago de Maldição", nomes: ["Mago de Maldição", "Mago Maldição"], padrao: "mago%maldi%" },
        "mago elemental": { titulo: "Mago Elemental", nomes: ["Mago Elemental"] },
        "mago elementar": { titulo: "Mago Elemental", nomes: ["Mago Elemental"] },
        "mago do elemento": { titulo: "Mago Elemental", nomes: ["Mago Elemental"] },
        "ranger fisico": { titulo: "Ranger Físico", nomes: ["Ranger"] },
        "ranger magico": { titulo: "Ranger Mágico", nomes: ["Ranger"] }
    };
    if (/^mago (?:de |elemental )?(agua|fogo|gelo|terra|vento|raio)$/.test(chave)) {
        return { titulo: "Mago Elemental", nomes: ["Mago Elemental"] };
    }
    return consultas[chave] || { titulo: nomeClasse, nomes: [nomeClasse] };
}

module.exports = async (msg, nomeClasse) => {
    const consulta = resolverConsultaClasse(nomeClasse);
    const placeholders = consulta.nomes.map(() => "?").join(", ");
    const sql = consulta.padrao
        ? "SELECT * FROM tecnicas WHERE LOWER(classe) LIKE ? ORDER BY nivel_desbloqueio ASC, nome ASC"
        : `SELECT * FROM tecnicas WHERE LOWER(classe) IN (${placeholders}) ORDER BY nivel_desbloqueio ASC, nome ASC`;
    const parametros = consulta.padrao ? [consulta.padrao] : consulta.nomes.map(nome => nome.toLowerCase());
    
    // Buscar técnicas da classe no banco de dados
    db.all(
        sql,
        parametros,
        async (err, tecnicas) => {
            if (err) {
                console.log("Erro ao buscar tecnicas:", err);
                return MessageService.send({ message: msg, text: "*✖ Erro interno ao buscar tecnicas.*" });
            }
            
            if (!tecnicas || tecnicas.length === 0) {
                return MessageService.send({ message: msg, text: `*✖ Nenhuma tecnica encontrada para a classe ${consulta.titulo}.*` });
            }
            
            let mensagem = `
*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*
*TÉCNICAS: ${consulta.titulo.toUpperCase()}*
*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*

`;
            
            tecnicas.forEach((tecnica, index) => {
                const tipo = tecnica.passiva ? "Passiva" : tecnica.tipo || "Ativa";
                mensagem += `*${index + 1}. ${tecnica.nome}*\n`;
                mensagem += `> *Tipo:* ${tipo}\n`;
                mensagem += `> *Custo:* ${tecnica.custo_mana || 0} MP\n`;
                mensagem += `> *Cooldown:* ${tecnica.cooldown || 0} turno(s)\n`;
                mensagem += `> *Nível:* ${tecnica.nivel_desbloqueio || 1}\n`;
                mensagem += `> *Descrição:* ${(tecnica.descricao || "Sem descrição.").substring(0, 100)}${(tecnica.descricao || "").length > 100 ? "..." : ""}\n\n`;
            });
            
            mensagem += `
────────────────────────══
_Sistema Online_
`;
            
            await MessageService.send({ message: msg, text: mensagem });
        }
    );
};

module.exports.resolverConsultaClasse = resolverConsultaClasse;
