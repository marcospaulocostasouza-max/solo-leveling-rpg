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
const GUILD = [["nome","Qual é o *nome da Guilda*?"],["lider","Qual é o *nome exato do jogador líder*?"],["passivas","Quais são as *passivas iniciais*? Responda Nenhuma se não houver."]];
const MISSION = [["jogador","Quem receberá a missão? Envie o *nome exato do jogador* ou responda *Todos* para distribuir a todos com ficha aprovada."],["nome","Qual é o *nome da missão*?"],["tipo","Qual é o *tipo* da missão?"],["rank","Qual é o *Rank*? Use E, D, C, B, A ou S."],["descricao","Envie a *descrição narrativa* da missão."],["objetivo","Qual é o *objetivo* que será avaliado pela ADM?"],["quantidade","Qual é a *quantidade necessária* para concluir o objetivo?"],["xp","Qual é a recompensa de *XP*?"],["won","Qual é a recompensa em *Won*?"],["cristais","Qual é a recompensa em *Cristais*?"],["item","Qual é o *item de recompensa*? Responda Nenhum se não houver."]];
const INSTANCE_DUNGEON = [["nome","Qual é o *nome da nova Dungeon instanciada*?"],["rank","Qual é o *Rank*? Use E, D, C, B, A ou S."],["tema","Qual é o *tema ou ambiente*?"],["elemento","Qual é o *elemento predominante*?"],["entrada","Descreva a *entrada e ambientação inicial* da Dungeon."],["monstro","Qual é o *nome do monstro comum*?"],["monstroDescricao","Descreva esse *monstro comum*."],["boss","Qual é o *nome do Boss*?"],["bossDescricao","Descreva o *Boss*."],["bossHabilidades","Liste as *habilidades do Boss*, separadas por vírgula."],["xp","Qual é a recompensa em *XP*?"],["won","Qual é a recompensa em *Won*?"]];

let ready;
async function ensure() { if (!ready) ready = database.run("CREATE TABLE IF NOT EXISTS admin_creation_sessions (administrador TEXT PRIMARY KEY,tipo TEXT NOT NULL,etapa INTEGER NOT NULL DEFAULT 0,dados TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'COLETANDO',atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"); return ready; }
const questions = type => ({BANNER,DUNGEON,GUILD,MISSION,INSTANCE_DUNGEON}[type] || DUNGEON);
async function get(actor) { await ensure(); const row = await database.get("SELECT * FROM admin_creation_sessions WHERE administrador=?", [actor]); return row ? { ...row, dados: JSON.parse(row.dados || "{}") } : null; }
async function save(actor, state) { await ensure(); await database.run("INSERT INTO admin_creation_sessions(administrador,tipo,etapa,dados,status,atualizado_em) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(administrador) DO UPDATE SET tipo=excluded.tipo,etapa=excluded.etapa,dados=excluded.dados,status=excluded.status,atualizado_em=CURRENT_TIMESTAMP", [actor, state.tipo, state.etapa, JSON.stringify(state.dados || {}), state.status]); }
async function clear(actor) { await ensure(); await database.run("DELETE FROM admin_creation_sessions WHERE administrador=?", [actor]); }
async function start(actor, tipo) { const state = { tipo, etapa: 0, dados: {}, status: "COLETANDO" }; await save(actor, state); return questions(tipo)[0][1]; }
function normalizeList(value) { return String(value || "").split(/[,;]+/).map(item => item.trim()).filter(Boolean); }
function bannerSheet(data) { return `!criar banner\nNOME DO BANNER: ${data.nome}\nDESCRIÇÃO BREVE: ${data.descricao}\nCONJUNTOS: ${data.conjuntos}\nTÍTULO: ${data.titulo}\nPASSIVAS: ${data.passivas}\nITEM SECRETO: ${data.itemSecreto}\nDATA INICIAL: ${data.inicioEm}\nDATA FINAL: ${data.fimEm}`; }
function validateDungeon(data) { const errors = []; for (const key of ["nome", "tema", "rank", "descricao", "objetivo", "participantes", "xp", "won"]) if (!String(data[key] || "").trim()) errors.push(`${key} é obrigatório.`); if (data.rank && !["E", "D", "C", "B", "A", "S"].includes(String(data.rank).trim().toUpperCase())) errors.push("Rank deve ser E, D, C, B, A ou S."); for (const key of ["participantes", "xp", "won"]) if (data[key] != null && (!Number.isSafeInteger(Number(data[key])) || Number(data[key]) < 0)) errors.push(`${key} deve ser um número inteiro não negativo.`); return errors; }

