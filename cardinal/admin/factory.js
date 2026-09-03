"use strict";
const path = require("path");
const { DraftStore } = require("../forge/draft-store");
const { ForgeValidator } = require("../forge/validator");
const { KnowledgeRetriever } = require("../knowledge/retriever");
const { CardinalAdminService } = require("./service");
const { CardinalClient } = require("../core/client"); const { BalanceEngine } = require("../balance");
function createAdminService(options = {}) { const draftStore = options.draftStore || new DraftStore(options.draftPath || path.resolve(__dirname, "../cache/forge-drafts.db")); const retriever = options.retriever || new KnowledgeRetriever(options); const validator = options.validator || new ForgeValidator({ retriever }); const client = options.client === null ? null : options.client || new CardinalClient(options); const balance = options.balance || new BalanceEngine({ database: options.database }); const service = new CardinalAdminService({ ...options, client, knowledge: retriever, draftStore, validator, balance }); service.ready = Promise.all([draftStore.initialize(), balance.ready]); service.close = async () => { await draftStore.close(); if (!options.balance) await balance.close(); }; return service; }
module.exports = { createAdminService };
