"use strict";

const fs = require("fs");
const path = require("path");

function criarLogger(logPath) {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    function registrar(nivel, evento, dados = {}) {
        const seguros = Object.fromEntries(Object.entries(dados).filter(([chave]) => !/prompt|message|mensagem|content|token|secret|authorization/i.test(chave)));
        const linha = JSON.stringify({ timestamp: new Date().toISOString(), nivel, evento, ...seguros });
        fs.promises.appendFile(logPath, `${linha}\n`, "utf8").catch(error => console.error("[CARDINAL] Falha ao gravar log:", error.message));
        const metodo = nivel === "error" ? "error" : nivel === "warn" ? "warn" : "log";
        console[metodo](`[CARDINAL] ${evento}`, seguros);
    }
    return { info: (evento, dados) => registrar("info", evento, dados), warn: (evento, dados) => registrar("warn", evento, dados), error: (evento, dados) => registrar("error", evento, dados) };
}

module.exports = { criarLogger };
