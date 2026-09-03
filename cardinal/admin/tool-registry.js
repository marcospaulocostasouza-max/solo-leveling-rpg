"use strict";
const { AdminError, CODES } = require("./errors");
class AdminToolRegistry { constructor() { this.tools = new Map(); } register(definition) { if (!definition?.name || typeof definition.execute !== "function") throw new TypeError("Tool inválida."); this.tools.set(definition.name, Object.freeze(definition)); return this; } get(name) { const tool = this.tools.get(name); if (!tool) throw new AdminError(CODES.TOOL_NOT_ALLOWED, `Tool fora da allowlist: ${name}.`); return tool; } list() { return [...this.tools.values()].map(({ execute, ...definition }) => definition); } }
module.exports = { AdminToolRegistry };
