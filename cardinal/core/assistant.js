"use strict";

const { CardinalClient } = require("./client");
const { KnowledgeRetriever } = require("../knowledge/retriever");
const { ContextBuilder } = require("../knowledge/context-builder");

function catalogAnswer(query, results) {
    const normalize = text => String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const question = normalize(query);
    if (!/\b(custa|custo|maestria|requisito|requisitos)\b/.test(question)) return null;
    const matches = results.filter(row => row.file === "database:tecnicas" && question.includes(normalize(row.entity)));
    if (matches.length !== 1) return null;
    const row = matches[0];
    const fields = Object.fromEntries(row.content.split("\n").filter(line => /^[a-z_]+:/.test(line)).map(line => { const i = line.indexOf(":"); return [line.slice(0, i), line.slice(i + 1).trim()]; }));
    if (fields.custo_maestria == null || !fields.classe) return null;
    return `**${row.entity}**\nCusto: ${fields.custo_maestria} de Maestria.\n${/proficiencia/i.test(normalize(fields.categoria || "")) ? "Proficiência" : "Classe"}: ${fields.classe}.\n${fields.nivel_desbloqueio ? `Nível mínimo: ${fields.nivel_desbloqueio}.\n` : ""}[FONTE ${row.id}]`;
}

class CardinalAssistant {
    constructor(options = {}) {
        this.client = options.client || new CardinalClient(options);
        this.retriever = options.retriever || new KnowledgeRetriever(options);
        this.contextBuilder = options.contextBuilder || new ContextBuilder(options);
        this.database = options.database || null;
        this.history = []; this.maxHistory = options.maxHistory || 10; this.memory = options.memory || null;
    }
    clearHistory() { this.history = []; }
    async ask(question, options = {}) {
        const query = String(question || "").trim(); if (!query) throw new Error("A pergunta não pode estar vazia.");
        if (/^(?:oi|ola|olá|bom dia|boa tarde|boa noite|ajuda|o que você faz|o que voce faz)[!?.\s]*$/i.test(query)) {
            return { text: "Posso consultar as regras do RPG. No bot, administradores também podem criar e revisar rascunhos e executar ações disponíveis. Exemplos: !cardinal como funciona a Maestria?; !cardinal crie uma espada Rank D; !cardinal dê 100 XP para Nome Completo. Informe o que deseja fazer.", sources: [] };
        }
        if (options.actor) {
            const database = this.database || require("../../packages/database");
            let liveQuestion = query;
            if (/^(?:e\s|isso\b|esse\b|essa\b|explique melhor|continue\b)/i.test(query)) {
                let previous = this.history.filter(row => row.role === "user").at(-1);
                if (!previous && this.memory) previous = (await this.memory.context(options.actor, query, options))?.messages?.filter(row => row.role === "user").at(-1);
                if (previous) liveQuestion = `${previous.content} ${query}`;
            }
            const live = await require("../admin/live-rpg").readRpg(database, options.actor, liveQuestion);
            if (live) {
                this.history.push({ role: "user", content: query }, { role: "assistant", content: live.text });
                this.history = this.history.slice(-this.maxHistory);
                if (this.memory) { await this.memory.converse(options.actor, "user", query, options); await this.memory.converse(options.actor, "assistant", live.text, options); }
                return live;
            }
        }
        let results = await this.retriever.searchKnowledge(query, options.filters || {});
        let memoryContext = null;
        try { if (this.memory && options.actor) memoryContext = await this.memory.context(options.actor, query, options); } catch { memoryContext = { degraded: true, text: "", messages: [] }; }
        if (/^(?:e\s|isso\b|esse\b|essa\b|explique melhor|continue\b)/i.test(query)) {
            const previous = [...(memoryContext?.messages || []), ...this.history].filter(item => item.role === "user").at(-1);
            if (previous) results = await this.retriever.searchKnowledge(`${previous.content} ${query}`, options.filters || {});
        }
        const context = this.contextBuilder.build(results, { memory: memoryContext?.text, draftWorkflow: memoryContext?.session ? `draft=${memoryContext.session.active_draft || "nenhum"}; workflow=${memoryContext.session.active_workflow || "nenhum"}; tarefa=${memoryContext.session.active_task || "nenhuma"}` : "", recentMessages: (memoryContext?.messages || []).map(row => `${row.role}: ${row.content}`).join("\n") });
        const direct = catalogAnswer(query, results);
        if (direct) {
            this.history.push({ role: "user", content: query }, { role: "assistant", content: direct });
            this.history = this.history.slice(-this.maxHistory);
            if (this.memory && options.actor) {
                await this.memory.converse(options.actor, "user", query, options);
                await this.memory.converse(options.actor, "assistant", direct, options);
            }
            return { text: direct, sources: results.filter(row => direct.includes(`[FONTE ${row.id}]`)), context };
        }
        if (!context.results.length) {
            const text = "Não encontrei informação oficial suficiente sobre isso nas fontes atuais do RPG. Informe o nome da técnica, item ou sistema para eu consultar algo mais específico. Se deseja criar conteúdo novo, envie, por exemplo: !cardinal crie uma espada Rank D.";
            this.history.push({ role: "user", content: query }, { role: "assistant", content: text }); this.history = this.history.slice(-this.maxHistory); if (this.memory && options.actor) { await this.memory.converse(options.actor, "user", query, options); await this.memory.converse(options.actor, "assistant", text, options); }
            return { text, sources: [], context };
        }
        const groundedQuestion = `Responda à pergunta usando somente as FONTES OFICIAIS abaixo. Seja direto: use no máximo oito linhas, salvo se o usuário pedir detalhes. Cite [FONTE N] junto das afirmações, sem criar seção bibliográfica ou comentar a qualidade das fontes. Extraia apenas fatos escritos explicitamente: não complete lacunas, não estime valores e não transforme exemplos em regras. Se houver conflito, priorize a fonte marcada como canônica e informe o conflito. Se as fontes não sustentarem uma afirmação, diga que não encontrou essa regra oficial. Diferencie regra oficial de sugestão.\n\nFONTES OFICIAIS\n${context.text}\n\nPERGUNTA\n${query}`;
        const response = await this.client.chat(groundedQuestion, { history: this.history });
        this.history.push({ role: "user", content: query }, { role: "assistant", content: response.text }); this.history = this.history.slice(-this.maxHistory); if (this.memory && options.actor) { await this.memory.converse(options.actor, "user", query, options); await this.memory.converse(options.actor, "assistant", response.text, options); }
        return { ...response, sources: context.results.map(({ id, file, category, system, entity, score }) => ({ id, file, category, system, entity, score })), context };
    }
}

module.exports = { CardinalAssistant, catalogAnswer };
