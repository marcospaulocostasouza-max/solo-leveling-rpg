"use strict";

const { templates } = require("../../../../cardinal/presentation");

const FRIENDLY = Object.freeze({
  MODEL_OFFLINE: { title: "MODELO INDISPONÍVEL", status: "TENTE NOVAMENTE", summary: "Não consegui conectar ao modelo local do Cardinal.", next: "Consulte !cardinal status para verificar o serviço. Sua ordem não foi executada." },
  TIMEOUT: { title: "RESPOSTA DEMOROU DEMAIS", status: "TENTE NOVAMENTE", summary: "O modelo excedeu o tempo de resposta.", next: "Tente um pedido por vez. Nenhuma execução administrativa foi confirmada por esta resposta." },
  INVALID_RESPONSE: { title: "RESPOSTA INVÁLIDA DO MODELO", status: "TENTE NOVAMENTE", summary: "O modelo não retornou uma resposta utilizável.", next: "Envie o pedido novamente. Para premiar, pode usar: !cardinal dê 100 XP para Nome Completo." },
  CARDINAL_PERMISSION_DENIED: { title: "ACESSO RESTRITO", status: "PERMISSÃO NECESSÁRIA", summary: "Sua conta não possui a permissão necessária para esta ordem.", next: "Use uma conta ADM com o cargo adequado ou peça ao responsável para revisar suas permissões." },
  CARDINAL_ENTITY_NOT_FOUND: { title: "NÃO ENCONTRADO", status: "DADO AUSENTE", summary: "O jogador, item ou registro citado não foi encontrado.", next: "Confira o nome completo e tente novamente." },
  CARDINAL_AMBIGUOUS_TARGET: { title: "NOME AMBÍGUO", status: "AÇÃO PAUSADA", summary: "Há mais de um registro compatível com o nome informado.", next: "Informe o nome completo do jogador ou da entidade." },
  CARDINAL_INVALID_INPUT: { title: "ORDEM INCOMPLETA", status: "DADO NECESSÁRIO", summary: "A ordem não contém todos os dados necessários para ser executada.", next: "Informe o alvo e os valores pedidos, então envie novamente." },
  CARDINAL_INVALID_AMOUNT: { title: "VALOR INVÁLIDO", status: "AÇÃO NÃO EXECUTADA", summary: "O valor informado não é permitido para esta operação.", next: "Use um número inteiro positivo dentro dos limites do sistema." },
  CARDINAL_CONFIRMATION_REQUIRED: { title: "CONFIRMAÇÃO NECESSÁRIA", status: "AGUARDANDO ADM", summary: "Esta ordem pode alterar dados importantes e precisa de confirmação.", next: "Use o identificador de confirmação informado pelo Cardinal." },
  CARDINAL_TOOL_NOT_ALLOWED: { title: "ORDEM NÃO RECONHECIDA", status: "AÇÃO BLOQUEADA", summary: "O Cardinal não encontrou uma ação segura correspondente ao pedido.", next: "Reformule a ordem com objetivo, alvo e resultado esperado." },
  CARDINAL_WEB_DISABLED: { title: "PESQUISA EXTERNA DESATIVADA", status: "WEB OFFLINE", summary: "A pesquisa externa está desativada neste bot.", next: "Ative CARDINAL_WEB_ENABLED=true no .env e reinicie o bot." },
  CARDINAL_WEB_SEARCH_UNAVAILABLE: { title: "PESQUISA INDISPONÍVEL", status: "SEARXNG OFFLINE", summary: "O Cardinal não conseguiu consultar o SearXNG local.", next: "Verifique se o SearXNG está ativo em http://127.0.0.1:8888 e tente novamente." },
  CARDINAL_WEB_TIMEOUT: { title: "PESQUISA DEMOROU DEMAIS", status: "TEMPO ESGOTADO", summary: "A fonte externa não respondeu dentro do limite seguro.", next: "Tente novamente em alguns instantes ou use uma consulta mais específica." },
  MODEL_OFFLINE: { title: "MODELO LOCAL OFFLINE", status: "CARDINAL PAUSADO", summary: "O Qwen local não está respondendo no momento.", next: "Inicie o runtime com npm run start:all e tente novamente." },
  BALANCE_BLOCKED: { title: "BALANCE BLOQUEOU O DRAFT", status: "REVISÃO NECESSÁRIA", summary: "O conteúdo gerado possui um risco crítico de balanceamento.", next: "Revise o draft e ajuste os campos indicados antes de aprovar." },
  DRAFT_NOT_FOUND: { title: "NENHUM DRAFT PARA APROVAR", status: "AGUARDANDO CRIAÇÃO", summary: "Não existe um rascunho válido criado por esta conta de ADM aguardando aprovação.", next: "Crie e revise um conteúdo primeiro; depois envie .#Cardinal e Aprovado em linhas separadas." },
  DRAFT_NOT_APPROVABLE: { title: "DRAFT NÃO PODE SER APROVADO", status: "REVISÃO NECESSÁRIA", summary: "O rascunho informado não está mais aguardando aprovação.", next: "Consulte ou crie um draft VALID e revise a ficha antes de tentar novamente." }
});

function cardinalError(error, module = "CARDINAL") {
  const code = error?.code || "CARDINAL_ADMIN_ERROR";
  const friendly = FRIENDLY[code] || { title: "ORDEM NÃO CONCLUÍDA", status: "REVISAR PEDIDO", summary: "O Cardinal não conseguiu concluir esta ordem com segurança.", next: "Confira a ordem, o alvo e as permissões. Se persistir, consulte o status do Cardinal." };
  const details = error?.details;
  const problems = Array.isArray(details?.errors) ? details.errors : Array.isArray(details?.issues) ? details.issues : [];
  const lines = [friendly.next];
  if (code === "CARDINAL_CONFIRMATION_REQUIRED" && /^confirm_[a-z0-9-]+$/i.test(details?.confirmation_id || "")) {
    lines.unshift(`Para confirmar: !cardinal confirmar ${details.confirmation_id}`);
  }
  if (error?.message && error.message !== friendly.summary) lines.unshift(`Motivo: ${error.message}`);
  for (const problem of problems.slice(0, 8)) lines.push(`• ${problem.field ? `${problem.field}: ` : ""}${problem.message || problem}`);
  if (details?.matches?.length) lines.push(`Correspondências: ${details.matches.map(item => item.nome || item.name || item.id).join(", ")}.`);
  return templates.error({ module, title: friendly.title, status: friendly.status, summary: friendly.summary, sections: [{ title: problems.length ? "Problemas encontrados" : "Próximo passo", fields: [], lines }], meta: { code: code.replace(/^CARDINAL_/, "") } });
}

module.exports = { cardinalError, FRIENDLY };