async function answer(actor, text) {
  const state = await get(actor); if (!state) return null;
  if (state.status === "AGUARDANDO_CONFIRMACAO") {
    const value=String(text||"").trim();
    if (/^(nao|n[aã]o|n)$/i.test(value)) { await clear(actor); return {consumed:true,text:"Criação cancelada. Nada foi gravado."}; }
    if (!/^(sim|s)$/i.test(value)) return {consumed:true,text:"Responda *sim* para criar ou *não* para cancelar."};
    const publishers=require("./guidedCreationPublishers");
    const method={GUILD:"guild",MISSION:"mission",INSTANCE_DUNGEON:"instanceDungeon"}[state.tipo];
    try { const response=await publishers[method](state.dados);await clear(actor);return {consumed:true,text:`[+] ${response}`}; }
    catch(error){return {consumed:true,text:`[!] ${error.message}\n\nOs dados foram preservados. Responda *sim* para tentar novamente ou *não* para cancelar.`};}
  }
  if (state.status === "AGUARDANDO_ATIVACAO") {
    const value = String(text || "").trim();
    if (/^(sim|s)$/i.test(value)) {
      if (state.tipo === "BANNER") {
        await require("./gachaAdminService").activateBanner(actor, state.dados.bannerId);
        await clear(actor);
        return { consumed: true, text: `Banner *${state.dados.bannerNome}* ativado automaticamente.` };
      }
      const data = { ...state.dados, rank: String(state.dados.rank).toUpperCase(), participantes: Number(state.dados.participantes), xp: Number(state.dados.xp), won: Number(state.dados.won) };
      await weekly.liberar(actor, data); await clear(actor);
      return { consumed: true, text: `Dungeon semanal *${state.dados.nome}* liberada automaticamente por 7 dias.` };
    }
    if (/^(nao|n[aã]o|n)$/i.test(value)) {
      state.status = "AGUARDANDO_IMAGEM"; await save(actor, state);
      return { consumed: true, text: "Certo. Envie a imagem agora ou use *!continuar sem imagem* para publicar depois." };
    }
    return { consumed: true, text: "Responda *sim* para ativar agora ou *não* para manter como rascunho." };
  }
  if (state.status !== "COLETANDO") return null;
  const value = String(text || "").trim(); if (!value) return { consumed: true, text: "Envie uma resposta para a pergunta atual ou use *!cancelar criação*." };
  const [field] = questions(state.tipo)[state.etapa]; state.dados[field] = value; state.etapa += 1;
  if (state.etapa < questions(state.tipo).length) { await save(actor, state); return { consumed: true, text: questions(state.tipo)[state.etapa][1] }; }
  if (["GUILD","MISSION","INSTANCE_DUNGEON"].includes(state.tipo)) {
    let preview;
    try { preview=await require("./guidedCreationPublishers").preview(state.tipo,state.dados); }
    catch(error){await clear(actor);return {consumed:true,text:`[!] ${error.message}\n\nA criação foi encerrada sem gravar dados. Corrija a informação e inicie novamente.`};}
    state.status="AGUARDANDO_CONFIRMACAO";await save(actor,state);
    const labels={GUILD:"Guilda",MISSION:"Missão",INSTANCE_DUNGEON:"Dungeon instanciada"};
    return {consumed:true,text:`*${labels[state.tipo]} pronta para criação*\n\n${preview}\n\nDeseja criar agora? Responda *sim* ou *não*.`};
  }
  if (state.tipo === "BANNER") {
    try {
      const inicio = new Date(); const fim = new Date(inicio.getTime() + 30 * 24 * 60 * 60 * 1000);
      state.dados.inicioEm = inicio.toISOString(); state.dados.fimEm = fim.toISOString();
      const banner = await require("../commands/gachaAdm").criarPelaFicha(actor, bannerSheet(state.dados));
      state.status = "AGUARDANDO_ATIVACAO"; state.dados.bannerId = banner.id; state.dados.bannerNome = banner.nome; await save(actor, state);
      return { consumed: true, text: `Banner *${banner.nome}* validado. Deseja ativar agora? Responda *sim* ou *não*.` };
    } catch (error) { state.etapa = 0; await save(actor, state); return { consumed: true, text: `Não foi possível validar o Banner:\n• ${error.message}\n\nVamos reiniciar a criação. ${questions("BANNER")[0][1]}` }; }
  }
  const errors = validateDungeon(state.dados); if (errors.length) { state.etapa = 0; await save(actor, state); return { consumed: true, text: `A Dungeon possui problemas:\n${errors.map(item => `• ${item}`).join("\n")}\n\nVamos reiniciar. ${questions("DUNGEON")[0][1]}` }; }
  state.status = "AGUARDANDO_ATIVACAO"; await save(actor, state); return { consumed: true, text: "Dungeon semanal validada. Deseja liberar agora? Responda *sim* ou *não*." };
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
  if (state.status === "AGUARDANDO_IMAGEM" && /^!(?:continuar|publicar|liberar) sem imagem$/i.test(body)) {
    const result = await publishWithoutImage(actor);
    await MessageService.send({ message: msg, text: result });
    return true;
  }
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
module.exports = { ensure, get, start, answer, attachImage, publishWithoutImage, consumeMessage, clear, normalizeList, questions };
