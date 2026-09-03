"use strict";
const fs = require("fs/promises"); const path = require("path");
class OrchestratorAudit { constructor(file) { this.file = file; } async record(event) { const clean = JSON.parse(JSON.stringify(event, (key, value) => /token|password|secret|cookie|authorization|credential/i.test(key) ? "[REDACTED]" : value)); await fs.mkdir(path.dirname(this.file), { recursive: true }); await fs.appendFile(this.file, JSON.stringify({ timestamp: new Date().toISOString(), ...clean }) + "\n", "utf8"); } }
module.exports = { OrchestratorAudit };
