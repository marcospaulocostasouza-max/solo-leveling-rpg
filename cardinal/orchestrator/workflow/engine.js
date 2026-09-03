"use strict";
class WorkflowEngine {
    constructor(options) { Object.assign(this, options); }
    async run(id) {
        this.assertEnabled(); let workflow = await this.store.get(id);
        if (["COMPLETED", "CANCELLED", "FAILED"].includes(workflow.status)) return workflow;
        const conflicts = await this.store.acquire(id, workflow.affected_systems || []);
        if (conflicts.length) return this.store.update(id, { status: "PAUSED", pause_reason: `Conflito de recurso: ${conflicts.join(", ")}` }, { event: "workflow_paused", conflicts });
        await this.store.update(id, { status: "RUNNING", pause_reason: null }, { event: "workflow_running" }); const started = Date.now();
        try {
            while (Date.now() - started < this.config.maxRunMs) {
                workflow = await this.store.get(id); this.refresh(workflow);
                const waiting = workflow.tasks.find(t => t.status === "READY" && t.type === "approval");
                if (waiting) { waiting.status = "WAITING_APPROVAL"; return this.persist(workflow, { status: "WAITING_FOR_APPROVAL" }, { event: "approval_requested", task_id: waiting.id, stage: waiting.parameters.stage }); }
                const next = workflow.tasks.find(t => t.status === "READY");
                if (!next) {
                    if (workflow.tasks.every(t => ["SUCCESS", "SKIPPED", "ROLLED_BACK"].includes(t.status))) { const done = await this.persist(workflow, { status: "COMPLETED", completed_at: new Date().toISOString() }, { event: "workflow_completed" }); await this.store.release(id); return done; }
                    if (workflow.tasks.some(t => t.status === "FAILED")) { const failed = await this.persist(workflow, { status: "FAILED" }, { event: "workflow_failed" }); await this.store.release(id); return failed; }
                    return this.persist(workflow, { status: "PAUSED", pause_reason: "Dependências bloqueadas." }, { event: "workflow_paused" });
                }
                const outcome = await this.executeTask(workflow, next); if (outcome === "PAUSED") { await this.store.release(id); return this.store.get(id); }
            }
            return this.persist(workflow, { status: "PAUSED", pause_reason: "Limite lógico de execução atingido; use resume." }, { event: "workflow_paused" });
        } catch (error) { await this.store.release(id); throw error; }
    }
    refresh(workflow) { for (const task of workflow.tasks) if (["PENDING", "BLOCKED"].includes(task.status)) { const deps = task.depends_on.map(id => workflow.tasks.find(x => x.id === id)); if (deps.some(x => ["FAILED", "BLOCKED"].includes(x?.status))) task.status = "BLOCKED"; else if (deps.every(x => ["SUCCESS", "SKIPPED"].includes(x?.status))) task.status = "READY"; } }
    async executeTask(workflow, task) {
        task.status = "RUNNING"; task.started_at = new Date().toISOString(); await this.persist(workflow, {}, { event: "task_started", task_id: task.id });
        try {
            await this.authorize(workflow.actor, this.policy.permission(task)); const handler = this.handlers[task.type]; if (!handler) throw Object.assign(new Error("Handler inexistente."), { code: "LOGICAL_ERROR" });
            const output = await handler.execute(task, workflow); task.status = "SUCCESS"; task.output = output; task.completed_at = new Date().toISOString(); workflow.artifacts[task.id] = output; workflow.outputs[task.id] = compact(output); workflow.metrics.tool_calls++; if (task.type === "forge") workflow.metrics.llm_calls++; workflow.metrics.tasks_completed++; await this.persist(workflow, {}, { event: "task_completed", task_id: task.id }); return "SUCCESS";
        } catch (error) {
            task.error = { code: error.code || "ERROR", message: error.message };
            if (this.policy.canRetry(error) && task.retries < this.config.maxTaskRetries) { task.retries++; workflow.metrics.retry_count++; task.status = "READY"; await this.persist(workflow, {}, { event: "task_retry", task_id: task.id, retry: task.retries }); return "RETRY"; }
            if (new Set(["MODEL_OFFLINE", "DATABASE_OFFLINE", "ECONNREFUSED"]).has(error.code)) { task.status = "READY"; await this.persist(workflow, { status: "PAUSED", pause_reason: error.message }, { event: "workflow_paused", task_id: task.id }); return "PAUSED"; }
            task.status = "FAILED"; workflow.errors.push({ task_id: task.id, ...task.error, at: new Date().toISOString(), strategy: this.policy.canRetry(error) ? "PAUSE" : "FAIL" }); await this.persist(workflow, { status: "FAILED" }, { event: "task_failed", task_id: task.id, error: task.error }); return "FAILED";
        }
    }
    async persist(workflow, patch, event) { return this.store.update(workflow.workflow_id, { tasks: workflow.tasks, artifacts: workflow.artifacts, outputs: workflow.outputs, errors: workflow.errors, metrics: workflow.metrics, ...patch }, event); }
    assertEnabled() { if (!this.config.enabled) throw Object.assign(new Error("Cardinal Orchestrator está desabilitado."), { code: "ORCHESTRATOR_DISABLED" }); }
}
function compact(value) { const json = JSON.stringify(value); return json.length <= 4000 ? value : { summary: json.slice(0, 4000), truncated: true }; }
module.exports = { WorkflowEngine, compact };
