"use strict";
const fs = require("fs/promises"); const path = require("path"); const { assertWritable } = require("./protection");
class ControlledEditor {
    constructor(root) { this.root = root; }
    async replace(file, expected, replacement) { const safe = assertWritable(this.root, file), current = await fs.readFile(safe.absolute, "utf8"); const occurrences = current.split(expected).length - 1; if (occurrences !== 1) throw new Error(`Patch exige uma ocorrência exata; encontradas: ${occurrences}.`); await fs.writeFile(safe.absolute, current.replace(expected, replacement), "utf8"); return safe.relative; }
    async create(file, content) { const safe = assertWritable(this.root, file); try { await fs.access(safe.absolute); throw new Error(`Arquivo já existe: ${safe.relative}.`); } catch (e) { if (e.code !== "ENOENT") throw e; } await fs.mkdir(path.dirname(safe.absolute), { recursive: true }); await fs.writeFile(safe.absolute, String(content), "utf8"); return safe.relative; }
    async rename(from, to) { const source = assertWritable(this.root, from), target = assertWritable(this.root, to); await fs.mkdir(path.dirname(target.absolute), { recursive: true }); await fs.rename(source.absolute, target.absolute); return { from: source.relative, to: target.relative }; }
}
module.exports = { ControlledEditor };
