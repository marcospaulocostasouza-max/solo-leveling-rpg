"use strict";

const { spawn } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const isWindows = process.platform === "win32";
const children = [];
let closing = false;

function command(file, args, label) {
  const child = spawn(file, args, { cwd: root, stdio: "inherit", windowsHide: true });
  children.push(child);
  child.on("error", error => {
    console.error(`[${label}] Não foi possível iniciar: ${error.message}`);
    stop(1);
  });
  child.on("exit", code => {
    if (!closing && code !== 0) {
      console.error(`[${label}] encerrou com código ${code}.`);
      stop(code || 1);
    }
  });
  return child;
}

function stop(code = 0) {
  if (closing) return;
  closing = true;
  for (const child of children) if (!child.killed) child.kill();
  process.exit(code);
}

async function searxngStatus() {
  try {
    const response = await fetch("http://127.0.0.1:8888/search?q=cardinal&format=json", { signal: AbortSignal.timeout(3000) });
    console.log(response.ok ? "[SEARXNG] Online em http://127.0.0.1:8888" : `[SEARXNG] Respondeu HTTP ${response.status}; pesquisa externa ficará indisponível.`);
  } catch {
    console.warn("[SEARXNG] Não está online. O bot inicia normalmente, mas Web Research ficará indisponível até o Docker local ser iniciado.");
  }
}

console.log("[START ALL] Iniciando Cardinal, bot e site. Use Ctrl+C para encerrar os processos desta sessão.");
void searxngStatus();
command("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "cardinal/runtime/start-cardinal-model.ps1"], "CARDINAL");
command(process.execPath, ["apps/bot/index.js"], "BOT");
command(isWindows ? (process.env.ComSpec || "cmd.exe") : "npm", isWindows ? ["/d", "/s", "/c", "npm --prefix apps/site run dev"] : ["--prefix", "apps/site", "run", "dev"], "SITE");
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
