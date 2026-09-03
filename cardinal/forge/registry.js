"use strict";

const { BaseForge } = require("./base-forge");
const { TYPE_ALIASES } = require("./planner");
const { ForgeError, CODES } = require("./errors");

class ForgeRegistry {
    constructor(options = {}) {
        this.entries = new Map(Object.keys(TYPE_ALIASES).map(type => [type, new BaseForge(type, options)]));
    }
    register(type, forge) { this.entries.set(type, forge); return this; }
    get(type) { const forge = this.entries.get(type); if (!forge) throw new ForgeError(CODES.UNKNOWN_TYPE, `Forge desconhecida: ${type}.`); return forge; }
    types() { return [...this.entries.keys()]; }
}
module.exports = { ForgeRegistry };
