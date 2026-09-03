"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "config", "model.json");

function inteiro(valor, padrao, minimo, maximo, nome) {
    const numero = valor == null || valor === "" ? padrao : Number(valor);
    if (!Number.isSafeInteger(numero) || numero < minimo || numero > maximo) throw new Error(`Configuração inválida para ${nome}.`);
    return numero;
}

function carregarConfiguracao(env = process.env) {
    const arquivo = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    const host = String(env.CARDINAL_HOST || arquivo.host || "127.0.0.1").trim();
    if (!new Set(["127.0.0.1", "localhost", "::1"]).has(host)) throw new Error("CARDINAL_HOST deve apontar somente para a máquina local.");
    const port = inteiro(env.CARDINAL_PORT, arquivo.port, 1, 65535, "port");
    const config = {
        ...arquivo,
        host,
        port,
        context_size: inteiro(env.CARDINAL_CONTEXT_SIZE, arquivo.context_size, 512, 131072, "context_size"),
        gpu_layers: inteiro(env.CARDINAL_GPU_LAYERS, arquivo.gpu_layers, 0, 999, "gpu_layers"),
        timeout_ms: inteiro(env.CARDINAL_TIMEOUT_MS, arquivo.timeout_ms, 1000, 900000, "timeout_ms"),
        max_tokens: inteiro(env.CARDINAL_MAX_TOKENS, arquivo.max_tokens, 1, 8192, "max_tokens"),
        model_path: env.CARDINAL_MODEL_PATH || arquivo.model_path || null
    };
    config.base_url = `http://${host}:${port}`;
    config.system_prompt_path = path.join(ROOT, "prompts", "system.txt");
    config.log_path = path.join(ROOT, "logs", "cardinal.log");
    return Object.freeze(config);
}

module.exports = { ROOT, CONFIG_PATH, carregarConfiguracao };
