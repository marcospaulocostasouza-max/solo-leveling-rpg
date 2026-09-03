"use strict";

const SAFE_PERMISSIONS = Object.freeze(["READ", "FORGE_GENERATE", "FORGE_VALIDATE", "FORGE_EDIT_DRAFT"]);
const DENIED_PERMISSIONS = Object.freeze(["ADMIN_PLAYER_WRITE", "ECONOMY_WRITE", "DATABASE_WRITE", "CODE_WRITE", "DEPLOY"]);

class ForgeAuthorization {
    constructor(grants = SAFE_PERMISSIONS) { this.grants = new Set(grants.filter(value => SAFE_PERMISSIONS.includes(value))); }
    can(permission) { return this.grants.has(permission); }
    assert(permission) {
        if (!this.can(permission)) { const { ForgeError, CODES } = require("./errors"); throw new ForgeError(CODES.PERMISSION_DENIED, `Permissão ausente: ${permission}.`); }
    }
}

module.exports = { SAFE_PERMISSIONS, DENIED_PERMISSIONS, ForgeAuthorization };
