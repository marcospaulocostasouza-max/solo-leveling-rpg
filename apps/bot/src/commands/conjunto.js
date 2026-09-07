"use strict";

const MessageService = require("../core/messageService");
const adminCore = require("../core/adminCore");
const Sets = require("../systems/equipmentSetService");

const MODELO = `*═══ FICHA DE CONJUNTO ═══*
──────────────────────────
_Preencha todos os campos mantendo o comando na primeira linha._

!Conjunto Criar
*─── Identidade do Conjunto ───*
> *NOME DO CONJUNTO:*
> *DESCRIÇÃO BREVE:*
> *RANK:* D

*─── Bônus de 2 Equipamentos ───*
> *ATRIBUTOS 2 EQUIPAMENTOS:* força=0, resistência=0, velocidade=0, sentidos=0, inteligência=0, poder mágico=0
> *DESCRIÇÃO 2 EQUIPAMENTOS:*

*─── Bônus de 4 Equipamentos ───*
> *ATRIBUTOS 4 EQUIPAMENTOS:* força=0, resistência=0, velocidade=0, sentidos=0, inteligência=0, poder mágico=0
> *DESCRIÇÃO 4 EQUIPAMENTOS:*

*─── Bônus de 6 Equipamentos ───*
> *ATRIBUTOS 6 EQUIPAMENTOS:* força=0, resistência=0, velocidade=0, sentidos=0, inteligência=0, poder mágico=0
> *DESCRIÇÃO 6 EQUIPAMENTOS:*

*─── Composição do Conjunto ───*
ITENS DO CONJUNTO:
- Nome exato do Item Raro 1
- Nome exato do Item Raro 2
- Nome exato do Item Raro 3
- Nome exato do Item Raro 4
- Nome exato do Item Raro 5
- Nome exato do Item Raro 6

──────────────────────────
_Cada estágio deve explicar seu efeito. Os seis itens precisam ter sido criados com *!Fitem* e registrados usando *PERTENCENTE: Item Raro*._
_Cada peça respeita o total máximo de atributos do Rank do conjunto: D 40 • C 80 • B 160 • A 500 • S sem limite._`;

function normalizar(valor) { return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/^\s*\[personalizado\]\s*/i, "").replace(/[^a-z0-9]+/g, " ").trim(); }
function campo(texto, nome) {
    const alvo = normalizar(nome);
    for (const linha of String(texto || "").split(/\r?\n/)) {
        const limpa = linha.replace(/^[\s>*_-]+/, "").replace(/[\s*_]+$/, "").trim(); const indice = limpa.indexOf(":");
        if (indice >= 0 && normalizar(limpa.slice(0, indice)) === alvo) return limpa.slice(indice + 1).replace(/[>*_]/g, "").trim();
    }
    return "";
}
function atributos(texto, pecas) {
    const linha = campo(texto, `ATRIBUTOS ${pecas} EQUIPAMENTOS`); const valores = {};
    for (const parte of linha.split(/[,;|]+/)) { const achado = parte.match(/^\s*([^:=]+)\s*[:=]\s*(\d+)\s*$/); if (achado) valores[normalizar(achado[1]).replace(/ /g, "_")] = Number(achado[2]); }
    return { pecas, ...valores, descricao: campo(texto, `DESCRIÇÃO ${pecas} EQUIPAMENTOS`) || campo(texto, `DESCRICAO ${pecas} EQUIPAMENTOS`) };
}
function lerFicha(texto) {
    const trechoItens = String(texto).match(/^ITENS DO CONJUNTO\s*:\s*([\s\S]*)$/im)?.[1] || "";
    const itens = trechoItens.split(/\r?\n/).map(linha => linha.replace(/^\s*>?\s*[-•]\s*/, "").replace(/[>*_]/g, "").trim()).filter(Boolean).filter(linha => !/^─+$/.test(linha) && !/^cada estágio/i.test(linha));
    return { nome: campo(texto, "NOME DO CONJUNTO"), descricao: campo(texto, "DESCRIÇÃO BREVE") || campo(texto, "DESCRICAO BREVE"), rank: campo(texto, "RANK"), estagios: [2, 4, 6].map(pecas => atributos(texto, pecas)), itens };
}
function bonusItem(item) {
    const nomes = [["forca_bonus", "Força"], ["resistencia_bonus", "Resistência"], ["velocidade_bonus", "Velocidade"], ["sentidos_bonus", "Sentidos"], ["inteligencia_bonus", "Inteligência"], ["poder_magico_bonus", "Poder Mágico"]];
    return nomes.filter(([chave]) => Number(item[chave])).map(([chave, nome]) => `${nome} +${item[chave]}`).join(" • ") || "Sem atributos próprios";
}
function bonusEstagio(estagio) {
    const nomes = [["forca", "Força"], ["resistencia", "Resistência"], ["velocidade", "Velocidade"], ["sentidos", "Sentidos"], ["inteligencia", "Inteligência"], ["poder_magico", "Poder Mágico"]];
    return nomes.filter(([chave]) => Number(estagio[chave])).map(([chave, nome]) => `${nome} +${estagio[chave]}`).join(" • ") || "Sem atributos";
}
function formatarListaConjuntos(conjuntos) {
    if (!conjuntos.length) return "_• Nenhum conjunto cadastrado._";
    const ordem = ["D", "C", "B", "A", "S"];
    const grupos = new Map();
    for (const conjunto of conjuntos) {
        const rank = String(conjunto.rank || "SEM RANK").toUpperCase();
        if (!grupos.has(rank)) grupos.set(rank, []);
        grupos.get(rank).push(conjunto);
    }
    const ranks = [...ordem.filter(rank => grupos.has(rank)), ...[...grupos.keys()].filter(rank => !ordem.includes(rank)).sort()];
    return ranks.map(rank => {
        const itens = grupos.get(rank).slice().sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"));
        return `_*RANK ${rank} — ${itens.length} CONJUNTOS*_\n${itens.map(item => `_• ${item.nome}_`).join("\n")}`;
    }).join("\n\n");
}
async function criar(msg, texto) {
    const ficha = lerFicha(texto); const erros = [];
    if (!ficha.nome) erros.push("Nome do conjunto não preenchido."); if (!ficha.descricao) erros.push("Descrição breve não preenchida.");
    if (!/^[DCBAS]$/i.test(ficha.rank)) erros.push("Rank inválido; use D, C, B, A ou S.");
    if (ficha.itens.length < 6) erros.push("Informe pelo menos 6 itens.");
    for (const estagio of ficha.estagios) if (!estagio.descricao) erros.push(`Descrição do bônus de ${estagio.pecas} equipamentos não preenchida.`);
    const raros = await Sets.listarItensRaros(); const encontrados = ficha.itens.map(nome => raros.find(item => normalizar(item.nome) === normalizar(nome)));
    ficha.itens.forEach((nome, i) => { if (!encontrados[i]) erros.push(`Item não encontrado no catálogo de Itens Raros: ${nome}.`); });
    if (erros.length) throw new Error(`A ficha possui informações incorretas:\n• ${erros.join("\n• ")}`);
    return Sets.criarConjuntoCompleto({ ...ficha, itemIds: encontrados.map(item => item.id) });
}

