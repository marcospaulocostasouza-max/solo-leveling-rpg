"use strict";
const STRATEGIES = Object.freeze({ TIMEOUT: "RETRY", ECONNREFUSED: "RETRY", MODEL_OFFLINE: "PAUSE", DATABASE_OFFLINE: "PAUSE", INVALID_WORKFLOW: "FAIL", LOGICAL_ERROR: "FAIL", PERMISSION_DENIED: "PAUSE" });
function strategyFor(error) { return STRATEGIES[error?.code] || "FAIL"; }
module.exports = { STRATEGIES, strategyFor };
