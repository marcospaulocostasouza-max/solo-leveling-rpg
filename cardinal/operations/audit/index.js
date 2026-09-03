"use strict";
const fs = require("fs/promises"); const path = require("path");
function redact(value) { if (typeof value === "string") return value.replace(/(authorization|token|password|secret|api[_-]?key|cookie)\s*[:=]\s*([^\s,;]+)/gi, "$1=[REDACTED]").replace(/(?:postgres(?:ql)?|mysql):\/\/[^\s]+/gi, "[REDACTED_CONNECTION]"); if (Array.isArray(value)) return value.map(redact); if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, /token|password|secret|cookie|authorization|credential/i.test(k) ? "[REDACTED]" : redact(v)])); return value; }
class OperationsAudit { constructor(file) { this.file = file; } async record(event) { const row = redact({ timestamp: new Date().toISOString(), ...event }); await fs.mkdir(path.dirname(this.file), { recursive: true }); await fs.appendFile(this.file, JSON.stringify(row) + "\n", "utf8"); return row; } }
module.exports = { OperationsAudit, redact };
