"use strict";

const { ForgeError, CODES } = require("./errors");
function parseStructured(value) {
    if (value && typeof value === "object") return value;
    let text = String(value || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const start = text.indexOf("{"); const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) text = text.slice(start, end + 1);
    try { return JSON.parse(text); } catch {}
    try { return JSON.parse(text.replace(/,\s*([}\]])/g, "$1")); }
    catch (error) { throw new ForgeError(CODES.INVALID_OUTPUT, "O modelo não retornou JSON estruturado válido.", { cause: error.message }); }
}
module.exports = { parseStructured };
