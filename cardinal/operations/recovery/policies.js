"use strict";
function createRecoveryPolicies(registry) { return Object.fromEntries(Object.values(registry).map(service => [service.id, { auto_restart: service.autoRestart === true, max_attempts: service.id === "database" ? 0 : 3, verify_after_restart: true }])); }
module.exports = { createRecoveryPolicies };
