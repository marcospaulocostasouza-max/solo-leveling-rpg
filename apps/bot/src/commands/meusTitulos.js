const db = require("../core/database");
const MessageService = require("../core/messageService");
const catalogoTitulos = require("../database/data/titulos.json");

function normalizar(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

module.exports = async (msg) => {
    const numero = msg.author || msg.from;
    const jogador = await new Promise((resolve) => {
        db.get("SELECT nome, titulo FROM jogadores WHERE numero = ?", [numero], (erro, linha) => {
            resolve(erro ? null : linha);
        });
    });

    if (!jogador) {
        return MessageService.send({ message: msg, text: "*[!] Voce precisa ter uma ficha aprovada para consultar seus titulos.*" });
    }

    const nomeTitulo = String(jogador.titulo || "").trim();
    if (!nomeTitulo || normalizar(nomeTitulo) === "nenhum") {
        return MessageService.send({ message: msg, text: `*════════════════════════════════════*
*MEUS TITULOS — ${jogador.nome}*
*════════════════════════════════════*

> Nenhum titulo conquistado ate o momento.

Titulos sao concedidos por feitos, eventos, dungeons e marcos narrativos aprovados pela administracao.` });
    }

    const titulo = catalogoTitulos.find((item) => normalizar(item.nome) === normalizar(nomeTitulo));
    let texto = `*════════════════════════════════════*
*MEUS TITULOS — ${jogador.nome}*
*════════════════════════════════════*

*${titulo?.nome || nomeTitulo}*`;

    if (titulo) {
        texto += `\n> Categoria: ${titulo.categoria || "Nao informada"}`;
        texto += `\n> Raridade: ${titulo.raridade || "Nao informada"}`;
        texto += `\n> Descricao: ${titulo.descricao || "Sem descricao registrada."}`;
        texto += `\n> Como foi conquistado: ${titulo.como_obter || "Concedido pela administracao."}`;
        if (Array.isArray(titulo.efeitos) && titulo.efeitos.length) {
            texto += `\n\n*EFEITOS*`;
            for (const efeito of titulo.efeitos) texto += `\n> ${efeito}`;
        }
    } else {
        texto += `\n> Titulo especial concedido pela administracao.`;
    }

    texto += `\n\n*COMO EQUIPAR*`;
    texto += `\nEnvie: *!equipar titulo ${titulo?.nome || nomeTitulo}*`;
    texto += `\n_O titulo equipado aparecera na sua ficha de jogador._`;
    return MessageService.send({ message: msg, text: texto });
};
