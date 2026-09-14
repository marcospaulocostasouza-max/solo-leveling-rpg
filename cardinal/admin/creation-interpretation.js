"use strict";
const { parseStructured } = require('../forge/json');
const { AdminError, CODES } = require('./errors');
async function prepareCreation(service, actor, message, type, channelId) {
    await service.rbac.authorize(actor, 'CARDINAL_READ');
    let summary = `Criar um rascunho do tipo ${type} seguindo esta ordem: ${message}`;
    if (service.client) {
        const answer = await service.client.chat(`Interprete a solicitação de criação sem criar o conteúdo. Retorne JSON {"summary":"resumo concreto do que será criado e das características pedidas","missing":null}. Não invente características obrigatórias, valores nem destinos. Se a ordem for ambígua ou contiver tarefas adicionais de alteração/entrega, retorne missing com uma pergunta objetiva; nenhuma tarefa pode ser omitida. Tipo: ${JSON.stringify(type)}. Ordem: ${JSON.stringify(message)}`, { maxTokens: 500, temperature: 0, responseFormat: { type: 'json_object' } });
        const parsed = parseStructured(answer.text);
        if (parsed.missing || typeof parsed.summary !== 'string' || !parsed.summary.trim()) throw new AdminError(CODES.INVALID_INPUT, String(parsed.missing || 'Explique o que deseja criar.'));
        summary = parsed.summary;
    }
    await service.cancelBatch(actor, channelId);
    const operation = { intent: 'interpreted_creation', original_message: message, type, summary, channel_id: channelId || null, ready: false };
    const confirmation = await service.repository.createConfirmation(actor, operation, 15 * 60 * 1000);
    return { operation, ...confirmation };
}
async function consumeCreation(service, actor, id, channelId) {
    await service.rbac.authorize(actor, 'CARDINAL_READ');
    return service.repository.transaction(async query => {
        const row = await query.get('SELECT operation_json FROM cardinal_admin_confirmations WHERE confirmation_id=? AND admin_number=?', [id, actor]);
        const operation = row && JSON.parse(row.operation_json);
        if (!operation || operation.intent !== 'interpreted_creation' || operation.channel_id !== (channelId || null) || !operation.ready) throw new AdminError(CODES.INVALID_INPUT, 'Interpretação indisponível nesta conversa ou ainda não entregue.');
        return service.repository.consumeConfirmationWithQuery(query, id, actor);
    });
}
module.exports = { prepareCreation, consumeCreation };
