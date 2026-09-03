"use strict";
const { CardinalDeveloperService } = require("./service"); const { Rbac } = require("../admin/rbac"); const { KnowledgeRetriever, KnowledgeIndexer } = require("../knowledge");
function createDeveloperService(options = {}) { const database = options.database || require("../../packages/database"), rbac = options.rbac || new Rbac({ database, ownerNumber: options.ownerNumber }), root = options.root || process.cwd(); return new CardinalDeveloperService({ ...options, root, knowledge: options.knowledge || new KnowledgeRetriever({ projectRoot: root }), reindex: options.reindex || (() => new KnowledgeIndexer({ projectRoot: root }).rebuild()), authorize: options.authorize || ((actor, permission) => rbac.authorize(actor, permission)) }); }
module.exports = { createDeveloperService };
