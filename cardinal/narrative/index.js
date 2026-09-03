"use strict";
const path = require("path");
const { NarrativeStore } = require("./store"); const { LoreRetriever } = require("./lore"); const { NarrativeContextBuilder } = require("./context"); const { NarrativeDirector } = require("./director");
function createNarrativeService(options = {}) { const root = options.root || process.cwd(), store = options.store || new NarrativeStore(options.file || path.join(root, "cardinal/cache/narrative.db")), lore = options.lore || new LoreRetriever(options), context = options.context || new NarrativeContextBuilder({ ...options, lore }), director = new NarrativeDirector({ ...options, store, context }); director.ready = store.init(); director.close = () => store.close(); return director; }
module.exports = { ...require("./constants"), ...require("./store"), ...require("./lore"), ...require("./context"), ...require("./validator"), ...require("./director"), createNarrativeService };
