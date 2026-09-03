"use strict";

const { CardinalClient } = require("./client");
const { KnowledgeRetriever } = require("../knowledge/retriever");
const { ContextBuilder } = require("../knowledge/context-builder");

class CardinalAssistant {
    constructor(options = {}) {
        this.client = options.client || new CardinalClient(options);
        this.retriever = options.retriever || new KnowledgeRetriever(options);
        this.contextBuilder = options.contextBuilder || new ContextBuilder(options);
        this.history = []; this.maxHistory = options.maxHistory || 10; this.memory = options.memory || null;
    }
    clearHistory() { this.history = []; }
    async ask(question, options = {}) {
        const query = String(question || "").trim(); if (!query) throw new Error("A pergunta não pode estar vazia.");
        const results = await this.retriever.searchKnowledge(query, options.filters || {});
        let memoryContext = null;
        try { if (this.memory && options.actor) memoryContext = await this.memory.context(options.actor, query, options); } catch { memoryContext = { degraded: true, text: "", messages: [] }; }
        const context = this.contextBuilder.build(results, { memory: memoryContext?.text, draftWorkflow: memoryContext?.session ? `draft=${memoryContext.session.active_draft || "nenhum"}; workflow=${memoryContext.session.active_workflow || "nenhum"}; tarefa=${memoryContext.session.active_task || "nenhuma"}` : "", recentMessages: (memoryContext?.messages || []).map(row => `${row.role}: ${row.content}`).join("\n") });
        if (!context.results.length) {
            const text = "Não encontrei informação oficial suficiente sobre isso nas fontes atuais do RPG.";
            this.history.push({ role: "user", content: query }, { role: "assistant", content: text }); this.history = this.history.slice(-this.maxHistory); if (this.memory && options.actor) { await this.memory.converse(options.actor, "user", query, options); await this.memory.converse(options.actor, "assistant", text, options); }
            return { text, sources: [], context };
        }
        const groundedQuestion = `Responda à pergunta usando somente as FONTES OFICIAIS abaixo. Seja direto: use no máximo oito linhas, salvo se o usuário pedir detalhes. Cite [FONTE N] junto das afirmações, sem criar seção bibliográfica ou comentar a qualidade das fontes. Extraia apenas fatos escritos explicitamente: não complete lacunas, não estime valores e não transforme exemplos em regras. Se houver conflito, priorize a fonte marcada como canônica e informe o conflito. Se as fontes não sustentarem uma afirmação, diga que não encontrou essa regra oficial. Diferencie regra oficial de sugestão.\n\nFONTES OFICIAIS\n${context.text}\n\nPERGUNTA\n${query}`;
        const response = await this.client.chat(groundedQuestion, { history: this.history });
        this.history.push({ role: "user", content: query }, { role: "assistant", content: response.text }); this.history = this.history.slice(-this.maxHistory); if (this.memory && options.actor) { await this.memory.converse(options.actor, "user", query, options); await this.memory.converse(options.actor, "assistant", response.text, options); }
        return { ...response, sources: context.results.map(({ id, file, category, system, entity, score }) => ({ id, file, category, system, entity, score })), context };
    }
}

module.exports = { CardinalAssistant };
