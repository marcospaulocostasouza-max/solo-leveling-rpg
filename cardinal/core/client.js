"use strict";

const fs = require("fs");
const { carregarConfiguracao } = require("./config");
const { criarLogger } = require("./logger");

class CardinalError extends Error {
    constructor(message, code, cause) { super(message, { cause }); this.name = "CardinalError"; this.code = code; }
}

class CardinalClient {
    constructor(options = {}) {
        this.config = options.config || carregarConfiguracao();
        this.fetch = options.fetch || globalThis.fetch;
        this.logger = options.logger || criarLogger(this.config.log_path);
        this.systemPrompt = options.systemPrompt || fs.readFileSync(this.config.system_prompt_path, "utf8").trim();
        if (typeof this.fetch !== "function") throw new CardinalError("Cliente HTTP indisponível.", "HTTP_UNAVAILABLE");
        this.logger.info("cliente_inicializado", { baseUrl: this.config.base_url, model: this.config.model });
    }

    async requisicao(caminho, opcoes = {}, timeoutMs = this.config.timeout_ms) {
        const controller = new AbortController();
        const timer = Number(timeoutMs) > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;
        const inicio = performance.now();
        try {
            return await this.fetch(`${this.config.base_url}${caminho}`, { ...opcoes, signal: controller.signal });
        } catch (error) {
            const code = error?.name === "AbortError" ? "TIMEOUT" : "MODEL_OFFLINE";
            this.logger.error("falha_conexao", { code, durationMs: Math.round(performance.now() - inicio) });
            throw new CardinalError(code === "TIMEOUT" ? "O modelo Cardinal excedeu o tempo limite." : "O modelo Cardinal está offline ou indisponível.", code, error);
        } finally { if (timer) clearTimeout(timer); }
    }

    async healthCheck() {
        const inicio = performance.now();
        try {
            const resposta = await this.requisicao("/health", { headers: { accept: "application/json" } }, this.config.timeout_ms > 0 ? Math.min(this.config.timeout_ms, 5000) : 5000);
            const corpo = await resposta.json().catch(() => null);
            const ok = resposta.ok && corpo && (corpo.status === "ok" || corpo.status === "no slot available" || corpo.status === "ready");
            this.logger.info(ok ? "modelo_conectado" : "health_invalido", { status: resposta.status, durationMs: Math.round(performance.now() - inicio) });
            return { ok: Boolean(ok), status: resposta.status, data: corpo };
        } catch (error) {
            return { ok: false, status: 0, error: error.message, code: error.code || "HEALTH_FAILED" };
        }
    }

    async chat(mensagem, options = {}) {
        const texto = String(mensagem || "").trim();
        if (!texto) throw new CardinalError("A mensagem não pode estar vazia.", "EMPTY_MESSAGE");
        const inicio = performance.now();
        this.logger.info("inferencia_requisitada", { messageLength: texto.length });
        const payload = {
            model: this.config.model,
            messages: [{ role: "system", content: this.systemPrompt }, ...(options.history || []), { role: "user", content: texto }],
            temperature: options.temperature ?? this.config.temperature,
            max_tokens: options.maxTokens ?? this.config.max_tokens,
            chat_template_kwargs: { enable_thinking: false },
            stream: false
        };
        if (options.responseFormat) payload.response_format = options.responseFormat;
        const resposta = await this.requisicao("/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) }, options.timeoutMs ?? this.config.timeout_ms);
        const corpo = await resposta.json().catch(() => null);
        if (!resposta.ok) {
            this.logger.error("erro_inferencia", { status: resposta.status, durationMs: Math.round(performance.now() - inicio) });
            throw new CardinalError(`Falha de inferência do Cardinal (HTTP ${resposta.status}).`, "INFERENCE_FAILED");
        }
        const conteudo = corpo?.choices?.[0]?.message?.content;
        if (typeof conteudo !== "string" || !conteudo.trim()) {
            this.logger.error("resposta_invalida", { status: resposta.status, durationMs: Math.round(performance.now() - inicio) });
            throw new CardinalError("O modelo Cardinal retornou uma resposta vazia ou inválida.", "INVALID_RESPONSE");
        }
        const durationMs = Math.round(performance.now() - inicio);
        this.logger.info("inferencia_concluida", { durationMs, responseLength: conteudo.trim().length });
        return { text: conteudo.trim(), usage: corpo.usage || null, durationMs, model: corpo.model || this.config.model };
    }
}

module.exports = { CardinalClient, CardinalError };
