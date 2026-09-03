"use strict";

const { registrarTodosComandos } = require("../core/registroComandos");

function limparComando(nome) {
    return String(nome || "").split("/")[0].trim();
}

function ehAdministrativo(comando) {
    const categoria = String(comando.categoria || "").toLowerCase();
    const nome = String(comando.nome || "").toLowerCase();
    return /administrativ/.test(categoria) || /^!(?:admin|aprovar|recusar|avaliar|liberar|entregar)\b/.test(nome) || /!gachaadm\b/.test(nome);
}

function respostaCanonica(comando) {
    const nome = String(comando.nome || "").trim();
    const descricao = String(comando.descricao || comando.funcao || "").trim().replace(/[. ]+$/, "");
    const funcao = String(comando.funcao || "").trim().replace(/[. ]+$/, "");
    return `Use ${nome}. ${descricao}.${funcao && funcao.toLowerCase() !== descricao.toLowerCase() ? ` Função: ${funcao}.` : ""}`;
}

function construirBaseConhecimento() {
    const entradas = [];
    for (const comando of registrarTodosComandos().filter(item => item.ativo)) {
        const nome = limparComando(comando.nome);
        const assunto = String(comando.funcao || comando.descricao || nome).replace(/[. ]+$/, "");
        const resposta = respostaCanonica(comando);
        const perguntas = [
            `Como uso ${nome}?`,
            `Para que serve ${nome}?`,
            `O que o comando ${nome} faz?`,
            `Qual comando eu uso para ${assunto.toLowerCase()}?`,
            `Como faço para ${assunto.toLowerCase()}?`
        ];
        perguntas.forEach((pergunta, variante) => entradas.push({
            id: `${nome.replace(/[^a-z0-9]+/gi, "-")}-${variante + 1}`,
            pergunta, resposta, comando: comando.nome, categoria: comando.categoria || "Sistema",
            administrativo: ehAdministrativo(comando),
            termos: `${comando.nome} ${comando.funcao} ${comando.descricao} ${comando.categoria}`
        }));
    }
    return entradas;
}

const BASE_CONHECIMENTO = Object.freeze(construirBaseConhecimento());

module.exports = { BASE_CONHECIMENTO, construirBaseConhecimento, respostaCanonica, ehAdministrativo };
