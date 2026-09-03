"use strict";
const path = require("path");
function bool(value, fallback) { if (value == null || value === "") return fallback; return /^(1|true|yes|on)$/i.test(value); }
function integer(value, fallback) { const parsed = Number(value); return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback; }
function loadDeveloperConfig(overrides = {}) {
    const root = path.resolve(overrides.root || process.cwd());
    return Object.freeze({ root, enabled: overrides.enabled ?? bool(process.env.CARDINAL_DEVELOPER_ENABLED, false), autoCommit: overrides.autoCommit ?? bool(process.env.CARDINAL_AUTO_COMMIT, false), autoMerge: overrides.autoMerge ?? bool(process.env.CARDINAL_AUTO_MERGE, false), maxFixAttempts: overrides.maxFixAttempts ?? integer(process.env.CARDINAL_MAX_FIX_ATTEMPTS, 3), requireReview: overrides.requireReview ?? bool(process.env.CARDINAL_REQUIRE_REVIEW, true), allowDatabaseMigrations: overrides.allowDatabaseMigrations ?? bool(process.env.CARDINAL_ALLOW_DATABASE_MIGRATIONS, false), worktreeRoot: path.resolve(overrides.worktreeRoot || process.env.CARDINAL_WORKTREE_ROOT || path.join(root, ".cardinal-worktrees")), statePath: path.resolve(overrides.statePath || path.join(root, "cardinal/cache/developer-tasks.json")), auditPath: path.resolve(overrides.auditPath || path.join(root, "cardinal/logs/developer-audit.jsonl")), projectMapPath: path.resolve(overrides.projectMapPath || path.join(root, "cardinal/cache/project-map.json")), maxContextChars: integer(overrides.maxContextChars || process.env.CARDINAL_CODE_CONTEXT_CHARS, 24000) });
}
module.exports = { loadDeveloperConfig };
