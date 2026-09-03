"use strict";
const path = require("path");
const { DeveloperError, CODES } = require("./errors");
const PROTECTED = Object.freeze([/^\.git(?:\/|$)/i, /^\.env(?:\.|$)/i, /(?:^|\/)(?:credentials?|tokens?|secrets?)(?:[./_-]|$)/i, /\.gguf$/i, /(?:^|\/)backups?(?:\/|$)/i, /(?:^|\/)production(?:[./_-]|$)/i]);
function relativeSafe(root, target) { const absolute = path.resolve(root, target); const relative = path.relative(path.resolve(root), absolute).replace(/\\/g, "/"); if (!relative || relative === "." || relative.startsWith("../") || path.isAbsolute(relative)) throw new DeveloperError(CODES.INVALID_PATH, "O caminho precisa apontar para um arquivo dentro do worktree."); return { absolute, relative }; }
function assertWritable(root, target) { const resolved = relativeSafe(root, target); if (PROTECTED.some(rule => rule.test(resolved.relative))) throw new DeveloperError(CODES.PROTECTED_FILE, `Arquivo protegido: ${resolved.relative}.`); return resolved; }
function scanDiff(diff) { const findings = []; if (/^diff --git a\/(?:\.env|.*\.gguf|\.git\/|backups?\/)/mi.test(diff)) findings.push("arquivo protegido ou binário"); if (/^(?:\+)(?!\+\+\+).*(?:api[_-]?key|token|password|secret)\s*[:=]\s*["'][^"']{8,}/mi.test(diff)) findings.push("possível credencial"); if (/^deleted file mode/m.test(diff)) findings.push("exclusão de arquivo"); if (/\b(?:DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE)\b/i.test(diff)) findings.push("SQL destrutivo"); return findings; }
module.exports = { PROTECTED, relativeSafe, assertWritable, scanDiff };
