"use strict";
const fs = require("fs/promises"); const path = require("path"); const crypto = require("crypto");
const STATES = Object.freeze(["PLANNED", "EDITING", "TESTING", "FAILED", "READY_FOR_REVIEW", "APPROVED", "MERGED", "ROLLED_BACK"]);
const TRANSITIONS = Object.freeze({ PLANNED: ["EDITING", "ROLLED_BACK"], EDITING: ["TESTING", "FAILED", "ROLLED_BACK"], TESTING: ["FAILED", "READY_FOR_REVIEW", "ROLLED_BACK"], FAILED: ["EDITING", "TESTING", "ROLLED_BACK"], READY_FOR_REVIEW: ["TESTING", "APPROVED", "ROLLED_BACK"], APPROVED: ["MERGED", "ROLLED_BACK"], MERGED: ["ROLLED_BACK"], ROLLED_BACK: [] });
class TaskStore {
    constructor(file) { this.file = file; }
    async all() { try { return JSON.parse(await fs.readFile(this.file, "utf8")); } catch (e) { if (e.code === "ENOENT") return []; throw e; } }
    async save(tasks) { await fs.mkdir(path.dirname(this.file), { recursive: true }); await fs.writeFile(this.file, JSON.stringify(tasks, null, 2) + "\n", "utf8"); }
    async create(data) { const tasks = await this.all(), now = new Date().toISOString(); const task = { task_id: data.task_id || crypto.randomUUID(), request: data.request, status: "PLANNED", plan: data.plan, branch: null, worktree: null, files: [], risk: data.plan.risk, tests: [], diff: null, created_at: now, updated_at: now, ...data }; tasks.push(task); await this.save(tasks); return task; }
    async get(id) { const task = (await this.all()).find(row => row.task_id === id); if (!task) { const e = new Error(`Task ${id} não encontrada.`); e.code = "NOT_FOUND"; throw e; } return task; }
    async update(id, patch) { const tasks = await this.all(), index = tasks.findIndex(row => row.task_id === id); if (index < 0) return this.get(id); const current = tasks[index]; if (patch.status && patch.status !== current.status && !(TRANSITIONS[current.status] || []).includes(patch.status)) throw new Error(`Transição inválida: ${current.status} -> ${patch.status}.`); tasks[index] = { ...current, ...patch, updated_at: new Date().toISOString() }; await this.save(tasks); return tasks[index]; }
}
module.exports = { TaskStore, STATES, TRANSITIONS };
