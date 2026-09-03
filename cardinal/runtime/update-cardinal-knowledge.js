"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const { KnowledgeIndexer } = require("../knowledge");

const rebuild = process.argv.includes("--rebuild");
new KnowledgeIndexer().rebuild({ clear: rebuild }).then(result => {
    console.log(`[CARDINAL] Índice ${rebuild ? "reconstruído" : "atualizado"}:`);
    console.log(JSON.stringify(result, null, 2));
}).catch(error => { console.error("[CARDINAL] Falha ao atualizar conhecimento:", error.message); process.exitCode = 1; });
