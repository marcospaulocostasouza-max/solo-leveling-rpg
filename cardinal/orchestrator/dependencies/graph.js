"use strict";
const TASK_TYPES = new Set(["knowledge", "web", "forge", "approval", "publisher", "admin", "developer", "operations", "verify", "balance", "world", "narrative"]);
const ACTIONS = Object.freeze({ knowledge: new Set(["search_rules"]), web: new Set(["research", "expand"]), forge: new Set(["create_draft"]), approval: new Set(["approve_stage", "critical_confirmation"]), publisher: new Set(["publish_draft"]), admin: new Set(["execute_plan"]), developer: new Set(["plan_change"]), operations: new Set(["deploy_change", "health_check"]), verify: new Set(["verify_artifacts"]), balance: new Set(["quality_gate", "simulate_banner", "simulate_economy", "exploit_scan"]), world: new Set(["overview", "weekly_dungeons", "event", "research_plan"]), narrative: new Set(["generate", "npc_brief", "revise"]) });
function validateWorkflowPlan(plan, limits = {}) {
    const errors = [], ids = new Set(), tasks = plan.tasks || [];
    if (plan.workflow_schema_version !== 1) errors.push("workflow_schema_version deve ser 1");
    if (!Array.isArray(plan.tasks) || !tasks.length) errors.push("tasks ausentes");
    if (tasks.length > (limits.maxTasks || 60)) errors.push("limite de tasks excedido");
    for (const task of tasks) { if (!task.id || ids.has(task.id)) errors.push(`task id inválido/duplicado: ${task.id}`); ids.add(task.id); if (!TASK_TYPES.has(task.type) || !ACTIONS[task.type]?.has(task.action)) errors.push(`tool inexistente: ${task.type}.${task.action}`); if (!Array.isArray(task.depends_on)) errors.push(`depends_on inválido: ${task.id}`); }
    const byId = new Map(tasks.map(x => [x.id, x]));
    for (const task of tasks) { for (const dep of task.depends_on || []) if (!ids.has(dep) || dep === task.id) errors.push(`dependência inválida: ${task.id}->${dep}`); if (task.risk === "CRITICAL" && !(task.depends_on || []).some(id => byId.get(id)?.action === "critical_confirmation")) errors.push(`ação CRITICAL sem confirmação específica: ${task.id}`); }
    const visiting = new Set(), visited = new Set(); function visit(id) { if (visiting.has(id)) return errors.push(`ciclo detectado em ${id}`); if (visited.has(id)) return; visiting.add(id); for (const dep of byId.get(id)?.depends_on || []) visit(dep); visiting.delete(id); visited.add(id); }
    for (const id of ids) visit(id);
    if (errors.length) { const error = new Error(`Workflow inválido: ${errors.join("; ")}`); error.code = "INVALID_WORKFLOW"; error.details = errors; throw error; }
    return plan;
}
module.exports = { TASK_TYPES, ACTIONS, validateWorkflowPlan };