module.exports = async msg => {
    const texto = String(msg.body || "").trim(); const numero = msg.author || msg.from;
    try {
        if (/^!conjuntos\s*$/i.test(texto)) {
            if (!await adminCore.isAdmin(numero)) throw new Error("A lista de conjuntos é exclusiva da administração.");
            const conjuntos = await Sets.listarConjuntos();
            const lista = formatarListaConjuntos(conjuntos);
            return MessageService.send({ message: msg, text: `_*「 CONJUNTOS REGISTRADOS 」*_\n_— Catálogo administrativo do Sistema: ${conjuntos.length} conjuntos ativos, separados por Rank._\n\n${lista}` });
        }
        if (/^!conjunto\s+criar\s*$/i.test(texto)) {
            if (!await adminCore.isAdmin(numero)) throw new Error("A criação de conjuntos é exclusiva da administração.");
            return MessageService.send({ message: msg, text: MODELO });
        }
        if (/^!conjunto\s+criar\b/i.test(texto)) {
            if (!await adminCore.isAdmin(numero)) throw new Error("A criação de conjuntos é exclusiva da administração.");
            const criado = await criar(msg, texto);
            return MessageService.send({ message: msg, text: `_*「 CONJUNTO REGISTRADO 」*_\n\n_• Nome:_ *${criado.conjunto.nome}*\n_• Itens: ${criado.itens.length}_\n_• Estágios: 2, 4 e 6 equipamentos_` });
        }
        const nome = texto.replace(/^!conjunto\b/i, "").trim(); if (!nome) throw new Error("Use !Conjunto <nome do conjunto>.");
        const conjuntos = await Sets.listarConjuntos();
        const conjunto = conjuntos.find(item => normalizar(item.nome) === normalizar(nome)) || conjuntos.find(item => normalizar(item.nome).includes(normalizar(nome)));
        if (!conjunto) throw new Error(`Conjunto não encontrado: ${nome}.`);
        const detalhe = await Sets.detalharConjunto(conjunto.id);
        const itens = detalhe.itens.map(item => `_*${item.nome}*_\n_${item.descricao || "Sem descrição."}_\n_• ${bonusItem(item)}_${item.efeito ? `\n_• Efeito: ${item.efeito}_` : ""}`).join("\n\n");
        const bonus = detalhe.bonus.map(item => `_*${item.required_pieces} EQUIPAMENTOS*_\n_• ${bonusEstagio(item)}_${item.efeito_futuro ? `\n_• ${item.efeito_futuro}_` : ""}`).join("\n\n");
        return MessageService.send({ message: msg, text: `_*「 ${detalhe.conjunto.nome.toUpperCase()} 」*_\n_— Conjunto de Rank ${detalhe.conjunto.rank}_\n_${detalhe.conjunto.descricao || "Sem descrição."}_\n\n_*BÔNUS DO CONJUNTO*_\n${bonus || "_• Nenhum bônus cadastrado._"}\n\n_*ITENS DO CONJUNTO*_\n${itens || "_• Nenhum item cadastrado._"}` });
    } catch (erro) { return MessageService.send({ message: msg, text: `_*「 CONJUNTOS 」*_\n_[!] ${erro.message}_` }); }
};
module.exports.lerFicha = lerFicha;
module.exports.normalizar = normalizar;
module.exports.formatarListaConjuntos = formatarListaConjuntos;
