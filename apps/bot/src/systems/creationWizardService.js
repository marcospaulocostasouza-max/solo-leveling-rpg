"use strict";

const database = require("../../../../packages/database");
const MessageService = require("../core/messageService");
const weekly = require("./weeklyDungeonSystem");

const BANNER = [
  ["nome", "Qual é o *nome do Banner*?"], ["descricao", "Envie uma *descrição breve* do Banner."],
  ["conjuntos", "Quais *conjuntos* entram no Banner? Separe os nomes por vírgula."],
  ["titulo", "Qual *Título raro* será entregue? Responda *Não tem* se não houver."],
  ["passivas", "Quais *Passivas raras* serão entregues? Separe por vírgula. Responda *Não tem* se não houver."],
  ["itemSecreto", "Qual é o *Item Raro principal* do Banner?"]
];
const DUNGEON = [
  ["nome", "Qual é o *nome da Dungeon semanal*?"], ["tema", "Descreva o *tema e ambientação*."], ["rank", "Qual é o *Rank*? Use E, D, C, B, A ou S."], ["descricao", "Envie a *descrição detalhada* da Dungeon."],
  ["objetivo", "Qual é o *objetivo de conclusão*?"], ["boss", "Qual é o *Boss*? Escreva Nenhum se não houver."], ["participantes", "Qual é o *limite de participantes*?"], ["xp", "Qual é a recompensa de *XP*?"],
  ["won", "Qual é a recompensa em *Won*?"], ["itens", "Quais são os *itens de recompensa*? Escreva Nenhum se não houver."], ["regras", "Quais são as *regras específicas*? Escreva Regras gerais se não houver."]
];

let ready;
async function ensure() { if (!ready) ready = database.run("CREATE TABLE IF NOT EXISTS admin_creation_sessions (administrador TEXT PRIMARY KEY,tipo TEXT NOT NULL,etapa INTEGER NOT NULL DEFAULT 0,dados TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'COLETANDO',atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"); return ready; }
const questions = type => type === "BANNER" ? BANNER : DUNGEON;
async function get(actor) { await ensure(); const row = await database.get("SELECT * FROM admin_creation_sessions WHERE administrador=?", [actor]); return row ? { ...row, dados: JSON.parse(row.dados || "{}") } : null; }
async function save(actor, state) { await ensure(); await database.run("INSERT INTO admin_creation_sessions(administrador,tipo,etapa,dados,status,atualizado_em) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(administrador) DO UPDATE SET tipo=excluded.tipo,etapa=excluded.etapa,dados=excluded.dados,status=excluded.status,atualizado_em=CURRENT_TIMESTAMP", [actor, state.tipo, state.etapa, JSON.stringify(state.dados || {}), state.status]); }
async function clear(actor) { await ensure(); await database.run("DELETE FROM admin_creation_sessions WHERE administrador=?", [actor]); }
async function start(actor, tipo) { const state = { tipo, etapa: 0, dados: {}, status: "COLETANDO" }; await save(actor, state); return questions(tipo)[0][1]; }
function normalizeList(value) { return String(value || "").split(/[,;]+/).map(item => item.trim()).filter(Boolean); }
function bannerSheet(data) { return `!criar banner\nNOME DO BANNER: ${data.nome}\nDESCRIÇÃO BREVE: ${data.descricao}\nCONJUNTOS: ${data.conjuntos}\nTÍTULO: ${data.titulo}\nPASSIVAS: ${data.passivas}\nITEM SECRETO: ${data.itemSecreto}\nDATA INICIAL: ${data.inicioEm}\nDATA FINAL: ${data.fimEm}`; }
function validateDungeon(data) { const errors = []; for (const key of ["nome", "tema", "rank", "descricao", "objetivo", "participantes", "xp", "won"]) if (!String(data[key] || "").trim()) errors.push(`${key} é obrigatório.`); if (data.rank && !["E", "D", "C", "B", "A", "S"].includes(String(data.rank).trim().toUpperCase())) errors.push("Rank deve ser E, D, C, B, A ou S."); for (const key of ["participantes", "xp", "won"]) if (data[key] != null && (!Number.isSafeInteger(Number(data[key])) || Number(data[key]) < 0)) errors.push(`${key} deve ser um número inteiro não negativo.`); return errors; }

