"use strict";

const { spawn } = require("child_process");
const path = require("path");
const root = path.resolve(__dirname, "..");
const isWindows = process.platform === "win32";
const children = [
  // Running the bot through the current Node executable avoids spawning npm.cmd on Windows.
  spawn(process.execPath, ["apps/bot/index.js"], { cwd: root, stdio: "inherit" }),
  // Node 24 can reject a direct .cmd spawn with EINVAL. cmd.exe owns the .cmd invocation.
  isWindows
    ? spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm --prefix apps/site run dev"], { cwd: root, stdio: "inherit" })
    : spawn("npm", ["--prefix", "apps/site", "run", "dev"], { cwd: root, stdio: "inherit" })
];
let closing = false;
function stop(code = 0) { if (closing) return; closing = true; children.forEach(child => child.kill()); process.exit(code); }
process.on("SIGINT", () => stop()); process.on("SIGTERM", () => stop());
children.forEach(child => child.on("exit", code => { if (code && !closing) stop(code); }));
