"use strict";

class DeveloperError extends Error {
    constructor(code, message, details = null) { super(message); this.name = "DeveloperError"; this.code = code; this.details = details; }
}
const CODES = Object.freeze({ DISABLED: "DEVELOPER_DISABLED", INVALID_PATH: "INVALID_PATH", PROTECTED_FILE: "PROTECTED_FILE", INVALID_STATE: "INVALID_STATE", GIT_REQUIRED: "GIT_REQUIRED", MAIN_PROTECTED: "MAIN_PROTECTED", COMMAND_BLOCKED: "COMMAND_BLOCKED", VALIDATION_FAILED: "VALIDATION_FAILED", REVIEW_FAILED: "REVIEW_FAILED", NOT_FOUND: "NOT_FOUND" });
module.exports = { DeveloperError, CODES };
