"use strict";
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const file = name => path.join(root, "apps/bot/src", name);
const catalogPath = file("database/itens.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const additions = [
    ["Kanabo", "Kanabo", "Clava de madeira com pequenos rebites, própria para golpes de impacto."],
    ["Chicote", "Chicotes", "Tira de couro trançado com cabo firme para treinar alcance e controle."],
    ["Bumerangue", "Bumerangues", "Peça curva de madeira para arremessos de treino."],
    ["Garras", "Garras", "Garras curtas de metal presas a suportes para as mãos."],
    ["Sabre", "Sabres", "Lâmina curva de aço comum com guarda simples."],
    ["Foices Duplas", "Foices Duplas", "Par de foices curtas de aço comum, sem efeitos especiais."],
    ["Clava", "Clavas", "Clava de madeira maciça, equilibrada para o combate próximo."],
    ["Florete", "Floretes", "Lâmina fina com guarda leve para estocadas controladas."],
    ["Mangual", "Manguais", "Cabo de madeira ligado por corrente curta a uma cabeça de metal."],
    ["Alabarda", "Alabardas", "Haste longa com ponta e lâmina lateral de aço comum."],
    ["Tonfas", "Tonfas", "Par de bastões com empunhadura lateral para bloquear e golpear."],
    ["Kamas", "Kamas", "Par de pequenas lâminas curvas com cabos de madeira."],
    ["Rapieira", "Rapieiras", "Espada estreita com guarda fechada para duelos e estocadas."],
    ["Báculo", "Báculos", "Haste de madeira com foco comum para conduzir magia, sem bônus próprio."],
    ["Cimitarra", "Cimitarras", "Espada de lâmina larga e curva, feita de aço comum."],
    ["Picareta de Guerra", "Picaretas de Guerra", "Arma de combate com cabeça pontiaguda; não substitui a ferramenta de mineração."],
    ["Bastão", "Bastões", "Haste lisa de madeira resistente para golpes e bloqueios."],
    ["Funda", "Funda", "Bolsa de couro presa a duas tiras para lançar pedras."],
    ["Lâminas Duplas", "Lâminas Duplas", "Par de lâminas curtas equilibradas para ataques alternados."],
    ["Leque de Guerra", "Leques de Guerra", "Leque reforçado com varetas de metal, sem magia própria."],
    ["Instrumento Musical", "Instrumentos Musicais", "Instrumento de cordas portátil para conduzir técnicas musicais aprendidas."],
    ["Escopeta", "Escopetas", "Arma de cano curto de fabricação comum, sem munição especial."],
    ["Rifle de Precisão", "Rifles de Precisão", "Rifle comum com mira básica, sem propriedades especiais."],
    ["Faca", "Facas", "Faca de combate de aço comum com cabo antiderrapante."],
    ["Espada Pesada", "Espadas Pesadas", "Espada larga de duas mãos, sem encantamentos."],
    ["Espadas Pesadas Duplas", "Espadas Pesadas Duplas", "Par de espadas pesadas de aço comum para a proficiência correspondente."],
    ["Faixas de Combate", "Combate Desarmado", "Faixas de tecido para proteger as mãos; preservam o combate desarmado, sem bônus."]
];
let added = 0;
for (const [base, style, description] of additions) {
    const name = `${base} Simples`;
    if (!catalog.armas.some(item => item.nome === name)) {
        catalog.armas.push({ nome: name, descricao: description, proficiencia: `Proficiência em ${style}`, categoria: "Arma 1", tier: "Inicial" });
        added++;
    }
}
for (const weapon of catalog.armas) {
    if (/^(Espada Pesada|Espadas Pesadas Duplas|Alabarda|Rifle de Precisão|Escopeta) Simples$/.test(weapon.nome)) weapon.categoria = 'Arma 2';
}
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 4) + "\n");
const initialPath = file("database/initial_items.json");
const initial = JSON.parse(fs.readFileSync(initialPath, "utf8"));
initial.armas_iniciais = catalog.armas.map(item => item.nome);
fs.writeFileSync(initialPath, JSON.stringify(initial, null, 2) + "\n");

// Não reescreve capítulos nem premiações já concluídas. O rank inicial é
// independente do rank de combate do NPC; Cyrus é explicitamente Rank D.
const entryRanks = { C: "E", B: "D", A: "D", S: "C", E: "E", D: "D" };
const rewards = { E: { xp: 100, won: 500 }, D: { xp: 1000, won: 1000 }, C: { xp: 2500, won: 2000 } };
let changed = 0;
const dir = file("missions/data");
for (const name of fs.readdirSync(dir).filter(name => name.endsWith(".json"))) {
    const target = path.join(dir, name);
    const data = JSON.parse(fs.readFileSync(target, "utf8"));
    const mission = data.missoes.find(m => m.numero === 5);
    for (const arc of data.missoes.filter(m => m.categoria === 'principal' && m.tipo === 'historia')) {
        arc.nivelMinimo = { E: 1, D: 15, C: 30, B: 60, A: 80, S: 100 }[arc.rank] || arc.nivelMinimo;
        if (arc.descricao.endsWith('...')) arc.descricao = `${data.npcNome}, conhecido como ${data.npcTitulo}, apresenta os acontecimentos que deram origem ao seu conflito atual. Converse com o NPC, investigue as informações que ele compartilhar e participe da incursão introdutória prevista no objetivo. A dificuldade é Rank ${arc.rank}; registre as descobertas e preserve os fatos narrados antes de avançar ao próximo capítulo.`;
    }
    if (!mission || mission.revisaoBalanceamento === 1) {
        fs.writeFileSync(target, JSON.stringify(data, null, 2) + "\n");
        continue;
    }
    const rank = data.npcId === "cyrus_albright" ? "D" : entryRanks[mission.rank] || "D";
    mission.rank = rank;
    mission.nivelMinimo = { E: 1, D: 15, C: 30 }[rank];
    mission.descricao = `${data.npcNome} propõe uma tarefa de aproximação: escolher e comprar uma peça de armadura ou arma de Rank ${rank} na Loja de Itens da Associação. Compare o preço e a utilidade do equipamento, guarde o comprovante da compra e explique ao NPC sua escolha. A atividade acontece na cidade, sem incursão em Dungeon, combate contra chefes ou exigência de itens de rank superior.`;
    mission.objetivo = `Comprar 1 equipamento de Rank ${rank} (arma ou peça de armadura) e apresentar a compra e sua utilidade a ${data.npcNome}.`;
    mission.recompensas = { ...rewards[rank] };
    mission.revisaoBalanceamento = 1;
    fs.writeFileSync(target, JSON.stringify(data, null, 2) + "\n");
    changed++;
}
console.log(JSON.stringify({ addedWeapons: added, weapons: catalog.armas.length, entryMissionsRebalanced: changed }));