async function answer(actor, text) {
  const state = await get(actor); if (!state || state.status !== "COLETANDO") return null;
  const value = String(text || "").trim(); if (!value) return { consumed: true, text: "Envie uma resposta para a pergunta atual ou use *!cancelar criação*." };
  const [field] = questions(state.tipo)[state.etapa]; state.dados[field] = value; state.etapa += 1;
  if (state.etapa < questions(state.tipo).length) { await save(actor, state); return { consumed: true, text: questions(state.tipo)[state.etapa][1] }; }
  if (state.tipo === "BANNER") {
    try {
      const inicio = new Date(); const fim = new Date(inicio.getTime() + 30 * 24 * 60 * 60 * 1000);
      state.dados.inicioEm = inicio.toISOString(); state.dados.fimEm = fim.toISOString();
      const banner = await require("../commands/gachaAdm").criarPelaFicha(actor, bannerSheet(state.dados));
      state.status = "AGUARDANDO_IMAGEM"; state.dados.bannerId = banner.id; state.dados.bannerNome = banner.nome; await save(actor, state);
      return { consumed: true, text: `_*「 BANNER VALIDADO 」*_\n\n*${banner.nome}* foi salvo como rascunho. Vigência automática: 30 dias.\n\n_*ÚLTIMA ETAPA — IMAGEM*_\nEnvie agora, neste mesmo chat, apenas a imagem que será exibida na consulta do Banner. Ela será vinculada automaticamente.` };
    } catch (error) { state.etapa = 0; await save(actor, state); return { consumed: true, text: `Não foi possível validar o Banner:\n• ${error.message}\n\nVamos reiniciar a criação. ${questions("BANNER")[0][1]}` }; }
  }
  const errors = validateDungeon(state.dados); if (errors.length) { state.etapa = 0; await save(actor, state); return { consumed: true, text: `A Dungeon possui problemas:\n${errors.map(item => `• ${item}`).join("\n")}\n\nVamos reiniciar. ${questions("DUNGEON")[0][1]}` }; }
  state.status = "AGUARDANDO_IMAGEM"; await save(actor, state); return { consumed: true, text: `_*「 DUNGEON SEMANAL VALIDADA 」*_\n\nEla ficará disponível por *7 dias* a partir da publicação. Agora envie a imagem com a legenda:\n*!anexar imagem dungeon semanal ${state.dados.nome}*` };
}
async function attachImage(actor, tipo, nome, media) { const state = await get(actor); if (!state || state.tipo !== tipo || state.status !== "AGUARDANDO_IMAGEM") throw new Error("Não há uma criação sua aguardando imagem."); if (String(tipo === "BANNER" ? state.dados.bannerNome : state.dados.nome).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() !== String(nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()) throw new Error("O nome não corresponde à criação que aguarda imagem."); if (!media?.data || !/^image\//i.test(media.mimetype || "")) throw new Error("O anexo precisa ser uma imagem válida."); const image = `data:${media.mimetype};base64,${media.data}`; if (tipo === "BANNER") await require("./gachaAdminService").updateBanner(actor, state.dados.bannerId, { imagem: image }); else { const data = { ...state.dados, rank: String(state.dados.rank).toUpperCase(), participantes: Number(state.dados.participantes), xp: Number(state.dados.xp), won: Number(state.dados.won), imagem: image }; await weekly.liberar(actor, data); } await clear(actor); return tipo === "BANNER" ? "Imagem vinculada. O Banner está pronto para consulta e ativação pela ADM." : "Imagem vinculada. A Dungeon semanal foi liberada para consulta por 7 dias."; }
async function publishWithoutImage(actor) {
  const state = await get(actor);
  if (!state || state.status !== "AGUARDANDO_IMAGEM") throw new Error("Não há uma criação aguardando imagem.");
  if (state.tipo === "BANNER") {
    await clear(actor);
    return `Banner *${state.dados.bannerNome}* mantido como rascunho sem imagem. Use a ativação da ADM quando quiser publicá-lo.`;
  }
  const data = { ...state.dados, rank: String(state.dados.rank).toUpperCase(), participantes: Number(state.dados.participantes), xp: Number(state.dados.xp), won: Number(state.dados.won) };
  await weekly.liberar(actor, data);
  await clear(actor);
  return `Dungeon semanal *${state.dados.nome}* liberada sem imagem por 7 dias.`;
}
async function consumeMessage(msg) {
  const actor = msg.author || msg.from;
  const body = String(msg.body || "").trim();
  const state = await get(actor);
  if (!state) return false;
  if (/^!cancelar cria[cç][aã]o$/i.test(body)) {
    await clear(actor);
    await MessageService.send({ message: msg, text: "Criação cancelada." });
    return true;
  }
  // Legendas explícitas precisam passar pelo handler do destino informado.
  // Não vincule uma imagem de Banner à Dungeon que esteja aberta na sessão.
  if (body.startsWith("!")) return false;
  if (state.status === "AGUARDANDO_IMAGEM" && msg.hasMedia) {
    let result;
    try {
      const media = await require("../utils/downloadCreationImage").downloadCreationImage(msg);
      result = await attachImage(actor, state.tipo, state.tipo === "BANNER" ? state.dados.bannerNome : state.dados.nome, media);
    } catch (error) {
      console.error("[CREATION_IMAGE] Falha ao vincular:", { tipo: state.tipo, code: error?.code, message: error?.message });
      await MessageService.send({ message: msg, text: "_*「 IMAGEM NÃO VINCULADA 」*_\n\n_[!] " + error.message });
      return true;
    }
    // O vínculo já foi salvo. Falha na confirmação não desfaz a imagem.
    await MessageService.send({ message: msg, text: "_*「 IMAGEM VINCULADA 」*_\n\n_[+] " + result });
    return true;
  }
  if (state.status === "AGUARDANDO_IMAGEM") {
    await MessageService.send({ message: msg, text: "Envie uma imagem válida neste chat para concluir a criação." });
    return true;
  }
  const result = await answer(actor, body);
  if (result?.consumed) {
    await MessageService.send({ message: msg, text: result.text });
    return true;
  }
  return false;
}
module.exports = { ensure, get, start, answer, attachImage, consumeMessage, clear, normalizeList };
