"use strict";
const fs = require("fs/promises"); const { redact } = require("../audit");
async function recentLogs(file, lines = 100) { const limit = Math.min(Math.max(Number(lines) || 100, 1), 300); try { const content = await fs.readFile(file, "utf8"); return redact(content.split(/\r?\n/).slice(-limit).join("\n")).slice(-30000); } catch (e) { return e.code === "ENOENT" ? "" : Promise.reject(e); } }
module.exports = { recentLogs };
