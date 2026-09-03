"use strict";

function coded(code, message, details) { return Object.assign(new Error(message), { code, details }); }
function normalizeResult(row = {}) {
    const url = String(row.url || "").trim();
    if (!url) return null;
    return {
        title: String(row.title || "Fonte externa").replace(/\s+/g, " ").trim(),
        url,
        snippet: String(row.content || "").replace(/\s+/g, " ").trim().slice(0, 1600),
        search_score: Number(row.score || 0),
        engines: Array.isArray(row.engines) ? row.engines.map(String) : [],
        category: String(row.category || "general"),
        thumbnail: row.thumbnail ? String(row.thumbnail) : null,
        published_at: row.publishedDate || null
    };
}

class SearxngSearchProvider {
    constructor(options = {}) {
        this.baseUrl = String(options.baseUrl || process.env.CARDINAL_SEARXNG_URL || "http://127.0.0.1:8888").replace(/\/$/, "");
        this.timeout = Number(options.timeout || process.env.CARDINAL_WEB_TIMEOUT_MS || process.env.CARDINAL_WEB_TIMEOUT || 10000);
        this.maxResults = Math.min(Math.max(1, Number(options.maxResults || process.env.CARDINAL_WEB_MAX_RESULTS || 10)), 25);
        this.failures = 0; this.openUntil = 0; this.fetch = options.fetch || fetch;
    }
    async health() {
        if (Date.now() < this.openUntil) return { status: "DEGRADED", provider: "searxng", reason: "Circuit breaker temporariamente aberto." };
        try {
            const result = await this.request("Cardinal health", 1);
            return { status: "ONLINE", provider: "searxng", result_count: result.results.length, unresponsive_engines: result.unresponsive_engines || [] };
        } catch (error) { return { status: "OFFLINE", provider: "searxng", code: error.code, reason: error.message }; }
    }
    async search(query, options = {}) {
        if (!String(query || "").trim()) throw coded("CARDINAL_WEB_QUERY_INVALID", "Consulta externa vazia.");
        if (Date.now() < this.openUntil) throw coded("CARDINAL_WEB_SEARCH_UNAVAILABLE", "SearXNG está temporariamente em modo degradado.");
        const response = await this.request(query, options.maxResults || this.maxResults);
        const results = (Array.isArray(response.results) ? response.results : []).map(normalizeResult).filter(Boolean);
        if (!results.length) throw coded("CARDINAL_WEB_NO_RESULTS", "SearXNG não retornou resultados para esta consulta.", { unresponsive_engines: response.unresponsive_engines || [] });
        this.failures = 0;
        return { provider: "searxng", query, results, warnings: (response.unresponsive_engines || []).map(engine => ({ code: "SEARCH_ENGINE_PARTIAL_FAILURE", engine: String(engine) })) };
    }
    async request(query, maxResults) {
        const url = new URL("/search", `${this.baseUrl}/`);
        if (url.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(url.hostname) || !["", "8888"].includes(url.port)) throw coded("CARDINAL_WEB_PROVIDER_POLICY_BLOCKED", "A URL do provider SearXNG deve ser local em 127.0.0.1:8888.");
        url.searchParams.set("q", String(query)); url.searchParams.set("format", "json"); url.searchParams.set("language", "all");
        const controller = new AbortController(), timer = setTimeout(() => controller.abort(), this.timeout);
        try {
            const response = await this.fetch(url, { signal: controller.signal, headers: { Accept: "application/json", "User-Agent": "CardinalSearxng/1.0" } });
            if (!response.ok) throw coded("CARDINAL_WEB_SEARCH_UNAVAILABLE", `SearXNG retornou HTTP ${response.status}.`);
            const data = await response.json();
            if (!data || !Array.isArray(data.results)) throw coded("CARDINAL_WEB_SEARCH_MALFORMED", "Resposta JSON do SearXNG não possui results.");
            data.results = data.results.slice(0, Math.min(Number(maxResults) || this.maxResults, this.maxResults));
            return data;
        } catch (error) {
            this.failures += 1; if (this.failures >= 3) this.openUntil = Date.now() + 30000;
            if (error.name === "AbortError") throw coded("CARDINAL_WEB_TIMEOUT", "SearXNG excedeu o timeout configurado.");
            throw error.code ? error : coded("CARDINAL_WEB_SEARCH_UNAVAILABLE", error.message);
        } finally { clearTimeout(timer); }
    }
}

module.exports = { SearxngSearchProvider, normalizeResult };
