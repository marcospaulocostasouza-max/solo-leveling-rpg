"use strict";

const MessageService = require("../core/messageService");
const adminCore = require("../core/adminCore");
const database = require("../../../../packages/database");
const { provider } = require("../../../../packages/database/config");

const FICHA_TITULO = `*═══ FICHA DE TÍTULO ═══*
──────────────────────────
_Preencha todos os campos e envie a ficha mantendo o comando na primeira linha._

*─── Identidade ───*
!Título Criar
> *NOME:*
> *CATEGORIA:*
> *RANK:* E

*─── Registro ───*
> *DESCRIÇÃO:*
> *EFEITOS:*
> *COMO OBTER:*

──────────────────────────
_O Título será exclusivo dos Banners e criado como conteúdo raro da administração._`;

const FICHA_PASSIVA = `*═══ FICHA DE PASSIVA ═══*
──────────────────────────
_Preencha todos os campos e envie a ficha mantendo o comando na primeira linha._

*─── Identidade ───*
!Passiva Criar
> *NOME:*
> *CATEGORIA:*
> *RANK:* E

*─── Funcionamento ───*
> *DESCRIÇÃO:*
> *EFEITO:*
> *CONDIÇÃO DE ATIVAÇÃO:*

──────────────────────────
_A Passiva será exclusiva dos Banners e criada como conteúdo raro da administração._`;

function normalizar(valor) { return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function campo(texto, nome) {
    const alvo = normalizar(nome);
    for (const linha of String(texto || "").split(/\r?\n/)) {
        const limpa = linha.replace(/^[\s>*_-]+/, "").replace(/[\s*_]+$/, "").trim(); const indice = limpa.indexOf(":");
        if (indice >= 0 && normalizar(limpa.slice(0, indice)) === alvo) return limpa.slice(indice + 1).replace(/[>*_]/g, "").trim();
    }
    return "";
}
function lerFicha(texto, tipo) {
    return tipo === "TITULO" ? { nome: campo(texto, "NOME"), categoria: campo(texto, "CATEGORIA"), rank: campo(texto, "RANK"), descricao: campo(texto, "DESCRIÇÃO") || campo(texto, "DESCRICAO"), efeito: campo(texto, "EFEITOS"), condicao: campo(texto, "COMO OBTER") }
        : { nome: campo(texto, "NOME"), categoria: campo(texto, "CATEGORIA"), rank: campo(texto, "RANK"), descricao: campo(texto, "DESCRIÇÃO") || campo(texto, "DESCRICAO"), efeito: campo(texto, "EFEITO"), condicao: campo(texto, "CONDIÇÃO DE ATIVAÇÃO") || campo(texto, "CONDICAO DE ATIVACAO") };
}
async function criar(numero, tipo, ficha) {
    await database.ensureEquipmentSetSchema(); const rotulo = tipo === "TITULO" ? "Título" : "Passiva";
    const erros = []; for (const [nome, valor] of Object.entries(ficha)) if (!String(valor || "").trim()) erros.push(`${nome} não foi preenchido.`);
    ficha.rank = String(ficha.rank || "").toUpperCase(); if (!/^[EDCBAS]$/.test(ficha.rank)) erros.push("Rank deve ser E, D, C, B, A ou S.");
    const existentes = await database.all("SELECT i.nome FROM banner_rare_items bri JOIN itens i ON i.id=bri.item_id WHERE bri.tipo=?", [tipo]);
    if (existentes.some(item => normalizar(item.nome) === normalizar(ficha.nome))) erros.push(`Já existe ${rotulo.toLowerCase()} raro com esse nome.`);
    if (erros.length) throw new Error(`A ficha possui informações incorretas:\n• ${erros.join("\n• ")}`);
    return database.transaction(async query => {
        const nome = `[Personalizado] ${ficha.nome}`;
        const sql = `INSERT INTO itens (nome,categoria,slot,tier,descricao,efeito,item_unico) VALUES (?,?,?, ?,?,?,1)`;
        const inserido = await query.run(provider === "postgres" ? `${sql} RETURNING id` : sql, [nome, rotulo, "Item de Apoio", ficha.rank, ficha.descricao, `${ficha.efeito}\nCondição: ${ficha.condicao}`]);
        await query.run("INSERT INTO banner_rare_items (item_id,tipo,criado_por) VALUES (?,?,?)", [inserido.lastID, tipo, numero]);
        return { id: Number(inserido.lastID), nome, ...ficha };
    });
}

module.exports = async msg => {
    const texto = String(msg.body || "").trim(); const numero = msg.author || msg.from;
    try {
        if (!await adminCore.isAdmin(numero)) throw new Error("Este comando é exclusivo da administração.");
        if (/^!f(?:t[ií]tulo|titulo)$/i.test(texto)) return MessageService.send({ message: msg, text: FICHA_TITULO });
        if (/^!fpassiva$/i.test(texto)) return MessageService.send({ message: msg, text: FICHA_PASSIVA });
        const tipo = /^!t[ií]tulo\s+criar\b/i.test(texto) ? "TITULO" : /^!passiva\s+criar\b/i.test(texto) ? "PASSIVA" : null;
        if (!tipo) throw new Error("Use !Ftitulo ou !Fpassiva para receber a ficha correta.");
        const criado = await criar(numero, tipo, lerFicha(texto, tipo)); const rotulo = tipo === "TITULO" ? "TÍTULO" : "PASSIVA";
        return MessageService.send({ message: msg, text: `*═══ ${rotulo} REGISTRADO ═══*\n──────────────────────────\n\n> *Nome:* ${criado.nome.replace(/^\[Personalizado\]\s*/, "")}\n> *Categoria:* ${criado.categoria}\n> *Rank:* ${criado.rank}\n> *Descrição:* ${criado.descricao}\n> *Efeito:* ${criado.efeito}\n> *Condição:* ${criado.condicao}\n\n──────────────────────────\n_Conteúdo raro disponível para criação de Banners._` });
    } catch (erro) { return MessageService.send({ message: msg, text: `*═══ CRIAÇÃO DE CONTEÚDO RARO ═══*\n> *Erro:* ${erro.message}` }); }
};
module.exports.lerFicha = lerFicha;
module.exports.criar = criar;
